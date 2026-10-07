import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { 
  X, ExternalLink, RefreshCw, FileText, Globe, Info, 
  Maximize, Minimize, Sun, Moon, Coffee, ShieldCheck, ArrowLeft 
} from 'lucide-react';
import { playClickChime, playSuccessChime } from '../utils/audio';

interface InAppViewerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function InAppViewerModal({ url, title, onClose }: InAppViewerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPdf = url.toLowerCase().includes('.pdf') || url.includes('drive.google.com/file');
  
  // Decide default viewer mode: for local stream endpoints (/api/...) use direct frame, for external public pdf use embed or direct
  const isLocalEndpoint = url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:');
  const [viewerMode, setViewerMode] = useState<'embed' | 'direct'>(isPdf && !isLocalEndpoint ? 'embed' : 'direct');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isTrueFullscreen, setIsTrueFullscreen] = useState<boolean>(false);
  const [readerTheme, setReaderTheme] = useState<'dark' | 'light' | 'sepia'>('dark');

  useEffect(() => {
    const handleFsChange = () => {
      setIsTrueFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    playClickChime();
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setIsTrueFullscreen((prev) => !prev);
    }
  };

  const getTargetUrl = () => {
    if (isLocalEndpoint) {
      return url;
    }
    // If it's already a Google Drive preview or embed link, render directly
    if (url.includes('drive.google.com/file') && url.includes('/preview')) {
      return url;
    }
    if (url.includes('drive.google.com/drive/folders/')) {
      return url;
    }
    if (viewerMode === 'embed' && isPdf && !url.includes('drive.google.com')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  const handleRefresh = () => {
    playClickChime();
    setIframeKey((prev) => prev + 1);
  };

  const toggleMode = () => {
    playClickChime();
    setViewerMode((prev) => (prev === 'embed' ? 'direct' : 'embed'));
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[999999] flex flex-col w-screen h-[100dvh] max-h-[100dvh] p-0 m-0 overflow-hidden select-none font-sans transition-colors duration-300 ${
        readerTheme === 'light'
          ? 'bg-[#F8FAFC] text-slate-900'
          : readerTheme === 'sepia'
          ? 'bg-[#FBF0D9] text-[#2C1810]'
          : 'bg-[#0A1128] text-white'
      }`}
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full flex flex-col overflow-hidden"
      >
        {/* Top Header / Pro Control Bar */}
        <header className={`px-3 sm:px-5 py-2.5 sm:py-3 border-b flex items-center justify-between gap-2 sm:gap-4 shrink-0 transition-colors ${
          readerTheme === 'light'
            ? 'bg-white border-slate-200'
            : readerTheme === 'sepia'
            ? 'bg-[#F4E7CC] border-[#DFCFAB]'
            : 'bg-[#0F172A] border-white/10'
        }`}>
          {/* Left Title and Back Action */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => { playClickChime(); onClose(); }}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                readerTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : readerTheme === 'sepia'
                  ? 'bg-[#EAD8B8] hover:bg-[#DFC7A0] text-[#332211]'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Close and Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            </button>

            <div className="p-1.5 sm:p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0 hidden xs:flex">
              {isPdf ? <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> : <Globe className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>

            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                  {isPdf ? 'Pro Book Reader' : 'In-App Web Viewer'}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-emerald-500 font-bold">
                  • Fullscreen Active
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold truncate mt-0.5 max-w-[190px] sm:max-w-md md:max-w-xl">
                {title}
              </h3>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Theme switcher */}
            <div className={`flex items-center p-0.5 rounded-xl border ${
              readerTheme === 'light'
                ? 'bg-slate-150 border-slate-300'
                : readerTheme === 'sepia'
                ? 'bg-[#E5D2AE] border-[#CFB98C]'
                : 'bg-white/5 border-white/10'
            }`}>
              <button
                onClick={() => { playClickChime(); setReaderTheme('dark'); }}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  readerTheme === 'dark' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Dark Slate Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { playClickChime(); setReaderTheme('sepia'); }}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  readerTheme === 'sepia' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-500 hover:text-amber-800'
                }`}
                title="Sepia Eye Care"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { playClickChime(); setReaderTheme('light'); }}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  readerTheme === 'light' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Light Paper Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Toggle Mode for PDF */}
            {isPdf && !url.includes('drive.google.com') && (
              <button
                onClick={toggleMode}
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  readerTheme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : readerTheme === 'sepia'
                    ? 'bg-[#E8D6B2] hover:bg-[#DCBE94] text-[#332211] border-[#C8B084]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                }`}
                title="Toggle between Google PDF Reader & Direct view"
              >
                <span>{viewerMode === 'embed' ? 'G-Docs Preview' : 'Direct Frame'}</span>
              </button>
            )}

            {/* Reload Frame */}
            <button
              onClick={handleRefresh}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                readerTheme === 'light'
                  ? 'hover:bg-slate-200 text-slate-600'
                  : readerTheme === 'sepia'
                  ? 'hover:bg-[#DFCCAA] text-[#332211]'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
              title="Reload Frame"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* True Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                readerTheme === 'light'
                  ? 'hover:bg-slate-200 text-slate-600'
                  : readerTheme === 'sepia'
                  ? 'hover:bg-[#DFCCAA] text-[#332211]'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
              title={isTrueFullscreen ? 'Exit True Fullscreen' : 'Enter True Fullscreen'}
            >
              {isTrueFullscreen ? <Minimize className="w-4 h-4 text-amber-500" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Direct Open in new window fallback */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSuccessChime()}
              className="p-1.5 sm:p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl transition-colors cursor-pointer"
              title="Open Original Link in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Modal */}
            <button
              onClick={() => { playClickChime(); onClose(); }}
              className="p-1.5 sm:p-2 hover:bg-red-500/15 text-red-400 hover:text-red-300 rounded-xl transition-colors cursor-pointer font-bold"
              title="Close Reader"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Reader Companion Ribbon */}
        <div className={`px-3 sm:px-5 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs shrink-0 ${
          readerTheme === 'light'
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : readerTheme === 'sepia'
            ? 'bg-[#F2E4C4] text-[#4A321A] border-[#D8C49C]'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-1.5 font-medium min-w-0 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">EthioLearn Pro Fullscreen Reader • Certified University Curriculum</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSuccessChime()}
              className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase rounded text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Drive Tab (ቀጥታ ክፈት)</span>
            </a>
          </div>
        </div>

        {/* Main Edge-to-Edge Iframe Stage (No Cut, Full Bleed) */}
        <div className={`flex-1 w-full h-full min-h-0 relative overflow-hidden ${
          readerTheme === 'light' ? 'bg-white' : readerTheme === 'sepia' ? 'bg-[#F8F2E2]' : 'bg-[#0B132B]'
        }`}>
          <iframe
            key={iframeKey}
            src={getTargetUrl()}
            title={`EthioLearn Pro Reader: ${title}`}
            className="w-full h-full border-0 block"
            allow="autoplay; encrypted-media; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          />
        </div>

        {/* Slim Bottom Status Bar */}
        <footer className={`px-4 py-1.5 border-t flex items-center justify-between gap-3 text-[10px] sm:text-[11px] shrink-0 ${
          readerTheme === 'light'
            ? 'bg-slate-100 border-slate-200 text-slate-500'
            : readerTheme === 'sepia'
            ? 'bg-[#EFE2C6] border-[#DDCBB0] text-[#554030]'
            : 'bg-[#080E21] border-white/10 text-slate-400'
        }`}>
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Pinch/Scroll to zoom. Press Fullscreen for distraction-free study.</span>
          </div>
          <div className="font-mono text-[10px] text-amber-500/80 hidden xs:block">
            EthioLearn Pro Reader v3.2
          </div>
        </footer>
      </motion.div>
    </div>,
    document.body
  );
}
