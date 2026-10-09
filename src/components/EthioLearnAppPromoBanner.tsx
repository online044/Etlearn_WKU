import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Crown, 
  GraduationCap, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  X,
  BookOpen,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { StudentProfile } from '../types';
import { usePWAInstall } from '../utils/usePWAInstall';
import { playClickChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';

export interface EthioLearnAppPromoProps {
  profile?: StudentProfile | null;
  className?: string;
  language?: 'en' | 'am';
  onUpgradeClick?: () => void;
  onNavigate?: (page: any) => void;
  onInstallClick?: () => void;
  positionContext?: string;
  // Legacy props from GoogleAdBanner for backward compatibility
  slotId?: string;
  format?: string;
  layoutKey?: string;
}

interface PromoCampaign {
  id: string;
  tag: { en: string; am: string };
  title: { en: string; am: string };
  highlight: { en: string; am: string };
  ctaText: { en: string; am: string };
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  actionType: 'install' | 'notes' | 'exams' | 'upgrade' | 'telegram' | 'bookstore';
}

const CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'free_pdfs',
    tag: { en: '100% Free PDFs', am: '100% ነፃ ፒዲኤፎች' },
    title: { 
      en: 'All Ethiopian university textbooks & lecture note PDFs are 100% Free to read and download', 
      am: 'ሁሉም የዩኒቨርሲቲ ሞጁሎች እና የትምህርት ኖት ፒዲኤፎች በነፃ ማንበብና ማውረድ ይችላሉ' 
    },
    highlight: { en: '100% Free PDFs', am: 'ነፃ ፒዲኤፍ' },
    ctaText: { en: 'Read Free PDFs', am: 'መጽሐፍት አንብብ' },
    icon: BookOpen,
    accentColor: '#F59E0B',
    actionType: 'bookstore'
  },
  {
    id: 'biology_open',
    tag: { en: 'Open Course', am: 'ክፍት ኮርስ' },
    title: { 
      en: 'General Biology video lectures are open & free for all students! Upgrade to Pro for all course videos', 
      am: 'የአጠቃላይ ባዮሎጂ የቪዲዮ ትምህርቶች ለሁሉም ክፍት ናቸው! ለሌሎች ኮርሶች ወደ ፕሮ ያሳድጉ' 
    },
    highlight: { en: 'Free Biology Videos', am: 'ነፃ ባዮሎጂ ቪዲዮ' },
    ctaText: { en: 'Watch Biology', am: 'ባዮሎጂ ይመልከቱ' },
    icon: Sparkles,
    accentColor: '#F59E0B',
    actionType: 'bookstore'
  },
  {
    id: 'pro_upgrade',
    tag: { en: 'Video Pro Pass', am: 'የቪዲዮ ፕሮ ፓስ' },
    title: { 
      en: 'Unlock full video lectures for all university courses via Telebirr & CBE Birr (Only 80 ETB)', 
      am: 'ለሁሉም የዩኒቨርሲቲ ኮርሶች የተሟሉ የቪዲዮ ትምህርቶችን በቴሌብር እና በንግድ ባንክ ይክፈቱ (80 ብር ብቻ)' 
    },
    highlight: { en: 'From 80 ETB', am: 'ከ80 ብር ጀምሮ' },
    ctaText: { en: 'Upgrade Pro', am: 'ወደ ፕሮ አሳድግ' },
    icon: Crown,
    accentColor: '#F59E0B',
    actionType: 'upgrade'
  },
  {
    id: 'exam_bank',
    tag: { en: 'Past Exams', am: 'ያለፉ ፈተናዎች' },
    title: { 
      en: 'Wolkite, AAU & National Exam Archives with verified answer keys', 
      am: 'የወልቂጤ እና የኢትዮጵያ ዩኒቨርሲቲ ፈተናዎች ከተሟሉ መልሶች ጋር' 
    },
    highlight: { en: '1,000+ Exams', am: '1,000+ ፈተናዎች' },
    ctaText: { en: 'Open Exams', am: 'ፈተናዎች' },
    icon: GraduationCap,
    accentColor: '#F59E0B',
    actionType: 'exams'
  },
  {
    id: 'telegram',
    tag: { en: 'Telegram Hub', am: 'ቴሌግራም' },
    title: { 
      en: 'Join 200+ university scholars on @Et_Learnn for study materials and discussions', 
      am: 'ከ200+ ተማሪዎች ጋር በቴሌግራም የፈተና ጥያቄዎችን እና ኖቶችን ይጋሩ (@Et_Learnn)' 
    },
    highlight: { en: '@Et_Learnn', am: '@Et_Learnn' },
    ctaText: { en: 'Join Channel', am: 'ቴሌግራም' },
    icon: Send,
    accentColor: '#F59E0B',
    actionType: 'telegram'
  }
];

export default function EthioLearnAppPromoBanner({
  profile,
  className = '',
  language = 'en',
  onUpgradeClick,
  onNavigate,
  onInstallClick,
  positionContext = 'general'
}: EthioLearnAppPromoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    try {
      safeStorage.removeItem('ethiolearn_promobar_dismissed');
    } catch {}
  }, []);

  const isAmharic = language === 'am';
  const isProUser = Boolean(profile?.isPro || profile?.proStatus === 'active');
  const { isInstallVisible, hasDownloaded, downloadAndInstall } = usePWAInstall();

  // Filter campaigns depending on platform & install status
  const availableCampaigns = CAMPAIGNS.filter((c) => {
    if (c.actionType === 'install') {
      return isInstallVisible && !hasDownloaded;
    }
    if (c.actionType === 'upgrade' && isProUser) {
      return false;
    }
    return true;
  });

  // Auto-rotate every 6.5 seconds unless hovered or paused
  useEffect(() => {
    if (isPaused || isDismissed || availableCampaigns.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % availableCampaigns.length);
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isDismissed, availableCampaigns.length]);

  const safeIndex = availableCampaigns.length > 0 ? currentIndex % availableCampaigns.length : 0;
  const activeCampaign = availableCampaigns[safeIndex] || CAMPAIGNS[0];
  const IconComponent = activeCampaign.icon;

  const handleAction = async (campaign: PromoCampaign) => {
    playClickChime();
    switch (campaign.actionType) {
      case 'install':
        if (onInstallClick) onInstallClick();
        await downloadAndInstall();
        break;
      case 'notes':
        if (onNavigate) onNavigate('notes');
        break;
      case 'exams':
        if (onNavigate) onNavigate('university');
        break;
      case 'bookstore':
        if (onNavigate) onNavigate('bookstore');
        break;
      case 'upgrade':
        if (onUpgradeClick) {
          onUpgradeClick();
        } else if (onNavigate) {
          onNavigate('upgrade');
        }
        break;
      case 'telegram':
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openTelegramLink) {
          window.Telegram.WebApp.openTelegramLink('https://t.me/Et_Learnn');
        } else {
          window.open('https://t.me/Et_Learnn', '_blank', 'noopener,noreferrer');
        }
        break;
    }
  };

  const handleDismiss = () => {
    playClickChime();
    setIsDismissed(true);
    try {
      safeStorage.setItem('ethiolearn_promobar_dismissed', 'true');
    } catch {}
  };

  const handleRestore = () => {
    playClickChime();
    setIsDismissed(false);
    try {
      safeStorage.removeItem('ethiolearn_promobar_dismissed');
    } catch {}
  };

  // If dismissed, render a microscopic unobtrusive pill so the student can reopen it if desired
  if (isDismissed) {
    return (
      <div className="flex justify-end my-1 px-1">
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-medium text-slate-300 hover:text-amber-400 bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          title={isAmharic ? 'የኢትዮለርን ማስታወቂያ አሳይ' : 'Show EthioLearn updates'}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAmharic ? 'ጠቃሚ ማስታወቂያ (አሳይ)' : 'Updates & Announcements'}</span>
        </button>
      </div>
    );
  }

  // ─── HIGH-CRAFT MINI PROMO BAR ───
  return (
    <aside
      id="ethiolearn-mini-promobar"
      aria-label="EthioLearn Highlights"
      className={`my-2 sm:my-3 w-full rounded-xl bg-slate-900/90 border border-amber-500/25 px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-200 shadow-sm backdrop-blur-md transition-all ${className}`}
      data-context={positionContext}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 text-xs">
        
        {/* Left: Tag + Icon + Animated Message */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Micro Tag */}
          <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/25 px-1.5 py-0.5 rounded shrink-0 hidden min-[400px]:inline-block">
            {isAmharic ? activeCampaign.tag.am : activeCampaign.tag.en}
          </span>

          {/* Micro Icon */}
          <div 
            className="w-6 h-6 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0"
            style={{ color: activeCampaign.accentColor }}
          >
            <IconComponent className="w-3.5 h-3.5" />
          </div>

          {/* Animated Message Headline */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCampaign.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-center gap-1.5 truncate text-[11px] sm:text-xs"
              >
                <span className="font-semibold text-white truncate">
                  {isAmharic ? activeCampaign.title.am : activeCampaign.title.en}
                </span>
                <span className="text-amber-400/80 font-mono text-[10px] hidden md:inline shrink-0">
                  ({isAmharic ? activeCampaign.highlight.am : activeCampaign.highlight.en})
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Direct Action CTA + Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Action Button */}
          <button
            type="button"
            onClick={() => handleAction(activeCampaign)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10.5px] sm:text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <span>{isAmharic ? activeCampaign.ctaText.am : activeCampaign.ctaText.en}</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Carousel Stepper (Arrows) */}
          {availableCampaigns.length > 1 && (
            <div className="hidden sm:flex items-center gap-0.5 text-slate-400">
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setCurrentIndex((prev) => (prev === 0 ? availableCampaigns.length - 1 : prev - 1));
                }}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Previous update"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[9px] font-mono text-slate-400 px-0.5">
                {safeIndex + 1}/{availableCampaigns.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setCurrentIndex((prev) => (prev + 1) % availableCampaigns.length);
                }}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Next update"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title={isAmharic ? 'ዝጋ' : 'Dismiss'}
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </aside>
  );
}
