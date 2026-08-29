import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  Download, 
  X, 
  Monitor, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  HelpCircle,
  TrendingUp,
  BookOpen
} from 'lucide-react';

interface PWADownloadAssistantProps {
  isInstallable: boolean;
  triggerPWAInstall: () => Promise<void>;
  isOffline: boolean;
}

export default function PWADownloadAssistant({ 
  isInstallable, 
  triggerPWAInstall,
  isOffline 
}: PWADownloadAssistantProps) {
  const [deviceOS, setDeviceOS] = useState<'ios' | 'android' | 'desktop'>('android');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect OS
    const ua = navigator.userAgent.toLowerCase();
    let detectedOS: 'ios' | 'android' | 'desktop' = 'desktop';
    
    if (/ipad|iphone|ipod/.test(ua)) {
      detectedOS = 'ios';
    } else if (/android/.test(ua)) {
      detectedOS = 'android';
    }
    
    setDeviceOS(detectedOS);
    setActiveTab(detectedOS);

    // Detect if running as standalone app
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!isPWA);
  }, []);

  const handleOpenAssistant = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  // If already running in Standalone mode, we can show a nice premium badge, no need to install!
  if (isStandalone) {
    return (
      <div id="pwa-badge-box" className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest font-mono">Mobile Client Registered</span>
            <h4 className="text-[13px] font-bold text-zinc-100 font-sans leading-tight">Running Standalone Shell</h4>
            <p className="text-[11px] text-emerald-500/80 mt-0.5">Offline-first high fidelity database loaded & secured.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] bg-[#1A7A3C] text-emerald-100 font-bold px-2 py-0.5 rounded-full uppercase font-mono">
            Pro Active
          </span>
        </div>
      </div>
    );
  }

  return (
    <div id="pwa-download-section" className="space-y-4">
      {/* Interactive Main Dashboard/Settings Promo Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#121212] to-[#181818] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:border-[#C8962E]/20">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#C8962E]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-[#C8962E]/10 text-[#C8962E] border border-[#C8962E]/20 rounded-full py-0.5 px-2.5 font-mono font-bold uppercase tracking-wider">
              📥 Standalone Suite
            </span>
            <span className="text-[9px] bg-purple-950/40 text-purple-400 border border-purple-500/20 rounded-full py-0.5 px-2 font-mono font-bold flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> 100% Offline-First
            </span>
          </div>

          <h3 className="font-serif text-[#F0EDE8] text-base font-bold leading-tight flex items-center gap-1.5">
            <Smartphone className="w-5 h-5 text-emerald-500" /> Install EthioLearn on Your Mobile Phone
          </h3>
          <p className="text-[11.5px] text-zinc-400 leading-normal font-sans">
            Convert this web platform into a lightning-fast, lightweight smartphone app. Run full study notes, interactive flashcard decks, and calming soundscapes complete with real-time offline local database persistence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 md:self-center min-w-[210px] justify-end">
          {isInstallable ? (
            <button
              id="btn-pwa-install-native"
              type="button"
              onClick={triggerPWAInstall}
              className="w-full sm:w-auto py-2.5 px-4 bg-gradient-to-r from-[#1A7A3C] to-emerald-600 hover:opacity-95 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-900/10 shrink-0"
            >
              <Download className="w-4 h-4 animate-bounce" /> Install App Directly
            </button>
          ) : null}
          
          <button
            id="btn-pwa-how-to"
            type="button"
            onClick={handleOpenAssistant}
            className={`w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border shrink-0 ${
              isInstallable 
                ? 'bg-[#1e1e1e] hover:bg-[#262626] border-zinc-800 text-zinc-300'
                : 'bg-[#C8962E]/10 hover:bg-[#C8962E]/20 border-[#C8962E]/30 text-[#C8962E] w-full'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> 
            {isInstallable ? 'Installation Help' : 'How to Download on iOS / Android'}
          </button>
        </div>
      </div>

      {/* Detail Step-by-Step Interactive Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-[#141414] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-[#181818]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-zinc-900 text-emerald-400 rounded-lg">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-[#F0EDE8] text-sm font-bold leading-tight">Mobile Setup Guide</h3>
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest font-bold">EthioLearn PWA Download Center</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* OS OS Tabs */}
              <div className="grid grid-cols-3 bg-zinc-950 p-1 border-b border-zinc-900 text-center font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    activeTab === 'ios'
                      ? 'bg-zinc-800 text-[#C8962E]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                   iOS / iPhone
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    activeTab === 'android'
                      ? 'bg-zinc-800 text-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  🤖 Android Suite
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('desktop')}
                  className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    activeTab === 'desktop'
                      ? 'bg-zinc-800 text-purple-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  🖥️ PC / Desktop
                </button>
              </div>

              {/* Modal Body Scroll */}
              <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
                
                {/*  APPLE IOS FLOW */}
                {activeTab === 'ios' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 text-[11px] text-zinc-400 leading-normal flex items-start gap-2.5">
                      <span className="text-lg">📢</span>
                      <span>
                        Apple iOS does not allow automatic direct prompts. You can install it instantly in under **4 seconds** in Safari using the native Share feature! No App Store required.
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-[#C8962E] border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          1
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200">Open Safari browser</p>
                          <p className="text-[11px] text-zinc-400">Ensure you are viewing this app in Safari. Custom web views (like Telegram, Gmail, or Facebook) do not support Home Screen caching.</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-[#C8962E] border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          2
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200 flex items-center gap-1.5">
                            Tap the <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[#C8962E] inline-flex items-center gap-1 text-[10px]"><Share className="w-3 h-3" /> Share</span> Button
                          </p>
                          <p className="text-[11px] text-zinc-400">Locate the Safari toolbar at the bottom of your phone screen (at the top on iPads) and tap the Share icon.</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-[#C8962E] border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          3
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200 flex items-center gap-1.5">
                            Tap <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[#C8962E] inline-flex items-center gap-1 text-[10px]"><PlusSquare className="w-3 h-3" /> Add to Home Screen</span>
                          </p>
                          <p className="text-[11px] text-zinc-400">Scroll down the share menu list options, find and click "Add to Home Screen".</p>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-[#C8962E] border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          4
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200">Confirm Name & Click "Add"</p>
                          <p className="text-[11px] text-zinc-400">Click the "Add" button in the top right corner. The beautiful gold/black **EthioLearn** icon will instantly pin to your home screen.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🤖 ANDROID FLOW */}
                {activeTab === 'android' && (
                  <div className="space-y-4">
                    {isInstallable ? (
                      <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-3">
                        <h4 className="text-[12px] font-bold text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 animate-pulse" /> Native Installer Active
                        </h4>
                        <p className="text-[11px] text-zinc-300 leading-normal">
                          Your Android browser reports full standalone installation readiness. Tap the button below to trigger the direct system package wizard!
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            handleClose();
                            triggerPWAInstall();
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs transition-colors cursor-pointer text-center block"
                        >
                          📲 Trigger Android System Install
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 text-[11px] text-zinc-400 leading-normal flex items-start gap-2.5">
                        <span className="text-lg">ℹ️</span>
                        <span>
                          If the system install popup hasn't triggered automatically, you can always install it manually through Chrome or Edge menus.
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-emerald-400 border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          1
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200">Open Chrome / Edge</p>
                          <p className="text-[11px] text-zinc-400">Make sure you are browsing inside Google Chrome, Samsung Internet, or Microsoft Edge for the best experience.</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-emerald-400 border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          2
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200">Tap Browser Menu (3 Dots)</p>
                          <p className="text-[11px] text-zinc-400">Click the triple dot vertical menu, located in the upper-right or bottom-right corner of your browser toolbar.</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-emerald-400 border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          3
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200">Tap "Install App" or "Add to Home Screen"</p>
                          <p className="text-[11px] text-zinc-400">Click "Install App" (or "Add to Home Screen") from the list options, and confirm the system layout prompt.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🖥️ PC / DESKTOP FLOW */}
                {activeTab === 'desktop' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 text-[11px] text-zinc-400 leading-normal flex items-start gap-2.5">
                      <span className="text-lg">💻</span>
                      <span>
                        Run EthioLearn Pro as a standalone distraction-free windowed companion on your laptop. Integrates seamlessly with multi-tasking shortcuts and system docks!
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-purple-400 border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          1
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200 flex items-center gap-1.5">
                            Look at the URL command bar
                          </p>
                          <p className="text-[11px] text-zinc-400">In Google Chrome, Microsoft Edge, or Brave, look at the far-right side of your top URL bar (where the address is typed).</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-purple-400 border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          2
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200 flex items-center gap-1.5">
                            Click the <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-purple-400 inline-flex items-center gap-0.5 text-[10px]"><Download className="w-3 h-3" /> Install icon</span>
                          </p>
                          <p className="text-[11px] text-zinc-400">Click the overlapping screens icon with a down arrow, or the generic installation menu tab.</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 rounded-full text-purple-400 border border-zinc-800 text-[10.5px] font-black flex items-center justify-center font-mono">
                          3
                        </span>
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-zinc-200">Accept Standard confirmation</p>
                          <p className="text-[11px] text-zinc-400">Confirm by pressing "Install" in the popover dialog. The app will open as a separate app frame and add an launch icon directly to your desktop.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-900 bg-[#161616] text-center text-[10px] text-zinc-500 font-mono">
                EthioLearn Pro Shell • Version 1.2.0 • Offline cache active
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
