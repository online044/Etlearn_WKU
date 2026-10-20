import React from 'react';
import { X, Sun, Moon, Coffee, Eye, Type, AlignLeft, Check } from 'lucide-react';
import { ReaderSettings, ReaderTheme, ReaderFontFamily } from '../../types/notes';

interface ReadingControlsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  language?: 'en' | 'am';
}

export const ReadingControlsSheet: React.FC<ReadingControlsSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  language = 'en'
}) => {
  if (!isOpen) return null;

  const isAm = language === 'am';

  const themes: { id: ReaderTheme; label: string; amLabel: string; icon: React.ReactNode; bg: string; text: string; border: string }[] = [
    {
      id: 'dark',
      label: 'Dark',
      amLabel: 'ጨለማ',
      icon: <Moon className="w-4 h-4" />,
      bg: 'bg-[#0F172A]',
      text: 'text-slate-100',
      border: 'border-slate-700'
    },
    {
      id: 'light',
      label: 'Light',
      amLabel: 'ብርሃን',
      icon: <Sun className="w-4 h-4" />,
      bg: 'bg-white',
      text: 'text-slate-900',
      border: 'border-slate-300'
    },
    {
      id: 'sepia',
      label: 'Sepia',
      amLabel: 'ሴፒያ',
      icon: <Coffee className="w-4 h-4" />,
      bg: 'bg-[#F4ECD8]',
      text: 'text-[#433422]',
      border: 'border-[#DECFAF]'
    },
    {
      id: 'contrast',
      label: 'High Contrast',
      amLabel: 'ከፍተኛ ንፅፅር',
      icon: <Eye className="w-4 h-4" />,
      bg: 'bg-black',
      text: 'text-amber-400',
      border: 'border-amber-400'
    }
  ];

  const fontFamilies: { id: ReaderFontFamily; label: string; desc: string; sample: string }[] = [
    { id: 'system', label: 'Modern Sans', desc: 'Inter & Noto Ethiopic', sample: 'Aa / ሰላም' },
    { id: 'serif', label: 'Book Serif', desc: 'Georgia & Playfair', sample: 'Aa / መጽሐፍ' },
    { id: 'dyslexic', label: 'Dyslexia Friendly', desc: 'Lexend High-Legibility', sample: 'Aa / ጥናት' },
    { id: 'mono', label: 'Monospace', desc: 'JetBrains Code', sample: 'Aa / 01' }
  ];

  const lineHeights = [
    { value: 1.4, label: 'Compact' },
    { value: 1.7, label: 'Optimal' },
    { value: 2.0, label: 'Spacious' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#0F172A] border border-white/10 text-slate-100 p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {isAm ? 'የንባብ ማስተካከያ' : 'Reading Display Settings'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 pt-5">
          {/* 1. Theme Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
              {isAm ? 'ገጽታ (Theme)' : 'Color Theme'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {themes.map((t) => {
                const isSelected = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onUpdateSettings({ theme: t.id })}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                      t.bg
                    } ${t.text} ${
                      isSelected
                        ? 'ring-2 ring-amber-400 scale-[1.02] shadow-md border-transparent font-bold'
                        : `${t.border} opacity-85 hover:opacity-100`
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {t.icon}
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span>{isAm ? t.amLabel : t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Font Size Stepper & Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isAm ? 'የፊደል መጠን' : 'Font Size'}
              </label>
              <span className="text-sm font-bold text-amber-400">{settings.font_size}px</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdateSettings({ font_size: Math.max(14, settings.font_size - 1) })}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 flex items-center justify-center font-bold text-sm text-slate-200 transition-colors"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <input
                type="range"
                min={14}
                max={24}
                step={1}
                value={settings.font_size}
                onChange={(e) => onUpdateSettings({ font_size: Number(e.target.value) })}
                className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <button
                onClick={() => onUpdateSettings({ font_size: Math.min(24, settings.font_size + 1) })}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 flex items-center justify-center font-bold text-base text-slate-200 transition-colors"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>
          </div>

          {/* 3. Line Height / Spacing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isAm ? 'የመስመር ክፍተት' : 'Line Spacing'}
              </label>
              <span className="text-xs text-slate-400">{settings.line_height}x</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {lineHeights.map((lh) => {
                const isSelected = Math.abs(settings.line_height - lh.value) < 0.15;
                return (
                  <button
                    key={lh.value}
                    onClick={() => onUpdateSettings({ line_height: lh.value })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>{lh.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Font Family (Dyslexia Friendly, Serif, Sans, Mono) */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              {isAm ? 'የፊደል ቅርጽ (Typeface)' : 'Typeface'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fontFamilies.map((ff) => {
                const isSelected = settings.font_family === ff.id;
                return (
                  <button
                    key={ff.id}
                    onClick={() => onUpdateSettings({ font_family: ff.id })}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs text-white">{ff.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">{ff.desc}</span>
                    <span className="text-xs font-medium text-slate-400 mt-2">{ff.sample}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Done button */}
        <div className="pt-6 mt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-colors"
          >
            {isAm ? 'ቅንብሩን አጽድቅ' : 'Apply & Continue Reading'}
          </button>
        </div>
      </div>
    </div>
  );
};
