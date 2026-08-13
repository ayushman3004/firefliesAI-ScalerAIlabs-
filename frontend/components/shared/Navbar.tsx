'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Mic, ChevronDown, Mic2, Menu, Crown, GraduationCap, CheckSquare, ListChecks, Radio, Download, Flame, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { searchApi } from '@/lib/api-client';
import type { SearchResult } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/settings': 'Settings',
  '/meetings': 'Meetings',
  '/uploads': 'Uploads',
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notifications popup state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Page title
  const pageTitle =
    PAGE_TITLES[pathname] ||
    (pathname.startsWith('/meetings/') ? 'Meeting Detail' : 'Page');

  // Click-outside close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchApi.global(query);
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  return (
    <header className="topbar">
      {/* Mobile menu button */}
      <button
        className="md:hidden btn-ghost p-2"
        onClick={onMenuClick}
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <h2 className="text-sm font-semibold text-gray-800 shrink-0">
        {pageTitle}
      </h2>

      {/* Search bar */}
      <div ref={searchRef} className="relative flex-1 max-w-lg mx-4">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 cursor-text ${
            searchOpen
              ? 'bg-white border-violet-300 shadow-sm'
              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => {
            setSearchOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            id="navbar-search"
            type="text"
            placeholder="Search by title or keyword"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
          />
          {searching ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-violet-500 border-t-transparent spinner shrink-0" />
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-mono shrink-0">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Dropdown */}
        {searchOpen && (results?.meetings.length || results?.transcript_segments.length) ? (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
            {results.meetings.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Meetings
                </div>
                {results.meetings.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-violet-50 text-left transition-colors"
                    onClick={() => {
                      router.push(`/meetings/${m.id}`);
                      setSearchOpen(false);
                      setQuery('');
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Mic2 size={14} className="text-violet-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{m.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(m.date), { addSuffix: true })}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
            {results.transcript_segments.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-t border-b border-gray-100">
                  Transcript matches
                </div>
                {results.transcript_segments.slice(0, 3).map((seg) => (
                  <button
                    key={seg.id}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-violet-50 text-left transition-colors"
                    onClick={() => {
                      router.push(`/meetings/${seg.meeting_id}`);
                      setSearchOpen(false);
                      setQuery('');
                    }}
                  >
                    <div className="text-xs text-gray-500 line-clamp-2 flex-1">
                      <span className="text-violet-600 font-medium">
                        {seg.speaker?.name || 'Unknown'}:
                      </span>{' '}
                      {seg.text}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        ) : searchOpen && query && !searching ? (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center z-50">
            <p className="text-sm text-gray-400">No results found for &quot;{query}&quot;</p>
          </div>
        ) : null}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Upgrade */}
        <button className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-violet-600 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
          <Crown size={12} />
          Upgrade
        </button>

        {/* Capture button */}
        <button className="btn-primary text-xs px-3 py-1.5 gap-1.5">
          <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center">
            <Mic size={10} className="text-white" />
          </div>
          Capture
          <ChevronDown size={10} />
        </button>

        {/* Mic icon */}
        <button className="btn-ghost p-2 rounded-lg" title="Microphone">
          <Mic size={16} className="text-gray-400" />
        </button>

        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className={`btn-ghost p-2 rounded-lg relative ${notifOpen ? 'bg-gray-100 text-gray-800' : ''}`} 
            title="Notifications"
          >
            <Bell size={16} className={notifOpen ? 'text-gray-700' : 'text-gray-400'} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[360px] sm:w-[380px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-left flex flex-col font-sans select-none animate-fadeIn">
              {/* Notification Header Tabs */}
              <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex gap-1 overflow-x-auto scrollbar-none">
                  <span className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-800 rounded-full cursor-default shrink-0">
                    All · 4
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600 rounded-full cursor-default shrink-0">
                    Updates · 4
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600 rounded-full cursor-default shrink-0">
                    Auto-Fill
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600 rounded-full cursor-default flex items-center gap-1 shrink-0">
                    Status
                    <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-1 rounded uppercase tracking-wider scale-90">New</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 pl-2 shrink-0 border-l border-gray-100">
                  <button className="hover:text-gray-600 flex items-center gap-0.5" title="Mark unread only">
                    <CheckSquare size={14} />
                    <span className="text-[10px] font-medium hidden sm:inline">Unread</span>
                  </button>
                  <button className="hover:text-gray-600" title="Mark all as read">
                    <ListChecks size={14} />
                  </button>
                </div>
              </div>

              {/* Notification Body List */}
              <div className="flex-1 overflow-y-auto max-h-[380px] p-2 space-y-1 bg-[#fcfcfd]">
                <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">New</div>
                
                {/* Notif 1 */}
                <div className="p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all flex gap-3 relative shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                  <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[9px] text-gray-400 font-medium">12:47 AM</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap size={15} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <h5 className="text-xs font-semibold text-gray-800 leading-snug">New course: Admin Onboarding 🎓</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">Set up right. Now in the community courses directory.</p>
                    <button className="mt-2 text-[10px] font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors">
                      Browse Courses
                    </button>
                  </div>
                </div>

                {/* Notif 2 */}
                <div className="p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all flex gap-3 relative shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                  <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[9px] text-gray-400 font-medium">12:47 AM</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 relative mt-0.5">
                    <Mic2 size={14} className="text-violet-600" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <h5 className="text-xs font-semibold text-gray-800 leading-snug">New: Dictate your questions to Fred</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">Ask your next question out loud.</p>
                    <button className="mt-2 text-[10px] font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1">
                      See it live
                      <span className="scale-95">→</span>
                    </button>
                  </div>
                </div>

                {/* Notif 3 */}
                <div className="p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all flex gap-3 relative shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                  <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[9px] text-gray-400 font-medium">12:47 AM</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Radio size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <h5 className="text-xs font-semibold text-gray-800 leading-snug">Office hours July 7: Build a voice agent live</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">Got a call you run on repeat? We&apos;ll build the voice agent that runs it, live.</p>
                    <button className="mt-2 text-[10px] font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1">
                      Save your spot
                      <span className="scale-95">→</span>
                    </button>
                  </div>
                </div>

                {/* Notif 4 */}
                <div className="p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all flex gap-3 relative shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                  <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[9px] text-gray-400 font-medium">12:47 AM</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckSquare size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <h5 className="text-xs font-semibold text-gray-800 leading-snug">Watch the admin controls webinar 🔴</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-normal truncate">Learn how to manage privacy, admin controls...</p>
                  </div>
                </div>
              </div>

              {/* Sticky bottom download banner */}
              <div className="p-3 bg-slate-950 text-white flex items-center justify-between border-t border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Flame size={14} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-white leading-tight">Fireflies Desktop App</h6>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-none">Capture conversations without a bot.</p>
                  </div>
                </div>
                <button className="flex items-center gap-1 text-[10px] font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1.5 rounded-lg transition-colors shrink-0">
                  Download
                  <Download size={10} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile avatar */}
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm shrink-0">
          A
        </button>
      </div>
    </header>
  );
}
