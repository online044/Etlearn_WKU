import { safeStorage } from './safeStorage';
import { UserNoteState, ReaderSettings, Highlight, Note, Subject, Chapter, NoteListItem } from '../types/notes';

const SYNC_QUEUE_KEY = 'ethiolearn_notes_sync_queue';
const CACHED_NOTES_KEY = 'ethiolearn_cached_notes';
const CACHED_SUBJECTS_KEY = 'ethiolearn_cached_subjects';
const CACHED_CHAPTERS_KEY = 'ethiolearn_cached_chapters';
const CACHED_USER_STATES_KEY = 'ethiolearn_cached_user_states';
const CACHED_SETTINGS_KEY = 'ethiolearn_cached_reader_settings';
const CACHED_HIGHLIGHTS_KEY = 'ethiolearn_cached_highlights';

export interface SyncQueueAction {
  id: string;
  type: 'UPSERT_NOTE_STATE' | 'ADD_HIGHLIGHT' | 'DELETE_HIGHLIGHT' | 'UPSERT_READER_SETTINGS';
  payload: any;
  timestamp: number;
}

/**
 * Retrieves the pending offline sync queue
 */
export function getSyncQueue(): SyncQueueAction[] {
  try {
    const raw = safeStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Appends an action to the offline sync queue
 */
export function enqueueSyncAction(action: Omit<SyncQueueAction, 'id' | 'timestamp'>) {
  const queue = getSyncQueue();
  const newAction: SyncQueueAction = {
    ...action,
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now()
  };

  // Coalesce multiple note state updates for the same note to avoid redundant sync writes
  if (newAction.type === 'UPSERT_NOTE_STATE') {
    const existingIndex = queue.findIndex(
      (a) => a.type === 'UPSERT_NOTE_STATE' && a.payload?.note_id === newAction.payload?.note_id
    );
    if (existingIndex >= 0) {
      queue[existingIndex] = {
        ...queue[existingIndex],
        payload: { ...queue[existingIndex].payload, ...newAction.payload },
        timestamp: Date.now()
      };
      safeStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      return;
    }
  }

  // Coalesce reader settings
  if (newAction.type === 'UPSERT_READER_SETTINGS') {
    const existingIndex = queue.findIndex((a) => a.type === 'UPSERT_READER_SETTINGS');
    if (existingIndex >= 0) {
      queue[existingIndex] = { ...queue[existingIndex], payload: newAction.payload, timestamp: Date.now() };
      safeStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      return;
    }
  }

  queue.push(newAction);
  safeStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Clears or removes processed actions from the sync queue
 */
export function removeSyncAction(id: string) {
  const queue = getSyncQueue().filter((a) => a.id !== id);
  safeStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function clearSyncQueue() {
  safeStorage.removeItem(SYNC_QUEUE_KEY);
}

// ─── LOCAL CACHING APIS ───────────────────────────────────────────────────

export function cacheFullNoteLocally(note: Note) {
  try {
    const cached: Record<string, Note> = JSON.parse(safeStorage.getItem(CACHED_NOTES_KEY) || '{}');
    cached[note.id] = note;
    safeStorage.setItem(CACHED_NOTES_KEY, JSON.stringify(cached));
  } catch (e) {
    console.warn('[Offline Notes] Error caching note:', e);
  }
}

export function getCachedNoteLocally(noteId: string): Note | null {
  try {
    const cached: Record<string, Note> = JSON.parse(safeStorage.getItem(CACHED_NOTES_KEY) || '{}');
    return cached[noteId] || null;
  } catch {
    return null;
  }
}

export function deleteCachedNoteLocally(noteId: string) {
  try {
    const cached: Record<string, Note> = JSON.parse(safeStorage.getItem(CACHED_NOTES_KEY) || '{}');
    delete cached[noteId];
    safeStorage.setItem(CACHED_NOTES_KEY, JSON.stringify(cached));
  } catch {}
}

export function cacheSubjectsLocally(subjects: Subject[]) {
  try {
    safeStorage.setItem(CACHED_SUBJECTS_KEY, JSON.stringify(subjects));
  } catch {}
}

export function getCachedSubjectsLocally(): Subject[] {
  try {
    const raw = safeStorage.getItem(CACHED_SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function cacheChaptersLocally(chapters: Chapter[]) {
  try {
    safeStorage.setItem(CACHED_CHAPTERS_KEY, JSON.stringify(chapters));
  } catch {}
}

export function getCachedChaptersLocally(): Chapter[] {
  try {
    const raw = safeStorage.getItem(CACHED_CHAPTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function cacheUserStateLocally(state: UserNoteState) {
  try {
    const cached: Record<string, UserNoteState> = JSON.parse(safeStorage.getItem(CACHED_USER_STATES_KEY) || '{}');
    cached[state.note_id] = state;
    safeStorage.setItem(CACHED_USER_STATES_KEY, JSON.stringify(cached));
  } catch {}
}

export function getCachedUserStateLocally(noteId: string): UserNoteState | null {
  try {
    const cached: Record<string, UserNoteState> = JSON.parse(safeStorage.getItem(CACHED_USER_STATES_KEY) || '{}');
    return cached[noteId] || null;
  } catch {
    return null;
  }
}

export function getCachedUserStatesMapLocally(): Record<string, UserNoteState> {
  try {
    const raw = safeStorage.getItem(CACHED_USER_STATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function cacheReaderSettingsLocally(settings: ReaderSettings) {
  try {
    safeStorage.setItem(CACHED_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function getCachedReaderSettingsLocally(): ReaderSettings | null {
  try {
    const raw = safeStorage.getItem(CACHED_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cacheHighlightsLocally(noteId: string, highlights: Highlight[]) {
  try {
    const cached: Record<string, Highlight[]> = JSON.parse(safeStorage.getItem(CACHED_HIGHLIGHTS_KEY) || '{}');
    cached[noteId] = highlights;
    safeStorage.setItem(CACHED_HIGHLIGHTS_KEY, JSON.stringify(cached));
  } catch {}
}

export function getCachedHighlightsLocally(noteId: string): Highlight[] {
  try {
    const cached: Record<string, Highlight[]> = JSON.parse(safeStorage.getItem(CACHED_HIGHLIGHTS_KEY) || '{}');
    return cached[noteId] || [];
  } catch {
    return [];
  }
}

const CACHED_NOTES_LIST_KEY = 'ethiolearn_cached_notes_list';

export function cacheNotesListLocally(notes: NoteListItem[]) {
  try {
    safeStorage.setItem(CACHED_NOTES_LIST_KEY, JSON.stringify(notes));
  } catch {}
}

export function getCachedNotesListLocally(): NoteListItem[] {
  try {
    const raw = safeStorage.getItem(CACHED_NOTES_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
