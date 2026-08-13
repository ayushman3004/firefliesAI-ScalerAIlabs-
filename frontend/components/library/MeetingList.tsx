'use client';

import type { Meeting } from '@/lib/types';
import MeetingCard from './MeetingCard';
import { Mic2 } from 'lucide-react';

interface MeetingListProps {
  meetings: Meeting[];
  loading: boolean;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
      <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3.5 w-3/5" />
        <div className="skeleton h-3 w-2/5" />
      </div>
    </div>
  );
}

export default function MeetingList({ meetings, loading }: MeetingListProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <Mic2 size={24} className="text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-500 mb-1">No meetings found</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Start by creating a new meeting or adjusting your search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}
