import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Clock, CheckCircle, XCircle, AlertTriangle, Flag, ChevronRight, ChevronLeft, 
  RotateCcw, Sparkles, Bot, Filter, Check, ArrowRight, ArrowLeft, BarChart2, BookOpen, 
  HelpCircle, Eye, Share2, Layers, AlertCircle, RefreshCw
} from 'lucide-react';
import { ExamPaper, ExamQuestion, ExamAttemptRecord, StudentProfile, AITeacherContext } from '../types';
import { saveExamAttempt, fetchStudentExamAttempts } from '../utils/supabaseCourses';
import { 
  saveExamResultToFirestore, 
  fetchUserExamResultsFromFirestore, 
  fetchExamsFromFirestore, 
  fetchQuestionsForExamFromFirestore 
} from '../utils/firebaseStore';
import { playClickChime, playSuccessChime } from '../utils/audio';
import { fetchAllSupabaseQuestions } from '../utils/supabaseQuestions';
import { safeStorage } from '../utils/safeStorage';
import { getBuiltinExamPapersForEngine } from '../data/authenticExamSheets';

// Authentic exam papers repository (Available 100% offline & augmented with live Supabase questions)
export const ETHIOPIAN_EXAM_PAPERS: ExamPaper[] = getBuiltinExamPapersForEngine();

interface ExamEngineViewProps {
  profile: StudentProfile;
  apiKey: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onOpenAITutorWithContext: (context: AITeacherContext) => void;
  onStudyAction?: () => void;
}

export default function ExamEngineView({
  profile,
  apiKey,
  language,
  onNavigate,
  onOpenAITutorWithContext,
  onStudyAction
}: ExamEngineViewProps) {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examState, setExamState] = useState<'catalog' | 'active' | 'results'>('catalog');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: string }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [completedAttempt, setCompletedAttempt] = useState<ExamAttemptRecord | null>(null);
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'flagged'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [examPapers, setExamPapers] = useState<ExamPaper[]>(() => {
    let cached: ExamPaper[] = [];
    try {
      const raw = safeStorage.getItem('ethiolearn_cached_exam_engine_papers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) cached = parsed;
      }
    } catch {}

    const map = new Map<string, ExamPaper>();
    for (const b of ETHIOPIAN_EXAM_PAPERS) map.set(b.id, b);
    for (const c of cached) map.set(c.id, c);
    return Array.from(map.values());
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const userId = profile?.email || 'guest_user';

  // Load live questions from Supabase question table and generate university exam papers
  useEffect(() => {
    async function loadSupabaseExams() {
      try {
        const liveQuestions = await fetchAllSupabaseQuestions(true);
        if (liveQuestions && liveQuestions.length > 0) {
          const courseMap: Record<string, typeof liveQuestions> = {};
          liveQuestions.forEach(q => {
            const courseKey = q.course || q.subject || 'University Assessment';
            if (!courseMap[courseKey]) courseMap[courseKey] = [];
            courseMap[courseKey].push(q);
          });

          const dynamicPapers: ExamPaper[] = Object.entries(courseMap).map(([crs, qList]) => {
            const subj = qList[0]?.subject || crs;
            return {
              id: `supa_exam_${crs.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              title: `${crs} (${subj}) University Exam`,
              subject: subj,
              level: 'University',
              durationMinutes: Math.min(60, Math.max(20, Math.round(qList.length * 1.5))),
              totalQuestions: qList.length,
              passingScore: 60,
              instructions: `Official university examination questions pulled directly from the Supabase question bank for ${crs}. Select the best option.`,
              questions: qList.map((q, idx) => ({
                id: q.id || `q_${idx + 1}`,
                questionNumber: idx + 1,
                text: q.question_text || q.question,
                options: q.options && q.options.length > 0 ? q.options : ['True', 'False'],
                correctAnswer: q.correct_answer,
                explanation: q.explanation || `Correct answer is ${q.correct_answer}.`,
                subject: q.subject,
                topic: q.topic || q.unit || 'Core Curriculum'
              }))
            };
          });

          setExamPapers(prev => {
            const map = new Map<string, ExamPaper>();
            for (const p of prev) map.set(p.id, p);
            for (const d of dynamicPapers) map.set(d.id, d);
            const merged = Array.from(map.values());
            try {
              safeStorage.setItem('ethiolearn_cached_exam_engine_papers', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Could not load dynamic exam papers from Supabase:', err);
      }
    }
    loadSupabaseExams();
  }, []);

  // Load past attempts from local cache, Firestore, and Supabase
  useEffect(() => {
    async function loadPastAttempts() {
      // 1. Immediately display cached attempts for instant offline review
      const localAttemptsStr = safeStorage.getItem(`ethiolearn_exam_attempts_${userId}`);
      if (localAttemptsStr) {
        try {
          const parsed = JSON.parse(localAttemptsStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPastAttempts(parsed);
          }
        } catch {}
      }

      try {
        const firestoreResults = await fetchUserExamResultsFromFirestore(userId);
        if (firestoreResults && firestoreResults.length > 0) {
          const mapped: ExamAttemptRecord[] = firestoreResults.map(r => ({
            id: r.id,
            userId: r.userId,
            examId: r.examId,
            examTitle: r.examTitle,
            subject: r.subject,
            score: r.score,
            totalQuestions: r.totalQuestions,
            percentage: r.percentage,
            grade: r.grade as any,
            isPassed: r.isPassed,
            timeSpentSeconds: r.timeSpentSeconds,
            userAnswers: r.userAnswers,
            flaggedQuestions: r.flaggedQuestions,
            weakTopics: r.weakTopics,
            incorrectQuestions: r.incorrectQuestions,
            date: r.createdAt
          }));
          setPastAttempts(mapped);
          try {
            safeStorage.setItem(`ethiolearn_exam_attempts_${userId}`, JSON.stringify(mapped));
          } catch {}
          return;
        }
        const history = await fetchStudentExamAttempts(userId);
        if (history && history.length > 0) {
          setPastAttempts(history);
          try {
            safeStorage.setItem(`ethiolearn_exam_attempts_${userId}`, JSON.stringify(history));
          } catch {}
        }
      } catch (err) {
        console.warn('Error loading past attempts (offline fallback active):', err);
      }
    }
    loadPastAttempts();
  }, [userId]);

  // Current active exam object
  const activeExam = useMemo(() => {
    return examPapers.find(e => e.id === selectedExamId) || null;
  }, [examPapers, selectedExamId]);

  // Active question
  const currentQuestion = useMemo(() => {
    if (!activeExam || !activeExam.questions || activeExam.questions.length === 0) return null;
    return activeExam.questions[currentQuestionIndex] || activeExam.questions[0];
  }, [activeExam, currentQuestionIndex]);

  // Countdown timer handler during active exam
  useEffect(() => {
    if (examState !== 'active' || secondsRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examState, secondsRemaining]);

  // Start Exam
  const handleStartExam = (exam: ExamPaper) => {
    playClickChime();
    setSelectedExamId(exam.id);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions([]);
    setSecondsRemaining((exam.durationMinutes || 30) * 60);
    setExamState('active');
  };

  // Select option for current question
  const handleSelectOption = (questionId: string, option: string) => {
    playClickChime();
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  // Toggle Flag question
  const handleToggleFlag = (questionId: string) => {
    playClickChime();
    setFlaggedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      }
      return [...prev, questionId];
    });
  };

  // Submit Exam & Grade
  const handleSubmitExam = async () => {
    if (!activeExam) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setShowSubmitModal(false);

    let score = 0;
    const incorrectQuestions: any[] = [];
    const weakTopicsSet = new Set<string>();

    activeExam.questions.forEach(q => {
      const selected = userAnswers[q.id];
      if (selected === q.correctAnswer) {
        score += 1;
      } else {
        incorrectQuestions.push({
          questionId: q.id,
          questionText: q.text,
          userAnswer: selected || 'Not answered',
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic || activeExam.subject
        });
        if (q.topic) weakTopicsSet.add(q.topic);
      }
    });

    const totalQuestions = activeExam.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const isPassed = percentage >= (activeExam.passingScore || 60);

    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (percentage >= 85) grade = 'A';
    else if (percentage >= 75) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const totalDurationSeconds = (activeExam.durationMinutes || 30) * 60;
    const timeSpentSeconds = Math.max(1, totalDurationSeconds - secondsRemaining);

    const attemptRecord: ExamAttemptRecord = {
      id: `attempt_${Date.now()}`,
      userId,
      examId: activeExam.id,
      examTitle: activeExam.title,
      subject: activeExam.subject,
      score,
      totalQuestions,
      percentage,
      grade,
      isPassed,
      timeSpentSeconds,
      userAnswers,
      flaggedQuestions,
      weakTopics: Array.from(weakTopicsSet),
      incorrectQuestions,
      date: new Date().toISOString()
    };

    setCompletedAttempt(attemptRecord);
    setExamState('results');

    if (isPassed) {
      playSuccessChime();
    } else {
      playClickChime();
    }

    if (onStudyAction) onStudyAction();

    // Persist attempt locally to safeStorage so it survives offline reloads
    try {
      const updatedAttempts = [attemptRecord, ...pastAttempts];
      setPastAttempts(updatedAttempts);
      safeStorage.setItem(`ethiolearn_exam_attempts_${userId}`, JSON.stringify(updatedAttempts));
    } catch (e) {
      console.warn('Error caching exam attempt locally:', e);
      setPastAttempts(prev => [attemptRecord, ...prev]);
    }

    // Persist attempt to Firestore and Supabase when network is reachable
    try {
      await saveExamResultToFirestore({
        userId,
        examId: activeExam.id,
        examTitle: activeExam.title,
        subject: activeExam.subject,
        score,
        totalQuestions,
        percentage,
        grade,
        isPassed,
        timeSpentSeconds,
        userAnswers,
        flaggedQuestions,
        weakTopics: Array.from(weakTopicsSet),
        incorrectQuestions
      });
      await saveExamAttempt(attemptRecord, userId);
    } catch (e) {
      console.warn('Error recording exam attempt to Firestore/Supabase (offline mode active):', e);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  // Format Time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Remediation: Send Mistakes to AI Teacher
  const handleAskAIAboutMistakes = () => {
    if (!completedAttempt || !activeExam) return;
    playClickChime();

    const mistakeSummary = completedAttempt.incorrectQuestions
      .slice(0, 5)
      .map((q, idx) => `${idx + 1}. Question: ${q.questionText}\nMy Answer: ${q.userAnswer}\nCorrect Answer: ${q.correctAnswer}\nExplanation: ${q.explanation}`)
      .join('\n\n');

    onOpenAITutorWithContext({
      mode: 'exam_feedback',
      courseTitle: activeExam.title,
      lessonTitle: `Exam Review: ${completedAttempt.score}/${completedAttempt.totalQuestions} (${completedAttempt.percentage}%)`,
      lessonContent: `Student took exam '${activeExam.title}'. Score: ${completedAttempt.score}/${completedAttempt.totalQuestions}. Grade: ${completedAttempt.grade}.\n\nHere are the questions missed:\n${mistakeSummary}\n\nPlease explain why these answers were incorrect and teach the fundamental concepts in simple terms with Ethiopian academic analogies.`,
      subject: activeExam.subject
    });
  };

  // Filtered Review Questions
  const filteredReviewQuestions = useMemo(() => {
    if (!activeExam || !completedAttempt) return [];
    return activeExam.questions.filter(q => {
      const selected = completedAttempt.userAnswers[q.id];
      const isCorrect = selected === q.correctAnswer;
      const isFlagged = completedAttempt.flaggedQuestions.includes(q.id);

      if (reviewFilter === 'incorrect') return !isCorrect;
      if (reviewFilter === 'correct') return isCorrect;
      if (reviewFilter === 'flagged') return isFlagged;
      return true;
    });
  }, [activeExam, completedAttempt, reviewFilter]);

  // ==========================================================================
  // VIEW 1: EXAM CATALOG & HISTORY
  // ==========================================================================
  if (examState === 'catalog') {
    const filteredPapers = examPapers.filter(p => 
      selectedSubjectFilter === 'All' || p.subject === selectedSubjectFilter || p.level === selectedSubjectFilter
    );

    const availableTags = Array.from(new Set([
      'All', 
      'Grade 12', 
      'University', 
      ...examPapers.map(p => p.subject).filter(Boolean)
    ]));

    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 text-slate-100 min-h-screen">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/20 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Award className="w-3.5 h-3.5" />
                  {language === 'am' ? 'የብሔራዊና የዩኒቨርሲቲ ፈተናዎች ማዕከል' : 'Authentic National & University Exams'}
                </span>
                <span className="text-xs text-slate-400">
                  {examPapers.length} {language === 'am' ? 'ፈተናዎች ዝግጁ ናቸው' : 'Exam Papers Ready'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {language === 'am' ? 'የፈተና መለማመጃ እና መመዘኛ ሲስተም' : 'Timed Assessment & Exam System'}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {language === 'am'
                  ? 'የ12ኛ ክፍል የማትሪክ እና የዩኒቨርሲቲ ሚድ/ፋይናል ፈተናዎችን በጊዜ ገደብ ውሰድ፣ ፈጣን ውጤት እና ከAI Teacher ጋር የተሳሰረ የስህተት ማብራሪያ አግኝ።'
                  : 'Take real timed exams with interactive question navigation, automated grading, and instant AI mistake remediation.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('bookstore')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                {language === 'am' ? 'መጻሕፍት እና ማስታወሻዎች' : 'Books & Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                playClickChime();
                setSelectedSubjectFilter(tag);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedSubjectFilter === tag
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700'
              }`}
            >
              {tag === 'All' ? (language === 'am' ? 'ሁሉም ፈተናዎች' : 'All Exams') : tag}
            </button>
          ))}
        </div>

        {/* Exam Papers Grid */}
        {filteredPapers.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 mb-12">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">
              {language === 'am' ? 'ምንም የተገኘ የፈተና ወረቀት የለም' : 'No matching exam papers found'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'am' ? 'የፈተና ጥያቄዎች ከSupabase Question Bank እየተጫኑ ነው።' : 'Loading or filter out questions from Supabase question bank.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-amber-500/5 transition duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {paper.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {paper.level}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                    {paper.instructions}
                  </p>

                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800/80 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{paper.durationMinutes} {language === 'am' ? 'ደቂቃዎች' : 'Minutes'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{paper.questions.length} {language === 'am' ? 'ጥያቄዎች' : 'Questions'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartExam(paper)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 group"
                >
                  <span>{language === 'am' ? 'ፈተናውን ጀምር' : 'Start Exam Now'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Past Exam History */}
        {pastAttempts.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              {language === 'am' ? 'የቅርብ ጊዜ የፈተና ውጤቶችህ' : 'Your Recent Exam Attempts'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">{language === 'am' ? 'ፈተና' : 'Exam Title'}</th>
                    <th className="p-3">{language === 'am' ? 'ትምህርት' : 'Subject'}</th>
                    <th className="p-3 text-center">{language === 'am' ? 'ውጤት' : 'Score'}</th>
                    <th className="p-3 text-center">{language === 'am' ? 'ደረጃ' : 'Grade'}</th>
                    <th className="p-3 text-center">{language === 'am' ? 'ሁኔታ' : 'Status'}</th>
                    <th className="p-3 text-right">{language === 'am' ? 'ቀን' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pastAttempts.slice(0, 5).map((att) => (
                    <tr key={att.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 font-semibold text-white">{att.examTitle || att.exam_title}</td>
                      <td className="p-3 text-amber-400/90">{att.subject}</td>
                      <td className="p-3 text-center font-bold">
                        {att.score} / {att.totalQuestions || att.total_questions} ({att.percentage}%)
                      </td>
                      <td className="p-3 text-center font-extrabold text-amber-400">{att.grade}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          att.isPassed || att.is_passed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {att.isPassed || att.is_passed ? 'PASSED' : 'RETRY'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400">
                        {new Date(att.date || att.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: ACTIVE TIMED EXAM INTERFACE
  // ==========================================================================
  if (examState === 'active' && activeExam && currentQuestion) {
    const totalQ = activeExam.questions.length;
    const answeredCount = Object.keys(userAnswers).length;
    const isUrgent = secondsRemaining < 300; // < 5 minutes
    const isCritical = secondsRemaining < 60; // < 1 minute
    const isFlagged = flaggedQuestions.includes(currentQuestion.id);

    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 text-slate-100 min-h-screen flex flex-col justify-between">
        {/* Top Floating Action & Timer Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {activeExam.subject}
            </span>
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
              {activeExam.title}
            </span>
          </div>

          {/* Real-time Countdown Timer */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-xl border text-sm font-mono font-bold flex items-center gap-2 transition ${
              isCritical
                ? 'bg-rose-500/20 text-rose-400 border-rose-500 animate-pulse'
                : isUrgent
                ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition"
            >
              {language === 'am' ? 'ፈተናውን አስረክብ' : 'Finish & Submit'}
            </button>
          </div>
        </div>

        {/* Main Grid: Left Question Pane + Right Palette Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Active Question Display (8 Cols on LG) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative">
              {/* Question Header Status */}
              <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {language === 'am' ? 'ጥያቄ' : 'Question'} {currentQuestionIndex + 1} / {totalQ}
                  </span>
                  {currentQuestion.topic && (
                    <span className="text-[11px] text-slate-400 px-2 py-0.5 bg-slate-800 rounded">
                      {currentQuestion.topic}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    isFlagged
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {isFlagged
                    ? (language === 'am' ? 'ምልክት ተደርጎበታል' : 'Flagged')
                    : (language === 'am' ? 'ምልክት አድርግ' : 'Flag for Review')}
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-base md:text-lg font-bold text-white mb-6 leading-relaxed">
                {currentQuestion.text}
              </h2>

              {/* Options Radio List */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                  const isSelected = userAnswers[currentQuestion.id] === option;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQuestion.id, option)}
                      className={`w-full text-left p-4 rounded-xl text-xs md:text-sm font-medium flex items-start gap-3 transition ${
                        isSelected
                          ? 'bg-amber-500/20 text-white border-2 border-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {letter}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={() => {
                    playClickChime();
                    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
                  }}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {language === 'am' ? 'ያለፈው' : 'Previous'}
                </button>

                {userAnswers[currentQuestion.id] && (
                  <button
                    onClick={() => {
                      playClickChime();
                      const updated = { ...userAnswers };
                      delete updated[currentQuestion.id];
                      setUserAnswers(updated);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    {language === 'am' ? 'ምርጫን አጽዳ' : 'Clear Choice'}
                  </button>
                )}

                {currentQuestionIndex < totalQ - 1 ? (
                  <button
                    onClick={() => {
                      playClickChime();
                      setCurrentQuestionIndex(currentQuestionIndex + 1);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
                  >
                    {language === 'am' ? 'ቀጣይ' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                  >
                    {language === 'am' ? 'ጨርስና አስረክብ' : 'Review & Submit'}
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Question Palette Grid (4 Cols on LG) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                <span>{language === 'am' ? 'የጥያቄዎች ካርታ' : 'Question Palette'}</span>
                <span className="text-xs text-slate-400 font-normal">
                  {answeredCount}/{totalQ} {language === 'am' ? 'የተመለሱ' : 'Answered'}
                </span>
              </h3>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 pb-3 border-b border-slate-800 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span>{language === 'am' ? 'የተመለሰ' : 'Answered'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span>{language === 'am' ? 'ምልክት የተደረገበት' : 'Flagged'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border border-amber-400 bg-amber-500/30" />
                  <span>{language === 'am' ? 'የአሁኑ' : 'Current'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-800" />
                  <span>{language === 'am' ? 'ያልተመለሰ' : 'Unvisited'}</span>
                </div>
              </div>

              {/* Number Buttons Grid */}
              <div className="grid grid-cols-5 gap-2">
                {activeExam.questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = Boolean(userAnswers[q.id]);
                  const isFlag = flaggedQuestions.includes(q.id);

                  let btnStyle = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (isCurrent) {
                    btnStyle = 'border-2 border-amber-400 bg-amber-500/30 text-white font-extrabold';
                  } else if (isFlag) {
                    btnStyle = 'bg-amber-500 text-slate-950 font-bold';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-500 text-slate-950 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        playClickChime();
                        setCurrentQuestionIndex(idx);
                      }}
                      className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Final Submit Trigger */}
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full mt-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
              >
                {language === 'am' ? 'ፈተናውን ጨርስ' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-white">
                  {language === 'am' ? 'ፈተናውን ለማስረከብ እርግጠኛ ነዎት?' : 'Confirm Exam Submission'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'am'
                    ? 'አንዴ ካስረከቡ በኋላ መልሶችዎን ማስተካከል አይችሉም። ፈጣን ውጤትዎን ያገኛሉ።'
                    : 'Once submitted, your responses are finalized and graded immediately.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl text-center text-xs">
                <div>
                  <div className="text-slate-400">{language === 'am' ? 'የተመለሱ' : 'Answered'}</div>
                  <div className="font-bold text-emerald-400">{answeredCount}</div>
                </div>
                <div>
                  <div className="text-slate-400">{language === 'am' ? 'ያልተመለሱ' : 'Unanswered'}</div>
                  <div className="font-bold text-rose-400">{totalQ - answeredCount}</div>
                </div>
                <div>
                  <div className="text-slate-400">{language === 'am' ? 'ምልክት' : 'Flagged'}</div>
                  <div className="font-bold text-amber-400">{flaggedQuestions.length}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  {language === 'am' ? 'ወደ ፈተናው ተመለስ' : 'Keep Working'}
                </button>
                <button
                  onClick={handleSubmitExam}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-500/20"
                >
                  {language === 'am' ? 'አስረክብ' : 'Yes, Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW 3: INSTANT RESULTS & COMPREHENSIVE QUESTION-BY-QUESTION REVIEW
  // ==========================================================================
  if (examState === 'results' && completedAttempt && activeExam) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 text-slate-100 min-h-screen">
        {/* Results Hero Banner */}
        <div className={`p-6 md:p-8 rounded-2xl border mb-8 shadow-2xl relative overflow-hidden ${
          completedAttempt.isPassed
            ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-500/40'
            : 'bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-rose-500/40'
        }`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 border border-amber-500/30">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{activeExam.title}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {completedAttempt.isPassed
                  ? (language === 'am' ? '🎉 እንኳን ደስ አለዎት! ፈተናውን አልፈዋል!' : '🎉 Congratulations! You Passed!')
                  : (language === 'am' ? 'ለቀጣይ ሙከራ ጠንክረህ ተዘጋጅ!' : 'Keep Practicing! You Can Do It!')}
              </h1>

              <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
                {language === 'am'
                  ? 'ከዚህ በታች ያሉትን እያንዳንዱን ጥያቄዎች እና ዝርዝር ማብራሪያዎችን ይገምግሙ። የAI Teacher የልዩ ትምህርት ድጋፍ ማግኘት ይችላሉ።'
                  : 'Review the step-by-step solutions below or ask AI Teacher to explain the concepts you missed.'}
              </p>
            </div>

            {/* Score Metrics Badge */}
            <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-center px-3">
                <div className="text-xs text-slate-400">{language === 'am' ? 'ውጤት' : 'Score'}</div>
                <div className="text-2xl font-extrabold text-white">
                  {completedAttempt.score} / {completedAttempt.totalQuestions}
                </div>
              </div>

              <div className="h-10 w-px bg-slate-800" />

              <div className="text-center px-3">
                <div className="text-xs text-slate-400">{language === 'am' ? 'መቶኛ' : 'Percentage'}</div>
                <div className={`text-2xl font-extrabold ${completedAttempt.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {completedAttempt.percentage}%
                </div>
              </div>

              <div className="h-10 w-px bg-slate-800" />

              <div className="text-center px-3">
                <div className="text-xs text-slate-400">{language === 'am' ? 'ደረጃ' : 'Grade'}</div>
                <div className="text-3xl font-black text-amber-400">
                  {completedAttempt.grade}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remediation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickChime();
                setExamState('catalog');
                setSelectedExamId(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              {language === 'am' ? 'ወደ ፈተናዎች ካታሎግ ተመለስ' : 'All Exams'}
            </button>
            <button
              onClick={() => handleStartExam(activeExam)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              {language === 'am' ? 'እንደገና ሞክር' : 'Retake Exam'}
            </button>
          </div>

          {/* Ask AI Teacher Button */}
          {completedAttempt.incorrectQuestions.length > 0 && (
            <button
              onClick={handleAskAIAboutMistakes}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
            >
              <Bot className="w-4 h-4" />
              <span>{language === 'am' ? 'ስህተቶቼን AI Teacher ያብራራልኝ' : 'Ask AI to Explain Mistakes'}</span>
            </button>
          )}
        </div>

        {/* Review Filters */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            {language === 'am' ? 'አጣራ:' : 'Filter Review:'}
          </span>
          {[
            { id: 'all', label: language === 'am' ? 'ሁሉም ጥያቄዎች' : 'All Questions' },
            { id: 'incorrect', label: language === 'am' ? 'የተሳሳቱ ብቻ' : 'Incorrect Only' },
            { id: 'correct', label: language === 'am' ? 'ትክክል የሆኑ' : 'Correct Only' },
            { id: 'flagged', label: language === 'am' ? 'ምልክት የተደረጉ' : 'Flagged Only' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                playClickChime();
                setReviewFilter(f.id as any);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                reviewFilter === f.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Question Review Cards List */}
        <div className="space-y-4">
          {filteredReviewQuestions.map((q, idx) => {
            const userAnswer = completedAttempt.userAnswers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isFlag = completedAttempt.flaggedQuestions.includes(q.id);

            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl border transition ${
                  isCorrect
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : 'bg-slate-900/90 border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {language === 'am' ? 'ጥያቄ' : 'Question'} {q.questionNumber || idx + 1}
                    </span>
                    {q.topic && (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {q.topic}
                      </span>
                    )}
                  </div>

                  {isFlag && (
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      {language === 'am' ? 'ምልክት ተደርጎበት የነበረ' : 'Flagged'}
                    </span>
                  )}
                </div>

                <h3 className="text-sm md:text-base font-bold text-slate-100 mb-4 leading-relaxed">
                  {q.text}
                </h3>

                {/* Options Review */}
                <div className="space-y-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isOptionCorrect = opt === q.correctAnswer;
                    const isOptionUser = opt === userAnswer;

                    let optClass = 'bg-slate-950/60 border-slate-800 text-slate-300';
                    if (isOptionCorrect) {
                      optClass = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold';
                    } else if (isOptionUser && !isCorrect) {
                      optClass = 'bg-rose-500/15 border-rose-500/50 text-rose-300 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs md:text-sm flex items-center justify-between gap-3 ${optClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs opacity-70">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isOptionCorrect && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                            {language === 'am' ? 'ትክክለኛ መልስ' : 'Correct Answer'}
                          </span>
                        )}
                        {isOptionUser && !isCorrect && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                            {language === 'am' ? 'የመረጥከው' : 'Your Choice'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {q.explanation && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {language === 'am' ? 'ዝርዝር ማብራሪያ (Explanation):' : 'Textbook Solution & Explanation:'}
                    </div>
                    <p className="leading-relaxed text-slate-300 pl-5">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
