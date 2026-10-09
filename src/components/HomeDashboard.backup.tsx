/**
 * BACKUP FILE - PRO CODER HOME DASHBOARD
 * Saved as requested by user.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Play, GraduationCap, Calendar, CheckSquare, Square,
  CheckCircle2, Plus, Trash2, Award, Send, ArrowUpRight,
  Copy, Check, Sparkles, BookMarked, ShieldCheck, FileText,
  Lock, Unlock, ChevronRight
} from 'lucide-react';
import StudentAvatar from './StudentAvatar';
import { StudentProfile, StudyTask, ExamAttemptRecord } from '../types';
import { playClickChime, playSuccessChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { getEthiopianDate, toGeezNumeral, ETHIOPIAN_HOLIDAYS } from '../utils/ethiopianCalendar';
import { generateUniqueStudentId } from '../utils/studentId';

interface HomeDashboardProps {
  profile: StudentProfile;
  language: 'en' | 'am' | 'both';
  onNavigate: (page: 'home' | 'tutor' | 'quiz' | 'profile' | 'notes' | 'examprep' | 'bookstore' | 'university' | 'examengine' | 'upgrade', context?: any) => void;
  onUpdateGrade?: (grade: string) => void;
  streakCount: number;
  studyHoursCount: number;
}

interface CoreCourseItem {
  id: string;
  code: string;
  title: string;
  amharicTitle: string;
  stream: string;
  units: number;
  pages: number;
  isVideoFree: boolean;
  driveFileId: string;
}

const CORE_COURSES: CoreCourseItem[] = [
  {
    id: 'freshman_biology',
    code: 'Biol 1011',
    title: 'General Biology',
    amharicTitle: 'አጠቃላይ ባዮሎጂ',
    stream: 'Natural Science',
    units: 5,
    pages: 196,
    isVideoFree: true,
    driveFileId: '1On4zzWIFDWypb7kU-HMTOmx6SRwp-K7Q'
  },
  {
    id: 'freshman_chemistry',
    code: 'Chem 1011',
    title: 'General Chemistry',
    amharicTitle: 'አጠቃላይ ኬሚስትሪ',
    stream: 'Natural Science',
    units: 6,
    pages: 218,
    isVideoFree: false,
    driveFileId: '1gm0FrHxIQhxto8pfrf0Fy8NnHLDAdU0S'
  },
  {
    id: 'freshman_physics',
    code: 'Phys 1011',
    title: 'General Physics',
    amharicTitle: 'አጠቃላይ ፊዚክስ',
    stream: 'Natural Science',
    units: 6,
    pages: 232,
    isVideoFree: false,
    driveFileId: '1JUJ1wclP4yNyyv1bb8kNXOsfHDKvJqXJ'
  },
  {
    id: 'freshman_math_natural',
    code: 'Math 1011',
    title: 'Mathematics (Natural Science)',
    amharicTitle: 'የተፈጥሮ ሳይንስ ሂሳብ',
    stream: 'Natural Science',
    units: 6,
    pages: 245,
    isVideoFree: false,
    driveFileId: '1JvIpwqFCHhcme03f_MFOH7hG2x4zV9JP'
  },
  {
    id: 'freshman_economics',
    code: 'Econ 1011',
    title: 'Introduction to Economics',
    amharicTitle: 'መግቢያ የኢኮኖሚክስ ትምህርት',
    stream: 'Common',
    units: 6,
    pages: 176,
    isVideoFree: false,
    driveFileId: '1nTlrUtAVzOSOsoeG4AX883sVlIxkfDrz'
  },
  {
    id: 'freshman_emerging_tech',
    code: 'EmTe 1012',
    title: 'Emerging Technologies',
    amharicTitle: 'መግቢያ ወደ አዳዲስ ቴክኖሎጂዎች',
    stream: 'Common',
    units: 5,
    pages: 154,
    isVideoFree: false,
    driveFileId: '1sqKFF2o8ORHOnoF9VRy4x5hgY7lp-Uub'
  },
  {
    id: 'freshman_critical_thinking',
    code: 'Phil 1011',
    title: 'Critical Thinking & Logic',
    amharicTitle: 'ስነ-አመክንዮ እና ሂሳዊ አስተሳሰብ',
    stream: 'Common',
    units: 5,
    pages: 148,
    isVideoFree: false,
    driveFileId: '124Fl_yC-lWM4JiKuFwMItJUDJM5NmV9F'
  },
  {
    id: 'freshman_english_1',
    code: 'FLEn 1011',
    title: 'Communicative English I',
    amharicTitle: 'ተግባቦታዊ የእንግሊዝኛ ቋንቋ ክህሎት',
    stream: 'Common',
    units: 5,
    pages: 135,
    isVideoFree: false,
    driveFileId: '1Jq2IhWPcEoXg9If7sDlP8caqwqcjfNDk'
  }
];

export default function HomeDashboardBackup({
  profile,
  language,
  onNavigate,
  streakCount,
  studyHoursCount
}: HomeDashboardProps) {
  const isAmharic = language === 'am';
  const userId = profile.email || profile.name || 'guest_user';
  const isProUser = Boolean(profile.isPro || profile.proStatus === 'active');

  const studentId = useMemo(() => {
    return profile.studentId || generateUniqueStudentId(profile);
  }, [profile]);

  const [copiedId, setCopiedId] = useState(false);

  const ethDate = useMemo(() => getEthiopianDate(new Date()), []);
  const geezDayNumeral = useMemo(() => toGeezNumeral(ethDate.day), [ethDate.day]);

  const todayHoliday = useMemo(() => {
    return ETHIOPIAN_HOLIDAYS.find(
      h => h.day === ethDate.day && h.monthIndex === ethDate.monthIndex
    );
  }, [ethDate.day, ethDate.monthIndex]);

  const examAttempts = useMemo<ExamAttemptRecord[]>(() => {
    try {
      const raw = safeStorage.getItem(`ethiolearn_student_exam_attempts_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }, [userId]);

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    try {
      const raw = safeStorage.getItem(`ethiolearn_student_study_tasks_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: 'task_1', title: isAmharic ? 'የባዮሎጂ ዩኒት 1 ቪዲዮ እና ኖት መከታተል' : 'Review General Biology Unit 1 Free Video & PDF', isCompleted: false, subject: 'Biology' },
      { id: 'task_2', title: isAmharic ? 'የሂሳብ ካልኩለስ ምዕራፍ 2 ልምምድ' : 'Solve Math 1011 Differential Calculus past questions', isCompleted: true, subject: 'Mathematics' },
      { id: 'task_3', title: isAmharic ? 'የወልቂጤ ዩኒቨርሲቲ ያለፉ ፈተናዎች ማየት' : 'Check Wolkite University Past Exam Archives', isCompleted: false, subject: 'Past Exams' }
    ];
  });

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState(profile.subjects?.[0] || 'General');

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentId);
    setCopiedId(true);
    playClickChime();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggleTask = (taskId: string) => {
    playClickChime();
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t);
      safeStorage.setItem(`ethiolearn_student_study_tasks_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickChime();
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      safeStorage.setItem(`ethiolearn_student_study_tasks_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: StudyTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      subject: newTaskSubject.trim() || 'General',
      isCompleted: false
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    safeStorage.setItem(`ethiolearn_student_study_tasks_${userId}`, JSON.stringify(updated));
    setNewTaskTitle('');
    setShowAddTaskModal(false);
    playSuccessChime();
  };

  return (
    <div className="space-y-5 text-slate-100 max-w-7xl mx-auto pb-12">
      <section className="p-4 sm:p-5 rounded-2xl bg-[#111C35] border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <StudentAvatar
              avatar={profile.avatar}
              name={profile.name}
              size={52}
              className="border-2 border-amber-400 shrink-0 shadow-sm"
            />
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white truncate">
                  {profile.name || (isAmharic ? 'ተማሪ' : 'Scholar')}
                </h1>
                <button
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-amber-400 font-mono text-[11px] font-bold hover:border-amber-400/50 transition cursor-pointer"
                  title="Click to copy unique student ID"
                >
                  <span>{studentId}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {profile.university || 'Wolkite University'} • {profile.department || 'Freshman Common Courses'} • {profile.year || 'Year 1'}
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{isAmharic ? 'ሁሉም ፒዲኤፎች፡ 100% ነፃ' : 'All PDFs: 100% Free'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{isAmharic ? 'ባዮሎጂ፡ ክፍት ነፃ ቪዲዮ' : 'Biology: Free Video Course'}</span>
                </span>
                {isProUser ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-black bg-amber-400 text-slate-950">
                    <ShieldCheck className="w-3 h-3" />
                    <span>PRO ACTIVE</span>
                  </span>
                ) : (
                  <button
                    onClick={() => { playClickChime(); onNavigate('upgrade'); }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 cursor-pointer transition"
                  >
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>{isAmharic ? 'ሌሎች ቪዲዮዎች፡ ፕሮ (80 ብር)' : 'Other Videos: Pro (80 ETB)'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5">
            <div className="text-center px-2">
              <span className="text-lg font-black font-mono text-amber-400 block leading-tight">
                {streakCount}d
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {isAmharic ? 'ቀጣይነት' : 'Streak'}
              </span>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-lg font-black font-mono text-emerald-400 block leading-tight">
                {studyHoursCount}h
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {isAmharic ? 'የጥናት ሰዓት' : 'Study Time'}
              </span>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-lg font-black font-mono text-sky-400 block leading-tight">
                17
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {isAmharic ? 'ነፃ መጽሐፍት' : 'Free PDFs'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isAmharic ? 'የመማሪያ ክፍሎች' : 'Academic Hub'}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div
            onClick={() => { playClickChime(); onNavigate('bookstore'); }}
            className="p-3.5 rounded-xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                100% FREE
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                {isAmharic ? 'ነፃ ፒዲኤፍ መጽሐፍት' : 'Curriculum Textbooks'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {isAmharic ? '17 ኦፊሴላዊ ሞጁሎች' : '17 MoE Course Modules'}
              </p>
            </div>
          </div>

          <div
            onClick={() => { playClickChime(); onNavigate('bookstore'); }}
            className="p-3.5 rounded-xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                <Play className="w-4 h-4 fill-amber-400" />
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                OPEN VIDEO
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                {isAmharic ? 'የባዮሎጂ ቪዲዮ ትምህርት' : 'Biology Video Lectures'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {isAmharic ? 'ክፍት ነፃ ኮርስ ለሁሉም' : 'Free Open Course for All'}
              </p>
            </div>
          </div>

          <div
            onClick={() => { playClickChime(); onNavigate('university'); }}
            className="p-3.5 rounded-xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
                WKU / AAU
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                {isAmharic ? 'ያለፉ ፈተናዎች' : 'Past University Exams'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {isAmharic ? 'የሚድ እና የፋይናል ፈተናዎች' : 'Midterm & Final Papers'}
              </p>
            </div>
          </div>

          <div
            onClick={() => { playClickChime(); onNavigate('quiz'); }}
            className="p-3.5 rounded-xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                DRILLS
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                {isAmharic ? 'የልምምድ ጥያቄዎች' : 'Question Bank'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {isAmharic ? 'በምዕራፍ የተከፋፈሉ' : 'Organized by Units'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                {isAmharic ? 'የዩኒቨርሲቲ ኮርሶች ማውጫ' : 'Curriculum Courses & Study Materials'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAmharic ? 'ፒዲኤፍ በነፃ ያንብቡ • የባዮሎጂ ቪዲዮ ክፍት ነው' : 'PDFs are 100% Free • Biology Video Lectures Unlocked'}
              </p>
            </div>
            <button
              onClick={() => { playClickChime(); onNavigate('bookstore'); }}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAmharic ? 'ሁሉንም እይ' : 'View All 17'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {CORE_COURSES.map((course) => (
              <div
                key={course.id}
                className="p-3 sm:p-3.5 rounded-xl bg-[#111C35] border border-slate-800/90 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                      {course.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {course.stream}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      • {course.units} {isAmharic ? 'ክፍሎች' : 'Units'} • {course.pages}p
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {course.title}
                  </h3>
                  {course.amharicTitle && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {course.amharicTitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <button
                    onClick={() => { playClickChime(); onNavigate('bookstore'); }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    title="Read 100% Free PDF Textbook"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'ነፃ ፒዲኤፍ' : 'Read PDF'}</span>
                  </button>

                  {course.isVideoFree ? (
                    <button
                      onClick={() => { playClickChime(); onNavigate('bookstore'); }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
                      title="Watch Free Biology Video Lectures"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{isAmharic ? 'ቪዲዮ (ነፃ)' : 'Watch Video (Free)'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        playClickChime();
                        if (isProUser) {
                          onNavigate('bookstore');
                        } else {
                          onNavigate('upgrade');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        isProUser 
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black' 
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      }`}
                      title={isProUser ? 'Watch Pro Video Lecture' : 'Pro Video Lecture (80 ETB)'}
                    >
                      {isProUser ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>{isAmharic ? 'ቪዲዮ እይ' : 'Watch Video'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isAmharic ? 'ቪዲዮ (ፕሮ)' : 'Video (Pro)'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <section className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <span>{isAmharic ? 'የጥናት ተግባራት ዝርዝር' : "Today's Study Checklist"}</span>
              </h2>
              <button
                onClick={() => { playClickChime(); setShowAddTaskModal(true); }}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ተግባር ጨምር' : 'Add Task'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-[#111C35]/60 border border-dashed border-slate-800 text-xs text-slate-400">
                  {isAmharic ? 'የታቀደ የጥናት ተግባር የለም። አዲስ ተግባር ያክሉ!' : 'No tasks scheduled. Add your study goals above.'}
                </div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className="p-3 rounded-xl bg-[#111C35] border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {t.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className={`text-xs font-medium truncate ${t.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {t.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(t.id, e)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <section className="p-4 rounded-2xl bg-[#111C35] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isAmharic ? 'የኢትዮጵያ ቀን አቆጣጠር' : 'Ethiopian Calendar'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {ethDate.year} ዓ.ም
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 block">
                  {ethDate.dayOfWeekAm || 'ሰኞ'}
                </span>
                <span className="text-xl font-black text-white">
                  {ethDate.monthAm || ethDate.monthName || 'መስከረም'} {geezDayNumeral}
                </span>
                <span className="text-[11px] text-slate-400 font-mono block">
                  {ethDate.monthEn || 'Meskerem'} {ethDate.day}
                </span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-amber-400">
                <span className="text-base font-black font-mono leading-none">{geezDayNumeral}</span>
                <span className="text-[8.5px] font-semibold uppercase mt-0.5">
                  {(ethDate?.monthAm || ethDate?.monthName || 'መስከ').slice(0, 3)}
                </span>
              </div>
            </div>

            {todayHoliday && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 font-semibold truncate">
                {todayHoliday.nameAm}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{isAmharic ? 'የትምህርት ክፍለ-ጊዜ' : 'Academic Session'}</span>
              <span className="font-semibold text-slate-300">
                {isAmharic ? '1ኛ ሴሚስተር · 2018 ዓ.ም' : 'Semester I · 2018 E.C.'}
              </span>
            </div>
          </section>

          <section className="p-4 rounded-2xl bg-gradient-to-br from-[#111C35] to-[#0E172C] border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                VIDEO LECTURE PASS
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                80 ETB
              </span>
            </div>

            <h3 className="text-sm font-bold text-white leading-tight">
              {isAmharic ? 'የሁሉንም ኮርሶች ቪዲዮ ትምህርት ይክፈቱ' : 'Unlock All Course Video Lectures'}
            </h3>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAmharic 
                ? 'የባዮሎጂ ቪዲዮ ነፃ ነው። ለኬሚስትሪ፣ ፊዚክስ፣ ሂሳብ እና ሌሎች በቴሌብር ወይም በንግድ ባንክ በቀላሉ ይክፈሉ።'
                : 'Biology videos are free. Unlock Chemistry, Physics, Math, Economics and more via Telebirr & CBE Birr.'}
            </p>

            <button
              onClick={() => { playClickChime(); onNavigate('upgrade'); }}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
            >
              <span>{isAmharic ? 'በቴሌብር / ንግድ ባንክ አሳድግ' : 'Upgrade Pro via Telebirr'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </section>

          <section className="p-3.5 rounded-2xl bg-[#111C35] border border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{isAmharic ? 'የተማሪዎች ቴሌግራም ቻናል' : 'Student Telegram Hub'}</span>
              </span>
              <p className="text-[10.5px] text-slate-400 truncate">
                @Et_Learnn • Study materials & notes
              </p>
            </div>

            <a
              href="https://t.me/Et_Learnn"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Join</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </section>

          {examAttempts.length > 0 && (
            <section className="p-3.5 rounded-2xl bg-[#111C35] border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isAmharic ? 'የቅርብ ጊዜ ፈተናዎች' : 'Recent Quiz Attempts'}
              </h3>
              <div className="space-y-1.5">
                {examAttempts.slice(0, 3).map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-300 truncate max-w-[150px]">{att.subject}</span>
                    <span className="font-mono font-bold text-emerald-400">{att.percentage || att.score}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3.5 text-slate-100">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>{isAmharic ? 'አዲስ የጥናት ተግባር አክል' : 'Add Study Task'}</span>
            </h3>

            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {isAmharic ? 'የተግባሩ ርዕስ' : 'Task Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAmharic ? 'ምሳሌ፡ የባዮሎጂ ቻፕተር 2 ክለሳ' : 'e.g., Biology Unit 2 cell biology review'}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {isAmharic ? 'የትምህርት አይነት' : 'Subject'}
                </label>
                <input
                  type="text"
                  placeholder="e.g., Biology, Physics, Economics"
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  {isAmharic ? 'አስቀምጥ' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
