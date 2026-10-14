/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Phone, Mail, Send, Copy, Check, Info, ShieldCheck, 
  FileText, BookOpen, GraduationCap, Trophy, User, Sparkles, 
  ExternalLink, Sun, Moon, Globe, Calendar, Award, ChevronRight,
  HelpCircle, Scale, Lock, HeartHandshake, Layers, Megaphone
} from 'lucide-react';
import EthioLearnLogo from './EthioLearnLogo';
import StudentAvatar from './StudentAvatar';
import { StudentProfile } from '../types';
import { playClickChime } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

export interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  language: 'en' | 'am';
  setLanguage: (lang: 'en' | 'am') => void;
  themeMode: 'dark' | 'light';
  setThemeMode: (theme: 'dark' | 'light') => void;
  onNavigate: (page: string) => void;
  ethDateFormatted?: string;
  onOpenLegal: (tab: 'about' | 'terms' | 'privacy') => void;
  onOpenAnnouncements?: () => void;
  isUserAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export default function AppSidebar({
  isOpen,
  onClose,
  profile,
  language,
  setLanguage,
  themeMode,
  setThemeMode,
  onNavigate,
  ethDateFormatted,
  onOpenLegal,
  onOpenAnnouncements,
  isUserAdmin,
  onOpenAdmin
}: AppSidebarProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const isAm = language === 'am';

  const copyToClipboard = (text: string, label: string) => {
    playClickChime();
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2500);
  };

  const handleNavClick = (page: string) => {
    playClickChime();
    onNavigate(page);
    onClose();
  };

  const handleLegalClick = (tab: 'about' | 'terms' | 'privacy') => {
    playClickChime();
    onOpenLegal(tab);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Sidebar Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-[310px] sm:max-w-xs h-full bg-[#0A1128] text-slate-100 border-r border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Top Header - Minimized Logo & Clean Text */}
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-slate-800 flex items-center justify-between bg-[#0F172A] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <EthioLearnLogo size={24} showCardBackground={false} iconOnly={true} className="shrink-0" />
                <div className="leading-tight min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                      EthioLearn Pro
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700 shrink-0">
                      v2.4
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {isAm ? 'የዩኒቨርሲቲ የጥናት መተግበሪያ' : 'University Study Platform'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { playClickChime(); onClose(); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Sidebar Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar text-xs">
              
              {/* Profile Overview Card (Highlighting Streak, Study Time & Courses in Profile) */}
              <div 
                onClick={() => handleNavClick('profile')}
                className="p-3 rounded-xl bg-[#111C35] border border-slate-800 flex flex-col gap-2 hover:border-amber-400/40 transition-all cursor-pointer group"
                title={isAm ? "የተማሪ መገለጫ ክፈት" : "Open Student Profile"}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StudentAvatar 
                      avatar={profile.avatar} 
                      name={profile.name} 
                      size={36} 
                      className="border border-amber-400 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
                        <span className="truncate group-hover:text-amber-400 transition-colors">{profile.name || (isAm ? 'ተማሪ' : 'Student')}</span>
                        {profile.isPro && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-black bg-amber-400 text-slate-950 uppercase shrink-0">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {profile.university || 'Wolkite University'}
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1 truncate text-amber-400/90">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{isAm ? 'ቀጣይነትና ሰዓታት በመገለጫ' : 'Streak, Hours & Courses in Profile'}</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase text-slate-400 group-hover:text-amber-400">
                    {isAm ? 'እይ' : 'View'} →
                  </span>
                </div>
              </div>

              {/* 🌐 Prominent Bilingual Language Switcher (Moved from Header to Sidemenu Bar) */}
              <div className="p-3 rounded-xl bg-[#111C35] border border-slate-800 shadow-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <span className="font-bold text-white text-xs block truncate">
                      {isAm ? 'የመተግበሪያ ቋንቋ' : 'App Language'}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {isAm ? 'አማርኛ / English' : 'English / አማርኛ'}
                    </span>
                  </div>
                </div>

                <div className="flex bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setLanguage('en'); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-[#078930] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setLanguage('am'); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      language === 'am'
                        ? 'bg-[#078930] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    አማ
                  </button>
                </div>
              </div>

              {/* 📢 Mini Campus Announcements in Sidemenu Bar */}
              <div
                onClick={() => {
                  playClickChime();
                  onClose();
                  if (onOpenAnnouncements) onOpenAnnouncements();
                }}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#111C35] to-[#0D152A] border border-amber-500/30 hover:border-amber-400/60 transition-all cursor-pointer shadow-xs group flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Megaphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs truncate">
                        {isAm ? 'የካምፓስ ማስታወቂያዎች' : 'Campus Notices'}
                      </span>
                      <span className="text-[8.5px] font-mono font-bold bg-amber-500/25 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                        {isAm ? 'አዲስ' : 'NEW'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {isAm ? 'ይፋዊ መረጃዎች እና ፈተናዎች' : 'Official Notices & Exam Updates'}
                    </span>
                  </div>
                </div>
                <div className="text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="space-y-1">
                <div className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                  <span>{isAm ? 'ዋና ዋና ገጾች' : 'Navigation Portal'}</span>
                </div>

                {/* Home */}
                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-900 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs">{isAm ? 'ዋና ዳሽቦርድ' : 'Home Dashboard'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-all" />
                </button>

                {/* University Exam Archive */}
                <button
                  type="button"
                  onClick={() => handleNavClick('university')}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-900 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-xs block">{isAm ? 'የዩኒቨርሲቲ ፈተናዎች' : 'University Exam Archive'}</span>
                      <span className="text-[9.5px] text-slate-400 font-mono">{isAm ? 'በክፍል እና በምዕራፍ' : 'By Unit & Chapter'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-all" />
                </button>

                {/* Books & Curriculum */}
                <button
                  type="button"
                  onClick={() => handleNavClick('bookstore')}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-900 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs">{isAm ? 'ዲጂታል መጻሕፍትና ሲላበስ' : 'Curriculum Books & Modules'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-all" />
                </button>

                {/* Quizzes & Practice Tests */}
                <button
                  type="button"
                  onClick={() => handleNavClick('quiz')}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-900 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs">{isAm ? 'የልምምድ ፈተናዎችና ጥያቄዎች' : 'Quizzes & Practice Tests'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-all" />
                </button>


                {/* Student Profile & Academic Record */}
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-900 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-xs block">{isAm ? 'የተማሪ መገለጫና ውጤት' : 'Student Profile & Stats'}</span>
                      <span className="text-[9.5px] text-slate-400 font-mono">{isAm ? 'ቀጣይነትና ሰዓታት' : 'Streak, Hours & Courses'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-all" />
                </button>

                {/* Mobile APKPure App Install Button */}
                <PWAInstallButton language={language} variant="compact" />

                {/* Upgrade to Pro */}
                <button
                  type="button"
                  onClick={() => handleNavClick('upgrade')}
                  className="w-full px-2.5 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs">{isAm ? 'ወደ ፕሮ አሳድግ (Telebirr / CBE)' : 'Upgrade to Pro (Telebirr / CBE)'}</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </button>

                {isUserAdmin && onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => { playClickChime(); onOpenAdmin(); onClose(); }}
                    className="w-full px-2.5 py-2 rounded-xl border font-bold transition-all flex items-center justify-between group cursor-pointer bg-slate-900 border-slate-800 text-amber-300 hover:border-amber-400/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs">
                        {isAm ? 'የአስተዳዳሪ ማዕከል (Admin)' : 'Admin Control Center'}
                      </span>
                    </div>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-mono">
                      Lead Admin
                    </span>
                  </button>
                )}
              </div>

              {/* ℹ️ ABOUT APP INFO SECTION */}
              <div className="p-3.5 rounded-xl bg-[#111C35] border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAm ? 'ስለ ኢትዮ ለርን ፕሮ' : 'About EthioLearn Pro'}</span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  {isAm
                    ? 'ኢትዮ ለርን ፕሮ በኢትዮጵያ ዩኒቨርሲቲዎች (በወልቂጤ ዩኒቨርሲቲ ተጀምሮ በመላው ሀገሪቱ የሚሰራ) ለከፍተኛ ትምህርት ተማሪዎች የተዘጋጀ የጥናት፣ የ10,000+ የቀድሞ ፈተናዎች፣ የሞጁሎችና የፈተና ዝግጅት መተግበሪያ ነው።'
                    : 'EthioLearn Pro is an academic platform tailored for Ethiopian university scholars, pioneered at Wolkite University and expanding nationwide.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[9.5px]">
                    <span className="text-slate-400 block">{isAm ? 'የትምህርት ዘመን' : 'Academic Year'}</span>
                    <span className="font-bold text-white">2016 - 2017 E.C.</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[9.5px]">
                    <span className="text-slate-400 block">{isAm ? 'መነሻ ካምፓስ' : 'Primary Campus'}</span>
                    <span className="font-bold text-amber-400">Wolkite University</span>
                  </div>
                </div>
              </div>

              {/* 📞 OFFICIAL CONTACT & ADMIN SUPPORT SECTION */}
              <div className="p-3.5 rounded-xl bg-[#111C35] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {isAm ? 'የአስተዳዳሪና የድጋፍ አድራሻ' : 'Official Contact & Support'}
                  </span>
                  {copiedText && (
                    <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {copiedText} {isAm ? 'ተቀድቷል!' : 'Copied!'}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-[10.5px]">
                  {/* Phone 1 */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[9.5px] text-slate-400 block">{isAm ? 'ስልክ 1' : 'Phone 1'}</span>
                        <a 
                          href="tel:+251906046518" 
                          className="font-mono font-bold text-white hover:text-amber-400 transition-colors"
                        >
                          +251906046518
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href="tel:+251906046518"
                        className="px-1.5 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[9.5px] font-bold"
                      >
                        {isAm ? 'ደውል' : 'Call'}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('+251906046518', 'Phone 1')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Phone 1"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Phone 2 */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[9.5px] text-slate-400 block">{isAm ? 'ስልክ 2' : 'Phone 2'}</span>
                        <a 
                          href="tel:+251966701315" 
                          className="font-mono font-bold text-white hover:text-amber-400 transition-colors"
                        >
                          +251966701315
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href="tel:+251966701315"
                        className="px-1.5 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[9.5px] font-bold"
                      >
                        {isAm ? 'ደውል' : 'Call'}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('+251966701315', 'Phone 2')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Phone 2"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[9.5px] text-slate-400 block">{isAm ? 'ኢሜይል' : 'Official Email'}</span>
                        <a 
                          href="mailto:Abrehamalemayehu05@gmail.com" 
                          className="font-mono font-bold text-white hover:text-amber-400 transition-colors truncate block text-[10.5px]"
                        >
                          Abrehamalemayehu05@gmail.com
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('Abrehamalemayehu05@gmail.com', 'Email')}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer shrink-0"
                      title="Copy Email"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Telegram Channel */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Send className="w-3 h-3 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[9.5px] text-slate-400 block">
                          {isAm ? 'ኦፊሴላዊ የቴሌግራም ቻናል' : 'Official Telegram Channel'}
                        </span>
                        <a 
                          href="https://t.me/Et_Learnn" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-slate-200 hover:text-amber-400 transition-colors text-xs"
                        >
                          @Et_Learnn
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href="https://t.me/Et_Learnn"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[9.5px] font-bold inline-flex items-center gap-1 transition-all"
                      >
                        <span>{isAm ? 'ተቀላቀል' : 'Join'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('https://t.me/Et_Learnn', 'Telegram Channel')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Telegram Channel Link"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Telegram Admin */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Send className="w-3 h-3 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[9.5px] text-slate-400 block">{isAm ? 'አድሚን ቴሌግራም' : 'Admin Telegram'}</span>
                        <a 
                          href="https://t.me/ultra207" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-slate-200 hover:text-amber-400 transition-colors"
                        >
                          @ultra207
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href="https://t.me/ultra207"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[9.5px] font-bold inline-flex items-center gap-1"
                      >
                        <span>Chat</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('@ultra207', 'Telegram')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Telegram Username"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 📲 PWA App Installation Action Card */}
              <div className="pt-1">
                <PWAInstallButton language={language} variant="banner" />
              </div>

              {/* 📢 CAMPUS ANNOUNCEMENTS & BULLETIN BOARD */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playClickChime();
                    onClose();
                    if (onOpenAnnouncements) onOpenAnnouncements();
                  }}
                  className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs">
                      {isAm ? 'የካምፓስ ማስታወቂያዎች' : 'Campus Announcements'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                    {isAm ? 'ማስታወቂያ' : 'Notices'}
                  </span>
                </button>
              </div>

              {/* 📜 ABOUT, TERMS AND CONDITION, PRIVACY ACTIONS */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                  {isAm ? 'ሕጋዊ መረጃ እና ፖሊሲዎች' : 'About, Terms & Privacy'}
                </div>

                <button
                  type="button"
                  onClick={() => handleLegalClick('about')}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-slate-200 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold">{isAm ? 'ስለ መተግበሪያው (About App)' : 'About EthioLearn Pro'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleLegalClick('terms')}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-slate-200 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold">{isAm ? 'የአጠቃቀም ውል (Terms & Conditions)' : 'Terms & Conditions'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleLegalClick('privacy')}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-slate-200 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">{isAm ? 'የግላዊነት ፖሊሲ (Privacy Policy)' : 'Privacy Policy'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>

            </div>

            {/* Bottom Footer with Ge'ez Calendar */}
            <div className="p-3.5 border-t border-white/10 bg-[#080E21] space-y-2.5 shrink-0 text-xs">
              {ethDateFormatted && (
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-300 font-serif">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    {ethDateFormatted}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">Ge'ez Calendar Active</span>
                </div>
              )}
            </div>

          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
