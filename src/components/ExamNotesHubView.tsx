import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Clipboard, FileText, Check, AlertCircle, HelpCircle, 
  ArrowLeft, RefreshCw, Bookmark, Sparkles, Award, Star, ListCollapse, ChevronRight
} from 'lucide-react';
import { 
  ENGLISH_SECTIONS, 
  EMERGING_TECH_SECTIONS, 
  PHILOSOPHY_MOCK_TEST, 
  GEOGRAPHY_SECTIONS, 
  MATH_SECTIONS,
  FillBlankQuestion,
  ReviewQuestion,
  MultiChoiceQuestion,
  TrueFalseQuestion
} from '../data/examPrepData';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';

interface ExamNotesHubViewProps {
  language: 'en' | 'am';
  onClose: () => void;
}

export default function ExamNotesHubView({ language, onClose }: ExamNotesHubViewProps) {
  const [activeTab, setActiveTab] = useState<'english' | 'emerging' | 'philosophy' | 'geography' | 'math'>('english');
  const [activeSubTab, setActiveSubTab] = useState<string>('reportedSpeech');

  // Fill in the Blank States
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [checkedAnswers, setCheckedAnswers] = useState<{ [qId: string]: boolean }>({});
  const [showAnswer, setShowAnswer] = useState<{ [qId: string]: boolean }>({});

  // Philosophy Test States
  const [philTrueFalseAnswers, setPhilTrueFalseAnswers] = useState<{ [qId: string]: boolean }>({});
  const [philMultiAnswers, setPhilMultiAnswers] = useState<{ [qId: string]: string }>({});
  const [philTested, setPhilTested] = useState(false);
  const [philScore, setPhilScore] = useState<number | null>(null);

  const handleTextAnswerChange = (qId: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleCheckAnswer = (qId: string, correctAnswers: string[]) => {
    const userVal = (userAnswers[qId] || '').trim().toLowerCase();
    const isCorrect = correctAnswers.some(ans => userVal === ans.toLowerCase());
    
    setCheckedAnswers(prev => ({ ...prev, [qId]: isCorrect }));
    setShowAnswer(prev => ({ ...prev, [qId]: true }));
    
    if (isCorrect) {
      playSuccessChime();
    } else {
      playFailureChime();
    }
  };

  const toggleShowAnswer = (qId: string) => {
    playClickChime();
    setShowAnswer(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handlePhilTFSelect = (qId: string, ans: boolean) => {
    if (philTested) return;
    playClickChime();
    setPhilTrueFalseAnswers(prev => ({ ...prev, [qId]: ans }));
  };

  const handlePhilMultiSelect = (qId: string, optionLetter: string) => {
    if (philTested) return;
    playClickChime();
    setPhilMultiAnswers(prev => ({ ...prev, [qId]: optionLetter }));
  };

  const gradePhilosophyTest = () => {
    playClickChime();
    let correctCount = 0;
    const totalQuestions = PHILOSOPHY_MOCK_TEST.trueFalse.length + PHILOSOPHY_MOCK_TEST.multipleChoice.length;

    // Grade True False
    PHILOSOPHY_MOCK_TEST.trueFalse.forEach(q => {
      if (philTrueFalseAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    // Grade Multiple Choice
    PHILOSOPHY_MOCK_TEST.multipleChoice.forEach(q => {
      if (philMultiAnswers[q.id] === q.correctOption) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / totalQuestions) * 100);
    setPhilScore(percent);
    setPhilTested(true);
    if (percent >= 70) {
      playSuccessChime();
    } else {
      playFailureChime();
    }
  };

  const resetPhilosophyTest = () => {
    playClickChime();
    setPhilTrueFalseAnswers({});
    setPhilMultiAnswers({});
    setPhilTested(false);
    setPhilScore(null);
  };

  const renderEnglishTab = () => {
    const currentSection = (ENGLISH_SECTIONS as any)[activeSubTab];
    if (!currentSection) return null;

    return (
      <div className="space-y-6">
        {/* Sub Navigation */}
        <div className="flex overflow-x-auto gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800 custom-scrollbar select-none">
          {Object.keys(ENGLISH_SECTIONS).map((key) => {
            const sec = (ENGLISH_SECTIONS as any)[key];
            const isActive = activeSubTab === key;
            return (
              <button
                key={key}
                onClick={() => { playClickChime(); setActiveSubTab(key); }}
                className={`px-4 py-2 rounded-xl text-xs font-serif font-extrabold tracking-wide uppercase transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-[#078930] text-white shadow-sm' 
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {sec.title}
              </button>
            );
          })}
        </div>

        {/* Notes Card */}
        <div className="rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
            <h3 className="text-lg font-bold font-serif text-slate-800 dark:text-zinc-150">
              {currentSection.title} — Key Concepts
            </h3>
          </div>
          <p className="text-sm italic text-slate-600 dark:text-zinc-350 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
            <strong>Key Rule:</strong> {currentSection.keyRule}
          </p>

          {/* Render Specific English Layout Tables */}
          {activeSubTab === 'reportedSpeech' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 uppercase font-mono">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Direct Speech</th>
                      <th className="px-4 py-2.5 font-bold">Reported Speech (Tense shift)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-300">
                    {currentSection.backshifts.map((b: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-2 font-mono">{b.direct}</td>
                        <td className="px-4 py-2 font-mono text-[#078930] dark:text-emerald-400 font-semibold">{b.reported}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 mt-4">Time & Place Changes</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {currentSection.timeChanges.map((t: any, index: number) => (
                  <div key={index} className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex justify-between font-mono">
                    <span className="text-slate-500">{t.direct}</span>
                    <span className="text-emerald-600 font-bold">→ {t.reported}</span>
                  </div>
                ))}
              </div>

              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 mt-4">Reported Questions & Commands</h4>
              <div className="space-y-2 text-xs">
                {currentSection.specialRules.map((s: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg border border-slate-150 dark:border-zinc-800">
                    <span className="block font-bold text-[#078930] dark:text-emerald-400 mb-1">{s.category}</span>
                    <span className="block text-slate-600 dark:text-zinc-300 leading-relaxed font-serif">{s.rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'relativeClauses' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 uppercase font-mono">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Pronoun</th>
                      <th className="px-4 py-2.5 font-bold">Used For</th>
                      <th className="px-4 py-2.5 font-bold">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-300">
                    {currentSection.pronouns.map((p: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-2 font-bold font-mono text-indigo-600 dark:text-indigo-400">{p.pronoun}</td>
                        <td className="px-4 py-2 font-mono text-slate-500">{p.usedFor}</td>
                        <td className="px-4 py-2 font-serif italic">{p.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 mt-4">Defining vs Non-Defining</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {currentSection.definingVsNon.map((d: any, index: number) => (
                  <div key={index} className="p-3.5 rounded-xl border border-slate-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
                    <span className="block font-bold text-slate-700 dark:text-zinc-200 mb-1">{d.type}</span>
                    <span className="block text-slate-500 dark:text-zinc-400 leading-relaxed font-serif">{d.rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'modals' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 uppercase font-mono">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Modal</th>
                      <th className="px-4 py-2.5 font-bold">Main Use</th>
                      <th className="px-4 py-2.5 font-bold">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-300">
                    {currentSection.modalsList.map((m: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-2 font-bold font-mono text-amber-600 dark:text-amber-400">{m.modal}</td>
                        <td className="px-4 py-2 font-mono text-slate-500">{m.use}</td>
                        <td className="px-4 py-2 font-serif italic">{m.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 mt-4">Negative Forms Notes</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {currentSection.notes.map((n: any, index: number) => (
                  <div key={index} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800">
                    <span className="font-mono font-bold text-red-600 dark:text-red-400 mr-2">{n.term}:</span>
                    <span className="font-serif text-slate-600 dark:text-zinc-300">{n.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'activePassive' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 uppercase font-mono">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Tense</th>
                      <th className="px-4 py-2.5 font-bold">Active Voice</th>
                      <th className="px-4 py-2.5 font-bold">Passive Voice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-300">
                    {currentSection.tenses.map((t: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{t.tense}</td>
                        <td className="px-4 py-2 font-serif italic text-slate-500">{t.active}</td>
                        <td className="px-4 py-2 font-serif italic text-[#078930] dark:text-emerald-400 font-semibold">{t.passive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 mt-4">Key Passive Notes</h4>
              <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-zinc-450 space-y-1.5 font-serif">
                {currentSection.notes.map((n: string, index: number) => (
                  <li key={index}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {activeSubTab === 'grammarCh1to5' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentSection.chapters.map((ch: any, index: number) => (
                  <div key={index} className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="block font-bold font-serif text-slate-800 dark:text-zinc-150 text-sm mb-1">{ch.name}</span>
                    <p className="text-xs font-sans text-slate-500 dark:text-zinc-400 leading-relaxed">{ch.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fill in the Blanks Practice Card */}
        <div className="rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <Clipboard className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="text-base font-extrabold font-serif text-slate-800 dark:text-zinc-100">
              Interactive Fill-in-the-Blank Practice
            </h3>
          </div>

          <div className="space-y-6 divide-y divide-slate-100 dark:divide-zinc-800">
            {currentSection.questions.map((q: FillBlankQuestion, idx: number) => {
              const checked = checkedAnswers[q.id];
              const isCorrect = checked === true;
              const isWrong = checked === false;
              const hasShown = showAnswer[q.id];

              return (
                <div key={q.id} className={`pt-6 first:pt-0 space-y-3`}>
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#078930] dark:text-emerald-400 px-2 py-0.5 rounded bg-[#078930]/10 shrink-0 mt-0.5">
                      Q {idx + 1}
                    </span>
                    <p className="text-sm font-serif text-slate-800 dark:text-zinc-200 leading-relaxed font-semibold">
                      {q.sentence}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      id={`input-english-${q.id}`}
                      placeholder={language === 'en' ? 'Type your answer here...' : 'እዚህ መልስዎን ይጻፉ...'}
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                      className={`h-10 px-3.5 rounded-xl border text-xs font-mono outline-none transition-all w-full max-w-sm ${
                        isCorrect 
                          ? 'border-[#078930] bg-[#078930]/5 text-[#078930] font-bold' 
                          : isWrong 
                          ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-150 focus:border-[#078930]'
                      }`}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCheckAnswer(q.id, q.blanks)}
                        className="h-10 px-4 rounded-xl bg-[#078930] hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Check
                      </button>
                      <button
                        onClick={() => toggleShowAnswer(q.id)}
                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-bold transition-all cursor-pointer"
                      >
                        {hasShown ? 'Hide Answer' : 'Show Answer'}
                      </button>
                    </div>
                  </div>

                  {hasShown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 text-xs text-slate-600 dark:text-zinc-350 space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5 font-mono text-[#078930] dark:text-emerald-400 font-extrabold">
                        <Check className="w-4 h-4" />
                        Correct Answer: {q.blanks.join(' / ')}
                      </div>
                      <p className="font-serif italic leading-relaxed text-slate-500">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderEmergingTab = () => {
    const currentSection = (EMERGING_TECH_SECTIONS as any)[activeSubTab];
    if (!currentSection) return null;

    return (
      <div className="space-y-6">
        {/* Sub Navigation */}
        <div className="flex overflow-x-auto gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800 custom-scrollbar select-none">
          {Object.keys(EMERGING_TECH_SECTIONS).map((key) => {
            const sec = (EMERGING_TECH_SECTIONS as any)[key];
            const isActive = activeSubTab === key;
            return (
              <button
                key={key}
                onClick={() => { playClickChime(); setActiveSubTab(key); }}
                className={`px-4 py-2 rounded-xl text-xs font-serif font-extrabold tracking-wide uppercase transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-[#078930] text-white shadow-sm' 
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {sec.title}
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div className="rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-zinc-800">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="text-base font-bold font-serif text-slate-800 dark:text-zinc-100">
              {currentSection.title} Overview
            </h3>
          </div>

          <p className="text-sm font-serif text-slate-600 dark:text-zinc-300 leading-relaxed">
            {currentSection.summary}
          </p>

          {activeSubTab === 'unit4' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#078930]/10 border border-[#078930]/20 rounded-xl">
                <span className="block font-bold text-emerald-800 dark:text-emerald-400 font-serif text-sm mb-1">
                  Core Formula: {currentSection.formula}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif mt-4">5 Key Features of IoT</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentSection.features.map((f: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-xs">{f.name}:</span>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif mt-4">IoT 4-Layer Architecture</h4>
              <div className="space-y-2.5">
                {currentSection.architecture.map((l: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-150 dark:border-zinc-800">
                    <span className="block font-bold text-[#078930] dark:text-emerald-400 mb-1">{l.layer}</span>
                    <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">{l.desc}</p>
                    <p className="text-slate-400 dark:text-zinc-500 mt-1 font-mono italic">Tech: {l.tech}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif mt-4">Evolution Timeline</h4>
              <div className="relative border-l-2 border-[#078930]/30 pl-4 ml-2 space-y-4">
                {currentSection.history.map((h: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#078930]" />
                    <span className="font-mono text-[10px] font-bold text-[#078930] bg-[#078930]/10 px-2 py-0.5 rounded">
                      {h.period}
                    </span>
                    <p className="text-slate-700 dark:text-zinc-300 mt-1.5 font-serif">{h.event}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'unit5' && (
            <div className="space-y-4 text-xs">
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif">VR vs AR vs MR - Comparison Matrix</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 uppercase font-mono">
                    <tr>
                      <th className="px-4 py-2.5">Technology</th>
                      <th className="px-4 py-2.5">Immersion level</th>
                      <th className="px-4 py-2.5">Reality Type</th>
                      <th className="px-4 py-2.5">Primary Hardware</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-300">
                    {currentSection.comparison.map((c: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-2 font-bold text-indigo-600 dark:text-indigo-400">{c.tech}</td>
                        <td className="px-4 py-2">{c.immersion}</td>
                        <td className="px-4 py-2">{c.reality}</td>
                        <td className="px-4 py-2 font-mono text-slate-400">{c.hardware}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif mt-4">3 Main Blocks of AR System</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentSection.architecture.map((a: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl">
                    <span className="block font-bold text-[#078930] dark:text-emerald-400 mb-2 font-serif">{a.part}</span>
                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">{a.function}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'unit6' && (
            <div className="space-y-4 text-xs">
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif">5 Basic Ethical Principles</h4>
              <div className="flex flex-wrap gap-2.5">
                {currentSection.principles.map((p: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-[#078930]/10 text-emerald-805 dark:text-emerald-400 font-mono font-bold">
                    🛡️ {p}
                  </span>
                ))}
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif mt-4">Digital Privacy Categories</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentSection.privacy.map((p: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-150 dark:border-zinc-800">
                    <span className="block font-bold text-indigo-600 dark:text-indigo-400 mb-1 font-serif">{p.category}</span>
                    <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif mt-4">Digital Privacy Principles</h4>
              <div className="space-y-2">
                {currentSection.principlesPrivacy.map((pp: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl flex items-start gap-2">
                    <span className="font-bold text-[#078930] dark:text-emerald-400 font-mono text-xs shrink-0 w-28">{pp.name}:</span>
                    <p className="text-slate-500 dark:text-zinc-400">{pp.mean}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'unit7' && (
            <div className="space-y-4 text-xs">
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-serif">A-Z of Emerging Domains</h4>
              <div className="space-y-3">
                {currentSection.techs.map((t: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-150 dark:border-zinc-800">
                    <span className="block font-bold text-slate-700 dark:text-zinc-200 mb-1 font-serif text-sm">{t.name}</span>
                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{t.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'cheatSheet' && (
            <div className="space-y-4 text-xs">
              <h4 className="text-sm font-bold text-[#C8962E] font-serif flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                Key Facts & Formulas Pocket Guide
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentSection.points.map((p: string, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-slate-700 dark:text-zinc-300 flex items-start gap-2.5">
                    <span className="text-[#C8962E] font-bold">★</span>
                    <span className="font-serif italic leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Self-Assessment Review Questions */}
        {activeSubTab !== 'cheatSheet' && (
          <div className="rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <HelpCircle className="w-5 h-5 text-[#C8962E] shrink-0" />
              <h3 className="text-base font-extrabold font-serif text-slate-800 dark:text-zinc-100">
                Self-Assessment Review Questions
              </h3>
            </div>

            <div className="space-y-4 divide-y divide-slate-100 dark:divide-zinc-800">
              {currentSection.questions.map((q: ReviewQuestion, idx: number) => {
                const hasShown = showAnswer[q.id];
                return (
                  <div key={q.id} className="pt-4 first:pt-0 space-y-2">
                    <p className="text-sm font-serif font-bold text-slate-800 dark:text-zinc-250">
                      Q {idx + 1}: {q.question}
                    </p>
                    <button
                      onClick={() => toggleShowAnswer(q.id)}
                      className="px-3 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-[10px] uppercase font-bold cursor-pointer"
                    >
                      {hasShown ? 'Hide Answer' : 'Show Answer'}
                    </button>

                    {hasShown && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs font-serif text-slate-600 dark:text-zinc-300 leading-relaxed"
                      >
                        <strong>Correct Answer:</strong> {q.answer}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPhilosophyTab = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-150 dark:border-zinc-800">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#078930] bg-[#078930]/10 px-2 py-0.5 rounded font-extrabold">
                {PHILOSOPHY_MOCK_TEST.institution}
              </span>
              <h3 className="text-lg font-serif font-extrabold text-slate-800 dark:text-zinc-100 mt-1">
                {PHILOSOPHY_MOCK_TEST.title}
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                {PHILOSOPHY_MOCK_TEST.department} | Time: {PHILOSOPHY_MOCK_TEST.allottedTime}
              </p>
            </div>

            {philScore !== null && (
              <div className="px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center shrink-0">
                <span className="block text-[10px] text-slate-400 dark:text-zinc-400 uppercase font-mono font-bold">Your Score</span>
                <span className="text-2xl font-serif font-extrabold text-indigo-600 dark:text-indigo-400">{philScore}%</span>
              </div>
            )}
          </div>

          {/* Part 1: True / False */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-2.5 py-1 rounded bg-[#078930] text-white font-mono text-[10px] uppercase tracking-wider font-bold mb-4">
                Part I: True or False Statements
              </span>

              <div className="space-y-5 divide-y divide-slate-100 dark:divide-zinc-800">
                {PHILOSOPHY_MOCK_TEST.trueFalse.map((q: TrueFalseQuestion, idx: number) => {
                  const userAns = philTrueFalseAnswers[q.id];
                  const hasAnswered = userAns !== undefined;
                  const isCorrect = userAns === q.correctAnswer;

                  return (
                    <div key={q.id} className="pt-5 first:pt-0 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-500 mt-0.5">{idx + 1}.</span>
                        <p className="text-sm font-serif font-semibold text-slate-800 dark:text-zinc-200">
                          {q.question}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePhilTFSelect(q.id, true)}
                          disabled={philTested}
                          className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                            userAns === true
                              ? 'bg-[#078930] text-white'
                              : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-150 dark:border-zinc-800 hover:bg-slate-100'
                          }`}
                        >
                          True
                        </button>
                        <button
                          onClick={() => handlePhilTFSelect(q.id, false)}
                          disabled={philTested}
                          className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                            userAns === false
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-150 dark:border-zinc-800 hover:bg-slate-100'
                          }`}
                        >
                          False
                        </button>
                      </div>

                      {philTested && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 text-xs text-slate-600 dark:text-zinc-350 space-y-1">
                          <div className="flex items-center gap-1.5 font-mono font-extrabold text-[#078930] dark:text-emerald-400">
                            {isCorrect ? '✅ Correct' : '❌ Incorrect'} — Correct answer is: {q.correctAnswer ? 'True' : 'False'}
                          </div>
                          <p className="font-serif italic leading-relaxed text-slate-500">
                            <strong>Reason:</strong> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Part 2: Multiple Choice */}
            <div className="pt-6 border-t border-slate-150 dark:border-zinc-800">
              <span className="inline-block px-2.5 py-1 rounded bg-[#078930] text-white font-mono text-[10px] uppercase tracking-wider font-bold mb-4">
                Part II: Choose the Best Answer
              </span>

              <div className="space-y-6 divide-y divide-slate-100 dark:divide-zinc-800">
                {PHILOSOPHY_MOCK_TEST.multipleChoice.map((q: MultiChoiceQuestion, idx: number) => {
                  const userAns = philMultiAnswers[q.id];
                  const isCorrect = userAns === q.correctOption;

                  return (
                    <div key={q.id} className="pt-6 first:pt-0 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-500 mt-0.5">{idx + 1}.</span>
                        <p className="text-sm font-serif font-semibold text-slate-800 dark:text-zinc-200">
                          {q.question}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 max-w-xl">
                        {q.options.map((opt, oIdx) => {
                          const optionLetter = opt.substring(0, 1);
                          const isSelected = userAns === optionLetter;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handlePhilMultiSelect(q.id, optionLetter)}
                              disabled={philTested}
                              className={`w-full p-2.5 rounded-xl text-xs font-serif text-left border transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-indigo-500 bg-indigo-500/5 text-indigo-950 dark:text-indigo-350 font-bold'
                                  : 'border-slate-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:border-[#078930]'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {philTested && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 text-xs text-slate-600 dark:text-zinc-350 space-y-1">
                          <div className="flex items-center gap-1.5 font-mono font-extrabold text-[#078930] dark:text-emerald-400">
                            {isCorrect ? '✅ Correct' : '❌ Incorrect'} — Correct choice: {q.correctOption}
                          </div>
                          <p className="font-serif italic leading-relaxed text-slate-500">
                            <strong>Reason:</strong> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-150 dark:border-zinc-800 flex justify-end gap-3">
            {philTested ? (
              <button
                onClick={resetPhilosophyTest}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-350 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake Quiz
              </button>
            ) : (
              <button
                onClick={gradePhilosophyTest}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                Grade Exam Paper
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGeographyTab = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-zinc-800">
            <BookOpen className="w-5 h-5 text-teal-600 shrink-0" />
            <h3 className="text-base font-bold font-serif text-slate-800 dark:text-zinc-100">
              Freshman Geography — Detailed Curriculum Notes
            </h3>
          </div>

          <div className="space-y-6">
            {Object.keys(GEOGRAPHY_SECTIONS).map((key) => {
              const sec = (GEOGRAPHY_SECTIONS as any)[key];
              return (
                <div key={key} className="space-y-4">
                  <h4 className="text-sm font-extrabold text-teal-600 font-serif uppercase tracking-wider border-l-4 border-teal-500 pl-2">
                    {sec.title}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sec.notes.map((n: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-2">
                        <span className="block font-bold text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wide font-mono">
                          {n.subtitle}
                        </span>
                        <p className="text-xs font-serif text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                          {n.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMathTab = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-zinc-800">
            <Bookmark className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="text-base font-bold font-serif text-slate-800 dark:text-zinc-100">
              {MATH_SECTIONS.title} — Proofs & Concept Cheatsheet
            </h3>
          </div>

          <div className="space-y-6">
            {MATH_SECTIONS.notes.map((n: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 space-y-3">
                <span className="block font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                  {n.subtitle}
                </span>
                <p className="text-xs font-serif text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {n.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 md:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mb-10" />

        <button
          onClick={() => { playClickChime(); onClose(); }}
          className="inline-flex items-center gap-1 text-xs text-emerald-200 hover:text-white font-mono uppercase font-bold tracking-wider mb-4 cursor-pointer bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/15 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        <span className="block text-[10px] uppercase font-mono tracking-widest text-emerald-300 font-extrabold">
          Exam Preparation · Study Center
        </span>
        <h1 className="text-2xl md:text-3xl font-serif font-extrabold tracking-tight mt-1">
          Ethiopian National Exam Notes Hub
        </h1>
        <p className="text-xs text-emerald-100 font-serif italic mt-1 max-w-xl opacity-90 leading-relaxed">
          Interactive study checklists, key definitions, timelines, fill-in-the-blank practice items, and self-assessment mock tests curated directly from your course syllabi.
        </p>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex overflow-x-auto sm:grid sm:grid-cols-5 gap-2 pb-1.5 bg-slate-50 dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-150 dark:border-zinc-800 custom-scrollbar select-none">
        <button
          onClick={() => { playClickChime(); setActiveTab('english'); setActiveSubTab('reportedSpeech'); }}
          className={`px-4 sm:px-3 py-2.5 rounded-xl text-center text-xs font-serif font-extrabold uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap sm:whitespace-normal shrink-0 ${
            activeTab === 'english'
              ? 'bg-[#078930] text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
          }`}
        >
          🇬🇧 English Grammar
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('emerging'); setActiveSubTab('unit4'); }}
          className={`px-4 sm:px-3 py-2.5 rounded-xl text-center text-xs font-serif font-extrabold uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap sm:whitespace-normal shrink-0 ${
            activeTab === 'emerging'
              ? 'bg-[#078930] text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
          }`}
        >
          🚀 Emerging Tech
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('philosophy'); }}
          className={`px-4 sm:px-3 py-2.5 rounded-xl text-center text-xs font-serif font-extrabold uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap sm:whitespace-normal shrink-0 ${
            activeTab === 'philosophy'
              ? 'bg-[#078930] text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
          }`}
        >
          ⚖️ Moral Philosophy
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('geography'); }}
          className={`px-4 sm:px-3 py-2.5 rounded-xl text-center text-xs font-serif font-extrabold uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap sm:whitespace-normal shrink-0 ${
            activeTab === 'geography'
              ? 'bg-[#078930] text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
          }`}
        >
          🌍 Geography Notes
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('math'); }}
          className={`px-4 sm:px-3 py-2.5 rounded-xl text-center text-xs font-serif font-extrabold uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap sm:whitespace-normal shrink-0 ${
            activeTab === 'math'
              ? 'bg-[#078930] text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
          }`}
        >
          📐 Freshman Math
        </button>
      </div>

      {/* Render the Active Tab Layout */}
      <div>
        {activeTab === 'english' && renderEnglishTab()}
        {activeTab === 'emerging' && renderEmergingTab()}
        {activeTab === 'philosophy' && renderPhilosophyTab()}
        {activeTab === 'geography' && renderGeographyTab()}
        {activeTab === 'math' && renderMathTab()}
      </div>
    </div>
  );
}
