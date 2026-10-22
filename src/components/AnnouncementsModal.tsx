/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Bell, Calendar, Tag, AlertCircle, CheckCircle2, 
  X, Search, Sparkles, Share2, Copy, Check, ExternalLink,
  GraduationCap, ArrowUpRight, ShieldCheck, Filter
} from 'lucide-react';
import { PlatformAnnouncement } from '../types';
import { fetchAnnouncements } from '../utils/supabaseCourses';
import { playClickChime } from '../utils/audio';

export interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'am';
  onNavigate?: (page: string) => void;
  isAdmin?: boolean;
  onOpenAdminAnnouncements?: () => void;
}

export default function AnnouncementsModal({
  isOpen,
  onClose,
  language = 'en',
  onNavigate,
  isAdmin = false,
  onOpenAdminAnnouncements
}: AnnouncementsModalProps) {
  const isAm = language === 'am';
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    fetchAnnouncements(true).then((data) => {
      if (isMounted) {
        setAnnouncements(data);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (ann: PlatformAnnouncement) => {
    playClickChime();
    const text = `📢 ${ann.title}\n\n${ann.message}\n\n— EthioLearn Pro Campus Notices`;
    navigator.clipboard?.writeText(text);
    setCopiedId(ann.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter announcements by tag and search query
  const filtered = announcements.filter(a => {
    const matchesSearch = 
      (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.badgeText || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedTag === 'all') return true;
    if (selectedTag === 'important') return a.isImportant;
    const badge = (a.badgeText || '').toLowerCase();
    if (selectedTag === 'wku') return badge.includes('wku') || badge.includes('wolkite');
    if (selectedTag === 'exam') return badge.includes('exam');
    if (selectedTag === 'curriculum') return badge.includes('curriculum') || badge.includes('book');
    return true;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#0A1128] border border-amber-500/30 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[88vh] overflow-hidden my-4 z-10"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                    {isAm ? 'የካምፓስ ማስታወቂያ ሰሌዳ' : 'Campus Bulletin Board'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({announcements.length})
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                  {isAm ? 'ይፋዊ የትምህርትና የካምፓስ ማስታወቂያዎች' : 'Official Academic & Campus Notices'}
                </h2>
              </div>
            </div>

            <button
              onClick={() => { playClickChime(); onClose(); }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              title={isAm ? 'ዝጋ' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader: Filter Chips & Search Bar */}
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 space-y-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAm ? 'ማስታወቂያዎችን ይፈልጉ...' : 'Search campus announcements & updates...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <button
                type="button"
                onClick={() => { playClickChime(); setSelectedTag('all'); }}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                  selectedTag === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isAm ? 'ሁሉም' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => { playClickChime(); setSelectedTag('important'); }}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedTag === 'important'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>{isAm ? 'አስቸኳይ / ዋና' : 'Important'}</span>
              </button>
              <button
                type="button"
                onClick={() => { playClickChime(); setSelectedTag('wku'); }}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                  selectedTag === 'wku'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                WKU Notices
              </button>
              <button
                type="button"
                onClick={() => { playClickChime(); setSelectedTag('exam'); }}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                  selectedTag === 'exam'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isAm ? 'ፈተናዎች' : 'Exams'}
              </button>
              <button
                type="button"
                onClick={() => { playClickChime(); setSelectedTag('curriculum'); }}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                  selectedTag === 'curriculum'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isAm ? 'ሲላበስ እና መጻሕፍት' : 'Curriculum & Books'}
              </button>
            </div>
          </div>

          {/* Announcements Feed Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  {isAm ? 'ማስታወቂያዎች እየተጫኑ ነው...' : 'Loading announcements...'}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center space-y-2 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">
                  {isAm ? 'ምንም ማስታወቂያ አልተገኘም' : 'No announcements found'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isAm 
                    ? 'አዳዲስ የካምፓስ ማስታወቂያዎች ሲወጡ እዚህ ሰሌዳ ላይ ወዲያውኑ ይታያሉ።'
                    : 'Official university notices, exam announcements, and campus updates will appear here.'}
                </p>
              </div>
            ) : (
              filtered.map((ann) => {
                const isImportant = ann.isImportant;
                const isCopied = copiedId === ann.id;

                return (
                  <article
                    key={ann.id}
                    className={`p-4 rounded-2xl transition-all border ${
                      isImportant 
                        ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg' 
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Meta Line: Badge, Date, Importance */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-2">
                        {ann.badgeText && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isImportant
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {ann.badgeText}
                          </span>
                        )}
                        {isImportant && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{isAm ? 'አስቸኳይ' : 'Important'}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ann.date || 'Recent'}</span>
                      </div>
                    </div>

                    {/* Announcement Title */}
                    <h3 className="text-sm sm:text-base font-bold text-white mb-2 leading-snug">
                      {ann.title}
                    </h3>

                    {/* Announcement Body */}
                    <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed whitespace-pre-line mb-3">
                      {ann.message}
                    </p>

                    {/* Bottom Actions Bar */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[10px] text-slate-500">
                        EthioLearn Pro Academic Bulletin
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(ann)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] cursor-pointer"
                          title="Copy announcement"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? (isAm ? 'ተቀድቷል' : 'Copied') : (isAm ? 'ቅዳ' : 'Copy')}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="px-5 py-3 border-t border-slate-800 bg-[#0F172A] flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAm ? 'የወልቂጤ ዩኒቨርሲቲ እና ብሔራዊ የትምህርት ማህደር' : 'Official Wolkite University & National Academic Channel'}</span>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && onOpenAdminAnnouncements && (
                <button
                  type="button"
                  onClick={() => {
                    playClickChime();
                    onClose();
                    onOpenAdminAnnouncements();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>{isAm ? 'አዲስ ማስታወቂያ አትም' : 'Admin: Post Notice'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => { playClickChime(); onClose(); }}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                {isAm ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
