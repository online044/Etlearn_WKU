/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, BookOpen, Clock, ShieldCheck, Bookmark, Sparkles,
  Play, Timer, CheckCircle, PlusCircle, Sliders, ChevronLeft,
  ChevronRight, Layers, ArrowRight, Share2, Award, Zap,
  CheckCircle2, AlertCircle, BarChart2, Filter, Lock,
  ChevronDown, ChevronUp, Eye, EyeOff, Search
} from 'lucide-react';
import { ExamPaperSheet, ExamQuestion } from './UniversityExamsView';
import { playClickChime } from '../utils/audio';

export interface ExamDetailViewProps {
  activeSheet: ExamPaperSheet;
  onBackToBrowser: () => void;
  onStartStudy: () => void;
  onStartSimulation: () => void;
  onOpenQuestion: (questionIndex: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  language: 'en' | 'am';
  isProUser: boolean;
  onUpgrade: () => void;
  questionsTriedCount: number;
  freeTrialLimit: number;
  onGenerateMoreQuestions: () => void;
  isGeneratingQuestions: boolean;
  unitList: Array<{ unit: string; count: number }>;
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  chapterList: string[];
  selectedChapter: string;
  onSelectChapter: (chapter: string) => void;
  questionSourceFilter: 'all' | 'official' | 'generated';
  onSelectSourceFilter: (filter: 'all' | 'official' | 'generated') => void;
  orderMode: 'curriculum' | 'original';
  onToggleOrderMode: () => void;
  answeredQuestions: { [index: number]: number };
  visibleQuestions: ExamQuestion[];
}

export default function ExamDetailView({
  activeSheet,
  onBackToBrowser,
  onStartStudy,
  onStartSimulation,
  onOpenQuestion,
  isBookmarked,
  onToggleBookmark,
  language,
  isProUser,
  onUpgrade,
  questionsTriedCount,
  freeTrialLimit,
  onGenerateMoreQuestions,
  isGeneratingQuestions,
  unitList,
  selectedUnit,
  onSelectUnit,
  chapterList,
  selectedChapter,
  onSelectChapter,
  questionSourceFilter,
  onSelectSourceFilter,
  orderMode,
  onToggleOrderMode,
  answeredQuestions,
  visibleQuestions,
}: ExamDetailViewProps) {
  const [paletteChunkStart, setPaletteChunkStart] = useState(0);
  const [jumpInput, setJumpInput] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');

  // Source breakdown counts
  const officialCount = useMemo(() => {
    return activeSheet.questions.filter(q => (q.sourceType || 'official_past_exam') === 'official_past_exam').length;
  }, [activeSheet]);

  const practiceCount = useMemo(() => {
    return activeSheet.questions.filter(q => q.sourceType === 'ai_generated').length;
  }, [activeSheet]);

  const answeredCount = Object.keys(answeredQuestions).length;
  const progressPercent = activeSheet.questions.length > 0 
    ? Math.round((answeredCount / activeSheet.questions.length) * 100) 
    : 0;

  const handleShare = () => {
    playClickChime();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin} - ${activeSheet.title} (${activeSheet.university})`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const qNum = parseInt(jumpInput, 10);
    if (!isNaN(qNum) && qNum >= 1 && qNum <= visibleQuestions.length) {
      onOpenQuestion(qNum - 1);
    }
    setJumpInput('');
  };

  // Chunk pagination for 25 questions per slice
  const CHUNK_SIZE = 25;
  const totalChunks = Math.ceil(visibleQuestions.length / CHUNK_SIZE);
  const currentChunkIndex = Math.floor(paletteChunkStart / CHUNK_SIZE);

  // Filtered questions for the expanded browser
  const filteredVisibleQuestions = useMemo(() => {
    if (!questionSearch.trim()) return visibleQuestions;
    const term = questionSearch.toLowerCase().trim();
    return visibleQuestions.filter((q, idx) => {
      const numStr = (idx + 1).toString();
      return (
        numStr === term ||
        (q.qText && q.qText.toLowerCase().includes(term)) ||
        (q.subjectTopic && q.subjectTopic.toLowerCase().includes(term)) ||
        (q.unit && q.unit.toLowerCase().includes(term))
      );
    });
  }, [visibleQuestions, questionSearch]);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16 font-sans">
      {/* ========================================================================= */}
      {/* 🧭 NAVIGATION BREADCRUMB & UTILITY BAR                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#101A33] border border-white/10 rounded-2xl p-3 px-4 sm:px-5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { playClickChime(); onBackToBrowser(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>{language === 'am' ? 'ወደ ፈተናዎች ማውጫ' : 'Back to Exams'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>{language === 'am' ? 'ዩኒቨርሲቲ ፈተና' : 'Uni Exam'}</span>
            <span>/</span>
            <span className="text-amber-400 font-semibold">{activeSheet.subject}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pro / Trial / 100% Free Status */}
          {((activeSheet?.subject || '').toLowerCase().includes('bio') || (activeSheet?.subject || '').toLowerCase().includes('chem') || (activeSheet?.title || '').toLowerCase().includes('bio') || (activeSheet?.title || '').toLowerCase().includes('chem')) ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'am' ? '100% ነፃ ፈተና' : '100% Free'}</span>
            </div>
          ) : isProUser ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'am' ? 'ፕሮ አባል' : 'Pro Scholar'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>{language === 'am' ? 'ሙከራ' : 'Trial'}: {Math.min(questionsTriedCount, freeTrialLimit)}/{freeTrialLimit}</span>
              {questionsTriedCount >= freeTrialLimit && (
                <button
                  onClick={onUpgrade}
                  className="ml-1 text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                >
                  {language === 'am' ? 'አሳድግ' : 'Upgrade'}
                </button>
              )}
            </div>
          )}

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer relative"
            title="Share Exam"
          >
            <Share2 className="w-4 h-4" />
            {copiedToast && (
              <span className="absolute -bottom-8 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                {language === 'am' ? 'ተቀድቷል!' : 'Copied!'}
              </span>
            )}
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => { playClickChime(); onToggleBookmark(); }}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Bookmark Paper"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏛️ EXAM HERO BANNER & ACADEMIC SPECIFICATIONS (COMPACT & CLEAN)            */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121E3B] via-[#0E172E] to-[#101A33] border border-white/10 p-4 sm:p-5 shadow-2xl">
        {/* Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>{language === 'am' ? 'የተረጋገጠ ፈተና' : 'Official Paper'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-extrabold uppercase tracking-wider">
              {activeSheet.university}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono text-[11px] font-bold">
              {activeSheet.year}
            </span>
            {activeSheet.department && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px]">
                {activeSheet.department}
              </span>
            )}
          </div>

          {/* Exam Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight leading-snug">
              {activeSheet.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-1 mt-0.5">
              {language === 'am'
                ? `ይፋዊ የ${activeSheet.university} የፈተና ጥያቄዎች ከደረጃ በደረጃ ማብራሪያና የአማርኛ ትርጉም ጋር።`
                : `Verified past paper questions from ${activeSheet.university} with faculty solutions.`}
            </p>
          </div>

          {/* Key Metrics Strip (Sleek & Space-Efficient) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
            <div className="bg-[#101A33]/80 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'am' ? 'ጥያቄዎች' : 'Questions'}
              </span>
              <span className="text-base font-black text-amber-400 font-mono">
                {activeSheet.questions.length}
              </span>
            </div>
            <div className="bg-[#101A33]/80 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'am' ? 'ሰዓት' : 'Time'}
              </span>
              <span className="text-base font-black text-white font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeSheet.durationMinutes}m</span>
              </span>
            </div>
            <div className="bg-[#101A33]/80 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'am' ? 'ማለፊያ' : 'Pass'}
              </span>
              <span className="text-base font-black text-emerald-400 font-mono">
                85%+
              </span>
            </div>
            <div className="bg-[#101A33]/80 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'am' ? 'እድገት' : 'Progress'}
              </span>
              <span className="text-base font-black text-amber-300 font-mono">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚡ TWO DEDICATED STUDY MODES: INTERACTIVE STUDY vs TIMED SIMULATION        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Mode 1: Interactive Study (Compact Card) */}
        <div className="bg-[#101A33] border border-white/10 hover:border-amber-500/40 rounded-2xl p-4 sm:p-4.5 shadow-xl space-y-3 relative group transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  {language === 'am' ? 'የተመከረ ሁነታ' : 'Recommended Mode'}
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  {language === 'am' ? 'በይነተገናኝ የጥናት ሁነታ' : 'Interactive Study Mode'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-snug">
              {language === 'am'
                ? 'በራስዎ ፍጥነት ይለማመዱ። ለእያንዳንዱ ጥያቄ ፈጣን መልስ ማረጋገጫና የአማርኛ ማብራሪያ።'
                : 'Untimed practice with instant feedback, faculty step-by-step solutions & Amharic guidance.'}
            </p>

            {/* Compact inline tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{language === 'am' ? 'ፈጣን መልስ' : 'Instant Feedback'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium">
                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                <span>{language === 'am' ? 'ደረጃ በደረጃ' : 'Step-by-step'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium">
                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                <span>{language === 'am' ? 'አማርኛ' : 'Amharic'}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => { playClickChime(); onStartStudy(); }}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{language === 'am' ? 'በይነተገናኝ ጥናት ጀምር →' : 'Start Interactive Study →'}</span>
          </button>
        </div>

        {/* Mode 2: Timed Exam Simulation (Compact Card) */}
        <div className="bg-[#101A33] border border-white/10 hover:border-blue-500/40 rounded-2xl p-4 sm:p-4.5 shadow-xl space-y-3 relative group transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                  {language === 'am' ? 'ትክክለኛ የፈተና ሁኔታ' : 'Official Test Conditions'}
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  {language === 'am' ? 'በሰዓት የተገደበ የፈተና ሞዴል' : 'Timed Exam Simulation'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-snug">
              {language === 'am'
                ? 'የፈተና አዳራሽ ግፊትን ይለማመዱ። የቀጥታ ሰዓት ቆጣሪ፣ የመልስ መመዝገቢያና የውጤት ካርድ።'
                : 'Simulate university exam conditions with live timer, question flagging and scorecard.'}
            </p>

            {/* Compact inline tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-medium">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>{activeSheet.durationMinutes}m {language === 'am' ? 'ሰዓት' : 'Timer'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium">
                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                <span>{language === 'am' ? 'ጥያቄ ዝለል' : 'Flag & Review'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium">
                <BarChart2 className="w-3 h-3 text-blue-400" />
                <span>{language === 'am' ? 'ውጤት ካርድ' : 'Scorecard'}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => { playClickChime(); onStartSimulation(); }}
            className="w-full mt-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-white/20 hover:border-blue-500/50 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{language === 'am' ? 'በሰዓት የተገደበ ፈተና ጀምር ⏱️' : 'Start Timed Exam Simulation ⏱️'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎯 QUESTION SOURCE & UNIT FILTERING (COMPACT SINGLE ROW)                   */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-xl space-y-2.5">
        {/* Row 1: Exam Category Tabs in ONE Compact Horizontal Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center bg-[#0A1128] border border-white/10 p-1 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => { playClickChime(); onSelectSourceFilter('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                questionSourceFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'ሁሉም' : 'All Questions'} ({activeSheet.questions.length})
            </button>
            <button
              onClick={() => { playClickChime(); onSelectSourceFilter('official'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                questionSourceFilter === 'official'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'ይፋዊ ፈተና' : 'Official Exams'} ({officialCount})
            </button>
            <button
              onClick={() => { playClickChime(); onSelectSourceFilter('generated'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                questionSourceFilter === 'generated'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'ተጨማሪ ልምምድ' : 'Practice'} ({practiceCount})
            </button>
          </div>

          {/* Add Practice Questions Button */}
          <button
            onClick={() => { playClickChime(); onGenerateMoreQuestions(); }}
            disabled={isGeneratingQuestions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isGeneratingQuestions
                ? (language === 'am' ? 'እየተዘጋጀ ነው...' : 'Generating...')
                : (language === 'am' ? '+ ጥያቄ አክል' : '+ Add Questions')}
            </span>
          </button>
        </div>

        {/* Row 2: Unit Filters (Horizontally Scrollable) & Order Mode */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1 shrink-0">
              {language === 'am' ? 'ምዕራፍ:' : 'Units:'}
            </span>
            <button
              onClick={() => { playClickChime(); onSelectUnit('all'); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedUnit === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {language === 'am' ? 'ሁሉም' : 'All'}
            </button>
            {unitList.map(u => (
              <button
                key={u.unit}
                onClick={() => { playClickChime(); onSelectUnit(u.unit); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedUnit === u.unit
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <span>{u.unit}</span>
                <span className="text-[10px] opacity-70 bg-black/30 px-1 rounded">({u.count})</span>
              </button>
            ))}
          </div>

          {/* Curriculum Order Toggle */}
          <button
            onClick={() => { playClickChime(); onToggleOrderMode(); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-all cursor-pointer shrink-0"
            title="Toggle Question Order"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              {orderMode === 'curriculum'
                ? (language === 'am' ? 'በምዕራፍ' : 'Curriculum')
                : (language === 'am' ? 'ዋና ቅደም ተከተል' : 'Original')}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔢 QUESTION PALETTE NAVIGATION (COLLAPSIBLE WITH PROGRESSIVE DISCLOSURE) */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5 transition-all">
        {/* Palette Bar Header: Always Visible and Compact */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => { playClickChime(); setIsPaletteOpen(prev => !prev); }}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:border-amber-500/40">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {language === 'am' ? 'የጥያቄዎች ማውጫ' : 'Question Palette Navigation'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300 px-1.5 py-0.2 rounded">
                  {visibleQuestions.length}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {answeredCount > 0 ? `${answeredCount}/${visibleQuestions.length} ${language === 'am' ? 'ተመልሰዋል' : 'answered'}` : (language === 'am' ? 'ፈጣን መዳረሻ' : 'Quick jump palette')}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Quick Direct Jump Input */}
            <form onSubmit={handleJump} className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max={visibleQuestions.length}
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value)}
                placeholder="Q#"
                className="w-12 px-1.5 py-1 bg-black/40 border border-white/15 rounded-lg text-xs font-mono text-center text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/40 cursor-pointer"
              >
                {language === 'am' ? 'ሂድ' : 'Go'}
              </button>
            </form>

            {/* Toggle Expand/Collapse Button */}
            <button
              onClick={() => { playClickChime(); setIsPaletteOpen(prev => !prev); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isPaletteOpen
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <span>{isPaletteOpen ? (language === 'am' ? 'አሳንስ' : 'Collapse') : (language === 'am' ? 'ክፈት' : 'Expand Palette')}</span>
              {isPaletteOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Palette Grid Body */}
        <AnimatePresence>
          {isPaletteOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 pt-2.5 border-t border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px]">
                  {language === 'am'
                    ? `ጥያቄ ${paletteChunkStart + 1} - ${Math.min(paletteChunkStart + CHUNK_SIZE, visibleQuestions.length)} ከ ${visibleQuestions.length}`
                    : `Showing Questions ${paletteChunkStart + 1} - ${Math.min(paletteChunkStart + CHUNK_SIZE, visibleQuestions.length)} of ${visibleQuestions.length}`}
                </span>

                {/* Chunk Controls */}
                <div className="flex items-center gap-1 bg-[#0A1128] border border-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      playClickChime();
                      setPaletteChunkStart(Math.max(0, paletteChunkStart - CHUNK_SIZE));
                    }}
                    disabled={paletteChunkStart === 0}
                    className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-300 px-2 font-bold">
                    {currentChunkIndex + 1}/{totalChunks || 1}
                  </span>
                  <button
                    onClick={() => {
                      playClickChime();
                      if (paletteChunkStart + CHUNK_SIZE < visibleQuestions.length) {
                        setPaletteChunkStart(paletteChunkStart + CHUNK_SIZE);
                      }
                    }}
                    disabled={paletteChunkStart + CHUNK_SIZE >= visibleQuestions.length}
                    className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 25-Question Matrix */}
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-25 gap-1.5">
                {visibleQuestions.slice(paletteChunkStart, paletteChunkStart + CHUNK_SIZE).map((q, idx) => {
                  const actualIndex = paletteChunkStart + idx;
                  const isAnswered = answeredQuestions[actualIndex] !== undefined;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        playClickChime();
                        onOpenQuestion(actualIndex);
                      }}
                      className={`h-9 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer border ${
                        isAnswered
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-300'
                      }`}
                      title={`Question ${actualIndex + 1}: ${q.subjectTopic || ''}`}
                    >
                      {actualIndex + 1}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 📋 QUESTION BANK & PREVIEWS (PROGRESSIVE DISCLOSURE)                       */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>{language === 'am' ? 'የጥያቄዎች ባንክ እና ቅድመ እይታ' : 'Question Bank & Practice'}</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {visibleQuestions.length} {language === 'am' ? 'ጥያቄዎች ተዘጋጅተዋል' : 'Questions Ready for Practice'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear "Browse All Questions" Action Button */}
            <button
              onClick={() => { playClickChime(); setShowQuestionList(prev => !prev); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                showQuestionList
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-transparent shadow-md'
              }`}
            >
              {showQuestionList ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>
                {showQuestionList
                  ? (language === 'am' ? 'ዝርዝሩን አሳንስ' : 'Hide Question List')
                  : (language === 'am' ? `ሁሉንም ጥያቄዎች አስስ (${visibleQuestions.length})` : `Browse All Questions (${visibleQuestions.length})`)}
              </span>
            </button>
          </div>
        </div>

        {/* DEFAULT VIEW: Show only top 2 question previews if not expanded */}
        {!showQuestionList && (
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-1 gap-2">
              {visibleQuestions.slice(0, 2).map((q, idx) => {
                const isAnswered = answeredQuestions[idx] !== undefined;

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      playClickChime();
                      onOpenQuestion(idx);
                    }}
                    className="p-3 rounded-xl bg-[#0E162C] hover:bg-[#121E3D] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-lg font-mono text-xs font-black flex items-center justify-center shrink-0 border ${
                        isAnswered
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-300 group-hover:text-amber-300 group-hover:border-amber-500/30'
                      }`}>
                        {idx + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            {q.subjectTopic || activeSheet.subject}
                          </span>
                          {q.unit && (
                            <span className="text-[10px] text-slate-300 bg-white/5 px-1.5 py-0.2 rounded font-medium">
                              {q.unit}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                          {q.qText}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-slate-950 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                    >
                      <span>{language === 'am' ? 'ተለማመድ' : 'Practice'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Clear progressive disclosure expander prompt */}
            <button
              onClick={() => { playClickChime(); setShowQuestionList(true); }}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>
                {language === 'am'
                  ? `👇 ሁሉንም ${visibleQuestions.length} ጥያቄዎችና አማራጮች ለማየት ይጫኑ`
                  : `👇 Click to Browse All ${visibleQuestions.length} Questions & Explanations`}
              </span>
            </button>
          </div>
        )}

        {/* EXPANDED VIEW: Search bar and complete question browser */}
        <AnimatePresence>
          {showQuestionList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 pt-1 border-t border-white/10"
            >
              {/* Search Filter for Questions */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={e => setQuestionSearch(e.target.value)}
                  placeholder={language === 'am' ? 'በጥያቄዎች ወይም ምዕራፍ ውስጥ ፈልግ...' : 'Search in questions, topics or unit...'}
                  className="w-full pl-9 pr-4 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {questionSearch && (
                  <button
                    onClick={() => setQuestionSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Scrollable Questions List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredVisibleQuestions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    {language === 'am' ? 'ምንም የሚመሳሰል ጥያቄ አልተገኘም' : 'No matching questions found.'}
                  </div>
                ) : (
                  filteredVisibleQuestions.map((q, idx) => {
                    const actualIdx = visibleQuestions.indexOf(q);
                    const isAnswered = answeredQuestions[actualIdx >= 0 ? actualIdx : idx] !== undefined;

                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          playClickChime();
                          onOpenQuestion(actualIdx >= 0 ? actualIdx : idx);
                        }}
                        className="p-3 rounded-xl bg-[#0E162C] hover:bg-[#121E3D] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`w-7 h-7 rounded-lg font-mono text-xs font-black flex items-center justify-center shrink-0 border ${
                            isAnswered
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-slate-300 group-hover:text-amber-300 group-hover:border-amber-500/30'
                          }`}>
                            {(actualIdx >= 0 ? actualIdx : idx) + 1}
                          </span>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                {q.subjectTopic || activeSheet.subject}
                              </span>
                              {q.unit && (
                                <span className="text-[10px] text-slate-300 bg-white/5 px-1.5 py-0.2 rounded font-medium">
                                  {q.unit}
                                </span>
                              )}
                              {q.sourceType === 'ai_generated' && (
                                <span className="text-[9px] text-blue-300 bg-blue-500/10 px-1.5 py-0.2 rounded font-mono">
                                  Practice
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 group-hover:text-white transition-colors leading-relaxed">
                              {q.qText}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-slate-950 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                        >
                          <span>{language === 'am' ? 'ተለማመድ' : 'Practice'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Collapse Bottom Button */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => { playClickChime(); setShowQuestionList(false); }}
                  className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'ጥያቄዎችን አሳንስ' : 'Collapse Questions'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

