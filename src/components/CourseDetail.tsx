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
        const { data: d1 } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', targetId)
          .order('chapter_number', { ascending: true });

        if (d1 && d1.length > 0) {
          lessonData = d1;
        } else {
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
        const { data: e1 } = await supabase
          .from('exams')
          .select('*')
          .eq('course_id', targetId);

        if (e1 && e1.length > 0) {
          examData = e1;
        } else {
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

      // If Supabase has no exams recorded yet for this course, provide curated official model exams with YouTube solutions
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
            title: `${readableName} - Midterm Examination & Solution`,
            duration_minutes: 60,
            exam_type: 'Midterm',
            youtube_video_id: midVideo,
            total_questions: 25
          },
          {
            id: `exam_${cleanId}_final`,
            course_id: targetId,
            title: `${readableName} - Final Comprehensive Examination (Past Paper)`,
            duration_minutes: 120,
            exam_type: 'Final',
            youtube_video_id: finalVideo,
            total_questions: 50
          }
        ];
      }

      if (isMounted) {
        setLessons(lessonData);
        setExams(examData);
        // Queue first lesson video if available
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
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-4 text-white">
      {/* Top Back Bar */}
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
            <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
              {courseTitle}
            </span>
          )}
        </div>
      )}

      {/* Video Player Box (renders selected lesson or exam YouTube video) */}
      {selectedVideoId && (
        <div className="flex flex-col gap-2">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-xl border border-white/10">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${selectedVideoId}?rel=0&modestbranding=1`}
              title={selectedVideoTitle || "Video Player"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white cursor-pointer"
              onClick={() => setSelectedVideoId(null)}
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-amber-300 truncate max-w-[280px]">
              {selectedVideoTitle || `Video: ${selectedVideoId}`}
            </span>
            <a
              href={`https://www.youtube.com/watch?v=${selectedVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 pb-2 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'exams'
              ? 'border-b-2 border-amber-400 text-amber-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{language === 'am' ? 'ፈተናዎች እና ቪዲዮ' : 'Exams & Videos'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
            {exams.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chapters')}
          className={`pb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'chapters'
              ? 'border-b-2 border-amber-400 text-amber-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'am' ? 'ምዕራፎች (Chapters)' : 'Chapters'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {lessons.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading course materials...</p>
        </div>
      ) : activeTab === 'chapters' ? (
        /* CHAPTERS LIST */
        <div className="flex flex-col gap-2.5">
          {lessons.length === 0 ? (
            <div className="p-8 text-center bg-[#1E293B]/60 border border-white/10 rounded-xl space-y-2">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No chapters recorded yet.</p>
              <p className="text-xs text-slate-500">Unit lectures will appear here.</p>
            </div>
          ) : (
            lessons.map((lesson, idx) => {
              const isPlaying = selectedVideoId === lesson.youtube_video_id;
              return (
                <div
                  key={lesson.id || idx}
                  className={`p-3.5 bg-[#0F172A] border rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    isPlaying ? 'border-amber-400/80 bg-amber-500/10' : 'border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                      isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {lesson.chapter_number || idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">
                        {lesson.title || `Unit ${idx + 1}`}
                      </p>
                      {lesson.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {lesson.youtube_video_id && (
                    <button
                      onClick={() => {
                        setSelectedVideoId(lesson.youtube_video_id);
                        setSelectedVideoTitle(lesson.title);
                      }}
                      className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer shrink-0"
                      title="Play YouTube Video"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* EXAMS & VIDEOS LIST */
        <div className="flex flex-col gap-3">
          {exams.map((exam) => (
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
                {/* Watch Solution Video */}
                {exam.youtube_video_id && (
                  <button
                    onClick={() => {
                      setSelectedVideoId(exam.youtube_video_id);
                      setSelectedVideoTitle(`${exam.title} (Solution Video)`);
                    }}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg border border-white/10 bg-[#1E293B] hover:bg-[#334155] text-slate-200 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📺 {language === 'am' ? 'የመፍትሔ ቪዲዮ' : 'Solution Video'}</span>
                  </button>
                )}

                {/* Take Exam Drill */}
                <button
                  onClick={() => handleStartExamTest(exam)}
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>✍️ {language === 'am' ? 'ፈተና ጀምር' : 'Start Exam'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
