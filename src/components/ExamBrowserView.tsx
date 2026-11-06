/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Sliders, Zap, Bookmark, CheckCircle2,
  Clock, FileText, X, PlusCircle,
  Building2, ArrowRight, Download, Check,
  ChevronDown, ChevronRight, Layers, GraduationCap,
  ShieldCheck, Calendar, BookOpen, Sparkles, Folder,
  LayoutGrid, ListFilter, Star, Lock, Award
} from 'lucide-react';
import { ExamPaperSheet } from '../types';
import { playClickChime, playSuccessChime } from '../utils/audio';
import { saveExamOffline, isExamDownloaded } from '../utils/offlineManager';
import { safeStorage } from '../utils/safeStorage';

export const ETHIOPIAN_UNIVERSITIES = [
  'Adama Science and Technology University (ASTU)',
  'Addis Ababa University',
  'Arba Minch University',
  'Bahir Dar University',
  'Debre Birhan University',
  'Debre Markos University',
  'Dilla University',
  'Dire Dawa University',
  'Haramaya University',
  'Hawassa University',
  'Jimma University',
  'Mekelle University',
  'University of Gondar',
  'Wolkite University'
];

/**
 * Check if a university past exam is free/open for non-Pro students.
 * Only ASTU and Wolkite University (and General Practice) are open; all other universities require Pro.
 */
export function isUniversityFree(uniName?: string | null): boolean {
  if (!uniName) return true;
  const lower = uniName.trim().toLowerCase();
  if (lower.includes('general practice')) return true;
  if (lower.includes('wolkite') || lower.includes('wku')) return true;
  if (lower.includes('adama') || lower.includes('astu')) return true;
  return false;
}

export const ETHIOPIAN_FRESHMAN_COURSES = [
  { code: 'all', title: 'All Courses', nameAm: 'ሁሉም ኮርሶች' },
  { code: 'BIOL1012', title: 'BIOL1012 (General Biology)', nameAm: 'ባዮሎጂ (BIOL1012)' },
  { code: 'PHYS1011', title: 'PHYS1011 (General Physics)', nameAm: 'ፊዚክስ (PHYS1011)' },
  { code: 'CHEM1011', title: 'CHEM1011 (General Chemistry)', nameAm: 'ኬሚስትሪ (CHEM1011)' },
  { code: 'MATH1011', title: 'MATH1011 (Math - Natural)', nameAm: 'ሂሳብ ለተፈጥሮ (MATH1011)' },
  { code: 'MATH1013', title: 'MATH1013 (Math - Social)', nameAm: 'ሂሳብ ለማህበራዊ (MATH1013)' },
  { code: 'ECON1011', title: 'ECON1011 (Economics)', nameAm: 'ኢኮኖሚክስ (ECON1011)' },
  { code: 'GLTR1012', title: 'GLTR1012 (Global Trends)', nameAm: 'ግሎባል ትሬንድስ (GLTR1012)' },
  { code: 'ANTH2012', title: 'ANTH2012 (Anthropology)', nameAm: 'አንትሮፖሎጂ (ANTH2012)' },
  { code: 'HIST1012', title: 'HIST1012 (History of Ethiopia)', nameAm: 'የኢትዮጵያ ታሪክ (HIST1012)' },
  { code: 'PSYC1011', title: 'PSYC1011 (General Psychology)', nameAm: 'ሳይኮሎጂ (PSYC1011)' },
  { code: 'INCL1012', title: 'INCL1012 (Inclusiveness)', nameAm: 'አካታችነት (INCL1012)' },
  { code: 'FLEN1011', title: 'FLEN1011 (Communicative English I)', nameAm: 'እንግሊዝኛ I (FLEN1011)' },
  { code: 'FLEN1012', title: 'FLEN1012 (Communicative English II)', nameAm: 'እንግሊዝኛ II (FLEN1012)' },
  { code: 'MCIE1012', title: 'MCIE1012 (Moral and Civics)', nameAm: 'ስነ-ዜጋ (MCIE1012)' },
  { code: 'PEFI1012', title: 'PEFI1012 (Physical Education)', nameAm: 'ስፖርት (PEFI1012)' },
  { code: 'GEOG1012', title: 'GEOG1012 (Geography of Ethiopia)', nameAm: 'ጂኦግራፊ (GEOG1012)' }
];

export interface ExamBrowserViewProps {
  filteredSheets: ExamPaperSheet[];
  totalQuestionsInRepository: number;
  totalPapersCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  levelFilter: 'all' | 'uni' | 'exit' | 'bookmarked';
  onLevelFilterChange: (lvl: 'all' | 'uni' | 'exit' | 'bookmarked') => void;
  selectedUniversity: string;
  onSelectUniversity: (uni: string) => void;
  selectedSubject: string;
  onSelectSubject: (subj: string) => void;
  selectedYear: string;
  onSelectYear: (year: string) => void;
  selectedDepartment: string;
  onSelectDepartment: (dept: string) => void;
  paperTab: 'all' | 'latest' | 'popular' | 'saved' | 'official' | 'practice';
  onPaperTabChange: (tab: 'all' | 'latest' | 'popular' | 'saved' | 'official' | 'practice') => void;
  sortBy: 'year_desc' | 'questions' | 'uni';
  onSortChange: (sort: 'year_desc' | 'questions' | 'uni') => void;
  bookmarkedPapers: string[];
  onToggleBookmark: (id: string, e?: React.MouseEvent) => void;
  onOpenExam: (sheetId: string) => void;
  onOpenNewFileModal: () => void;
  onOpenConfigModal: () => void;
  onLaunchSurprise: () => void;
  universityList: string[];
  yearList: string[];
  departmentList: string[];
  subjectList: string[];
  language: 'en' | 'am';
  isProUser?: boolean;
  onUpgrade?: () => void;
}

export default function ExamBrowserView({
  filteredSheets,
  totalQuestionsInRepository,
  totalPapersCount,
  searchQuery,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  selectedUniversity,
  onSelectUniversity,
  selectedSubject,
  onSelectSubject,
  selectedYear,
  onSelectYear,
  selectedDepartment,
  onSelectDepartment,
  paperTab,
  onPaperTabChange,
  sortBy,
  onSortChange,
  bookmarkedPapers,
  onToggleBookmark,
  onOpenExam,
  onOpenNewFileModal,
  onOpenConfigModal,
  onLaunchSurprise,
  universityList,
  yearList,
  departmentList,
  subjectList,
  language,
  isProUser = false,
  onUpgrade,
}: ExamBrowserViewProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [downloadedExamIds, setDownloadedExamIds] = useState<Set<string>>(new Set());
  const [downloadingExamId, setDownloadingExamId] = useState<string | null>(null);

  // View style: 'accordions' (alphabetical universities) or 'grid' (all papers)
  const [viewStyle, setViewStyle] = useState<'accordions' | 'grid'>('accordions');

  // Track expanded state of universities in accordion view: Completely collapsed by default (opens only on student click)
  const [expandedUnis, setExpandedUnis] = useState<Set<string>>(() => new Set<string>());

  // Track favorited / bookmarked universities
  const [favoriteUnis, setFavoriteUnis] = useState<string[]>(() => {
    try {
      const raw = safeStorage.getItem('ethiolearn_favorite_universities');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const toggleFavoriteUni = (uniName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClickChime();
    setFavoriteUnis(prev => {
      const next = prev.includes(uniName) ? prev.filter(u => u !== uniName) : [...prev, uniName];
      try {
        safeStorage.setItem('ethiolearn_favorite_universities', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const expandAllAccordions = () => {
    playClickChime();
    const all = new Set<string>(sheetsByUniversity.keys());
    setExpandedUnis(all);
  };

  const collapseAllAccordions = () => {
    playClickChime();
    setExpandedUnis(new Set<string>());
  };

  const toggleUniversityAccordion = (uniName: string) => {
    playClickChime();
    setExpandedUnis(prev => {
      const next = new Set(prev);
      if (next.has(uniName)) {
        next.delete(uniName);
      } else {
        next.add(uniName);
      }
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;
    Promise.all(filteredSheets.map(s => isExamDownloaded(s.id))).then(results => {
      if (mounted) {
        const set = new Set<string>();
        results.forEach((isDl, idx) => {
          if (isDl && filteredSheets[idx]) set.add(filteredSheets[idx].id);
        });
        setDownloadedExamIds(set);
      }
    });
    return () => { mounted = false; };
  }, [filteredSheets]);

  const hasActiveFilters = 
    Boolean(searchQuery) || 
    selectedUniversity !== 'all' || 
    selectedSubject !== 'all' || 
    selectedYear !== 'all' || 
    selectedDepartment !== 'all';

  const resetAllFilters = () => {
    onSearchChange('');
    onSelectUniversity('all');
    onSelectSubject('all');
    onSelectYear('all');
    onSelectDepartment('all');
  };

  // Group filtered sheets by university
  const sheetsByUniversity = useMemo(() => {
    const map = new Map<string, ExamPaperSheet[]>();

    // Initialize all known Ethiopian universities and General Practice
    ETHIOPIAN_UNIVERSITIES.forEach(u => map.set(u, []));
    map.set('General Practice Questions', []);

    filteredSheets.forEach(sheet => {
      const uni = (sheet.university || '').trim();
      let matchedKey = 'General Practice Questions';

      for (const u of ETHIOPIAN_UNIVERSITIES) {
        if (uni.toLowerCase().includes(u.toLowerCase()) || u.toLowerCase().includes(uni.toLowerCase())) {
          matchedKey = u;
          break;
        }
      }

      if (matchedKey === 'General Practice Questions' && uni && uni !== 'General Practice Questions') {
        if (!map.has(uni)) {
          map.set(uni, []);
        }
        matchedKey = uni;
      }

      const list = map.get(matchedKey) || [];
      list.push(sheet);
      map.set(matchedKey, list);
    });

    return map;
  }, [filteredSheets]);

  // Sort universities with favorited/bookmarked universities pinned to top, then alphabetical
  const sortedUniversities = useMemo(() => {
    const unis: string[] = Array.from(sheetsByUniversity.keys()).filter((u): u is string => typeof u === 'string' && u !== 'General Practice Questions');

    let filtered = unis;
    if (showOnlyFavorites) {
      filtered = filtered.filter(u => favoriteUnis.includes(u));
    }

    return filtered.sort((a, b) => {
      const aFav = favoriteUnis.includes(a);
      const bFav = favoriteUnis.includes(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.localeCompare(b);
    });
  }, [sheetsByUniversity, favoriteUnis, showOnlyFavorites]);

  // Helper to group exam sheets within a university by Academic Year, Semester, and Exam Type
  const groupUniversityExams = (sheets: ExamPaperSheet[]) => {
    const groups: Record<string, { year: string; semester: string; examType: string; sheets: ExamPaperSheet[] }> = {};
    sheets.forEach(s => {
      const yr = s.year || '2016 E.C.';
      const sem = s.semester || 'Semester I';
      const type = s.examType || (s.isVerifiedOfficial ? 'Official University Exam' : 'Practice Exam Paper');
      const key = `${yr} • ${sem} • ${type}`;
      if (!groups[key]) {
        groups[key] = { year: yr, semester: sem, examType: type, sheets: [] };
      }
      groups[key].sheets.push(s);
    });
    return Object.values(groups);
  };

  // Render a single exam paper card
  const renderExamCard = (sheet: ExamPaperSheet) => {
    const isBookmarked = bookmarkedPapers.includes(sheet.id);
    const isOfficial = sheet.isVerifiedOfficial || sheet.questions.some(q => (q.sourceType || 'official_past_exam') === 'official_past_exam');
    const isLocked = !isProUser && !isUniversityFree(sheet.university);

    return (
      <div
        key={sheet.id}
        className={`bg-[#111C35] border rounded-2xl p-4 transition flex flex-col justify-between gap-3 text-left group ${
          isLocked ? 'border-amber-500/25 bg-[#101932]' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Top Row: Year / Official / Lock status & Bookmark */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
              <span className="text-amber-400 font-bold">
                {sheet.year || '2025/2026'}
              </span>
              <span className="text-slate-500">·</span>
              <span className={isOfficial ? "text-emerald-400 font-bold flex items-center gap-1" : "text-purple-400 font-semibold"}>
                {isOfficial && <ShieldCheck className="w-3 h-3 inline" />}
                {isOfficial ? (language === 'am' ? 'ኦፊሴላዊ ፈተና' : 'Official Paper') : (language === 'am' ? 'የልምምድ ፈተና' : 'Practice Paper')}
              </span>
              {sheet.semester && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{sheet.semester}</span>
                </>
              )}
              {isLocked ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  <span>{language === 'am' ? 'ፕሮ (Locked)' : 'Locked'}</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{language === 'am' ? 'ነፃ ክፍት' : 'Free Open'}</span>
                </span>
              )}
            </div>

            <button
              onClick={(e) => onToggleBookmark(sheet.id, e)}
              className="text-slate-500 hover:text-amber-400 p-0.5 transition cursor-pointer"
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Exam Paper'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Exam Title */}
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
            {sheet.title}
          </h3>

          {/* University Name */}
          <div className="text-xs sm:text-sm font-medium text-slate-200 truncate flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{sheet.university}</span>
          </div>

          {/* Subject • Department */}
          <div className="text-xs text-slate-400 truncate">
            <span>{sheet.subject}</span>
            {sheet.department && sheet.department !== sheet.subject && (
              <span> • {sheet.department}</span>
            )}
          </div>
        </div>

        {/* Bottom Row: Metadata + Action Button */}
        <div className="space-y-2.5 pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>
              {sheet.questions.length} {sheet.questions.length === 1 ? 'Question' : 'Questions'}
            </span>
            <span>
              {sheet.durationMinutes || 45} min
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={downloadingExamId === sheet.id}
              onClick={async (e) => {
                e.stopPropagation();
                if (isLocked) {
                  playClickChime();
                  onUpgrade?.();
                  return;
                }
                playClickChime();
                setDownloadingExamId(sheet.id);
                await saveExamOffline({
                  id: sheet.id,
                  title: sheet.title,
                  subject: sheet.subject,
                  university: sheet.university,
                  course: sheet.department || sheet.subject,
                  examYear: sheet.year,
                  questions: sheet.questions
                });
                setDownloadedExamIds(prev => new Set([...prev, sheet.id]));
                setDownloadingExamId(null);
                playSuccessChime();
              }}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center cursor-pointer shrink-0 ${
                downloadedExamIds.has(sheet.id)
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : isLocked
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400/80 hover:bg-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={
                isLocked 
                  ? (language === 'am' ? 'የተቆለፈ - ለማውረድ ወደ ፕሮ ያሳድጉ' : 'Locked - Upgrade to Pro to download')
                  : downloadedExamIds.has(sheet.id) 
                  ? (language === 'am' ? 'ወርዷል (ያለ ዳታ ይሰራል)' : 'Downloaded (Offline Ready)') 
                  : (language === 'am' ? 'ያለ ዳታ ለማጥናት አውርድ' : 'Download for Offline Study')
              }
            >
              {isLocked ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : downloadedExamIds.has(sheet.id) ? (
                <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              ) : (
                <Download className={`w-4 h-4 ${downloadingExamId === sheet.id ? 'animate-bounce text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
              )}
            </button>

            {isLocked ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playClickChime();
                  onUpgrade?.();
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
              >
                <Lock className="w-4 h-4" />
                <span>{language === 'am' ? 'በፕሮ ክፈት (Locked)' : 'Unlock with Pro'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  playClickChime();
                  onOpenExam(sheet.id);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
              >
                <span>{language === 'am' ? 'ፈተናውን ክፈትና አጥና' : 'Open Exam & Study'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-sans pb-16">
      {/* ─── Compact Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111C35] border border-slate-800 p-4 rounded-2xl">
        <div className="min-w-0">
          <span className="text-[10.5px] font-bold text-amber-400 uppercase tracking-wider block">
            {language === 'am' ? 'የፈተናዎች ማዕከል' : 'Past Exams Vault'}
          </span>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {language === 'am' ? 'የዩኒቨርሲቲ ፈተናዎች እና የጥያቄ ወረቀቶች' : 'University Exams & Question Papers'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalPapersCount} {language === 'am' ? 'ፈተናዎች' : 'papers'} · {totalQuestionsInRepository.toLocaleString()}+ {language === 'am' ? 'ጥያቄዎች' : 'questions'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { playClickChime(); onOpenConfigModal(); }}
            className="px-3 py-2 bg-[#17233D] hover:bg-[#1E2D4E] border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'am' ? 'አዘጋጅ' : 'Assemble'}</span>
          </button>

          <button
            onClick={onLaunchSurprise}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'am' ? 'የዕለቱ ፈተና' : 'Daily Challenge'}</span>
          </button>
        </div>
      </div>

      {/* ─── Course Selector Row (Prompt Requirement 2) ─── */}
      <div className="bg-[#111C35] border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'am' ? 'ኮርስ ይምረጡ (Select Course):' : 'Select Freshman Course:'}</span>
          </label>
          {selectedSubject !== 'all' && (
            <button
              onClick={() => { playClickChime(); onSelectSubject('all'); }}
              className="text-[11px] font-semibold text-slate-400 hover:text-amber-400 cursor-pointer"
            >
              {language === 'am' ? 'ሁሉንም አሳይ' : 'Clear Course Filter'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {ETHIOPIAN_FRESHMAN_COURSES.map(crs => {
            const isSelected = selectedSubject.toLowerCase() === crs.code.toLowerCase() || 
              (crs.code === 'all' && selectedSubject === 'all');

            return (
              <button
                key={crs.code}
                type="button"
                onClick={() => {
                  playClickChime();
                  onSelectSubject(crs.code);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#0B1228] hover:bg-[#17233D] border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {language === 'am' ? crs.nameAm : crs.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Search Bar, Filter Toggles & View Mode Switcher ─── */}
      <div className="bg-[#111C35] border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={language === 'am' ? 'በፈተና ርዕስ፣ ዩኒቨርሲቲ ወይም ኮርስ ፈልግ...' : 'Search exams, courses, universities...'}
              className="w-full pl-9 pr-9 py-2 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/80 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Mode Switcher: Accordions vs Grid */}
            <div className="flex items-center bg-[#0B1228] p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => { playClickChime(); setViewStyle('accordions'); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewStyle === 'accordions'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="University Accordion View"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{language === 'am' ? 'በዩኒቨርሲቲ' : 'Universities'}</span>
              </button>

              <button
                onClick={() => { playClickChime(); setViewStyle('grid'); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewStyle === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="All Papers Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{language === 'am' ? 'ፍርግርግ' : 'All Grid'}</span>
              </button>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => { playClickChime(); setShowFilters(!showFilters); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                showFilters || hasActiveFilters
                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-400'
                  : 'bg-[#17233D] border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ማጣሪያ' : 'Filters'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'am' ? 'ዩኒቨርሲቲ' : 'University'}
                </label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => onSelectUniversity(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{language === 'am' ? 'ሁሉም ዩኒቨርሲቲዎች' : 'All Universities'}</option>
                  {universityList.filter(u => u !== 'all').map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'am' ? 'ዓመት' : 'Year'}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => onSelectYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{language === 'am' ? 'ሁሉም ዓመታት' : 'All Years'}</option>
                  {yearList.filter(y => y !== 'all').map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'am' ? 'የፈተና አይነት' : 'Exam Type'}
                </label>
                <select
                  value={paperTab}
                  onChange={(e: any) => onPaperTabChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{language === 'am' ? 'ሁሉም ወረቀቶች' : 'All Papers'}</option>
                  <option value="official">{language === 'am' ? 'ኦፊሴላዊ ፈተናዎች' : 'Official Past Exams'}</option>
                  <option value="practice">{language === 'am' ? 'የልምምድ ፈተናዎች' : 'Practice Papers'}</option>
                  <option value="saved">{language === 'am' ? 'የተቀመጡ' : 'Bookmarked'}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'am' ? 'ቅደም ተከተል' : 'Sort'}
                </label>
                <select
                  value={sortBy}
                  onChange={(e: any) => onSortChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="year_desc">{language === 'am' ? 'በቅርብ ዓመት ▼' : 'Latest Year ▼'}</option>
                  <option value="questions">{language === 'am' ? 'በጥያቄዎች ብዛት ▼' : 'Most Questions ▼'}</option>
                  <option value="uni">{language === 'am' ? 'በዩኒቨርሲቲ ስም' : 'By University'}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Count & Add Exam Paper Row ─── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">
            {filteredSheets.length} {language === 'am' ? 'የፈተና ወረቀቶች ተገኝተዋል' : 'Exam Papers Found'}
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
            >
              {language === 'am' ? 'ማጣሪያ አጽዳ' : 'Reset All'}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenNewFileModal}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700/80"
          title={language === 'am' ? 'አዲስ የፈተና ፋይል አክል' : 'Add New Exam File'}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'am' ? '+ ፈተና ጨምር' : '+ Add Exam Paper'}</span>
        </button>
      </div>

      {/* ─── EMPTY STATE ─── */}
      {filteredSheets.length === 0 && (
        <div className="text-center py-12 px-4 rounded-2xl bg-[#111C35] border border-slate-800 space-y-2">
          <Search className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            {language === 'am' ? 'ምንም የተገኘ የፈተና ወረቀት የለም' : 'No matching exam papers found'}
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'am' ? 'እባክዎን ማጣሪያውን ይቀይሩ ወይም ሁሉንም ያሳዩ።' : 'Try resetting your search or course filter.'}
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
          >
            {language === 'am' ? 'ሁሉንም አሳይ' : 'Show All'}
          </button>
        </div>
      )}

      {/* ─── 1. ALPHABETICAL UNIVERSITY ACCORDIONS VIEW (Requirement 2) ─── */}
      {filteredSheets.length > 0 && viewStyle === 'accordions' && (
        <div className="space-y-3">
          {/* Controls: Favorites Filter & Expand/Collapse All */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { playClickChime(); setShowOnlyFavorites(!showOnlyFavorites); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  showOnlyFavorites
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : favoriteUnis.length > 0
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${showOnlyFavorites || favoriteUnis.length > 0 ? 'fill-current' : ''}`} />
                <span>
                  {language === 'am' ? 'የተመረጡ ዩኒቨርሲቲዎች' : 'Bookmarked Universities'} ({favoriteUnis.length})
                </span>
              </button>

              {showOnlyFavorites && (
                <button
                  type="button"
                  onClick={() => setShowOnlyFavorites(false)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                >
                  {language === 'am' ? 'ሁሉንም አሳይ' : 'Show All'}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={expandedUnis.size > 0 ? collapseAllAccordions : expandAllAccordions}
              className="text-[11px] font-semibold text-slate-400 hover:text-amber-400 transition cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60"
            >
              {expandedUnis.size > 0 
                ? (language === 'am' ? 'ሁሉንም ዝጋ' : 'Collapse All') 
                : (language === 'am' ? 'ሁሉንም ክፈት' : 'Expand All')}
            </button>
          </div>

          {/* Section A: General Practice Questions Accordion (Always available for unassigned/general questions) */}
          {!showOnlyFavorites && (() => {
            const generalSheets = sheetsByUniversity.get('General Practice Questions') || [];
            const isExpanded = expandedUnis.has('General Practice Questions');
            const totalQ = generalSheets.reduce((sum, s) => sum + s.questions.length, 0);
            const isGenFav = favoriteUnis.includes('General Practice Questions');

            return (
              <div className={`bg-[#101A33] border rounded-2xl overflow-hidden shadow-lg transition ${
                isGenFav ? 'border-amber-400/60 shadow-amber-500/10' : 'border-amber-500/30'
              }`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleUniversityAccordion('General Practice Questions')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleUniversityAccordion('General Practice Questions');
                    }
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-bold text-white truncate">
                          {language === 'am' ? 'አጠቃላይ የልምምድ ጥያቄዎች (General Practice Questions)' : 'General Practice Questions'}
                        </h2>
                        {isGenFav && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            <span>Favorite</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {language === 'am' ? 'ሀገራዊ የጥያቄዎች ባንክ' : 'National Bank'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {generalSheets.length} {language === 'am' ? 'የፈተና ወረቀቶች' : 'exam papers'} · {totalQ} {language === 'am' ? 'ጥያቄዎች' : 'questions'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleFavoriteUni('General Practice Questions', e)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isGenFav
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-400/30'
                      }`}
                      title={isGenFav ? 'Remove from Favorites' : 'Bookmark as Favorite'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isGenFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <span className="text-xs font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      {generalSheets.length} {generalSheets.length === 1 ? 'Paper' : 'Papers'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-400' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 bg-[#0C1428]/60 space-y-4">
                    {generalSheets.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {language === 'am' ? 'ለዚህ ኮርስ ምንም አጠቃላይ የልምምድ ጥያቄ የለም።' : 'No general practice papers for the current filter.'}
                      </div>
                    ) : (
                      groupUniversityExams(generalSheets).map((group, gIdx) => (
                        <div key={gIdx} className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>{group.year} · {group.semester}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-amber-300/80">{group.examType}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {group.sheets.map(renderExamCard)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Section B: Alphabetical Ethiopian Universities Accordions */}
          {sortedUniversities.map((uniName) => {
            const uniSheets = sheetsByUniversity.get(uniName) || [];
            const isExpanded = expandedUnis.has(uniName);
            const totalQ = uniSheets.reduce((sum, s) => sum + s.questions.length, 0);
            const hasOfficial = uniSheets.some(s => s.isVerifiedOfficial);
            const isFavorite = favoriteUnis.includes(uniName);
            const isUniLocked = !isProUser && !isUniversityFree(uniName);

            return (
              <div
                key={uniName}
                className={`bg-[#111C35] border rounded-2xl overflow-hidden transition ${
                  isFavorite 
                    ? 'border-amber-500/40 shadow-sm shadow-amber-500/10' 
                    : isUniLocked
                    ? 'border-slate-800/80 hover:border-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleUniversityAccordion(uniName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleUniversityAccordion(uniName);
                    }
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isFavorite
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : isUniLocked
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400/90'
                        : uniSheets.length > 0
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-500'
                    }`}>
                      {isFavorite ? (
                        <Star className="w-5 h-5 fill-amber-400" />
                      ) : isUniLocked ? (
                        <Lock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-bold text-white truncate">
                          {uniName}
                        </h2>
                        {isFavorite && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            <span>Favorite</span>
                          </span>
                        )}
                        {isUniLocked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-amber-400" />
                            <span>{language === 'am' ? 'የተቆለፈ · ፕሮ' : 'Locked · Pro'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>{language === 'am' ? 'ክፍት · ነፃ' : 'Open · Free'}</span>
                          </span>
                        )}
                        {hasOfficial && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Official</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {uniSheets.length > 0 ? (
                          <span>
                            {uniSheets.length} {uniSheets.length === 1 ? 'paper' : 'papers'} · {totalQ} {totalQ === 1 ? 'question' : 'questions'}
                            {isUniLocked && (
                              <span className="text-amber-400/90 ml-1.5 font-medium">
                                · {language === 'am' ? '(ለመክፈት ፕሮ ያስፈልጋል)' : '(Requires Pro to unlock)'}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">
                            {language === 'am' ? 'ያልተጫነ (0 ወረቀቶች)' : '0 uploaded past exams for this course'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleFavoriteUni(uniName, e)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isFavorite
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-400/30'
                      }`}
                      title={isFavorite ? (language === 'am' ? 'ከተመረጡት አስወግድ' : 'Remove from Favorites') : (language === 'am' ? 'ይህን ዩኒቨርሲቲ ምረጥ (Bookmark Favorite)' : 'Bookmark as Favorite University')}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      isUniLocked
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : uniSheets.length > 0
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        : 'bg-slate-800/40 border-slate-800 text-slate-500'
                    }`}>
                      {uniSheets.length} {uniSheets.length === 1 ? 'Paper' : 'Papers'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-400' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 bg-[#0C1428]/60 space-y-4">
                    {/* Locked for Purchase Banner (Only ASTU & Wolkite are open) */}
                    {isUniLocked && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{language === 'am' ? `${uniName} ለግዢ ተቆልፏል` : `${uniName} is Locked for Purchase`}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">PRO ONLY</span>
                            </h4>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              {language === 'am'
                                ? 'በነጻ ክፍት የሆኑት የASTU (አዳማ) እና የወልቂጤ ዩኒቨርሲቲ ፈተናዎች ብቻ ናቸው። ይህን ዩኒቨርሲቲ እና ሁሉንም የፈተና ጥያቄዎች ለመክፈት ወደ ፕሮ ያሳድጉ።'
                                : 'Only ASTU and Wolkite University past exams are open for free access. Upgrade to EthioLearn Pro to unlock this university and all authentic Ethiopian exams.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickChime();
                            onUpgrade?.();
                          }}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow"
                        >
                          <Award className="w-3.5 h-3.5 text-slate-950" />
                          <span>{language === 'am' ? 'በፕሮ ክፈት' : 'Unlock with Pro'}</span>
                        </button>
                      </div>
                    )}
                    {uniSheets.length === 0 ? (
                      <div className="p-5 text-center rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <Folder className="w-6 h-6 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                          {language === 'am'
                            ? `ለ${uniName} በዚህ ኮርስ የተጫነ ኦፊሴላዊ የፈተና ወረቀት የለም። ከላይ ባለው አጠቃላይ የልምምድ ጥያቄዎች ክፍል ይለማመዱ።`
                            : `No official past exam papers uploaded for ${uniName} in this course yet. Practice with the General Practice Questions above.`}
                        </p>
                      </div>
                    ) : (
                      groupUniversityExams(uniSheets).map((group, gIdx) => (
                        <div key={gIdx} className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>{group.year} · {group.semester}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-amber-300/80">{group.examType}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {group.sheets.map(renderExamCard)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 2. ALL PAPERS GRID VIEW ─── */}
      {filteredSheets.length > 0 && viewStyle === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredSheets.map(renderExamCard)}
        </div>
      )}
    </div>
  );
}
