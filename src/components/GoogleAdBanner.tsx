import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Crown, Zap, Info, ShieldCheck, ArrowRight } from 'lucide-react';
import { StudentProfile } from '../types';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface GoogleAdBannerProps {
  profile?: StudentProfile | null;
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'fluid';
  layoutKey?: string;
  className?: string;
  language?: 'en' | 'am';
  onUpgradeClick?: () => void;
  positionContext?: string;
}

export const ADSENSE_CLIENT_ID = "ca-pub-7081291575190781";

export default function GoogleAdBanner({
  profile,
  slotId,
  format = 'auto',
  layoutKey,
  className = '',
  language = 'en',
  onUpgradeClick,
  positionContext = 'general'
}: GoogleAdBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // 1. Strict Pro-Tier Rule: If user paid for Pro or is an active Pro scholar, NEVER render any ads!
  const isProUser = Boolean(profile?.isPro || profile?.proStatus === 'active');
  if (isProUser) {
    return null;
  }

  useEffect(() => {
    // Attempt to push to adsbygoogle queue once element mounts
    if (typeof window !== 'undefined' && !isProUser) {
      try {
        // Ensure array exists
        window.adsbygoogle = window.adsbygoogle || [];
        
        // Only push if the current container has not been populated yet
        if (adRef.current && adRef.current.innerHTML.trim() === '') {
          window.adsbygoogle.push({});
          setAdLoaded(true);
        }
      } catch (err) {
        console.log('[AdSense] Free tier ad load note:', err);
        setAdError(true);
      }
    }
  }, [isProUser, slotId]);

  const isAmharic = language === 'am';

  return (
    <div 
      className={`my-5 w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800/90 bg-gradient-to-b from-slate-100/60 to-slate-200/40 dark:from-zinc-900/60 dark:to-zinc-950/80 shadow-sm transition-all text-slate-800 dark:text-zinc-200 ${className}`}
      data-ad-context={positionContext}
    >
      {/* Top Meta Bar: Transparency & Pro Upgrade Prompt */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-200/50 dark:bg-zinc-900/80 border-b border-slate-200/60 dark:border-zinc-800/60 text-[10.5px]">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-medium">
          <Info className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
          <span>{isAmharic ? 'የስፖንሰር ማስታወቂያ (Free Tier)' : 'Sponsored Student Partner (Free Tier)'}</span>
        </div>

        {onUpgradeClick && (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
            title={isAmharic ? "ያለ ማስታወቂያ ለመጠቀም ወደ ፕሮ ያሳድጉ" : "Upgrade to Pro for an ad-free experience"}
          >
            <Crown className="w-3 h-3 text-amber-500" />
            <span>{isAmharic ? 'ማስታወቂያዎችን አስወግድ' : 'Remove Ads with Pro'}</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* AdSense Unit / Responsive Ins Box */}
      <div className="p-2 sm:p-3 flex flex-col items-center justify-center min-h-[90px] overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle block w-full text-center"
          style={{ display: 'block', minHeight: '90px' }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={slotId || "1234567890"}
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        />

        {/* Fallback Educational & Pro Sponsor Card if Ad is pending or blocked */}
        {(!adLoaded || adError) && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/50">
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-500">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                  {isAmharic 
                    ? 'የኢትዮጵያ ዩኒቨርሲቲ ፈተናዎችን እና ኖቶችን ያለማቋረጥ ያግኙ' 
                    : 'Unlock Full Ethiopian University Past Exams & Summaries'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {isAmharic 
                    ? 'በቴሌብር ወይም በንግድ ባንክ ፕሮ በመግዛት ያልተገደበ የ AI ረዳት እና ማስታወቂያ-አልባ ጥናት ይክፈቱ።' 
                    : 'Unlimited AI Tutor questions, offline exam downloads, and zero ad interruptions.'}
                </p>
              </div>
            </div>

            {onUpgradeClick && (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>{isAmharic ? 'ወደ ፕሮ አሳድግ' : 'Get Pro Pass'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trust Micro-badge */}
      <div className="px-3 py-1 bg-slate-100/60 dark:bg-zinc-950/60 flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-mono border-t border-slate-200/40 dark:border-zinc-900/60">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
          <span>Google AdSense Verified &bull; {ADSENSE_CLIENT_ID}</span>
        </div>
        <span>Free Tier</span>
      </div>
    </div>
  );
}
