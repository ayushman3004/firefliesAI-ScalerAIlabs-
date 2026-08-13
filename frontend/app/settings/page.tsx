import type { Metadata } from 'next';
import { Bot, Zap, Users, Link2, Calendar, Shield, Mic2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings — Fireflies.ai Clone',
  description: 'Configure your meeting assistant settings, integrations, and preferences.',
};

const comingSoon = [
  {
    icon: Bot,
    title: 'Live Meeting Bot',
    description:
      'Automatically join Zoom, Google Meet, and Microsoft Teams calls to record and transcribe in real-time.',
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
  {
    icon: Mic2,
    title: 'Speech-to-Text',
    description:
      'Real-time transcription powered by Whisper or Assembly AI. Upload any audio/video file and get a searchable transcript.',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    icon: Link2,
    title: 'Integrations',
    description:
      'Connect with Zoom, Google Calendar, Salesforce, HubSpot, Slack, Notion, and 50+ more tools to sync your meetings.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    icon: Users,
    title: 'Team Sharing',
    description:
      'Share meetings, transcripts, and action items with your team. Role-based access control and shared workspaces.',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    icon: Calendar,
    title: 'Calendar Sync',
    description:
      'Auto-detect meetings from your Google or Outlook calendar. Never manually create a meeting again.',
    color: 'text-pink-600 bg-pink-50 border-pink-100',
  },
  {
    icon: Shield,
    title: 'Authentication',
    description:
      'Full auth with SSO, SAML, Google OAuth. Role management, audit logs, and enterprise security controls.',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
          <Zap size={12} />
          Coming Soon
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Settings & Integrations</h1>
        <p className="text-gray-500 mt-2 max-w-xl">
          These features are on the roadmap. The current version focuses on the core meeting library
          and transcript experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comingSoon.map((item) => (
          <div key={item.title} className="card group cursor-default opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                  <span className="badge bg-gray-100 text-gray-400 text-[10px]">Soon</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card text-center py-10 space-y-4 border-dashed border-gray-300">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto">
          <Zap size={24} className="text-violet-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">Want these features faster?</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            This is a demo project built to showcase the architecture and UX of an AI meeting
            assistant. The core CRUD, transcript sync, and AI summarization are fully functional.
          </p>
        </div>
      </div>
    </div>
  );
}
