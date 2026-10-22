import React from 'react';
import { X, List, Hash, ChevronRight } from 'lucide-react';
import { TocHeading } from '../../types/notes';

interface TableOfContentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  headings: TocHeading[];
  activeHeadingId?: string;
  onSelectHeading: (id: string) => void;
  progressPercent: number;
  language?: 'en' | 'am';
}

export const TableOfContentsDrawer: React.FC<TableOfContentsDrawerProps> = ({
  isOpen,
  onClose,
  headings,
  activeHeadingId,
  onSelectHeading,
  progressPercent,
  language = 'en'
}) => {
  if (!isOpen) return null;

  const isAm = language === 'am';

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm h-full bg-[#0F172A] border-l border-white/10 text-slate-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <List className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isAm ? 'የይዘት ማውጫ' : 'Table of Contents'}
              </h3>
              <p className="text-xs text-slate-400">
                {headings.length} {isAm ? 'ንዑስ ክፍሎች' : 'sections in this note'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Table of Contents"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress summary banner */}
        <div className="px-5 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {isAm ? 'አጠቃላይ የንባብ ሂደት' : 'Reading Completion'}
          </span>
          <span className="text-xs font-bold text-amber-400">
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Headings List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {headings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              {isAm ? 'ምንም ርዕሶች አልተገኙም' : 'No headings found in this document.'}
            </div>
          ) : (
            headings.map((h, idx) => {
              const isActive = activeHeadingId === h.id;
              const indentClass =
                h.level === 1 ? 'pl-2 font-bold text-sm' : h.level === 2 ? 'pl-6 text-sm' : 'pl-9 text-xs';

              return (
                <button
                  key={`${h.id}-${idx}`}
                  onClick={() => {
                    onSelectHeading(h.id);
                    onClose();
                  }}
                  className={`w-full text-left py-2.5 pr-3 rounded-xl flex items-center justify-between gap-2 transition-all ${indentClass} ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 font-bold border-l-2 border-amber-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{h.text}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-500">
            {isAm ? 'የርዕሱን ስም በመንካት በቀጥታ ወደዚያ ይሸጋገሩ' : 'Tap any heading to jump directly to section'}
          </p>
        </div>
      </div>
    </div>
  );
};
