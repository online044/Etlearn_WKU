import React from 'react';
import { WifiOff, Zap } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';

interface OfflineIndicatorProps {
  language?: 'en' | 'am';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language = 'en' }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  const isAm = language === 'am';

  return (
    <div 
      id="ethiolearn-pwa-offline-pill"
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-auto z-50 flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-xl border border-amber-400/50 animate-bounce-subtle backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
        <span>
          {isAm 
            ? 'ያለ ዳታ ሁነታ (Offline Mode) — የተቀመጡ ፋይሎችንና ማስታወሻዎችን ያለ ዳታ መጠቀም ይችላሉ' 
            : 'Offline Mode Active — Access cached study notes & exam archives without data'}
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] bg-slate-950/15 px-2 py-0.5 rounded-full shrink-0">
        <Zap className="w-3 h-3 text-slate-950" />
        <span>PWA</span>
      </div>
    </div>
  );
};
