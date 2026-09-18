import React from 'react';
import { Bot, Sparkles, ShieldCheck } from 'lucide-react';
import { AIChat } from '../../components/AIChat';

export const AIAgentPage: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-pink text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              WebCraftAI Site Architect
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                Real AI Provider Active
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Conversational website planning with memory, section blueprints &amp; color palettes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>Server-Protected API Key</span>
        </div>
      </div>

      {/* Main 3-Column AI Chat Shell */}
      <AIChat />
    </div>
  );
};
