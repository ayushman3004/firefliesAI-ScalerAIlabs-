'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, User, ChevronRight, Link2 } from 'lucide-react';
import type { TranscriptSegment } from '@/lib/types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const AVATAR_COLORS: Record<string, string> = {};
const COLOR_POOL = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-cyan-500',
];
let colorIdx = 0;

function getSpeakerColor(name: string) {
  if (!AVATAR_COLORS[name]) {
    AVATAR_COLORS[name] = COLOR_POOL[colorIdx % COLOR_POOL.length];
    colorIdx++;
  }
  return AVATAR_COLORS[name];
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSegmentClick: (startTime: number) => void;
}

export default function TranscriptPanel({
  segments,
  currentTime,
  onSegmentClick,
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const activeRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Find active segment index
  const activeIdx = segments.findIndex(
    (seg) => currentTime >= seg.start_time_seconds && currentTime <= seg.end_time_seconds
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (autoScroll && activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeIdx, autoScroll]);

  // Filter segments by search
  const filtered = searchQuery
    ? segments.filter((s) => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : segments;

  // Count search matches
  const matchCount = searchQuery
    ? segments.filter((s) => s.text.toLowerCase().includes(searchQuery.toLowerCase())).length
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            id="transcript-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find or Replace"
            className="input pl-8 py-1.5 text-xs bg-gray-50 border-gray-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
        {searchQuery && (
          <span className="text-xs text-gray-500 shrink-0">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>

      {/* Auto-scroll toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <span className="text-xs text-gray-400">
          {segments.length} segments
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-gray-500">Auto-scroll</span>
          <div
            className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
              autoScroll ? 'bg-violet-600' : 'bg-gray-300'
            }`}
            onClick={() => setAutoScroll((v) => !v)}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                autoScroll ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Segments */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-2 space-y-1"
      >
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            {searchQuery ? 'No segments match your search' : 'No transcript available'}
          </div>
        )}

        {filtered.map((seg, i) => {
          const isActive = seg === segments[activeIdx];
          const speakerName = seg.speaker?.name || 'Unknown';
          const avatarColor = getSpeakerColor(speakerName);
          const initials = speakerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

          return (
            <div
              key={seg.id}
              ref={isActive ? activeRef : null}
              onClick={() => onSegmentClick(seg.start_time_seconds)}
              className={`flex gap-3 px-4 py-3 cursor-pointer rounded-lg mx-2 group transition-all duration-150 ${
                isActive
                  ? 'bg-violet-50 border border-violet-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg ${avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5`}
              >
                {initials[0]}
              </div>

              <div className="flex-1 min-w-0">
                {/* Speaker + timestamp */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">{speakerName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSegmentClick(seg.start_time_seconds);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors shrink-0 flex items-center gap-1"
                    title="Jump to this moment"
                  >
                    {formatTime(seg.start_time_seconds)}
                    <Link2 size={10} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] text-violet-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                      Now
                    </span>
                  )}
                </div>

                {/* Text */}
                <p
                  className={`text-sm leading-relaxed transition-colors ${
                    isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {highlight(seg.text, searchQuery)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
