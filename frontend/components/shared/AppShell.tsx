'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './Navbar';
import { ToastProvider } from './Toast';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isSlim = pathname.startsWith('/meetings');

  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className={`app-content ${isSlim ? 'slim-sidebar' : ''}`}>
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
