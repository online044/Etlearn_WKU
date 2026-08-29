import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ExternalLink, RefreshCw, FileText, Globe, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { playClickChime, playSuccessChime } from '../utils/audio';

interface InAppViewerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function InAppViewerModal({ url, title, onClose }: InAppViewerModalProps) {
  const isPdf = url.toLowerCase().includes('.pdf') || url.includes('drive.google.com/file');
  
  // Decide default viewer mode: for PDF use Google Docs GView preview, otherwise use direct url iframe
  const [viewerMode, setViewerMode] = useState<'embed' | 'direct'>(isPdf ? 'embed' : 'direct');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const getTargetUrl = () => {
    if (viewerMode === 'embed' && isPdf) {
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full' : 'w-full max-w-5xl h-[85vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              {isPdf ? <FileText className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div className="text-left min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#078930] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded">
                {isPdf ? 'In-App PDF Viewer' : 'In-App Web View'}
              </span>
              <h3 className="text-sm font-serif font-black text-slate-850 dark:text-white truncate mt-1">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Toggle Mode for PDF */}
            {isPdf && (
              <button
                onClick={toggleMode}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                title="Toggle between Google PDF Reader & Direct view"
              >
                <span>Mode: {viewerMode === 'embed' ? 'G-Docs Preview' : 'Direct Frame'}</span>
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Reload Frame"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => { playClickChime(); setIsFullscreen(!isFullscreen); }}
              className="hidden sm:inline-flex px-3 py-1.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold transition-colors cursor-pointer text-slate-500 dark:text-zinc-400"
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>

            {/* Direct Open fallback */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSuccessChime()}
              className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl text-indigo-650 dark:text-indigo-400 transition-colors cursor-pointer"
              title="Open in new window (Fallback)"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Modal */}
            <button
              onClick={() => { playClickChime(); onClose(); }}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-650 rounded-xl text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer font-bold"
              title="Close View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Study Companion Alert Strip */}
        <div className="bg-amber-500/10 dark:bg-amber-950/15 border-b border-slate-150 dark:border-zinc-900 px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#078930] dark:text-emerald-400 shrink-0" />
            <span>You are reading inside **EthioLearn Pro** safely. If the page/exam doesn't load or is blank, click the button to load it directly.</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSuccessChime()}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase rounded text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-3 h-3 text-white" />
              <span>Open Original Link (ቀጥታ ክፈት)</span>
            </a>
            <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-zinc-400">
              Curriculum Link Certified
            </div>
          </div>
        </div>

        {/* Main iframe stage */}
        <div className="flex-1 bg-slate-900 relative">
          <iframe
            key={iframeKey}
            src={getTargetUrl()}
            title={`EthioLearn In-App Viewer: ${title}`}
            className="w-full h-full border-0 bg-white"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>

        {/* Modal Footer helper */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-[#08090d] border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Use scrollbar or keyboard keys to scroll the textbook. Double-tap/Pinch to zoom on mobile devices.</span>
          </div>
          <div>
            URL: <span className="font-mono text-[10px] break-all">{url.substring(0, 50)}...</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
