'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Flame } from 'lucide-react';
import type { Meeting } from '@/lib/types';

interface MeetingCardProps {
  meeting: Meeting;
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-violet-50/50 transition-colors group"
    >
      {/* Flame icon */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shrink-0">
        <Flame size={14} className="text-white" />
      </div>

      {/* Title + date */}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-gray-800 group-hover:text-violet-700 transition-colors truncate">
          {meeting.title}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {format(new Date(meeting.date), 'EEE, MMM d yyyy, h:mm a')}
        </p>
      </div>
    </Link>
  );
}
