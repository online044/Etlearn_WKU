import React from 'react';
import { Sparkles, Bot } from 'lucide-react';
import { playClickChime } from '../../utils/audio';

interface AIButtonProps {
  onClick: () => void;
  language: 'en' | 'am' | 'both';
}

export default function AIButton({ onClick, language }: AIButtonProps) {
  const isAmharic = language === 'am';

  return (
    <button
      type="button"
      onClick={() => {
        playClickChime();
        onClick();
      }}
      className="fixed bottom-[74px] right-4 sm:right-6 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none border border-amber-300/40"
      aria-label="Open AI Tutor"
    >
      <div className="w-5 h-5 rounded-full bg-slate-950/15 flex items-center justify-center">
        <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
      </div>
      <span className="tracking-tight font-extrabold">
        {isAmharic ? 'አስጎብኚ' : 'Ask ET_AI'}
      </span>
    </button>
  );
}
