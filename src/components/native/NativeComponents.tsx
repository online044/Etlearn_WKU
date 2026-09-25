import React from 'react';
import { 
  ChevronRight, Lock, CheckCircle2, Star, Sparkles, BookOpen, Clock, 
  ArrowRight, Search, X, Award, FileText, Play, Check
} from 'lucide-react';
import { playClickChime } from '../../utils/audio';

// ─── 1. SUBJECT CHIP ───
export interface SubjectChipProps {
  label: string;
  isSelected?: boolean;
  isLocked?: boolean;
  count?: number;
  icon?: React.ReactNode;
  onClick: () => void;
}

export function SubjectChip({
  label,
  isSelected,
  isLocked,
  count,
  icon,
  onClick,
}: SubjectChipProps) {
  return (
    <button
      type="button"
      onClick={() => {
        playClickChime();
        onClick();
      }}
      className={`px-2.5 min-[360px]:px-3 py-1.5 min-[360px]:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border select-none ${
        isSelected
          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-sm shadow-amber-400/20'
          : 'bg-slate-850 bg-[#131D33] text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      {typeof count === 'number' && (
        <span className={`text-[9px] min-[360px]:text-[10px] px-1.5 py-0.2 rounded-md ${
          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
        }`}>
          {count}
        </span>
      )}
      {isLocked && <Lock className="w-3 h-3 text-amber-400 shrink-0 ml-0.5" />}
    </button>
  );
}

// ─── 2. QUICK ACTION TILE ───
export interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel?: string;
  badge?: string;
  colorTheme?: 'amber' | 'blue' | 'emerald' | 'purple';
  onClick: () => void;
}

export function QuickAction({
  icon: Icon,
  label,
  sublabel,
  badge,
  colorTheme = 'amber',
  onClick,
}: QuickActionProps) {
  const colorMap = {
    amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <button
      type="button"
      onClick={() => {
        playClickChime();
        onClick();
      }}
      className="p-3 rounded-xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between items-start text-left cursor-pointer group active:scale-[0.98] min-h-[80px] w-full"
    >
      <div className="flex items-center justify-between w-full mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[colorTheme]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {badge && (
          <span className="text-[9px] font-semibold text-slate-400">
            {badge}
          </span>
        )}
      </div>

      <div className="w-full">
        <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors leading-tight truncate w-full">
          {label}
        </h4>
        {sublabel && (
          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate w-full">
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── 3. COURSE CARD (Compact Mobile) ───
export interface CourseCardProps {
  title: string;
  subject: string;
  level?: string;
  progressPercentage?: number;
  completedLessons?: number;
  totalLessons?: number;
  onSelect: () => void;
  onResume?: () => void;
  language: 'en' | 'am' | 'both';
}

export function CourseCard({
  title,
  subject,
  level,
  progressPercentage = 0,
  completedLessons = 0,
  totalLessons = 10,
  onSelect,
  onResume,
  language,
}: CourseCardProps) {
  const isAmharic = language === 'am';

  return (
    <div 
      onClick={() => {
        playClickChime();
        onSelect();
      }}
      className="p-3.5 rounded-2xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
            {subject}
          </span>
          {level && (
            <span className="text-[10px] text-slate-400 font-medium">
              {level}
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[10.5px] text-slate-400 mb-1 font-medium">
          <span>{isAmharic ? 'ሂደት' : 'Progress'}</span>
          <span className="text-slate-200 font-bold">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── 4. PROGRESS METRIC CARD ───
export interface ProgressCardProps {
  streak: number;
  studyHours: number;
  completionRate: number;
  language: 'en' | 'am' | 'both';
}

export function ProgressCard({
  streak,
  studyHours,
  completionRate,
  language,
}: ProgressCardProps) {
  const isAmharic = language === 'am';

  return (
    <div className="p-2 min-[360px]:p-3 rounded-xl sm:rounded-2xl bg-[#111C35] border border-slate-800 grid grid-cols-3 gap-1.5 min-[360px]:gap-2 text-center select-none w-full">
      <div className="p-1.5 min-[360px]:p-2 rounded-lg sm:rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-col justify-center">
        <span className="text-sm min-[360px]:text-base sm:text-lg font-black text-amber-400 block leading-tight font-mono">
          🔥 {streak}
        </span>
        <span className="text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] text-slate-400 font-medium mt-0.5 block truncate leading-tight">
          {isAmharic ? 'ተከታታይነት' : 'Day Streak'}
        </span>
      </div>

      <div className="p-1.5 min-[360px]:p-2 rounded-lg sm:rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-col justify-center">
        <span className="text-sm min-[360px]:text-base sm:text-lg font-black text-blue-400 block leading-tight font-mono">
          ⏱️ {studyHours}h
        </span>
        <span className="text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] text-slate-400 font-medium mt-0.5 block truncate leading-tight">
          {isAmharic ? 'የጥናት ሰዓት' : 'Study Time'}
        </span>
      </div>

      <div className="p-1.5 min-[360px]:p-2 rounded-lg sm:rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-col justify-center">
        <span className="text-sm min-[360px]:text-base sm:text-lg font-black text-emerald-400 block leading-tight font-mono">
          📊 {completionRate}%
        </span>
        <span className="text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] text-slate-400 font-medium mt-0.5 block truncate leading-tight">
          {isAmharic ? 'የተጠናቀቀ' : 'Completed'}
        </span>
      </div>
    </div>
  );
}

// ─── 5. EXAM ROW (Past University Exam List Item) ───
export interface ExamRowProps {
  title: string;
  university?: string;
  year?: string;
  questionCount?: number;
  isPro?: boolean;
  onOpen: () => void;
  language: 'en' | 'am' | 'both';
}

export function ExamRow({
  title,
  university = 'Wolkite University',
  year = '2018 E.C.',
  questionCount = 50,
  isPro = false,
  onOpen,
  language,
}: ExamRowProps) {
  const isAmharic = language === 'am';

  return (
    <div className="p-2.5 min-[360px]:p-3 rounded-xl sm:rounded-2xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-2 sm:gap-3 group w-full">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <Award className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5" />
        </div>

        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors truncate">
            {title}
          </h4>
          <p className="text-[9.5px] min-[360px]:text-[10.5px] text-slate-400 truncate mt-0.5">
            {university} • {year}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {questionCount > 0 && (
          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded-lg">
            {questionCount} {isAmharic ? 'ጥያቄዎች' : 'Qns'}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            playClickChime();
            onOpen();
          }}
          className="px-2.5 min-[360px]:px-3 py-1.5 rounded-lg sm:rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[11px] sm:text-xs transition cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm shrink-0"
        >
          {isPro && <Lock className="w-3 h-3 text-slate-950" />}
          <span>{isAmharic ? 'ክፈት' : 'Open'}</span>
        </button>
      </div>
    </div>
  );
}

// ─── 6. SEARCH BAR ───
export interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-9 pr-9 bg-[#111C35] border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            if (onClear) onClear();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── 7. EMPTY STATE ───
export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = BookOpen,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="p-8 rounded-2xl bg-[#111C35]/60 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center my-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6 text-amber-400/80" />
      </div>

      <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={() => {
            playClickChime();
            onAction();
          }}
          className="mt-4 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition cursor-pointer active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── 8. LOADING SKELETON ───
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-2xl bg-[#111C35] border border-slate-800/80 p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="w-2/3 h-3 bg-slate-800 rounded" />
            <div className="w-1/3 h-2.5 bg-slate-800/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 9. PRO UPGRADE BANNER (Compact Android style) ───
export interface ProBannerProps {
  onUpgrade: () => void;
  language: 'en' | 'am' | 'both';
}

export function ProBanner({ onUpgrade, language }: ProBannerProps) {
  const isAmharic = language === 'am';

  return (
    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#111C35] to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md w-full">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 rounded-lg sm:rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
          <Star className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 fill-slate-950" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
            ET_LEARN <span className="text-amber-400 font-extrabold">PRO</span>
          </h4>
          <p className="text-[10px] min-[360px]:text-[11px] text-slate-300 mt-0.5 leading-snug">
            {isAmharic
              ? 'የሁሉም ዩኒቨርሲቲ ፈተናዎች፣ ማስታወሻዎች እና ያልተገደበ ልምምድ ያግኙ!'
              : 'Unlock all university past exams, notes & unlimited practice.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          playClickChime();
          onUpgrade();
        }}
        className="w-full sm:w-auto px-3.5 min-[360px]:px-4 py-2 rounded-lg sm:rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black transition cursor-pointer active:scale-95 shrink-0 text-center shadow-sm"
      >
        {isAmharic ? 'ወደ PRO አሳድግ' : 'Upgrade to PRO'}
      </button>
    </div>
  );
}

// ─── 10. PROFILE LIST ROW ───
export interface ProfileRowProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  badge?: string;
  isDestructive?: boolean;
  onClick: () => void;
}

export function ProfileRow({
  icon: Icon,
  title,
  subtitle,
  badge,
  isDestructive,
  onClick,
}: ProfileRowProps) {
  return (
    <button
      type="button"
      onClick={() => {
        playClickChime();
        onClick();
      }}
      className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer text-left ${
        isDestructive
          ? 'hover:bg-red-500/10 text-red-400'
          : 'hover:bg-slate-800/80 text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
          isDestructive
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <span className={`text-xs font-semibold block leading-tight truncate ${isDestructive ? 'text-red-400 font-bold' : 'text-slate-100'}`}>
            {title}
          </span>
          {subtitle && (
            <span className="text-[10.5px] text-slate-400 block truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
      </div>
    </button>
  );
}
