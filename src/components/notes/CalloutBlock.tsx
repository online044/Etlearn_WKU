import React from 'react';
import { Sparkles, BookOpen, Lightbulb, AlertTriangle, HelpCircle, Sigma } from 'lucide-react';
import { CalloutType, CALLOUT_METADATA } from '../../utils/markdownUtils';

interface CalloutBlockProps {
  type: CalloutType;
  title?: string;
  content: string;
  theme?: string;
  language?: 'en' | 'am';
}

export const CalloutBlock: React.FC<CalloutBlockProps> = ({
  type,
  title,
  content,
  theme = 'dark',
  language = 'en'
}) => {
  const meta = CALLOUT_METADATA[type] || CALLOUT_METADATA['key-point'];
  const displayTitle = title || (language === 'am' ? meta.amharicTitle : meta.title);

  const renderIcon = () => {
    switch (type) {
      case 'key-point':
        return <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'definition':
        return <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'example':
        return <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'formula':
        return <Sigma className="w-4 h-4 text-indigo-400 shrink-0" />;
      default:
        return <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />;
    }
  };

  const getContainerStyles = () => {
    if (theme === 'light') {
      switch (type) {
        case 'key-point':
          return 'bg-amber-50 border-amber-300 text-amber-950';
        case 'definition':
          return 'bg-blue-50 border-blue-300 text-blue-950';
        case 'example':
          return 'bg-emerald-50 border-emerald-300 text-emerald-950';
        case 'warning':
          return 'bg-rose-50 border-rose-300 text-rose-950';
        case 'formula':
          return 'bg-indigo-50 border-indigo-300 text-indigo-950';
      }
    } else if (theme === 'sepia') {
      switch (type) {
        case 'key-point':
          return 'bg-[#F5E6C8] border-[#DFC593] text-[#3E2B15]';
        case 'definition':
          return 'bg-[#E3EAF2] border-[#BACCDD] text-[#1E2E3E]';
        case 'example':
          return 'bg-[#E1EFE4] border-[#B7D8BD] text-[#16351B]';
        case 'warning':
          return 'bg-[#F8E1DC] border-[#E8B4A8] text-[#421711]';
        case 'formula':
          return 'bg-[#ECE5F5] border-[#D0BFEC] text-[#2C1948]';
      }
    } else if (theme === 'contrast') {
      return 'bg-black border-2 border-amber-400 text-white';
    }
    // Default dark theme
    return `${meta.bgClass} border ${meta.borderClass} text-slate-200`;
  };

  return (
    <aside
      role="note"
      aria-label={displayTitle}
      className={`my-4 sm:my-5 rounded-xl p-3.5 sm:p-4 border shadow-sm transition-all duration-150 ${getContainerStyles()}`}
    >
      <div className="flex items-center gap-2 mb-2 font-semibold text-xs sm:text-sm tracking-wide">
        <div className="p-1 rounded-md bg-black/15 dark:bg-white/10 flex items-center justify-center">
          {renderIcon()}
        </div>
        <span className="uppercase tracking-wider font-bold text-xs">{displayTitle}</span>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-line pl-0.5 opacity-95">
        {content}
      </div>
    </aside>
  );
};
