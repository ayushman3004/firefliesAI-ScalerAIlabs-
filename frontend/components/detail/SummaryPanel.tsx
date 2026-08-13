'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, Loader2, Send, ChevronDown, ChevronUp, Bot, RefreshCw } from 'lucide-react';
import type { Summary } from '@/lib/types';
import { summaryApi } from '@/lib/api-client';
import { useToast } from '../shared/Toast';

interface SummaryPanelProps {
  meetingId: number;
  summary: Summary | null;
  onSummaryUpdated: (summary: Summary) => void;
}

function renderSummaryText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-xs font-semibold text-gray-800 mt-4 mb-2 first:mt-0 uppercase tracking-wider">
          {line.replace('### ', '')}
        </h4>
      );
    }
    if (line.startsWith('• ')) {
      return (
        <li key={idx} className="text-xs text-gray-600 ml-4 list-disc mb-1 leading-relaxed">
          {line.replace('• ', '')}
        </li>
      );
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-1" />;
    }
    return (
      <p key={idx} className="text-xs text-gray-600 leading-relaxed mb-2">
        {line}
      </p>
    );
  });
}

export default function SummaryPanel({ meetingId, summary, onSummaryUpdated }: SummaryPanelProps) {
  const { success, error } = useToast();
  const [generating, setGenerating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const newSummary = await summaryApi.generate(meetingId);
      onSummaryUpdated(newSummary);
      success('Summary generated with AI!');
    } catch (err: any) {
      error(err.message || 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion('');
    setChatLoading(true);
    try {
      const res = await summaryApi.chat(meetingId, { question: q });
      setChatHistory((prev) => [...prev, { q, a: res.answer }]);
    } catch (err: any) {
      error(err.message || 'Failed to get text');
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title mb-0">
          <Sparkles size={18} className="text-violet-600" />
          AI Summary
        </h3>
        <div className="flex items-center gap-2">
          {summary && (
            <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200">
              {summary.generated_by === 'llm' ? 'AI Generated' : 'Seeded'}
            </span>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-ghost text-xs gap-1.5"
            title="Regenerate with AI"
          >
            {generating ? (
              <Loader2 size={13} className="spinner" />
            ) : (
              <RefreshCw size={13} />
            )}
            {generating ? 'Generating...' : summary ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {summary ? (
        <div className="space-y-1">{renderSummaryText(summary.overview_text)}</div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
            <Sparkles size={20} className="text-violet-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">No summary yet</p>
            <p className="text-xs text-gray-400 mt-1">Click &quot;Generate&quot; to create an AI summary</p>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary text-xs">
            {generating ? <Loader2 size={13} className="spinner" /> : <Sparkles size={13} />}
            {generating ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>
      )}

      {/* Chat section */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors w-full"
          id="chat-toggle"
        >
          <MessageSquare size={15} className="text-violet-600" />
          Ask about this meeting
          {chatOpen ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
        </button>

        {chatOpen && (
          <div className="mt-4 space-y-3">
            {/* Chat history */}
            {chatHistory.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-violet-100 border border-violet-200 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                    <p className="text-xs text-violet-800">{item.q}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 flex-1">
                    <p className="text-xs text-gray-700 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleChat} className="flex gap-2">
              <input
                id="chat-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What action items were assigned to Bob?"
                className="input text-xs flex-1"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !question.trim()}
                className="btn-primary px-3 py-2"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
