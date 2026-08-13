'use client';

import { Search, SlidersHorizontal, X, CalendarDays, ArrowUpDown } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
}

export default function SearchFilterBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: SearchFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          ref={inputRef}
          id="library-search"
          type="text"
          placeholder="Search meetings by title or participant..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input pl-9 pr-8"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="relative">
        <ArrowUpDown
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <select
          id="library-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="input pl-8 pr-8 appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title (A–Z)</option>
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
