import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, FileText, Calendar, BookOpen, CheckCircle, HelpCircle, RefreshCw, X, ArrowRight,
  Copy, Check, Send, Award, Clock
} from 'lucide-react';
import { generateQuizAI, generateLessonSummaryAI, generateStudyPlanAI } from '../utils/ai';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';

interface AIStudyToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'am' | 'both';
  userApiKey?: string;
  enrolledSubjects: string[];
}

export default function AIStudyToolsModal({
  isOpen,
  onClose,
  language,
  userApiKey,
  enrolledSubjects = []
}: AIStudyToolsModalProps) {
  const isAmharic = language === 'am';
  const subjectsList = Array.isArray(enrolledSubjects) && enrolledSubjects.length > 0 ? enrolledSubjects : ['Emerging Technologies'];
  const defaultSubject = subjectsList[0];
  const [activeTool, setActiveTool] = useState<'quiz' | 'summary' | 'study_plan'>('quiz');

  // Tool 1: Quiz Generator State
  const [quizSubject, setQuizSubject] = useState(defaultSubject);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizCount, setQuizCount] = useState('5');
  const [quizLoading, setQuizLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [qIndex: number]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Tool 2: Summary & Formula Sheet State
  const [summarySubject, setSummarySubject] = useState(defaultSubject);
  const [summaryNotesInput, setSummaryNotesInput] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Tool 3: Study Plan Generator State
  const [planExamDate, setPlanExamDate] = useState('2026-10-15');
  const [planDailyHours, setPlanDailyHours] = useState('3');
  const [planLoading, setPlanLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Quiz Generation
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickChime();
    setQuizLoading(true);
    setGeneratedQuiz(null);
    setUserAnswers({});
    setQuizSubmitted(false);

    try {
      const topicToUse = quizTopic.trim() || quizSubject;
      const questions = await generateQuizAI(topicToUse, quizSubject, userApiKey || '', quizDifficulty, parseInt(quizCount, 10) || 5);
      setGeneratedQuiz(questions);
      playSuccessChime();
    } catch (err) {
      console.warn('[AI Tools] Quiz generation fallback:', err);
      playFailureChime();
    } finally {
      setQuizLoading(false);
    }
  };

  // Handle Summary Generation
  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryNotesInput.trim()) return;
    playClickChime();
    setSummaryLoading(true);
    setGeneratedSummary(null);

    try {
      const summary = await generateLessonSummaryAI(summarySubject, summaryNotesInput.trim(), userApiKey);
      setGeneratedSummary(summary);
      playSuccessChime();
    } catch (err) {
      console.warn('[AI Tools] Summary generation notice:', err);
      playFailureChime();
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handle Study Plan Generation
  const handleGenerateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickChime();
    setPlanLoading(true);
    setGeneratedPlan(null);

    try {
      const plan = await generateStudyPlanAI(enrolledSubjects, planExamDate, parseFloat(planDailyHours) || 3, userApiKey);
      setGeneratedPlan(plan);
      playSuccessChime();
    } catch (err) {
      console.warn('[AI Tools] Study plan generation notice:', err);
      playFailureChime();
    } finally {
      setPlanLoading(false);
    }
  };

  const copySummaryText = () => {
    if (!generatedSummary) return;
    navigator.clipboard.writeText(generatedSummary);
    setCopiedSummary(true);
    playClickChime();
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-[#0F172A] text-slate-100 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0A1128] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isAmharic ? 'የኤአይ የጥናት መሳሪያዎች ማዕከል' : 'AI Study Tools Suite'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAmharic ? 'የፈተና ጥያቄ፣ የማስታወሻ ማጠቃለያ እና የጥናት መርሃግብር በኤአይ ያዘጋጁ' : 'Generate quizzes, smart summaries, formula sheets & study schedules'}
              </p>
            </div>
          </div>

          <button
            onClick={() => { playClickChime(); onClose(); }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 pt-3 bg-[#0A1128]/50 border-b border-slate-800 shrink-0">
          <button
            onClick={() => { playClickChime(); setActiveTool('quiz'); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTool === 'quiz'
                ? 'border-amber-400 text-amber-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{isAmharic ? 'የፈተና አዘጋጅ' : 'AI Quiz Generator'}</span>
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTool('summary'); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTool === 'summary'
                ? 'border-amber-400 text-amber-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAmharic ? 'የማስታወሻ ማጠቃለያ' : 'Smart Lesson Summarizer'}</span>
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTool('study_plan'); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTool === 'study_plan'
                ? 'border-amber-400 text-amber-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{isAmharic ? 'የጥናት መርሃግብር' : 'AI Study Plan Schedule'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TOOL 1: QUIZ GENERATOR */}
          {activeTool === 'quiz' && (
            <div className="space-y-5">
              <form onSubmit={handleGenerateQuiz} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Subject</label>
                    <select
                      value={quizSubject}
                      onChange={(e) => setQuizSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      {enrolledSubjects.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Topic / Unit (Optional)</label>
                    <input
                      type="text"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder="e.g. Unit 3 Cloud Architecture or Photosynthesis"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="easy">Easy (Fundamentals)</option>
                      <option value="medium">Medium (University Level)</option>
                      <option value="hard">Hard (National Exam Standard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Questions Count</label>
                    <select
                      value={quizCount}
                      onChange={(e) => setQuizCount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="3">3 Questions</option>
                      <option value="5">5 Questions</option>
                      <option value="10">10 Questions</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={quizLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {quizLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Generating AI Practice Quiz...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Interactive Practice Quiz</span>
                    </>
                  )}
                </button>
              </form>

              {/* Render Generated Quiz */}
              {generatedQuiz && generatedQuiz.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">
                      AI Practice Quiz for {quizSubject} ({generatedQuiz.length} Questions)
                    </span>
                    {quizSubmitted && (
                      <span className="text-xs font-bold text-emerald-400">
                        Score: {Object.keys(userAnswers).filter(i => userAnswers[+i] === generatedQuiz[+i].correctAnswer).length} / {generatedQuiz.length}
                      </span>
                    )}
                  </div>

                  {generatedQuiz.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-white flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-[10px] shrink-0 font-mono">
                          {qIndex + 1}
                        </span>
                        <span>{q.question}</span>
                      </p>

                      <div className="space-y-2 pl-7">
                        {q.options.map((opt: string, optIndex: number) => {
                          const isSelected = userAnswers[qIndex] === opt;
                          const isCorrect = q.correctAnswer === opt;
                          let btnStyle = 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700';

                          if (quizSubmitted) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold';
                          }

                          return (
                            <button
                              key={optIndex}
                              disabled={quizSubmitted}
                              onClick={() => {
                                playClickChime();
                                setUserAnswers(prev => ({ ...prev, [qIndex]: opt }));
                              }}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between cursor-pointer ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && q.explanation && (
                        <div className="ml-7 p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg text-[11px] text-slate-300">
                          <strong className="text-amber-400">Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  {!quizSubmitted ? (
                    <button
                      onClick={() => {
                        playSuccessChime();
                        setQuizSubmitted(true);
                      }}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Answers & View Grade</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setGeneratedQuiz(null);
                        setQuizSubmitted(false);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset Quiz & Try Another Subject</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TOOL 2: SMART LESSON SUMMARIZER */}
          {activeTool === 'summary' && (
            <div className="space-y-5">
              <form onSubmit={handleGenerateSummary} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Select Subject Context</label>
                  <select
                    value={summarySubject}
                    onChange={(e) => setSummarySubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  >
                    {enrolledSubjects.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Paste Lesson Notes / Textbook Chapter Text</label>
                  <textarea
                    value={summaryNotesInput}
                    onChange={(e) => setSummaryNotesInput(e.target.value)}
                    placeholder="Paste raw notes or topic paragraphs here... AI will extract core formulas, definitions, and exam cheat-sheet summaries."
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={summaryLoading || !summaryNotesInput.trim()}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {summaryLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Summarizing Lesson Context...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Smart Summary & Key Formulas</span>
                    </>
                  )}
                </button>
              </form>

              {generatedSummary && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>AI Extracted Summary for {summarySubject}</span>
                    </span>
                    <button
                      onClick={copySummaryText}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                    {generatedSummary}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOOL 3: STUDY PLAN GENERATOR */}
          {activeTool === 'study_plan' && (
            <div className="space-y-5">
              <form onSubmit={handleGenerateStudyPlan} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target Exam / Milestone Date</label>
                    <input
                      type="date"
                      value={planExamDate}
                      onChange={(e) => setPlanExamDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Daily Study Target (Hours)</label>
                    <select
                      value={planDailyHours}
                      onChange={(e) => setPlanDailyHours(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="2">2 Hours / Day</option>
                      <option value="3">3 Hours / Day</option>
                      <option value="4">4 Hours / Day</option>
                      <option value="6">6 Hours / Day (Intensive Exam Prep)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-xs text-slate-300">
                  <p className="font-bold text-amber-400 mb-1">Enrolled Target Subjects ({enrolledSubjects.length}):</p>
                  <p className="text-[11px] text-slate-400">{enrolledSubjects.slice(0, 6).join(', ')}...</p>
                </div>

                <button
                  type="submit"
                  disabled={planLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {planLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Calculating Personal Study Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Generate Personal Exam Study Schedule</span>
                    </>
                  )}
                </button>
              </form>

              {generatedPlan && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>AI Scheduled Milestones</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                    {generatedPlan}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
