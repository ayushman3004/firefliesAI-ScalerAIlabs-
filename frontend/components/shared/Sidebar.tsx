'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Video,
  Upload,
  Link2,
  Users,
  Shield,
  X,
  Flame,
  Plus,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  separator?: boolean;
  shortcut?: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/meetings', label: 'Meetings', icon: Video },
  { href: '/uploads', label: 'Uploads', icon: Upload },
  { href: '/integrations', label: 'Integrations', icon: Link2, separator: true },
  { href: '/team', label: 'Team', icon: Users },
];

// Pages that actually exist in the app
const realPages = ['/', '/settings', '/meetings', '/uploads'];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isSlim = pathname.startsWith('/meetings');

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  function getHref(item: (typeof navItems)[0]) {
    // Items with real pages link there; placeholders go to /settings
    if (realPages.includes(item.href)) return item.href;
    return '/settings';
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''} ${isSlim ? 'slim' : ''}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 logo-container">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight logo-text">
              fireflies<span className="text-violet-400">.ai</span>
            </span>
          </Link>
          <button
            className="md:hidden text-gray-400 hover:text-white logo-text"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item, idx) => (
            <div key={item.href}>
              {item.separator && idx > 0 && (
                <div className="my-2 border-t border-white/5" />
              )}
              <Link
                href={getHref(item)}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                title={isSlim ? item.label : undefined}
              >
                <item.icon size={16} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                    {item.shortcut}
                  </span>
                )}
                {item.badge && (
                  <span className="text-[9px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded-full uppercase">
                    {item.badge}
                  </span>
                )}
              </Link>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-3">
          <Link
            href="/settings"
            className="sidebar-link text-xs text-gray-500"
            title={isSlim ? 'Your Privacy Choices' : undefined}
          >
            <Shield size={14} className="shrink-0" />
            <span className="privacy-text">Your Privacy Choices</span>
          </Link>

          {/* Invite card */}
          <div className="relative bg-white/5 rounded-xl p-3 invite-card">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-300">
              <X size={12} />
            </button>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Invite coworkers to your Fireflies team
            </p>
            <button className="w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
              <Plus size={12} />
              Create Team
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
