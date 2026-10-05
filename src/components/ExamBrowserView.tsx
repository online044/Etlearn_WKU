/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search, Sliders, Zap, Bookmark, CheckCircle2,
  Clock, FileText, X, PlusCircle,
  Building2, ArrowRight
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
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = 
    searchQuery || 
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

      {/* ─── Compact Mobile Filter Controls ─── */}
      <div className="bg-[#111C35] border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        {/* Search Bar + Toggle Filter Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={language === 'am' ? 'በፈተና ርዕስ፣ ዩኒቨርሲቲ ወይም ኮድ ፈልግ...' : 'Search exams, courses, universities...'}
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

        {/* Collapsible Compact 2x2 Filter Controls: University, Subject, Year, Department + Sort */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'am' ? 'ዩኒቨርሲቲ' : 'University'}
                </label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => onSelectUniversity(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{language === 'am' ? 'ሁሉም' : 'All'}</option>
                  {universityList.filter(u => u !== 'all').map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'am' ? 'የትምህርት አይነት' : 'Subject'}
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => onSelectSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{language === 'am' ? 'ሁሉም' : 'All'}</option>
                  {subjectList.filter(s => s !== 'all').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'am' ? 'ዓመተ ምህረት' : 'Year'}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => onSelectYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{language === 'am' ? 'ሁሉም' : 'All'}</option>
                  {yearList.filter(y => y !== 'all').map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'am' ? 'ዲፓርትመንት' : 'Department'}
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => onSelectDepartment(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{language === 'am' ? 'ሁሉም' : 'All'}</option>
                  {departmentList.filter(d => d !== 'all').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Row */}
            <div className="pt-1 flex items-center justify-between gap-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'ቅደም ተከተል' : 'Sort'}
              </label>
              <select
                value={sortBy}
                onChange={(e: any) => onSortChange(e.target.value)}
                className="px-2.5 py-1.5 bg-[#0B1228] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="year_desc">{language === 'am' ? 'በቅርብ ዓመት ▼' : 'Latest Year ▼'}</option>
                <option value="questions">{language === 'am' ? 'በጥያቄዎች ብዛት ▼' : 'Most Questions ▼'}</option>
                <option value="uni">{language === 'am' ? 'በዩኒቨርሲቲ ስም' : 'By University'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─── Count & Add Exam Paper ─── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">
            {filteredSheets.length} {language === 'am' ? 'የፈተና ወረቀቶች' : 'Exam Papers'}
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
            >
              {language === 'am' ? 'ማጣሪያ አጽዳ' : 'Reset'}
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

      {/* ─── Clean Mobile Exam Cards Grid ─── */}
      {filteredSheets.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-[#111C35] border border-slate-800 space-y-2">
          <Search className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            {language === 'am' ? 'ምንም የተገኘ የፈተና ወረቀት የለም' : 'No matching exam papers found'}
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'am' ? 'እባክዎን ማጣሪያውን ይቀይሩ።' : 'Try resetting your search or filters.'}
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
          >
            {language === 'am' ? 'ሁሉንም አሳይ' : 'Show All'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredSheets.map(sheet => {
            const isBookmarked = bookmarkedPapers.includes(sheet.id);
            const isOfficial = sheet.questions.some(q => (q.sourceType || 'official_past_exam') === 'official_past_exam');

            return (
              <div
                key={sheet.id}
                className="bg-[#111C35] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition flex flex-col justify-between gap-3 text-left group"
              >
                {/* Top Row: Year / Official & Subtle Bookmark */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-amber-400 font-bold">
                        {sheet.year || '2025/2026'}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className={isOfficial ? "text-emerald-400" : "text-purple-400"}>
                        {isOfficial ? (language === 'am' ? 'ኦፊሴላዊ' : 'Official') : (language === 'am' ? 'የልምምድ' : 'Practice')}
                      </span>
                    </div>

                    <button
                      onClick={(e) => onToggleBookmark(sheet.id, e)}
                      className="text-slate-500 hover:text-amber-400 p-0.5 transition cursor-pointer"
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Exam Paper'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Exam Title (Main Focus) */}
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                    {sheet.title}
                  </h3>

                  {/* University Name */}
                  <div className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                    {sheet.university}
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

                  <button
                    onClick={() => {
                      playClickChime();
                      onOpenExam(sheet.id);
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>{language === 'am' ? 'ፈተናውን ክፈትና አጥና' : 'Open Exam & Study'}</span>
                    <ArrowRight className="w-4 h-4" />
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
