/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn - Unified IndexedDB Offline Content Store & Supabase Sync Engine
 * Handles persistent offline storage of Study Notes, Exam Papers, and Supabase PDFs,
 * plus conflict-safe synchronization of student learning progress back to Supabase.
 */

import { getSupabase } from './supabaseClient';
import { safeStorage } from './safeStorage';

const DB_NAME = 'ethiolearn_offline_store_v2';
const DB_VERSION = 2;

export const STORES = {
  NOTES: 'downloaded_notes',
  EXAMS: 'downloaded_exams',
  PDFS: 'downloaded_pdfs',
  QUEUE: 'offline_progress_queue',
  UNIVERSITIES: 'downloaded_universities'
} as const;

export interface OfflineUniversityItem {
  id: string;
  name: string;
  domain?: string;
  logoUrl: string;
  cachedLogoDataUrl?: string;
  shortName?: string;
  updatedAt: number;
}

export interface OfflineNoteItem {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  content: string;
  pdfUrl?: string;
  pdfBlob?: Blob;
  fileSize: number;
  downloadedAt: number;
}

export interface OfflineExamItem {
  id: string;
  title: string;
  subject: string;
  university?: string;
  course?: string;
  examType?: string;
  examYear?: string;
  totalQuestions: number;
  questions: any[];
  pdfUrl?: string;
  pdfBlob?: Blob;
  fileSize: number;
  downloadedAt: number;
}

export interface OfflinePdfItem {
  id: string;
  title: string;
  category: 'book' | 'note' | 'exam';
  pdfBlob: Blob;
  fileSize: number;
  downloadedAt: number;
  originalUrl?: string;
}

export interface OfflineProgressQueueItem {
  id: string;
  email: string;
  type: 'exam_attempt' | 'note_read' | 'quiz_score';
  payload: any;
  createdAt: number;
  synced: boolean;
  retryCount: number;
}

// In-memory fallback if IndexedDB is blocked
const memoryNotes = new Map<string, OfflineNoteItem>();
const memoryExams = new Map<string, OfflineExamItem>();
const memoryPdfs = new Map<string, OfflinePdfItem>();
const memoryUniversities = new Map<string, OfflineUniversityItem>();
const memoryQueue: OfflineProgressQueueItem[] = [];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this browser.'));
    }

    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const store = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
          store.createIndex('subject', 'subject', { unique: false });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.EXAMS)) {
          const store = db.createObjectStore(STORES.EXAMS, { keyPath: 'id' });
          store.createIndex('subject', 'subject', { unique: false });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PDFS)) {
          const store = db.createObjectStore(STORES.PDFS, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          const store = db.createObjectStore(STORES.QUEUE, { keyPath: 'id' });
          store.createIndex('email', 'email', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.UNIVERSITIES)) {
          const store = db.createObjectStore(STORES.UNIVERSITIES, { keyPath: 'name' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
    } catch (e) {
      reject(e);
    }
  });
}

// ============================================================================
// 1. NOTES DOWNLOAD & RETRIEVAL
// ============================================================================

export async function isNoteDownloaded(noteId: string): Promise<boolean> {
  if (!noteId) return false;
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORES.NOTES, 'readonly');
      const store = tx.objectStore(STORES.NOTES);
      const req = store.get(noteId);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(memoryNotes.has(noteId));
    });
  } catch {
    return memoryNotes.has(noteId);
  }
}

export async function getDownloadedNote(noteId: string): Promise<OfflineNoteItem | null> {
  if (!noteId) return null;
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORES.NOTES, 'readonly');
      const store = tx.objectStore(STORES.NOTES);
      const req = store.get(noteId);
      req.onsuccess = () => resolve(req.result || memoryNotes.get(noteId) || null);
      req.onerror = () => resolve(memoryNotes.get(noteId) || null);
    });
  } catch {
    return memoryNotes.get(noteId) || null;
  }
}

export async function saveNoteOffline(
  note: {
    id: string;
    title: string;
    subject?: string;
    chapter?: string;
    content?: string;
    pdfUrl?: string;
  },
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; item?: OfflineNoteItem; error?: string }> {
  try {
    if (onProgress) onProgress(15);
    let blob: Blob | undefined;
    let size = (note.content || '').length;

    // If note has a PDF attachment, fetch and store the blob
    if (note.pdfUrl && (note.pdfUrl.startsWith('http://') || note.pdfUrl.startsWith('https://'))) {
      if (onProgress) onProgress(35);
      try {
        const resp = await fetch(note.pdfUrl);
        if (resp.ok) {
          blob = await resp.blob();
          size += blob.size;
        }
      } catch (fErr) {
        console.warn('[OfflineStore] Note PDF fetch note:', fErr);
      }
    }

    if (onProgress) onProgress(80);

    const item: OfflineNoteItem = {
      id: note.id,
      title: note.title || 'Untitled Note',
      subject: note.subject || 'General Studies',
      chapter: note.chapter || 'Chapter 1',
      content: note.content || '',
      pdfUrl: note.pdfUrl,
      pdfBlob: blob,
      fileSize: size,
      downloadedAt: Date.now()
    };

    memoryNotes.set(item.id, item);

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.NOTES, 'readwrite');
        const store = tx.objectStore(STORES.NOTES);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (dbErr) {
      console.warn('[OfflineStore] IndexedDB note save note:', dbErr);
    }

    if (onProgress) onProgress(100);
    window.dispatchEvent(new CustomEvent('ethiolearn:offline-content-changed'));
    return { success: true, item };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to download note offline' };
  }
}

export async function deleteDownloadedNote(noteId: string): Promise<void> {
  memoryNotes.delete(noteId);
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORES.NOTES, 'readwrite');
      const store = tx.objectStore(STORES.NOTES);
      const req = store.delete(noteId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {}
  window.dispatchEvent(new CustomEvent('ethiolearn:offline-content-changed'));
}

// ============================================================================
// 2. EXAM PAPERS & QUESTIONS DOWNLOAD & RETRIEVAL
// ============================================================================

export async function isExamDownloaded(examId: string): Promise<boolean> {
  if (!examId) return false;
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORES.EXAMS, 'readonly');
      const store = tx.objectStore(STORES.EXAMS);
      const req = store.get(examId);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(memoryExams.has(examId));
    });
  } catch {
    return memoryExams.has(examId);
  }
}

export async function getDownloadedExam(examId: string): Promise<OfflineExamItem | null> {
  if (!examId) return null;
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORES.EXAMS, 'readonly');
      const store = tx.objectStore(STORES.EXAMS);
      const req = store.get(examId);
      req.onsuccess = () => resolve(req.result || memoryExams.get(examId) || null);
      req.onerror = () => resolve(memoryExams.get(examId) || null);
    });
  } catch {
    return memoryExams.get(examId) || null;
  }
}

export async function saveExamOffline(
  exam: {
    id: string;
    title: string;
    subject?: string;
    university?: string;
    course?: string;
    examType?: string;
    examYear?: string;
    questions?: any[];
    pdfUrl?: string;
  },
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; item?: OfflineExamItem; error?: string }> {
  try {
    if (onProgress) onProgress(20);
    let blob: Blob | undefined;
    const questions = Array.isArray(exam.questions) ? exam.questions : [];
    let size = JSON.stringify(questions).length;

    // If exam has a PDF paper, download it
    if (exam.pdfUrl && (exam.pdfUrl.startsWith('http://') || exam.pdfUrl.startsWith('https://'))) {
      if (onProgress) onProgress(45);
      try {
        const resp = await fetch(exam.pdfUrl);
        if (resp.ok) {
          blob = await resp.blob();
          size += blob.size;
        }
      } catch (fErr) {
        console.warn('[OfflineStore] Exam PDF fetch note:', fErr);
      }
    }

    if (onProgress) onProgress(80);

    const item: OfflineExamItem = {
      id: exam.id,
      title: exam.title || 'University Exam Paper',
      subject: exam.subject || 'General',
      university: exam.university || 'Ethiopian Universities',
      course: exam.course || 'Undergraduate',
      examType: exam.examType || 'Final Exam',
      examYear: exam.examYear || '2016 E.C.',
      totalQuestions: questions.length,
      questions,
      pdfUrl: exam.pdfUrl,
      pdfBlob: blob,
      fileSize: size,
      downloadedAt: Date.now()
    };

    memoryExams.set(item.id, item);

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.EXAMS, 'readwrite');
        const store = tx.objectStore(STORES.EXAMS);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (dbErr) {
      console.warn('[OfflineStore] IndexedDB exam save note:', dbErr);
    }

    if (onProgress) onProgress(100);
    window.dispatchEvent(new CustomEvent('ethiolearn:offline-content-changed'));
    return { success: true, item };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to download exam offline' };
  }
}

export async function deleteDownloadedExam(examId: string): Promise<void> {
  memoryExams.delete(examId);
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORES.EXAMS, 'readwrite');
      const store = tx.objectStore(STORES.EXAMS);
      const req = store.delete(examId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {}
  window.dispatchEvent(new CustomEvent('ethiolearn:offline-content-changed'));
}

// ============================================================================
// 3. GENERAL PDF DOWNLOAD & RETRIEVAL (Books, Modules, Curricula)
// ============================================================================

export async function isPdfDownloaded(pdfId: string): Promise<boolean> {
  if (!pdfId) return false;
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORES.PDFS, 'readonly');
      const store = tx.objectStore(STORES.PDFS);
      const req = store.get(pdfId);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(memoryPdfs.has(pdfId));
    });
  } catch {
    return memoryPdfs.has(pdfId);
  }
}

export async function getDownloadedPdf(pdfId: string): Promise<{ blob: Blob; url: string; item: OfflinePdfItem } | null> {
  if (!pdfId) return null;
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORES.PDFS, 'readonly');
      const store = tx.objectStore(STORES.PDFS);
      const req = store.get(pdfId);
      req.onsuccess = () => {
        const item = (req.result || memoryPdfs.get(pdfId)) as OfflinePdfItem | undefined;
        if (item && item.pdfBlob) {
          const url = URL.createObjectURL(item.pdfBlob);
          resolve({ blob: item.pdfBlob, url, item });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    const item = memoryPdfs.get(pdfId);
    if (item && item.pdfBlob) {
      return { blob: item.pdfBlob, url: URL.createObjectURL(item.pdfBlob), item };
    }
    return null;
  }
}

export async function savePdfOffline(
  item: {
    id: string;
    title: string;
    category: 'book' | 'note' | 'exam';
    url: string;
  },
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<{ success: boolean; item?: OfflinePdfItem; error?: string }> {
  try {
    if (onProgress) onProgress(5, 0, 0);

    const resp = await fetch(item.url);
    if (!resp.ok) {
      throw new Error(`Download failed with status ${resp.status}`);
    }

    const contentLength = resp.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    let blob: Blob;

    if (resp.body && window.ReadableStream) {
      const reader = resp.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (totalBytes > 0 && onProgress) {
            onProgress(Math.min(99, Math.round((loaded / totalBytes) * 100)), loaded, totalBytes);
          } else if (onProgress) {
            onProgress(50, loaded, 0);
          }
        }
      }
      blob = new Blob(chunks, { type: 'application/pdf' });
    } else {
      const buffer = await resp.arrayBuffer();
      blob = new Blob([buffer], { type: 'application/pdf' });
    }

    const offlineRecord: OfflinePdfItem = {
      id: item.id,
      title: item.title,
      category: item.category,
      pdfBlob: blob,
      fileSize: blob.size,
      downloadedAt: Date.now(),
      originalUrl: item.url
    };

    memoryPdfs.set(offlineRecord.id, offlineRecord);

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.PDFS, 'readwrite');
        const store = tx.objectStore(STORES.PDFS);
        const req = store.put(offlineRecord);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[OfflineStore] IndexedDB PDF save fallback to memory:', e);
    }

    if (onProgress) onProgress(100, blob.size, blob.size);
    window.dispatchEvent(new CustomEvent('ethiolearn:offline-content-changed'));
    return { success: true, item: offlineRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'PDF download failed' };
  }
}

export async function deleteDownloadedPdf(pdfId: string): Promise<void> {
  memoryPdfs.delete(pdfId);
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORES.PDFS, 'readwrite');
      const store = tx.objectStore(STORES.PDFS);
      const req = store.delete(pdfId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {}
  window.dispatchEvent(new CustomEvent('ethiolearn:offline-content-changed'));
}

// ============================================================================
// 4. STORAGE AUDIT & AGGREGATE STATS
// ============================================================================

export interface OfflineStorageOverview {
  notesCount: number;
  examsCount: number;
  pdfsCount: number;
  totalItems: number;
  totalBytes: number;
  formattedTotal: string;
  notes: OfflineNoteItem[];
  exams: OfflineExamItem[];
  pdfs: OfflinePdfItem[];
}

export function formatStorageBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function getOfflineStorageOverview(): Promise<OfflineStorageOverview> {
  const notes: OfflineNoteItem[] = [];
  const exams: OfflineExamItem[] = [];
  const pdfs: OfflinePdfItem[] = [];

  try {
    const db = await openDB();

    await new Promise<void>((resolve) => {
      const tx = db.transaction([STORES.NOTES, STORES.EXAMS, STORES.PDFS], 'readonly');

      tx.objectStore(STORES.NOTES).getAll().onsuccess = (e: any) => {
        (e.target.result || []).forEach((n: any) => notes.push(n));
      };

      tx.objectStore(STORES.EXAMS).getAll().onsuccess = (e: any) => {
        (e.target.result || []).forEach((ex: any) => exams.push(ex));
      };

      tx.objectStore(STORES.PDFS).getAll().onsuccess = (e: any) => {
        (e.target.result || []).forEach((p: any) => pdfs.push(p));
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    memoryNotes.forEach(v => notes.push(v));
    memoryExams.forEach(v => exams.push(v));
    memoryPdfs.forEach(v => pdfs.push(v));
  }

  // De-duplicate with memory entries
  const notesMap = new Map<string, OfflineNoteItem>();
  notes.forEach(n => notesMap.set(n.id, n));
  memoryNotes.forEach((n, k) => notesMap.set(k, n));

  const examsMap = new Map<string, OfflineExamItem>();
  exams.forEach(e => examsMap.set(e.id, e));
  memoryExams.forEach((e, k) => examsMap.set(k, e));

  const pdfsMap = new Map<string, OfflinePdfItem>();
  pdfs.forEach(p => pdfsMap.set(p.id, p));
  memoryPdfs.forEach((p, k) => pdfsMap.set(k, p));

  const finalNotes = Array.from(notesMap.values());
  const finalExams = Array.from(examsMap.values());
  const finalPdfs = Array.from(pdfsMap.values());

  const totalBytes =
    finalNotes.reduce((acc, n) => acc + (n.fileSize || 0), 0) +
    finalExams.reduce((acc, e) => acc + (e.fileSize || 0), 0) +
    finalPdfs.reduce((acc, p) => acc + (p.fileSize || 0), 0);

  return {
    notesCount: finalNotes.length,
    examsCount: finalExams.length,
    pdfsCount: finalPdfs.length,
    totalItems: finalNotes.length + finalExams.length + finalPdfs.length,
    totalBytes,
    formattedTotal: formatStorageBytes(totalBytes),
    notes: finalNotes,
    exams: finalExams,
    pdfs: finalPdfs
  };
}

// ============================================================================
// 5. PROGRESS QUEUE & SUPABASE SYNCHRONIZATION ENGINE
// ============================================================================

/**
 * Enqueue student learning action while offline (exam attempt, note reading progress, streak)
 */
export async function enqueueOfflineProgress(
  email: string,
  type: 'exam_attempt' | 'note_read' | 'quiz_score',
  payload: any
): Promise<void> {
  if (!email || !payload) return;

  const item: OfflineProgressQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: email.toLowerCase().trim(),
    type,
    payload,
    createdAt: Date.now(),
    synced: false,
    retryCount: 0
  };

  memoryQueue.push(item);

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORES.QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.QUEUE);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('[OfflineQueue] Queued in memory fallback:', e);
  }

  // Also preserve in safeStorage backup
  try {
    const backupKey = `ethiolearn_offline_queue_${email}`;
    const raw = safeStorage.getItem(backupKey);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(item);
    safeStorage.setItem(backupKey, JSON.stringify(existing));
  } catch {}
}

/**
 * Get all unsynced queue items for student
 */
export async function getPendingProgressQueue(email?: string): Promise<OfflineProgressQueueItem[]> {
  const items: OfflineProgressQueueItem[] = [];
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORES.QUEUE, 'readonly');
      const store = tx.objectStore(STORES.QUEUE);
      const req = store.getAll();
      req.onsuccess = () => {
        (req.result || []).forEach((it: OfflineProgressQueueItem) => {
          if (!it.synced && (!email || it.email === email.toLowerCase().trim())) {
            items.push(it);
          }
        });
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch {
    memoryQueue.forEach(it => {
      if (!it.synced && (!email || it.email === email.toLowerCase().trim())) {
        items.push(it);
      }
    });
  }
  return items;
}

/**
 * Safely flush offline learning progress to Supabase when reconnected.
 * Performs deep merge to prevent overwriting or deleting existing records.
 */
export async function syncOfflineProgressWithSupabase(
  studentEmail?: string
): Promise<{ success: boolean; syncedCount: number; errors: any[] }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, syncedCount: 0, errors: ['Network offline'] };
  }

  const supa = getSupabase();
  if (!supa) {
    return { success: false, syncedCount: 0, errors: ['Supabase client not initialized'] };
  }

  const pending = await getPendingProgressQueue(studentEmail);
  if (pending.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  const errors: any[] = [];
  let syncedCount = 0;

  // Group pending actions by email
  const byEmail = new Map<string, OfflineProgressQueueItem[]>();
  pending.forEach(item => {
    const list = byEmail.get(item.email) || [];
    list.push(item);
    byEmail.set(item.email, list);
  });

  for (const [email, actions] of byEmail.entries()) {
    try {
      // 1. Fetch current remote record to safely merge
      const { data: existingRow, error: fetchErr } = await supa
        .from('student_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (fetchErr) {
        errors.push(fetchErr.message);
        continue;
      }

      // Safe deep merge without deleting existing records
      const existingSessions = Array.isArray(existingRow?.study_sessions) ? existingRow.study_sessions : [];
      const existingNotes = Array.isArray(existingRow?.notes_data) ? existingRow.notes_data : [];
      const existingPerf = (existingRow?.performance_data && typeof existingRow.performance_data === 'object')
        ? existingRow.performance_data
        : {};

      const newSessions = [...existingSessions];
      const newNotes = [...existingNotes];
      const newPerf = { ...existingPerf };

      actions.forEach(action => {
        if (action.type === 'exam_attempt') {
          // Check for duplicate attempt ID to avoid double-counting
          const attemptId = action.payload?.id || `attempt_${action.createdAt}`;
          if (!newSessions.some((s: any) => s.id === attemptId)) {
            newSessions.push({
              ...action.payload,
              id: attemptId,
              syncedAt: new Date().toISOString()
            });
          }
        } else if (action.type === 'note_read') {
          // Update or add note state
          const noteId = action.payload?.note_id || action.payload?.id;
          const idx = newNotes.findIndex((n: any) => n.id === noteId);
          if (idx >= 0) {
            newNotes[idx] = { ...newNotes[idx], ...action.payload };
          } else if (action.payload) {
            newNotes.push(action.payload);
          }
        } else if (action.type === 'quiz_score') {
          const quizKey = action.payload?.subject || 'general';
          newPerf[quizKey] = {
            ...(newPerf[quizKey] || {}),
            ...action.payload,
            lastUpdated: new Date().toISOString()
          };
        }
      });

      // 2. Perform safe non-destructive upsert
      const updatePayload: Record<string, any> = {
        email,
        study_sessions: newSessions,
        notes_data: newNotes,
        performance_data: newPerf,
        updated_at: new Date().toISOString()
      };

      if (existingRow) {
        if (existingRow.name) updatePayload.name = existingRow.name;
        if (existingRow.university) updatePayload.university = existingRow.university;
        if (existingRow.year) updatePayload.year = existingRow.year;
        if (existingRow.profile_data) updatePayload.profile_data = existingRow.profile_data;
        if (existingRow.is_pro !== undefined) updatePayload.is_pro = existingRow.is_pro;
        if (existingRow.pro_status) updatePayload.pro_status = existingRow.pro_status;
      }

      const { error: upsertErr } = await supa
        .from('student_profiles')
        .upsert(updatePayload, { onConflict: 'email' });

      if (upsertErr) {
        errors.push(upsertErr.message);
        continue;
      }

      // 3. Mark items as synced in IndexedDB
      try {
        const db = await openDB();
        const tx = db.transaction(STORES.QUEUE, 'readwrite');
        const store = tx.objectStore(STORES.QUEUE);
        actions.forEach(a => {
          store.delete(a.id);
        });
        await new Promise<void>((res) => {
          tx.oncomplete = () => res();
          tx.onerror = () => res();
        });
      } catch {}

      // Clear synced from memory queue
      actions.forEach(a => {
        const idx = memoryQueue.findIndex(m => m.id === a.id);
        if (idx >= 0) memoryQueue.splice(idx, 1);
      });

      // Clean local storage queue backup
      try {
        const backupKey = `ethiolearn_offline_queue_${email}`;
        safeStorage.removeItem(backupKey);
      } catch {}

      syncedCount += actions.length;
    } catch (e: any) {
      errors.push(e?.message || 'Unknown sync error');
    }
  }

  if (syncedCount > 0) {
    window.dispatchEvent(new CustomEvent('ethiolearn:offline-synced', {
      detail: { count: syncedCount }
    }));
  }

  return {
    success: errors.length === 0,
    syncedCount,
    errors
  };
}

// ============================================================================
// 5. UNIVERSITIES & LOGOS CACHING (Supabase & Offline)
// ============================================================================

export async function saveUniversitiesOffline(items: OfflineUniversityItem[]): Promise<boolean> {
  if (!items || items.length === 0) return false;
  items.forEach(u => memoryUniversities.set(u.name, u));
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.UNIVERSITIES, 'readwrite');
      const store = tx.objectStore(STORES.UNIVERSITIES);
      items.forEach(u => store.put(u));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch (err) {
    console.warn('[OfflineStore] Failed to save universities in IndexedDB:', err);
    return false;
  }
}

export async function getOfflineUniversities(): Promise<OfflineUniversityItem[]> {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORES.UNIVERSITIES, 'readonly');
      const store = tx.objectStore(STORES.UNIVERSITIES);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as OfflineUniversityItem[];
        if (results && results.length > 0) {
          results.forEach(u => memoryUniversities.set(u.name, u));
          resolve(results);
        } else {
          resolve(Array.from(memoryUniversities.values()));
        }
      };
      req.onerror = () => resolve(Array.from(memoryUniversities.values()));
    });
  } catch {
    return Array.from(memoryUniversities.values());
  }
}

export async function getOfflineUniversityByName(name: string): Promise<OfflineUniversityItem | null> {
  if (!name) return null;
  if (memoryUniversities.has(name)) return memoryUniversities.get(name)!;
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORES.UNIVERSITIES, 'readonly');
      const store = tx.objectStore(STORES.UNIVERSITIES);
      const req = store.get(name);
      req.onsuccess = () => {
        if (req.result) {
          memoryUniversities.set(name, req.result);
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return memoryUniversities.get(name) || null;
  }
}

// Auto-trigger sync when connectivity is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineStore] Connection restored. Synchronizing offline progress to Supabase...');
    syncOfflineProgressWithSupabase().catch(err => {
      console.warn('[OfflineStore] Reconnection sync notice:', err);
    });
  });
}
