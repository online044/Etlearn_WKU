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
  CheckCircle2, AlertCircle, BarChart2, Filter, Lock
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans">
      {/* ========================================================================= */}
      {/* 🧭 NAVIGATION BREADCRUMB & UTILITY BAR                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101A33] border border-white/10 rounded-2xl p-3.5 px-5 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { playClickChime(); onBackToBrowser(); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>{language === 'am' ? 'ወደ ፈተናዎች ማውጫ' : 'Back to Exam Browser'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>{language === 'am' ? 'ዩኒቨርሲቲ ፈተና' : 'Uni Exam'}</span>
            <span>/</span>
            <span className="text-amber-400 font-semibold">{activeSheet.subject}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Pro / Trial Status */}
          {isProUser ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'am' ? 'ፕሮ አባል' : 'Pro Scholar'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
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
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer relative"
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
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
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
      {/* 🏛️ EXAM HERO BANNER & ACADEMIC SPECIFICATIONS                              */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121E3B] via-[#0E172E] to-[#101A33] border border-white/10 p-6 sm:p-8 shadow-2xl">
        {/* Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'የተረጋገጠ ኦፊሴላዊ ፈተና' : 'Verified Official Exam'}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              {activeSheet.university}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono text-xs font-bold">
              {activeSheet.year}
            </span>
            {activeSheet.department && (
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs">
                {activeSheet.department}
              </span>
            )}
          </div>

          {/* Exam Title */}
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight leading-tight">
            {activeSheet.title}
          </h1>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            {language === 'am'
              ? `ይህ ፈተና የ${activeSheet.university} ይፋዊ የፈተና ጥያቄዎችን እና ተጨማሪ የማጠናከሪያ ልምምዶችን ይዟል። በይነተገናኝ የጥናት ሁነታ ደረጃ በደረጃ ማብራሪያዎችን ይከተሉ ወይም በሰዓት የተገደበ የፈተና ሞዴል ይውሰዱ።`
              : `Comprehensive exam suite for ${activeSheet.subject} from ${activeSheet.university}. Includes verified official past paper questions with complete step-by-step faculty solutions and authentic Amharic translations.`}
          </p>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10">
            <div className="bg-[#101A33]/80 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block font-medium">
                {language === 'am' ? 'ጠቅላላ ጥያቄዎች' : 'Total Questions'}
              </span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {activeSheet.questions.length}
              </span>
            </div>
            <div className="bg-[#101A33]/80 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block font-medium">
                {language === 'am' ? 'የተገመተ ሰዓት' : 'Estimated Time'}
              </span>
              <span className="text-lg font-black text-white font-mono flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{activeSheet.durationMinutes} min</span>
              </span>
            </div>
            <div className="bg-[#101A33]/80 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block font-medium">
                {language === 'am' ? 'የማለፊያ ደረጃ' : 'Academic Pass'}
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                85%+ Distinction
              </span>
            </div>
            <div className="bg-[#101A33]/80 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block font-medium">
                {language === 'am' ? 'የእርስዎ እድገት' : 'Your Progress'}
              </span>
              <span className="text-lg font-black text-amber-300 font-mono">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚡ TWO DEDICATED STUDY MODES: INTERACTIVE STUDY vs TIMED SIMULATION        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode 1: Interactive Study */}
        <div className="bg-[#101A33] border border-white/10 hover:border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-4 relative group transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                {language === 'am' ? 'የተመከረ ሁነታ' : 'Recommended Mode'}
              </span>
              <h3 className="text-lg font-bold text-white">
                {language === 'am' ? 'በይነተገናኝ የጥናት ሁነታ' : 'Interactive Study Mode'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'am'
              ? 'በራስዎ ፍጥነት ይለማመዱ። ለእያንዳንዱ ጥያቄ ፈጣን መልስ ማረጋገጫ፣ የደረጃ በደረጃ ማብራሪያ፣ የአማርኛ ትርጉም እና የአስጎብኚ AI ድጋፍ ያገኛሉ።'
              : 'Learn at your own pace. Instant answer checking, step-by-step walkthroughs, authentic Amharic explanations, and Asgobnyi AI Tutor guidance.'}
          </p>

          <ul className="space-y-2 text-xs text-slate-300 pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{language === 'am' ? 'ፈጣን መልስ ማረጋገጫ (Check Answer)' : 'Instant answer feedback & validation'}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{language === 'am' ? 'የአካዳሚክ ደረጃ በደረጃ ማብራሪያ' : 'Faculty step-by-step solution breakdowns'}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{language === 'am' ? 'የአማርኛ ማብራሪያ (Bilingual support)' : 'Bilingual Amharic concept translations'}</span>
            </li>
          </ul>

          <button
            onClick={() => { playClickChime(); onStartStudy(); }}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{language === 'am' ? 'በይነተገናኝ ጥናት ጀምር →' : 'Start Interactive Study →'}</span>
          </button>
        </div>

        {/* Mode 2: Timed Exam Simulation */}
        <div className="bg-[#101A33] border border-white/10 hover:border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-4 relative group transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Timer className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                {language === 'am' ? 'ትክክለኛ የፈተና ሁኔታ' : 'Official Test Conditions'}
              </span>
              <h3 className="text-lg font-bold text-white">
                {language === 'am' ? 'በሰዓት የተገደበ የፈተና ሞዴል' : 'Timed Exam Simulation'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'am'
              ? 'የፈተና አዳራሽ ግፊትን ይለማመዱ። የቀጥታ ሰዓት ቆጣሪ፣ የመልስ መመዝገቢያ እና በፈተና ማጠቃለያ ላይ አጠቃላይ የውጤት ካርድ።'
              : 'Simulate real university exam conditions. Real-time countdown timer, comprehensive scorecard, and speed/accuracy performance analysis.'}
          </p>

          <ul className="space-y-2 text-xs text-slate-300 pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{activeSheet.durationMinutes} {language === 'am' ? 'ደቂቃ የቀጥታ ሰዓት ቆጣሪ' : 'minute live countdown timer'}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{language === 'am' ? 'ጥያቄዎችን ዝለል እና ተመለስ' : 'Flag and return to difficult questions'}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{language === 'am' ? 'ኦፊሴላዊ የውጤት ካርድ (Scorecard)' : 'Official university grade scorecard'}</span>
            </li>
          </ul>

          <button
            onClick={() => { playClickChime(); onStartSimulation(); }}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-white/20 hover:border-amber-500/50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{language === 'am' ? 'በሰዓት የተገደበ ፈተና ጀምር ⏱️' : 'Start Timed Exam Simulation ⏱️'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎯 QUESTION SOURCE, CURRICULUM & GENERATOR TOOLBAR                        */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Question Source Tabs */}
          <div className="flex items-center bg-[#0A1128] border border-white/10 p-1 rounded-xl gap-1">
            <button
              onClick={() => { playClickChime(); onSelectSourceFilter('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                questionSourceFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'ሁሉም ጥያቄዎች' : 'All Questions'} ({activeSheet.questions.length})
            </button>
            <button
              onClick={() => { playClickChime(); onSelectSourceFilter('official'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                questionSourceFilter === 'official'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'ኦፊሴላዊ ፈተና' : 'Official Past Exams'} ({officialCount})
            </button>
            <button
              onClick={() => { playClickChime(); onSelectSourceFilter('generated'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                questionSourceFilter === 'generated'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'ተጨማሪ ልምምድ' : 'Supplementary Practice'} ({practiceCount})
            </button>
          </div>

          {/* Add Practice Questions Button */}
          <button
            onClick={() => { playClickChime(); onGenerateMoreQuestions(); }}
            disabled={isGeneratingQuestions}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>
              {isGeneratingQuestions
                ? (language === 'am' ? 'ጥያቄዎች እየተዘጋጁ ነው...' : 'Generating Questions...')
                : (language === 'am' ? '+ ተጨማሪ ልምምድ ጥያቄ አክል' : '+ Add Practice Questions')}
            </span>
          </button>
        </div>

        {/* Units & Ordering Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          {/* Unit Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-2xl scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1 shrink-0">
              {language === 'am' ? 'ምዕራፍ:' : 'Units:'}
            </span>
            <button
              onClick={() => { playClickChime(); onSelectUnit('all'); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-all cursor-pointer shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {orderMode === 'curriculum'
                ? (language === 'am' ? 'በምዕራፍ ተደራጅቷል' : 'Curriculum Ordered')
                : (language === 'am' ? 'ዋና ቅደም ተከተል' : 'Original Sequence')}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔢 QUESTION NAVIGATION MATRIX & PALETTE (CHUNKED BY 25)                    */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>{language === 'am' ? 'የጥያቄዎች ማውጫ' : 'Question Palette Navigation'}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {language === 'am'
                ? `ቀጥታ ወደ ማንኛውም ጥያቄ ለመሄድ ቁጥሩን ይጫኑ (ጥያቄ ${paletteChunkStart + 1} - ${Math.min(paletteChunkStart + CHUNK_SIZE, visibleQuestions.length)} ከ ${visibleQuestions.length})`
                : `Click any question number to open focused question solver (${paletteChunkStart + 1} - ${Math.min(paletteChunkStart + CHUNK_SIZE, visibleQuestions.length)} of ${visibleQuestions.length})`}
            </p>
          </div>

          {/* Jump Form & Chunk Controls */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleJump} className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max={visibleQuestions.length}
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value)}
                placeholder="Q#"
                className="w-14 px-2 py-1 bg-black/40 border border-white/15 rounded-lg text-xs font-mono text-center text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/40 cursor-pointer"
              >
                {language === 'am' ? 'ሂድ' : 'Jump'}
              </button>
            </form>

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
        </div>

        {/* 25-Question Grid */}
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
      </div>

      {/* ========================================================================= */}
      {/* 📋 CURRICULUM QUESTIONS PREVIEW LIST                                      */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-400" />
            <span>{language === 'am' ? 'የጥያቄዎች ቅድመ እይታ' : 'Questions Overview & Practice'}</span>
          </h3>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {visibleQuestions.length} {language === 'am' ? 'ጥያቄዎች ተገኝተዋል' : 'Questions in View'}
          </span>
        </div>

        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {visibleQuestions.map((q, idx) => {
            const isAnswered = answeredQuestions[idx] !== undefined;

            return (
              <div
                key={q.id}
                onClick={() => {
                  playClickChime();
                  onOpenQuestion(idx);
                }}
                className="p-3.5 rounded-xl bg-[#0E162C] hover:bg-[#121E3D] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`w-7 h-7 rounded-lg font-mono text-xs font-black flex items-center justify-center shrink-0 border ${
                    isAnswered
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-amber-300 group-hover:border-amber-500/30'
                  }`}>
                    {idx + 1}
                  </span>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        {q.subjectTopic || activeSheet.subject}
                      </span>
                      {q.unit && (
                        <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.2 rounded">
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
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
