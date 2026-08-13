'use client';

import { useCallback, useEffect, useState } from 'react';
import { meetingsApi } from '@/lib/api-client';
import type { Meeting } from '@/lib/types';
import { useToast } from '@/components/shared/Toast';
import NewMeetingModal from '@/components/library/NewMeetingModal';
import {
  FileText,
  Phone,
  Hash,
  Plus,
  SlidersHorizontal,
  Search,
  Flame,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function MeetingsPage() {
  const { error } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  // Local search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Left menu tab state: 'my-meetings' | 'all-meetings' | 'voice-agent'
  const [subTab, setSubTab] = useState<'my-meetings' | 'all-meetings' | 'voice-agent'>('my-meetings');

  // Top filter buttons: 'all' (hosted) | 'shared'
  const [filterType, setFilterType] = useState<'all' | 'shared'>('all');

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await meetingsApi.list({ sort: 'recent' });
      setMeetings(data);
    } catch (err: any) {
      error(err.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  function handleCreated(meeting: Meeting) {
    setMeetings((prev) => [meeting, ...prev]);
    setShowNewModal(false);
  }

  // Filter meetings based on tabs, filters, and local search
  const filteredMeetings = meetings.filter((meeting) => {
    // 1. Left sub sidebar filter
    if (subTab === 'voice-agent') return false; // Force empty state for voice agent demo

    // 2. Top filter buttons
    if (filterType === 'shared') return false; // Force empty state for shared meetings demo

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = meeting.title.toLowerCase().includes(q);
      const matchParticipant = meeting.participants.some(p => p.name.toLowerCase().includes(q));
      return matchTitle || matchParticipant;
    }

    return true;
  });

  const showEmptyState = !loading && filteredMeetings.length === 0;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Left Sub-sidebar */}
      <div className="w-[240px] border-r border-gray-200 bg-white flex flex-col p-4 shrink-0 h-full">
        {/* Search channels input */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search channels"
            className="input pl-9 py-1.5 text-xs bg-gray-50 border-gray-200"
          />
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <button
            onClick={() => setSubTab('my-meetings')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-left font-medium transition-colors ${subTab === 'my-meetings'
                ? 'bg-violet-50 text-violet-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Hash size={16} className={subTab === 'my-meetings' ? 'text-violet-600' : 'text-gray-400'} />
            My Meetings
          </button>
          <button
            onClick={() => setSubTab('all-meetings')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-left font-medium transition-colors ${subTab === 'all-meetings'
                ? 'bg-violet-50 text-violet-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <FileText size={16} className={subTab === 'all-meetings' ? 'text-violet-600' : 'text-gray-400'} />
            All Meetings
          </button>
          <button
            onClick={() => setSubTab('voice-agent')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-left font-medium transition-colors ${subTab === 'voice-agent'
                ? 'bg-violet-50 text-violet-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Phone size={16} className={subTab === 'voice-agent' ? 'text-violet-600' : 'text-gray-400'} />
            Voice Agent Meetings
          </button>
        </div>

        {/* All channels section */}
        <div className="mt-8 border-t border-gray-100 pt-6 flex-1 flex flex-col min-h-0">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 block">All channels</span>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 overflow-hidden">
            <span className="text-pink-400 text-3xl font-light mb-1">#</span>
            <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-[150px]">
              Create channels to organize your conversations
            </p>
            <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm">
              <Plus size={12} />
              Channel
            </button>
          </div>
        </div>
      </div>

      {/* Right Main Content */}
      <div className="flex-1 bg-[#f8f9fb] flex flex-col min-w-0 h-full">
        {/* Top filter bar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === 'all'
                    ? 'bg-white text-gray-800 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                Hosted by me
              </button>
              <button
                onClick={() => setFilterType('shared')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === 'shared'
                    ? 'bg-white text-gray-800 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                Shared with me
              </button>
            </div>

            {/* Filters dropdown */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-600 transition-colors shadow-sm">
              <SlidersHorizontal size={12} />
              Filters
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Local search bar toggled */}
            {searchOpen && (
              <div className="relative animate-fadeIn">
                <input
                  type="text"
                  placeholder="Filter active list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input py-1 px-3 text-xs w-48 bg-gray-50 border-gray-200"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Search icon button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-2 border border-gray-200 rounded-lg transition-colors shrink-0 shadow-sm ${searchOpen ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-white hover:bg-gray-50 text-gray-500'
                }`}
            >
              <Search size={14} />
            </button>
          </div>
        </div>

        {/* Content list or empty state */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-violet-600" size={32} />
            </div>
          )}

          {showEmptyState && (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm h-full max-h-[500px]">
              {/* Card skeletons block */}
              <div className="w-full max-w-sm space-y-3 mb-8 opacity-90 px-6">
                {/* Card Skeleton 1 */}
                <div className="border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-semibold text-gray-400 border border-gray-100 shrink-0">
                    K
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-28 bg-gray-100 rounded-full" />
                    <div className="h-2 w-16 bg-gray-50 rounded-full" />
                  </div>
                </div>
                {/* Card Skeleton 2 */}
                <div className="border border-violet-100/70 rounded-xl p-3.5 flex items-center gap-3 bg-white shadow-lg shadow-violet-100/10 scale-[1.04]">
                  <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-xs font-semibold text-violet-500 border border-violet-100 shrink-0">
                    A
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-36 bg-gray-100 rounded-full" />
                    <div className="h-2 w-20 bg-gray-50 rounded-full" />
                  </div>
                </div>
                {/* Card Skeleton 3 */}
                <div className="border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-semibold text-gray-400 border border-gray-100 shrink-0">
                    R
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-24 bg-gray-100 rounded-full" />
                    <div className="h-2 w-14 bg-gray-50 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Info text */}
              <div className="text-center space-y-2 max-w-sm mb-6 px-6">
                <h3 className="text-base font-bold text-gray-900">Looks like you haven't recorded a meeting yet</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Once you record your first meeting with Fireflies, it'll show up right here.
                </p>
              </div>

              {/* Capture button */}
              <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-1 px-5 py-2.5">
                <Plus size={14} />
                Capture
              </button>
            </div>
          )}

          {!loading && !showEmptyState && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
              {filteredMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-4 hover:bg-violet-50/20 transition-colors group">
                  <Link href={`/meetings/${meeting.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <Flame size={16} className="text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-800 group-hover:text-violet-700 transition-colors truncate">
                        {meeting.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{format(new Date(meeting.date), 'EEE, MMM d, yyyy · h:mm a')}</span>
                        <span>·</span>
                        <span>{Math.floor(meeting.duration_seconds / 60)} min</span>
                        {meeting.participants.length > 0 && (
                          <>
                            <span>·</span>
                            <span>{meeting.participants.length} people</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                  <Link href={`/meetings/${meeting.id}`} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 shadow-sm shrink-0">
                    View details
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New meeting modal */}
      <NewMeetingModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
