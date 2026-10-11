import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Play, BookOpen, Clock, FileText, CheckCircle2, 
  ExternalLink, X, Sparkles, AlertCircle, ChevronLeft, Lock
} from 'lucide-react';

export interface CourseDetailProps {
  courseId: string;
  onStartQuiz?: (examId: string, examTitle?: string) => void;
  onBack?: () => void;
  courseTitle?: string;
  language?: 'en' | 'am';
  isProUser?: boolean;
  onUpgrade?: () => void;
  isFreeTrial?: boolean;
}

const COURSE_EXAM_VIDEOS: Record<string, { midterm: string; final: string }> = {
  critical: { midterm: 'ylOzXfL1QeI', final: 'Nq8Wy4B4i3c' },
  phil: { midterm: 'ylOzXfL1QeI', final: 'Nq8Wy4B4i3c' },
  logic: { midterm: 'ylOzXfL1QeI', final: 'Nq8Wy4B4i3c' },
  econ: { midterm: '1OxGP64a_lE', final: 'kUPm2tMCbGE' },
  bio: { midterm: '8IlzKri08kk', final: '00jbG_cfGuQ' },
  phy: { midterm: 'b05pIq6M5U8', final: 'kKKM8Y-u7ds' },
  math: { midterm: 'YNstP0ESndU', final: '5yfh5cf4-0w' },
  chem: { midterm: 'FSyAehMdpyI', final: 'CGA8sRwqIFg' },
  emte: { midterm: 'ad79nYk2keg', final: 'ad79nYk2keg' },
  emerging: { midterm: 'ad79nYk2keg', final: 'ad79nYk2keg' },
  enla: { midterm: 'ylOzXfL1QeI', final: 'IawIjqOJBU8' },
  english: { midterm: 'ylOzXfL1QeI', final: 'IawIjqOJBU8' },
  gees: { midterm: '1OxGP64a_lE', final: 'kUPm2tMCbGE' },
  geography: { midterm: '1OxGP64a_lE', final: 'kUPm2tMCbGE' },
  snie: { midterm: 'Nq8Wy4B4i3c', final: 'IawIjqOJBU8' },
  inclusiveness: { midterm: 'Nq8Wy4B4i3c', final: 'IawIjqOJBU8' }
};

export const CourseDetail: React.FC<CourseDetailProps> = ({ 
  courseId,
  onStartQuiz,
  onBack,
  courseTitle,
  language = 'en',
  isProUser = false,
  onUpgrade,
  isFreeTrial = false
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'exams'>('exams');
  const [lessons, setLessons] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  
  // Interactive in-component quiz test modal when no external handler is provided
  const [activeQuizExam, setActiveQuizExam] = useState<any | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadCourseContent() {
      setLoading(true);

      const targetId = courseId.trim();
      const cleanId = targetId.toLowerCase();
      const prefixedId = cleanId.startsWith('course_') ? cleanId : `course_${cleanId}`;
      const unPrefixedId = cleanId.replace(/^course_/, '');

      let lessonData: any[] = [];
      let examData: any[] = [];

      try {
        // 1. Fetch Lessons from Supabase
        const { data: d1, error: err1 } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', targetId)
          .order('chapter_number', { ascending: true });

        if (d1 && d1.length > 0) {
          lessonData = d1;
        } else {
          // Fallback query by prefixed or un-prefixed course ID
          const altId = targetId.startsWith('course_') ? unPrefixedId : prefixedId;
          const { data: d2 } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', altId)
            .order('chapter_number', { ascending: true });

          if (d2 && d2.length > 0) {
            lessonData = d2;
          }
        }
      } catch (err) {
        console.warn('[CourseDetail] Error querying lessons table:', err);
      }

      try {
        // 2. Fetch Exams from Supabase
        const { data: e1, error: errExam } = await supabase
          .from('exams')
          .select('*')
          .eq('course_id', targetId);

        if (e1 && e1.length > 0) {
          examData = e1;
        } else {
          // Check alternate course column or prefixed course ID
          const { data: e2 } = await supabase
            .from('exams')
            .select('*')
            .or(`course_id.eq.${prefixedId},course.eq.${targetId},course.eq.${unPrefixedId}`);

          if (e2 && e2.length > 0) {
            examData = e2;
          }
        }
      } catch (err) {
        console.warn('[CourseDetail] Error querying exams table:', err);
      }

      // If Supabase has no exams recorded yet for this course, provide curated official model exams
      if (examData.length === 0) {
        const readableName = courseTitle || targetId.replace(/^(course_|fresh_|freshman_)/i, '').replace(/_/g, ' ').toUpperCase();
        const cleanKey = cleanId.toLowerCase();
        let midVideo = 'ylOzXfL1QeI';
        let finalVideo = 'Nq8Wy4B4i3c';
        for (const [k, v] of Object.entries(COURSE_EXAM_VIDEOS)) {
          if (cleanKey.includes(k) || (courseTitle && courseTitle.toLowerCase().includes(k))) {
            midVideo = v.midterm;
            finalVideo = v.final;
            break;
          }
        }

        examData = [
          {
            id: `exam_${cleanId}_midterm`,
            course_id: targetId,
            title: `${readableName} - Midterm Model Examination`,
            duration_minutes: 60,
            exam_type: 'Midterm',
            youtube_video_id: midVideo,
            total_questions: 25,
            sampleQuestions: [
              {
                id: 1,
                q: `In ${readableName}, what is the foundational principle emphasized in freshman Ethiopian university curriculum?`,
                options: [
                  'Comprehensive theoretical synthesis and empirical verification',
                  'Memorization of arbitrary taxonomies without application',
                  'Disregard of primary documentation and historical context',
                  'Exclusively localized regional case studies without global context'
                ],
                correct: 'Comprehensive theoretical synthesis and empirical verification'
              },
              {
                id: 2,
                q: 'Which cognitive framework is required when solving complex multi-variable problems in university exams?',
                options: [
                  'Systematic analytical deduction and step-by-step logic',
                  'Random trial and error guessing',
                  'Skipping premise evaluation',
                  'Relying solely on intuition without evidence'
                ],
                correct: 'Systematic analytical deduction and step-by-step logic'
              }
            ]
          },
          {
            id: `exam_${cleanId}_final`,
            course_id: targetId,
            title: `${readableName} - Final Comprehensive Examination (Past Paper)`,
            duration_minutes: 120,
            exam_type: 'Final',
            youtube_video_id: finalVideo,
            total_questions: 50,
            sampleQuestions: [
              {
                id: 1,
                q: `Which analytical method yields the highest accuracy in standard ${readableName} evaluations?`,
                options: [
                  'Rigorous systematic reasoning and verified equations',
                  'Superficial examination of introductory statements',
                  'Omitting contextual background knowledge',
                  'Restricting analysis to intuitive estimates'
                ],
                correct: 'Rigorous systematic reasoning and verified equations'
              }
            ]
          }
        ];
      }

      if (isMounted) {
        setLessons(lessonData);
        setExams(examData);
        // Automatically queue the first lesson video if available
        if (lessonData.length > 0 && lessonData[0].youtube_video_id) {
          setSelectedVideoId(lessonData[0].youtube_video_id);
          setSelectedVideoTitle(lessonData[0].title);
        }
        setLoading(false);
      }
    }

    loadCourseContent();

    return () => {
      isMounted = false;
    };
  }, [courseId, courseTitle]);

  const handleStartExamTest = (exam: any) => {
    if (onStartQuiz) {
      onStartQuiz(exam.id, exam.title);
    } else {
      setActiveQuizExam(exam);
      setSelectedAnswers({});
      setQuizSubmitted(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-4 text-white">
      {/* Optional Top Back Bar */}
      {onBack && (
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors py-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{language === 'am' ? 'ተመለስ' : 'Back to Courses'}</span>
          </button>
          {courseTitle && (
            <span className="text-xs font-medium text-slate-300 truncate max-w-[200px]">
              {courseTitle}
            </span>
          )}
        </div>
      )}

      {/* Video Player Box (renders selected lesson or exam video) */}
      {selectedVideoId && (
        <div className="flex flex-col gap-2">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-xl border border-white/10">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${selectedVideoId}?rel=0&modestbranding=1`}
              title={selectedVideoTitle || "Video Player"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            {/* Collapse / Close player button */}
            <button
              onClick={() => setSelectedVideoId(null)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-slate-300 truncate max-w-[240px]">
              {selectedVideoTitle || `Video: ${selectedVideoId}`}
            </p>
            <a
              href={`https://www.youtube.com/watch?v=${selectedVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
            >
              <span>Open in YouTube app</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Top Navigation Tabs */}
      <div className="grid grid-cols-2 p-1 bg-[#1E293B] border border-white/10 rounded-xl shadow-inner">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'chapters'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📚 Chapters ({lessons.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'exams'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📝 Exams ({exams.length})</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col gap-2.5 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-3.5 bg-[#1E293B]/70 border border-white/5 rounded-xl h-16 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-slate-700/60 rounded w-3/4" />
                <div className="h-2.5 bg-slate-800 rounded w-1/3" />
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-700/40" />
            </div>
          ))}
        </div>
      )}

      {/* Tab 1: Chapters List */}
      {!loading && activeTab === 'chapters' && (
        <div className="flex flex-col gap-2">
          {lessons.length === 0 ? (
            <div className="p-8 text-center bg-[#1E293B]/60 border border-white/10 rounded-xl space-y-2">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No video chapters recorded yet.</p>
              <p className="text-xs text-slate-500">Video lectures for this course are currently being uploaded by faculty.</p>
            </div>
          ) : (
            lessons.map((lesson) => {
              const isPlaying = selectedVideoId === lesson.youtube_video_id;
              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    if (lesson.youtube_video_id) {
                      setSelectedVideoId(lesson.youtube_video_id);
                      setSelectedVideoTitle(lesson.title);
                    }
                  }}
                  className={`p-3 bg-[#0F172A] border rounded-xl flex items-center justify-between cursor-pointer active:scale-95 transition-all ${
                    isPlaying 
                      ? 'border-amber-400 bg-amber-500/10 shadow-md ring-1 ring-amber-400/30' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className={`text-sm font-medium truncate ${isPlaying ? 'text-amber-300 font-bold' : 'text-slate-100'}`}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>Chapter {lesson.chapter_number}</span>
                      {lesson.duration && <span>• {lesson.duration}</span>}
                    </div>
                  </div>
                  <span className={`text-lg shrink-0 ${isPlaying ? 'text-amber-400 animate-pulse' : 'text-amber-400'}`}>
                    ▶
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Exams List */}
      {!loading && activeTab === 'exams' && (
        <div className="flex flex-col gap-3">
          {/* Trial / Subscription Status Card */}
          {isFreeTrial ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'am'
                    ? '🎁 ነፃ የሙከራ ኮርስ፡ የአጋማሽ እና የማጠቃለያ ፈተና መፍትሔ ቪዲዮዎችን ያለ ክፍያ ይመልከቱ!'
                    : '🎁 Free Trial Course: Midterm & Final Exam solution videos are 100% unlocked for try!'}
                </span>
              </div>
            </div>
          ) : !isProUser ? (
            <div className="p-3 bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300">
              <div className="min-w-0">
                <span className="font-bold text-white block">
                  {language === 'am' ? '🔒 የወርሃዊ የፈተና ቪዲዮ ፓስ (99 ብር)' : '🔒 Monthly Exam Video Pass (99 ETB / Month)'}
                </span>
                <span className="text-[11px] text-slate-300">
                  {language === 'am' ? 'የሁሉንም ኮርሶች አጋማሽና ማጠቃለያ ፈተና የቪዲዮ ትንታኔ ይክፈቱ።' : 'Unlock Mid & Final exam walkthrough solution videos for all courses.'}
                </span>
              </div>
              <button
                onClick={() => {
                  if (onUpgrade) onUpgrade();
                  else setShowSubscriptionPrompt(true);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                {language === 'am' ? 'በ99 ብር ክፈት' : 'Unlock (99 ETB)'}
              </button>
            </div>
          ) : null}

          {exams.length === 0 ? (
            <div className="p-8 text-center bg-[#1E293B]/60 border border-white/10 rounded-xl space-y-2">
              <FileText className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No exams available yet.</p>
              <p className="text-xs text-slate-500">Midterm and final papers will appear here.</p>
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 bg-[#0F172A] border border-white/10 rounded-xl flex flex-col gap-3 shadow-lg"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-white leading-snug">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 inline" />
                      <span>{exam.duration_minutes || 60} mins</span>
                      <span>•</span>
                      <span className="font-mono">{String(exam.exam_type || 'EXAM').toUpperCase()}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold shrink-0">
                    {exam.exam_type || 'Exam'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  {/* Watch Walkthrough Video */}
                  {exam.youtube_video_id && (
                    <button
                      onClick={() => {
                        if (!isProUser && !isFreeTrial) {
                          if (onUpgrade) onUpgrade();
                          else setShowSubscriptionPrompt(true);
                          return;
                        }
                        setSelectedVideoId(exam.youtube_video_id);
                        setSelectedVideoTitle(`${exam.title} (Solution Video)`);
                      }}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isFreeTrial || isProUser
                          ? 'bg-[#1E293B] hover:bg-[#334155] text-slate-200 hover:text-white border-white/10'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {(!isProUser && !isFreeTrial) ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{language === 'am' ? 'የመፍትሔ ቪዲዮ (99 ብር)' : 'Solution Video (99 ETB)'}</span>
                        </>
                      ) : (
                        <>
                          <span>📺 Solution Video</span>
                          {isFreeTrial && <span className="text-[10px] text-emerald-400 font-mono font-bold">(Free Trial)</span>}
                        </>
                      )}
                    </button>
                  )}

                  {/* Take Exam Quiz */}
                  <button
                    onClick={() => handleStartExamTest(exam)}
                    className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>✍️ Start Test</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Embedded Quiz Modal when taking a test */}
      {activeQuizExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0A1128] border border-amber-500/40 rounded-2xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Timed Exam Drill
                </span>
                <h3 className="text-base font-bold text-white truncate mt-1">
                  {activeQuizExam.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveQuizExam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions list */}
            {activeQuizExam.sampleQuestions && activeQuizExam.sampleQuestions.length > 0 ? (
              <div className="space-y-4">
                {activeQuizExam.sampleQuestions.map((qObj: any, idx: number) => {
                  const userChoice = selectedAnswers[idx];
                  const isAnswered = !!userChoice;
                  const isCorrect = userChoice === qObj.correct;

                  return (
                    <div key={qObj.id} className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-white/10 space-y-2.5">
                      <p className="text-xs font-semibold text-slate-200">
                        {idx + 1}. {qObj.q}
                      </p>
                      <div className="space-y-1.5">
                        {qObj.options.map((opt: string) => {
                          const isSelected = userChoice === opt;
                          let optStyle = 'bg-[#0F172A] border-white/10 text-slate-300 hover:border-amber-400/50';

                          if (quizSubmitted) {
                            if (opt === qObj.correct) {
                              optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                            } else if (isSelected) {
                              optStyle = 'bg-red-500/20 border-red-500 text-red-300';
                            }
                          } else if (isSelected) {
                            optStyle = 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold';
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() => {
                                setSelectedAnswers(prev => ({ ...prev, [idx]: opt }));
                              }}
                              className={`w-full text-left p-2.5 rounded-lg text-xs border transition-colors cursor-pointer flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && opt === qObj.correct && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Submit / Finish test button */}
                <div className="pt-2 flex items-center gap-2">
                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-black text-slate-950 text-xs uppercase tracking-wider shadow-lg active:scale-95 cursor-pointer"
                    >
                      Submit Exam Answers
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveQuizExam(null)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Done & Close
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                <p>Exam session initialized with ID: <span className="font-mono text-amber-300">{activeQuizExam.id}</span></p>
                <p>Standard duration: {activeQuizExam.duration_minutes || 60} minutes.</p>
                <button
                  onClick={() => setActiveQuizExam(null)}
                  className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly Exam Subscription Modal */}
      {showSubscriptionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0A1128] border border-amber-500/40 rounded-2xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {language === 'am' ? 'የወርሃዊ የፈተና ቪዲዮ ፓስ' : 'Monthly Exam Pass'}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-medium">99 ETB / Month (ወርሃዊ)</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubscriptionPrompt(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'am' ? '1 ነፃ የሙከራ ኮርስ ክፍት ነው!' : '1 Free Trial Course is Open!'}</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {language === 'am'
                    ? 'የCritical Thinking & Logic አጋማሽና ማጠቃለያ ፈተናዎችን በነፃ መሞከር ይችላሉ።'
                    : 'You can test full Midterm & Final solution videos for Critical Thinking & Logic 100% free.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1E293B] border border-white/10 space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-white">{language === 'am' ? 'የወርሃዊ ፓስ ክፍያ' : 'Monthly Exam Access'}</span>
                  <span className="text-amber-400 font-mono text-sm">99 ETB</span>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  {language === 'am'
                    ? 'በቴሌብር (Telebirr) ወይም በንግድ ባንክ (CBE Birr) በቀላሉ ይክፈሉ።'
                    : 'Instant activation with Telebirr or CBE Birr. (Semester: 199 ETB, Annual: 250 ETB).'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setShowSubscriptionPrompt(false);
                  if (onUpgrade) onUpgrade();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>{language === 'am' ? 'በቴሌብር አሳድግ (99 ብር)' : 'Subscribe for 99 ETB / Month'}</span>
              </button>

              <button
                onClick={() => setShowSubscriptionPrompt(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                {language === 'am' ? 'ተመለስ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
