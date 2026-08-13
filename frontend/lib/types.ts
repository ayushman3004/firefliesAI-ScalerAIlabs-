/**
 * lib/types.ts — Shared TypeScript interfaces matching backend Pydantic schemas.
 */

export interface Participant {
  id: number;
  name: string;
  email: string | null;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker_id: number | null;
  speaker: Participant | null;
  start_time_seconds: number;
  end_time_seconds: number;
  text: string;
  order_index: number;
}

export interface Summary {
  id: number;
  meeting_id: number;
  overview_text: string;
  generated_by: 'seeded' | 'llm';
  created_at: string;
}

export interface KeyTopic {
  id: number;
  meeting_id: number;
  topic: string;
  order_index: number;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  is_completed: boolean;
  created_at: string;
  assignee: Participant | null;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  duration_seconds: number;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  summary: Summary | null;
  key_topics: KeyTopic[];
  action_items: ActionItem[];
}

export interface MeetingCreate {
  title: string;
  date: string;
  duration_seconds?: number;
  media_url?: string | null;
  participant_ids?: number[];
}

export interface MeetingUpdate {
  title?: string;
  date?: string;
  duration_seconds?: number;
  media_url?: string | null;
  participant_ids?: number[];
}

export interface ActionItemCreate {
  text: string;
  assignee_id?: number | null;
  is_completed?: boolean;
}

export interface ActionItemUpdate {
  text?: string;
  assignee_id?: number | null;
  is_completed?: boolean;
}

export interface ParticipantCreate {
  name: string;
  email?: string | null;
}

export interface SearchResult {
  meetings: Meeting[];
  transcript_segments: TranscriptSegment[];
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
}
