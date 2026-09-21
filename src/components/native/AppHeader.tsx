import React from 'react';
import { Menu, ArrowLeft, Bell, Flame, Globe } from 'lucide-react';
import StudentAvatar from '../StudentAvatar';
import { StudentProfile } from '../../types';
import { playClickChime } from '../../utils/audio';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenDrawer?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onToggleLanguage?: () => void;
  language: 'en' | 'am' | 'both';
  profile: StudentProfile | null;
  streakCount?: number;
  unreadCount?: number;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  onOpenDrawer,
  onOpenNotifications,
  onOpenProfile,
  onToggleLanguage,
  language,
  profile,
  streakCount = 0,
  unreadCount = 0,
}: AppHeaderProps) {
  const isAmharic = language === 'am';

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0A1128]/95 backdrop-blur-md border-b border-slate-800/80 transition-all select-none">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        {/* Left: Back button or Drawer toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showBack ? (
            <button
              type="button"
              onClick={() => {
                playClickChime();
                if (onBack) onBack();
              }}
              className="w-10 h-10 -ml-1 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playClickChime();
                if (onOpenDrawer) onOpenDrawer();
              }}
              className="w-10 h-10 -ml-1 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-slate-200" />
            </button>
          )}

          {/* Title area */}
          <div className="flex flex-col min-w-0 max-w-[160px] sm:max-w-[240px]">
            {title ? (
              <>
                <h1 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                    {subtitle}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center">
                  ET<span className="text-amber-400">_LEARN</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400/15 text-amber-400 border border-amber-400/30">
                  Pro
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right action items */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Streak indicator */}
          {streakCount > 0 && (
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black"
              title={`${streakCount} Day Study Streak`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span className="text-[11px] leading-none">{streakCount}</span>
            </div>
          )}

          {/* Language Switcher chip */}
          {onToggleLanguage && (
            <button
              type="button"
              onClick={() => {
                playClickChime();
                onToggleLanguage();
              }}
              className="h-8 px-2 rounded-lg bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title={isAmharic ? 'ወደ እንግሊዝኛ ቀይር' : 'Switch to Amharic'}
            >
              <Globe className="w-3 h-3 text-amber-400" />
              <span>{isAmharic ? 'አማ' : 'EN'}</span>
            </button>
          )}

          {/* Notification bell */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={() => {
                playClickChime();
                onOpenNotifications();
              }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0A1128]" />
              )}
            </button>
          )}

          {/* Student Avatar */}
          {profile && onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                playClickChime();
                onOpenProfile();
              }}
              className="w-9 h-9 p-0.5 rounded-full border border-amber-400/70 hover:border-amber-400 transition-all cursor-pointer active:scale-95 shrink-0"
              aria-label="Student profile"
            >
              <StudentAvatar
                avatar={profile.avatar}
                name={profile.name}
                size={30}
                className="rounded-full"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
