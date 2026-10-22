/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Client-side In-App Offline Books & PDF Storage Manager
 * Built with durable IndexedDB persistence for offline university studying.
 */

export interface OfflineBookRecord {
  id: string;
  title: string;
  code: string;
  stream: string;
  grade: string;
  semester: string;
  pages: number;
  coverUrl: string;
  description: string;
  amharicDescription: string;
  chapters: string[];
  lecturesCount: number;
  hasVideoLecture: boolean;
  fileSize: number;
  downloadedAt: number;
  pdfBlob: Blob;
}

const DB_NAME = 'ethiolearn_offline_library_v1';
const DB_VERSION = 1;
const STORE_NAME = 'offline_books';

// In-memory fallback if IndexedDB is blocked
const memoryStore = new Map<string, OfflineBookRecord>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
          store.createIndex('stream', 'stream', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open offline database'));
      request.onblocked = () => {
        console.warn('[OfflineDB] IndexedDB upgrade blocked by another open tab.');
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Check if a book is downloaded and available offline
 */
export async function isBookOffline(bookId: string): Promise<boolean> {
  if (!bookId) return false;
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(bookId);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => {
        resolve(memoryStore.has(bookId));
      };
    });
  } catch {
    return memoryStore.has(bookId);
  }
}

/**
 * Retrieve a single downloaded book record with its PDF blob
 */
export async function getOfflineBook(bookId: string): Promise<OfflineBookRecord | null> {
  if (!bookId) return null;
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(bookId);
      req.onsuccess = () => {
        const res = req.result;
        if (res) {
          resolve(res as OfflineBookRecord);
        } else {
          resolve(memoryStore.get(bookId) || null);
        }
      };
      req.onerror = () => {
        resolve(memoryStore.get(bookId) || null);
      };
    });
  } catch {
    return memoryStore.get(bookId) || null;
  }
}

/**
 * Save a downloaded book record with its PDF blob into IndexedDB
 */
export async function saveBookOffline(record: OfflineBookRecord): Promise<void> {
  if (!record || !record.id) return;
  memoryStore.set(record.id, record);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to save offline book'));
    });
  } catch (err) {
    console.warn('[OfflineDB] IndexedDB save fallback to memory:', err);
  }
}

/**
 * Delete a downloaded book from local storage to free space
 */
export async function deleteOfflineBook(bookId: string): Promise<void> {
  if (!bookId) return;
  memoryStore.delete(bookId);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(bookId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to delete offline book'));
    });
  } catch (err) {
    console.warn('[OfflineDB] IndexedDB delete error:', err);
  }
}

/**
 * Get all downloaded book IDs for fast lookup in bookstore
 */
export async function getAllOfflineBookIds(): Promise<string[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        const keys = (req.result || []).map(k => String(k));
        const all = Array.from(new Set([...keys, ...memoryStore.keys()]));
        resolve(all);
      };
      req.onerror = () => {
        resolve(Array.from(memoryStore.keys()));
      };
    });
  } catch {
    return Array.from(memoryStore.keys());
  }
}

/**
 * Get all downloaded book records
 */
export async function getAllOfflineBooks(): Promise<OfflineBookRecord[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []) as OfflineBookRecord[];
        const map = new Map<string, OfflineBookRecord>();
        items.forEach(item => map.set(item.id, item));
        memoryStore.forEach((item, id) => map.set(id, item));
        resolve(Array.from(map.values()));
      };
      req.onerror = () => {
        resolve(Array.from(memoryStore.values()));
      };
    });
  } catch {
    return Array.from(memoryStore.values());
  }
}

/**
 * Format bytes into human readable string (e.g. 5.2 MB)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Extract Google Drive fileId from any drive link format
 */
export function extractDriveFileId(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) ||
                url.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/) ||
                url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return match && match[1] ? match[1] : '';
}

/**
 * In-app download executor with real-time percentage tracking for Supabase Storage PDFs
 */
export async function downloadBookInApp(
  book: {
    id: string;
    title: string;
    code?: string;
    stream?: string;
    grade?: string;
    semester?: string;
    pages?: number;
    coverUrl?: string;
    description?: string;
    amharicDescription?: string;
    chapters?: string[];
    lectures?: any[];
    hasVideoLecture?: boolean;
    downloadUrl?: string;
    pdfUrl?: string;
  },
  onProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void
): Promise<{ success: boolean; record?: OfflineBookRecord; error?: string }> {
  try {
    // 1. Check if already downloaded
    const existing = await getOfflineBook(book.id);
    if (existing && existing.pdfBlob && existing.pdfBlob.size > 0) {
      if (onProgress) onProgress(100, existing.fileSize, existing.fileSize);
      return { success: true, record: existing };
    }

    if (onProgress) onProgress(5, 0, 0);

    const targetUrl = book.downloadUrl || book.pdfUrl || '';
    let response: Response | null = null;
    
    // Attempt 1: Direct fetch from Supabase Storage Public URL
    if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      try {
        const directResp = await fetch(targetUrl);
        if (directResp.ok && directResp.headers.get('content-type')?.includes('application/')) {
          response = directResp;
        }
      } catch (dirErr) {
        console.warn('[OfflineDB] Direct Supabase Storage fetch notice:', dirErr);
      }
    }

    // Attempt 2: Local proxy with custom url param
    if (!response || !response.ok) {
      try {
        const proxyUrl = `/api/books/download-pdf?id=${encodeURIComponent(book.id)}&url=${encodeURIComponent(targetUrl)}`;
        const pResp = await fetch(proxyUrl);
        if (pResp.ok) {
          response = pResp;
        }
      } catch (pErr) {
        console.warn('[OfflineDB] Proxy attempt error:', pErr);
      }
    }

    // Attempt 3: Local proxy alias
    if (!response || !response.ok) {
      try {
        const proxyUrl2 = `/api/pdf/proxy?id=${encodeURIComponent(book.id)}&url=${encodeURIComponent(targetUrl)}`;
        const pResp2 = await fetch(proxyUrl2);
        if (pResp2.ok) {
          response = pResp2;
        }
      } catch (pErr2) {
        console.warn('[OfflineDB] Secondary proxy attempt error:', pErr2);
      }
    }

    if (!response || !response.ok) {
      const status = response ? response.status : 502;
      throw new Error(`Download service temporarily unavailable (status ${status}). Please check network or retry.`);
    }

    const contentLengthHeader = response.headers.get('content-length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

    let blob: Blob;

    // Stream reader for live percentage progress
    if (response.body && window.ReadableStream) {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loadedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loadedBytes += value.length;
          if (totalBytes > 0 && onProgress) {
            const pct = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));
            onProgress(pct, loadedBytes, totalBytes);
          } else if (onProgress) {
            onProgress(50, loadedBytes, 0);
          }
        }
      }

      blob = new Blob(chunks, { type: 'application/pdf' });
    } else {
      const arrayBuffer = await response.arrayBuffer();
      blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    }

    if (onProgress) onProgress(100, blob.size, blob.size);

    const record: OfflineBookRecord = {
      id: book.id,
      title: book.title,
      code: book.code || 'MOD',
      stream: book.stream || 'Common',
      grade: book.grade || 'Freshman',
      semester: book.semester || 'Semester I',
      pages: book.pages || 160,
      coverUrl: book.coverUrl || '',
      description: book.description || '',
      amharicDescription: book.amharicDescription || '',
      chapters: book.chapters || ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4'],
      lecturesCount: book.lectures?.length || 0,
      hasVideoLecture: Boolean(book.hasVideoLecture),
      fileSize: blob.size,
      downloadedAt: Date.now(),
      pdfBlob: blob
    };

    await saveBookOffline(record);
    return { success: true, record };
  } catch (err: any) {
    console.error('[OfflineDB] downloadBookInApp failed:', err);
    return { success: false, error: err?.message || 'Download failed.' };
  }
}
