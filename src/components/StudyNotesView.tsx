/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Premium Academic Digital Library & Study Compendium
 * Modern university digital library featuring spacious layout, clean typography,
 * deep navy header, warm academic white reading floor, color-coded faculty icons,
 * real Supabase curriculum synchronization, offline IndexedDB downloads, and personal notes notebook.
 */

import React, { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Bookmark,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
  RefreshCw,
  WifiOff,
  Flame,
  CheckCircle2,
  FolderOpen,
  List as ListIcon,
  Search,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  GraduationCap,
  Image as ImageIcon,
  ZoomIn,
  X,
  ArrowRight,
  Save,
  Edit3,
  SlidersHorizontal,
  Compass,
  FileText,
  Check,
  Share2,
  Library,
  Layers,
  HardDrive,
  ArrowUpRight,
  BookMarked,
  Dna,
  Atom,
  Brain,
  Cpu,
  Calculator,
  TrendingUp,
  Users,
  Languages,
  MapPin,
  Scale,
  HeartHandshake
} from 'lucide-react';
import { CustomNote, NoteRecord } from '../types';
import {
  Subject,
  Chapter,
  NoteListItem,
  UserNoteState,
  SearchResult
} from '../types/notes';
import {
  notesRepository,
  canonicalSubjectId,
  BIO_SUBJECT_ID,
  ANTHRO_SUBJECT_ID,
  CHEM_SUBJECT_ID,
  PHYS_SUBJECT_ID,
  SAMPLE_SUBJECT_ID,
  TECH_SUBJECT_ID,
  MATH_SUBJECT_ID,
  ECON_SUBJECT_ID,
  ENGLISH_SUBJECT_ID
} from '../repositories/notesRepository';
import {
  isNoteDownloaded,
  saveNoteOffline,
  deleteDownloadedNote,
  getOfflineStorageOverview,
  formatStorageBytes,
  OfflineNoteItem
} from '../utils/offlineManager';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { User } from 'firebase/auth';
import { exportNoteToGoogleDoc, exportNotesToGoogleSheets } from '../utils/workspace';
import { jsPDF } from 'jspdf';
import { safeStorage } from '../utils/safeStorage';
import DOMPurify from 'dompurify';
import { NoteReaderView } from './notes/NoteReaderView';

interface StudyNotesViewProps {
  apiKey?: string;
  customNotes?: CustomNote[];
  onSaveCustomNotes?: (notes: CustomNote[]) => void;
  enrolledSubjects?: string[];
  googleUser?: User | null;
  googleToken?: string | null;
  onGoogleSignIn?: () => Promise<void>;
  onGoogleSignOut?: () => Promise<void>;
  decksState?: any;
  onSaveDecksState?: any;
  onOpenInAppViewer?: (url: string, title: string) => void;
  language?: 'en' | 'am';
  userId?: string;
}

type LibraryTab = 'explore' | 'my-library' | 'bookmarks' | 'offline';

export default function StudyNotesView({
  customNotes = [],
  onSaveCustomNotes = () => {},
  enrolledSubjects = [],
  googleUser,
  googleToken,
  onGoogleSignIn = async () => {},
  onGoogleSignOut = async () => {},
  onOpenInAppViewer,
  language = 'en',
  userId = 'student_wku'
}: StudyNotesViewProps) {
  const isAm = language === 'am';

  // Active Reader state (opens high-res document viewer)
  const [readerNoteId, setReaderNoteId] = useState<string | null>(null);

  // Digital Library Primary Tab: Explore | My Library | Bookmarks | Offline
  const [activeTab, setActiveTab] = useState<LibraryTab>('explore');

  // Supabase Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [userStates, setUserStates] = useState<Record<string, UserNoteState>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Advanced Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all'); // all, pdf, compendium
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, unread, in-progress, completed
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'readTime'>('recent');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Offline Download tracking (IndexedDB)
  const [downloadedNoteIds, setDownloadedNoteIds] = useState<Set<string>>(new Set());
  const [offlineOverview, setOfflineOverview] = useState<{
    notes: OfflineNoteItem[];
    totalBytes: number;
    formattedSize: string;
  }>({ notes: [], totalBytes: 0, formattedSize: '0 B' });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Google Workspace Sync
  const [isSyncingDoc, setIsSyncingDoc] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncDocUrl, setSyncDocUrl] = useState<string | null>(null);

  // Personal Note Composer Drawer / Modal
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerContent, setComposerContent] = useState('');
  const [composerSubject, setComposerSubject] = useState(enrolledSubjects[0] || 'General Biology');
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [composerToast, setComposerToast] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. DATA INITIALIZATION & SYNC
  // ───────────────────────────────────────────────────────────────────────────

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSubjects, fetchedChapters, fetchedNotes, fetchedStates] = await Promise.all([
        notesRepository.fetchSubjects(),
        notesRepository.fetchChapters(),
        notesRepository.fetchNotesList(),
        notesRepository.fetchUserNoteStates(userId)
      ]);

      setSubjects(fetchedSubjects);
      setChapters(fetchedChapters);
      setNotes(fetchedNotes);
      setUserStates(fetchedStates);

      // Check IndexedDB downloaded items
      refreshOfflineOverview();
    } catch (e) {
      console.warn('[EthioLearn Digital Library] Init Error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOfflineOverview = async () => {
    try {
      const overview = await getOfflineStorageOverview();
      const downloadedSet = new Set<string>();
      (overview.notes || []).forEach(n => downloadedSet.add(n.id));
      setDownloadedNoteIds(downloadedSet);
      setOfflineOverview({
        notes: overview.notes || [],
        totalBytes: overview.totalBytes || 0,
        formattedSize: formatStorageBytes(overview.totalBytes || 0)
      });
    } catch (err) {
      console.warn('[Offline Overview Error]:', err);
    }
  };

  useEffect(() => {
    loadAllData();

    const handleLibraryUpdated = () => {
      Promise.all([
        notesRepository.fetchSubjects(),
        notesRepository.fetchChapters(),
        notesRepository.fetchNotesList()
      ]).then(([s, c, n]) => {
        setSubjects(s);
        setChapters(c);
        setNotes(n);
      }).catch(() => {});
      refreshOfflineOverview();
    };

    window.addEventListener('ethiolearn:notes-library-updated', handleLibraryUpdated);
    window.addEventListener('ethiolearn:offline-content-changed', refreshOfflineOverview);

    return () => {
      window.removeEventListener('ethiolearn:notes-library-updated', handleLibraryUpdated);
      window.removeEventListener('ethiolearn:offline-content-changed', refreshOfflineOverview);
    };
  }, [userId]);

  // Handle Ultra-Fast Debounced Search using instant local lookup + search_notes RPC
  useEffect(() => {
    const trimmed = deferredSearch.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await notesRepository.searchNotes(trimmed);
        setSearchResults(results);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [deferredSearch]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. STRICT SUBJECT ISOLATION & ACCURATE MATCHING (BIOLOGY != ANTHROPOLOGY)
  // ───────────────────────────────────────────────────────────────────────────

  const chapterMap = useMemo(() => {
    const map = new Map<string, Chapter>();
    for (const c of chapters) map.set(c.id, c);
    return map;
  }, [chapters]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    for (const s of subjects) {
      map.set(s.id, s);
      map.set(canonicalSubjectId(s.id), s);
    }
    return map;
  }, [subjects]);

  /**
   * Strictly isolates note subjects:
   * 1. Direct foreign key validation
   * 2. Canonical mapping
   * 3. Explicit heuristic precedence ensuring Anthropology NEVER leaks into Biology
   */
  const resolveNoteSubject = useMemo(() => {
    return (note: NoteListItem): Subject | undefined => {
      const noteObj = note as any;
      const directKey = note.subject_id || noteObj.subject || noteObj.course;
      const ch = chapterMap.get(note.chapter_id);

      // Check text tokens for explicit Anthropology terms first
      const noteTitle = (note.title || '').toLowerCase();
      const chTitle = (ch?.title || '').toLowerCase();
      const combinedText = `${noteTitle} ${chTitle}`;

      const isExplicitAnthro =
        combinedText.includes('anthro') ||
        combinedText.includes('ethnograph') ||
        combinedText.includes('kinship') ||
        combinedText.includes('marriage rules') ||
        combinedText.includes('customary system') ||
        combinedText.includes('hominid') ||
        combinedText.includes('lucy') ||
        combinedText.includes('dinkinesh') ||
        combinedText.includes('paleoanthro');

      if (isExplicitAnthro) {
        const anthroSub = subjects.find(s => canonicalSubjectId(s.id) === ANTHRO_SUBJECT_ID);
        if (anthroSub) return anthroSub;
      }

      // Direct database foreign key on the note itself
      if (directKey) {
        const canonicalKey = canonicalSubjectId(directKey);
        // Guard: if directKey mapped to Biology but text is clearly Anthropology, override to Anthropology
        if (canonicalKey === BIO_SUBJECT_ID && isExplicitAnthro) {
          const anthroSub = subjects.find(s => canonicalSubjectId(s.id) === ANTHRO_SUBJECT_ID);
          if (anthroSub) return anthroSub;
        }
        const sub = subjectMap.get(directKey) || subjectMap.get(canonicalKey);
        if (sub) return sub;
      }

      // Direct database foreign key on the chapter
      if (ch?.subject_id) {
        const canonicalKey = canonicalSubjectId(ch.subject_id);
        if (canonicalKey === BIO_SUBJECT_ID && isExplicitAnthro) {
          const anthroSub = subjects.find(s => canonicalSubjectId(s.id) === ANTHRO_SUBJECT_ID);
          if (anthroSub) return anthroSub;
        }
        const sub = subjectMap.get(ch.subject_id) || subjectMap.get(canonicalKey);
        if (sub) return sub;
      }

      // Biology: Must explicitly contain biology concepts and NOT contain anthropology
      if (
        (combinedText.includes('biol') ||
          combinedText.includes('cellular basis of life') ||
          combinedText.includes('cellular respiration') ||
          combinedText.includes('photosynthesis') ||
          combinedText.includes('biomolecule') ||
          combinedText.includes('mitosis') ||
          combinedText.includes('genetics') ||
          combinedText.includes('dna replication')) &&
        !isExplicitAnthro
      ) {
        const bioSub = subjects.find(s => canonicalSubjectId(s.id) === BIO_SUBJECT_ID);
        if (bioSub) return bioSub;
      }

      // Chemistry
      if (
        combinedText.includes('chem') ||
        combinedText.includes('atomic structure') ||
        combinedText.includes('chemical bonding') ||
        combinedText.includes('periodic table') ||
        combinedText.includes('stoichiometry')
      ) {
        const chemSub = subjects.find(s => canonicalSubjectId(s.id) === CHEM_SUBJECT_ID);
        if (chemSub) return chemSub;
      }

      // Physics
      if (
        combinedText.includes('phys') ||
        combinedText.includes('kinematic') ||
        combinedText.includes("newton's") ||
        combinedText.includes('vector') ||
        combinedText.includes('dynamics')
      ) {
        const physSub = subjects.find(s => canonicalSubjectId(s.id) === PHYS_SUBJECT_ID);
        if (physSub) return physSub;
      }

      // Logic & Critical Thinking
      if (
        combinedText.includes('critical thinking') ||
        combinedText.includes('syllogism') ||
        combinedText.includes('fallac') ||
        combinedText.includes('logic and argument') ||
        combinedText.includes('propositional logic')
      ) {
        const logicSub = subjects.find(s => canonicalSubjectId(s.id) === SAMPLE_SUBJECT_ID);
        if (logicSub) return logicSub;
      }

      // Emerging Technologies
      if (
        combinedText.includes('industry 4.0') ||
        combinedText.includes('artificial intelligence') ||
        combinedText.includes('iot') ||
        combinedText.includes('emerging tech')
      ) {
        const techSub = subjects.find(s => canonicalSubjectId(s.id) === TECH_SUBJECT_ID);
        if (techSub) return techSub;
      }

      // Economics
      if (
        combinedText.includes('economics') ||
        combinedText.includes('microeconomics') ||
        combinedText.includes('macroeconomics') ||
        combinedText.includes('market dynamics')
      ) {
        const econSub = subjects.find(s => canonicalSubjectId(s.id) === ECON_SUBJECT_ID);
        if (econSub) return econSub;
      }

      // Mathematics
      if (
        combinedText.includes('math') ||
        combinedText.includes('precalculus') ||
        combinedText.includes('matrix') ||
        combinedText.includes('calculus')
      ) {
        const mathSub = subjects.find(s => canonicalSubjectId(s.id) === MATH_SUBJECT_ID);
        if (mathSub) return mathSub;
      }

      // English
      if (
        combinedText.includes('english') ||
        combinedText.includes('reading comprehension') ||
        combinedText.includes('discourse markers')
      ) {
        const engSub = subjects.find(s => canonicalSubjectId(s.id) === ENGLISH_SUBJECT_ID);
        if (engSub) return engSub;
      }

      return undefined;
    };
  }, [chapterMap, subjectMap, subjects]);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. COLOR-CODED FACULTY ICONS & STYLING
  // ───────────────────────────────────────────────────────────────────────────

  const getSubjectIcon = (subId?: string) => {
    const canon = canonicalSubjectId(subId);
    switch (canon) {
      case BIO_SUBJECT_ID:
        return <Dna className="w-5 h-5 text-emerald-400" />;
      case CHEM_SUBJECT_ID:
        return <Atom className="w-5 h-5 text-sky-400" />;
      case PHYS_SUBJECT_ID:
        return <Compass className="w-5 h-5 text-blue-400" />;
      case SAMPLE_SUBJECT_ID:
        return <Brain className="w-5 h-5 text-amber-400" />;
      case TECH_SUBJECT_ID:
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case MATH_SUBJECT_ID:
        return <Calculator className="w-5 h-5 text-rose-400" />;
      case ECON_SUBJECT_ID:
        return <TrendingUp className="w-5 h-5 text-amber-300" />;
      case ANTHRO_SUBJECT_ID:
        return <Users className="w-5 h-5 text-orange-400" />;
      case ENGLISH_SUBJECT_ID:
        return <Languages className="w-5 h-5 text-teal-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getSubjectBadgeStyle = (subId?: string) => {
    const canon = canonicalSubjectId(subId);
    switch (canon) {
      case BIO_SUBJECT_ID:
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30';
      case CHEM_SUBJECT_ID:
        return 'bg-sky-950/50 text-sky-300 border-sky-500/30';
      case PHYS_SUBJECT_ID:
        return 'bg-blue-950/50 text-blue-300 border-blue-500/30';
      case SAMPLE_SUBJECT_ID:
        return 'bg-amber-950/50 text-amber-300 border-amber-500/30';
      case TECH_SUBJECT_ID:
        return 'bg-purple-950/50 text-purple-300 border-purple-500/30';
      case MATH_SUBJECT_ID:
        return 'bg-rose-950/50 text-rose-300 border-rose-500/30';
      case ECON_SUBJECT_ID:
        return 'bg-yellow-950/50 text-yellow-300 border-yellow-500/30';
      case ANTHRO_SUBJECT_ID:
        return 'bg-orange-950/50 text-orange-300 border-orange-500/30';
      case ENGLISH_SUBJECT_ID:
        return 'bg-teal-950/50 text-teal-300 border-teal-500/30';
      default:
        return 'bg-indigo-950/50 text-indigo-300 border-indigo-500/30';
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4. CONTINUE LEARNING (IN-PROGRESS SHELF)
  // ───────────────────────────────────────────────────────────────────────────

  const continueReadingNotes = useMemo(() => {
    const inProgress = notes
      .map(n => {
        const state = userStates[n.id];
        return {
          note: n,
          state,
          progress: state?.progress || 0,
          lastReadTime: state?.last_read_at ? new Date(state.last_read_at).getTime() : 0
        };
      })
      .filter(item => item.progress > 0 && item.progress < 95)
      .sort((a, b) => b.lastReadTime - a.lastReadTime);

    return inProgress.slice(0, 4);
  }, [notes, userStates]);

  // ───────────────────────────────────────────────────────────────────────────
  // 5. FILTERED & SORTED LATEST PUBLICATIONS
  // ───────────────────────────────────────────────────────────────────────────

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const resolvedSub = resolveNoteSubject(n);
      const state = userStates[n.id];
      const isDownloaded = downloadedNoteIds.has(n.id);
      const isBookmarked = !!state?.bookmarked;
      const progress = state?.progress || 0;

      // 1. Tab filter
      if (activeTab === 'bookmarks' && !isBookmarked) return false;
      if (activeTab === 'offline' && !isDownloaded) return false;
      if (activeTab === 'my-library') {
        // My library displays in-progress or completed or bookmarked
        if (progress === 0 && !isBookmarked && !isDownloaded) return false;
      }

      // 2. Strict Subject Filter
      if (selectedSubjectId) {
        const targetCanonical = canonicalSubjectId(selectedSubjectId);
        const noteCanonical = resolvedSub ? canonicalSubjectId(resolvedSub.id) : '';
        if (resolvedSub?.id !== selectedSubjectId && noteCanonical !== targetCanonical) {
          return false;
        }
      }

      // 3. Status Filter
      if (selectedStatus === 'unread' && progress > 0) return false;
      if (selectedStatus === 'in-progress' && (progress === 0 || progress >= 95)) return false;
      if (selectedStatus === 'completed' && progress < 95) return false;

      // 4. Format Filter
      const hasPdf = Boolean((n as any).pdf_url || (n as any).file_url);
      if (selectedFormat === 'pdf' && !hasPdf) return false;
      if (selectedFormat === 'compendium' && hasPdf) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'az') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'readTime') return (b.read_time_min || 5) - (a.read_time_min || 5);
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [
    notes,
    resolveNoteSubject,
    userStates,
    downloadedNoteIds,
    activeTab,
    selectedSubjectId,
    selectedStatus,
    selectedFormat,
    sortBy
  ]);

  // Deduplicated Subject List for Faculty Cards & Sidebar (Hook placed unconditionally at top)
  const dedupedSubjects = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach(s => {
      const canon = canonicalSubjectId(s.id);
      if (!map.has(canon)) map.set(canon, s);
    });
    return Array.from(map.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [subjects]);

  // ───────────────────────────────────────────────────────────────────────────
  // 6. BOOKMARK & OFFLINE ACTIONS
  // ───────────────────────────────────────────────────────────────────────────

  const handleToggleBookmark = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickChime();
    const currentState = userStates[noteId];
    const willBookmark = !currentState?.bookmarked;

    // Optimistic UI update
    setUserStates(prev => ({
      ...prev,
      [noteId]: {
        ...(prev[noteId] || { user_id: userId, note_id: noteId, progress: 0, scroll_position: 0 }),
        bookmarked: willBookmark,
        last_read_at: new Date().toISOString()
      }
    }));

    try {
      await notesRepository.upsertUserNoteState({
        user_id: userId,
        note_id: noteId,
        bookmarked: willBookmark
      });
      if (willBookmark) playSuccessChime();
    } catch (err) {
      console.warn('Bookmark sync note:', err);
    }
  };

  const handleToggleOfflineDownload = async (note: NoteListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isDownloaded = downloadedNoteIds.has(note.id);

    if (isDownloaded) {
      playClickChime();
      await deleteDownloadedNote(note.id);
      setDownloadedNoteIds(prev => {
        const next = new Set(prev);
        next.delete(note.id);
        return next;
      });
      refreshOfflineOverview();
      return;
    }

    setDownloadingId(note.id);
    playClickChime();

    try {
      // Fetch full note content
      const fullNote = await notesRepository.fetchNoteById(note.id);
      const ch = chapterMap.get(note.chapter_id);
      const sub = resolveNoteSubject(note);

      await saveNoteOffline({
        id: note.id,
        title: note.title,
        subject: sub?.name || 'Ethiopian Higher Education',
        chapter: ch?.title || 'Lecture Module',
        content: fullNote?.content || '',
        pdfUrl: (note as any).pdf_url || (note as any).file_url
      });

      setDownloadedNoteIds(prev => new Set(prev).add(note.id));
      playSuccessChime();
      refreshOfflineOverview();
    } catch (err) {
      console.warn('Offline download error:', err);
      playFailureChime();
    } finally {
      setDownloadingId(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 7. PERSONAL NOTE STUDIO ACTIONS
  // ───────────────────────────────────────────────────────────────────────────

  const handleSavePersonalNote = () => {
    if (!composerTitle.trim()) {
      playFailureChime();
      return;
    }

    playClickChime();
    const newNote: CustomNote = {
      id: editingNoteId || `custom_note_${Date.now()}`,
      title: composerTitle.trim(),
      content: composerContent.trim(),
      subject: composerSubject,
      color: 'bg-amber-500/15',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      images: composerImages,
      imageUrl: composerImages[0] || undefined
    };

    if (editingNoteId) {
      const updated = customNotes.map(n => n.id === editingNoteId ? newNote : n);
      onSaveCustomNotes(updated);
    } else {
      onSaveCustomNotes([newNote, ...customNotes]);
    }

    saveNoteOffline({
      id: newNote.id,
      title: newNote.title,
      subject: newNote.subject,
      content: newNote.content
    }).catch(() => {});

    setComposerToast(isAm ? 'ማስታወሻው ተቀምጧል!' : 'Note saved successfully to your library!');
    setTimeout(() => {
      setComposerToast(null);
      setShowNoteComposer(false);
      setEditingNoteId(null);
      setComposerTitle('');
      setComposerContent('');
      setComposerImages([]);
    }, 1200);

    playSuccessChime();
  };

  const handleDeletePersonalNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(isAm ? 'ይህን ማስታወሻ መሰረዝ ይፈልጋሉ?' : 'Are you sure you want to delete this study note?')) {
      playClickChime();
      const updated = customNotes.filter(n => n.id !== id);
      onSaveCustomNotes(updated);
      deleteDownloadedNote(id).catch(() => {});
    }
  };

  const exportNoteAsPdf = (title: string, content: string, subjectName: string) => {
    playClickChime();
    const doc = new jsPDF();
    const cleanContent = content.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();

    // Document Header with EthioLearn Academic styling
    doc.setFontSize(18);
    doc.setTextColor(217, 119, 6); // Warm Amber
    doc.text(title || 'EthioLearn Academic Digital Library', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Subject: ${subjectName} | Academic Repository | Date: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.line(14, 32, 196, 32);

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const splitText = doc.splitTextToSize(cleanContent, 180);

    let y = 40;
    splitText.forEach((line: string) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 6;
    });

    doc.save(`${(title || 'Study_Note').replace(/[^a-zA-Z0-9]/g, '_')}_EthioLearn.pdf`);
    playSuccessChime();
  };

  // Google Workspace Sync
  const handleExportToGoogleDoc = async (title: string, subjectName: string, content: string) => {
    if (!googleToken) {
      setSyncMessage(isAm ? 'እባክዎ መጀመሪያ ጎግል አካውንትዎን ያገናኙ!' : 'Please connect Google Account first!');
      playFailureChime();
      return;
    }
    setIsSyncingDoc(true);
    playClickChime();
    try {
      const result = await exportNoteToGoogleDoc(title, subjectName, content, googleToken);
      setSyncDocUrl(result.url);
      setSyncMessage(`"${title}" exported as Google Doc!`);
      playSuccessChime();
    } catch (e: any) {
      setSyncMessage(`Doc Export Failed: ${e.message}`);
      playFailureChime();
    } finally {
      setIsSyncingDoc(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 8. ACTIVE READER VIEW
  // ───────────────────────────────────────────────────────────────────────────

  if (readerNoteId) {
    return (
      <NoteReaderView
        noteId={readerNoteId}
        userId={userId || googleUser?.uid || 'student_wku'}
        onBack={() => setReaderNoteId(null)}
        onNavigateToNote={(id) => setReaderNoteId(id)}
        language={language}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#070D1E] text-slate-800 dark:text-slate-100 flex flex-col font-sans select-none transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* 1. PREMIUM ETHIOLEARN ACADEMIC DIGITAL LIBRARY HEADER (DEEP NAVY)         */}
      {/* ========================================================================= */}
      <header className="w-full bg-[#0A1128] border-b border-amber-500/20 text-white relative z-20 shadow-xl">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-36 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-80 h-32 bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          
          {/* Top Bar: Crest Branding, University Status, Quick Pro Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                    <span>EthioLearn</span>
                    <span className="text-amber-400 font-serif italic font-normal">Digital Library</span>
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <Sparkles className="w-2.5 h-2.5 fill-amber-300" />
                    <span>Academic</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                  {isAm
                    ? 'የኢትዮጵያ ዩኒቨርሲቲዎች ይፋዊ የካሪኩለም ማስታወሻዎች እና የጥናት ሰነዶች ማዕከል'
                    : 'Official university curriculum compendiums, syllabi & lecture notebooks'}
                </p>
              </div>
            </div>

            {/* Quick Actions (Create Note, Offline Status, Google Sync) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setEditingNoteId(null);
                  setComposerTitle('');
                  setComposerContent('');
                  setComposerImages([]);
                  setShowNoteComposer(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">{isAm ? 'ማስታወሻ ጻፍ' : 'Create Note'}</span>
                <span className="xs:hidden">{isAm ? 'አዲስ' : 'New'}</span>
              </button>

              {offlineOverview.notes.length > 0 && (
                <div 
                  onClick={() => setActiveTab('offline')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 font-mono cursor-pointer hover:border-amber-400/40 transition"
                  title="Offline Ready Documents in IndexedDB"
                >
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{offlineOverview.notes.length} Cached</span>
                </div>
              )}

              {googleUser ? (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[120px]">{googleUser.email?.split('@')[0]}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
                  title="Connect Google Drive to export notes"
                >
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Google Drive</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. LARGE SEARCH BAR WITH ADVANCED FILTERS                                 */}
          {/* ========================================================================= */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAm
                      ? 'በርዕስ፣ በዩኒቨርሲቲ፣ በምዕራፍ ወይም በቁልፍ ቃላት ይፈልጉ (ለምሳሌ: Photosynthesis, Fallacy, Logic)...'
                      : 'Search by course, concept, formula, or university topic (e.g., Photosynthesis, Logic, Vectors)...'
                  }
                  className="w-full bg-[#111C35] border border-slate-700/80 focus:border-amber-400 text-white rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : isSearching ? (
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                ) : null}
              </div>

              {/* Advanced Filter Toggle */}
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setShowAdvancedFilters(prev => !prev);
                }}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showAdvancedFilters || selectedSubjectId || selectedStatus !== 'all' || selectedFormat !== 'all'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-[#111C35] border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAm ? 'ማጣሪያዎች' : 'Filters'}</span>
                {(selectedSubjectId || selectedStatus !== 'all' || selectedFormat !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-slate-950 shrink-0" />
                )}
              </button>
            </div>

            {/* Collapsible Advanced Filters Tray */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden bg-[#111C35]/95 border border-slate-700/80 rounded-2xl p-4 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5" />
                      <span>{isAm ? 'ዝርዝር ማጣሪያዎች' : 'Multi-Facet Filters'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubjectId(null);
                        setSelectedStatus('all');
                        setSelectedFormat('all');
                        setSortBy('recent');
                      }}
                      className="text-slate-400 hover:text-amber-300 underline text-[11px] cursor-pointer"
                    >
                      {isAm ? 'ማጣሪያዎችን ዳግም ጀምር' : 'Reset All Filters'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Filter by Subject */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isAm ? 'የትምህርት ዘርፍ' : 'Course Subject'}
                      </label>
                      <select
                        value={selectedSubjectId || ''}
                        onChange={(e) => setSelectedSubjectId(e.target.value || null)}
                        className="w-full bg-[#0A1128] border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="">{isAm ? 'ሁሉም የትምህርት ዘርፎች' : 'All Academic Subjects'}</option>
                        {dedupedSubjects.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter by Reading Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isAm ? 'የንባብ ሁኔታ' : 'Reading Progress'}
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-[#0A1128] border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="all">{isAm ? 'ሁሉም ሰነዶች' : 'All Documents'}</option>
                        <option value="in-progress">{isAm ? 'በሂደት ላይ ያሉ' : 'In Progress'}</option>
                        <option value="completed">{isAm ? 'የተጠናቀቁ' : 'Completed'}</option>
                        <option value="unread">{isAm ? 'ያልተነበቡ' : 'Unread'}</option>
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isAm ? 'ቅደም ተከተል' : 'Sort Order'}
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full bg-[#0A1128] border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="recent">{isAm ? 'የቅርብ ጊዜ ህትመቶች' : 'Curriculum Order (Recent)'}</option>
                        <option value="az">{isAm ? 'በርዕስ (A-Z)' : 'Title (A - Z)'}</option>
                        <option value="readTime">{isAm ? 'የንባብ ጊዜ' : 'Estimated Read Time'}</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sync status toast */}
          {syncMessage && (
            <div className="p-2.5 bg-slate-900/90 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{syncMessage}</span>
              </span>
              {syncDocUrl && onOpenInAppViewer && (
                <button
                  onClick={() => onOpenInAppViewer(syncDocUrl, 'Google Doc')}
                  className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/30 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Doc</span>
                </button>
              )}
            </div>
          )}

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE WITH DESKTOP SIDEBAR & DUAL THEME READING FLOOR         */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-140px)]">
        
        {/* ─── DESKTOP SIDEBAR NAVIGATION (LARGE SCREENS) ────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-white dark:bg-[#0B132B] border-r border-slate-200 dark:border-slate-800/80 p-5 space-y-6 text-slate-700 dark:text-slate-200 transition-colors duration-200">
          
          {/* Main 4 Library Tabs */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              {isAm ? 'ቤተ-መጻሕፍት' : 'Library Navigation'}
            </span>

            <nav className="space-y-1 pt-1">
              <button
                type="button"
                onClick={() => { playClickChime(); setActiveTab('explore'); setSelectedSubjectId(null); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'explore' && !selectedSubjectId
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>{isAm ? 'ዳሰሳ' : 'Explore Library'}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'explore' && !selectedSubjectId ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {notes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { playClickChime(); setActiveTab('my-library'); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'my-library'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>{isAm ? 'የኔ ማስታወሻዎች' : 'My Library'}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'my-library' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {customNotes.length + continueReadingNotes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { playClickChime(); setActiveTab('bookmarks'); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'bookmarks'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>{isAm ? 'የተመረጡ ሰነዶች' : 'Bookmarks'}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'bookmarks' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {notes.filter(n => userStates[n.id]?.bookmarked).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { playClickChime(); setActiveTab('offline'); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'offline'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>{isAm ? 'ከመስመር ውጭ' : 'Offline Storage'}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  {offlineOverview.notes.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Faculty / Subject Directory */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isAm ? 'የትምህርት ክፍሎች' : 'Academic Faculties'}
              </span>
              {selectedSubjectId && (
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId(null)}
                  className="text-[10px] text-amber-500 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1">
              {dedupedSubjects.map(sub => {
                const isSelected = selectedSubjectId === sub.id || canonicalSubjectId(selectedSubjectId) === canonicalSubjectId(sub.id);
                const count = notes.filter(n => {
                  const s = resolveNoteSubject(n);
                  return s && canonicalSubjectId(s.id) === canonicalSubjectId(sub.id);
                }).length;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      playClickChime();
                      setSelectedSubjectId(isSelected ? null : sub.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color || '#D97706' }}
                      />
                      <span className="truncate">{sub.name.split('(')[0].trim()}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Storage Widget */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>IndexedDB Storage</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">{offlineOverview.formattedSize}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {offlineOverview.notes.length > 0
                ? `${offlineOverview.notes.length} compendiums ready for zero-network reading.`
                : 'Save notes offline to read without mobile data.'}
            </p>
          </div>
        </aside>

        {/* ─── MAIN CONTENT READING FLOOR (DUAL THEME / LIGHT WARM & NIGHT NAVY) ──────────── */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-7 pb-24 lg:pb-12 text-slate-800 dark:text-slate-100 transition-colors duration-200">
          
          {/* SEARCH RESULTS OVERLAY (When typing in the top search bar) */}
          {searchQuery.trim().length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAm ? 'የፍለጋ ውጤቶች' : 'Search Results'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Matching <strong className="text-amber-600 dark:text-amber-400 font-bold">"{searchQuery}"</strong> across university syllabi
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {searchResults.length} {isAm ? 'ውጤቶች' : 'results'}
                </span>
              </div>

              {searchResults.length === 0 && !isSearching ? (
                <div className="p-12 text-center bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs">
                  <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-300">
                    {isAm ? 'ምንም የሚመሳሰል ማስታወሻ አልተገኘም' : 'No matching notes found'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isAm ? 'የተለየ ቁልፍ ቃል ወይም ርዕስ ይሞክሩ' : 'Try searching for another formula, theorem, or chapter topic.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map(res => (
                    <div
                      key={res.id}
                      onClick={() => setReaderNoteId(res.id)}
                      className="p-4 bg-white dark:bg-[#111C35] hover:bg-slate-50 dark:hover:bg-[#162342] border border-slate-200/90 dark:border-slate-800 hover:border-amber-400/50 rounded-2xl shadow-sm dark:shadow-md transition-all cursor-pointer group flex items-start justify-between gap-3 text-slate-900 dark:text-white"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                          {res.title}
                        </h4>
                        {res.snippet && (
                          <p
                            className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed opacity-90 [&_mark]:bg-amber-500/30 [&_mark]:text-amber-900 dark:[&_mark]:text-amber-200 [&_mark]:px-1 [&_mark]:rounded"
                            dangerouslySetInnerHTML={{ __html: res.snippet }}
                          />
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* 4. CONTINUE LEARNING SECTION (RECENTLY OPENED IN-PROGRESS NOTES)          */}
              {/* ========================================================================= */}
              {activeTab === 'explore' && continueReadingNotes.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {isAm ? 'ንባብዎን ይቀጥሉ' : 'Continue Learning'}
                      </h2>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {continueReadingNotes.length} {isAm ? 'በሂደት ላይ' : 'in progress'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {continueReadingNotes.map(({ note: cNote, progress }) => {
                      const sub = resolveNoteSubject(cNote);
                      const badgeClass = getSubjectBadgeStyle(sub?.id);

                      return (
                        <div
                          key={cNote.id}
                          onClick={() => { playClickChime(); setReaderNoteId(cNote.id); }}
                          className="p-4 bg-white dark:bg-[#111C35] hover:bg-slate-50 dark:hover:bg-[#162342] border border-slate-200/90 dark:border-slate-800 hover:border-amber-400/60 rounded-2xl shadow-sm dark:shadow-lg dark:shadow-black/20 transition-all cursor-pointer flex flex-col justify-between gap-3 group text-slate-900 dark:text-white"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider truncate max-w-[170px] ${badgeClass}`}>
                                {sub?.name.split('(')[0] || 'Curriculum'}
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                                {Math.round(progress)}%
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors line-clamp-1">
                              {cNote.title}
                            </h3>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5 pt-1">
                            <div className="w-full bg-slate-200 dark:bg-slate-800/90 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                <span>{cNote.read_time_min || 5}m read</span>
                              </span>
                              <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                <span>Resume</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ========================================================================= */}
              {/* 5. SUBJECT CATEGORIES IN A CLEAN 2-COLUMN MOBILE GRID                     */}
              {/* ========================================================================= */}
              {activeTab === 'explore' && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                        <Library className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {isAm ? 'የትምህርት ዘርፎች ማውጫ' : 'Academic Subject Compendiums'}
                      </h2>
                    </div>

                    {selectedSubjectId && (
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectId(null)}
                        className="text-xs text-amber-500 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                      >
                        {isAm ? 'ሁሉንም አሳይ' : 'Show All'}
                      </button>
                    )}
                  </div>

                  {/* 2-column on mobile, 3-column tablet, 4-column desktop */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {dedupedSubjects.map(sub => {
                      const isSelected = selectedSubjectId === sub.id || canonicalSubjectId(selectedSubjectId) === canonicalSubjectId(sub.id);
                      const subNotes = notes.filter(n => {
                        const s = resolveNoteSubject(n);
                        return s && canonicalSubjectId(s.id) === canonicalSubjectId(sub.id);
                      });
                      const count = subNotes.length;
                      const completed = subNotes.filter(n => (userStates[n.id]?.progress || 0) >= 95).length;
                      const pct = count > 0 ? Math.round((completed / count) * 100) : 0;

                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            playClickChime();
                            setSelectedSubjectId(isSelected ? null : sub.id);
                          }}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 shadow-md ring-2 ring-amber-400/20'
                              : 'bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#131E38] text-slate-900 dark:text-white shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                              {getSubjectIcon(sub.id)}
                            </div>
                            {pct > 0 && (
                              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 dark:border-emerald-800/60">
                                {pct}%
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1" title={sub.name}>
                              {sub.name.split('(')[0].trim()}
                            </h3>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <span>{count} {isAm ? 'ሰነዶች' : 'modules'}</span>
                              <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                                {sub.name.includes('(') ? sub.name.split('(')[1].replace(')', '') : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ========================================================================= */}
              {/* 6. LATEST PUBLICATIONS IN A READABLE DOCUMENT-LIST LAYOUT                 */}
              {/* ========================================================================= */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>
                        {activeTab === 'bookmarks'
                          ? (isAm ? 'የተመረጡ ማስታወሻዎች' : 'Saved Bookmarks')
                          : activeTab === 'offline'
                          ? (isAm ? 'ከመስመር ውጭ የተጫኑ' : 'Offline Stored Documents')
                          : activeTab === 'my-library'
                          ? (isAm ? 'የኔ የትምህርት ማስታወሻዎች' : 'My Personal Library & Notebook')
                          : selectedSubjectId
                          ? `${subjects.find(s => s.id === selectedSubjectId || canonicalSubjectId(s.id) === canonicalSubjectId(selectedSubjectId))?.name || 'Subject'} Compendiums`
                          : (isAm ? 'አዳዲስ ህትመቶች እና የትምህርት ክፍሎች' : 'Latest Curriculum Publications')}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAm
                        ? 'በዩኒቨርሲቲ መምህራን የተዘጋጁ ይፋዊ የትምህርት ይዘቶች'
                        : 'Accredited university lecture modules, compendiums & formula reference sheets'}
                    </p>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
                    {filteredNotes.length} {isAm ? 'ሰነዶች' : 'items'}
                  </span>
                </div>

                {/* MY LIBRARY: PERSONAL NOTEBOOK DRAWER / CARDS */}
                {activeTab === 'my-library' && (
                  <div className="p-4 bg-slate-50 dark:bg-[#111C35] border border-amber-500/30 rounded-2xl shadow-sm dark:shadow-xl space-y-3 mb-4 text-slate-900 dark:text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          {isAm ? 'የግል ማስታወሻ ደብተር' : 'Personal Study Notebook & Diagrams'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playClickChime();
                          setEditingNoteId(null);
                          setComposerTitle('');
                          setComposerContent('');
                          setComposerImages([]);
                          setShowNoteComposer(true);
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAm ? 'አዲስ ጻፍ' : 'New Note'}</span>
                      </button>
                    </div>

                    {customNotes.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                        {isAm
                          ? 'እስካሁን ምንም የግል ማስታወሻ አልጻፉም። ማስታወሻዎችን በፎቶ እና ስዕላዊ መግለጫዎች እዚህ ማዘጋጀት ይችላሉ።'
                          : 'No personal notes yet. Use the composer to attach whiteboard photos, formulas, and diagrams.'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {customNotes.map(cNote => (
                          <div
                            key={cNote.id}
                            className="p-3.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 relative group text-slate-900 dark:text-white shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">
                                  {cNote.subject}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {cNote.title}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePersonalNote(cNote.id, e)}
                                  className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                              {cNote.content.replace(/<[^>]*>/g, ' ') || 'No content...'}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <span>{cNote.date || 'Saved'}</span>
                              <button
                                type="button"
                                onClick={() => exportNoteAsPdf(cNote.title, cNote.content, cNote.subject)}
                                className="text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Document List Loading / Empty / Loaded */}
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="p-5 bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse space-y-3 shadow-xs">
                        <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="w-1/2 h-3 bg-slate-100 dark:bg-slate-900 rounded" />
                      </div>
                    ))}
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs">
                    <FolderOpen className="w-9 h-9 text-slate-400 dark:text-slate-500 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isAm ? 'ምንም ማስታወሻ አልተገኘም' : 'No documents found'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {isAm
                        ? 'በተመረጠው ማጣሪያ መሰረት ሰነዶች የሉም። ማጣሪያውን በመቀየር እንደገና ይሞክሩ።'
                        : 'There are no compendiums matching your selected filter. Try clearing subject or status filters.'}
                    </p>
                  </div>
                ) : (
                  /* Single-column on mobile, spacious card list on tablet & desktop */
                  <div className="space-y-3">
                    {filteredNotes.map((note) => {
                      const sub = resolveNoteSubject(note);
                      const ch = chapterMap.get(note.chapter_id);
                      const state = userStates[note.id];
                      const progress = state?.progress || 0;
                      const isCompleted = progress >= 95;
                      const isBookmarked = !!state?.bookmarked;
                      const isDownloaded = downloadedNoteIds.has(note.id);
                      const isDownloadingThis = downloadingId === note.id;
                      const badgeClass = getSubjectBadgeStyle(sub?.id);

                      return (
                        <div
                          key={note.id}
                          onClick={() => {
                            playClickChime();
                            setReaderNoteId(note.id);
                          }}
                          className="p-4 sm:p-5 bg-white dark:bg-[#111C35] hover:bg-slate-50 dark:hover:bg-[#162342] border border-slate-200/90 dark:border-slate-800/90 hover:border-amber-400/60 rounded-2xl shadow-sm dark:shadow-lg dark:shadow-black/20 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group text-slate-900 dark:text-white"
                        >
                          {/* Left: Document Info */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${badgeClass}`}>
                                {sub?.name.split('(')[0] || 'General'}
                              </span>

                              {ch?.title && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                  {ch.title}
                                </span>
                              )}

                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 dark:border-emerald-800/60 shrink-0">
                                  <Check className="w-3 h-3" />
                                  <span>{isAm ? 'ተጠናቋል' : 'Completed'}</span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors leading-snug">
                              {note.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <span>{note.read_time_min || 5} min read</span>
                              </span>
                              <span>•</span>
                              <span>{isAm ? 'ካሪኩለም ማስታወሻ' : 'Lecture Module'}</span>
                              {progress > 0 && progress < 95 && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">{Math.round(progress)}% read</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right: Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800 justify-end">
                            
                            {/* Bookmark Action */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleBookmark(note.id, e)}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                isBookmarked
                                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Note'}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400' : ''}`} />
                            </button>

                            {/* Offline Download Action (IndexedDB) */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleOfflineDownload(note, e)}
                              disabled={isDownloadingThis}
                              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isDownloaded
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                              title={isDownloaded ? 'Cached Offline in IndexedDB' : 'Save for Offline Reading'}
                            >
                              {isDownloadingThis ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500 dark:text-amber-400" />
                              ) : isDownloaded ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                  <span className="hidden sm:inline text-[11px] font-mono">Offline</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-[11px]">Save</span>
                                </>
                              )}
                            </button>

                            {/* Read Now Primary CTA */}
                            <button
                              type="button"
                              onClick={() => {
                                playClickChime();
                                setReaderNoteId(note.id);
                              }}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <BookOpen className="w-3.5 h-3.5 stroke-[2.2]" />
                              <span>{isAm ? 'አንብብ' : 'Read'}</span>
                            </button>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 7. SIMPLE BOTTOM NAVIGATION ON MOBILE (FIXED THUMB BAR)                   */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A1128]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-2xl flex items-center justify-around">
        <button
          type="button"
          onClick={() => { playClickChime(); setActiveTab('explore'); setSelectedSubjectId(null); }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'explore'
              ? 'text-amber-600 dark:text-amber-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>{isAm ? 'ዳሰሳ' : 'Explore'}</span>
        </button>

        <button
          type="button"
          onClick={() => { playClickChime(); setActiveTab('my-library'); }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'my-library'
              ? 'text-amber-600 dark:text-amber-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>{isAm ? 'የኔ ማስታወሻ' : 'My Library'}</span>
        </button>

        <button
          type="button"
          onClick={() => { playClickChime(); setActiveTab('bookmarks'); }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'text-amber-600 dark:text-amber-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span>{isAm ? 'የተመረጡ' : 'Bookmarks'}</span>
        </button>

        <button
          type="button"
          onClick={() => { playClickChime(); setActiveTab('offline'); }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'offline'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HardDrive className="w-5 h-5" />
          <span>{isAm ? 'ከመስመር ውጭ' : 'Offline'}</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 8. PERSONAL NOTE COMPOSER MODAL (RICH TEXT & DIAGRAM ATTACHMENTS)         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showNoteComposer && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
            >
              {/* Modal Header */}
              <div className="p-4 bg-slate-50 dark:bg-[#0A1128] text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingNoteId ? 'Edit Study Note' : (isAm ? 'አዲስ የጥናት ማስታወሻ ይጻፉ' : 'Create Visual Study Note')}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Rich Text • Attached Diagrams • PDF Export
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNoteComposer(false)}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {composerToast && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>{composerToast}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isAm ? 'የትምህርት ዘርፍ' : 'Subject'}
                  </label>
                  <select
                    value={composerSubject}
                    onChange={(e) => setComposerSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0A1128] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 font-semibold cursor-pointer"
                  >
                    {dedupedSubjects.map(s => (
                      <option key={s.id} value={s.name.split('(')[0].trim()}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isAm ? 'የማስታወሻው ርዕስ' : 'Note Title'}
                  </label>
                  <input
                    type="text"
                    value={composerTitle}
                    onChange={(e) => setComposerTitle(e.target.value)}
                    placeholder="e.g., Cellular Respiration & ATP Cycle Summary"
                    className="w-full bg-slate-50 dark:bg-[#0A1128] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Editor Content */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isAm ? 'የማስታወሻ ይዘት' : 'Notes & Key Takeaways'}
                  </label>
                  <textarea
                    rows={6}
                    value={composerContent}
                    onChange={(e) => setComposerContent(e.target.value)}
                    placeholder="Write definitions, exam formulas, theorem explanations, and summary points here..."
                    className="w-full bg-slate-50 dark:bg-[#0A1128] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-400 leading-relaxed font-sans"
                  />
                </div>

                {/* Diagram URL Attachment */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Attached Diagrams ({composerImages.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUrlField(prev => !prev)}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      + Add Image URL
                    </button>
                  </div>

                  {showUrlField && (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://... image URL (whiteboard diagram, textbook scan)"
                        className="flex-1 bg-slate-50 dark:bg-[#0A1128] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (imageUrlInput.trim()) {
                            setComposerImages(prev => [...prev, imageUrlInput.trim()]);
                            setImageUrlInput('');
                            setShowUrlField(false);
                            playSuccessChime();
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 cursor-pointer"
                      >
                        Attach
                      </button>
                    </div>
                  )}

                  {composerImages.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {composerImages.map((imgSrc, iIdx) => (
                        <div key={iIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 group bg-slate-100 dark:bg-black">
                          <img
                            src={imgSrc}
                            alt="diagram"
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setImageModalUrl(imgSrc)}
                          />
                          <button
                            type="button"
                            onClick={() => setComposerImages(prev => prev.filter((_, idx) => idx !== iIdx))}
                            className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-[#0A1128] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {composerTitle.trim() && (
                    <button
                      type="button"
                      onClick={() => exportNoteAsPdf(composerTitle, composerContent, composerSubject)}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Export PDF</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteComposer(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {isAm ? 'ሰርዝ' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePersonalNote}
                    disabled={!composerTitle.trim()}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isAm ? 'ማስታወሻ አስቀምጥ' : 'Save Note'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 9. LIGHTBOX IMAGE ZOOM MODAL                                             */}
      {/* ========================================================================= */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setImageModalUrl(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-10 right-0 p-1.5 text-white bg-slate-800 rounded-full hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imageModalUrl}
              alt="Diagram Zoom"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-white/20 shadow-2xl bg-black"
            />
          </div>
        </div>
      )}

    </div>
  );
}
