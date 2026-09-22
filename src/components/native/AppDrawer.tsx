import React, { useEffect } from 'react';
import { 
  X, Home, BookOpen, Award, FileText, Bot, Sparkles, Heart, ShieldCheck, 
  LogOut, ChevronRight, Download, Send, Zap, User, Star
} from 'lucide-react';
import StudentAvatar from '../StudentAvatar';
import { StudentProfile } from '../../types';
import { playClickChime } from '../../utils/audio';
import { usePWAInstall, APK_PURE_URL } from '../../utils/usePWAInstall';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  language: 'en' | 'am' | 'both';
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  isUserAdmin?: boolean;
  onOpenAdmin?: () => void;
  onInstallPwa?: () => void;
  isInstallable?: boolean;
}

export default function AppDrawer({
  isOpen,
  onClose,
  profile,
  language,
  onNavigate,
  onSignOut,
  isUserAdmin,
  onOpenAdmin,
  onInstallPwa,
  isInstallable,
}: AppDrawerProps) {
  const isAmharic = language === 'am';
  const { isInstallVisible, hasDownloaded, downloadAndInstall } = usePWAInstall();

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (action: () => void) => {
    playClickChime();
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer surface panel */}
      <div 
        className="relative w-[300px] sm:w-[320px] max-w-[85vw] h-full bg-[#0F172A] border-r border-slate-800 text-slate-100 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        {/* Top Header Card */}
        <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-[#1E293B]/70 to-[#0F172A]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white">
                ET<span className="text-amber-400">_LEARN</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/15 text-amber-400 border border-amber-400/30">
                {profile.isPro ? 'PRO' : 'STUDENT'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Profile Quick View */}
          <button
            onClick={() => handleItemClick(() => onNavigate('profile'))}
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition cursor-pointer group"
          >
            <StudentAvatar avatar={profile.avatar} name={profile.name} size={42} className="border border-amber-400/60" />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-white truncate group-hover:text-amber-400">
                {profile.name || 'Scholar'}
              </h3>
              <p className="text-[10.5px] text-slate-400 truncate">
                {profile.university || 'Wolkite University'}
              </p>
              <p className="text-[9.5px] text-amber-400/90 truncate font-semibold mt-0.5">
                {profile.department || 'Freshman Common Courses'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 text-xs font-medium">
          <div className="px-3 py-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            {isAmharic ? 'ዋና ክፍሎች' : 'Main Navigation'}
          </div>

          <button
            onClick={() => handleItemClick(() => onNavigate('home'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <Home className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1 text-left">{isAmharic ? 'ዋና ዳሽቦርድ' : 'Home Dashboard'}</span>
          </button>

          <button
            onClick={() => handleItemClick(() => onNavigate('university'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1 text-left">{isAmharic ? 'የዩኒቨርሲቲ ፈተናዎች' : 'University Past Exams'}</span>
          </button>

          <button
            onClick={() => handleItemClick(() => onNavigate('bookstore'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1 text-left">{isAmharic ? 'መጻሕፍት እና ማስታወሻዎች' : 'Books & Study Notes'}</span>
          </button>

          <button
            onClick={() => handleItemClick(() => onNavigate('tutor'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <Bot className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="flex-1 text-left">{isAmharic ? 'አስጎብኚ AI አስተማሪ' : 'AI Tutor (አስጎብኚ)'}</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-500/20 text-purple-300">AI</span>
          </button>

          <button
            onClick={() => handleItemClick(() => onNavigate('examprep'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1 text-left">{isAmharic ? 'የፈተና ዝግጅት ማዕከል' : 'Exam Prep Hub'}</span>
          </button>

          {/* Tools & Community */}
          <div className="pt-2 px-3 py-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            {isAmharic ? 'ተጨማሪ አገልግሎቶች' : 'Tools & Perks'}
          </div>

          <button
            onClick={() => handleItemClick(() => onNavigate('upgrade'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer font-semibold"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
            <span className="flex-1 text-left">{isAmharic ? 'ወደ PRO አሳድግ' : 'Upgrade to PRO'}</span>
            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">ETB</span>
          </button>

          {isInstallVisible && !hasDownloaded && (
            <a
              href={APK_PURE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={async (e) => {
                e.preventDefault();
                await downloadAndInstall();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="flex-1 text-left">{isAmharic ? 'መተግበሪያውን ጫን (APKPure)' : 'Install App (APKPure)'}</span>
              <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">APK</span>
            </a>
          )}

          <a
            href="https://t.me/WolkiteUniversityCommunity"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <Send className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="flex-1 text-left">{isAmharic ? 'ቴሌግራም ቻናል' : 'Telegram Channel'}</span>
          </a>

          {/* Admin link if user is administrator */}
          {isUserAdmin && onOpenAdmin && (
            <button
              onClick={() => handleItemClick(onOpenAdmin)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer font-bold"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="flex-1 text-left">Admin Console</span>
            </button>
          )}
        </div>

        {/* Bottom Footer Action */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <button
            onClick={() => handleItemClick(onSignOut)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-500/15 border border-slate-700/80 hover:border-red-500/30 text-slate-300 hover:text-red-300 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isAmharic ? 'ውጣ / Logout' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
