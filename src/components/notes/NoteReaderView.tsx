import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Type,
  List,
  Highlighter,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  WifiOff,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  Note,
  UserNoteState,
  ReaderSettings,
  Highlight,
  TocHeading,
  AdjacentNotes
} from '../../types/notes';
import { notesRepository } from '../../repositories/notesRepository';
import { generateToc, renderMathKaTeX, CalloutType } from '../../utils/markdownUtils';
import { CalloutBlock } from './CalloutBlock';
import { ReadingControlsSheet } from './ReadingControlsSheet';
import { TableOfContentsDrawer } from './TableOfContentsDrawer';
import { ImageZoomModal } from './ImageZoomModal';
import { HighlightsModal } from './HighlightsModal';

interface NoteReaderViewProps {
  noteId: string;
  userId: string;
  onBack: () => void;
  onNavigateToNote: (noteId: string) => void;
  language?: 'en' | 'am';
}

export const NoteReaderView: React.FC<NoteReaderViewProps> = ({
  noteId,
  userId,
  onBack,
  onNavigateToNote,
  language = 'en'
}) => {
  const isAm = language === 'am';

  // Core state
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adjacent navigation (previous/next note)
  const [adjacent, setAdjacent] = useState<AdjacentNotes>({ prev: null, next: null });

  // Reading state & progress
  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // Reader settings
  const [settings, setSettings] = useState<ReaderSettings>({
    user_id: userId,
    font_size: 17,
    line_height: 1.7,
    font_family: 'system',
    theme: 'dark'
  });

  // Highlights
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedRange, setSelectedRange] = useState<{
    text: string;
    start: number;
    end: number;
    x: number;
    y: number;
  } | null>(null);
  const [highlightComment, setHighlightComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Modals & drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isHighlightsModalOpen, setIsHighlightsModalOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ url: string; caption?: string; alt?: string } | null>(null);

  // Text-To-Speech (TTS)
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [ttsVoice, setTtsVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Copy state
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);

  // Scroll container reference
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastSavedProgressRef = useRef<number>(0);
  const hasResumedScrollRef = useRef<boolean>(false);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // 1. Fetch note, state, highlights, settings
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setNote(null);
    hasResumedScrollRef.current = false;

    async function loadData() {
      try {
        const [fetchedNote, fetchedSettings] = await Promise.all([
          notesRepository.fetchNoteById(noteId),
          notesRepository.fetchReaderSettings(userId)
        ]);

        if (!mounted) return;

        if (!fetchedNote) {
          setError(isAm ? 'ይህ ጽሑፍ አልተገኘም ወይም አልታተመም' : 'Note not found or unavailable.');
          setLoading(false);
          return;
        }

        setNote(fetchedNote);
        setSettings(fetchedSettings);

        // Fetch user state (progress, bookmark)
        const userState = await notesRepository.fetchUserNoteStates(userId);
        const thisState = userState[noteId];
        if (thisState && mounted) {
          setProgress(Number(thisState.progress) || 0);
          setBookmarked(!!thisState.bookmarked);
          lastSavedProgressRef.current = Number(thisState.progress) || 0;
        }

        // Fetch highlights
        const hls = await notesRepository.fetchHighlights(userId, noteId);
        if (mounted) setHighlights(hls);

        // Fetch adjacent notes
        const adj = await notesRepository.getAdjacentNotes(fetchedNote.chapter_id, fetchedNote.sort_order);
        if (mounted) setAdjacent(adj);

        setLoading(false);

        // Resume scroll position after DOM renders
        setTimeout(() => {
          if (scrollContainerRef.current && thisState?.scroll_position && !hasResumedScrollRef.current) {
            scrollContainerRef.current.scrollTo({
              top: thisState.scroll_position,
              behavior: 'smooth'
            });
            hasResumedScrollRef.current = true;
          }
        }, 150);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load note');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
      // Stop speech if playing on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [noteId, userId, isAm]);

  // 2. Debounced Progress & Scroll Position Auto-Saver (~2s interval)
  const saveReadingState = useCallback(
    async (currentProgress: number, currentScroll: number) => {
      if (!noteId || !userId) return;
      try {
        await notesRepository.upsertUserNoteState({
          user_id: userId,
          note_id: noteId,
          progress: currentProgress,
          scroll_position: currentScroll,
          bookmarked,
          last_read_at: new Date().toISOString()
        });
        lastSavedProgressRef.current = currentProgress;
      } catch (e) {
        console.warn('Error saving note progress:', e);
      }
    },
    [noteId, userId, bookmarked]
  );

  // RAF throttled scroll listener for buttery smooth 60-120fps scrolling
  const scrollRafRef = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollContainerRef.current;
      if (!el) return;

      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const pct = scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0;
      setProgress((prev) => (Math.abs(prev - pct) >= 0.8 ? pct : prev));
    });
  }, []);

  // Sync state to storage every 2.5 seconds if changed
  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.abs(progress - lastSavedProgressRef.current) > 2) {
        const scrollPos = scrollContainerRef.current?.scrollTop || 0;
        saveReadingState(Math.round(progress), scrollPos);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [progress, saveReadingState]);

  // Save immediately on unmount/exit
  useEffect(() => {
    return () => {
      const scrollPos = scrollContainerRef.current?.scrollTop || 0;
      saveReadingState(Math.round(progress), scrollPos);
    };
  }, [progress, saveReadingState]);

  // 3. Generate Table of Contents from headings
  const tocHeadings: TocHeading[] = useMemo(() => {
    return note ? generateToc(note.content) : [];
  }, [note]);

  // 4. Track active heading using IntersectionObserver
  useEffect(() => {
    if (!tocHeadings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
            break;
          }
        }
      },
      { root: scrollContainerRef.current, rootMargin: '0px 0px -70% 0px', threshold: 0.1 }
    );

    for (const h of tocHeadings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [tocHeadings, loading]);

  // Scroll to section from TOC
  const handleSelectHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 5. Bookmark toggle
  const handleToggleBookmark = async () => {
    const nextState = !bookmarked;
    setBookmarked(nextState);
    await notesRepository.upsertUserNoteState({
      user_id: userId,
      note_id: noteId,
      bookmarked: nextState,
      progress: Math.round(progress),
      scroll_position: scrollContainerRef.current?.scrollTop || 0
    });
  };

  // 6. Reader settings update
  const handleUpdateSettings = async (patch: Partial<ReaderSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await notesRepository.upsertReaderSettings(updated);
  };

  // 7. Text Selection Floating Highlighter Bar
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectedRange(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 2) return;

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedRange({
        text,
        start: range.startOffset,
        end: range.endOffset,
        x: Math.max(16, rect.left + rect.width / 2),
        y: Math.max(70, rect.top - 50)
      });
    } catch {
      setSelectedRange(null);
    }
  };

  const handleApplyHighlight = async (color: Highlight['color']) => {
    if (!selectedRange) return;

    const newHl = await notesRepository.addHighlight({
      user_id: userId,
      note_id: noteId,
      start_offset: selectedRange.start,
      end_offset: selectedRange.end,
      color,
      comment: highlightComment.trim() || null,
      selected_text: selectedRange.text
    });

    setHighlights((prev) => [...prev, newHl]);
    setSelectedRange(null);
    setHighlightComment('');
    setIsAddingComment(false);

    // Clear browser selection
    window.getSelection()?.removeAllRanges();
  };

  const handleDeleteHighlight = async (hlId: string) => {
    await notesRepository.deleteHighlight(userId, noteId, hlId);
    setHighlights((prev) => prev.filter((h) => h.id !== hlId));
  };

  // 8. Text-To-Speech (Web Speech API)
  const handleToggleTts = () => {
    if (!window.speechSynthesis || !note) return;

    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      return;
    }

    // Clean plain text representation for speech
    const cleanText = note.content
      .replace(/:::[\s\S]*?:::/g, '') // remove callouts
      .replace(/\$\$[\s\S]*?\$\$/g, 'Equation') // equations
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links
      .replace(/[#*`_~]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = ttsSpeed;

    utterance.onend = () => setIsTtsPlaying(false);
    utterance.onerror = () => setIsTtsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsTtsPlaying(true);
  };

  const handleTtsSpeedChange = (speed: number) => {
    setTtsSpeed(speed);
    if (isTtsPlaying && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      handleToggleTts();
    }
  };

  // 9. Share Note Action
  const handleShare = async () => {
    const shareData = {
      title: note?.title || 'EthioLearn Note',
      text: `Read "${note?.title}" on EthioLearn Pro - Academic Excellence for Ethiopian Universities.`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      // Fallback copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      } catch {}
    }
  };

  // Copy code block
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // 10. Theme styling classes
  const themeContainerClasses = useMemo(() => {
    switch (settings.theme) {
      case 'light':
        return 'bg-[#FAFAFA] text-slate-900 border-slate-200';
      case 'sepia':
        return 'bg-[#F4ECD8] text-[#433422] border-[#DECFAF]';
      case 'contrast':
        return 'bg-black text-white border-amber-400';
      case 'dark':
      default:
        return 'bg-[#0A1128] text-slate-100 border-slate-800';
    }
  }, [settings.theme]);

  const themeSurfaceClasses = useMemo(() => {
    switch (settings.theme) {
      case 'light':
        return 'bg-white border-slate-200 shadow-sm';
      case 'sepia':
        return 'bg-[#FBF0D9] border-[#DECFAF] shadow-sm';
      case 'contrast':
        return 'bg-black border-2 border-amber-400';
      case 'dark':
      default:
        return 'bg-[#0F172A] border-white/10 shadow-lg';
    }
  }, [settings.theme]);

  const fontFamilyStyle = useMemo(() => {
    switch (settings.font_family) {
      case 'serif':
        return { fontFamily: 'Georgia, "Playfair Display", serif' };
      case 'mono':
        return { fontFamily: '"JetBrains Mono", monospace' };
      case 'dyslexic':
        return { fontFamily: '"Lexend", "Noto Sans Ethiopic", sans-serif', letterSpacing: '0.03em' };
      case 'system':
      default:
        return { fontFamily: '"Inter", "Noto Sans Ethiopic", system-ui, sans-serif' };
    }
  }, [settings.font_family]);

  // 11. Parse & Render Note Content (Headings, KaTeX, Callouts, Images, Tables, Code)
  const renderNoteBlocks = () => {
    if (!note) return null;

    // Split markdown by custom callout tags: :::type ... :::
    const blocks: React.ReactNode[] = [];
    const lines = (note?.content || '').split(/\r?\n/);

    let currentNormalLines: string[] = [];
    let insideCallout = false;
    let calloutType: CalloutType = 'key-point';
    let calloutLines: string[] = [];
    let insideCode = false;
    let codeLanguage = '';
    let codeLines: string[] = [];

    const flushNormalContent = (keyPrefix: string) => {
      if (currentNormalLines.length === 0) return;
      const textChunk = currentNormalLines.join('\n');
      blocks.push(renderNormalMarkdownChunk(textChunk, `${keyPrefix}_${blocks.length}`));
      currentNormalLines = [];
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check code block
      if (trimmed.startsWith('```')) {
        if (!insideCode) {
          flushNormalContent(`chunk_${index}`);
          insideCode = true;
          codeLanguage = trimmed.replace('```', '').trim() || 'code';
          codeLines = [];
          return;
        } else {
          // Finish code block
          insideCode = false;
          const codeSnippet = codeLines.join('\n');
          const codeBlockId = `code_${index}`;
          blocks.push(
            <div
              key={codeBlockId}
              className="my-5 rounded-2xl overflow-hidden border border-white/10 bg-[#090D1A] shadow-md"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-slate-400 font-mono">
                <span className="uppercase font-bold tracking-wider text-[11px] text-amber-400">
                  {codeLanguage}
                </span>
                <button
                  onClick={() => handleCopyCode(codeSnippet, codeBlockId)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  {copiedCodeId === codeBlockId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 leading-relaxed">
                <code>{codeSnippet}</code>
              </pre>
            </div>
          );
          codeLines = [];
          return;
        }
      }

      if (insideCode) {
        codeLines.push(line);
        return;
      }

      // Check callout block start: :::type
      if (trimmed.startsWith(':::') && !insideCallout) {
        flushNormalContent(`chunk_${index}`);
        insideCallout = true;
        const tag = trimmed.replace(':::', '').trim().toLowerCase() as CalloutType;
        calloutType = ['key-point', 'definition', 'example', 'warning', 'formula'].includes(tag)
          ? tag
          : 'key-point';
        calloutLines = [];
        return;
      }

      // Check callout block end: :::
      if (trimmed === ':::' && insideCallout) {
        insideCallout = false;
        blocks.push(
          <CalloutBlock
            key={`callout_${index}`}
            type={calloutType}
            content={calloutLines.join('\n')}
            theme={settings.theme}
            language={language}
          />
        );
        calloutLines = [];
        return;
      }

      if (insideCallout) {
        calloutLines.push(line);
        return;
      }

      currentNormalLines.push(line);
    });

    flushNormalContent(`chunk_end`);
    return blocks;
  };

  // Memoize rendered note blocks so scrolling never re-runs markdown/KaTeX parsing
  const renderedNoteBlocks = useMemo(() => {
    return renderNoteBlocks();
  }, [note?.id, note?.content, settings.theme, settings.font_family, settings.font_size, language, copiedCodeId]);

  /**
   * Render paragraphs, headings, math equations, tables, and images
   */
  const renderNormalMarkdownChunk = (text: string, chunkKey: string) => {
    const rawParagraphs = text.split(/\n{2,}/);

    return (
      <div key={chunkKey} className="space-y-4">
        {rawParagraphs.map((para, pIdx) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // H1 Heading
          const h1Match = trimmed.match(/^#\s+(.+)$/);
          if (h1Match) {
            const hText = h1Match[1];
            const hId = hText
              .toLowerCase()
              .replace(/[^\w\s\u1200-\u137F-]/g, '')
              .replace(/\s+/g, '-');
            return (
              <h1
                id={hId}
                key={`h1_${pIdx}`}
                className="text-2xl sm:text-3xl font-extrabold tracking-tight pt-6 pb-2 border-b border-white/10"
              >
                {hText}
              </h1>
            );
          }

          // H2 Heading
          const h2Match = trimmed.match(/^##\s+(.+)$/);
          if (h2Match) {
            const hText = h2Match[1];
            const hId = hText
              .toLowerCase()
              .replace(/[^\w\s\u1200-\u137F-]/g, '')
              .replace(/\s+/g, '-');
            return (
              <h2
                id={hId}
                key={`h2_${pIdx}`}
                className="text-xl sm:text-2xl font-bold tracking-tight pt-5 pb-1.5 text-amber-400"
              >
                {hText}
              </h2>
            );
          }

          // H3 Heading
          const h3Match = trimmed.match(/^###\s+(.+)$/);
          if (h3Match) {
            const hText = h3Match[1];
            const hId = hText
              .toLowerCase()
              .replace(/[^\w\s\u1200-\u137F-]/g, '')
              .replace(/\s+/g, '-');
            return (
              <h3
                id={hId}
                key={`h3_${pIdx}`}
                className="text-lg sm:text-xl font-semibold tracking-tight pt-4 pb-1"
              >
                {hText}
              </h3>
            );
          }

          // Horizontal rule
          if (trimmed === '---' || trimmed === '***') {
            return <hr key={`hr_${pIdx}`} className="my-6 border-white/10" />;
          }

          // Images: ![alt](url "caption")
          const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (imgMatch) {
            const alt = imgMatch[1];
            const urlParts = imgMatch[2].split(' ');
            const src = urlParts[0].replace(/["']/g, '');
            const caption = urlParts.slice(1).join(' ').replace(/["']/g, '') || alt;

            return (
              <figure key={`img_${pIdx}`} className="my-5 flex flex-col items-center">
                <div
                  onClick={() => setZoomImage({ url: src, caption, alt })}
                  className="rounded-2xl overflow-hidden border border-white/10 cursor-zoom-in hover:opacity-95 transition-all shadow-md group relative max-w-full"
                >
                  <img
                    src={src}
                    alt={alt || 'Visual representation'}
                    loading="lazy"
                    className="w-full h-auto object-cover max-h-[450px]"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-semibold text-white gap-1.5 backdrop-blur-[2px]">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isAm ? 'አጉልተው ይመልከቱ' : 'Tap to Zoom'}</span>
                  </div>
                </div>
                {caption && (
                  <figcaption className="text-xs text-slate-400 mt-2 text-center italic">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          // Markdown Table: | Col 1 | Col 2 |
          if (trimmed.startsWith('|') && trimmed.includes('|')) {
            const rows = trimmed.split('\n').map((r) => r.trim()).filter(Boolean);
            const headers = rows[0]
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim());
            const bodyRows = rows.slice(2); // Skip header and separator

            return (
              <div
                key={`table_${pIdx}`}
                className="my-5 overflow-x-auto rounded-xl border border-white/10 shadow-sm"
              >
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-3 font-bold text-amber-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bodyRows.map((bRow, rIdx) => {
                      const cells = bRow
                        .split('|')
                        .slice(1, -1)
                        .map((c) => c.trim());
                      return (
                        <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                          {cells.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 leading-relaxed whitespace-pre-line">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }

          // Bullet or numbered lists
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
            const listItems = trimmed.split('\n').filter(Boolean);
            const isOrdered = /^\d+\.\s/.test(trimmed);

            return isOrdered ? (
              <ol key={`ol_${pIdx}`} className="list-decimal pl-6 space-y-2 leading-relaxed">
                {listItems.map((item, idx) => (
                  <li key={idx} className="pl-1">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: renderMathKaTeX(item.replace(/^\d+\.\s*/, ''))
                      }}
                    />
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={`ul_${pIdx}`} className="list-disc pl-6 space-y-2 leading-relaxed">
                {listItems.map((item, idx) => (
                  <li key={idx} className="pl-1">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: renderMathKaTeX(item.replace(/^[-*]\s*/, ''))
                      }}
                    />
                  </li>
                ))}
              </ul>
            );
          }

          // Blockquote
          if (trimmed.startsWith('>')) {
            const quoteContent = trimmed.replace(/^>\s*/gm, '');
            return (
              <blockquote
                key={`bq_${pIdx}`}
                className="my-4 border-l-4 border-amber-500 pl-4 py-1 italic opacity-90 text-sm sm:text-base leading-relaxed bg-amber-500/5 rounded-r-lg"
              >
                <div dangerouslySetInnerHTML={{ __html: renderMathKaTeX(quoteContent) }} />
              </blockquote>
            );
          }

          // Standard paragraph with KaTeX equation rendering
          return (
            <p
              key={`p_${pIdx}`}
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMathKaTeX(trimmed) }}
            />
          );
        })}
      </div>
    );
  };

  // 12. Skeleton Loading State
  if (loading) {
    return (
      <div className={`min-h-screen ${themeContainerClasses} p-4 sm:p-6 flex flex-col items-center animate-pulse`}>
        <div className="w-full max-w-3xl flex items-center justify-between pb-6 border-b border-white/10">
          <div className="w-24 h-8 bg-white/10 rounded-xl" />
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-full" />
            <div className="w-8 h-8 bg-white/10 rounded-full" />
          </div>
        </div>
        <div className="w-full max-w-3xl space-y-6 pt-8">
          <div className="w-3/4 h-10 bg-white/10 rounded-xl" />
          <div className="w-1/3 h-5 bg-white/10 rounded-lg" />
          <div className="w-full h-32 bg-white/5 rounded-2xl" />
          <div className="space-y-3">
            <div className="w-full h-4 bg-white/10 rounded" />
            <div className="w-full h-4 bg-white/10 rounded" />
            <div className="w-5/6 h-4 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // 13. Error State
  if (error || (!loading && !note)) {
    return (
      <div className={`min-h-screen ${themeContainerClasses} flex flex-col items-center justify-center p-6 text-center`}>
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4 max-w-md">
          <h3 className="font-bold text-lg mb-1">{isAm ? 'ማስታወሻውን መክፈት አልተቻለም' : 'Unable to Open Note'}</h3>
          <p className="text-sm opacity-90">{error || (isAm ? 'የተጠየቀው ማስታወሻ አልተገኘም።' : 'The requested study note could not be found.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              notesRepository.fetchNoteById(noteId).then((n) => {
                if (n) setNote(n);
                else setError(isAm ? 'ማስታወሻው አልተገኘም' : 'Note not found');
                setLoading(false);
              });
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-colors cursor-pointer"
          >
            {isAm ? 'እንደገና ሞክር' : 'Retry'}
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            {isAm ? 'ወደ ማስታወሻዎች ዝርዝር ተመለስ' : 'Return to Notes Library'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${themeContainerClasses} transition-colors duration-200 select-text`}
      style={fontFamilyStyle}
    >
      {/* ─── STICKY TOP READING BAR ─────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-30 ${themeSurfaceClasses} px-3 sm:px-6 py-2.5 flex flex-col gap-1.5 transition-all`}
      >
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Back button & Note title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              aria-label="Back to Notes Library"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold truncate max-w-[170px] sm:max-w-md">
                {note.title}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {note.read_time_min} {isAm ? 'ደቂቃ' : 'min'}
                </span>
                {!isOnline && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Text-To-Speech Button */}
            <button
              onClick={handleToggleTts}
              className={`p-2 rounded-xl transition-all ${
                isTtsPlaying
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 animate-pulse'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
              title={isTtsPlaying ? 'Pause read-aloud' : 'Read aloud with text-to-speech'}
              aria-label="Text to speech"
            >
              {isTtsPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Table of Contents Trigger */}
            <button
              onClick={() => setIsTocOpen(true)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Table of Contents"
              aria-label="Table of Contents"
            >
              <List className="w-4 h-4" />
            </button>

            {/* Highlights modal trigger */}
            <button
              onClick={() => setIsHighlightsModalOpen(true)}
              className={`p-2 rounded-xl transition-colors relative ${
                highlights.length > 0
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
              title="View Highlights"
              aria-label="View Highlights"
            >
              <Highlighter className="w-4 h-4" />
              {highlights.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                  {highlights.length}
                </span>
              )}
            </button>

            {/* Reading Display Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Appearance Settings (Font & Theme)"
              aria-label="Appearance Settings"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Bookmark toggle */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl transition-colors ${
                bookmarked
                  ? 'text-amber-400 hover:bg-amber-500/15'
                  : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
              title={bookmarked ? 'Remove Bookmark' : 'Bookmark this note'}
              aria-label="Bookmark Note"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Share Note"
              aria-label="Share Note"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reading Progress Indicator Bar */}
        <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </header>

      {/* TTS Audio Player Bar (when active) */}
      {isTtsPlaying && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 animate-bounce text-amber-400" />
            <span className="font-semibold">{isAm ? 'ድምፅ በማሰማት ላይ...' : 'Reading aloud...'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => handleTtsSpeedChange(spd)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  ttsSpeed === spd ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-300'
                }`}
              >
                {spd}x
              </button>
            ))}
            <button
              onClick={handleToggleTts}
              className="ml-2 text-rose-400 hover:text-rose-300 font-bold"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* ─── MAIN LONG-FORM READING CONTAINER ───────────────────────────── */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        className="flex-1 w-full overflow-y-auto px-4 sm:px-8 py-6 md:py-10 flex flex-col items-center"
      >
        <div
          className="w-full max-w-2xl sm:max-w-3xl transition-all"
          style={{
            fontSize: `${settings.font_size}px`,
            lineHeight: settings.line_height
          }}
        >
          {/* Note content rendered cleanly (memoized for maximum performance) */}
          {renderedNoteBlocks}

          {/* ─── CHAPTER PREV / NEXT NAVIGATION PILLS ────────────────────── */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {adjacent.prev ? (
              <button
                onClick={() => onNavigateToNote(adjacent.prev!.id)}
                className="w-full sm:w-auto flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all active:scale-[0.98]"
              >
                <ChevronLeft className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {isAm ? 'ቀዳሚ ማስታወሻ' : 'Previous Section'}
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[200px] block">
                    {adjacent.prev.title}
                  </span>
                </div>
              </button>
            ) : (
              <div />
            )}

            {adjacent.next && (
              <button
                onClick={() => onNavigateToNote(adjacent.next!.id)}
                className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-right transition-all active:scale-[0.98]"
              >
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    {isAm ? 'ቀጣይ ማስታወሻ' : 'Next Section'}
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[200px] block">
                    {adjacent.next.title}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ─── FLOATING HIGHLIGHT BAR (When user selects text) ─────────────── */}
      {selectedRange && (
        <div
          className="fixed z-50 transform -translate-x-1/2 bg-[#090D1A] border border-amber-500/40 rounded-2xl p-2 shadow-2xl flex flex-col gap-2 backdrop-blur-md animate-in fade-in duration-150"
          style={{ top: `${selectedRange.y}px`, left: `${selectedRange.x}px` }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase pl-1">
              {isAm ? 'ቀለም:' : 'Color:'}
            </span>
            {(['yellow', 'green', 'blue', 'pink', 'amber'] as Highlight['color'][]).map((clr) => {
              const bg =
                clr === 'yellow'
                  ? 'bg-amber-400'
                  : clr === 'green'
                  ? 'bg-emerald-400'
                  : clr === 'blue'
                  ? 'bg-blue-400'
                  : clr === 'pink'
                  ? 'bg-pink-400'
                  : 'bg-orange-400';
              return (
                <button
                  key={clr}
                  onClick={() => handleApplyHighlight(clr)}
                  className={`w-6 h-6 rounded-full ${bg} hover:scale-110 active:scale-95 transition-transform shadow-sm`}
                  title={`Highlight in ${clr}`}
                />
              );
            })}
            <button
              onClick={() => setIsAddingComment(!isAddingComment)}
              className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              {isAm ? 'ማስታወሻ' : 'Note'}
            </button>
          </div>

          {isAddingComment && (
            <div className="pt-1">
              <input
                type="text"
                placeholder={isAm ? 'ማስታወሻዎን እዚህ ይጻፉ...' : 'Add study note comment...'}
                value={highlightComment}
                onChange={(e) => setHighlightComment(e.target.value)}
                className="w-48 text-xs bg-slate-900 border border-white/20 rounded-lg px-2 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{isAm ? 'የማስታወሻው ሊንክ ተገልብጧል!' : 'Note link copied to clipboard!'}</span>
        </div>
      )}

      {/* ─── MODALS & DRAWERS ────────────────────────────────────────────── */}
      <ReadingControlsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        language={language}
      />

      <TableOfContentsDrawer
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        headings={tocHeadings}
        activeHeadingId={activeHeadingId}
        onSelectHeading={handleSelectHeading}
        progressPercent={progress}
        language={language}
      />

      <HighlightsModal
        isOpen={isHighlightsModalOpen}
        onClose={() => setIsHighlightsModalOpen(false)}
        highlights={highlights}
        onDeleteHighlight={handleDeleteHighlight}
        language={language}
      />

      {zoomImage && (
        <ImageZoomModal
          isOpen={!!zoomImage}
          onClose={() => setZoomImage(null)}
          imageUrl={zoomImage.url}
          caption={zoomImage.caption}
          altText={zoomImage.alt}
        />
      )}
    </div>
  );
};
