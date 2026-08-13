'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Download,
  Users,
  Clock,
  Calendar,
  ChevronDown,
  Loader2,
  Sparkles,
  Copy,
  Maximize2,
  Video,
  Bot,
  MoreHorizontal,
  RefreshCw,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { meetingsApi, transcriptApi, participantsApi, exportApi, summaryApi } from '@/lib/api-client';
import type { ActionItem, Meeting, Participant, Summary, TranscriptSegment } from '@/lib/types';
import MediaPlayer, { type MediaPlayerHandle } from '@/components/detail/MediaPlayer';
import TranscriptPanel from '@/components/detail/TranscriptPanel';
import SummaryPanel from '@/components/detail/SummaryPanel';
import KeyTopicsList from '@/components/detail/KeyTopicsList';
import ActionItemsChecklist from '@/components/detail/ActionItemsChecklist';
import EditMeetingModal from '@/components/detail/EditMeetingModal';
import DeleteConfirmModal from '@/components/detail/DeleteConfirmModal';
import { useToast } from '@/components/shared/Toast';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function renderSummaryText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-xs font-semibold text-gray-800 mt-4 mb-2 first:mt-0 uppercase tracking-wider">
          {line.replace('### ', '')}
        </h4>
      );
    }
    if (line.startsWith('• ')) {
      return (
        <li key={idx} className="text-xs text-gray-600 ml-4 list-disc mb-1 leading-relaxed">
          {line.replace('• ', '')}
        </li>
      );
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-1" />;
    }
    return (
      <p key={idx} className="text-xs text-gray-600 leading-relaxed mb-2">
        {line}
      </p>
    );
  });
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
];

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Player ref for imperative seek
  const playerRef = useRef<MediaPlayerHandle | null>(null);

  // Right panel tab selection: 'transcript' | 'askfred'
  const [activeRightTab, setActiveRightTab] = useState<'transcript' | 'askfred'>('transcript');
  
  // AskFred chat states
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Summary generation states
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Generate summary function handler
  async function handleGenerateSummary() {
    if (!meeting) return;
    setGeneratingSummary(true);
    try {
      const newSummary = await summaryApi.generate(meeting.id);
      setMeeting({ ...meeting, summary: newSummary });
      success('AI Summary generated successfully!');
    } catch (err: any) {
      showError(err.message || 'Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  }

  // Ask Fred chat form handler
  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting || !question.trim()) return;
    const q = question.trim();
    setQuestion('');
    setChatLoading(true);
    
    // Add optimistic user query
    setChatHistory(prev => [...prev, { q, a: '' }]);

    try {
      const res = await summaryApi.chat(meeting.id, { question: q });
      setChatHistory(prev => {
        const next = [...prev];
        if (next.length > 0) {
          next[next.length - 1].a = res.answer;
        }
        return next;
      });
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      showError(err.message || 'Failed to chat with Fred');
      setChatHistory(prev => prev.slice(0, -1)); // Remove failed query bubble
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [m, segs, parts] = await Promise.all([
          meetingsApi.get(parseInt(id)),
          transcriptApi.get(parseInt(id)),
          participantsApi.list(),
        ]);
        setMeeting(m);
        setSegments(segs);
        setParticipants(parts);
      } catch (err: any) {
        showError(err.message || 'Failed to load meeting');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSeek = useCallback((startTime: number) => {
    playerRef.current?.seek(startTime);
    setCurrentTime(startTime);
  }, []);

  const handleTimeUpdate = useCallback((t: number) => {
    setCurrentTime(t);
  }, []);

  async function handleDelete() {
    if (!meeting) return;
    await meetingsApi.delete(meeting.id);
    success('Meeting deleted');
    router.push('/');
  }

  async function handleExport(format: 'pdf' | 'md' | 'txt') {
    if (!meeting) return;
    setExporting(true);
    setExportOpen(false);
    try {
      const blob = await exportApi.export(meeting.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meeting.title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      success(`Exported as .${format}`);
    } catch (err: any) {
      showError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  function updateActionItems(items: ActionItem[]) {
    setMeeting((m) => (m ? { ...m, action_items: items } : m));
  }

  function updateSummary(newSummary: Summary) {
    setMeeting((m) => (m ? { ...m, summary: newSummary } : m));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-violet-500 spinner" />
          <p className="text-gray-500 text-sm">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-400">Meeting not found</p>
        <Link href="/" className="btn-secondary">
          <ArrowLeft size={16} />
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#f8f9fb] overflow-hidden pb-16 relative select-none">
      {/* Top Breadcrumb & Action Row */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Link href="/meetings" className="text-gray-400 hover:text-gray-600 transition-colors">
            #All Meetings
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 truncate max-w-[320px]">{meeting.title}</span>
          <button className="text-gray-400 hover:text-gray-600 ml-1">
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative">
            <button
              id="export-btn"
              onClick={() => setExportOpen((v) => !v)}
              disabled={exporting}
              className="btn-secondary text-xs"
            >
              {exporting ? <Loader2 size={13} className="spinner" /> : <Download size={13} />}
              Export
              <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden min-w-[140px]">
                {(['md', 'txt', 'pdf'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <span className="badge bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 uppercase">
                      {fmt}
                    </span>
                    {fmt === 'md' ? 'Markdown' : fmt === 'txt' ? 'Plain Text' : 'PDF'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            id="edit-meeting-btn"
            onClick={() => setEditOpen(true)}
            className="btn-secondary text-xs"
          >
            <Edit2 size={13} />
            Edit
          </button>
          <button
            id="delete-meeting-btn"
            onClick={() => setDeleteOpen(true)}
            className="btn-danger text-xs"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Split Panel Content Area */}
      <div className="flex-1 flex overflow-hidden bg-white">
        {/* Left Column: Notes & AI Summary */}
        <div className="w-[58%] border-r border-gray-200 flex flex-col h-full bg-white">
          {/* Tab bar header */}
          <div className="px-6 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                Notes
              </button>
              <button className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-400 hover:text-gray-600">
                AI Skills · 0
              </button>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <Maximize2 size={14} className="rotate-45" />
            </button>
          </div>

          {/* Notes Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Title details */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{meeting.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center text-[8px] font-bold text-violet-600">F</span>
                    Fred Fireflies
                  </span>
                  <span>·</span>
                  <span>{format(new Date(meeting.date), 'MMM dd yyyy, h:mm a')}</span>
                  <span>·</span>
                  <span>English (Global)</span>
                </div>
              </div>
              <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm">
                <Video size={14} />
                Video
              </button>
            </div>

            {/* General Summary */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Sparkles size={15} className="text-violet-600" />
                  General Summary
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="text-gray-400 hover:text-violet-600 transition-colors flex items-center gap-1.5 text-xs font-semibold mr-1"
                    title="Generate AI Summary"
                  >
                    {generatingSummary ? (
                      <Loader2 size={13} className="spinner" />
                    ) : (
                      <RefreshCw size={13} />
                    )}
                    <span>{generatingSummary ? 'Summarizing...' : 'Summarize'}</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (meeting.summary) {
                        navigator.clipboard.writeText(meeting.summary.overview_text);
                        success('Summary copied to clipboard!');
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors" 
                    title="Copy summary"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {meeting.summary ? (
                  <div className="space-y-1 select-text">{renderSummaryText(meeting.summary.overview_text)}</div>
                ) : (
                  <p className="text-sm text-gray-400">No summary generated yet.</p>
                )}
              </div>
            </div>

            {/* Key Topics & Action Items Checklist */}
            <div className="border-t border-gray-100 pt-6 space-y-6">
              <KeyTopicsList topics={meeting.key_topics} />
              <ActionItemsChecklist
                meetingId={meeting.id}
                actionItems={meeting.action_items}
                participants={participants}
                onUpdated={updateActionItems}
              />
            </div>
          </div>
        </div>

        {/* Right Column: AskFred / Transcript */}
        <div className="w-[42%] flex flex-col h-full bg-white">
          {/* Header tabs */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveRightTab('askfred')}
                className={`px-1 py-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                  activeRightTab === 'askfred'
                    ? 'text-violet-600 border-violet-600 font-bold'
                    : 'text-gray-400 hover:text-gray-600 border-transparent'
                }`}
              >
                <Bot size={14} />
                AskFred
              </button>
              <button 
                onClick={() => setActiveRightTab('transcript')}
                className={`px-1 py-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                  activeRightTab === 'transcript'
                    ? 'text-violet-600 border-violet-600 font-bold'
                    : 'text-gray-400 hover:text-gray-600 border-transparent'
                }`}
              >
                Transcript
              </button>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <Maximize2 size={14} className="rotate-45" />
            </button>
          </div>

          {/* Right tab content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeRightTab === 'transcript' ? (
              <TranscriptPanel
                segments={segments}
                currentTime={currentTime}
                onSegmentClick={handleSeek}
              />
            ) : (
              <div className="flex-1 flex flex-col h-full bg-[#fcfcfd]">
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Welcome Message */}
                  <div className="flex gap-2 items-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm max-w-[85%]">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Hi, I&apos;m Fred! Ask me anything about the topics discussed in this meeting.
                      </p>
                    </div>
                  </div>

                  {chatHistory.map((item, idx) => (
                    <div key={idx} className="space-y-4 animate-fadeIn">
                      {/* User question */}
                      <div className="flex justify-end">
                        <div className="bg-violet-100 border border-violet-200 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%]">
                          <p className="text-xs text-violet-800 font-medium">{item.q}</p>
                        </div>
                      </div>

                      {/* Fred answer */}
                      <div className="flex gap-2 items-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                          <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm max-w-[85%] min-w-[60px]">
                          {item.a ? (
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line select-text">{item.a}</p>
                          ) : (
                            <div className="flex gap-1 py-1.5">
                              {[0, 1, 2].map((i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Form Input */}
                <form onSubmit={handleChat} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask Fred a question..."
                    className="input text-xs py-2 pr-10 border-gray-200"
                    disabled={chatLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={chatLoading || !question.trim()}
                    className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:bg-gray-100 disabled:text-gray-300 transition-colors shrink-0 shadow-sm shadow-violet-500/20"
                  >
                    {chatLoading ? (
                      <Loader2 size={14} className="spinner" />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Docked bottom Audio Player */}
      <MediaPlayer
        ref={playerRef}
        src={meeting.media_url}
        onTimeUpdate={handleTimeUpdate}
        duration={meeting.duration_seconds}
      />

      {/* Modals */}
      <EditMeetingModal
        open={editOpen}
        meeting={meeting}
        participants={participants}
        onClose={() => setEditOpen(false)}
        onUpdated={(updated) => {
          setMeeting(updated);
          setEditOpen(false);
        }}
      />
      <DeleteConfirmModal
        open={deleteOpen}
        meetingTitle={meeting.title}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
