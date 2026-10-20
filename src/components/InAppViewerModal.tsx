/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ExternalLink, Download, RefreshCw, 
  Maximize2, Minimize2, Sun, Moon, Coffee, 
  Smartphone, FileText, Check, Share2, Eye, EyeOff,
  AlertCircle
} from 'lucide-react';
import { playClickChime, playSuccessChime } from '../utils/audio';
import MobilePdfReader from './MobilePdfReader';

export interface InAppViewerModalProps {
  url: string;
  title: string;
  onClose: () => void;
  courseCode?: string;
  downloadUrl?: string;
  language?: 'en' | 'am';
}

export default function InAppViewerModal({
  url,
  title,
  onClose,
  courseCode,
  downloadUrl,
  language = 'en'
}: InAppViewerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAm = language === 'am';

  // State
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [readerTheme, setReaderTheme] = useState<'slate' | 'sepia' | 'light'>('slate');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewerEngine, setViewerEngine] = useState<'mobile-native' | 'drive' | 'gdocs' | 'direct'>('mobile-native');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showEngineMenu, setShowEngineMenu] = useState<boolean>(false);

  // Normalize Drive URLs
  const getEmbedUrl = () => {
    if (!url) return '';
    // Local API stream endpoint
    if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    // Google Drive URL handling
    if (url.includes('drive.google.com/file/d/')) {
      if (viewerEngine === 'gdocs') {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          const directDl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
          return `https://docs.google.com/viewer?url=${encodeURIComponent(directDl)}&embedded=true`;
        }
      }
      let preview = url;
      if (preview.includes('/view')) {
        preview = preview.replace(/\/view(\?.*)?$/, '/preview');
      } else if (!preview.includes('/preview')) {
        preview = preview.endsWith('/') ? `${preview}preview` : `${preview}/preview`;
      }
      return preview;
    }
    // Google Drive Folder embed
    if (url.includes('drive.google.com/drive/folders/')) {
      const folderIdMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderIdMatch) {
        return `https://drive.google.com/embeddedfolderview?id=${folderIdMatch[1]}#grid`;
      }
      return url;
    }
    // Generic external PDF
    if (url.toLowerCase().includes('.pdf')) {
      if (viewerEngine === 'gdocs') {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      }
      return url;
    }
    return url;
  };

  // Google Drive Native App URL
  const getDriveAppUrl = () => {
    if (url.includes('drive.google.com/file/d/')) {
      return url.replace('/preview', '/view?usp=sharing');
    }
    return url;
  };

  // Download URL
  const getResolvedDownloadUrl = () => {
    if (downloadUrl) return downloadUrl;
    if (url.includes('drive.google.com/file/d/')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }
    }
    return url;
  };

  // Resolve native streamable URL for PDF.js engine
  const getNativePdfUrl = () => {
    if (url.startsWith('/api/') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `/api/books/download-pdf?fileId=${encodeURIComponent(fileIdMatch[1])}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return `/api/books/download-pdf?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Fullscreen sync
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard & back-navigation sync
  useEffect(() => {
    // 1. Push state to intercept Android hardware back button / iOS swipe-back
    window.history.pushState({ inAppViewerOpen: true }, '');
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    // 2. Telegram WebApp BackButton integration
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(onClose);
    }

    // 3. Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFocusMode) {
          setIsFocusMode(false);
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        // Toggle focus mode when not typing in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setIsFocusMode((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (tg?.BackButton) {
        tg.BackButton.offClick(onClose);
        tg.BackButton.hide();
      }
    };
  }, [isFocusMode, onClose]);

  const toggleHardwareFullscreen = async () => {
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
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleCopyLink = () => {
    playSuccessChime();
    navigator.clipboard?.writeText(getDriveAppUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReload = () => {
    playClickChime();
    setIframeKey((prev) => prev + 1);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[999999] flex flex-col w-screen h-[100dvh] max-h-[100dvh] p-0 m-0 overflow-hidden font-sans select-none transition-colors duration-200 ${
        readerTheme === 'light'
          ? 'bg-slate-100 text-slate-900'
          : readerTheme === 'sepia'
          ? 'bg-[#FAF3E0] text-[#2D2115]'
          : 'bg-[#0A1128] text-slate-100'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full flex flex-col overflow-hidden relative"
      >
        {/* ========================================================================= */}
        {/* 🌟 1. UNIFIED REDESIGNED TOP BAR (Clean, Single Line, Non-Distracting)    */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {!isFocusMode && viewerEngine !== 'mobile-native' && (
            <motion.header
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`h-14 sm:h-16 px-2.5 sm:px-4 border-b flex items-center justify-between gap-2 shrink-0 z-30 transition-colors ${
                readerTheme === 'light'
                  ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
                  : readerTheme === 'sepia'
                  ? 'bg-[#F4EBD9]/95 border-[#E2D5B8] text-[#362719] shadow-xs'
                  : 'bg-[#0F172A]/95 border-slate-800 text-slate-100 shadow-md'
              } backdrop-blur-md`}
            >
              {/* LEFT: Clean Document Identity */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    {courseCode && (
                      <span className="font-bold text-amber-500 font-mono">
                        {courseCode}
                      </span>
                    )}
                    {courseCode && <span aria-hidden="true">·</span>}
                    <span className="truncate">
                      {isAm ? 'የዩኒቨርሲቲ ሰነድ' : 'University Document'}
                    </span>
                  </div>
                  <h1 className="text-xs sm:text-sm font-bold truncate leading-tight tracking-tight">
                    {title || (isAm ? 'ሰነድ' : 'Document')}
                  </h1>
                </div>
              </div>

              {/* RIGHT: Production Tooling Cluster */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* ⚡ Open in External Reader / Native Viewer */}
                <a
                  href={getDriveAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playSuccessChime()}
                  className="px-2.5 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  title={isAm ? 'ፒዲኤፍ በውጭ ክፈት' : 'Open PDF in External Tab'}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{isAm ? 'ፒዲኤፍ ክፈት' : 'Open PDF'}</span>
                </a>

                {/* 🌙 Reading Filter / Theme Toggle (Slate / Sepia / Light) */}
                <div className={`hidden sm:flex items-center p-0.5 rounded-xl border ${
                  readerTheme === 'light'
                    ? 'bg-slate-100 border-slate-200'
                    : readerTheme === 'sepia'
                    ? 'bg-[#EADECE] border-[#D5C5B0]'
                    : 'bg-slate-800 border-slate-700'
                }`}>
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setReaderTheme('slate'); }}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      readerTheme === 'slate'
                        ? 'bg-[#0A1128] text-amber-400 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Dark Slate Theme"
                  >
                    <Moon className="w-3 h-3" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setReaderTheme('sepia'); }}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      readerTheme === 'sepia'
                        ? 'bg-[#FAF3E0] text-[#362719] shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Warm Sepia Paper Theme"
                  >
                    <Coffee className="w-3 h-3" />
                    <span>Sepia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setReaderTheme('light'); }}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      readerTheme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Crisp Light Theme"
                  >
                    <Sun className="w-3 h-3" />
                    <span>Light</span>
                  </button>
                </div>

                {/* Mobile single theme cycle button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickChime();
                    setReaderTheme((prev) => prev === 'slate' ? 'sepia' : prev === 'sepia' ? 'light' : 'slate');
                  }}
                  className="sm:hidden p-2 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
                  title="Switch Reading Theme"
                >
                  {readerTheme === 'slate' ? (
                    <Moon className="w-4 h-4 text-amber-400" />
                  ) : readerTheme === 'sepia' ? (
                    <Coffee className="w-4 h-4 text-[#7A5A38]" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                </button>

                {/* 🔄 Reload Iframe */}
                <button
                  type="button"
                  onClick={handleReload}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    readerTheme === 'light'
                      ? 'hover:bg-slate-100 border-slate-200 text-slate-600'
                      : readerTheme === 'sepia'
                      ? 'hover:bg-[#EADECE] border-[#D5C5B0] text-[#4A3828]'
                      : 'hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isAm ? 'እንደገና ጫን' : 'Reload Document'}
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* 📥 Direct Download */}
                <a
                  href={getResolvedDownloadUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  onClick={() => playSuccessChime()}
                  className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    readerTheme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : readerTheme === 'sepia'
                      ? 'bg-[#EADECE] hover:bg-[#DDD0C0] border-[#D5C5B0] text-[#3A2A1A]'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white'
                  }`}
                  title={isAm ? 'ሰነዱን አውርድ' : 'Download Document'}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                {/* 🎯 Focus Mode Toggle (Hide Bars for 100% Reading immersion) */}
                <button
                  type="button"
                  onClick={() => { playClickChime(); setIsFocusMode(true); }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    readerTheme === 'light'
                      ? 'hover:bg-slate-100 border-slate-200 text-slate-600'
                      : readerTheme === 'sepia'
                      ? 'hover:bg-[#EADECE] border-[#D5C5B0] text-[#4A3828]'
                      : 'hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isAm ? 'ሙሉ ማያ የንባብ እይታ (Focus Mode)' : 'Focus Mode (Hide Top Bar)'}
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                </button>

                {/* ⛶ Hardware Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={toggleHardwareFullscreen}
                  className={`hidden sm:flex p-2 rounded-xl border transition-all cursor-pointer ${
                    readerTheme === 'light'
                      ? 'hover:bg-slate-100 border-slate-200 text-slate-600'
                      : readerTheme === 'sepia'
                      ? 'hover:bg-[#EADECE] border-[#D5C5B0] text-[#4A3828]'
                      : 'hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-amber-500" />
                  )}
                </button>

                {/* ✕ Close Button */}
                <button
                  type="button"
                  onClick={() => { playClickChime(); onClose(); }}
                  className="p-2 rounded-xl hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title={isAm ? 'ዝጋ' : 'Close'}
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 🌟 2. FOCUS MODE FLOATING CONTROLS (Positioned at TOP-LEFT)               */}
        {/* Leaves Google Drive's native top-right pop-out button COMPLETELY clear!   */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isFocusMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-3 left-3 sm:left-4 z-[1000000] flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-xl px-2.5 py-1.5 rounded-full border border-amber-500/50 shadow-2xl text-white select-none"
            >
              <button
                type="button"
                onClick={() => { playClickChime(); onClose(); }}
                className="p-1 rounded-full bg-white/10 hover:bg-red-500/30 text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
                title={isAm ? 'ዝጋ' : 'Close'}
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="h-3 w-px bg-white/20" />

              <span className="text-[11px] font-bold text-slate-200 max-w-[120px] sm:max-w-[180px] truncate">
                {title}
              </span>

              <div className="h-3 w-px bg-white/20" />

              <button
                type="button"
                onClick={() => { playClickChime(); setIsFocusMode(false); }}
                className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Exit Focus Mode (Show Toolbars)"
              >
                <EyeOff className="w-3 h-3 text-amber-400" />
                <span>{isAm ? 'መሳሪያዎች' : 'Tools'}</span>
              </button>

              <a
                href={getDriveAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSuccessChime()}
                className="p-1 rounded-full hover:bg-white/10 text-amber-400 transition-colors"
                title={isAm ? 'ፒዲኤፍ በውጭ ክፈት' : 'Open PDF in External Tab'}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 🌟 3. FULL-BLEED MOBILE-FRIENDLY PDF READER (100% Edge-to-Edge)           */}
        {/* ========================================================================= */}
        {viewerEngine === 'mobile-native' ? (
          <div className="flex-1 w-full h-full min-h-0 relative flex flex-col">
            <MobilePdfReader
              fileUrl={getNativePdfUrl()}
              title={title}
              courseCode={courseCode}
              theme={readerTheme === 'light' ? 'light' : readerTheme === 'sepia' ? 'sepia' : 'dark'}
              language={language}
              externalUrl={getDriveAppUrl()}
              onClose={onClose}
            />

            {/* Quick Switcher Capsule */}
            <div className="absolute top-16 right-3 z-30 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setViewerEngine('drive');
                }}
                className="pointer-events-auto text-[10px] bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 text-slate-300 hover:text-amber-400 cursor-pointer shadow-md"
                title="Switch to Drive Embedded Mode"
              >
                Drive Embed ↗
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="flex-1 w-full h-full min-h-0 relative overflow-hidden"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y pinch-zoom'
            }}
          >
            {/* Subtle Reading Theme Tone Filter Layer */}
            <div
              className={`w-full h-full relative transition-all duration-300 ${
                readerTheme === 'sepia'
                  ? 'sepia-[0.18] brightness-[0.98]'
                  : ''
              }`}
            >
              <iframe
                key={`pdf-engine-${viewerEngine}-${iframeKey}`}
                src={getEmbedUrl()}
                title={title}
                className="absolute inset-0 w-full h-full border-0 block bg-slate-950"
                allow="autoplay; fullscreen; encrypted-media"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Quick Trouble-Shooting Helper Capsule (Fixed at bottom-center) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
              <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-[10px] text-slate-300 shadow-lg">
                <span>{isAm ? 'ሰነዱ ካልታየ:' : 'Display issue?'}</span>
                <button
                  type="button"
                  onClick={() => {
                    playClickChime();
                    setViewerEngine('mobile-native');
                  }}
                  className="text-amber-400 font-bold hover:underline"
                >
                  Switch to Native PDF Reader
                </button>
                <span aria-hidden="true">·</span>
                <a
                  href={getDriveAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
                >
                  <span>Drive App</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
