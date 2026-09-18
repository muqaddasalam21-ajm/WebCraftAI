import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CornerDownLeft } from 'lucide-react';
import { Button } from './Button';

interface AIInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const AIInput: React.FC<AIInputProps> = ({ onSendMessage, isLoading, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedPrompts = [
    'Create a modern furniture website with beige and dark brown colors.',
    'Build an organic luxury skincare storefront with routine quiz.',
    'Design a Michelin-star gastronomy website with table reservations.',
    'Plan a high-growth AI SaaS agency website with interactive ROI calculator.'
  ];

  const handleSend = () => {
    if (!input.trim() || isLoading || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  return (
    <div className="space-y-3">
      {/* Suggested prompts pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInput(prompt);
              textareaRef.current?.focus();
            }}
            className="px-3 py-1.5 rounded-full text-xs bg-white hover:bg-brand-50 border border-slate-200 text-slate-700 hover:text-brand-700 hover:border-brand-300 transition-all shrink-0 flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3 h-3 text-brand-500" />
            <span className="truncate max-w-[260px]">{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all p-2.5">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the website you want to create (e.g. niche, colors, sections, style)..."
          rows={2}
          disabled={disabled || isLoading}
          className="w-full resize-none px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
        />

        <div className="flex items-center justify-between pt-2 px-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 hidden sm:inline-flex">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono text-[10px]">Enter ↵</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono text-[10px]">Shift+Enter</kbd> for newline
          </span>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            isLoading={isLoading}
            disabled={!input.trim() || disabled}
            rightIcon={<Send className="w-3.5 h-3.5" />}
            className="ml-auto"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
