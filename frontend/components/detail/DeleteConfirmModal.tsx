'use client';

import { useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  meetingTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({
  open,
  meetingTitle,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Delete Meeting</h2>
              <p className="text-xs text-gray-500 mt-0.5">This cannot be undone</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="text-gray-800 font-medium">"{meetingTitle}"</span>?
            All transcript segments, summaries, topics, and action items will be permanently removed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button
              id="confirm-delete-btn"
              onClick={handleConfirm}
              className="btn-danger"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className="spinner" />
              ) : (
                <Trash2 size={14} />
              )}
              {loading ? 'Deleting...' : 'Delete Meeting'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
