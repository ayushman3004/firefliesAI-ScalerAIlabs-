'use client';

import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Loader2, User } from 'lucide-react';
import type { ActionItem, Participant } from '@/lib/types';
import { actionItemsApi } from '@/lib/api-client';
import { useToast } from '../shared/Toast';

interface ActionItemsChecklistProps {
  meetingId: number;
  actionItems: ActionItem[];
  participants: Participant[];
  onUpdated: (items: ActionItem[]) => void;
}

export default function ActionItemsChecklist({
  meetingId,
  actionItems,
  participants,
  onUpdated,
}: ActionItemsChecklistProps) {
  const { success, error } = useToast();
  const [newText, setNewText] = useState('');
  const [newAssignee, setNewAssignee] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleToggle(item: ActionItem) {
    try {
      const updated = await actionItemsApi.update(item.id, {
        is_completed: !item.is_completed,
      });
      onUpdated(actionItems.map((a) => (a.id === item.id ? updated : a)));
    } catch (err: any) {
      error(err.message || 'Failed to update');
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    setAdding(true);
    try {
      const created = await actionItemsApi.create(meetingId, {
        text: newText.trim(),
        assignee_id: newAssignee,
      });
      onUpdated([...actionItems, created]);
      setNewText('');
      setNewAssignee(null);
      setShowAdd(false);
      success('Action item added');
    } catch (err: any) {
      error(err.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await actionItemsApi.delete(id);
      onUpdated(actionItems.filter((a) => a.id !== id));
      success('Action item deleted');
    } catch (err: any) {
      error(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  const completed = actionItems.filter((a) => a.is_completed).length;
  const progress = actionItems.length > 0 ? (completed / actionItems.length) * 100 : 0;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title mb-0">
          <CheckSquare size={18} className="text-violet-600" />
          Action Items
          <span className="ml-1 text-sm font-normal text-gray-400">
            {completed}/{actionItems.length}
          </span>
        </h3>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="btn-ghost text-xs gap-1"
          id="add-action-item-btn"
        >
          <Plus size={13} />
          Add
        </button>
      </div>

      {/* Progress bar */}
      {actionItems.length > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-right">{Math.round(progress)}% complete</p>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="space-y-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <input
            id="new-action-item-text"
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Describe the action item..."
            className="input text-sm"
            autoFocus
            required
          />
          <div className="flex items-center gap-2">
            <User size={13} className="text-gray-500 shrink-0" />
            <select
              className="input text-xs flex-1"
              value={newAssignee ?? ''}
              onChange={(e) => setNewAssignee(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Unassigned</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-xs px-2 py-1.5">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs px-3 py-1.5" disabled={adding || !newText.trim()}>
              {adding ? <Loader2 size={12} className="spinner" /> : <Plus size={12} />}
              Add
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      {actionItems.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No action items yet</p>
      ) : (
        <div className="space-y-2">
          {actionItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 group ${
                item.is_completed
                  ? 'border-gray-100 bg-gray-50/50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(item)}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${
                  item.is_completed
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-gray-300 hover:border-violet-500'
                }`}
                title={item.is_completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.is_completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {item.text}
                </p>
                {item.assignee && (
                  <div className="flex items-center gap-1 mt-1">
                    <User size={10} className="text-gray-600" />
                    <span className="text-xs text-gray-400">{item.assignee.name}</span>
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded"
                title="Delete action item"
              >
                {deletingId === item.id ? (
                  <Loader2 size={13} className="spinner" />
                ) : (
                  <Trash2 size={13} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
