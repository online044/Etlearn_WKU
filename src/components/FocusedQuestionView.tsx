/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bookmark, CheckCircle2, XCircle,
  HelpCircle, Sparkles, Clock, Layers, ChevronLeft, ChevronRight,
  BookOpen, ShieldCheck, Flag, Check, RotateCcw, Award, Lightbulb
} from 'lucide-react';
import { UniversityQuestionItem } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';

export interface FocusedQuestionViewProps {
  paperTitle: string;
  university: string;
  subject: string;
  year?: string;
  question: UniversityQuestionItem;
  questionIndex: number;
  totalQuestions: number;
  selectedChoiceIndex: number | null;
  onSelectChoice: (index: number) => void;
  showFeedback: boolean;
  onCheckAnswer: () => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onJumpToQuestion: (index: number) => void;
  onBackToDetail: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  language: 'en' | 'am';
  isSimulation?: boolean;
  simulationTimeRemaining?: number;
  onFinishSimulation?: () => void;
}

export default function FocusedQuestionView({
  paperTitle,
  university,
  subject,
  year,
  question,
  questionIndex,
  totalQuestions,
  selectedChoiceIndex,
  onSelectChoice,
  showFeedback,
  onCheckAnswer,
  onNextQuestion,
  onPrevQuestion,
  onJumpToQuestion,
  onBackToDetail,
  isBookmarked,
  onToggleBookmark,
  language,
  isSimulation,
  simulationTimeRemaining,
  onFinishSimulation,
}: FocusedQuestionViewProps) {
  const [showStepSolution, setShowStepSolution] = useState(false);
  const [showAmharicExplanation, setShowAmharicExplanation] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);

  const isCorrect = selectedChoiceIndex !== null && selectedChoiceIndex === question.correctIndex;
  const isAnswered = selectedChoiceIndex !== null;

  // Format seconds to mm:ss
  const formatTimer = (secs?: number) => {
    if (secs === undefined) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* ========================================================================= */}
      {/* 🧭 TOP BAR: NAVIGATION, TITLE & ACTIONS                                   */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 bg-[#101A33] border border-white/10 rounded-2xl p-3.5 px-4 shadow-lg">
        <button
          onClick={() => { playClickChime(); onBackToDetail(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'am' ? 'ወደ ፈተና ዝርዝር' : 'Exam Details'}</span>
        </button>

        <div className="text-center hidden sm:block">
          <span className="text-xs font-bold text-white block truncate max-w-[280px]">
            {paperTitle}
          </span>
          <span className="text-[10px] text-amber-400 font-semibold block">
            {university} • {subject}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSimulation && simulationTimeRemaining !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-black text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{formatTimer(simulationTimeRemaining)}</span>
            </div>
          )}

          <button
            onClick={() => { playClickChime(); setShowPaletteDrawer(prev => !prev); }}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Question Palette"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{language === 'am' ? 'ጥያቄዎች' : 'Jump'}</span>
          </button>

          <button
            onClick={onToggleBookmark}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Bookmark Question"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 PROGRESS & QUESTION HEADER                                             */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs uppercase tracking-wider font-extrabold">
              {language === 'am' ? `ጥያቄ ${questionIndex + 1} ከ ${totalQuestions}` : `Question ${questionIndex + 1} of ${totalQuestions}`}
            </span>
            {question.subjectTopic && (
              <span className="text-slate-400 text-[11px] hidden sm:inline truncate max-w-[200px]">
                • {question.subjectTopic}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {Math.round(((questionIndex + 1) / totalQuestions) * 100)}% {language === 'am' ? 'ተጠናቋል' : 'completed'}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📝 QUESTION ARENA: STATEMENT & CHOICES                                    */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        {/* Topic Tag & Source Indicator */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              {question.subjectTopic || subject}
            </span>
            {question.year && (
              <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-white/5">
                {question.year}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>{language === 'am' ? 'የተረጋገጠ ፈተና' : 'Official Paper'}</span>
          </span>
        </div>

        {/* Large Readable Question Area */}
        <div className="text-base sm:text-lg md:text-xl font-medium text-white leading-relaxed whitespace-pre-line font-serif">
          {question.qText}
        </div>

        {/* Answer Choices List */}
        <div className="space-y-3 pt-2">
          {question.choices.map((choice, idx) => {
            const isSelected = selectedChoiceIndex === idx;
            const isChoiceCorrect = idx === question.correctIndex;
            const letter = letters[idx] || `${idx + 1}`;

            let choiceStyle = 'bg-[#0A1128] border-white/10 hover:border-amber-500/40 text-slate-200 hover:bg-[#0E1736]';

            if (showFeedback) {
              if (isChoiceCorrect) {
                choiceStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 font-bold';
              } else if (isSelected && !isChoiceCorrect) {
                choiceStyle = 'bg-red-500/15 border-red-500 text-red-200 ring-1 ring-red-500 font-bold';
              } else {
                choiceStyle = 'bg-[#0A1128] border-white/5 text-slate-400 opacity-60';
              }
            } else if (isSelected) {
              choiceStyle = 'bg-amber-500/15 border-amber-500 text-amber-200 ring-1 ring-amber-500 font-bold';
            }

            return (
              <button
                key={`choice_${idx}`}
                disabled={showFeedback}
                onClick={() => {
                  playClickChime();
                  onSelectChoice(idx);
                }}
                className={`w-full min-h-[54px] p-4 rounded-xl text-left text-xs sm:text-sm leading-relaxed transition-all flex items-start gap-3.5 border cursor-pointer select-none ${choiceStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs font-mono transition-colors ${
                    showFeedback
                      ? isChoiceCorrect
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : isSelected
                        ? 'bg-red-500 text-white font-black'
                        : 'bg-white/5 text-slate-400'
                      : isSelected
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-white/5 text-slate-300 border border-white/10'
                  }`}
                >
                  {letter}
                </div>

                <div className="flex-1 pt-0.5">
                  <span>{choice}</span>
                </div>

                {showFeedback && isChoiceCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {showFeedback && isSelected && !isChoiceCorrect && (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Check Answer Button (When not yet revealed) */}
        {!showFeedback && (
          <div className="pt-2">
            <button
              onClick={() => {
                if (isCorrect) playSuccessChime();
                else playFailureChime();
                onCheckAnswer();
              }}
              disabled={!isAnswered}
              className={`w-full py-3.5 px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isAnswered
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{language === 'am' ? 'መልሴን አረጋግጥ' : 'Check Answer'}</span>
            </button>
          </div>
        )}

        {/* Instant Verification Feedback Banner */}
        {showFeedback && (
          <div className="space-y-4 pt-2">
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div className="space-y-0.5">
                  <span className="font-bold text-xs sm:text-sm block">
                    {isCorrect
                      ? (language === 'am' ? '🎉 ትክክለኛ መልስ! ድንቅ ግንዛቤ።' : '🎉 Excellent! Correct Answer.')
                      : (language === 'am' ? '❌ ትክክል አልነበረም። ትክክለኛው መልስ ' + letters[question.correctIndex] + ' ነው።' : '❌ Incorrect. The correct option is ' + letters[question.correctIndex] + '.')}
                  </span>
                  <span className="text-[11px] opacity-80 block">
                    {language === 'am' ? 'ከስር ያሉትን ማብራሪያዎች በመመልከት ጽንሰ-ሀሳቡን ይረዱ።' : 'Examine the detailed step solution below to solidify the concept.'}
                  </span>
                </div>
              </div>

              {/* Solution Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStepSolution(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    showStepSolution
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white/10 hover:bg-white/15 text-slate-200'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{language === 'am' ? 'የደረጃ መፍትሔ' : 'Step Solution'}</span>
                </button>

                <button
                  onClick={() => setShowAmharicExplanation(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    showAmharicExplanation
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white/10 hover:bg-white/15 text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'በአማርኛ ማብራሪያ' : 'Amharic Notes'}</span>
                </button>
              </div>
            </div>

            {/* Step Solution Card */}
            {showStepSolution && (
              <div className="p-5 rounded-xl bg-[#0A1128] border border-amber-500/30 space-y-2 text-xs sm:text-sm leading-relaxed text-slate-200 font-sans shadow-inner">
                <div className="flex items-center gap-2 font-bold text-amber-300 pb-1 border-b border-white/5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>{language === 'am' ? 'የመምህራን ዝርዝር የደረጃ መፍትሔ (Step Solution)' : 'Faculty Step-by-Step Solution & Proof'}</span>
                </div>
                <div className="whitespace-pre-line text-slate-300 font-normal">
                  {question.solutionProof || question.explanation || 'Refer to the textbook chapter for derivation details.'}
                </div>
              </div>
            )}

            {/* Amharic Explanation Card */}
            {showAmharicExplanation && (
              <div className="p-5 rounded-xl bg-[#0A1128] border border-emerald-500/30 space-y-2 text-xs sm:text-sm leading-relaxed text-emerald-200 font-sans shadow-inner">
                <div className="flex items-center gap-2 font-bold text-emerald-300 pb-1 border-b border-white/5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>በአማርኛ የተብራራ ጽንሰ-ሀሳብ (Amharic Explanation)</span>
                </div>
                <div className="whitespace-pre-line text-emerald-100 font-normal">
                  {question.explanationAmharic || 'ይህንን ጥያቄ ለመመለስ በኮርሱ ማስታወሻ ላይ የተጠቀሱትን ዋና ዋና ነጥቦች መገንዘብ ያስፈልጋል።'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🧭 BOTTOM ACTION CONTROLS: PREVIOUS / NEXT                                */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-4 bg-[#101A33] border border-white/10 rounded-2xl p-4 shadow-lg">
        <button
          onClick={() => {
            playClickChime();
            onPrevQuestion();
          }}
          disabled={questionIndex === 0}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{language === 'am' ? 'ያለፈው ጥያቄ' : 'Previous Question'}</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-400 hidden sm:inline">
          {questionIndex + 1} / {totalQuestions}
        </span>

        {questionIndex < totalQuestions - 1 ? (
          <button
            onClick={() => {
              playClickChime();
              onNextQuestion();
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>{language === 'am' ? 'ቀጣይ ጥያቄ' : 'Next Question'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              playClickChime();
              if (isSimulation && onFinishSimulation) {
                onFinishSimulation();
              } else {
                onBackToDetail();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>{language === 'am' ? 'ፈተናውን አጠናቅቅ' : 'Finish Session'}</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📑 QUESTION JUMP PALETTE DRAWER / MODAL                                   */}
      {/* ========================================================================= */}
      {showPaletteDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101A33] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-white">
                  {language === 'am' ? 'ወደ ጥያቄ ዝለል' : 'Jump to Question'}
                </h3>
              </div>
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-72 overflow-y-auto pr-1">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isCurrent = idx === questionIndex;
                return (
                  <button
                    key={`jump_${idx}`}
                    onClick={() => {
                      playClickChime();
                      onJumpToQuestion(idx);
                      setShowPaletteDrawer(false);
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {language === 'am' ? 'ዝጋ' : 'Close Palette'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
