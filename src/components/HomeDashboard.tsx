import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bot, BookOpen, Play, GraduationCap, FileText, Bell, Star, Clock, CheckCircle2, 
  Flame, Calendar, Target, CheckSquare, Square, TrendingUp, ArrowRight, 
  ShieldCheck, X, ChevronRight, Bookmark, Award, Plus, Trash2, RefreshCw,
  AlertCircle, Sparkles, BookCheck, HelpCircle, Layers, CheckCircle, BarChart3,
  ExternalLink, Compass, Lightbulb, BrainCircuit, ArrowUpRight, Trophy, Camera
} from 'lucide-react';
import StudentAvatar from './StudentAvatar';
import { 
  StudentProfile, CourseRecord, PlatformAnnouncement, StudyTask, ExamAttemptRecord, 
  StudentCourseProgress, AITeacherContext 
} from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { getEthiopianDate, toGeezNumeral, ETHIOPIAN_HOLIDAYS } from '../utils/ethiopianCalendar';
import { INITIAL_CURRICULUM_COURSES } from '../data/coursesCurriculum';
import { 
  fetchPublishedCourses, fetchAnnouncements, fetchAllStudentCourseProgresses, 
  fetchStudentExamAttempts, fetchStudentTasks, saveStudentTask, 
  toggleStudentTaskStatus, deleteStudentTask 
} from '../utils/supabaseCourses';
import { QuickAction, ProgressCard, SubjectChip, ProBanner, EmptyState } from './native/NativeComponents';

interface HomeDashboardProps {
  profile: StudentProfile;
  language: 'en' | 'am' | 'both';
  onNavigate: (page: 'home' | 'tutor' | 'quiz' | 'profile' | 'notes' | 'examprep' | 'bookstore' | 'university' | 'examengine', context?: AITeacherContext) => void;
  onUpdateGrade: (grade: string) => void;
  streakCount: number;
  studyHoursCount: number;
}

export default function HomeDashboard({
  profile,
  language,
  onNavigate,
  onUpdateGrade,
  streakCount,
  studyHoursCount
}: HomeDashboardProps) {
  const isAmharic = language === 'am';
  const userId = profile.email || profile.name || 'guest_user';

  // Live Ethiopian Ge'ez Calendar
  const ethDate = useMemo(() => getEthiopianDate(new Date()), []);
  const geezDayNumeral = useMemo(() => toGeezNumeral(ethDate.day), [ethDate.day]);

  // Check for today's Ethiopian holiday if any
  const todayHoliday = useMemo(() => {
    return ETHIOPIAN_HOLIDAYS.find(
      h => h.day === ethDate.day && h.monthIndex === ethDate.monthIndex
    );
  }, [ethDate.day, ethDate.monthIndex]);

  // --------------------------------------------------------------------------
  // REAL DATABASE STATE (Fast-launch zero-latency local initialization)
  // --------------------------------------------------------------------------
  const activeLevel = profile.year === 'University' ? 'University' : 'Grade 12';
  
  const [courses, setCourses] = useState<CourseRecord[]>(() => {
    try {
      const raw = safeStorage.getItem('ethiolearn_supabase_courses_cache');
      if (raw) {
        const parsed: CourseRecord[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(c => c.status === 'published' && (!activeLevel || c.level === activeLevel));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    const curriculumCourses = INITIAL_CURRICULUM_COURSES.map(c => c.course);
    return curriculumCourses.filter(c => c.status === 'published' && (!activeLevel || c.level === activeLevel));
  });

  const [progressMap, setProgressMap] = useState<{ [courseId: string]: StudentCourseProgress }>(() => {
    try {
      const raw = safeStorage.getItem(`ethiolearn_student_course_progress_${userId || 'guest'}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  const [examAttempts, setExamAttempts] = useState<ExamAttemptRecord[]>(() => {
    try {
      const raw = safeStorage.getItem(`ethiolearn_student_exam_attempts_${userId || 'guest'}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    try {
      const raw = safeStorage.getItem(`ethiolearn_student_study_tasks_${userId || 'guest'}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>(() => {
    try {
      const raw = safeStorage.getItem('ethiolearn_announcements_cache');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  
  // Instant open: false by default so hero and cockpit render at 0ms!
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Target Goal State (Daily study goal in hours)
  const [targetHours, setTargetHours] = useState<number>(() => {
    const saved = safeStorage.getItem(`ethiolearn_target_hours_${userId}`);
    return saved ? parseFloat(saved) : (profile.dailyGoalHours || 3.0);
  });

  // UI Modals & Drawers
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PlatformAnnouncement | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState(profile.subjects?.[0] || 'General');
  const [newTaskDuration, setNewTaskDuration] = useState('25m');
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem(`ethiolearn_read_announcements_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bookmarked / Starred courses
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem(`ethiolearn_bookmarked_courses_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --------------------------------------------------------------------------
  // LOAD ALL REAL DATABASE RECORDS (Background Sync - Non-blocking for instant hero)
  // --------------------------------------------------------------------------
  const loadDashboardData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }
    // Only show full loading skeleton if we have zero courses to display
    if (courses.length === 0) {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      // Parallel fetch real database endpoints
      const [
        fetchedCourses,
        fetchedProgress,
        fetchedAttempts,
        fetchedTasks,
        fetchedAnnouncements
      ] = await Promise.all([
        fetchPublishedCourses(activeLevel),
        fetchAllStudentCourseProgresses(userId),
        fetchStudentExamAttempts(userId),
        fetchStudentTasks(userId),
        fetchAnnouncements(true)
      ]);

      // Deduplicate courses strictly by ID
      const uniqueCourses: CourseRecord[] = [];
      const seenCourseIds = new Set<string>();
      for (const c of fetchedCourses) {
        if (!seenCourseIds.has(c.id)) {
          seenCourseIds.add(c.id);
          uniqueCourses.push(c);
        }
      }

      if (uniqueCourses.length > 0) {
        setCourses(uniqueCourses);
      }
      setProgressMap(fetchedProgress || {});
      setExamAttempts(fetchedAttempts || []);
      setTasks(fetchedTasks || []);
      setAnnouncements(fetchedAnnouncements || []);
    } catch (err: any) {
      console.error('Failed to load real dashboard data:', err);
      if (courses.length === 0) {
        setLoadError(isAmharic ? 'የጥናት መረጃን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።' : 'Unable to load your learning data from the server.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeLevel, userId, isAmharic, courses.length]);

  useEffect(() => {
    loadDashboardData();

    // Listen for cross-component database updates (e.g. after publishing a course or completing a quiz)
    const handleDataUpdate = () => {
      loadDashboardData(true);
    };
    window.addEventListener('ethiolearn_data_updated', handleDataUpdate);
    return () => window.removeEventListener('ethiolearn_data_updated', handleDataUpdate);
  }, [loadDashboardData]);

  // --------------------------------------------------------------------------
  // DERIVED REAL STATISTICS (Zero fake stats)
  // --------------------------------------------------------------------------
  // Active courses that student has progress in
  const enrolledCoursesWithProgress = useMemo(() => {
    return courses.map(course => {
      const prog = progressMap[course.id];
      const progressPercentage = prog?.progressPercentage || 0;
      const completedCount = prog?.completedLessonsCount || 0;
      const lastAccessed = prog?.lastUpdated || null;
      return {
        course,
        progressPercentage,
        completedCount,
        lastAccessed
      };
    });
  }, [courses, progressMap]);

  // In-progress courses (progress > 0 and < 100) or recently accessed
  const inProgressCourses = useMemo(() => {
    return enrolledCoursesWithProgress
      .filter(item => item.progressPercentage > 0)
      .sort((a, b) => {
        const timeA = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
        const timeB = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
        return timeB - timeA;
      });
  }, [enrolledCoursesWithProgress]);

  // Most recently accessed course for the "Continue Learning" button
  const mostRecentCourse = useMemo(() => {
    if (inProgressCourses.length > 0) {
      return inProgressCourses[0].course;
    }
    return courses[0] || null;
  }, [inProgressCourses, courses]);

  // Aggregate metrics
  const totalCoursesEnrolled = inProgressCourses.length;
  const totalCoursesCompleted = enrolledCoursesWithProgress.filter(c => c.progressPercentage === 100).length;
  const totalExamsCompleted = examAttempts.length;
  
  // Real average exam score across actual attempts
  const averageExamScore = useMemo(() => {
    if (examAttempts.length === 0) return null;
    const sum = examAttempts.reduce((acc, curr) => acc + (curr.percentage || curr.score || 0), 0);
    return Math.round(sum / examAttempts.length);
  }, [examAttempts]);

  // Real aggregated weak topics from past attempts
  const identifiedWeakTopics = useMemo(() => {
    const topicMap: { [topic: string]: number } = {};
    examAttempts.forEach(attempt => {
      if (Array.isArray(attempt.weakTopics)) {
        attempt.weakTopics.forEach(t => {
          if (t && typeof t === 'string') {
            topicMap[t] = (topicMap[t] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 4);
  }, [examAttempts]);

  // Overall curriculum completion %
  const overallProgressPercentage = useMemo(() => {
    if (courses.length === 0) return 0;
    const totalProg = enrolledCoursesWithProgress.reduce((sum, item) => sum + item.progressPercentage, 0);
    return Math.round(totalProg / courses.length);
  }, [courses.length, enrolledCoursesWithProgress]);

  // Check if student has any recorded study activity at all
  const hasAnyActivity = totalCoursesEnrolled > 0 || totalExamsCompleted > 0 || streakCount > 0 || studyHoursCount > 0;

  // --------------------------------------------------------------------------
  // ACTIONS & HANDLERS
  // --------------------------------------------------------------------------
  const handleUpdateTargetHours = (delta: number) => {
    playClickChime();
    setTargetHours(prev => {
      const next = Math.max(1, Math.min(10, +(prev + delta).toFixed(1)));
      safeStorage.setItem(`ethiolearn_target_hours_${userId}`, next.toString());
      return next;
    });
  };

  const handleToggleTask = async (task: StudyTask) => {
    playSuccessChime();
    const updatedStatus = !task.isCompleted;
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: updatedStatus } : t));
    await toggleStudentTaskStatus(task.id, updatedStatus, userId);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    playClickChime();
    const newTask = {
      title: newTaskTitle.trim(),
      subject: newTaskSubject.trim() || 'General',
      duration: newTaskDuration.trim() || '25m',
      durationMinutes: parseInt(newTaskDuration, 10) || 25,
      isCompleted: false,
      type: 'review'
    };

    const res = await saveStudentTask(newTask, userId);
    if (res.success && res.task) {
      playSuccessChime();
      setTasks(prev => [res.task, ...prev]);
      setNewTaskTitle('');
      setShowAddTaskModal(false);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickChime();
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await deleteStudentTask(taskId, userId);
  };

  const handleToggleBookmark = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickChime();
    setBookmarkedCourseIds(prev => {
      const updated = prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId];
      safeStorage.setItem(`ethiolearn_bookmarked_courses_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkAnnouncementRead = (annId: string) => {
    setReadAnnouncementIds(prev => {
      if (prev.includes(annId)) return prev;
      const updated = [...prev, annId];
      safeStorage.setItem(`ethiolearn_read_announcements_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkAllAnnouncementsRead = () => {
    playSuccessChime();
    const allIds = announcements.map(a => a.id);
    setReadAnnouncementIds(allIds);
    safeStorage.setItem(`ethiolearn_read_announcements_${userId}`, JSON.stringify(allIds));
  };

  const unreadAnnouncementsCount = announcements.filter(a => !readAnnouncementIds.includes(a.id)).length;

  const completedTasksCount = tasks.filter(t => t.isCompleted).length;
  const goalProgressPercentage = Math.min(100, Math.round((studyHoursCount / targetHours) * 100));

  // Curriculum practice navigation helper
  const handleOpenStudyTool = (toolType: 'quiz' | 'exam' | 'notes' | 'uni') => {
    playClickChime();
    if (toolType === 'quiz') {
      onNavigate('quiz');
    } else if (toolType === 'exam') {
      onNavigate('examengine');
    } else if (toolType === 'notes') {
      onNavigate('notes');
    } else {
      onNavigate('university');
    }
  };

  // --------------------------------------------------------------------------
  // RENDER SKELETON LOADERS
  // --------------------------------------------------------------------------
  if (isLoading && !profile.name) {
    return (
      <div className="w-full space-y-6 animate-pulse text-slate-800 dark:text-slate-100">
        {/* Top Header Skeleton */}
        <div className="h-10 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between px-4" />
        
        {/* Welcome Banner Skeleton */}
        <div className="h-44 bg-slate-900/80 rounded-2xl border border-slate-800/80 p-6 space-y-4">
          <div className="w-48 h-4 bg-slate-800 rounded" />
          <div className="w-80 h-7 bg-slate-800 rounded" />
          <div className="w-64 h-4 bg-slate-800 rounded" />
        </div>

        {/* Learning Overview Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-slate-900/80 rounded-xl border border-slate-800/80 p-4" />
          ))}
        </div>

        {/* 2-Column Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5" />
          <div className="h-64 bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5" />
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const greetingEn = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingAm = currentHour < 12 ? 'እንደምን አደሩ' : currentHour < 17 ? 'እንደምን ዋሉ' : 'እንደምን አመሹ';

  return (
    <div id="etlearn-dashboard-root" className="w-full max-w-lg mx-auto space-y-4 text-slate-100 font-sans pb-20 select-none">
      
      {/* ─── ERROR STATE BANNER (If query fails) ─── */}
      {loadError && (
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/50 text-red-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{loadError}</span>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700/60 text-[11px] font-semibold text-white transition-colors cursor-pointer shrink-0"
          >
            {isAmharic ? 'እንደገና ሞክር' : 'Retry'}
          </button>
        </div>
      )}

      {/* ─── 1. COMPACT NATIVE ANDROID HEADER ─── */}
      <section className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              {isAmharic ? greetingAm : greetingEn}, {profile.name?.split(' ')[0] || (isAmharic ? 'ተማሪ' : 'Scholar')} 👋
            </span>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              {isAmharic ? 'ትምህርትዎን ለመቀጠል ዝግጁ ነዎት?' : 'Ready to continue learning?'}
            </h1>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-400 block">
              {ethDate.monthAm} {geezDayNumeral} ({ethDate.year} ዓ.ም)
            </span>
            {todayHoliday && (
              <span className="text-[9.5px] font-bold text-amber-400 truncate block max-w-[130px]">
                {todayHoliday.nameAm}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. QUICK ACTIONS (4 Touch Tiles) ─── */}
      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isAmharic ? 'ፈጣን አገልግሎቶች' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <QuickAction
            icon={Target}
            label={isAmharic ? 'ልምምድ' : 'Practice'}
            sublabel={isAmharic ? 'ጥያቄዎች' : 'Daily Drills'}
            badge="Qns"
            colorTheme="amber"
            onClick={() => onNavigate('quiz')}
          />
          <QuickAction
            icon={GraduationCap}
            label={isAmharic ? 'ያለፉ ፈተናዎች' : 'Past Exams'}
            sublabel={isAmharic ? 'WKU ፈተናዎች' : 'WKU & AAU'}
            badge="Exam"
            colorTheme="blue"
            onClick={() => onNavigate('university')}
          />
          <QuickAction
            icon={FileText}
            label={isAmharic ? 'ማስታወሻዎች' : 'Study Notes'}
            sublabel={isAmharic ? 'ዲጂታል መጻሕፍት' : 'Summaries'}
            badge="PDF"
            colorTheme="emerald"
            onClick={() => onNavigate('bookstore')}
          />
          <QuickAction
            icon={Bot}
            label={isAmharic ? 'አስጎብኚ AI' : 'AI Tutor'}
            sublabel={isAmharic ? 'የግል አስጠኚ' : '24/7 Asgobnyi'}
            badge="AI"
            colorTheme="purple"
            onClick={() => onNavigate('tutor')}
          />
        </div>
      </section>

      {/* ─── 4. SUBJECTS (Horizontal Scrolling Cards) ─── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {isAmharic ? 'የትምህርት አይነቶች' : 'Subjects'}
          </h2>
          <span className="text-[11px] text-slate-500">
            {isAmharic ? 'ለመለማመድ አንዱን ይምረጡ' : 'Tap to practice'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { name: 'Mathematics', nameAm: 'ሒሳብ', count: 120, icon: '📐' },
            { name: 'Emerging Tech', nameAm: 'ኢመርጂንግ ቴክ', count: 85, icon: '🤖' },
            { name: 'Biology', nameAm: 'ባዮሎጂ', count: 95, icon: '🧬' },
            { name: 'Economics', nameAm: 'ኢኮኖሚክስ', count: 70, icon: '📈' },
            { name: 'English', nameAm: 'እንግሊዝኛ', count: 110, icon: '📝' },
            { name: 'Chemistry', nameAm: 'ኬሚስትሪ', count: 90, icon: '⚗️' },
            { name: 'Physics', nameAm: 'ፊዚክስ', count: 105, icon: '⚡' },
            { name: 'Psychology', nameAm: 'ሳይኮሎጂ', count: 60, icon: '🧠' },
          ].map((sub) => (
            <button
              key={sub.name}
              type="button"
              onClick={() => {
                playClickChime();
                onNavigate('quiz');
              }}
              className="p-3 rounded-2xl bg-[#111C35] border border-slate-800 hover:border-amber-400/60 transition flex flex-col items-start min-w-[120px] shrink-0 cursor-pointer active:scale-95 group text-left"
            >
              <span className="text-lg mb-1">{sub.icon}</span>
              <span className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate w-full">
                {isAmharic ? sub.nameAm : sub.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {sub.count} {isAmharic ? 'ጥያቄዎች' : 'Qns'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── 5. RECENT ACTIVITY ─── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {isAmharic ? 'የቅርብ ጊዜ እንቅስቃሴዎች' : 'Recent Activity'}
          </h2>
          {examAttempts.length > 0 && (
            <span className="text-[10px] text-slate-500 font-mono">
              {examAttempts.length} {isAmharic ? 'ሙከራዎች' : 'attempts'}
            </span>
          )}
        </div>

        {examAttempts.length === 0 ? (
          <div className="p-3.5 rounded-2xl bg-[#111C35]/70 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                {isAmharic ? 'እስካሁን የተወሰደ ፈተና የለም። ራስዎን ይፈትሹ!' : 'No quiz attempts recorded yet.'}
              </span>
            </div>
            <button
              onClick={() => onNavigate('quiz')}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 cursor-pointer active:scale-95"
            >
              {isAmharic ? 'ፈተና ጀምር' : 'Start Quiz'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {examAttempts.slice(0, 3).map((attempt, idx) => (
              <div
                key={attempt.id || idx}
                className="p-3 rounded-2xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9.5px] font-black uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                      {attempt.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {attempt.date}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">
                    {attempt.examTitle || attempt.subject}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black font-mono text-emerald-400 block leading-tight">
                    {attempt.percentage || attempt.score}%
                  </span>
                  <span className="text-[9.5px] font-bold text-amber-400 uppercase">
                    Grade {attempt.grade || 'A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 6. YOUR PROGRESS ─── */}
      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isAmharic ? 'የእርስዎ አጠቃላይ ውጤት' : 'Your Progress'}
        </h2>
        <ProgressCard
          streak={streakCount}
          studyHours={studyHoursCount}
          completionRate={overallProgressPercentage}
          language={language}
        />
      </section>

      {/* ─── 7. PRO UPGRADE BANNER ─── */}
      <section>
        <ProBanner
          onUpgrade={() => onNavigate('examprep')}
          language={language}
        />
      </section>

      {/* ─── 8. TODAY'S STUDY GOALS & CHECKLIST ─── */}
      <section className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAmharic ? 'የዛሬ የጥናት ግቦች' : "Today's Study Checklist"}</span>
          </h2>
          <button
            onClick={() => { playClickChime(); setShowAddTaskModal(true); }}
            className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'ግብ ጨምር' : 'Add Task'}</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {tasks.slice(0, 4).map((t) => (
            <div
              key={t.id}
              onClick={() => handleToggleTask(t.id)}
              className="p-3 rounded-xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {t.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className={`text-xs font-medium truncate ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {t.title}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  handleDeleteTask(t.id, e);
                }}
                className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 9. ETHIOPIAN UNIVERSITY TELEGRAM COMMUNITY ─── */}
      <section className="p-3.5 rounded-2xl bg-[#111C35] border border-slate-800 flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
            <span>💬</span>
            <span>{isAmharic ? 'የወልቂጤ ዩኒቨርሲቲ ተማሪዎች ቻናል' : 'WKU Students Telegram'}</span>
          </span>
          <p className="text-[10.5px] text-slate-400 truncate">
            {isAmharic ? 'የጥናት ማስታወሻዎችን እና ዜናዎችን ይጋሩ' : 'Join fellow students for notes & announcements'}
          </p>
        </div>

        <a
          href="https://t.me/WolkiteUniversityCommunity"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <span>Join</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </section>

      {/* ─── 10. CAMPUS ANNOUNCEMENT SPOTLIGHT ─── */}
      {announcements.length > 0 && (
        <section className="p-3.5 rounded-2xl bg-[#111C35] border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-white truncate max-w-[200px]">
                {announcements[0]?.title}
              </span>
            </div>
            {announcements[0]?.badgeText && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                {announcements[0]?.badgeText}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {announcements[0]?.message}
          </p>
        </section>
      )}

      {/* ─── MODAL: ADD STUDY TASK ─── */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>{isAmharic ? 'አዲስ የጥናት ተግባር አክል' : 'Add Study Task'}</span>
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  {isAmharic ? 'የተግባሩ ርዕስ' : 'Task Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAmharic ? 'ምሳሌ፡ የቻፕተር 2 ሂሳብ ክለሳ' : 'e.g., Review Unit 3 Cloud Architecture'}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    {isAmharic ? 'የትምህርት አይነት' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Emerging Tech"
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    {isAmharic ? 'የሚፈጀው ጊዜ' : 'Estimated Time'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 25m"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  {isAmharic ? 'አስቀምጥ' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ANNOUNCEMENT DETAIL VIEW ─── */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-slate-100 space-y-3">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {selectedAnnouncement.badgeText || 'Notice'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedAnnouncement.date}
              </span>
            </div>

            <h3 className="text-base font-bold text-white">
              {selectedAnnouncement.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {selectedAnnouncement.message}
            </p>

            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              {isAmharic ? 'እሺ፣ ተረድቻለሁ' : 'Dismiss Announcement'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
