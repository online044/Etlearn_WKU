/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Send, Wifi, Battery, Maximize2, 
  CheckCircle, Sparkles, X, MoreVertical,
  ShieldCheck, ArrowLeft, RefreshCw
} from 'lucide-react';
import { 
  getTelegramWebApp, 
  isTelegramWebApp, 
  getTelegramUser, 
  initTelegramWebApp, 
  triggerHaptic, 
  setTelegramBackButton, 
  closeTelegramWebApp 
} from '../utils/telegram';
import { safeStorage } from '../utils/safeStorage';

export type FrameDisplayMode = 'mobile' | 'telegram' | 'expanded';

interface AppDeviceFrameProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigateBack?: () => void;
  language?: 'en' | 'am';
}

export default function AppDeviceFrame({
  children,
  currentPage,
  onNavigateBack,
  language = 'en'
}: AppDeviceFrameProps) {
  // Check if saved frame mode preference exists
  const [frameMode, setFrameMode] = useState<FrameDisplayMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeStorage.getItem('ethiolearn_frame_mode') as FrameDisplayMode;
      if (saved && (saved === 'mobile' || saved === 'telegram' || saved === 'expanded')) {
        return saved;
      }
    }
    return 'mobile'; // Default to Real App with Border on desktop
  });

  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const tgUser = getTelegramUser();
  const isTgNative = isTelegramWebApp();

  // Initialize Telegram WebApp SDK if present
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  // Update clock every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Responsive screen detection
  useEffect(() => {
    const checkScreen = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Synchronize Telegram BackButton
  useEffect(() => {
    const shouldShowBackButton = (frameMode === 'telegram' || isTgNative) && Boolean(onNavigateBack && currentPage && currentPage !== 'home');
    setTelegramBackButton(shouldShowBackButton, () => {
      triggerHaptic('medium');
      if (onNavigateBack) onNavigateBack();
    });

    return () => {
      setTelegramBackButton(false);
    };
  }, [frameMode, isTgNative, onNavigateBack, currentPage]);

  const handleModeChange = (mode: FrameDisplayMode) => {
    triggerHaptic('light');
    setFrameMode(mode);
    safeStorage.setItem('ethiolearn_frame_mode', mode);
  };

  // If on actual mobile screen or natively inside Telegram Mini App, render edge-to-edge
  if (isMobileScreen || isTgNative) {
    return (
      <div className="w-full min-h-screen bg-[#0A1128] text-slate-100 flex flex-col relative overflow-x-hidden">
        {children}
      </div>
    );
  }

  // Expanded Responsive Mode
  if (frameMode === 'expanded') {
    return (
      <div className="w-full min-h-screen bg-[#070b18] text-slate-100 flex flex-col relative">
        {/* Top Control Bar for Desktop */}
        <header className="bg-[#0e1628]/95 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between z-40 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-serif font-black text-amber-400 tracking-wider">ETHIOLEARN PRO</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase">
              {language === 'am' ? 'ሙሉ ስክሪን ሁነታ' : 'Full Screen Mode'}
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleModeChange('mobile')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Real App Border Frame"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'am' ? 'የስልክ ቦርደር' : 'App Frame'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('telegram')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Telegram Mini App Frame"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('expanded')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-black shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ሙሉ' : 'Full'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    );
  }

  // Real App Mobile Chassis / Telegram Mini App Frame with Realistic Border
  return (
    <div className="min-h-screen w-full bg-[#050814] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111e42] via-[#080d1e] to-[#04060d] text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 select-none overflow-x-hidden relative">
      
      {/* Background Decorative Accents */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/3 rounded-full blur-[140px] pointer-events-none" />

      {/* Frame Control Toolbar */}
      <div className="w-full max-w-[430px] mb-3.5 flex items-center justify-between text-xs px-2 z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-serif font-black text-white text-xs tracking-wide">ETHIOLEARN PRO</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40">
                {frameMode === 'telegram' ? 'TG MINI APP' : 'REAL APP'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {frameMode === 'telegram' ? 'Telegram Mini App Mode' : 'Native Mobile App Frame'}
            </span>
          </div>
        </div>

        {/* View mode toggle controls */}
        <div className="flex items-center gap-1 bg-[#0d162d]/90 border border-slate-700/80 p-1 rounded-xl shadow-lg">
          <button
            type="button"
            onClick={() => handleModeChange('mobile')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
              frameMode === 'mobile' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Real App Border"
          >
            <Smartphone className="w-3 h-3" />
            <span className="hidden xs:inline">{language === 'am' ? 'ስልክ' : 'Phone'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('telegram')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
              frameMode === 'telegram' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Telegram Mini App View"
          >
            <Send className="w-3 h-3" />
            <span className="hidden xs:inline">Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('expanded')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
            title="Full Screen View"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL DEVICE CHASSIS WITH BORDER */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-[430px] rounded-[46px] p-[10px] bg-gradient-to-b from-[#2a3650] via-[#172033] to-[#0f172a] shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12)] border-2 border-slate-700/60 transition-all duration-300">
        
        {/* Device Outer Metallic Highlight Ring */}
        <div className="absolute inset-0 rounded-[46px] pointer-events-none border border-amber-500/10" />

        {/* Hardware buttons simulation on left and right */}
        {/* Volume up/down on left */}
        <div className="absolute -left-[14px] top-28 w-[4px] h-11 bg-slate-700 rounded-l-md border-r border-slate-900 shadow-sm hidden sm:block" />
        <div className="absolute -left-[14px] top-42 w-[4px] h-11 bg-slate-700 rounded-l-md border-r border-slate-900 shadow-sm hidden sm:block" />
        {/* Power button on right */}
        <div className="absolute -right-[14px] top-32 w-[4px] h-14 bg-slate-700 rounded-r-md border-l border-slate-900 shadow-sm hidden sm:block" />

        {/* Device Screen Container with Inner Bezel & Border */}
        <div className="relative w-full h-[844px] bg-[#0A1128] rounded-[38px] overflow-hidden border border-slate-800 flex flex-col shadow-inner">
          
          {/* ========================================================================= */}
          {/* TOP STATUS BAR (TIME, DYNAMIC ISLAND / CAMERA PILL, BATTERY, 5G) */}
          {/* ========================================================================= */}
          <div className="h-11 w-full bg-[#0A1128] text-white flex items-center justify-between px-6 select-none shrink-0 z-50 border-b border-slate-900/60">
            {/* Clock */}
            <span className="text-[12px] font-bold font-mono tracking-tight text-slate-200">
              {currentTime}
            </span>

            {/* Dynamic Island / Earpiece & Selfie Camera */}
            <div className="relative h-6 px-3 rounded-full bg-black/90 border border-slate-800 flex items-center gap-2 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111c33] border border-slate-700 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-blue-500/80" />
              </span>
              <span className="w-8 h-1 rounded-full bg-slate-900" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Connectivity and Battery */}
            <div className="flex items-center gap-1.5 text-slate-300">
              {/* 4-bar Signal */}
              <div className="flex items-end gap-[1.5px] h-3">
                <span className="w-[2.5px] h-[3px] bg-slate-200 rounded-[0.5px]" />
                <span className="w-[2.5px] h-[5px] bg-slate-200 rounded-[0.5px]" />
                <span className="w-[2.5px] h-[8px] bg-slate-200 rounded-[0.5px]" />
                <span className="w-[2.5px] h-[10px] bg-slate-200 rounded-[0.5px]" />
              </div>

              {/* Wi-Fi */}
              <Wifi className="w-3.5 h-3.5 text-slate-200" />

              {/* Battery */}
              <div className="flex items-center gap-0.5">
                <div className="w-5 h-2.5 rounded-[3px] border border-slate-300 p-[1px] flex items-center">
                  <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
                </div>
                <span className="w-0.5 h-1 bg-slate-400 rounded-r-[1px]" />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TELEGRAM MINI APP HEADER BAR (When in Telegram mode) */}
          {/* ========================================================================= */}
          {frameMode === 'telegram' && (
            <div className="h-11 w-full bg-[#0e172a] border-b border-slate-800 flex items-center justify-between px-3 text-xs select-none shrink-0 z-40 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    if (onNavigateBack && currentPage && currentPage !== 'home') {
                      onNavigateBack();
                    } else {
                      closeTelegramWebApp();
                    }
                  }}
                  className="px-2 py-1 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-slate-800 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {currentPage && currentPage !== 'home' ? (
                    <>
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ተመለስ' : 'Back'}</span>
                    </>
                  ) : (
                    <span>{language === 'am' ? 'ዝጋ' : 'Close'}</span>
                  )}
                </button>
              </div>

              {/* Bot Info Title */}
              <div className="flex flex-col items-center leading-none">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-xs">EthioLearn Pro</span>
                  <CheckCircle className="w-3 h-3 text-sky-400 fill-sky-400/20" />
                </div>
                <span className="text-[9.5px] text-slate-400">bot</span>
              </div>

              {/* More Menu */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsTelegramModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Telegram Menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* APP ACTIVE VIEWPORT (Scrollable screen body) */}
          {/* ========================================================================= */}
          <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative bg-[#0A1128]">
            {children}
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM HOME INDICATOR GESTURE BAR */}
          {/* ========================================================================= */}
          <div className="h-5 w-full bg-[#0A1128] flex items-center justify-center shrink-0 border-t border-slate-900/60">
            <div className="w-28 h-1 bg-slate-500/50 hover:bg-slate-400 transition rounded-full cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Telegram Mini App Details Modal */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0e172a] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1">
                    EthioLearn Pro Bot
                    <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">@EthioLearnProBot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Telegram WebApp SDK:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected v7.0
                </span>
              </div>
              {tgUser && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Logged in Telegram User:</span>
                  <span className="text-amber-300 font-bold">
                    {tgUser.first_name} {tgUser.last_name || ''} (@{tgUser.username || 'user'})
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Haptic Feedback:</span>
                <span className="text-slate-200">Active (Native Vibration)</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  alert(language === 'am' ? 'የቴሌግራም ቫይብሬሽን (Haptic) ተፈትኗል!' : 'Telegram Haptic Vibration Triggered!');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                <span>{language === 'am' ? 'የHaptic ቫይብሬሽን ሞክር' : 'Test Haptic Feedback'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsTelegramModalOpen(false);
                }}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {language === 'am' ? 'እሺ (ቀጥል)' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
