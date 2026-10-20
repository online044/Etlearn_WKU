import { getSupabase } from '../utils/supabaseClient';

// Helper to safely access supabase client
export const supabase = {
  from: (table: string) => {
    const client = getSupabase();
    if (!client) {
      return {
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }), eq: () => Promise.resolve({ data: [], error: null }) }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        rpc: () => Promise.resolve({ data: [], error: null })
      } as any;
    }
    return client.from(table);
  },
  rpc: (fn: string, params: any) => {
    const client = getSupabase();
    if (!client) return Promise.resolve({ data: [], error: null });
    return client.rpc(fn, params);
  }
} as any;

// ─── TYPES ─────────────────────────────────────────────────────────────────

export interface NoteLibraryItem {
  id: string;
  title: string;
  read_time_min: number;
  sort_order: number;
  chapters: {
    subject_id: string;
    sort_order: number;
    title: string;
  };
}

export interface ChapterGroup {
  chapterTitle: string;
  chapterSortOrder: number;
  notes: NoteLibraryItem[];
}

export interface NoteDetail {
  id: string;
  title: string;
  content: string;
  read_time_min: number;
  chapter_id: string;
  sort_order: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface UserNoteState {
  user_id: string;
  note_id: string;
  progress: number;
  scroll_position: number;
  bookmarked: boolean;
  last_read_at: string;
}

export interface ContinueReadingItem {
  note: NoteLibraryItem;
  state: UserNoteState;
}

export interface ReaderSettings {
  user_id: string;
  font_size: number;
  line_height: number;
  font_family: string;
  theme: 'light' | 'dark' | 'sepia';
}

export interface NavigationNotes {
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

// ─── REPOSITORY FUNCTIONS (ALL SUPABASE CALLS) ─────────────────────────────

/**
 * 0. Fetch all subjects ordered by sort_order
 */
export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, color, sort_order')
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.warn('[notesRepository] getSubjects notice:', error?.message);
    return [];
  }
  return data as Subject[];
}

/**
 * 1. Fetch library notes across ALL subjects (or filtered by subjectId if selected)
 * Drops the hardcoded .eq('chapters.subject_id', 'phil_1011') filter.
 * Never fetches 'content' column on library page.
 * Uses PostgREST inner join: chapters!inner(subject_id, sort_order, title)
 */
export async function getLibraryNotes(subjectId?: string): Promise<ChapterGroup[]> {
  let query = supabase
    .from('notes')
    .select(`
      id,
      title,
      read_time_min,
      sort_order,
      chapters!inner (
        subject_id,
        sort_order,
        title
      )
    `)
    .eq('is_published', true);

  if (subjectId && subjectId !== 'all') {
    query = query.eq('chapters.subject_id', subjectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[notesRepository] getLibraryNotes error:', error.message);
    throw new Error(error.message);
  }

  const rawNotes = (data as unknown as NoteLibraryItem[]) || [];

  // Sort by chapter sort_order, then note sort_order
  rawNotes.sort((a, b) => {
    const chOrder = (a.chapters?.sort_order ?? 0) - (b.chapters?.sort_order ?? 0);
    if (chOrder !== 0) return chOrder;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  // Group by chapter title
  const groupMap = new Map<string, ChapterGroup>();
  for (const n of rawNotes) {
    const chTitle = n.chapters?.title || 'General';
    const chOrder = n.chapters?.sort_order ?? 0;
    if (!groupMap.has(chTitle)) {
      groupMap.set(chTitle, {
        chapterTitle: chTitle,
        chapterSortOrder: chOrder,
        notes: []
      });
    }
    groupMap.get(chTitle)!.notes.push(n);
  }

  return Array.from(groupMap.values()).sort((a, b) => a.chapterSortOrder - b.chapterSortOrder);
}

/**
 * Convenience wrapper for Phil 1011 (Critical Thinking & Logic)
 */
export const getPhil1011LibraryNotes = () => getLibraryNotes('phil_1011');

/**
 * 2. Fetch "Continue reading" shelf ordered by last_read_at desc across all subjects
 */
export async function getContinueReadingNotes(userId: string, subjectId?: string): Promise<ContinueReadingItem[]> {
  if (!userId) return [];

  const { data: states, error } = await supabase
    .from('user_note_state')
    .select('*')
    .eq('user_id', userId)
    .order('last_read_at', { ascending: false })
    .limit(10);

  if (error || !states || states.length === 0) return [];

  // Fetch corresponding library items
  const noteIds = states.map((s) => s.note_id);
  let query = supabase
    .from('notes')
    .select(`
      id,
      title,
      read_time_min,
      sort_order,
      chapters!inner (
        subject_id,
        sort_order,
        title
      )
    `)
    .in('id', noteIds)
    .eq('is_published', true);

  if (subjectId && subjectId !== 'all') {
    query = query.eq('chapters.subject_id', subjectId);
  }

  const { data: notesData } = await query;
  if (!notesData) return [];

  const noteMap = new Map((notesData as unknown as NoteLibraryItem[]).map((n) => [n.id, n]));
  const items: ContinueReadingItem[] = [];

  for (const state of states as UserNoteState[]) {
    const note = noteMap.get(state.note_id);
    if (note && state.progress < 100) {
      items.push({ note, state });
    }
  }

  return items;
}

/**
 * 3. Fetch single note by ID with Markdown content
 */
export async function getNoteById(id: string): Promise<NoteDetail | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, content, read_time_min, chapter_id, sort_order')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[notesRepository] getNoteById error:', error.message);
    return null;
  }

  return data as NoteDetail;
}

/**
 * 4. Fetch Previous and Next note buttons
 * Ordered across chapters by chapter sort_order, then note sort_order
 */
export async function getAdjacentNotes(currentNoteId: string, subjectId?: string): Promise<NavigationNotes> {
  let query = supabase
    .from('notes')
    .select(`
      id,
      title,
      sort_order,
      chapters!inner (
        subject_id,
        sort_order
      )
    `)
    .eq('is_published', true);

  if (subjectId && subjectId !== 'all') {
    query = query.eq('chapters.subject_id', subjectId);
  }

  const { data: allNotes } = await query;

  if (!allNotes || allNotes.length === 0) {
    return { prev: null, next: null };
  }

  // Cast and sort identically
  const sorted = (allNotes as any[]).sort((a, b) => {
    const chDiff = (a.chapters?.sort_order ?? 0) - (b.chapters?.sort_order ?? 0);
    if (chDiff !== 0) return chDiff;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const currIdx = sorted.findIndex((n) => n.id === currentNoteId);
  if (currIdx === -1) return { prev: null, next: null };

  return {
    prev: currIdx > 0 ? { id: sorted[currIdx - 1].id, title: sorted[currIdx - 1].title } : null,
    next: currIdx < sorted.length - 1 ? { id: sorted[currIdx + 1].id, title: sorted[currIdx + 1].title } : null
  };
}

/**
 * 5. Fetch user reading state for a note
 */
export async function getUserNoteState(userId: string, noteId: string): Promise<UserNoteState | null> {
  const { data, error } = await supabase
    .from('user_note_state')
    .select('*')
    .eq('user_id', userId)
    .eq('note_id', noteId)
    .maybeSingle();

  if (error) return null;
  return data as UserNoteState;
}

/**
 * 6. Upsert user note reading progress and scroll position
 * (Debounced in caller ~2s and on unmount)
 */
export async function upsertUserNoteState(
  userId: string,
  noteId: string,
  state: { progress: number; scroll_position: number; bookmarked?: boolean }
): Promise<void> {
  const payload = {
    user_id: userId,
    note_id: noteId,
    progress: Math.min(100, Math.max(0, state.progress)),
    scroll_position: Math.max(0, Math.round(state.scroll_position)),
    last_read_at: new Date().toISOString(),
    ...(typeof state.bookmarked === 'boolean' ? { bookmarked: state.bookmarked } : {})
  };

  const { error } = await supabase
    .from('user_note_state')
    .upsert(payload, { onConflict: 'user_id,note_id' });

  if (error) {
    console.warn('[notesRepository] upsertUserNoteState warning:', error.message);
  }
}

/**
 * 7. Toggle Bookmark status for note
 */
export async function toggleNoteBookmark(
  userId: string,
  noteId: string,
  currentBookmarked: boolean
): Promise<boolean> {
  const next = !currentBookmarked;
  const { error } = await supabase
    .from('user_note_state')
    .upsert({
      user_id: userId,
      note_id: noteId,
      bookmarked: next,
      last_read_at: new Date().toISOString()
    }, { onConflict: 'user_id,note_id' });

  if (error) {
    console.warn('[notesRepository] toggleNoteBookmark error:', error.message);
    return currentBookmarked;
  }
  return next;
}

/**
 * 8. Fetch reader settings
 */
export async function getReaderSettings(userId: string): Promise<ReaderSettings> {
  const defaultSettings: ReaderSettings = {
    user_id: userId,
    font_size: 17,
    line_height: 1.7,
    font_family: 'system',
    theme: 'dark'
  };

  if (!userId) return defaultSettings;

  const { data, error } = await supabase
    .from('reader_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return defaultSettings;
  return data as ReaderSettings;
}

/**
 * 9. Upsert reader settings
 */
export async function upsertReaderSettings(
  userId: string,
  settings: Partial<ReaderSettings>
): Promise<void> {
  if (!userId) return;

  const payload = {
    user_id: userId,
    font_size: settings.font_size ?? 17,
    line_height: settings.line_height ?? 1.7,
    font_family: settings.font_family ?? 'system',
    theme: settings.theme ?? 'dark'
  };

  const { error } = await supabase
    .from('reader_settings')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.warn('[notesRepository] upsertReaderSettings error:', error.message);
  }
}
