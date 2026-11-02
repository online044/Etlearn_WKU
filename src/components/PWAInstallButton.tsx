import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { triggerHaptic } from '../utils/telegram';

interface PWAInstallButtonProps {
  language?: 'en' | 'am';
  variant?: 'compact' | 'banner' | 'header';
}

export const APK_PURE_URL = 'https://apkpure.com/p/com.etlearn.app';

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  language = 'en',
  variant = 'compact'
}) => {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isTMA, 
    isInstallVisible, 
    hasDownloaded, 
    install,
    downloadAndInstall 
  } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Hidden when already installed or inside Telegram Mini App
  if (!isInstallVisible || hasDownloaded || isInstalled || isTMA) {
    return null;
  }

  const isAm = language === 'am';

  const handleInstallClick = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    triggerHaptic('medium');

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        return;
      }
    }

    // Fallback
    await downloadAndInstall();
  };

  if (installSuccess) {
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          id="pwa-install-header-btn"
          onClick={handleInstallClick}
          className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          title={isAm ? 'አፑን በስልክዎ ላይ ይጫኑ' : 'Install EthioLearn App'}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isAm ? 'አፕ ጫን' : 'Install App'}</span>
          <span className="sm:hidden">{isAm ? 'ጫን' : 'Install'}</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          id="pwa-install-compact-btn"
          onClick={handleInstallClick}
          className="w-full sm:w-auto px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isAm ? 'አፑን በነፃ ጫን (PWA)' : 'Install Free App'}</span>
        </button>
      )}

      {variant === 'banner' && (
        <div 
          id="pwa-install-banner-strip"
          className="p-3 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">
                {isAm ? 'የኢትዮለርን አፕሊኬሽን በስልክዎ ላይ ይጫኑ' : 'Install EthioLearn on Android'}
              </h4>
              <p className="text-[11px] text-slate-300">
                {isAm 
                  ? 'ከአሳሽ ይልቅ እንደ ተፈጥሯዊ አፕ በስልክዎ ላይ ያለ ዳታ ኖቶችን እና ፈተናዎችን ይጠቀሙ' 
                  : 'Fast, lightweight standalone app with offline exams, flashcards, and 0-MB access'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer shrink-0 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAm ? 'አሁን ጫን' : 'Install App'}</span>
            </button>
            <a
              href={APK_PURE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer shrink-0 border border-white/5"
              title="Download APK on APKPure"
            >
              <span>APK</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      )}

      {/* 📱 iOS & General Device Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0F172A] border border-white/10 p-5 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {isAm ? 'አፑን በስልክዎ ላይ ለመጫን' : 'Install EthioLearn App'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {isAm ? 'የ Safari ወይም Chrome ማጋሪያ (Share) ምልክትን ይጫኑ' : 'Tap the Share / Menu icon'}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Share2 className="w-3 h-3 text-sky-400" />
                    <span>{isAm ? 'በ Safari የ Share ምልክት ወይም በ Chrome ሶስት ነጥቦችን ይጫኑ' : 'Share button at the bottom of Safari or 3 dots in Chrome'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {isAm ? '"ወደ መነሻ ስክሪን አክል" የሚለውን ይምረጡ' : 'Select "Add to Home Screen"'}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <PlusSquare className="w-3 h-3 text-amber-400" />
                    <span>{isAm ? '"Add to Home Screen" ን ይጫኑ' : 'Tap "Add to Home Screen" from the menu list'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {isAm ? 'አፑ ወዲያውኑ በስልክዎ ላይ ይቀመጣል!' : 'Enjoy Offline Native Experience!'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAm ? 'ከዚያም ያለ ዳታ እና ያለ አሳሽ አፑን በቀላሉ ይጠቀሙ' : 'EthioLearn icon will appear on your phone home screen.'}
                  </p>
                </div>
              </div>
            </div>

            <a
              href={APK_PURE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isAm ? 'የ APKPure መተግበሪያ አውርድ' : 'Download on APKPure'}</span>
            </a>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
            >
              {isAm ? 'ዝጋ' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
