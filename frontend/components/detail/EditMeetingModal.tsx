'use client';

import { useState } from 'react';
import { X, Loader2, Save, Link as LinkIcon } from 'lucide-react';
import type { Meeting, Participant } from '@/lib/types';
import { meetingsApi } from '@/lib/api-client';
import { useToast } from '../shared/Toast';

interface EditMeetingModalProps {
  open: boolean;
  meeting: Meeting;
  participants: Participant[];
  onClose: () => void;
  onUpdated: (meeting: Meeting) => void;
}

export default function EditMeetingModal({
  open,
  meeting,
  participants,
  onClose,
  onUpdated,
}: EditMeetingModalProps) {
  const { success, error } = useToast();
  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(new Date(meeting.date).toISOString().slice(0, 16));
  const [duration, setDuration] = useState(String(Math.floor(meeting.duration_seconds / 60)));
  const [mediaUrl, setMediaUrl] = useState(meeting.media_url || '');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>(
    meeting.participants.map((p) => p.id)
  );
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function toggleParticipant(id: number) {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await meetingsApi.update(meeting.id, {
        title: title.trim(),
        date: new Date(date).toISOString(),
        duration_seconds: parseInt(duration) * 60,
        media_url: mediaUrl || null,
        participant_ids: selectedParticipantIds,
      });
      success('Meeting updated!');
      onUpdated(updated);
    } catch (err: any) {
      error(err.message || 'Failed to update meeting');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit Meeting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label" htmlFor="edit-meeting-title">Title</label>
            <input
              id="edit-meeting-title"
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="edit-meeting-date">Date & Time</label>
              <input
                id="edit-meeting-date"
                type="datetime-local"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-meeting-duration">Duration (min)</label>
              <input
                id="edit-meeting-duration"
                type="number"
                className="input"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="edit-media-url">Media URL</label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="edit-media-url"
                type="url"
                className="input pl-8"
                placeholder="https://..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
          </div>

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

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
