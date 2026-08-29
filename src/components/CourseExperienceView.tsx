import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Play, CheckCircle, Clock, ChevronRight, ChevronLeft, Award, Sparkles, Bot, 
  FileText, Download, Check, ArrowRight, ArrowLeft, RotateCcw, Share2, Layers, Search, 
  Filter, Lock, Unlock, AlertCircle, CheckCircle2
} from 'lucide-react';
import { CourseRecord, LessonRecord, StudentProfile, AITeacherContext, LessonResource } from '../types';
import { fetchPublishedCourses, fetchCourseLessons, fetchStudentCourseProgress, saveStudentCourseProgress, fetchAllStudentCourseProgresses } from '../utils/supabaseCourses';
import { INITIAL_CURRICULUM_COURSES, getCurriculumCourse } from '../data/coursesCurriculum';
import { playClickChime, playSuccessChime } from '../utils/audio';

interface CourseExperienceViewProps {
  profile: StudentProfile;
  apiKey: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onOpenAITutorWithContext: (context: AITeacherContext) => void;
  onStudyAction?: () => void;
  onOpenInAppViewer?: (url: string, title: string) => void;
}

export default function CourseExperienceView({
  profile,
  apiKey,
  language,
  onNavigate,
  onOpenAITutorWithContext,
  onStudyAction,
  onOpenInAppViewer
}: CourseExperienceViewProps) {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [progressMap, setProgressMap] = useState<{ [courseId: string]: any }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'content' | 'resources' | 'summary'>('content');
  const [copiedResource, setCopiedResource] = useState<string | null>(null);

  const userId = profile?.email || 'guest_user';

  // Load all published courses & student progresses on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [fetchedCourses, fetchedProgress] = await Promise.all([
          fetchPublishedCourses(),
          fetchAllStudentCourseProgresses(userId)
        ]);
        setCourses(fetchedCourses);
        setProgressMap(fetchedProgress || {});
      } catch (err) {
        console.error('Error loading course view data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [userId]);

  // When a course is selected, load its lessons and progress
  useEffect(() => {
    if (!selectedCourseId) {
      setLessons([]);
      setActiveLessonId(null);
      return;
    }

    async function loadCourseDetails() {
      try {
        const fetchedLessons = await fetchCourseLessons(selectedCourseId);
        setLessons(fetchedLessons);

        // Check if student has progress
        const courseProg = progressMap[selectedCourseId];
        if (courseProg?.lastAccessedLessonId && fetchedLessons.some(l => l.id === courseProg.lastAccessedLessonId)) {
          setActiveLessonId(courseProg.lastAccessedLessonId);
        } else if (fetchedLessons.length > 0) {
          // Find first incomplete lesson or default to first
          const completedIds = courseProg?.completedLessonIds || [];
          const nextIncomplete = fetchedLessons.find(l => !completedIds.includes(l.id));
          setActiveLessonId(nextIncomplete ? nextIncomplete.id : fetchedLessons[0].id);
        }
      } catch (e) {
        console.warn('Error loading lessons for course:', e);
      }
    }

    loadCourseDetails();
  }, [selectedCourseId, progressMap]);

  // Filtered courses list
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchLevel = selectedLevel === 'All' || c.level === selectedLevel;
      const matchSearch = !searchQuery.trim() || 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [courses, selectedLevel, searchQuery]);

  // Current selected course details
  const selectedCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Current active lesson details
  const activeLesson = useMemo(() => {
    return lessons.find(l => l.id === activeLessonId) || (lessons.length > 0 ? lessons[0] : null);
  }, [lessons, activeLessonId]);

  // Current course progress stats
  const currentCourseProgress = useMemo(() => {
    if (!selectedCourseId) return { percentage: 0, completedCount: 0, total: 0, completedIds: [] };
    const prog = progressMap[selectedCourseId];
    const completedIds: string[] = prog?.completedLessonIds || [];
    const total = lessons.length > 0 ? lessons.length : (selectedCourse?.lessonsCount || 0);
    const percentage = total > 0 ? Math.min(100, Math.round((completedIds.length / total) * 100)) : 0;
    return {
      percentage,
      completedCount: completedIds.length,
      total,
      remainingCount: Math.max(0, total - completedIds.length),
      completedIds
    };
  }, [selectedCourseId, progressMap, lessons, selectedCourse]);

  // Group lessons by units / chapters
  const groupedUnits = useMemo(() => {
    const curriculumData = selectedCourseId ? getCurriculumCourse(selectedCourseId) : null;
    if (curriculumData && curriculumData.units.length > 0) {
      return curriculumData.units.map(u => ({
        unitTitle: u.unitTitle,
        description: u.description,
        lessons: lessons.filter(l => u.lessons.some(ul => ul.id === l.id) || l.unitTitle === u.unitTitle)
      }));
    }

    // Default grouping
    return [
      {
        unitTitle: 'Course Curriculum Lessons',
        description: 'Comprehensive chapter lessons with step-by-step notes and exercises.',
        lessons: lessons
      }
    ];
  }, [selectedCourseId, lessons]);

  // Handle Mark as Completed
  const handleToggleCompleteLesson = async (lessonId: string) => {
    if (!selectedCourseId) return;
    playClickChime();

    const currentCompleted = currentCourseProgress.completedIds;
    let updatedCompleted: string[] = [];

    if (currentCompleted.includes(lessonId)) {
      updatedCompleted = currentCompleted.filter(id => id !== lessonId);
    } else {
      updatedCompleted = [...currentCompleted, lessonId];
      playSuccessChime();
      if (onStudyAction) onStudyAction();
    }

    const { progressPercentage } = await saveStudentCourseProgress(
      userId,
      selectedCourseId,
      updatedCompleted,
      lessons.length,
      activeLessonId || undefined
    );

    // Update local state map
    setProgressMap(prev => ({
      ...prev,
      [selectedCourseId]: {
        courseId: selectedCourseId,
        completedLessonIds: updatedCompleted,
        lastAccessedLessonId: activeLessonId || undefined,
        progressPercentage,
        totalLessons: lessons.length,
        completedLessonsCount: updatedCompleted.length,
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  // Next / Previous Navigation
  const currentIndex = lessons.findIndex(l => l.id === activeLessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const handleSelectLesson = (lessonId: string) => {
    playClickChime();
    setActiveLessonId(lessonId);
    if (selectedCourseId) {
      saveStudentCourseProgress(
        userId,
        selectedCourseId,
        currentCourseProgress.completedIds,
        lessons.length,
        lessonId
      );
    }
  };

  // Ask AI about current lesson
  const handleAskAIAboutLesson = () => {
    if (!activeLesson || !selectedCourse) return;
    playClickChime();
    onOpenAITutorWithContext({
      mode: 'teaching',
      courseTitle: selectedCourse.title,
      lessonTitle: activeLesson.title,
      lessonContent: activeLesson.content,
      subject: selectedCourse.subject
    });
  };

  // Ask AI to generate quiz on this lesson
  const handleQuizOnLesson = () => {
    if (!activeLesson || !selectedCourse) return;
    playClickChime();
    onOpenAITutorWithContext({
      mode: 'quiz',
      courseTitle: selectedCourse.title,
      lessonTitle: activeLesson.title,
      lessonContent: activeLesson.content,
      subject: selectedCourse.subject
    });
  };

  // ==========================================================================
  // VIEW 1: COURSE BROWSER / CATALOG (If no course selected)
  // ==========================================================================
  if (!selectedCourseId) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 text-slate-100 min-h-screen">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'am' ? 'የትምህርት ኮርሶች ካታሎግ' : 'Academic Course Catalog'}
              </span>
              <span className="text-xs text-slate-400">
                {courses.length} {language === 'am' ? 'የተዘጋጁ ኮርሶች' : 'Published Courses'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {language === 'am' ? 'የዩኒቨርሲቲ እና የ12ኛ ክፍል ኮርሶች' : 'University & Grade 12 Coursework'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'am'
                ? 'በኢትዮጵያ ከፍተኛ ትምህርት ስርአተ-ትምህርት የተዘጋጁ ጥራት ያላቸው ምዕራፎች፣ ማስታወሻዎች እና ከAI Teacher ጋር የተሳሰረ የመማሪያ መድረክ።'
                : 'Curriculum-aligned modular courses with chapter breakdowns, downloadable summaries, and context-aware AI Tutoring.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('examprep')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-sm font-semibold flex items-center gap-2 transition shadow-md"
            >
              <Award className="w-4 h-4" />
              {language === 'am' ? 'ወደ ፈተናዎች ሂድ' : 'National Exams'}
            </button>
            <button
              onClick={() => onNavigate('tutor')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
            >
              <Bot className="w-4 h-4" />
              {language === 'am' ? 'መምህሩን ጠይቅ' : 'Ask Teacher'}
            </button>
          </div>
        </div>

        {/* Search & Level Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'am' ? 'ኮርስ ወይም ርዕስ ፈልግ...' : 'Search courses, subjects, or topics...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {['All', 'University', 'Common Courses', 'Grade 12'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  playClickChime();
                  setSelectedLevel(lvl);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedLevel === lvl
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700'
                }`}
              >
                {lvl === 'All' ? (language === 'am' ? 'ሁሉም' : 'All Levels') : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-200">
              {language === 'am' ? 'ምንም ኮርስ አልተገኘም' : 'No courses found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'am' ? 'እባክዎ የተለየ የፍለጋ ቃል ይጠቀሙ።' : 'Try adjusting your search query or level filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const prog = progressMap[course.id];
              const completedCount = prog?.completedLessonIds?.length || 0;
              const totalLessons = course.lessonsCount || 5;
              const percent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -4 }}
                  className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-amber-500/5 transition duration-200"
                >
                  {/* Thumbnail / Header */}
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <BookOpen className="w-12 h-12 text-amber-400/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-900/90 text-amber-400 border border-amber-500/30 backdrop-blur-md">
                        {course.subject}
                      </span>
                      <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800/90 text-slate-200 border border-slate-700 backdrop-blur-md">
                        {course.level}
                      </span>
                    </div>

                    {percent > 0 && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/90 text-slate-950 shadow-md">
                        {percent}% {language === 'am' ? 'ተጠናቋል' : 'Done'}
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                        {course.description}
                      </p>

                      {/* Instructor */}
                      {course.instructorName && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400">
                            {course.instructorName.charAt(0)}
                          </div>
                          <span className="truncate">{course.instructorName}</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {course.goalDays || 14} {language === 'am' ? 'ቀናት ግብ' : 'days target'}
                          </span>
                          <span className="text-slate-300 font-semibold">
                            {completedCount} / {totalLessons} {language === 'am' ? 'ትምህርቶች' : 'lessons'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        playClickChime();
                        setSelectedCourseId(course.id);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition duration-150 shadow-md group"
                    >
                      {percent > 0 ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {language === 'am' ? 'ትምህርቱን ቀጥል' : 'Continue Learning'}
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5" />
                          {language === 'am' ? 'ኮርሱን ጀምር' : 'Start Course'}
                        </>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: DEDICATED STUDENT COURSE VIEW & LESSON PLAYER
  // ==========================================================================
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 text-slate-100 min-h-screen">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => {
            playClickChime();
            setSelectedCourseId(null);
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'am' ? 'ወደ ኮርሶች ዝርዝር ተመለስ' : 'Back to Courses'}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAskAIAboutLesson}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === 'am' ? 'ስለዚህ ምዕራፍ AI Teacherን ጠይቅ' : 'Ask AI Teacher'}
            </span>
          </button>
          <button
            onClick={handleQuizOnLesson}
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === 'am' ? 'የልምምድ ጥያቄዎች' : 'AI Practice Quiz'}
            </span>
          </button>
        </div>
      </div>

      {/* Course Hero & Progress Banner */}
      {selectedCourse && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {selectedCourse.subject}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedCourse.level}
                </span>
                {selectedCourse.instructorName && (
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    {selectedCourse.instructorName}
                  </span>
                )}
              </div>

              <h1 className="text-xl md:text-2xl font-extrabold text-white mb-2">
                {selectedCourse.title}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {selectedCourse.description}
              </p>
            </div>

            {/* Live Progress Card */}
            <div className="w-full lg:w-80 bg-slate-950/80 border border-slate-800/90 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-200">
                  {language === 'am' ? 'የኮርሱ ሂደት' : 'Course Progress'}
                </span>
                <span className="font-extrabold text-amber-400 text-sm">
                  {currentCourseProgress.percentage}%
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${currentCourseProgress.percentage}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-slate-800/80">
                <div>
                  <div className="text-slate-400">{language === 'am' ? 'ድምር' : 'Total'}</div>
                  <div className="font-bold text-white">{currentCourseProgress.total}</div>
                </div>
                <div>
                  <div className="text-emerald-400">{language === 'am' ? 'የተጠናቀቀ' : 'Done'}</div>
                  <div className="font-bold text-emerald-400">{currentCourseProgress.completedCount}</div>
                </div>
                <div>
                  <div className="text-amber-400">{language === 'am' ? 'የቀረ' : 'Left'}</div>
                  <div className="font-bold text-amber-400">{currentCourseProgress.remainingCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Sidebar (Lesson Nav) + Right Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lesson Tree (4 Cols on LG) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg sticky top-20">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                {language === 'am' ? 'የምዕራፎች ዝርዝር' : 'Curriculum Structure'}
              </h3>
              <span className="text-xs text-slate-400">
                {lessons.length} {language === 'am' ? 'ትምህርቶች' : 'Lessons'}
              </span>
            </div>

            {/* Units Accordion / List */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {groupedUnits.map((unit, uIdx) => (
                <div key={uIdx} className="space-y-2">
                  <div className="text-xs font-bold text-amber-400/90 uppercase tracking-wider px-2">
                    {unit.unitTitle}
                  </div>

                  <div className="space-y-1.5">
                    {unit.lessons.map((lesson) => {
                      const isComplete = currentCourseProgress.completedIds.includes(lesson.id);
                      const isActive = activeLessonId === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleSelectLesson(lesson.id)}
                          className={`w-full text-left p-3 rounded-xl text-xs flex items-start justify-between gap-3 transition ${
                            isActive
                              ? 'bg-amber-500/15 text-white border border-amber-500/40 shadow-sm'
                              : 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {isComplete ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                              ) : isActive ? (
                                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-400 font-bold">
                                  {lesson.chapterNumber}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className={`font-semibold leading-snug ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                                {lesson.title}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                <span>{lesson.duration || '15 min'}</span>
                                {lesson.resources && lesson.resources.length > 0 && (
                                  <span className="text-amber-400/80">
                                    • {lesson.resources.length} {language === 'am' ? 'ማስታወሻ' : 'resource'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isComplete && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Lesson Reading / Player Pane (8 Cols on LG) */}
        <div className="lg:col-span-8 space-y-6">
          {activeLesson ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Lesson Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/60">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {activeLesson.unitTitle || `Chapter ${activeLesson.chapterNumber}`}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeLesson.duration || '20 min read'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCompleteLesson(activeLesson.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                        currentCourseProgress.completedIds.includes(activeLesson.id)
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {currentCourseProgress.completedIds.includes(activeLesson.id)
                        ? (language === 'am' ? 'ተጠናቋል' : 'Completed')
                        : (language === 'am' ? 'እንደተጠናቀቀ ምልክት አድርግ' : 'Mark Complete')}
                    </button>
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {activeLesson.title}
                </h2>
              </div>

              {/* Lesson Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-900/80 px-6">
                {[
                  { id: 'content', label: language === 'am' ? 'የምዕራፉ ማስታወሻ' : 'Lesson Content', icon: BookOpen },
                  { id: 'resources', label: language === 'am' ? 'ማውረጃ ማስታወሻዎች' : 'Resources & PDFs', icon: FileText },
                  { id: 'summary', label: language === 'am' ? 'የAI መምህር ማጠቃለያ' : 'AI Study Tools', icon: Bot }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        playClickChime();
                        setActiveTab(tab.id as any);
                      }}
                      className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                        activeTab === tab.id
                          ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Lesson Content Pane */}
              {activeTab === 'content' && (
                <div className="p-6 md:p-8 space-y-6">
                  <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed text-sm md:text-base space-y-4">
                    {/* Render Formatted Content */}
                    <div className="whitespace-pre-line font-sans text-slate-200">
                      {activeLesson.content}
                    </div>
                  </div>

                  {/* AI Quick Interaction Card */}
                  <div className="mt-8 p-5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-purple-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {language === 'am' ? 'ይህንን ርዕስ ከAI Teacher ጋር ተለማመድ' : 'Master this topic with AI Teacher'}
                        </h4>
                        <p className="text-xs text-slate-300">
                          {language === 'am'
                            ? 'ጥያቄዎችን ጠይቅ፣ ደረጃ በደረጃ ማብራሪያ ተቀበል ወይም የፈተና ልምምድ አድርግ።'
                            : 'Get Socratic step-by-step explanations, Amharic translations, or custom quizzes.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAskAIAboutLesson}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {language === 'am' ? 'AI Teacherን ጠይቅ' : 'Ask AI'}
                      </button>
                      <button
                        onClick={handleQuizOnLesson}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        {language === 'am' ? 'ፈተና ጀምር' : 'Practice Quiz'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Lesson Resources Pane */}
              {activeTab === 'resources' && (
                <div className="p-6 md:p-8 space-y-4">
                  <h3 className="text-sm font-bold text-white mb-2">
                    {language === 'am' ? 'የዚህ ምዕራፍ ተጨማሪ ማስታወሻዎች እና ፒዲኤፍ (PDF)' : 'Downloadable Revision Notes & Materials'}
                  </h3>

                  {activeLesson.resources && activeLesson.resources.length > 0 ? (
                    <div className="space-y-3">
                      {activeLesson.resources.map((res) => (
                        <div
                          key={res.id}
                          className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-amber-400" />
                            <div>
                              <div className="text-sm font-semibold text-slate-200">{res.title}</div>
                              <div className="text-xs text-slate-400">{res.size || '1.0 MB'} • {res.type.toUpperCase()}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (onOpenInAppViewer && res.url) {
                                onOpenInAppViewer(res.url, res.title);
                              } else {
                                setCopiedResource(res.id);
                                setTimeout(() => setCopiedResource(null), 2500);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {copiedResource === res.id ? 'Ready' : 'Open / View'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl">
                      <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">
                        {language === 'am'
                          ? 'የዚህ ምዕራፍ ፒዲኤፍ ማስታወሻዎች በቅርቡ ይጨመራሉ። በAI Teacher ማጠቃለያ መጠቀም ይችላሉ።'
                          : 'Standard textbook notes are included in the lesson content above. Use AI Study Tools for custom summaries.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: AI Study Tools Pane */}
              {activeTab === 'summary' && (
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Bot className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {language === 'am' ? 'የAI Teacher ጥልቅ ማብራሪያ' : 'Socratic Step-by-Step Teaching'}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {language === 'am'
                          ? 'ይህንን ምዕራፍ በምሳሌዎች፣ በአማርኛ እና በእንግሊዝኛ ከAI Teacher ጋር ተማር።'
                          : 'Receive a concept-by-concept deep breakdown with Ethiopian academic examples.'}
                      </p>
                      <button
                        onClick={handleAskAIAboutLesson}
                        className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition"
                      >
                        {language === 'am' ? 'ማብራሪያ ጀምር' : 'Start Socratic Session'}
                      </button>
                    </div>

                    <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {language === 'am' ? 'ፈጣን የፈተና ልምምድ (Quiz)' : 'Interactive AI Practice Quiz'}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {language === 'am'
                          ? 'ከዚህ ምዕራፍ 5 ተጨባጭ ጥያቄዎችን አውጥተህ እውቀትህን ፈትሽ።'
                          : 'Test your retention with instant MCQ grading and textbook explanations.'}
                      </p>
                      <button
                        onClick={handleQuizOnLesson}
                        className="w-full py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition"
                      >
                        {language === 'am' ? 'ጥያቄዎችን አውጣ' : 'Generate Lesson Quiz'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Footer: Next / Prev Navigation */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
                {prevLesson ? (
                  <button
                    onClick={() => handleSelectLesson(prevLesson.id)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === 'am' ? 'ያለፈው ትምህርት' : 'Previous'}:</span>
                    <span className="truncate max-w-[150px]">{prevLesson.title}</span>
                  </button>
                ) : <div />}

                {nextLesson ? (
                  <button
                    onClick={() => handleSelectLesson(nextLesson.id)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
                  >
                    <span>{language === 'am' ? 'ቀጣዩ ትምህርት' : 'Next Lesson'}:</span>
                    <span className="truncate max-w-[180px]">{nextLesson.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    {language === 'am' ? 'ሁሉንም ምዕራፎች አጠናቀዋል!' : 'All course lessons completed!'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">
                {language === 'am' ? 'ትምህርት ይምረጡ' : 'Select a lesson to begin'}
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
