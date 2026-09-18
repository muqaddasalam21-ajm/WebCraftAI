import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  Layers,
  Palette,
  Layout,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Bot
} from 'lucide-react';
import { ChatMessage, AISession } from '../types';
import { AIMessage } from './AIMessage';
import { AIInput } from './AIInput';
import { Button } from './Button';
import { frontendAIService } from '../services/aiService';

export const AIChat: React.FC = () => {
  const [sessions, setSessions] = useState<AISession[]>([
    {
      id: 'session-1',
      title: 'Modern Furniture Store',
      createdAt: 'Today',
      messages: []
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setError(null);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update session title if it's the first message
    const updatedMessages = [...activeSession.messages, userMessage];
    const newTitle =
      activeSession.messages.length === 0
        ? content.slice(0, 28) + (content.length > 28 ? '...' : '')
        : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: newTitle, messages: updatedMessages }
          : s
      )
    );

    setIsLoading(true);

    try {
      const response = await frontendAIService.sendMessage({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        sessionId: activeSessionId
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: response.provider
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...updatedMessages, assistantMessage] }
            : s
        )
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not connect to the AI service backend. Please ensure the backend server is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLastMessage = () => {
    const lastUserMsg = [...activeSession.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleNewChat = () => {
    const newSession: AISession = {
      id: `session-${Date.now()}`,
      title: `New Website Plan ${sessions.length + 1}`,
      createdAt: 'Just now',
      messages: []
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setError(null);
  };

  const handleClearCurrentChat = () => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [] } : s))
    );
    setError(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8.5rem)] bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* 1. LEFT COLUMN: Conversation Sessions History */}
      <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Chats
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewChat}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="py-1 px-2 text-xs"
            >
              New Chat
            </Button>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[30vh] lg:max-h-[55vh]">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setError(null);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                  session.id === activeSessionId
                    ? 'bg-brand-100/80 text-brand-900 font-semibold shadow-2xs border border-brand-200'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span className="truncate flex-1">{session.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clear action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleClearCurrentChat}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear messages</span>
          </button>
        </div>
      </div>

      {/* 2. CENTER COLUMN: Active Chat Conversation */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 overflow-hidden bg-[#fafafa]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
              <img
                src="/assets/3d/ai-agent-3d.svg"
                alt="AI Agent"
                className="w-36 h-36 object-contain mb-4 animate-float"
              />
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                WebCraftAI Builder Assistant
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mb-4">
                Describe the website you want to plan. Our real AI agent generates page hierarchies,
                color palettes, typography pairings, and layout recommendations.
              </p>
            </div>
          ) : (
            <>
              {activeSession.messages.map((msg) => (
                <AIMessage key={msg.id} message={msg} />
              ))}
            </>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 my-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-pink text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs p-4 shadow-xs flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-accent-pink animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Analyzing architecture &amp; writing recommendations...
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">AI Communication Error:</span> {error}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetryLastMessage}
                leftIcon={<RefreshCw className="w-3 h-3" />}
                className="py-1 px-2.5 bg-white text-xs shrink-0"
              >
                Retry
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="pt-3 border-t border-slate-200/60">
          <AIInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* 3. RIGHT COLUMN: Context & Parameters Panel */}
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-100 bg-white p-5 overflow-y-auto shrink-0 space-y-5 hidden xl:block">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
            AI Blueprint Context
          </span>

          <div className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-100 text-xs text-brand-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Real AI Engine Active</span>
            </div>
            <p className="text-[11px] text-brand-700 leading-relaxed">
              Multi-turn conversational memory is preserved across turns in this session.
            </p>
          </div>
        </div>

        {/* Design Style Quick Recommendations */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Suggested Style Palettes
          </span>

          <div className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800">Warm Scandinavian</span>
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-full bg-[#FAF8F5] border" />
                <span className="w-3 h-3 rounded-full bg-[#D6C7B2]" />
                <span className="w-3 h-3 rounded-full bg-[#292524]" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500">Beige · Espresso · Linen White</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800">Luxury Rose Gold</span>
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-full bg-[#FDF2F8]" />
                <span className="w-3 h-3 rounded-full bg-[#F43F5E]" />
                <span className="w-3 h-3 rounded-full bg-[#4C0519]" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500">Blush · Rose Berry · Gold</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800">Cyberpunk SaaS</span>
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-full bg-[#0F172A]" />
                <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                <span className="w-3 h-3 rounded-full bg-[#06B6D4]" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500">Midnight · Indigo · Cyan</span>
          </div>
        </div>

        {/* Security / System Info */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Server-side Key Protection</span>
          </div>
          <p className="text-[10px]">API keys are secured on backend server.</p>
        </div>
      </div>
    </div>
  );
};
