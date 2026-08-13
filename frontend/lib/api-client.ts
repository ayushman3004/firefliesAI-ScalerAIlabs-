/**
 * lib/api-client.ts — Typed fetch wrappers for all backend resources.
 */

import type {
  ActionItem,
  ActionItemCreate,
  ActionItemUpdate,
  ChatRequest,
  ChatResponse,
  Meeting,
  MeetingCreate,
  MeetingUpdate,
  Participant,
  ParticipantCreate,
  SearchResult,
  Summary,
  TranscriptSegment,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Meetings ──────────────────────────────────────────────────────────────────
export const meetingsApi = {
  list: (params?: { search?: string; participant?: string; sort?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.participant) qs.set('participant', params.participant);
    if (params?.sort) qs.set('sort', params.sort);
    const query = qs.toString() ? `?${qs}` : '';
    return request<Meeting[]>(`/meetings${query}`);
  },

  get: (id: number) => request<Meeting>(`/meetings/${id}`),

  create: (data: MeetingCreate) =>
    request<Meeting>('/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: MeetingUpdate) =>
    request<Meeting>(`/meetings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/meetings/${id}`, { method: 'DELETE' }),
};

// ── Transcript ────────────────────────────────────────────────────────────────
export const transcriptApi = {
  get: (meetingId: number) =>
    request<TranscriptSegment[]>(`/meetings/${meetingId}/transcript`),

  upload: (meetingId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE_URL}/meetings/${meetingId}/transcript/upload`, {
      method: 'POST',
      body: form,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail);
      }
      return res.json() as Promise<TranscriptSegment[]>;
    });
  },
};

// ── Summary ───────────────────────────────────────────────────────────────────
export const summaryApi = {
  get: (meetingId: number) =>
    request<Summary>(`/meetings/${meetingId}/summary`).catch(() => null),

  generate: (meetingId: number) =>
    request<Summary>(`/meetings/${meetingId}/summary/generate`, {
      method: 'POST',
    }),

  chat: (meetingId: number, data: ChatRequest) =>
    request<ChatResponse>(`/meetings/${meetingId}/chat`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Action Items ──────────────────────────────────────────────────────────────
export const actionItemsApi = {
  list: (meetingId: number) =>
    request<ActionItem[]>(`/meetings/${meetingId}/action-items`),

  create: (meetingId: number, data: ActionItemCreate) =>
    request<ActionItem>(`/meetings/${meetingId}/action-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: ActionItemUpdate) =>
    request<ActionItem>(`/action-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/action-items/${id}`, { method: 'DELETE' }),
};

// ── Participants ──────────────────────────────────────────────────────────────
export const participantsApi = {
  list: () => request<Participant[]>('/participants'),
  create: (data: ParticipantCreate) =>
    request<Participant>('/participants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Search ────────────────────────────────────────────────────────────────────
export const searchApi = {
  global: (q: string) =>
    request<SearchResult>(`/search?q=${encodeURIComponent(q)}`),
};

// ── Export ────────────────────────────────────────────────────────────────────
export const exportApi = {
  export: (meetingId: number, format: 'pdf' | 'md' | 'txt') =>
    fetch(`${BASE_URL}/meetings/${meetingId}/export?format=${format}`).then(
      async (res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      }
    ),
};
