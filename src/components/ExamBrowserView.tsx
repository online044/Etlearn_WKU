/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Search, Sliders, Zap, Bookmark, CheckCircle2,
  Sparkles, Clock, FileText, ChevronRight, X, PlusCircle,
  GraduationCap, Building2, Calendar, BookOpen, Layers,
  Award, ShieldCheck, Flame, ArrowRight
} from 'lucide-react';
import { ExamPaperSheet } from '../types';
import { playClickChime } from '../utils/audio';

export interface ExamBrowserViewProps {
  filteredSheets: ExamPaperSheet[];
  totalQuestionsInRepository: number;
  totalPapersCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  levelFilter: 'all' | 'uni' | 'matric' | 'exit' | 'bookmarked';
  onLevelFilterChange: (lvl: 'all' | 'uni' | 'matric' | 'exit' | 'bookmarked') => void;
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
}: ExamBrowserViewProps) {
  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 🌟 HERO & METRICS BANNER                                                  */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#101A33] via-[#0D152A] to-[#0A1128] border border-amber-500/30 p-6 md:p-8 shadow-xl">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'am' ? 'የኢትዮጵያ ዩኒቨርሲቲዎች ፈተና ማዕከል' : 'Official Ethiopian University Exam Vault'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-serif tracking-tight leading-snug">
              {language === 'am' ? 'የዩኒቨርሲቲ ፈተናዎችን በቀላሉ ይፈልጉ እና ይለማመዱ' : 'Explore Past Exams & Department Question Papers'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {language === 'am'
                ? 'ከወልቂጤ፣ ከአዲስ አበባ፣ ከአዳማ ሳይንስና ቴክኖሎጂ እና ከሌሎች ዩኒቨርሲቲዎች የተውጣጡ ፈተናዎችን በደረጃና በኮርስ ይምረጡ።'
                : 'Browse authenticated university midterms, finals, exit exams, and national Grade 12 matric papers with step-by-step solutions.'}
            </p>
            
            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{totalPapersCount} {language === 'am' ? 'የፈተና ወረቀቶች' : 'Verified Papers'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{totalQuestionsInRepository.toLocaleString()}+ {language === 'am' ? 'ጥያቄዎች' : 'Questions Available'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>{universityList.filter(u => u !== 'all').length}+ {language === 'am' ? 'ዩኒቨርሲቲዎች' : 'Campuses'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => { playClickChime(); onOpenConfigModal(); }}
              className="flex-1 sm:flex-initial px-4 py-3 bg-[#131F3D] hover:bg-[#18274C] border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              title="Assemble custom university exam"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>{language === 'am' ? 'የፈተና ወረቀት አዘጋጅ' : 'Assemble Exam'}</span>
            </button>

            <button
              onClick={onLaunchSurprise}
              className="flex-1 sm:flex-initial px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-current" />
              <span>{language === 'am' ? 'የዕለቱ ጥያቄ' : 'Daily Challenge'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔍 COMPREHENSIVE FILTER & DISCOVERY BAR                                   */}
      {/* ========================================================================= */}
      <div className="bg-[#101A33] border border-white/10 rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
        {/* Row 1: Search Bar & Level Segment */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={language === 'am' ? 'በፈተና ርዕስ፣ በዩኒቨርሲቲ ወይም በኮርስ ይፈልጉ...' : 'Search by paper title, university, topic, or code...'}
              className="w-full pl-10 pr-10 py-3 bg-[#0A1128] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Level Filter Segment */}
          <div className="flex items-center overflow-x-auto bg-[#0A1128] border border-white/10 p-1 rounded-xl gap-1 shrink-0 scrollbar-none">
            {(['all', 'uni', 'matric', 'exit', 'bookmarked'] as const).map((lvl) => {
              const isSel = levelFilter === lvl;
              let label = '';
              if (lvl === 'all') label = language === 'am' ? 'ሁሉም ፈተናዎች' : 'All Levels';
              else if (lvl === 'uni') label = language === 'am' ? 'ዩኒቨርሲቲ' : 'University';
              else if (lvl === 'matric') label = language === 'am' ? '12ኛ ክፍል ማትሪክ' : 'Grade 12 (EUEE)';
              else if (lvl === 'exit') label = language === 'am' ? 'የመውጫ ፈተና' : 'Exit Exam';
              else if (lvl === 'bookmarked') label = language === 'am' ? 'የተቀመጡ' : 'Saved';

              return (
                <button
                  key={lvl}
                  onClick={() => { playClickChime(); onLevelFilterChange(lvl); }}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'bookmarked' && <Bookmark className="w-3.5 h-3.5" />}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Status Tabs (Latest, Popular, Saved, Official, Practice) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pr-1">
            {language === 'am' ? 'ምድብ፦' : 'Filter:'}
          </span>
          {(['all', 'latest', 'popular', 'official', 'practice', 'saved'] as const).map((tab) => {
            const isSel = paperTab === tab;
            let tabLabel = '';
            if (tab === 'all') tabLabel = language === 'am' ? 'ሁሉም ወረቀቶች' : 'All Papers';
            else if (tab === 'latest') tabLabel = language === 'am' ? 'አዳዲስ ፈተናዎች' : 'Latest Papers';
            else if (tab === 'popular') tabLabel = language === 'am' ? 'ተወዳጅ / ደረጃ የተሰጣቸው' : 'Popular / Top Rated';
            else if (tab === 'official') tabLabel = language === 'am' ? 'ኦፊሴላዊ ፈተናዎች' : 'Official Past Exams';
            else if (tab === 'practice') tabLabel = language === 'am' ? 'ተጨማሪ ልምምድ' : 'Supplementary Practice';
            else if (tab === 'saved') tabLabel = language === 'am' ? 'የተቀመጡ ፈተናዎች' : 'Saved Papers';

            return (
              <button
                key={tab}
                onClick={() => { playClickChime(); onPaperTabChange(tab); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:text-slate-200 hover:border-white/10'
                }`}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>

        {/* Row 3: Dropdown Selectors: University, Subject, Year, Department, Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* University Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>{language === 'am' ? 'ዩኒቨርሲቲ' : 'University'}</span>
            </label>
            <select
              value={selectedUniversity}
              onChange={(e) => onSelectUniversity(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              <option value="all">{language === 'am' ? 'ሁሉም ዩኒቨርሲቲዎች' : 'All Universities'}</option>
              {universityList.filter(u => u !== 'all').map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>{language === 'am' ? 'ኮርስ / የትምህርት ዓይነት' : 'Subject'}</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              <option value="all">{language === 'am' ? 'ሁሉም ኮርሶች' : 'All Subjects'}</option>
              {subjectList.filter(s => s !== 'all').map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>{language === 'am' ? 'ዓመተ ምሕረት' : 'Year'}</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => onSelectYear(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              <option value="all">{language === 'am' ? 'ሁሉም ዓመታት' : 'All Years'}</option>
              {yearList.filter(y => y !== 'all').map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Department / Program Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-amber-400" />
              <span>{language === 'am' ? 'የትምህርት ክፍል' : 'Department'}</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => onSelectDepartment(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              <option value="all">{language === 'am' ? 'ሁሉም ክፍሎች' : 'All Departments'}</option>
              {departmentList.filter(d => d !== 'all').map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>{language === 'am' ? 'ቅደም ተከተል' : 'Sort Order'}</span>
            </label>
            <select
              value={sortBy}
              onChange={(e: any) => onSortChange(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              <option value="year_desc">{language === 'am' ? 'በቅርብ ዓመት' : 'Latest Year'}</option>
              <option value="questions">{language === 'am' ? 'በጥያቄዎች ብዛት' : 'Most Questions'}</option>
              <option value="uni">{language === 'am' ? 'በዩኒቨርሲቲ ስም' : 'By University'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📑 PAPERS COUNT & ADD ACTION                                              */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {filteredSheets.length} {language === 'am' ? 'የተገኙ ፈተናዎች' : 'Exam Papers Found'}
          </span>
          {(searchQuery || selectedUniversity !== 'all' || selectedSubject !== 'all' || selectedYear !== 'all' || selectedDepartment !== 'all' || levelFilter !== 'all' || paperTab !== 'all') && (
            <button
              onClick={() => {
                onSearchChange('');
                onSelectUniversity('all');
                onSelectSubject('all');
                onSelectYear('all');
                onSelectDepartment('all');
                onLevelFilterChange('all');
                onPaperTabChange('all');
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
            >
              {language === 'am' ? 'ማጣሪያዎችን አጽዳ' : 'Reset All Filters'}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenNewFileModal}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
          title={language === 'am' ? 'አዲስ የፈተና ፋይል አክል' : 'Add New Exam File'}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'am' ? '+ አዲስ የፈተና ፋይል' : '+ Add Exam Paper'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📚 EXAM PAPERS CARDS GRID                                                 */}
      {/* ========================================================================= */}
      {filteredSheets.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-2xl bg-[#101A33] border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            {language === 'am' ? 'ምንም የተገኘ የፈተና ወረቀት የለም' : 'No matching exam papers found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {language === 'am'
              ? 'የተመረጠውን ማጣሪያ ወይም የፍለጋ ቃል በመቀየር በድጋሚ ይሞክሩ።'
              : 'Try clearing your search query or adjusting university, subject, or year filters.'}
          </p>
          <button
            onClick={() => {
              onSearchChange('');
              onSelectUniversity('all');
              onSelectSubject('all');
              onSelectYear('all');
              onSelectDepartment('all');
              onLevelFilterChange('all');
              onPaperTabChange('all');
            }}
            className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            {language === 'am' ? 'ሁሉንም ፈተናዎች አሳይ' : 'Show All Exam Papers'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredSheets.map(sheet => {
            const isBookmarked = bookmarkedPapers.includes(sheet.id);
            const officialCount = sheet.questions.filter(q => (q.sourceType || 'official_past_exam') === 'official_past_exam').length;
            const practiceCount = sheet.questions.filter(q => q.sourceType === 'ai_generated').length;
            const isOfficial = officialCount > 0;

            return (
              <div
                key={sheet.id}
                onClick={() => {
                  playClickChime();
                  onOpenExam(sheet.id);
                }}
                className="bg-[#101A33] hover:bg-[#142245] border border-white/10 hover:border-amber-500/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between group relative"
              >
                {/* Top Row: Badges & Bookmark */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        {sheet.year || '2016 E.C.'}
                      </span>
                      {isOfficial ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{language === 'am' ? 'ኦፊሴላዊ' : 'Official'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{language === 'am' ? 'የልምምድ' : 'Practice'}</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => onToggleBookmark(sheet.id, e)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Exam Paper'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Title & University */}
                  <div>
                    <h3 className="font-serif font-bold text-base text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                      {sheet.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{sheet.university}</span>
                    </div>
                  </div>

                  {/* Subject / Department pill */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-sans">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] text-slate-300 truncate">
                      {sheet.subject}
                    </span>
                    {sheet.department && sheet.department !== sheet.subject && (
                      <span className="text-[11px] text-slate-400 truncate">
                        • {sheet.department}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Metrics & Open Action */}
                <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{sheet.questions.length} {language === 'am' ? 'ጥያቄዎች' : 'Questions'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sheet.durationMinutes || 45} {language === 'am' ? 'ደቂቃ' : 'mins'}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickChime();
                      onOpenExam(sheet.id);
                    }}
                    className="w-full py-2.5 px-4 bg-white/10 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-amber-600 text-slate-200 group-hover:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group-hover:shadow-md"
                  >
                    <span>{language === 'am' ? 'ፈተናውን ክፈት' : 'Open Exam & Study'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
