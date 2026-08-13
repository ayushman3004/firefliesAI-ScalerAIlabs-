'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, Upload, Plus, ChevronRight, Settings, Flame } from 'lucide-react';
import { meetingsApi } from '@/lib/api-client';
import type { Meeting } from '@/lib/types';
import MeetingList from '@/components/library/MeetingList';
import NewMeetingModal from '@/components/library/NewMeetingModal';
import { useToast } from '@/components/shared/Toast';
import { useDebounce } from '@/lib/hooks';
import { format } from 'date-fns';

function QuickStartCard({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: any;
  label: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-violet-200 hover:shadow-sm transition-all group text-left flex-1 min-w-[180px]"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
    </button>
  );
}

export default function HomePage() {
  const { error } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await meetingsApi.list({ sort: 'recent' });
      setMeetings(data);
    } catch (err: any) {
      error(err.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  function handleCreated(meeting: Meeting) {
    setMeetings((prev) => [meeting, ...prev]);
    setShowNewModal(false);
  }

  const tabs = [
    { id: 'recent', label: 'Recent' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ai-feed', label: 'AI Feed' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] border border-violet-100 p-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Aboard, Ayushman!
          </h1>
          <p className="text-sm text-gray-500 max-w-md">
            Fireflies is now ready to automate your meetings and streamline your workflows.
          </p>
        </div>
        {/* Walkthrough thumbnail */}
        <div className="hidden sm:block relative shrink-0">
          <div className="w-40 h-28 rounded-xl bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-violet-600 border-b-[8px] border-b-transparent ml-1" />
            </div>
            <div className="absolute top-2 left-3 flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-green-400" />
              <span className="text-[9px] text-white/90 font-medium">Walkthrough</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Quick Start</h2>
        <p className="text-sm text-gray-400 mb-4">
          Capture your first meeting or upload a recording to see Fireflies in action.
        </p>
        <div className="flex gap-3 flex-wrap">
          <QuickStartCard
            icon={Calendar}
            label="Schedule Meeting"
            color="bg-violet-100 text-violet-600"
            onClick={() => setShowNewModal(true)}
          />
          <QuickStartCard
            icon={Upload}
            label="Upload File"
            color="bg-emerald-100 text-emerald-600"
            onClick={() => setShowNewModal(true)}
          />
          <QuickStartCard
            icon={Plus}
            label="Capture Meeting"
            color="bg-blue-100 text-blue-600"
            onClick={() => setShowNewModal(true)}
          />
        </div>
      </div>

      {/* Tabs + Settings */}
      <div>
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors pb-2">
            <Settings size={14} />
            Settings
          </button>
        </div>

        {/* Meeting list */}
        <div className="mt-2">
          <MeetingList meetings={meetings} loading={loading} />
        </div>
      </div>

      {/* New meeting modal */}
      <NewMeetingModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
