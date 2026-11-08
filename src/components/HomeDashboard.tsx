import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Play, GraduationCap, Calendar,
  Award, Send, ArrowUpRight,
  ShieldCheck, Lock, ChevronRight, X,
  Megaphone, Bell, Sparkles, FileText, Download
} from 'lucide-react';
import StudentAvatar from './StudentAvatar';
import { StudentProfile, ExamAttemptRecord, PlatformAnnouncement } from '../types';
import { playClickChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { getEthiopianDate, toGeezNumeral, ETHIOPIAN_HOLIDAYS } from '../utils/ethiopianCalendar';
import { fetchAnnouncements } from '../utils/supabaseCourses';

interface HomeDashboardProps {
  profile: StudentProfile;
  language: 'en' | 'am' | 'both';
  onNavigate: (page: 'home' | 'tutor' | 'quiz' | 'profile' | 'notes' | 'examprep' | 'bookstore' | 'university' | 'examengine' | 'upgrade' | 'mindrelax', context?: any) => void;
  onUpdateGrade?: (grade: string) => void;
  streakCount: number;
  studyHoursCount: number;
  onOpenSidebar?: () => void;
  onOpenAnnouncements?: () => void;
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
    isVideoFree: true,
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

export default function HomeDashboard({
  profile,
  language,
  onNavigate,
  streakCount,
  studyHoursCount,
  onOpenSidebar,
  onOpenAnnouncements
}: HomeDashboardProps) {
  const isAmharic = language === 'am';
  const userId = profile.email || profile.name || 'guest_user';
  const isProUser = Boolean(profile.isPro || profile.proStatus === 'active');

  const [latestAnnouncements, setLatestAnnouncements] = useState<PlatformAnnouncement[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchAnnouncements(true).then((list) => {
      if (isMounted && list && list.length > 0) {
        setLatestAnnouncements(list.slice(0, 3));
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const ethDate = useMemo(() => getEthiopianDate(new Date()), []);
  const geezDayNumeral = useMemo(() => toGeezNumeral(ethDate.day), [ethDate.day]);

  const todayHoliday = useMemo(() => {
    return ETHIOPIAN_HOLIDAYS.find(
      h => h.day === ethDate.day && h.monthIndex === ethDate.monthIndex
    );
  }, [ethDate.day, ethDate.monthIndex]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return isAmharic ? 'እንደምን አደሩ' : 'Good morning';
    }
    if (hour < 17) {
      return isAmharic ? 'እንደምን ዋሉ' : 'Good afternoon';
    }
    return isAmharic ? 'እንደምን አመሹ' : 'Good evening';
  }, [isAmharic]);

  const examAttempts = useMemo<ExamAttemptRecord[]>(() => {
    try {
      const raw = safeStorage.getItem(`ethiolearn_student_exam_attempts_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }, [userId]);

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100 max-w-7xl mx-auto pb-12 transition-colors duration-200">
      <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <StudentAvatar
              avatar={profile.avatar}
              name={profile.name}
              size={52}
              className="border-2 border-amber-400 shrink-0 shadow-sm"
            />
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                <span>{greeting}!</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {isAmharic ? 'ትምህርትህን ለመቀጠል ዝግጁ ነህ?' : 'Ready to continue learning?'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {profile.name || (isAmharic ? 'ተማሪ' : 'Scholar')}
                </h1>
                {isProUser && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-black bg-amber-400 text-slate-950">
                    <ShieldCheck className="w-3 h-3" />
                    <span>PRO</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {profile.university || 'Wolkite University'} • {profile.department || 'Freshman Common Courses'} • {profile.year || 'Year 1'}
              </p>
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
            className="p-3.5 rounded-xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-slate-700 transition flex flex-col justify-between cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                100% FREE
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition truncate">
                {isAmharic ? 'ነፃ ፒዲኤፍ መጽሐፍት' : 'Curriculum Textbooks'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {isAmharic ? '17 ኦፊሴላዊ ሞጁሎች' : '17 MoE Course Modules'}
              </p>
            </div>
          </div>

          <div
            onClick={() => { playClickChime(); onNavigate('bookstore'); }}
            className="p-3.5 rounded-xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-slate-700 transition flex flex-col justify-between cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-400">
                <Play className="w-4 h-4 fill-amber-400" />
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                OPEN VIDEO
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition truncate">
                {isAmharic ? 'የባዮሎጂ ቪዲዮ ትምህርት' : 'Biology Video Lectures'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {isAmharic ? 'ክፍት ነፃ ኮርስ ለሁሉም' : 'Free Open Course for All'}
              </p>
            </div>
          </div>

          <div
            onClick={() => { playClickChime(); onNavigate('university'); }}
            className="p-3.5 rounded-xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-slate-700 transition flex flex-col justify-between cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                WKU / AAU
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition truncate">
                {isAmharic ? 'ያለፉ ፈተናዎች' : 'Past University Exams'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {isAmharic ? 'የሚድ እና የፋይናል ፈተናዎች' : 'Midterm & Final Papers'}
              </p>
            </div>
          </div>

          <div
            onClick={() => { playClickChime(); onNavigate('notes'); }}
            className="p-3.5 rounded-xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-slate-700 transition flex flex-col justify-between cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                NOTES
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition truncate">
                {isAmharic ? 'የጥናት ማስታወሻዎች' : 'Study Notes & Sheets'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {isAmharic ? 'የግልና የዩኒቨርሲቲ ማጠቃለያዎች' : 'Personal & Faculty Notes'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 📢 MINI CAMPUS ANNOUNCEMENTS TICKER / BAR */}
      <section 
        onClick={() => {
          if (onOpenAnnouncements) {
            playClickChime();
            onOpenAnnouncements();
          }
        }}
        className="px-2.5 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-amber-500/10 via-[#111C35]/90 to-[#0A1128]/90 border border-amber-500/25 hover:border-amber-500/40 transition-all cursor-pointer shadow-xs group flex items-center justify-between gap-2 text-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
            <Megaphone className="w-3 h-3 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/25 px-1 py-0.2 rounded shrink-0">
              {latestAnnouncements[0]?.badgeText || (isAmharic ? 'ማስታወቂያ' : 'Notice')}
            </span>
            <p className="text-[11px] font-medium text-slate-200 group-hover:text-amber-300 transition-colors truncate">
              {latestAnnouncements[0]?.title || (isAmharic ? 'የወልቂጤ ዩኒቨርሲቲ እና የብሔራዊ ፈተናዎች ይፋዊ ማስታወቂያ' : 'Official Wolkite University & National Exam Archives Active')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 text-amber-400 text-[10px] font-bold group-hover:translate-x-0.5 transition-transform">
          <span className="hidden min-[380px]:inline">{isAmharic ? 'እይ' : 'View'}</span>
          <ChevronRight className="w-3 h-3" />
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
                {isAmharic ? 'ፒዲኤፍ በነፃ ያንብቡ • የባዮሎጂ እና ኬሚስትሪ ቪዲዮዎች ክፍት ናቸው' : 'PDFs are 100% Free • Biology & Chemistry Videos Unlocked'}
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
                className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400">
                      {course.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {course.stream}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      • {course.units} {isAmharic ? 'ክፍሎች' : 'Units'} • {course.pages}p
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {course.title}
                  </h3>
                  {course.amharicTitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {course.amharicTitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800/60 flex-wrap">
                  <button
                    onClick={() => { playClickChime(); onNavigate('bookstore'); }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    title="Read 100% Free PDF Textbook"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'ነፃ ፒዲኤፍ' : 'Read PDF'}</span>
                  </button>

                  {course.isVideoFree ? (
                    <button
                      onClick={() => { playClickChime(); onNavigate('bookstore'); }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs group/play"
                      title="Watch Free Biology Video Lectures & Exams"
                    >
                      <Play className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400 group-hover/play:scale-110 transition-transform" />
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
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        isProUser 
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300' 
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                      title={isProUser ? 'Watch Pro Video Lecture in Bookstore' : 'Pro Video Lecture (From 99 ETB)'}
                    >
                      {isProUser ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
                          <span>{isAmharic ? 'ቪዲዮ እይ' : 'Watch Video'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{isAmharic ? 'ቪዲዮ (ፕሮ)' : 'Video (Pro)'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <section className="p-4 rounded-2xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {isAmharic ? 'የኢትዮጵያ ቀን አቆጣጠር' : 'Ethiopian Calendar'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {ethDate.year} ዓ.ም
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                  {ethDate.dayOfWeekAm || 'ሰኞ'}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {ethDate.monthAm || ethDate.monthName || 'መስከረም'} {geezDayNumeral}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                  {ethDate.monthEn || 'Meskerem'} {ethDate.day}
                </span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400">
                <span className="text-base font-black font-mono leading-none">{geezDayNumeral}</span>
                <span className="text-[8.5px] font-semibold uppercase mt-0.5">
                  {(ethDate?.monthAm || ethDate?.monthName || 'መስከ').slice(0, 3)}
                </span>
              </div>
            </div>

            {todayHoliday && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-300 font-semibold truncate">
                {todayHoliday.nameAm}
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{isAmharic ? 'የትምህርት ክፍለ-ጊዜ' : 'Academic Session'}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isAmharic ? '1ኛ ሴሚስተር · 2018 ዓ.ም' : 'Semester I · 2018 E.C.'}
              </span>
            </div>
          </section>

          <section className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-[#111C35] dark:to-[#0E172C] border border-amber-500/30 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                VIDEO LECTURE PASS
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                From 99 ETB
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {isAmharic ? 'የሁሉንም ኮርሶች ፈተናዎች እና AI አስጎብኚ ይክፈቱ' : 'Unlock All Past Exams & AI Tutor'}
            </h3>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAmharic 
                ? 'የወልቂጤ ዩኒቨርሲቲ እና የብሔራዊ ፈተናዎች ማህደር፣ ደረጃ በደረጃ የ AI አስጎብኚ ትንታኔ በቴሌብር ወይም በንግድ ባንክ በቀላሉ ይክፈቱ።'
                : 'Access official Wolkite University and national past exams archive with step-by-step AI tutor solutions via Telebirr & CBE Birr.'}
            </p>

            <button
              onClick={() => { playClickChime(); onNavigate('upgrade'); }}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
            >
              <span>{isAmharic ? 'በቴሌብር / ንግድ ባንክ አሳድግ' : 'Upgrade Pro via Telebirr'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </section>

          <section className="p-3.5 rounded-2xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
            <div className="min-w-0 space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <Send className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                <span>{isAmharic ? 'የተማሪዎች ቴሌግራም ቻናል' : 'Student Telegram Hub'}</span>
              </span>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                @Et_Learnn • Study materials & notes
              </p>
            </div>

            <a
              href="https://t.me/Et_Learnn"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Join</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </section>

          {examAttempts.length > 0 && (
            <section className="p-3.5 rounded-2xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isAmharic ? 'የቅርብ ጊዜ ፈተናዎች' : 'Recent Quiz Attempts'}
              </h3>
              <div className="space-y-1.5">
                {examAttempts.slice(0, 3).map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{att.subject}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{att.percentage || att.score}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
