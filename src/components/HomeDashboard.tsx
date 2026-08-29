import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bot, BookOpen, Play, GraduationCap, FileText, Bell, Star, Clock, CheckCircle2, 
  Flame, Calendar, Target, CheckSquare, Square, TrendingUp, ArrowRight, 
  ShieldCheck, X, ChevronRight, Bookmark, Award, Plus, Trash2, RefreshCw,
  AlertCircle, Sparkles, BookCheck, HelpCircle, Layers, CheckCircle, BarChart3,
  ExternalLink, Compass, Lightbulb, BrainCircuit, ArrowUpRight
} from 'lucide-react';
import { 
  StudentProfile, CourseRecord, PlatformAnnouncement, StudyTask, ExamAttemptRecord, 
  StudentCourseProgress, AITeacherContext 
} from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { getEthiopianDate, toGeezNumeral, ETHIOPIAN_HOLIDAYS } from '../utils/ethiopianCalendar';
import { 
  fetchPublishedCourses, fetchAnnouncements, fetchAllStudentCourseProgresses, 
  fetchStudentExamAttempts, fetchStudentTasks, saveStudentTask, 
  toggleStudentTaskStatus, deleteStudentTask 
} from '../utils/supabaseCourses';

interface HomeDashboardProps {
  profile: StudentProfile;
  language: 'en' | 'am' | 'both';
  onNavigate: (page: 'home' | 'tutor' | 'quiz' | 'profile' | 'notes' | 'examprep' | 'bookstore' | 'university' | 'courses' | 'examengine', context?: AITeacherContext) => void;
  onUpdateGrade: (grade: string) => void;
  streakCount: number;
  studyHoursCount: number;
  onSelectCourse?: (courseId: string) => void;
}

export default function HomeDashboard({
  profile,
  language,
  onNavigate,
  onUpdateGrade,
  streakCount,
  studyHoursCount,
  onSelectCourse
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

  // Greeting based on time of day
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (isAmharic) {
      if (hour < 12) return 'እንደምን አደሩ';
      if (hour < 17) return 'እንደምን ዋሉ';
      return 'እንደምን አመሹ';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [isAmharic]);

  // --------------------------------------------------------------------------
  // REAL DATABASE STATE
  // --------------------------------------------------------------------------
  const activeLevel = profile.year === 'University' ? 'University' : 'Grade 12';
  
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [progressMap, setProgressMap] = useState<{ [courseId: string]: StudentCourseProgress }>({});
  const [examAttempts, setExamAttempts] = useState<ExamAttemptRecord[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
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
  // LOAD ALL REAL DATABASE RECORDS (Deduplicated & Synchronized)
  // --------------------------------------------------------------------------
  const loadDashboardData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);
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

      setCourses(uniqueCourses);
      setProgressMap(fetchedProgress || {});
      setExamAttempts(fetchedAttempts || []);
      setTasks(fetchedTasks || []);
      setAnnouncements(fetchedAnnouncements || []);
    } catch (err: any) {
      console.error('Failed to load real dashboard data:', err);
      setLoadError(isAmharic ? 'የጥናት መረጃን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።' : 'Unable to load your learning data from the server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeLevel, userId, isAmharic]);

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

  // AI Teacher prompt helpers
  const handleOpenAIWithPrompt = (promptType: 'explain' | 'quiz' | 'summarize' | 'flashcards' | 'difficult') => {
    playClickChime();
    const activeSubject = mostRecentCourse?.subject || profile.subjects?.[0] || 'General';
    const activeTitle = mostRecentCourse?.title || 'Academic Coursework';

    let promptContext: AITeacherContext = {
      mode: 'teaching',
      courseTitle: activeTitle,
      subject: activeSubject
    };

    if (promptType === 'quiz') {
      promptContext.mode = 'quiz';
    }

    onNavigate('tutor', promptContext);
  };

  // --------------------------------------------------------------------------
  // RENDER SKELETON LOADERS
  // --------------------------------------------------------------------------
  if (isLoading) {
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

  return (
    <div id="etlearn-dashboard-root" className="w-full space-y-7 text-slate-100 font-sans">
      
      {/* ─── ERROR STATE BANNER (If query fails) ─── */}
      {loadError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700/60 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'እንደገና ሞክር' : 'Try Again'}</span>
          </button>
        </div>
      )}

      {/* ─── 1. TOP SUB-BAR (Calendar & Verified Announcements) ─── */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-800/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Ge'ez Academic Calendar Date */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-slate-200">
              {ethDate.monthName} {ethDate.day} ({geezDayNumeral}), {ethDate.year} ዓ.ም.
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
              {isAmharic ? 'የአካዳሚክ ቀን' : 'Academic'}
            </span>
          </div>

          {/* Holiday notice if active */}
          {todayHoliday && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{isAmharic ? todayHoliday.nameAm : todayHoliday.nameEn}</span>
            </span>
          )}
        </div>

        {/* Action Controls: Refresh & Notification Drawer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title={isAmharic ? 'መረጃ አድስ' : 'Refresh Dashboard'}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => { playClickChime(); setShowNotifications(!showNotifications); }}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-slate-700 transition-all relative cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title={isAmharic ? 'ማስታወቂያዎች' : 'Platform Announcements'}
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-xs text-slate-300">
                {isAmharic ? 'ማስታወቂያ' : 'Notices'}
              </span>
              {unreadAnnouncementsCount > 0 && (
                <span className="w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                  {unreadAnnouncementsCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {isAmharic ? 'የዩኒቨርሲቲ ማስታወቂያዎች' : 'Campus Announcements'}
                    </span>
                  </div>
                  {unreadAnnouncementsCount > 0 && (
                    <button
                      onClick={handleMarkAllAnnouncementsRead}
                      className="text-[11px] text-amber-400 hover:underline cursor-pointer font-medium"
                    >
                      {isAmharic ? 'ሁሉንም አንብብ' : 'Mark all read'}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {announcements.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      {isAmharic ? 'ምንም አዲስ ማስታወቂያ የለም።' : 'No announcements published at this time.'}
                    </div>
                  ) : (
                    announcements.map(ann => {
                      const isRead = readAnnouncementIds.includes(ann.id);
                      return (
                        <div
                          key={ann.id}
                          onClick={() => { 
                            handleMarkAnnouncementRead(ann.id);
                            setSelectedAnnouncement(ann); 
                            setShowNotifications(false); 
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isRead 
                              ? 'bg-slate-950/40 border-slate-800 text-slate-400' 
                              : 'bg-slate-950 border-amber-500/30 text-slate-100 hover:border-amber-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-[12px] text-slate-100 line-clamp-1">{ann.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{ann.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{ann.message}</p>
                          {ann.badgeText && (
                            <span className="inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                              {ann.badgeText}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. EDITORIAL SCHOLAR HERO COMMAND CENTER ─── */}
      <section className="p-6 sm:p-7 rounded-2xl bg-[#111C35] border border-slate-800/90 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            {/* Academic Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                {profile.year || (activeLevel === 'University' ? 'University Student' : 'Grade 12 Scholar')}
              </span>
              {profile.subjects && profile.subjects[0] && (
                <span className="px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60 text-xs font-medium">
                  {profile.subjects[0]}
                </span>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{streakCount} {streakCount === 1 ? 'Day Streak' : 'Days Streak'}</span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {greetingText}, {profile.name || 'Scholar'}
              </h1>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                {isAmharic 
                  ? 'ወደ እለታዊ የጥናት ማዕከልዎ እንኳን ደህና መጡ። የዩኒቨርሲቲ ሞጁሎች፣ መምህሩን ጠይቅ (Ask Teacher) እና ያለፉ ፈተናዎች ተዘጋጅተዋል።' 
                  : 'Welcome to your academic study cockpit. Your university modules, Ask Teacher AI, and model exams are synchronized.'}
              </p>
            </div>

            {/* Quick Metrics Bar (Clean, Non-Trope Horizontal Strip) */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 pt-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-400">{isAmharic ? 'የጥናት ሰዓት: ' : 'Study Log: '}</span>
                <span className="font-semibold text-slate-100 font-mono">{studyHoursCount} hrs</span>
                <span className="text-slate-500">({goalProgressPercentage}% of {targetHours}h goal)</span>
              </div>

              <span className="text-slate-700 hidden sm:inline">•</span>

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400">{isAmharic ? 'የተጠናቀቁ ኮርሶች: ' : 'Curriculum: '}</span>
                <span className="font-semibold text-emerald-400 font-mono">{overallProgressPercentage}% completed</span>
              </div>

              {averageExamScore !== null && (
                <>
                  <span className="text-slate-700 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-400">{isAmharic ? 'የፈተና አማካኝ: ' : 'Avg Exam: '}</span>
                    <span className="font-semibold text-amber-400 font-mono">{averageExamScore}%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => {
                playClickChime();
                if (mostRecentCourse && onSelectCourse) {
                  onSelectCourse(mostRecentCourse.id);
                } else {
                  onNavigate('courses');
                }
              }}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4 text-slate-950" />
              <span>{isAmharic ? 'ትምህርት ቀጥል' : 'Continue Learning'}</span>
            </button>

            <button
              onClick={() => {
                playClickChime();
                onNavigate('tutor', {
                  mode: 'teaching',
                  courseTitle: mostRecentCourse?.title,
                  subject: mostRecentCourse?.subject
                });
              }}
              className="px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:border-amber-500/40 active:scale-[0.98]"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>{isAmharic ? 'መምህሩን ጠይቅ' : 'Ask Teacher'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 3. TOP QUICK ACCESS WORKSPACE (Placed Prominently Near Top!) ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>{isAmharic ? 'ፈጣን የጥናት መዳረሻ ክፍሎች' : 'Quick Study Stations'}</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            {isAmharic ? 'ወደ ዋና ዋና የትምህርት ክፍሎች ፈጣን መሸጋገሪያ' : 'Fast-track to core study tools'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. University Hub */}
          <button
            onClick={() => { playClickChime(); onNavigate('university'); }}
            className="p-4 rounded-xl bg-[#111C35] border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer text-left group flex flex-col justify-between h-28 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {isAmharic ? 'ወልቂጤ/አዲስ' : 'WKU/AAU'}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                {isAmharic ? 'የዩኒቨርሲቲ ፈተናዎች' : 'University Hub'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">Mid & Final Papers</span>
            </div>
          </button>

          {/* 2. Ask Teacher */}
          <button
            onClick={() => { playClickChime(); onNavigate('tutor'); }}
            className="p-4 rounded-xl bg-[#111C35] border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer text-left group flex flex-col justify-between h-28 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                AI Active
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                {isAmharic ? 'መምህሩን ጠይቅ' : 'Ask Teacher'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">Step-by-step Q&A</span>
            </div>
          </button>

          {/* 3. Exam Engine / Practice */}
          <button
            onClick={() => { playClickChime(); onNavigate('examengine'); }}
            className="p-4 rounded-xl bg-[#111C35] border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer text-left group flex flex-col justify-between h-28 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 fill-emerald-400/20" />
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Timed
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                {isAmharic ? 'የፈተና ሞተር' : 'Exam Engine'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">Interactive Mock Tests</span>
            </div>
          </button>

          {/* 4. Study Notes */}
          <button
            onClick={() => { playClickChime(); onNavigate('notes'); }}
            className="p-4 rounded-xl bg-[#111C35] border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer text-left group flex flex-col justify-between h-28 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Summaries
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                {isAmharic ? 'የጥናት ማስታወሻ' : 'Study Notes'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">High-Yield Summaries</span>
            </div>
          </button>

          {/* 5. National Exam Prep */}
          <button
            onClick={() => { playClickChime(); onNavigate('examprep'); }}
            className="p-4 rounded-xl bg-[#111C35] border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer text-left group flex flex-col justify-between h-28 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Grade 12
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
                {isAmharic ? 'ብሔራዊ ፈተና' : 'National Exam'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">Blueprint Models</span>
            </div>
          </button>

          {/* 6. Digital Bookstore */}
          <button
            onClick={() => { playClickChime(); onNavigate('bookstore'); }}
            className="p-4 rounded-xl bg-[#111C35] border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer text-left group flex flex-col justify-between h-28 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Library
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                {isAmharic ? 'መጻሕፍት ቤት' : 'Book Store'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">Digital Textbooks</span>
            </div>
          </button>
        </div>
      </section>

      {/* ─── 4. MAIN TWO-COLUMN DASHBOARD WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── LEFT COLUMN: CORE ACADEMIC MODULES & EXAM HUB (7 COLS / ~60%) ─── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active / Continue Learning Block */}
          <section className="p-5 sm:p-6 rounded-2xl bg-[#111C35] border border-slate-800/90 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BookCheck className="w-4 h-4 text-amber-400" />
                  <span>{isAmharic ? 'ጥናትዎን ይቀጥሉ' : 'Continue Learning'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAmharic ? 'በቅርብ ያጠኗቸው እና በእጅዎ ያሉ የኮርስ ክፍሎች' : 'Pick up exactly where you left off'}
                </p>
              </div>

              <button
                onClick={() => onNavigate('courses')}
                className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <span>{isAmharic ? 'ሁሉንም ኮርሶች እይ' : 'All Courses'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {inProgressCourses.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {isAmharic ? 'የተጀመረ ኮርስ የለም' : 'Ready to start your first course'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isAmharic 
                      ? 'ከስርዓተ ትምህርቱ ውስጥ ኮርስ ሲጀምሩ የቀጣይነት እድገትዎ እዚህ ይመዘገባል።' 
                      : 'Choose a curriculum course to begin structured chapter lessons with AI tutoring.'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('courses')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>{isAmharic ? 'ኮርሶችን ይምረጡ' : 'Browse Courses'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressCourses.slice(0, 3).map(({ course, progressPercentage, completedCount }) => {
                  const isBookmarked = bookmarkedCourseIds.includes(course.id);
                  return (
                    <div
                      key={course.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {course.subject}
                          </span>
                          <span className="text-xs text-slate-400">
                            {completedCount} / {course.lessonsCount || 6} lessons done
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate">{course.title}</h3>
                        <div className="w-full max-w-md h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span className="font-mono text-xs text-amber-400 font-bold mr-1">
                          {progressPercentage}%
                        </span>
                        <button
                          onClick={() => {
                            playClickChime();
                            if (onSelectCourse) onSelectCourse(course.id);
                            else onNavigate('courses');
                          }}
                          className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>{isAmharic ? 'ቀጥል' : 'Resume'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Curriculum Courses Explorer with Level Switcher */}
          <section className="p-5 sm:p-6 rounded-2xl bg-[#111C35] border border-slate-800/90 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{isAmharic ? 'የስርዓተ ትምህርት ኮርሶች' : 'Published Curriculum Modules'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAmharic ? 'የተረጋገጡ የዩኒቨርሲቲ እና የ12ኛ ክፍል የትምህርት ክፍሎች' : 'Structured lecture modules with interactive tests'}
                </p>
              </div>

              {/* Level Switcher (Grade 12 / University) */}
              <div className="flex bg-[#0F172A] p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => { playClickChime(); onUpdateGrade('Grade 12'); }}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeLevel === 'Grade 12'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Grade 12
                </button>
                <button
                  onClick={() => { playClickChime(); onUpdateGrade('University'); }}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeLevel === 'University'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  University
                </button>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
                <BookOpen className="w-7 h-7 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-300">
                  {isAmharic ? 'ምንም የታተመ ኮርስ አልተገኘም' : `No courses published for ${activeLevel} yet.`}
                </h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {courses.slice(0, 4).map(course => {
                  const prog = progressMap[course.id];
                  const pct = prog?.progressPercentage || 0;
                  const isBookmarked = bookmarkedCourseIds.includes(course.id);

                  return (
                    <div
                      key={course.id}
                      onClick={() => {
                        playClickChime();
                        if (onSelectCourse) onSelectCourse(course.id);
                        else onNavigate('courses');
                      }}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {course.subject}
                          </span>
                          <button
                            onClick={(e) => handleToggleBookmark(course.id, e)}
                            className="text-slate-400 hover:text-amber-400 transition-colors p-1 cursor-pointer"
                          >
                            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-1">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {course.instructorName || 'EthioLearn Faculty'} • {course.lessonsCount || 6} Lessons
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-amber-400 font-semibold">
                          {pct > 0 ? `${pct}% done` : (isAmharic ? 'አልተጀመረም' : 'Start now')}
                        </span>
                        <span className="text-slate-400 group-hover:text-amber-400 font-medium inline-flex items-center gap-1 transition-colors">
                          <span>{isAmharic ? 'ክፈት' : 'Open'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Model Exam & University Past Exam Hub Banner */}
          <section className="p-5 sm:p-6 rounded-2xl bg-[#111C35] border border-slate-800/90 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isAmharic ? 'የዩኒቨርሲቲ እና ሞዴል ፈተናዎች' : 'University & Model Exam Papers'}
                </h2>
              </div>
              <button
                onClick={() => onNavigate('university')}
                className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                {isAmharic ? 'ሁሉንም እይ' : 'View Library'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: University Mid & Final Papers */}
              <div 
                onClick={() => { playClickChime(); onNavigate('university'); }}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-semibold">
                    WKU • AAU • JU
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  {isAmharic ? 'የዩኒቨርሲቲ ያለፉ ፈተናዎች' : 'University Past Exam Papers'}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Real midterms & final exams with verified answer keys across all departments.
                </p>
              </div>

              {/* Card 2: Interactive Exam Engine */}
              <div 
                onClick={() => { playClickChime(); onNavigate('examengine'); }}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                    Live Timing
                  </span>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {isAmharic ? 'የፈተና ሞተር (Exam Engine)' : 'Timed Mock Exam Engine'}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Simulate official exam conditions with countdown timers and instant grading.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* ─── RIGHT COLUMN: DAILY STUDY COMPANION & AI PROMPTS (5 COLS / ~40%) ─── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Today's Study Planner (Tasks & Daily Goal) */}
          <section className="p-5 sm:p-6 rounded-2xl bg-[#111C35] border border-slate-800/90 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isAmharic ? 'የእለት የጥናት እቅድ' : "Today's Study Plan"}
                </h3>
              </div>

              {/* Goal Adjuster */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => handleUpdateTargetHours(-0.5)}
                  className="text-slate-400 hover:text-white px-1 font-bold cursor-pointer"
                  title="Decrease target"
                >
                  -
                </button>
                <span className="text-[10px] font-mono text-amber-400 font-bold">{targetHours}h goal</span>
                <button
                  onClick={() => handleUpdateTargetHours(0.5)}
                  className="text-slate-400 hover:text-white px-1 font-bold cursor-pointer"
                  title="Increase target"
                >
                  +
                </button>
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60 p-4 space-y-2">
                  <p>{isAmharic ? 'ምንም የታቀደ የጥናት ስራ የለም።' : 'No tasks scheduled for today yet.'}</p>
                  <button
                    onClick={() => { playClickChime(); setShowAddTaskModal(true); }}
                    className="text-amber-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'አዲስ ተግባር አክል' : 'Add First Task'}</span>
                  </button>
                </div>
              ) : (
                tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                      task.isCompleted
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                        : 'bg-slate-950 border-slate-800 hover:border-amber-500/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button className="shrink-0 text-amber-400">
                        {task.isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <span className={`text-xs block truncate ${task.isCompleted ? 'line-through text-slate-400' : 'font-medium text-slate-100'}`}>
                          {task.title}
                        </span>
                        {task.subject && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {task.subject}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {task.duration || '25m'}
                      </span>
                      <button
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="text-slate-600 hover:text-red-400 p-1 transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                {completedTasksCount} of {tasks.length} {isAmharic ? 'ተጠናቋል' : 'completed'}
              </span>

              <button
                onClick={() => { playClickChime(); setShowAddTaskModal(true); }}
                className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ተግባር አክል' : 'Add Task'}</span>
              </button>
            </div>
          </section>

          {/* 2. Ask Teacher Study Prompts ("ፈጣን የAI መጠየቂያዎች") */}
          <section className="p-5 sm:p-6 rounded-2xl bg-[#111C35] border border-slate-800/90 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isAmharic ? 'መምህሩን ጠይቅ - ፈጣን ጥያቄዎች' : 'Ask Teacher Study Prompts'}
                </h3>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleOpenAIWithPrompt('explain')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group flex items-start gap-2.5"
              >
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors block">
                    {isAmharic ? 'ርዕስ አብራራልኝ' : 'Explain a Topic'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    Clear conceptual breakdown
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleOpenAIWithPrompt('quiz')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group flex items-start gap-2.5"
              >
                <BookCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors block">
                    {isAmharic ? 'የልምምድ ጥያቄዎች' : 'Generate MCQs'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    With full step answers
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  playClickChime();
                  onNavigate('notes');
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/40 text-left transition-all cursor-pointer group flex items-start gap-2.5"
              >
                <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors block">
                    {isAmharic ? 'ማስታወሻ አጠቃልል' : 'Summarize Notes'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    High-yield cheat sheets
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleOpenAIWithPrompt('difficult')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-left transition-all cursor-pointer group flex items-start gap-2.5"
              >
                <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition-colors block">
                    {isAmharic ? 'ከባድ ጥያቄ ፍታ' : 'Solve Hard Problem'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    Mathematical reasoning
                  </span>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                {mostRecentCourse ? `Subject: ${mostRecentCourse.subject}` : 'General University'}
              </span>

              <button
                onClick={() => onNavigate('tutor')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
              >
                <span>{isAmharic ? 'ክፈት' : 'Open AI Studio'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          {/* 3. Campus Bulletins (Notice Snippet) */}
          {announcements.length > 0 && (
            <section className="p-5 rounded-2xl bg-[#111C35] border border-slate-800/90 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {isAmharic ? 'የቅርብ ማስታወቂያ' : 'Campus Bulletin'}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500">{announcements[0]?.date}</span>
              </div>

              <div 
                onClick={() => {
                  setSelectedAnnouncement(announcements[0]);
                }}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-100 line-clamp-1">{announcements[0]?.title}</span>
                  {announcements[0]?.badgeText && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                      {announcements[0]?.badgeText}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {announcements[0]?.message}
                </p>
              </div>
            </section>
          )}

        </div>

      </div>

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
