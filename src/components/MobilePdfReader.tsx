/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Maximize2, Minimize2, RotateCw, RefreshCw, 
  AlertCircle, Loader2, Bookmark, Check, 
  Smartphone, Share2, Search, ArrowUp, ArrowDown,
  Layers, Sun, Moon, Coffee, Sparkles, Download, Eye
} from 'lucide-react';
import { playClickChime, playSuccessChime } from '../utils/audio';
import { getOfflineBook, saveBookOffline } from '../utils/offlineBooksDB';
import { downloadSupabasePdfBlob } from '../utils/supabaseStorage';

// Set up pdf.js worker URL pointing to local public asset for 100% offline reliability
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
}

export interface MobilePdfReaderProps {
  /** PDF URL or local API proxy URL or blob: URL */
  fileUrl: string;
  /** Book or document title */
  title: string;
  /** Course code e.g. Anth 1012 */
  courseCode?: string;
  /** Total pages estimate or known metadata pages */
  initialTotalPages?: number;
  /** Dark / light / sepia theme */
  theme?: 'dark' | 'light' | 'sepia';
  /** Amharic or English UI */
  language?: 'en' | 'am';
  /** External drive / download fallback URL */
  externalUrl?: string;
  /** Callback when user closes or exits the reader */
  onClose?: () => void;
  /** Offline blob record available */
  isOffline?: boolean;
  /** Optional mode tabs (e.g. PDF / Lectures / Notes) */
  tabs?: {
    id: string;
    label: string;
    count?: number;
    active: boolean;
    onClick: () => void;
  }[];
}

interface PageRenderTask {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  renderTask?: any;
}

export default function MobilePdfReader({
  fileUrl,
  title,
  courseCode,
  initialTotalPages,
  theme = 'dark',
  language = 'en',
  externalUrl,
  onClose,
  isOffline = false,
  tabs
}: MobilePdfReaderProps) {
  const isAm = language === 'am';

  // Container refs
  const rootContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const activeRenderTasks = useRef<Map<number, any>>(new Map());

  // PDF Document & State
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages || 0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>('1');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Zoom & View modes
  // zoomMode: 'fit-width' | 'fit-page' | 'custom'
  const initFitScale = typeof window !== 'undefined' ? Math.max(0.7, (window.innerWidth - 12) / 595.32) : 1.0;
  const [zoomMode, setZoomMode] = useState<'fit-width' | 'fit-page' | 'custom'>('fit-width');
  const [scale, setScale] = useState<number>(initFitScale);
  const [fitWidthScale, setFitWidthScale] = useState<number>(initFitScale);
  const [fitPageScale, setFitPageScale] = useState<number>(initFitScale);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [readerTheme, setReaderTheme] = useState<'dark' | 'light' | 'sepia'>(theme);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

  // Aspect ratio cache per page (width / height)
  const pageAspectRatios = useRef<Map<number, number>>(new Map());
  // Default aspect ratio for standard A4 page: ~ 595.32 / 841.92 = 0.707
  const [defaultAspect, setDefaultAspect] = useState<number>(0.707);

  // Touch & gesture zoom tracking
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1.0);

  // Embedded viewer fallback state
  const [embeddedFallback, setEmbeddedFallback] = useState<boolean>(false);

  const extractedFileId = React.useMemo(() => {
    if (fileUrl) {
      const m1 = fileUrl.match(/[?&]fileId=([a-zA-Z0-9_-]+)/);
      if (m1 && m1[1]) return m1[1];
      const m2 = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m2 && m2[1]) return m2[1];
    }
    if (externalUrl) {
      const m3 = externalUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || externalUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || externalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (m3 && m3[1]) return m3[1];
    }
    return '';
  }, [fileUrl, externalUrl]);

  const drivePreviewUrl = React.useMemo(() => {
    if (extractedFileId) {
      return `https://drive.google.com/file/d/${extractedFileId}/preview`;
    }
    if (externalUrl && externalUrl.includes('drive.google.com')) {
      return externalUrl.replace(/\/view(\?.*)?$/, '/preview');
    }
    return null;
  }, [extractedFileId, externalUrl]);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // 1. Robust Download Action (Works with Blobs, API streams & iframes)
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // 1. Robust Download Action (Works with Blobs, API streams & Google Drive)
  // --------------------------------------------------------------------------
  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    playSuccessChime();
    if (!fileUrl && !extractedFileId && !externalUrl) return;

    const safeFilename = `${(courseCode || title || 'document').replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;

    // A. Blob or data URL: instant local anchor trigger
    if (fileUrl && (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:'))) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Direct Google Drive download URL fallback (bypasses any server proxy or VPN failure)
    const googleDirectDl = extractedFileId 
      ? `https://drive.usercontent.google.com/download?id=${extractedFileId}&export=download`
      : null;

    // Helper to trigger browser anchor download
    const triggerAnchorDownload = (url: string) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    // B. Remote or API URL: stream and trigger download
    setIsDownloading(true);
    try {
      const downloadEndpoint = fileUrl.includes('?') 
        ? `${fileUrl}&download=true` 
        : `${fileUrl}?download=true`;

      let resp: Response | null = null;
      try {
        resp = await fetch(downloadEndpoint);
      } catch {}

      // Fallback to secondary proxy alias if primary had an issue
      if ((!resp || !resp.ok) && fileUrl.includes('/api/books/download-pdf')) {
        const altEndpoint = downloadEndpoint.replace('/api/books/download-pdf', '/api/pdf/proxy');
        try {
          resp = await fetch(altEndpoint);
        } catch {}
      }

      if (resp && resp.ok) {
        const blob = await resp.blob();
        if (blob.size > 200) {
          const objUrl = URL.createObjectURL(blob);
          triggerAnchorDownload(objUrl);
          setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
          return;
        }
      }

      // If local proxy failed, use externalUrl (direct Supabase storage) or direct download
      if (externalUrl) {
        triggerAnchorDownload(externalUrl);
      } else {
        const directUrl = fileUrl.includes('?') ? `${fileUrl}&download=true` : `${fileUrl}?download=true`;
        triggerAnchorDownload(directUrl);
      }
    } catch {
      if (externalUrl) {
        triggerAnchorDownload(externalUrl);
      } else {
        const directUrl = fileUrl.includes('?') ? `${fileUrl}&download=true` : `${fileUrl}?download=true`;
        triggerAnchorDownload(directUrl);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // --------------------------------------------------------------------------
  // 2. Load PDF Document via PDF.js Engine with Instant Preview Fallback
  // --------------------------------------------------------------------------
  const loadDocument = useCallback(async () => {
    if (!fileUrl) {
      if (drivePreviewUrl) {
        setEmbeddedFallback(true);
        setIsLoading(false);
        return;
      }
      setErrorMessage(isAm ? 'የፒዲኤፍ አድራሻ አልተገኘም' : 'No PDF document URL provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingProgress(10);

    // Cancel existing render tasks
    activeRenderTasks.current.forEach(task => {
      try { task.cancel(); } catch {}
    });
    activeRenderTasks.current.clear();

    try {
      let docData: Uint8Array | null = null;
      const offlineKey = courseCode || title || fileUrl;

      // 0. Check offline IndexedDB store first for instant zero-network offline loading
      try {
        const offlineRecord = await getOfflineBook(offlineKey);
        if (offlineRecord?.pdfBlob && offlineRecord.pdfBlob.size > 200) {
          const ab = await offlineRecord.pdfBlob.arrayBuffer();
          docData = new Uint8Array(ab);
          setLoadingProgress(100);
        }
      } catch (offErr) {
        console.warn('[MobilePdfReader] Offline check notice:', offErr);
      }

      // 1. If not in offline cache, fetch from network or Supabase Storage
      if (!docData) {
        const targetDirectUrl = (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))
          ? fileUrl
          : (externalUrl && (externalUrl.startsWith('http://') || externalUrl.startsWith('https://')) && !externalUrl.includes('/api/'))
          ? externalUrl
          : null;

        // A. If direct HTTP/HTTPS URL available, fetch directly (Supabase Storage supports CORS)
        if (targetDirectUrl) {
          try {
            const resp = await fetch(targetDirectUrl, { mode: 'cors' });
            if (resp.ok) {
              const ab = await resp.arrayBuffer();
              if (ab.byteLength > 4) {
                const firstBytes = new Uint8Array(ab.slice(0, 5));
                const magic = String.fromCharCode(...firstBytes);
                if (magic.startsWith('%PDF')) {
                  docData = new Uint8Array(ab);
                  setLoadingProgress(60);
                }
              }
            }
          } catch (e) {
            console.warn('[MobilePdfReader] Direct URL fetch notice, falling back:', e);
          }
        }

        // B. If direct URL didn't return PDF data, attempt direct Supabase Storage SDK download
        if (!docData) {
          try {
            const candidateName = courseCode || title || fileUrl.split('/').pop()?.split('?')[0] || '';
            if (candidateName) {
              const sbBlob = await downloadSupabasePdfBlob(candidateName);
              if (sbBlob && sbBlob.size > 200) {
                const ab = await sbBlob.arrayBuffer();
                if (ab.byteLength > 4) {
                  const firstBytes = new Uint8Array(ab.slice(0, 5));
                  const magic = String.fromCharCode(...firstBytes);
                  if (magic.startsWith('%PDF')) {
                    docData = new Uint8Array(ab);
                    setLoadingProgress(70);
                  }
                }
              }
            }
          } catch (sbErr) {
            console.warn('[MobilePdfReader] Supabase SDK download notice:', sbErr);
          }
        }

        // C. If still not loaded and fileUrl is blob:, data:, or /api/ route:
        if (!docData) {
          if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:') || fileUrl.startsWith('/api/') || fileUrl.startsWith('/books/')) {
            let resp: Response | null = null;
            const isBlobOrData = fileUrl.startsWith('blob:') || fileUrl.startsWith('data:');
            try {
              resp = await fetch(fileUrl, isBlobOrData ? undefined : { credentials: 'same-origin' });
            } catch {
              const fullUrl = fileUrl.startsWith('/') ? `${window.location.origin}${fileUrl}` : fileUrl;
              try {
                resp = await fetch(fullUrl);
              } catch {}
            }

            // Automatic retry with fallback alias if primary failed
            if ((!resp || !resp.ok) && fileUrl.includes('/api/books/download-pdf')) {
              const fallbackUrl = fileUrl.replace('/api/books/download-pdf', '/api/pdf/proxy');
              try {
                const fbResp = await fetch(fallbackUrl);
                if (fbResp.ok) resp = fbResp;
              } catch {}
            }

            if (resp && resp.ok) {
              const ab = await resp.arrayBuffer();
              if (ab.byteLength > 4) {
                const firstBytes = new Uint8Array(ab.slice(0, 5));
                const magic = String.fromCharCode(...firstBytes);
                if (magic.startsWith('%PDF')) {
                  docData = new Uint8Array(ab);
                  setLoadingProgress(60);
                }
              }
            }
          }
        }

        // D. Last network attempt: try externalUrl directly
        if (!docData && externalUrl && externalUrl !== fileUrl && (externalUrl.startsWith('http://') || externalUrl.startsWith('https://'))) {
          try {
            const extResp = await fetch(externalUrl, { mode: 'cors' });
            if (extResp.ok) {
              const ab = await extResp.arrayBuffer();
              if (ab.byteLength > 4) {
                const firstBytes = new Uint8Array(ab.slice(0, 5));
                const magic = String.fromCharCode(...firstBytes);
                if (magic.startsWith('%PDF')) {
                  docData = new Uint8Array(ab);
                  setLoadingProgress(75);
                }
              }
            }
          } catch {}
        }
      }

      if (docData) {
        // Auto-cache to IndexedDB for offline access
        try {
          const blob = new Blob([docData], { type: 'application/pdf' });
          saveBookOffline({
            id: offlineKey,
            title: title || 'Academic Module',
            code: courseCode || '',
            stream: 'University',
            grade: 'University',
            semester: 'Semester I',
            pages: totalPages || 1,
            coverUrl: '',
            description: '',
            amharicDescription: '',
            chapters: [],
            lecturesCount: 0,
            hasVideoLecture: false,
            fileSize: docData.byteLength,
            downloadedAt: Date.now(),
            pdfBlob: blob
          }).catch(() => {});
        } catch {}
      } else {
        // Fallback: check IndexedDB again in case offline record was stored under another key
        try {
          const fallbackOffline = await getOfflineBook(offlineKey);
          if (fallbackOffline?.pdfBlob && fallbackOffline.pdfBlob.size > 200) {
            const ab = await fallbackOffline.pdfBlob.arrayBuffer();
            docData = new Uint8Array(ab);
            setLoadingProgress(100);
          }
        } catch {}
      }

      // 2. Load into PDF.js engine
      const getDocConfig: any = {
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        enableXfa: false
      };

      if (docData) {
        getDocConfig.data = docData;
      } else {
        const streamUrl = (externalUrl && (externalUrl.startsWith('http://') || externalUrl.startsWith('https://')) && !externalUrl.includes('/api/'))
          ? externalUrl
          : fileUrl;
        getDocConfig.url = streamUrl;
        getDocConfig.withCredentials = false;
      }

      const loadingTask = pdfjsLib.getDocument(getDocConfig);

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (progressData.total > 0) {
          const pct = Math.min(95, Math.round((progressData.loaded / progressData.total) * 100));
          setLoadingProgress(pct);
        } else {
          setLoadingProgress(prev => Math.min(90, prev + 15));
        }
      };

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setLoadingProgress(100);

      // Measure page 1 aspect ratio
      try {
        const firstPage = await doc.getPage(1);
        const vp = firstPage.getViewport({ scale: 1.0 });
        if (vp.width && vp.height) {
          const ratio = vp.width / vp.height;
          setDefaultAspect(ratio);
          pageAspectRatios.current.set(1, ratio);
        }
      } catch {}

      setIsLoading(false);
    } catch (err: any) {
      console.warn('[MobilePdfReader] PDF load error, checking drive fallback:', err);
      if (drivePreviewUrl) {
        setEmbeddedFallback(true);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      setErrorMessage(
        err?.message || (isAm ? 'ፒዲኤፉን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።' : 'Failed to load PDF document.')
      );
    }
  }, [fileUrl, drivePreviewUrl, isAm]);

  useEffect(() => {
    loadDocument();
    return () => {
      activeRenderTasks.current.forEach(task => {
        try { task.cancel(); } catch {}
      });
      activeRenderTasks.current.clear();
    };
  }, [loadDocument]);

  // --------------------------------------------------------------------------
  // 2. Compute Responsive Scales (Fit Width & Fit Page)
  // --------------------------------------------------------------------------
  const updateScales = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (containerWidth <= 0 || containerHeight <= 0) return;

    // Standard unscaled page width (usually ~595pt for A4)
    const basePageWidth = 595.32;
    const basePageHeight = basePageWidth / defaultAspect;

    // Full container width for 100% full screen reading without cropping or side margins
    const availableWidth = Math.max(320, containerWidth);
    const newFitWidthScale = availableWidth / basePageWidth;

    // Fit page: full page within viewport height with zero crop
    const availableHeight = Math.max(400, containerHeight);
    const heightScale = availableHeight / basePageHeight;
    const newFitPageScale = Math.min(newFitWidthScale, heightScale);

    setFitWidthScale(newFitWidthScale);
    setFitPageScale(newFitPageScale);

    if (zoomMode === 'fit-width') {
      setScale(newFitWidthScale);
    } else if (zoomMode === 'fit-page') {
      setScale(newFitPageScale);
    }
  }, [defaultAspect, zoomMode]);

  useEffect(() => {
    updateScales();
    const handleResize = () => updateScales();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateScales]);

  // --------------------------------------------------------------------------
  // 3. Render Canvas for a Specific Page
  // --------------------------------------------------------------------------
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    const pageWrapper = pageContainerRefs.current.get(pageNum);
    if (!pageWrapper) return;

    const canvas = pageWrapper.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    // If already rendering this page, cancel previous render
    const existingTask = activeRenderTasks.current.get(pageNum);
    if (existingTask) {
      try { existingTask.cancel(); } catch {}
      activeRenderTasks.current.delete(pageNum);
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const unscaledVp = page.getViewport({ scale: 1.0 });
      const ratio = unscaledVp.width / unscaledVp.height;
      pageAspectRatios.current.set(pageNum, ratio);

      // Mobile Device Pixel Ratio capped at 2 for performance & crispness
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const currentScale = scale || fitWidthScale || 1.0;
      const viewport = page.getViewport({ scale: currentScale * dpr });

      // CSS dimensions in logical pixels
      const cssWidth = Math.round(unscaledVp.width * currentScale);
      const cssHeight = Math.round(unscaledVp.height * currentScale);

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      pageWrapper.style.width = `${cssWidth}px`;
      pageWrapper.style.height = `${cssHeight}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        intent: 'display'
      };

      const renderTask = page.render(renderContext);
      activeRenderTasks.current.set(pageNum, renderTask);

      await renderTask.promise;
      activeRenderTasks.current.delete(pageNum);
      setRenderedPages(prev => new Set([...prev, pageNum]));
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn(`[MobilePdfReader] Render error on page ${pageNum}:`, err);
      }
    }
  }, [pdfDoc, scale, fitWidthScale]);

  // --------------------------------------------------------------------------
  // 4. Virtualized Page Rendering (Observer for visible + buffer pages)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!pdfDoc || totalPages === 0 || !scrollContainerRef.current) return;

    // Buffer range around current page: [currentPage - 2, currentPage + 2]
    const pagesToRender = new Set<number>();
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let p = start; p <= end; p++) {
      pagesToRender.add(p);
    }

    pagesToRender.forEach(p => {
      renderPage(p);
    });
  }, [pdfDoc, currentPage, totalPages, scale, renderPage]);

  // IntersectionObserver to accurately track which page the user is viewing while scrolling
  useEffect(() => {
    if (!scrollContainerRef.current || totalPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }

        if (bestEntry && bestEntry.target) {
          const pageNumAttr = bestEntry.target.getAttribute('data-page-number');
          if (pageNumAttr) {
            const pageNum = parseInt(pageNumAttr, 10);
            if (!isNaN(pageNum) && pageNum !== currentPage) {
              setCurrentPage(pageNum);
              setInputPage(String(pageNum));
            }
          }
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '0px',
        threshold: [0.1, 0.4, 0.7]
      }
    );

    pageContainerRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [totalPages, currentPage]);

  // --------------------------------------------------------------------------
  // 5. Navigation & Zoom Handlers
  // --------------------------------------------------------------------------
  const scrollToPage = useCallback((pageNum: number) => {
    const valid = Math.max(1, Math.min(totalPages || 1, pageNum));
    setCurrentPage(valid);
    setInputPage(String(valid));

    const targetEl = pageContainerRefs.current.get(valid);
    if (targetEl && scrollContainerRef.current) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [totalPages]);

  const handlePrevPage = () => {
    playClickChime();
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    playClickChime();
    if (currentPage < totalPages) {
      scrollToPage(currentPage + 1);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPage.trim(), 10);
    if (!isNaN(p)) {
      scrollToPage(p);
    } else {
      setInputPage(String(currentPage));
    }
  };

  const handleZoomIn = () => {
    playClickChime();
    setZoomMode('custom');
    setScale(prev => Math.min(3.5, Math.round((prev * 1.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    playClickChime();
    setZoomMode('custom');
    setScale(prev => Math.max(0.4, Math.round((prev / 1.25) * 100) / 100));
  };

  const handleFitWidth = () => {
    playClickChime();
    setZoomMode('fit-width');
    setScale(fitWidthScale);
  };

  const handleFitPage = () => {
    playClickChime();
    setZoomMode('fit-page');
    setScale(fitPageScale);
  };

  // Fullscreen hardware toggle
  const toggleFullscreen = () => {
    playClickChime();
    if (!document.fullscreenElement) {
      const el = rootContainerRef.current || document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true));
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Pinch-to-zoom touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      touchStartScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDist.current;
      const newScale = Math.min(3.5, Math.max(0.4, touchStartScale.current * ratio));
      setZoomMode('custom');
      setScale(Math.round(newScale * 100) / 100);
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
  };

  // Double tap to toggle zoom fit-width <-> fit-page
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (zoomMode === 'fit-width') {
        handleFitPage();
      } else {
        handleFitWidth();
      }
    }
    lastTapRef.current = now;
  };

  // Theme styles
  const themeClasses = {
    dark: 'bg-[#0A1128] text-slate-100',
    light: 'bg-[#F8FAFC] text-slate-900',
    sepia: 'bg-[#FAF3E0] text-[#362719]'
  }[readerTheme];

  const toolbarThemeClasses = {
    dark: 'bg-[#0F172A]/95 border-slate-800 text-slate-100 shadow-md',
    light: 'bg-white/95 border-slate-200 text-slate-800 shadow-xs',
    sepia: 'bg-[#F4EBD9]/95 border-[#E2D5B8] text-[#362719] shadow-xs'
  }[readerTheme];

  const pageWrapperThemeClasses = {
    dark: 'bg-[#070D1E]',
    light: 'bg-[#ECEFF3]',
    sepia: 'bg-[#EFE4CD]'
  }[readerTheme];

  // Estimated page dimensions in logical px for placeholder before canvas render
  const currentLogicalWidth = Math.round(595.32 * (scale || fitWidthScale || 1.0));
  if (embeddedFallback && drivePreviewUrl) {
    return (
      <div
        ref={rootContainerRef}
        className={`w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[999999] w-screen h-[100dvh]' : 'relative flex-1 min-h-0'}`}
      >
        <header className="h-14 sm:h-16 px-2.5 sm:px-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 z-30 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => { playClickChime(); setEmbeddedFallback(false); }}
              className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs"
              title={isAm ? 'ወደ ቬክተር አንባቢ ተመለስ' : 'Return to Vector Reader'}
            >
              <ChevronLeft className="w-5 h-5 text-amber-400" />
              <span className="hidden sm:inline font-medium">{isAm ? 'ተመለስ' : 'Vector Reader'}</span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-medium">
                {courseCode && <span className="font-bold text-amber-500 font-mono">{courseCode}</span>}
                {courseCode && <span aria-hidden="true">·</span>}
                <span className="truncate">{isAm ? 'የተከተተ ዕይታ (Drive Preview)' : 'Embedded Drive Preview'}</span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold truncate leading-tight tracking-tight text-slate-100">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Device Download in Embedded Header */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-2.5 py-1 text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              title={isAm ? 'ፒዲኤፍ አውርድ' : 'Download PDF'}
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isDownloading ? (isAm ? 'እየወረደ...' : 'Downloading...') : (isAm ? 'አውርድ' : 'Download')}</span>
            </button>

            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg flex items-center gap-1 border border-slate-700"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drive App</span>
              </a>
            )}
            {onClose && (
              <button
                type="button"
                onClick={() => { playClickChime(); onClose(); }}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title={isAm ? 'ዝጋ' : 'Close'}
              >
                ✕
              </button>
            )}
          </div>
        </header>
        <div className="flex-1 w-full h-full relative bg-slate-950">
          <iframe
            src={drivePreviewUrl}
            title={title}
            className="w-full h-full border-0 block"
            allow="autoplay; fullscreen; encrypted-media"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootContainerRef}
      className={`w-full h-full flex flex-col select-none overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[999999] w-screen h-[100dvh]' : 'relative flex-1 min-h-0'} ${themeClasses}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ===================================================================== */}
      {/* 🌟 1. TOP MOBILE TOOLBAR (Clean, Touch-Friendly, Native-App Layout)    */}
      {/* ===================================================================== */}
      {showControls && (
        <header
          className={`h-14 sm:h-16 px-2.5 sm:px-4 border-b flex items-center justify-between gap-2 shrink-0 z-30 transition-colors backdrop-blur-md ${toolbarThemeClasses}`}
        >
          {/* LEFT: Close / Back + Course Code & Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {onClose && (
              <button
                type="button"
                onClick={() => { playClickChime(); onClose(); }}
                className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={isAm ? 'ዝጋ' : 'Close'}
                aria-label="Close PDF"
              >
                <ChevronLeft className="w-5 h-5 text-amber-400" />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-medium">
                {courseCode && (
                  <span className="font-bold text-amber-500 font-mono">
                    {courseCode}
                  </span>
                )}
                {courseCode && <span aria-hidden="true">·</span>}
                <span className="truncate">
                  {isOffline ? (isAm ? 'ከመስመር ውጭ ዝግጁ' : 'Offline Mode') : (isAm ? 'ሞጁል አንባቢ' : 'Module Reader')}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold truncate leading-tight tracking-tight">
                {title}
              </h1>
            </div>
          </div>

          {/* Optional Mode Switcher Tabs */}
          {tabs && tabs.length > 0 && (
            <div className="hidden lg:flex items-center p-0.5 rounded-xl border border-white/10 bg-black/20 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={tab.onClick}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tab.active
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                      tab.active ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* CENTER / RIGHT: Page Navigation Counter & Quick Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Page Jump Form */}
            {totalPages > 0 && (
              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isAm ? 'ቀዳሚ ገጽ' : 'Previous page'}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center bg-black/30 border border-white/15 px-2 py-0.5 rounded-lg text-xs font-mono">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={inputPage}
                    onChange={(e) => setInputPage(e.target.value)}
                    onBlur={() => setInputPage(String(currentPage))}
                    className="w-8 sm:w-10 text-center bg-transparent text-amber-400 font-bold focus:outline-none"
                    aria-label="Current page"
                  />
                  <span className="text-slate-400 font-normal">/ {totalPages}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isAm ? 'ቀጣይ ገጽ' : 'Next page'}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Quick Zoom Actions */}
            <div className="hidden sm:flex items-center p-0.5 rounded-xl border border-white/10 bg-black/20">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleFitWidth}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  zoomMode === 'fit-width' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Fit to screen width"
              >
                Fit W
              </button>
              <button
                type="button"
                onClick={handleFitPage}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  zoomMode === 'fit-page' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Fit whole page"
              >
                Fit P
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme Toggle (Dark / Sepia / Light) */}
            <button
              type="button"
              onClick={() => {
                playClickChime();
                setReaderTheme(prev => prev === 'dark' ? 'sepia' : prev === 'sepia' ? 'light' : 'dark');
              }}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title={isAm ? 'ገጽታ ቀይር (ጨለማ / ወረቀት / ብሩህ)' : 'Toggle Theme'}
              aria-label="Toggle reader theme"
            >
              {readerTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : readerTheme === 'sepia' ? (
                <Coffee className="w-4 h-4 text-[#8C6239]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* Direct Device Download Action */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={isAm ? 'ፒዲኤፉን ወደ ስልክዎ ያውርዱ (Save PDF)' : 'Download PDF to device'}
              aria-label="Download PDF"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Immersive Reading Mode Toggle (Hide all bars for 100% full screen reading) */}
            <button
              type="button"
              onClick={() => { playClickChime(); setShowControls(false); }}
              className="p-2 rounded-xl hover:bg-white/10 text-amber-400 transition-colors cursor-pointer"
              title={isAm ? 'ሙሉ ማያ የንባብ እይታ (መሳሪያዎችን ደብቅ)' : 'Immersive Fullscreen (Hide Bars)'}
              aria-label="Immersive Fullscreen"
            >
              <Eye className="w-4 h-4 text-amber-400" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-amber-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Floating Restore Controls Button when in Full Immersion Mode */}
      {!showControls && (
        <button
          type="button"
          onClick={() => { playClickChime(); setShowControls(true); }}
          className="fixed top-3 left-3 z-[1000000] px-3.5 py-1.5 bg-black/85 hover:bg-black backdrop-blur-md border border-amber-500/60 text-amber-300 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          title={isAm ? 'መሳሪያዎችን አሳይ' : 'Show Tools'}
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAm ? 'መሳሪያዎች' : 'Show Tools'}</span>
        </button>
      )}

      {/* ===================================================================== */}
      {/* 🌟 2. MAIN SCROLLABLE VIEWPORT AREA (100% Mobile Edge-to-Edge)       */}
      {/* ===================================================================== */}
      <main
        ref={scrollContainerRef}
        onClick={handleDoubleTap}
        className={`flex-1 w-full h-full min-h-0 overflow-y-auto overflow-x-auto relative flex flex-col items-center ${pageWrapperThemeClasses}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm">
            <div className="relative mb-4">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300">
                {loadingProgress}%
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-100 mb-1">
              {isAm ? 'መጽሐፉ እየተዘጋጀ ነው...' : 'Preparing PDF Document...'}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              {isAm 
                ? 'ሙሉውን ሰነድ በከፍተኛ ጥራት በሞባይል ስክሪንዎ ለማስተካከል እየተጫነ ነው'
                : 'Optimizing and rendering high-resolution vector pages for your mobile screen'}
            </p>
            {/* Progress Bar */}
            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                style={{ width: `${Math.max(5, loadingProgress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="my-auto max-w-md p-6 bg-red-950/60 border border-red-500/40 rounded-2xl text-center shadow-2xl m-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-red-200 mb-2">
              {isAm ? 'ሰነዱን መክፈት አልተቻለም' : 'Unable to Display Document'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => loadDocument()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAm ? 'እንደገና ሞክር' : 'Retry'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isDownloading ? (isAm ? 'እየወረደ...' : 'Saving...') : (isAm ? 'ከመስመር ውጭ አስቀምጥ' : 'Save for Offline Reading')}</span>
              </button>
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAm ? 'በውጭ ትር ክፈት' : 'Open Direct PDF'}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Continuous Vertical Pages Flow - 100% Full-Bleed Uncropped */}
        {!errorMessage && totalPages > 0 && (
          <div 
            className="w-full flex flex-col items-center py-1 sm:py-3 px-0 gap-2 sm:gap-4 min-h-full pb-32"
            style={{
              minWidth: '100%'
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const aspect = pageAspectRatios.current.get(pageNum) || defaultAspect;
              const pageW = currentLogicalWidth;
              const pageH = Math.round(pageW / aspect);

              return (
                <div
                  key={`pdf-page-${pageNum}`}
                  data-page-number={pageNum}
                  ref={(el) => {
                    if (el) pageContainerRefs.current.set(pageNum, el);
                    else pageContainerRefs.current.delete(pageNum);
                  }}
                  className="relative group transition-shadow rounded-none sm:rounded-sm overflow-hidden bg-white shrink-0"
                  style={{
                    width: `${pageW}px`,
                    minHeight: `${pageH}px`,
                    // Clean border and subtle page drop shadow
                    boxShadow: readerTheme === 'dark' 
                      ? '0 4px 24px -2px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1)'
                      : '0 4px 20px -2px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.15)'
                  }}
                >
                  {/* Canvas for rendered PDF Page */}
                  <canvas
                    className="block mx-auto"
                    style={{
                      width: `${pageW}px`,
                      height: `${pageH}px`,
                      backgroundColor: '#FFFFFF',
                      // Optional subtle theme tint over paper
                      filter: readerTheme === 'sepia' 
                        ? 'sepia(0.18) brightness(0.98)' 
                        : 'none'
                    }}
                  />

                  {/* Lightweight placeholder skeleton before canvas finishes rendering */}
                  {!renderedPages.has(pageNum) && (
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 gap-2"
                      style={{ width: `${pageW}px`, height: `${pageH}px` }}
                    >
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                      <span className="text-[11px] font-mono font-medium">
                        {isAm ? `ገጽ ${pageNum} በማዘጋጀት ላይ...` : `Rendering Page ${pageNum}...`}
                      </span>
                    </div>
                  )}

                  {/* Page Number Badge (Sticky at bottom-right corner) */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9.5px] font-mono text-slate-300 font-bold opacity-0 group-hover:opacity-100 sm:opacity-70 transition-opacity pointer-events-none select-none">
                    {pageNum} / {totalPages}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* 🌟 3. BOTTOM FLOATING ACTION DOCK (For Mobile Quick-Paging & Zoom)      */}
      {/* ===================================================================== */}
      <footer 
        className="shrink-0 p-2 sm:p-3 flex items-center justify-between gap-2 border-t backdrop-blur-md bg-slate-950/90 border-slate-800 text-slate-300 z-30"
      >
        {/* Left: Quick Jump to First / Previous */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollToPage(1)}
            disabled={currentPage <= 1}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold"
            title="First Page"
          >
            <span className="text-[11px]">« 1</span>
          </button>
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isAm ? 'ቀዳሚ' : 'Prev'}</span>
          </button>
        </div>

        {/* Center: Live Page Tracker Pill */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1 rounded-full text-xs font-mono">
          <span className="text-amber-400 font-bold">{currentPage}</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-300">{totalPages || '...'}</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            ({Math.round((scale || 1) * 100)}%)
          </span>
        </div>

        {/* Right: Next / Last & Quick Zoom In/Out on Mobile */}
        <div className="flex items-center gap-1">
          {/* Mobile Zoom In / Out Buttons */}
          <div className="flex sm:hidden items-center gap-1 mr-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            <span className="hidden xs:inline">{isAm ? 'ቀጣይ' : 'Next'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold"
            title="Last Page"
          >
            <span className="text-[11px]">{totalPages} »</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
