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
  HelpCircle, Scale, Lock, HeartHandshake, Layers
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
            className="relative w-full max-w-sm sm:max-w-md h-full bg-[#0B132B] text-slate-100 border-r border-amber-500/20 shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Ambient Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3">
                <EthioLearnLogo size={42} showCardBackground={true} iconOnly={true} className="shrink-0 shadow-md" />
                <div className="leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-black text-white text-base sm:text-lg tracking-tight">
                      EthioLearn Pro
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      v2.4
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {isAm ? 'የዩኒቨርሲቲ የጥናትና የፈተና ፕላትፎርም' : 'Bilingual University Exam Engine'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { playClickChime(); onClose(); }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Sidebar Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar text-xs">
              
              {/* Profile Overview Card */}
              <div 
                onClick={() => handleNavClick('profile')}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 flex items-center justify-between hover:border-amber-400/40 transition-all cursor-pointer group"
                title={isAm ? "የተማሪ መገለጫ ክፈት" : "Open Student Profile"}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StudentAvatar 
                    avatar={profile.avatar} 
                    name={profile.name} 
                    size={42} 
                    className="border-2 border-amber-400 shadow-md group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
                      <span className="truncate group-hover:text-amber-400 transition-colors">{profile.name || (isAm ? 'ተማሪ' : 'Student')}</span>
                      {profile.isPro && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase shrink-0">
                          PRO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {profile.university || 'Wolkite University'} • {profile.department || (isAm ? 'ፋኩልቲ' : 'General')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavClick('profile');
                  }}
                  className="p-2 rounded-lg bg-white/5 group-hover:bg-amber-500/20 text-slate-300 group-hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                  title="View Profile"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Navigation Links */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
                  <span>{isAm ? 'ዋና ዋና ገጾች' : 'Navigation Portal'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className="w-full p-2.5 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs">{isAm ? 'ዋና ዳሽቦርድ' : 'Home Dashboard'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('university')}
                  className="w-full p-2.5 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-xs block">{isAm ? 'የዩኒቨርሲቲ ፈተናዎች' : 'University Exam Archive'}</span>
                      <span className="text-[10px] text-amber-400 font-mono">{isAm ? 'በክፍል እና በምዕራፍ የተከፋፈሉ' : 'Organized by Unit & Chapter'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('bookstore')}
                  className="w-full p-2.5 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs">{isAm ? 'ዲጂታል መጻሕፍትና ሲላበስ' : 'Curriculum Books & Notes'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('notes')}
                  className="w-full p-2.5 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs">{isAm ? 'የጥናት ማስታወሻዎች' : 'Personal Study Notes'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('upgrade')}
                  className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs">{isAm ? 'ወደ ፕሮ አሳድግ (Telebirr / CBE)' : 'Upgrade to Pro (Telebirr / CBE)'}</span>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                </button>

                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => { playClickChime(); onOpenAdmin(); onClose(); }}
                    className={`w-full p-2.5 rounded-xl border font-bold transition-all flex items-center justify-between group cursor-pointer ${
                      isUserAdmin
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/50 text-slate-300 hover:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={`w-4 h-4 ${isUserAdmin ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-xs">
                        {isAm ? 'የአስተዳዳሪ ማዕከል (Admin)' : 'Admin Control Center'}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                      {isUserAdmin ? 'Lead Admin' : 'Sign in'}
                    </span>
                  </button>
                )}
              </div>

              {/* ℹ️ ABOUT APP INFO SECTION */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#142042] to-[#0F172E] border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{isAm ? 'ስለ ኢትዮ ለርን ፕሮ (About EthioLearn Pro)' : 'About EthioLearn Pro'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isAm
                    ? 'ኢትዮ ለርን ፕሮ በኢትዮጵያ ዩኒቨርሲቲዎች (በተለይም በወልቂጤ ዩኒቨርሲቲ ተጀምሮ በመላው ሀገሪቱ የሚሰራ) ለከፍተኛ ትምህርት ተማሪዎች የተዘጋጀ የ AI ጥናት፣ የ10,000+ የቀድሞ የፈተና ጥያቄዎች፣ የዩኒቨርሲቲ ማስታወሻዎች እና የፈተና ዝግጅት መተግበሪያ ነው።'
                    : 'EthioLearn Pro is an advanced bilingual (English/Amharic) academic platform tailored for Ethiopian university scholars, pioneered at Wolkite University and expanding nationwide. Features authentic faculty exam archives, AI tutoring, and curriculum flashcards.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-xl bg-black/20 border border-white/5 text-[10px]">
                    <span className="text-slate-400 block">{isAm ? 'የትምህርት ዘመን' : 'Academic Year'}</span>
                    <span className="font-bold text-white">2016 - 2017 E.C.</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/20 border border-white/5 text-[10px]">
                    <span className="text-slate-400 block">{isAm ? 'መነሻ ካምፓስ' : 'Primary Campus'}</span>
                    <span className="font-bold text-amber-400">Wolkite University</span>
                  </div>
                </div>
              </div>

              {/* 📞 OFFICIAL CONTACT & ADMIN SUPPORT SECTION */}
              <div className="p-4 rounded-2xl bg-[#0F172A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {isAm ? 'የአስተዳዳሪና የድጋፍ አድራሻ' : 'Official Contact & Support'}
                  </span>
                  {copiedText && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-fade-in">
                      {copiedText} {isAm ? 'ተቀድቷል!' : 'Copied!'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-[11px]">
                  {/* Phone 1 */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAm ? 'ስልክ 1' : 'Phone 1'}</span>
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
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold"
                      >
                        {isAm ? 'ደውል' : 'Call'}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('+251906046518', 'Phone 1')}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Phone 1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Phone 2 */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAm ? 'ስልክ 2' : 'Phone 2'}</span>
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
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold"
                      >
                        {isAm ? 'ደውል' : 'Call'}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('+251966701315', 'Phone 2')}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Phone 2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-slate-400 block">{isAm ? 'ኢሜይል' : 'Official Email'}</span>
                        <a 
                          href="mailto:Abrehamalemayehu05@gmail.com" 
                          className="font-mono font-bold text-white hover:text-amber-400 transition-colors truncate block text-[11px]"
                        >
                          Abrehamalemayehu05@gmail.com
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('Abrehamalemayehu05@gmail.com', 'Email')}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer shrink-0"
                      title="Copy Email"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Telegram Channel */}
                  <div className="p-2.5 rounded-xl bg-[#0088cc]/15 border border-[#0088cc]/40 flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0088cc]/25 flex items-center justify-center shrink-0 text-[#38bdf8]">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-300 font-semibold block">
                          {isAm ? 'ኦፊሴላዊ የቴሌግራም ቻናል' : 'Official Telegram Channel'}
                        </span>
                        <a 
                          href="https://t.me/Et_Learnn" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-[#38bdf8] hover:underline text-xs"
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
                        className="px-2.5 py-1 rounded-lg bg-[#0088cc] hover:bg-[#0088cc]/80 text-white text-[10px] font-bold inline-flex items-center gap-1 shadow-sm transition-all"
                      >
                        <span>{isAm ? 'ተቀላቀል' : 'Join'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('https://t.me/Et_Learnn', 'Telegram Channel')}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Telegram Channel Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Telegram Admin */}
                  <div className="p-2.5 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-[#0088cc] shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAm ? 'አድሚን ቴሌግራም' : 'Admin Telegram'}</span>
                        <a 
                          href="https://t.me/ultra207" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-[#38bdf8] hover:underline"
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
                        className="px-2.5 py-1 rounded-lg bg-[#0088cc] hover:bg-[#0088cc]/80 text-white text-[10px] font-bold inline-flex items-center gap-1 shadow-sm"
                      >
                        <span>Chat</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('@ultra207', 'Telegram')}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Telegram Username"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 📲 PWA App Installation Action Card */}
              <div className="pt-1">
                <PWAInstallButton language={language} variant="banner" />
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

            {/* Bottom Footer with Language, Theme, and Calendar */}
            <div className="p-4 border-t border-white/10 bg-[#080E21] space-y-3 shrink-0 text-xs">
              <div className="flex items-center justify-between">
                {/* Language Toggle */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setLanguage('en'); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      language === 'en' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setLanguage('am'); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      language === 'am' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    አማርኛ
                  </button>
                </div>

                {/* Theme Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    playClickChime();
                    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Toggle Theme"
                >
                  {themeMode === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-bold">Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-bold">Dark</span>
                    </>
                  )}
                </button>
              </div>

              {ethDateFormatted && (
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
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
