import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Sparkles, 
  Crown, 
  GraduationCap, 
  Download, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Minimize2, 
  Maximize2,
  BookOpen
} from 'lucide-react';
import { StudentProfile } from '../types';

export interface EthioLearnAppPromoProps {
  profile?: StudentProfile | null;
  className?: string;
  language?: 'en' | 'am';
  onUpgradeClick?: () => void;
  onNavigate?: (page: any) => void;
  onInstallClick?: () => void;
  positionContext?: string;
  // Legacy props from GoogleAdBanner for 100% backward compatibility
  slotId?: string;
  format?: string;
  layoutKey?: string;
}

interface PromoCampaign {
  id: string;
  tabLabel: { en: string; am: string };
  badge: { en: string; am: string };
  badgeColor: string;
  title: { en: string; am: string };
  description: { en: string; am: string };
  ctaText: { en: string; am: string };
  icon: React.ComponentType<{ className?: string }>;
  statValue: string;
  statLabel: { en: string; am: string };
  accentColor: string;
  actionType: 'install' | 'notes' | 'exams' | 'upgrade' | 'telegram' | 'bookstore';
}

const CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'app_download',
    tabLabel: { en: 'Mobile App', am: 'አንድሮይድ አፕ' },
    badge: { en: 'Official Client • 0 MB Offline Data', am: 'ኦፊሴላዊ አፕ • ያለ ኢንተርኔት ይሰራል' },
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    title: { 
      en: 'Install EthioLearn on Your Android Phone', 
      am: 'የኢትዮለርን አፕሊኬሽን በስልክዎ ላይ ይጫኑ' 
    },
    description: { 
      en: 'Access 1,000+ past university exams and lecture notes offline without using mobile internet data. Fast, lightweight, and built for Ethiopian students.', 
      am: 'ከ1,000+ በላይ የዩኒቨርሲቲ ፈተናዎችን እና ኖቶችን ያለ ኢንተርኔት ዳታ በነፃ ይጠቀሙ። ፈጣን እና ለኢትዮጵያ ተማሪዎች የተዘጋጀ።' 
    },
    ctaText: { en: 'Install / Download App', am: 'አፑን በነፃ ጫን' },
    icon: Smartphone,
    statValue: '100% Free',
    statLabel: { en: 'Offline Study Mode', am: 'ያለ ዳታ ይሰራል' },
    accentColor: '#10B981',
    actionType: 'install'
  },
  {
    id: 'study_notes',
    tabLabel: { en: 'Study Notes', am: 'የጥናት ማስታወሻዎች' },
    badge: { en: 'Authentic Faculty Notes • Wolkite & National', am: 'የመምህራን ትክክለኛ ማስታወሻዎች' },
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    title: { 
      en: 'Course Summaries & Lecture Notes Authored by Faculty', 
      am: 'በዩኒቨርሲቲ መምህራን የተዘጋጁ የተሟሉ የኮርስ ማጠቃለያዎች' 
    },
    description: { 
      en: 'Master freshman and departmental courses with structured lecture notes, essential formulas, and chapter summaries published directly by university educators.', 
      am: 'የመጀመሪያ ዓመት እና የዲፓርትመንት ኮርሶችን በአስተማሪዎች በተዘጋጁ ግልጽ ማስታወሻዎች እና የቀመሮች ማጠቃለያዎች በቀላሉ ይረዱ።' 
    },
    ctaText: { en: 'Read Study Notes', am: 'ማስታወሻዎችን አንብብ' },
    icon: BookOpen,
    statValue: 'Verified',
    statLabel: { en: 'Curriculum-Aligned', am: 'ከስርዓተ ትምህርቱ ጋር የተጣጣመ' },
    accentColor: '#F59E0B',
    actionType: 'notes'
  },
  {
    id: 'exam_bank',
    tabLabel: { en: 'Past Exams', am: 'የፈተና ባንክ' },
    badge: { en: 'Wolkite, AAU & National Exam Bank', am: 'የወልቂጤ እና የኢትዮጵያ ዩኒቨርሲቲ ፈተናዎች' },
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    title: { 
      en: 'Practice 1,000+ Real University Midterm & Final Exams', 
      am: 'ከ1,000+ በላይ ትክክለኛ የዩኒቨርሲቲ ፈተናዎችን ይለማመዱ' 
    },
    description: { 
      en: 'Master freshman and departmental examinations with genuine past exam sheets, verified answer keys, detailed explanations, and timed simulation modes.', 
      am: 'የወልቂጤ፣ አዲስ አበባ፣ አዳማ እና ሌሎች ዩኒቨርሲቲዎች ፈተናዎችን ከነሙሉ ትክክለኛ መልሶቻቸው እና ገላጭ ማብራሪያዎቻቸው ጋር ይለማመዱ።' 
    },
    ctaText: { en: 'Browse Exam Bank', am: 'ፈተናዎችን ጀምር' },
    icon: GraduationCap,
    statValue: '1,000+',
    statLabel: { en: 'Authentic Exam Papers', am: 'ትክክለኛ የፈተና ወረቀቶች' },
    accentColor: '#3B82F6',
    actionType: 'exams'
  },
  {
    id: 'pro_upgrade',
    tabLabel: { en: 'EthioLearn Pro', am: 'ኢትዮለርን ፕሮ' },
    badge: { en: 'Telebirr & CBE Birr • Instant Activation', am: 'በቴሌብር እና በንግድ ባንክ • ፈጣን ማረጋገጫ' },
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    title: { 
      en: 'Upgrade to EthioLearn Pro — Only 99 ETB / Month', 
      am: 'በቴሌብር እና በንግድ ባንክ ወደ ፕሮ ያሳድጉ — በወር 99 ብር ብቻ' 
    },
    description: { 
      en: 'Access complete curriculum textbooks, verified exam solution archives, and downloadable lecture notes for offline study. 100% Ethiopian local payment.', 
      am: 'የተሟሉ የዲጂታል መጽሐፍት ምዕራፎች፣ የፈተና መልሶች እና የወረዱ ማስታወሻዎችን ያለ ገደብ ለመጠቀም በቴሌብር ወይም በንግድ ባንክ በቀላሉ ይክፈሉ።' 
    },
    ctaText: { en: 'Get Pro with Telebirr / CBE', am: 'በቴሌብር ፕሮ ይግዙ' },
    icon: Crown,
    statValue: '99 ETB',
    statLabel: { en: 'Affordable Student Pass', am: 'ተመጣጣኝ የተማሪዎች ክፍያ' },
    accentColor: '#EAB308',
    actionType: 'upgrade'
  },
  {
    id: 'bookstore',
    tabLabel: { en: 'Textbooks', am: 'የመማሪያ መጽሐፍት' },
    badge: { en: 'National University Curriculum', am: 'የኢትዮጵያ ዩኒቨርሲቲ ስርዓተ-ትምህርት' },
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    title: { 
      en: 'Official Ethiopian University Modules & Textbooks', 
      am: 'ኦፊሴላዊ የዩኒቨርሲቲ ሞጁሎች እና የመማሪያ መጽሐፍት' 
    },
    description: { 
      en: 'Read full textbooks with offline chapter access, page bookmarks, night reading mode, and downloadable chapter PDFs.', 
      am: 'ሙሉ የትምህርት ሞጁሎችን በዲጂታል ንባብ፣ በምዕራፍ ማውረድ እና ያለ ዳታ በፈለጉት ሰዓት ያንብቡ።' 
    },
    ctaText: { en: 'Browse Bookstore', am: 'መጽሐፍትን ክፈት' },
    icon: BookOpen,
    statValue: 'Official',
    statLabel: { en: 'Digital Library', am: 'ዲጂታል ቤተ-መጽሐፍት' },
    accentColor: '#A855F7',
    actionType: 'bookstore'
  },
  {
    id: 'telegram',
    tabLabel: { en: 'Telegram Hub', am: 'ቴሌግራም ቻናል' },
    badge: { en: 'Official Student Channel • @ethiolearn_wku', am: 'ኦፊሴላዊ የቴሌግራም ቻናል' },
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    title: { 
      en: 'Join 15,000+ Ethiopian University Scholars on Telegram', 
      am: 'ከ15,000+ ተማሪዎች ጋር በቴሌግራም ቻናላችን ይቀላቀሉ' 
    },
    description: { 
      en: 'Receive instant alerts when new university exam keys are released, download high-yield study handout PDFs, and connect with peer study groups.', 
      am: 'አዳዲስ የፈተና መልሶች ሲወጡ ወዲያውኑ ማሳወቂያዎችን ያግኙ፣ የትምህርት ፒዲኤፍ ማስታወሻዎችን ያውርዱ እና ከሌሎች ተማሪዎች ጋር ይገናኙ።' 
    },
    ctaText: { en: 'Join Telegram Channel', am: 'ቴሌግራም ይቀላቀሉ' },
    icon: Send,
    statValue: '15k+',
    statLabel: { en: 'Active University Students', am: 'ንቁ ተማሪዎች' },
    accentColor: '#0EA5E9',
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
  const [isMinimized, setIsMinimized] = useState(false);
  const timerRef = useRef<any>(null);

  const isAmharic = language === 'am';
  const isProUser = Boolean(profile?.isPro || profile?.proStatus === 'active');

  // Auto-rotate every 7.5 seconds unless paused by user interaction
  useEffect(() => {
    if (isPaused || isMinimized) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAMPAIGNS.length);
    }, 7500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isMinimized]);

  const activeCampaign = CAMPAIGNS[currentIndex];
  const IconComponent = activeCampaign.icon;

  const handleAction = (campaign: PromoCampaign) => {
    switch (campaign.actionType) {
      case 'install':
        if (onInstallClick) {
          onInstallClick();
        } else if (onNavigate) {
          onNavigate('profile');
        } else {
          window.location.href = '#pwa-download-section';
        }
        break;
      case 'notes':
        if (onNavigate) {
          onNavigate('notes');
        }
        break;
      case 'exams':
        if (onNavigate) {
          onNavigate('university');
        }
        break;
      case 'bookstore':
        if (onNavigate) {
          onNavigate('bookstore');
        }
        break;
      case 'upgrade':
        if (onUpgradeClick) {
          onUpgradeClick();
        } else if (onNavigate) {
          onNavigate('upgrade');
        }
        break;
      case 'telegram':
        window.open('https://t.me/ethiolearn_wku', '_blank', 'noopener,noreferrer');
        break;
      case 'bookstore':
        if (onNavigate) {
          onNavigate('bookstore');
        }
        break;
    }
  };

  // If user is already on Pro Tier, show an unobtrusive Pro Scholar recognition banner
  if (isProUser) {
    return (
      <div 
        id="ethiolearn-pro-member-banner"
        className={`my-4 w-full rounded-2xl bg-[#0A1128]/90 border border-amber-500/25 p-3 sm:p-4 text-zinc-200 shadow-md backdrop-blur-md ${className}`}
        data-context={positionContext}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {isAmharic ? 'የፕሮ አባል' : 'Pro Scholar Active'}
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  {isAmharic ? 'ማስታወቂያ-አልባ ጥናት' : 'Ad-Free Experience'}
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-0.5">
                {isAmharic 
                  ? 'የኢትዮለርን ያልተገደበ የ AI እና የፈተናዎች አገልግሎት ንቁ ነው' 
                  : 'Unlimited AI Tutor & Full Exam Archives Unlocked'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('tutor')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'አስጎብኚ' : 'AI Tutor'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('university')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ፈተናዎች' : 'Exams'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If collapsed/minimized by student
  if (isMinimized) {
    return (
      <div 
        className={`my-3 w-full rounded-xl bg-[#0A1128]/95 border border-amber-500/30 px-3 py-2 flex items-center justify-between text-zinc-200 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2 text-xs">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-amber-400">EthioLearn:</span>
          <span className="text-zinc-300 text-[11px] truncate max-w-[200px] sm:max-w-md">
            {isAmharic ? activeCampaign.title.am : activeCampaign.title.en}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAction(activeCampaign)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
          >
            <span>{isAmharic ? activeCampaign.ctaText.am : activeCampaign.ctaText.en}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
            title={isAmharic ? "አስፋ" : "Expand"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      id="ethiolearn-app-showcase-banner"
      aria-label="EthioLearn App Feature Showcase"
      className={`my-5 w-full rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#0A1128] via-[#0F172A] to-[#1E293B] shadow-xl text-zinc-100 transition-all ${className}`}
      data-context={positionContext}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Top Header Bar: App Identity & Campaign Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#060B1A]/80 border-b border-white/5 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="font-extrabold uppercase tracking-wider text-amber-400 font-mono text-[10px]">
            {isAmharic ? 'የኢትዮለርን ይፋዊ ማስታወቂያ' : 'Official EthioLearn Showcase'}
          </span>
        </div>

        {/* Quick Campaign Nav Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {CAMPAIGNS.map((camp, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={camp.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isAmharic ? camp.tabLabel.am : camp.tabLabel.en}
              </button>
            );
          })}
        </div>

        {/* Controls: Minimize */}
        <div className="flex items-center gap-1 text-zinc-400">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-white/5 cursor-pointer"
            title={isAmharic ? "አሳንስ" : "Minimize"}
          >
            <Minimize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Feature Slide Stage */}
      <div className="relative p-4 sm:p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCampaign.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
          >
            {/* Left: Icon & Core Value Message */}
            <div className="flex items-start gap-3.5 sm:gap-4 max-w-2xl">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner"
                style={{ color: activeCampaign.accentColor }}
              >
                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>

              <div className="space-y-1.5">
                {/* Badge Tag */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${activeCampaign.badgeColor}`}>
                    {isAmharic ? activeCampaign.badge.am : activeCampaign.badge.en}
                  </span>
                </div>

                {/* Main Headline */}
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug font-sans">
                  {isAmharic ? activeCampaign.title.am : activeCampaign.title.en}
                </h3>

                {/* Subtitle Description */}
                <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed max-w-xl font-normal">
                  {isAmharic ? activeCampaign.description.am : activeCampaign.description.en}
                </p>
              </div>
            </div>

            {/* Right: Social Proof Metric & Primary CTA Button */}
            <div className="w-full lg:w-auto flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5 shrink-0">
              {/* Highlight Stat Pill */}
              <div className="text-left lg:text-right">
                <div className="text-sm font-black text-amber-400 font-mono">
                  {activeCampaign.statValue}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {isAmharic ? activeCampaign.statLabel.am : activeCampaign.statLabel.en}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleAction(activeCampaign)}
                className="px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-md hover:shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>{isAmharic ? activeCampaign.ctaText.am : activeCampaign.ctaText.en}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Footer: Navigation Arrows, Progress Indicator & Ethiopian Student Trust Signal */}
      <div className="px-4 py-2 bg-[#060B1A]/90 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[10px] sm:text-[11px] text-zinc-300">
            {isAmharic 
              ? 'የወልቂጤ እና የኢትዮጵያ ዩኒቨርሲቲዎች ኦፊሴላዊ የጥናት ፕላትፎርም' 
              : 'Wolkite University & Ethiopian Higher Education Verified Platform'}
          </span>
        </div>

        {/* Carousel Slide Indicators & Prev/Next Arrows */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-1">
            {CAMPAIGNS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? CAMPAIGNS.length - 1 : prev - 1))}
            className="p-1 rounded-md hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Previous Feature"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % CAMPAIGNS.length)}
            className="p-1 rounded-md hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Next Feature"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
