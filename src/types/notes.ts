export interface Subject {
  id: string; // uuid
  name: string;
  color: string; // hex, default #4F46E5
  sort_order: number;
}

export interface Chapter {
  id: string; // uuid
  subject_id: string;
  title: string;
  sort_order: number;
}

export interface Note {
  id: string; // uuid
  chapter_id: string;
  title: string;
  content: string; // Markdown
  read_time_min: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  subject_id?: string;
  subject?: string;
  course?: string;
}

export type NoteListItem = Omit<Note, 'content'> & {
  content?: string;
  subject_id?: string;
  subject?: string;
  course?: string;
};

export interface UserNoteState {
  user_id: string;
  note_id: string;
  progress: number; // 0 to 100
  scroll_position: number;
  bookmarked: boolean;
  last_read_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  note_id: string;
  start_offset: number;
  end_offset: number;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'amber';
  comment?: string | null;
  selected_text?: string;
  created_at: string;
}

export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'contrast';
export type ReaderFontFamily = 'system' | 'serif' | 'mono' | 'dyslexic';

export interface ReaderSettings {
  user_id: string;
  font_size: number; // 14 to 24, default 17
  line_height: number; // 1.4 to 2.2, default 1.7
  font_family: ReaderFontFamily;
  theme: ReaderTheme;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  rank: number;
}

export interface TocHeading {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

export type LibraryFilter = 'all' | 'bookmarked' | 'unread' | 'recent';

export interface AdjacentNotes {
  prev: NoteListItem | null;
  next: NoteListItem | null;
}
