'use client';

import { Hash } from 'lucide-react';
import type { KeyTopic } from '@/lib/types';

interface KeyTopicsListProps {
  topics: KeyTopic[];
}

const TOPIC_COLORS = [
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

export default function KeyTopicsList({ topics }: KeyTopicsListProps) {
  if (!topics.length) return null;

  return (
    <div className="card">
      <h3 className="section-title">
        <Hash size={18} className="text-violet-600" />
        Key Topics
      </h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, i) => (
          <span
            key={topic.id}
            className={`badge border text-xs ${TOPIC_COLORS[i % TOPIC_COLORS.length]}`}
          >
            <Hash size={10} className="mr-1" />
            {topic.topic}
          </span>
        ))}
      </div>
    </div>
  );
}
