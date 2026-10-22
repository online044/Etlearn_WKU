import React from 'react';
import { X, Highlighter, Trash2, MessageSquare, Calendar } from 'lucide-react';
import { Highlight } from '../../types/notes';

interface HighlightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: Highlight[];
  onDeleteHighlight: (id: string) => void;
  language?: 'en' | 'am';
}

export const HighlightsModal: React.FC<HighlightsModalProps> = ({
  isOpen,
  onClose,
  highlights,
  onDeleteHighlight,
  language = 'en'
}) => {
  if (!isOpen) return null;

  const isAm = language === 'am';

  const getColorBadge = (color: Highlight['color']) => {
    switch (color) {
      case 'yellow':
        return 'bg-amber-400 text-slate-950 border-amber-500';
      case 'green':
        return 'bg-emerald-400 text-slate-950 border-emerald-500';
      case 'blue':
        return 'bg-blue-400 text-slate-950 border-blue-500';
      case 'pink':
        return 'bg-pink-400 text-slate-950 border-pink-500';
      case 'amber':
        return 'bg-orange-400 text-slate-950 border-orange-500';
      default:
        return 'bg-amber-400 text-slate-950 border-amber-500';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl text-slate-100 flex flex-col max-h-[80vh] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Highlighter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isAm ? 'ማስታወሻዎች እና ቀለም የተቀቡ ጥቅሶች' : 'Saved Highlights & Notes'}
              </h3>
              <p className="text-xs text-slate-400">
                {highlights.length} {isAm ? 'ጥቅሶች ተቀምጠዋል' : 'highlights in this note'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlights List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {highlights.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Highlighter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium">
                {isAm ? 'እስካሁን ምንም ጽሑፍ አልቀቡም' : 'No text highlighted yet.'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {isAm
                  ? 'በማንበብ ጊዜ ጽሑፍ መርጠው በቢጫ፣ አረንጓዴ ወይም ሰማያዊ ቀለም ምልክት ያድርጉበት'
                  : 'Select any text in the note to highlight it or add personal study comments.'}
              </p>
            </div>
          ) : (
            highlights.map((hl) => (
              <div
                key={hl.id}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getColorBadge(
                      hl.color
                    )}`}
                  >
                    {hl.color}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(hl.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onDeleteHighlight(hl.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete highlight"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {hl.selected_text && (
                  <p className="text-xs font-serif italic text-slate-200 border-l-2 border-amber-400 pl-2 py-0.5">
                    "{hl.selected_text}"
                  </p>
                )}

                {hl.comment && (
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{hl.comment}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 text-center bg-black/20">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
          >
            {isAm ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
