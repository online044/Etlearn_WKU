/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Client Content Store for Books & Exam Sheets
 */

import { BookRecord, ExamSheetRecord, StudentProfile } from '../types';
import { getSessionToken } from './supabaseClient';
import { db } from './firebaseStore';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  const token = getSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-ethiolearn-session-token'] = token;
  }
  return headers;
}

/**
 * Convert a File object to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// ============================================================================
// STUDENT PUBLIC CONTENT APIS
// ============================================================================

export interface BookFilters {
  university?: string;
  department?: string;
  academicYear?: string;
  course?: string;
  subject?: string;
  accessLevel?: string;
  search?: string;
}

export interface ExamFilters {
  university?: string;
  department?: string;
  academicYear?: string;
  course?: string;
  subject?: string;
  examType?: string;
  examYear?: string;
  accessLevel?: string;
  search?: string;
}

/**
 * Fetch all published books with server filtering and Firestore synchronization
 */
export async function fetchPublishedBooks(filters: BookFilters = {}): Promise<BookRecord[]> {
  try {
    const params = new URLSearchParams();
    if (filters.university && filters.university !== 'all') params.append('university', filters.university);
    if (filters.department && filters.department !== 'all') params.append('department', filters.department);
    if (filters.academicYear && filters.academicYear !== 'all') params.append('academicYear', filters.academicYear);
    if (filters.course && filters.course !== 'all') params.append('course', filters.course);
    if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
    if (filters.accessLevel && filters.accessLevel !== 'all') params.append('accessLevel', filters.accessLevel);
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());

    const res = await fetch(`/api/books?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.books)) {
        return data.books;
      }
    }
  } catch (e) {
    console.warn('[ContentStore] Server books API error, checking Firestore:', e);
  }

  // Fallback to Firestore
  try {
    if (db) {
      const q = query(collection(db, 'books'), where('status', '==', 'published'));
      const snapshot = await getDocs(q);
      const books: BookRecord[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data() as BookRecord;
        books.push({ ...item, id: docSnap.id });
      });
      return books;
    }
  } catch (e) {
    console.warn('[ContentStore] Firestore books fallback query error:', e);
  }

  return [];
}

/**
 * Fetch all published exam sheets with server filtering
 */
export async function fetchPublishedExams(filters: ExamFilters = {}): Promise<ExamSheetRecord[]> {
  try {
    const params = new URLSearchParams();
    if (filters.university && filters.university !== 'all') params.append('university', filters.university);
    if (filters.department && filters.department !== 'all') params.append('department', filters.department);
    if (filters.academicYear && filters.academicYear !== 'all') params.append('academicYear', filters.academicYear);
    if (filters.course && filters.course !== 'all') params.append('course', filters.course);
    if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
    if (filters.examType && filters.examType !== 'all') params.append('examType', filters.examType);
    if (filters.examYear && filters.examYear !== 'all') params.append('examYear', filters.examYear);
    if (filters.accessLevel && filters.accessLevel !== 'all') params.append('accessLevel', filters.accessLevel);
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());

    const res = await fetch(`/api/exams?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.exams)) {
        return data.exams;
      }
    }
  } catch (e) {
    console.warn('[ContentStore] Server exams API error, checking Firestore:', e);
  }

  // Fallback to Firestore
  try {
    if (db) {
      const q = query(collection(db, 'exam_sheets'), where('status', '==', 'published'));
      const snapshot = await getDocs(q);
      const exams: ExamSheetRecord[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data() as ExamSheetRecord;
        exams.push({ ...item, id: docSnap.id });
      });
      return exams;
    }
  } catch (e) {
    console.warn('[ContentStore] Firestore exams fallback query error:', e);
  }

  return [];
}

/**
 * Request server-side access token to view a book or exam sheet
 */
export async function requestContentViewUrl(
  itemId: string,
  type: 'book' | 'exam',
  profile?: StudentProfile
): Promise<{ success: boolean; url?: string; error?: string; code?: string }> {
  try {
    const res = await fetch('/api/content/access-token', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: itemId,
        type,
        action: 'view'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Access denied.',
        code: data.code || 'ACCESS_DENIED'
      };
    }

    return {
      success: true,
      url: data.streamUrl
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message || 'Failed to initialize secure stream.'
    };
  }
}

/**
 * Request server-side access token to download a book or exam sheet
 */
export async function requestContentDownload(
  itemId: string,
  type: 'book' | 'exam',
  fileName: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const res = await fetch('/api/content/access-token', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: itemId,
        type,
        action: 'download'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Download not permitted.',
        code: data.code || 'DOWNLOAD_FORBIDDEN'
      };
    }

    // Trigger browser download via stream URL
    const a = document.createElement('a');
    a.href = data.streamUrl;
    a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return { success: true };
  } catch (e: any) {
    return {
      success: false,
      error: e.message || 'Download initialization failed.'
    };
  }
}

// ============================================================================
// ADMIN CONSOLE CONTENT MANAGEMENT APIS
// ============================================================================

async function safeParseResponse(res: Response): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const status = res.status;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const json = await res.json();
      return { ok: res.ok, status, data: json, error: json.error || json.message };
    } catch (err: any) {
      return { ok: false, status, data: null, error: `Invalid JSON response from server: ${err.message}` };
    }
  } else {
    try {
      const text = await res.text();
      return {
        ok: res.ok,
        status,
        data: null,
        error: text.length < 200 && !text.includes('<!DOCTYPE') ? text : `Server error (HTTP ${status})`
      };
    } catch {
      return { ok: false, status, data: null, error: `Server error (HTTP ${status})` };
    }
  }
}

/**
 * Fetch all books for Admin Console (draft, published, archived)
 */
export async function fetchAdminBooks(): Promise<BookRecord[]> {
  try {
    const res = await fetch('/api/admin/books', {
      headers: getAuthHeaders()
    });
    const parsed = await safeParseResponse(res);
    if (parsed.ok && parsed.data?.success && Array.isArray(parsed.data.books)) {
      return parsed.data.books;
    }
  } catch (e) {
    console.error('[ContentStore] fetchAdminBooks error:', e);
  }
  return [];
}

/**
 * Create or update a book record with optional PDF and Cover file uploads
 */
export async function saveAdminBook(
  bookData: Partial<BookRecord>,
  pdfFile?: File | null,
  coverFile?: File | null
): Promise<{ success: boolean; book?: BookRecord; error?: string }> {
  try {
    const bookId = bookData.id || `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let pdfStoragePath = bookData.pdfStoragePath || '';
    let coverUrl = bookData.coverUrl || '';
    let fileSize = bookData.fileSize || 0;

    // 1. Validate & Upload PDF if provided
    if (pdfFile) {
      if (!pdfFile.name.toLowerCase().endsWith('.pdf') && pdfFile.type !== 'application/pdf') {
        return { success: false, error: 'The selected file is not a valid PDF document.' };
      }
      if (pdfFile.size > 50 * 1024 * 1024) {
        return { success: false, error: 'PDF file size exceeds the 50MB limit.' };
      }

      const base64 = await fileToBase64(pdfFile);
      const uploadRes = await fetch('/api/admin/books/upload-pdf', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bookId,
          fileName: pdfFile.name,
          fileBase64: base64,
          fileSize: pdfFile.size
        })
      });
      const parsedUpload = await safeParseResponse(uploadRes);
      if (!parsedUpload.ok || !parsedUpload.data?.success) {
        return {
          success: false,
          error: parsedUpload.data?.error || parsedUpload.error || 'Failed to upload PDF file to server storage.'
        };
      }
      pdfStoragePath = parsedUpload.data.pdfStoragePath;
      fileSize = parsedUpload.data.fileSize;
    }

    // 2. Upload Cover Image if provided
    if (coverFile) {
      if (coverFile.size > 10 * 1024 * 1024) {
        return { success: false, error: 'Cover image exceeds the 10MB limit.' };
      }
      const base64 = await fileToBase64(coverFile);
      const coverRes = await fetch('/api/admin/books/upload-cover', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bookId,
          fileBase64: base64,
          mimeType: coverFile.type
        })
      });
      const parsedCover = await safeParseResponse(coverRes);
      if (parsedCover.ok && parsedCover.data?.success) {
        coverUrl = parsedCover.data.coverUrl;
      }
    }

    // 3. Save Book record
    const payload: Partial<BookRecord> = {
      ...bookData,
      id: bookId,
      pdfStoragePath,
      coverUrl,
      fileSize: fileSize || bookData.fileSize
    };

    const res = await fetch('/api/admin/books', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const parsed = await safeParseResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      return { success: false, error: parsed.data?.error || parsed.error || 'Failed to save book metadata.' };
    }

    // Synchronize to Firestore for real-time consistency
    if (db && parsed.data.book) {
      try {
        await setDoc(doc(db, 'books', parsed.data.book.id), parsed.data.book);
      } catch (e) {
        console.warn('[ContentStore] Firestore book sync warning:', e);
      }
    }

    return { success: true, book: parsed.data.book };
  } catch (e: any) {
    console.error('[ContentStore] saveAdminBook error:', e);
    return { success: false, error: e.message || 'Failed to save book' };
  }
}

/**
 * Delete a book
 */
export async function deleteAdminBook(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/books/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const parsed = await safeParseResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      return { success: false, error: parsed.data?.error || parsed.error || 'Failed to delete book.' };
    }

    if (db) {
      try {
        await deleteDoc(doc(db, 'books', id));
      } catch (e) { /* ignore */ }
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error deleting book.' };
  }
}

/**
 * Toggle Book published status
 */
export async function togglePublishAdminBook(
  id: string,
  status: 'published' | 'draft' | 'archived'
): Promise<{ success: boolean; book?: BookRecord; error?: string }> {
  try {
    const res = await fetch(`/api/admin/books/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const parsed = await safeParseResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      return { success: false, error: parsed.data?.error || parsed.error || 'Failed to update publication status.' };
    }

    if (db && parsed.data.book) {
      try {
        await setDoc(doc(db, 'books', parsed.data.book.id), parsed.data.book, { merge: true });
      } catch (e) { /* ignore */ }
    }

    return { success: true, book: parsed.data.book };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Fetch all exam sheets for Admin Console
 */
export async function fetchAdminExams(): Promise<ExamSheetRecord[]> {
  try {
    const res = await fetch('/api/admin/exams', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.exams)) {
        return data.exams;
      }
    }
  } catch (e) {
    console.error('[ContentStore] fetchAdminExams error:', e);
  }
  return [];
}

/**
 * Create or update an exam sheet with optional PDF upload
 */
export async function saveAdminExam(
  examData: Partial<ExamSheetRecord>,
  pdfFile?: File | null
): Promise<{ success: boolean; exam?: ExamSheetRecord; error?: string }> {
  try {
    const examId = examData.id || `exam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let pdfStoragePath = examData.pdfStoragePath || '';
    let fileSize = examData.fileSize || 0;

    if (pdfFile) {
      if (!pdfFile.name.toLowerCase().endsWith('.pdf') && pdfFile.type !== 'application/pdf') {
        return { success: false, error: 'The selected exam file is not a valid PDF document.' };
      }
      if (pdfFile.size > 50 * 1024 * 1024) {
        return { success: false, error: 'Exam PDF file size exceeds the 50MB limit.' };
      }

      const base64 = await fileToBase64(pdfFile);
      const uploadRes = await fetch('/api/admin/exams/upload-pdf', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          examId,
          fileName: pdfFile.name,
          fileBase64: base64,
          fileSize: pdfFile.size
        })
      });
      const parsedUpload = await safeParseResponse(uploadRes);
      if (!parsedUpload.ok || !parsedUpload.data?.success) {
        return {
          success: false,
          error: parsedUpload.data?.error || parsedUpload.error || 'Failed to upload exam PDF file.'
        };
      }
      pdfStoragePath = parsedUpload.data.pdfStoragePath;
      fileSize = parsedUpload.data.fileSize;
    }

    const payload: Partial<ExamSheetRecord> = {
      ...examData,
      id: examId,
      pdfStoragePath,
      fileSize: fileSize || examData.fileSize
    };

    const res = await fetch('/api/admin/exams', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const parsed = await safeParseResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      return { success: false, error: parsed.data?.error || parsed.error || 'Failed to save exam sheet metadata.' };
    }

    if (db && parsed.data.exam) {
      try {
        await setDoc(doc(db, 'exam_sheets', parsed.data.exam.id), parsed.data.exam);
      } catch (e) {
        console.warn('[ContentStore] Firestore exam sync warning:', e);
      }
    }

    return { success: true, exam: parsed.data.exam };
  } catch (e: any) {
    console.error('[ContentStore] saveAdminExam error:', e);
    return { success: false, error: e.message || 'Error saving exam sheet.' };
  }
}

/**
 * Delete an exam sheet
 */
export async function deleteAdminExam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/exams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const parsed = await safeParseResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      return { success: false, error: parsed.data?.error || parsed.error || 'Failed to delete exam sheet.' };
    }

    if (db) {
      try {
        await deleteDoc(doc(db, 'exam_sheets', id));
      } catch (e) { /* ignore */ }
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error deleting exam sheet.' };
  }
}

/**
 * Toggle Exam Sheet published status
 */
export async function togglePublishAdminExam(
  id: string,
  status: 'published' | 'draft' | 'archived'
): Promise<{ success: boolean; exam?: ExamSheetRecord; error?: string }> {
  try {
    const res = await fetch(`/api/admin/exams/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const parsed = await safeParseResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      return { success: false, error: parsed.data?.error || parsed.error || 'Failed to update publication status.' };
    }

    if (db && parsed.data.exam) {
      try {
        await setDoc(doc(db, 'exam_sheets', parsed.data.exam.id), parsed.data.exam, { merge: true });
      } catch (e) { /* ignore */ }
    }

    return { success: true, exam: parsed.data.exam };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
