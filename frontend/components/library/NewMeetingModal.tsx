'use client';

import { useState, useEffect } from 'react';
import { X, Upload, FileText, Calendar, Clock, Users, Plus, Loader2, Link as LinkIcon } from 'lucide-react';
import { meetingsApi, transcriptApi, participantsApi } from '@/lib/api-client';
import type { Meeting, Participant } from '@/lib/types';
import { useToast } from '../shared/Toast';

interface NewMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (meeting: Meeting) => void;
}

type Tab = 'manual' | 'paste' | 'upload';

export default function NewMeetingModal({ open, onClose, onCreated }: NewMeetingModalProps) {
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>('manual');
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState('60');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);
  const [pastedTranscript, setPastedTranscript] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      participantsApi.list().then(setParticipants).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  function resetForm() {
    setTitle('');
    setDate(new Date().toISOString().slice(0, 16));
    setDuration('60');
    setMediaUrl('');
    setSelectedParticipantIds([]);
    setPastedTranscript('');
    setUploadFile(null);
    setTab('manual');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function toggleParticipant(id: number) {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const meeting = await meetingsApi.create({
        title: title.trim(),
        date: new Date(date).toISOString(),
        duration_seconds: parseInt(duration) * 60,
        media_url: mediaUrl || null,
        participant_ids: selectedParticipantIds,
      });

      // Upload transcript if provided
      if (tab === 'upload' && uploadFile) {
        await transcriptApi.upload(meeting.id, uploadFile);
      } else if (tab === 'paste' && pastedTranscript.trim()) {
        const blob = new Blob([pastedTranscript], { type: 'text/plain' });
        const file = new File([blob], 'transcript.txt');
        await transcriptApi.upload(meeting.id, file);
      }

      // Re-fetch to get updated meeting
      const updated = await meetingsApi.get(meeting.id);
      success('Meeting created successfully!');
      resetForm();
      onCreated(updated);
    } catch (err: any) {
      error(err.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'manual', label: 'Manual', icon: <FileText size={14} /> },
    { key: 'paste', label: 'Paste Transcript', icon: <FileText size={14} /> },
    { key: 'upload', label: 'Upload File', icon: <Upload size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Meeting</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="label" htmlFor="new-meeting-title">Meeting Title *</label>
            <input
              id="new-meeting-title"
              type="text"
              className="input"
              placeholder="e.g. Q3 Product Roadmap Planning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Date + Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="new-meeting-date">Date & Time</label>
              <input
                id="new-meeting-date"
                type="datetime-local"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="new-meeting-duration">Duration (minutes)</label>
              <input
                id="new-meeting-duration"
                type="number"
                className="input"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Media URL */}
          <div>
            <label className="label" htmlFor="new-meeting-url">Media URL (optional)</label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="new-meeting-url"
                type="url"
                className="input pl-8"
                placeholder="https://..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div>
              <label className="label">Participants</label>
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParticipant(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedParticipantIds.includes(p.id)
                        ? 'bg-violet-100 border-violet-300 text-violet-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab-specific content */}
          {tab === 'paste' && (
            <div>
              <label className="label" htmlFor="paste-transcript">Paste Transcript</label>
              <textarea
                id="paste-transcript"
                className="input h-32 resize-none font-mono text-xs"
                placeholder="Paste your transcript text here. Each paragraph will become a segment..."
                value={pastedTranscript}
                onChange={(e) => setPastedTranscript(e.target.value)}
              />
            </div>
          )}

          {tab === 'upload' && (
            <div>
              <label className="label">Upload File (.txt, .vtt, .json)</label>
              <label
                htmlFor="upload-file"
                className={`flex flex-col items-center gap-3 px-4 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  uploadFile
                    ? 'border-violet-400 bg-violet-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
              >
                <Upload size={24} className={uploadFile ? 'text-violet-600' : 'text-gray-400'} />
                {uploadFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-violet-700">{uploadFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Drop file here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">Supports .txt, .vtt, .json</p>
                  </div>
                )}
                <input
                  id="upload-file"
                  type="file"
                  accept=".txt,.vtt,.json"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !title.trim()}>
              {loading ? (
                <>
                  <Loader2 size={14} className="spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Create Meeting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
