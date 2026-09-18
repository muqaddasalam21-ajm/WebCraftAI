import React from 'react';
import { Bot, User as UserIcon, Sparkles, Copy, Check } from 'lucide-react';
import { ChatMessage } from '../types';

interface AIMessageProps {
  message: ChatMessage;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple Markdown text formatter for headings, lists, bold text, code blocks
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Headings
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} className="text-sm font-bold text-slate-800 mt-2 mb-1">
            {line.replace('#### ', '')}
          </h5>
        );
      }
      // List items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="text-xs sm:text-sm text-slate-700 ml-4 list-disc my-0.5">
            {renderInlineMarkdown(line.substring(2))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="text-xs sm:text-sm text-slate-700 ml-4 list-decimal my-0.5">
            {renderInlineMarkdown(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-1">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Replace **bold** with <strong> and `code` with <code>
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-brand-700 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex gap-3 sm:gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-pink text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Bot className="w-5 h-5" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 text-sm transition-all ${
          isUser
            ? 'bg-brand-600 text-white rounded-br-xs shadow-sm shadow-brand-600/20'
            : 'bg-white border border-slate-200/80 rounded-bl-xs shadow-xs text-slate-800'
        }`}
      >
        {!isUser && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-slate-400">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              WebCraftAI Assistant
              {message.provider && (
                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                  {message.provider}
                </span>
              )}
            </span>
            <button
              onClick={handleCopy}
              className="hover:text-slate-700 flex items-center gap-1 p-1 rounded-md hover:bg-slate-50 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        <div className={isUser ? 'text-white' : 'text-slate-800'}>
          {isUser ? <p className="leading-relaxed">{message.content}</p> : formatContent(message.content)}
        </div>

        <div className={`text-[10px] mt-2 text-right ${isUser ? 'text-brand-100' : 'text-slate-400'}`}>
          {message.timestamp}
        </div>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
