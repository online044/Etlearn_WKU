import React, { useState, useEffect } from 'react';
import { WifiOff, Zap, FolderDown, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { OfflineDownloadsModal } from './OfflineDownloadsModal';
import { getOfflineStorageOverview } from '../utils/offlineManager';

interface OfflineIndicatorProps {
  language?: 'en' | 'am';
  onOpenItem?: (type: 'note' | 'exam' | 'book', id: string, title: string) => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  language = 'en',
  onOpenItem
}) => {
  const isOnline = useOnlineStatus();
  const [showModal, setShowModal] = useState(false);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [reconnectedNotice, setReconnectedNotice] = useState(false);

  const isAm = language === 'am';

  // Load offline download count
  useEffect(() => {
    const checkCount = async () => {
      try {
        const stats = await getOfflineStorageOverview();
        setOfflineCount(stats.totalItems);
      } catch {}
    };
    checkCount();

    const handleUpdate = () => checkCount();
    window.addEventListener('ethiolearn:offline-content-changed', handleUpdate);
    return () => window.removeEventListener('ethiolearn:offline-content-changed', handleUpdate);
  }, []);

  // Show reconnected toast briefly when online returns
  useEffect(() => {
    if (isOnline) {
      const wasOffline = sessionStorage.getItem('ethiolearn_was_offline');
      if (wasOffline === 'true') {
        sessionStorage.removeItem('ethiolearn_was_offline');
        setReconnectedNotice(true);
        const timer = setTimeout(() => setReconnectedNotice(false), 4000);
        return () => clearTimeout(timer);
      }
    } else {
      sessionStorage.setItem('ethiolearn_was_offline', 'true');
    }
  }, [isOnline]);

  return (
    <>
      {/* Reconnection badge */}
      {reconnectedNotice && (
        <div 
          id="ethiolearn-pwa-reconnected-pill"
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-auto z-50 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-xl border border-emerald-400/50 animate-bounce-subtle backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              {isAm 
                ? 'ግንኙነት ተመልሷል! የትምህርት ሂደትዎ በደህና ከዳታቤዝ ጋር ተመሳስሏል' 
                : 'Back online! Progress safely synchronized to Supabase.'}
            </span>
          </div>
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div 
          id="ethiolearn-pwa-offline-pill"
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-auto z-50 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold shadow-2xl border border-amber-400/50 animate-bounce-subtle backdrop-blur-md"
        >
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="truncate">
              {isAm 
                ? `ያለ ዳታ ሁነታ (Offline Mode)${offlineCount > 0 ? ` — ${offlineCount} የተቀመጡ ፋይሎች አሉ` : ''}` 
                : `Offline Mode${offlineCount > 0 ? ` — ${offlineCount} saved items available` : ''}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {offlineCount > 0 && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 text-[11px] font-black flex items-center gap-1 transition cursor-pointer"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>{isAm ? 'የተቀመጡ' : 'Saved'}</span>
              </button>
            )}
            <div className="flex items-center gap-1 text-[10px] bg-slate-950/20 px-2 py-0.5 rounded-full font-black">
              <Zap className="w-3 h-3 text-slate-950" />
              <span>PWA</span>
            </div>
          </div>
        </div>
      )}

      {/* Offline Manager Modal */}
      <OfflineDownloadsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        language={language}
        onOpenItem={onOpenItem}
      />
    </>
  );
};
