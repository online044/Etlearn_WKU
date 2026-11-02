import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import {
  Search,
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
  Columns as ColumnsIcon,
  List as ListIcon,
  LayoutGrid
} from 'lucide-react';
import {
  Subject,
  Chapter,
  NoteListItem,
  UserNoteState,
  SearchResult,
  LibraryFilter
} from '../../types/notes';
import { notesRepository, canonicalSubjectId } from '../../repositories/notesRepository';
import { getSyncQueue } from '../../utils/notesOfflineSync';

interface NotesLibraryViewProps {
  userId: string;
  onOpenNote: (noteId: string) => void;
  language?: 'en' | 'am';
}

export const NotesLibraryView: React.FC<NotesLibraryViewProps> = ({
  userId,
  onOpenNote,
  language = 'en'
}) => {
  const isAm = language === 'am';

  // Data states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [userStates, setUserStates] = useState<Record<string, UserNoteState>>({});
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter & Layout state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');
  const [layoutMode, setLayoutMode] = useState<'columns' | 'list'>('columns');

  // Offline and sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Load library data
  const loadLibraryData = async () => {
    setLoading(true);
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
      setPendingSyncCount(getSyncQueue().length);
    } catch (e) {
      console.warn('Error loading library:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
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
    }, 100);

    return () => clearTimeout(timer);
  }, [deferredSearch]);

  // Flush offline sync queue
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await notesRepository.processSyncQueue();
      setPendingSyncCount(getSyncQueue().length);
      await loadLibraryData();
    } finally {
      setIsSyncing(false);
    }
  };

  // "Continue Reading" shelf notes sorted by last_read_at desc
  const continueReadingNotes = useMemo(() => {
    const notesWithState = notes
      .map((n) => {
        const state = userStates[n.id];
        return {
          note: n,
          state,
          lastReadTime: state?.last_read_at ? new Date(state.last_read_at).getTime() : 0,
          progress: state?.progress || 0
        };
      })
      .filter((item) => item.progress > 0 && item.progress < 100 && item.lastReadTime > 0)
      .sort((a, b) => b.lastReadTime - a.lastReadTime);

    return notesWithState.slice(0, 6);
  }, [notes, userStates]);

  // Subject map for fast lookup by raw ID and canonical ID
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    for (const s of subjects) {
      map.set(s.id, s);
      map.set(canonicalSubjectId(s.id), s);
    }
    return map;
  }, [subjects]);

  // Chapter map for fast lookup
  const chapterMap = useMemo(() => {
    const map = new Map<string, Chapter>();
    for (const c of chapters) map.set(c.id, c);
    return map;
  }, [chapters]);

  // Helper to accurately resolve which subject a note belongs to
  const resolveNoteSubject = useMemo(() => {
    return (note: NoteListItem): Subject | undefined => {
      // 0. Direct match from note's subject_id, subject, or course field from Supabase
      const noteObj = note as any;
      const directKey = note.subject_id || noteObj.subject || noteObj.course;
      if (directKey) {
        const canonicalKey = canonicalSubjectId(directKey);
        const sub = subjectMap.get(directKey) || subjectMap.get(canonicalKey);
        if (sub) return sub;
      }

      // 1. Direct match through chapter
      const ch = chapterMap.get(note.chapter_id);
      if (ch?.subject_id) {
        const canonicalKey = canonicalSubjectId(ch.subject_id);
        const sub = subjectMap.get(ch.subject_id) || subjectMap.get(canonicalKey);
        if (sub) return sub;
      }

      // 2. Comprehensive keyword matching across note title, chapter_id, subject, and content snippet
      const noteText = `${note.title || ''} ${note.chapter_id || ''} ${noteObj.subject || ''} ${noteObj.course || ''} ${(noteObj.content || '').slice(0, 400)}`.toLowerCase();

      // Check Anthropology FIRST to prevent phrases like 'biological anthropology' or 'cultural life' from matching Biology
      if (
        noteText.includes('anthro') ||
        noteText.includes('ethnograph') ||
        noteText.includes('kinship') ||
        noteText.includes('ethnicity') ||
        noteText.includes('marriage rules')
      ) {
        const anthroSub = subjects.find(s => canonicalSubjectId(s.id) === 'subj_social_anthropology' || s.name.toLowerCase().includes('anthro'));
        if (anthroSub) return anthroSub;
      }

      for (const sub of subjects) {
        const sCanon = canonicalSubjectId(sub.id);
        const sName = sub.name.toLowerCase();

        if (
          (sCanon === 'subj_general_biology' || sName.includes('biology')) &&
          !noteText.includes('anthro') &&
          !noteText.includes('ethnograph') &&
          (noteText.includes('biology') || noteText.includes('cell') || noteText.includes('genet') || noteText.includes('biomolecule') || noteText.includes('photosynth') || noteText.includes('enzyme') || noteText.includes('mitosis') || noteText.includes('meiosis') || noteText.includes('dna'))
        ) return sub;

        if (
          (sCanon === 'subj_general_chemistry' || sName.includes('chem')) &&
          (noteText.includes('chem') || noteText.includes('atom') || noteText.includes('orbital') || noteText.includes('period') || noteText.includes('bond') || noteText.includes('electronegativ'))
        ) return sub;

        if (
          (sCanon === 'subj_critical_thinking' || sName.includes('logic') || sName.includes('critical') || sName.includes('phil')) &&
          (noteText.includes('logic') || noteText.includes('argument') || noteText.includes('fallac') || noteText.includes('phil') || noteText.includes('premise') || noteText.includes('syllogism') || noteText.includes('soundness'))
        ) return sub;

        if (
          (sCanon === 'subj_general_physics' || sName.includes('phys') || sName.includes('physics')) &&
          (noteText.includes('phys') || noteText.includes('vector') || noteText.includes('kinematic') || noteText.includes('newton') || noteText.includes('mechanic') || noteText.includes('motion'))
        ) return sub;

        if (
          (sCanon === 'subj_emerging_technologies' || sName.includes('tech') || sName.includes('emerging') || sName.includes('emte')) &&
          (noteText.includes('tech') || noteText.includes('emte') || noteText.includes('ai') || noteText.includes('iot') || noteText.includes('4ir') || noteText.includes('cyber') || noteText.includes('data'))
        ) return sub;

        if (
          (sCanon === 'subj_math_natural' || sName.includes('math')) &&
          (noteText.includes('math') || noteText.includes('proposition') || noteText.includes('quantifier') || noteText.includes('truth table') || noteText.includes('precalculus'))
        ) return sub;

        if (
          (sCanon === 'subj_economics' || sName.includes('econ')) &&
          (noteText.includes('econ') || noteText.includes('market') || noteText.includes('scarcity') || noteText.includes('opportunity') || noteText.includes('elasticity') || noteText.includes('supply'))
        ) return sub;
      }

      // 3. Fallback: match by chapter's or direct key's canonical subject
      const fallbackKey = directKey || ch?.subject_id;
      if (fallbackKey) {
        const fallback = subjects.find(s => canonicalSubjectId(s.id) === canonicalSubjectId(fallbackKey));
        if (fallback) return fallback;
      }

      // 4. Return undefined when no subject matches, ensuring Biology only shows Biology notes
      return undefined;
    };
  }, [chapterMap, subjectMap, subjects]);

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const state = userStates[note.id];
      const noteSub = resolveNoteSubject(note);

      // Subject filter: match against direct ID or canonical ID
      if (selectedSubjectId) {
        const targetCanonical = canonicalSubjectId(selectedSubjectId);
        const noteCanonical = noteSub ? canonicalSubjectId(noteSub.id) : '';
        if (noteSub?.id !== selectedSubjectId && noteCanonical !== targetCanonical) {
          return false;
        }
      }

      // Tab filter
      if (activeFilter === 'bookmarked') {
        return !!state?.bookmarked;
      }
      if (activeFilter === 'unread') {
        return !state || (state.progress || 0) === 0;
      }
      if (activeFilter === 'recent') {
        return !!state?.last_read_at;
      }

      return true;
    });
  }, [notes, userStates, resolveNoteSubject, selectedSubjectId, activeFilter]);

  // Active subjects with uploaded notes for clean pill filters
  const activeSubjects = useMemo(() => {
    const presentSubjectIds = new Set<string>();
    notes.forEach((n) => {
      const sub = resolveNoteSubject(n);
      if (sub) {
        presentSubjectIds.add(sub.id);
        presentSubjectIds.add(canonicalSubjectId(sub.id));
      }
      const direct = (n as any).subject_id || (n as any).subject || (n as any).course;
      if (direct) {
        presentSubjectIds.add(direct);
        presentSubjectIds.add(canonicalSubjectId(direct));
      }
    });

    if (presentSubjectIds.size === 0) {
      return subjects;
    }

    return subjects.filter((s) => {
      const canon = canonicalSubjectId(s.id);
      return (
        presentSubjectIds.has(s.id) ||
        presentSubjectIds.has(canon) ||
        selectedSubjectId === s.id ||
        canonicalSubjectId(selectedSubjectId) === canon
      );
    });
  }, [subjects, notes, resolveNoteSubject, selectedSubjectId]);

  // Group notes into Subject Columns in strict numerical order
  const subjectColumns = useMemo(() => {
    const list: {
      subject: Subject;
      chapters: { chapter: Chapter; notes: NoteListItem[] }[];
      totalNotes: number;
      completedCount: number;
    }[] = [];

    const displaySubjects = selectedSubjectId
      ? subjects.filter(s => s.id === selectedSubjectId || canonicalSubjectId(s.id) === canonicalSubjectId(selectedSubjectId))
      : subjects;

    for (const sub of displaySubjects) {
      const subCanonical = canonicalSubjectId(sub.id);
      const subChapters = chapters
        .filter(c => c.subject_id === sub.id || canonicalSubjectId(c.subject_id) === subCanonical)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      const chapterGroups: { chapter: Chapter; notes: NoteListItem[] }[] = [];
      const handledNoteIds = new Set<string>();

      for (const ch of subChapters) {
        const chNotes = filteredNotes
          .filter(n => n.chapter_id === ch.id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' }));

        chNotes.forEach(n => handledNoteIds.add(n.id));
        if (chNotes.length > 0) {
          chapterGroups.push({ chapter: ch, notes: chNotes });
        }
      }

      // Collect orphaned notes for this subject
      const unassignedNotes = filteredNotes
        .filter(n => !handledNoteIds.has(n.id) && (
          resolveNoteSubject(n)?.id === sub.id || 
          canonicalSubjectId(resolveNoteSubject(n)?.id) === subCanonical
        ))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' }));

      if (unassignedNotes.length > 0) {
        chapterGroups.push({
          chapter: {
            id: `virtual_${sub.id}`,
            subject_id: sub.id,
            title: isAm ? 'ምዕራፍ፡ የካሪኩለም ማስታወሻዎች' : 'Module: Core Curriculum Notes',
            sort_order: 999
          },
          notes: unassignedNotes
        });
      }

      const totalNotes = chapterGroups.reduce((acc, g) => acc + g.notes.length, 0);
      const completedCount = chapterGroups.reduce(
        (acc, g) => acc + g.notes.filter(n => (userStates[n.id]?.progress || 0) >= 95).length,
        0
      );

      if (totalNotes > 0 || selectedSubjectId === sub.id || canonicalSubjectId(selectedSubjectId) === subCanonical) {
        list.push({
          subject: sub,
          chapters: chapterGroups,
          totalNotes,
          completedCount
        });
      }
    }

    return list.sort((a, b) => (a.subject.sort_order || 0) - (b.subject.sort_order || 0));
  }, [subjects, chapters, filteredNotes, selectedSubjectId, userStates, resolveNoteSubject, isAm]);

  // Group notes by Chapter for list mode
  const groupedByChapter = useMemo(() => {
    const groups: { chapter: Chapter; subject?: Subject; notes: NoteListItem[] }[] = [];
    for (const col of subjectColumns) {
      for (const chGroup of col.chapters) {
        groups.push({
          chapter: chGroup.chapter,
          subject: col.subject,
          notes: chGroup.notes
        });
      }
    }
    return groups;
  }, [subjectColumns]);

  return (
    <div className="w-full min-h-screen bg-[#0A1128] text-slate-100 flex flex-col pb-20 select-none">
      {/* ─── HERO HEADER ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#0F172A] to-[#0A1128] border-b border-white/10 px-3 min-[360px]:px-4 sm:px-6 py-2.5 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex flex-col justify-center leading-none shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <span className="text-sm sm:text-base font-black tracking-tight text-white whitespace-nowrap shrink-0">
                    {isAm ? 'የትምህርት ማስታወሻዎች' : 'Academic Notes'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-600/10 text-amber-300 border border-amber-400/40 text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider shadow-xs shadow-amber-500/10 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                    <span>Pro</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 whitespace-nowrap truncate max-w-[200px] sm:max-w-md mt-1 leading-tight">
                  {isAm
                    ? 'ከሱፓቤዝ ዳታቤዝ ጋር የተገናኘ የተሟላ የንባብ ማዕከል'
                    : 'Supabase-backed distraction-free reader for university students'}
                </p>
              </div>
            </div>

            {/* Offline & Sync Status */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!isOnline ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </div>
              ) : pendingSyncCount > 0 ? (
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  title="Sync pending notes state to Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync ({pendingSyncCount})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 transition-colors shadow-xs cursor-pointer"
                  title="Refresh library"
                  aria-label="Refresh library"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* ─── SEARCH INPUT (RPC search_notes) ─────────────────────────── */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                isAm
                  ? 'በርዕስ፣ ፅንሰ-ሀሳብ ወይም ይዘት ይፈልጉ (ለምሳሌ: Premise, Fallacy, Validity)...'
                  : 'Search notes by keyword or concept (e.g. Premise, Fallacy, KaTeX)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1E293B] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
            />
            {isSearching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 space-y-6">
        {/* ─── SEARCH RESULTS OVERLAY (When searching) ──────────────────── */}
        {searchQuery.trim().length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                {isAm ? 'የፍለጋ ውጤቶች ለ:' : 'Search results for:'}{' '}
                <strong className="text-amber-400">"{searchQuery}"</strong>
              </span>
              <span>{searchResults.length} matches</span>
            </div>

            {searchResults.length === 0 && !isSearching ? (
              <div className="text-center py-12 rounded-2xl bg-[#0F172A] border border-white/10 p-6">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-medium">
                  {isAm ? 'ምንም የሚመሳሰል ማስታወሻ አልተገኘም' : 'No matching notes found.'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {isAm ? 'የተለየ ቃል ወይም ርዕስ ይሞክሩ' : 'Try searching for different academic keywords.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {searchResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onOpenNote(res.id)}
                    className="p-4 rounded-2xl bg-[#1E293B] hover:bg-[#24334B] border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        {res.title}
                      </h4>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                    {res.snippet && (
                      <p
                        className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed opacity-90 [&_mark]:bg-amber-400/30 [&_mark]:text-amber-200 [&_mark]:px-1 [&_mark]:rounded"
                        dangerouslySetInnerHTML={{ __html: res.snippet }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ─── CONTINUE READING SHELF ─────────────────────────────────── */}
            {continueReadingNotes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    <span>{isAm ? 'ንባብዎን ይቀጥሉ' : 'Continue Reading'}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {continueReadingNotes.length} in progress
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {continueReadingNotes.map(({ note: cNote, state, progress }) => {
                    const ch = chapterMap.get(cNote.chapter_id);
                    const sub = ch ? subjectMap.get(ch.subject_id) : undefined;
                    return (
                      <div
                        key={cNote.id}
                        onClick={() => onOpenNote(cNote.id)}
                        className="p-4 rounded-2xl bg-[#1E293B] hover:bg-[#24334B] border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all active:scale-[0.99] flex flex-col justify-between gap-3 shadow-md group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider truncate max-w-[150px]"
                              style={{
                                backgroundColor: `${sub?.color || '#D97706'}25`,
                                color: sub?.color || '#D97706'
                              }}
                            >
                              {sub?.name || 'General'}
                            </span>
                            <span className="text-[11px] font-bold text-amber-400">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                            {cNote.title}
                          </h4>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── FILTER TABS (Subject & Status) ─────────────────────────── */}
            <div className="space-y-3">
              {/* Status pills: All, Bookmarked, Unread, Recent */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {isAm ? 'ሁሉም' : 'All Notes'}
                </button>
                <button
                  onClick={() => setActiveFilter('bookmarked')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    activeFilter === 'bookmarked'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isAm ? 'የተመረጡ' : 'Bookmarked'}</span>
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'unread'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {isAm ? 'ያልተነበቡ' : 'Unread'}
                </button>
                <button
                  onClick={() => setActiveFilter('recent')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    activeFilter === 'recent'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isAm ? 'በቅርቡ' : 'Recently Read'}</span>
                </button>
              </div>

              {/* Subject selector pills (Shows only subjects with uploaded notes) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border whitespace-nowrap transition-colors ${
                    selectedSubjectId === null
                      ? 'bg-white/15 border-white/30 text-white'
                      : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {isAm ? 'ሁሉም የትምህርት ዘርፎች' : 'All Subjects'}
                </button>
                {activeSubjects.map((sub, sIdx) => {
                  const isSelected = selectedSubjectId === sub.id;
                  return (
                    <button
                      key={`${sub.id}_pill_${sIdx}`}
                      onClick={() => setSelectedSubjectId(isSelected ? null : sub.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border whitespace-nowrap flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-transparent text-white font-bold'
                          : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                      style={{
                        backgroundColor: isSelected ? sub.color : 'transparent'
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* View Switcher: Subject Columns vs Sequential List */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <span>{subjectColumns.reduce((sum, col) => sum + col.totalNotes, 0)} {isAm ? 'የትምህርት ክፍሎች' : 'Sections'}</span>
                  <span>•</span>
                  <span className="text-amber-400">{subjectColumns.length} {isAm ? 'የትምህርት ዘርፎች' : 'Subjects'}</span>
                </div>

                <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setLayoutMode('columns')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      layoutMode === 'columns'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={isAm ? 'የትምህርት ዘርፍ አምዶች' : 'Subject Columns View'}
                  >
                    <ColumnsIcon className="w-3.5 h-3.5" />
                    <span>{isAm ? 'አምዶች' : 'Columns'}</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      layoutMode === 'list'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={isAm ? 'ተከታታይ ዝርዝር' : 'List View'}
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                    <span>{isAm ? 'ዝርዝር' : 'List'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ─── NOTES VIEW CONTENT ─────────────────────────────────────── */}
            {loading ? (
              <div className="space-y-4 pt-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#1E293B] border border-white/10 space-y-3">
                    <div className="w-1/3 h-5 bg-white/10 rounded-lg" />
                    <div className="w-2/3 h-4 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : subjectColumns.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-[#0F172A] border border-white/10 p-6">
                <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white mb-1">
                  {isAm ? 'ምንም ማስታወሻ አልተገኘም' : 'No notes found'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {isAm
                    ? 'በተመረጠው ማጣሪያ መሰረት የተመዘገበ ማስታወሻ የለም።'
                    : 'There are no notes matching the selected filter.'}
                </p>
              </div>
            ) : layoutMode === 'columns' ? (
              /* ─── 1. SUBJECT COLUMNS BOARD VIEW ─── */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                {subjectColumns.map((col, cIdx) => {
                  const percent = col.totalNotes > 0 
                    ? Math.round((col.completedCount / col.totalNotes) * 100) 
                    : 0;

                  return (
                    <div
                      key={`${col.subject.id}_col_${cIdx}`}
                      className="rounded-2xl bg-[#111C35] border border-white/10 hover:border-white/20 transition-all flex flex-col overflow-hidden shadow-lg"
                    >
                      {/* Column Header */}
                      <div 
                        className="p-3.5 border-b border-white/10 flex flex-col gap-2"
                        style={{ borderTop: `4px solid ${col.subject.color || '#F59E0B'}` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: col.subject.color || '#F59E0B' }} 
                            />
                            <h3 className="text-xs font-black text-white truncate" title={col.subject.name}>
                              {col.subject.name}
                            </h3>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 shrink-0">
                            {col.totalNotes} {isAm ? 'ክፍሎች' : 'secs'}
                          </span>
                        </div>

                        {/* Subject completion bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>{isAm ? 'የተጠናቀቀ' : 'Progress'}</span>
                            <span className={percent >= 90 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                              {percent}% ({col.completedCount}/{col.totalNotes})
                            </span>
                          </div>
                          <div className="w-full bg-slate-900/90 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${percent}%`,
                                backgroundColor: col.subject.color || '#F59E0B'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Column Chapters & Ordered Notes */}
                      <div className="p-3 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
                        {col.chapters.length === 0 || col.totalNotes === 0 ? (
                          <div className="p-6 text-center text-slate-500 space-y-2 my-auto">
                            <FolderOpen className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                            <p className="text-xs font-semibold text-slate-300">
                              {isAm ? 'ለዚህ ትምህርት ምንም የተጫነ ማስታወሻ የለም' : 'No uploaded notes for this subject'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {isAm ? 'አስተዳዳሪው በሚያክለው መሰረት እዚህ ይታያሉ።' : 'Notes uploaded to Supabase or Admin will appear here.'}
                            </p>
                          </div>
                        ) : (
                          col.chapters.map(({ chapter, notes: chNotes }) => (
                          <div key={chapter.id} className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1 border-b border-white/5 pb-1">
                              <span className="truncate">{chapter.title}</span>
                              <span className="text-[9.5px] text-slate-500 font-mono shrink-0">
                                {chNotes.length}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {chNotes.map((note, noteIdx) => {
                                const state = userStates[note.id];
                                const progress = state?.progress || 0;
                                const isCompleted = progress >= 95;
                                const isBookmarked = !!state?.bookmarked;

                                return (
                                  <div
                                    key={note.id}
                                    onClick={() => onOpenNote(note.id)}
                                    className="p-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/5 hover:border-amber-400/40 transition-all cursor-pointer flex flex-col gap-1.5 group active:scale-[0.98]"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-1.5 min-w-0">
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/5 text-amber-400 shrink-0 mt-0.5">
                                          {chapter.sort_order}.{note.sort_order || noteIdx + 1}
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors line-clamp-2">
                                          {note.title}
                                        </h4>
                                      </div>
                                      {isBookmarked && (
                                        <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                                      <span className="flex items-center gap-1 font-mono">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        {note.read_time_min}m
                                      </span>
                                      {isCompleted ? (
                                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                          <CheckCircle2 className="w-3 h-3" /> Done
                                        </span>
                                      ) : progress > 0 ? (
                                        <span className="text-amber-400 font-bold font-mono">
                                          {Math.round(progress)}%
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 font-mono">Unread</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ─── 2. LIST VIEW ─── */
              <div className="space-y-6">
                {groupedByChapter.map(({ chapter, subject, notes: chNotes }) => (
                  <div key={chapter.id} className="space-y-3">
                    {/* Chapter & Subject Header */}
                    <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: subject?.color || '#D97706' }}
                        />
                        <h3 className="font-bold text-sm text-slate-200">{chapter.title}</h3>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {chNotes.length} {isAm ? 'ማስታወሻዎች' : 'sections'}
                      </span>
                    </div>

                    {/* Chapter Notes Grid */}
                    <div className="space-y-2.5">
                      {chNotes.map((note) => {
                        const state = userStates[note.id];
                        const progress = state?.progress || 0;
                        const isCompleted = progress >= 95;
                        const isBookmarked = !!state?.bookmarked;

                        // Check if updated after student's last_read_at
                        const isNewOrUpdated =
                          state?.last_read_at &&
                          new Date(note.updated_at).getTime() >
                            new Date(state.last_read_at).getTime() + 60000;

                        return (
                          <div
                            key={note.id}
                            onClick={() => onOpenNote(note.id)}
                            className="p-4 rounded-2xl bg-[#1E293B] hover:bg-[#24334B] border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-4 group shadow-sm"
                          >
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                  {note.title}
                                </h4>

                                {isNewOrUpdated && (
                                  <span className="shrink-0 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Updated
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  {note.read_time_min} {isAm ? 'ደቂቃ ንባብ' : 'min read'}
                                </span>

                                {progress > 0 && (
                                  <span
                                    className={`flex items-center gap-1 font-semibold ${
                                      isCompleted ? 'text-emerald-400' : 'text-amber-400'
                                    }`}
                                  >
                                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    {isCompleted ? 'Done' : `${Math.round(progress)}% read`}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isBookmarked && (
                                <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400" />
                              )}
                              <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
