import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/shared/AppShell';

export const metadata: Metadata = {
  title: 'Fireflies.ai Clone — Meeting Notes & Transcription',
  description:
    'AI-powered meeting assistant. Browse meeting transcripts, summaries, action items and key topics from all your meetings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#f8f9fb]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
