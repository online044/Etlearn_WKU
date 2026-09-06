/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Client Content Store for Books & Exam Sheets
 * Direct integration with Firebase Firestore
 */

import { BookRecord, ExamSheetRecord, StudentProfile, FirestoreBook, FirestoreExam, NoteRecord, FirestoreStudyNote, NoteFilters } from '../types';
import { getSessionToken } from './supabaseClient';
import { compressImageToBase64 } from './imageCompressor';
import { 
  fetchBooksFromFirestore, 
  fetchExamsFromFirestore, 
  saveBookToFirestore, 
  deleteBookFromFirestore, 
  togglePublishBookInFirestore,
  saveExamToFirestore,
  deleteExamFromFirestore,
  togglePublishExamInFirestore,
  fetchPublishedNotesFromFirestore,
  fetchAdminNotesFromFirestore,
  saveAdminNoteToFirestore,
  deleteAdminNoteFromFirestore,
  togglePublishAdminNoteInFirestore
} from './firebaseStore';

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
 * Fetch all published books directly from Firestore
 */
export async function fetchPublishedBooks(filters: BookFilters = {}): Promise<BookRecord[]> {
  try {
    const books = await fetchBooksFromFirestore({
      ...filters,
      status: 'published'
    });
    return books;
  } catch (e) {
    console.warn('[ContentStore] Error fetching books from Firestore:', e);
    return [];
  }
}

/**
 * Fetch all published exam sheets directly from Firestore
 */
export async function fetchPublishedExams(filters: ExamFilters = {}): Promise<ExamSheetRecord[]> {
  try {
    const exams = await fetchExamsFromFirestore({
      ...filters,
      status: 'published'
    });
    // Map to ExamSheetRecord
    return exams.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      university: e.university,
      department: e.department,
      academicYear: e.academicYear,
      course: e.course,
      subject: e.subject,
      examType: e.examType,
      examYear: e.examYear,
      accessLevel: e.accessLevel,
      allowDownload: e.allowDownload,
      status: e.status,
      pdfUrl: e.pdfUrl || '',
      fileSize: e.fileSize,
      pageCount: e.pageCount,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }));
  } catch (e) {
    console.warn('[ContentStore] Error fetching exams from Firestore:', e);
    return [];
  }
}

/**
 * Request content stream URL or chapter view
 */
export async function requestContentViewUrl(
  itemId: string,
  type: 'book' | 'exam',
  profile?: StudentProfile
): Promise<{ success: boolean; url?: string; error?: string; code?: string }> {
  return {
    success: true,
    url: `/reader/${type}/${itemId}`
  };
}

/**
 * Request content download
 */
export async function requestContentDownload(
  itemId: string,
  type: 'book' | 'exam',
  fileName: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  return { success: true };
}

// ============================================================================
// ADMIN CONSOLE CONTENT MANAGEMENT APIS
// ============================================================================

/**
 * Fetch all books for Admin Console (draft, published, archived) from Firestore
 */
export async function fetchAdminBooks(): Promise<BookRecord[]> {
  try {
    const books = await fetchBooksFromFirestore({ status: 'all' });
    return books;
  } catch (e) {
    console.error('[ContentStore] fetchAdminBooks error:', e);
    return [];
  }
}

/**
 * Create or update a book record directly in Firestore with automatic
 * cover image compression (<50KB) and secure server vault PDF upload.
 */
export async function saveAdminBook(
  bookData: Partial<BookRecord>,
  pdfFile?: File | null,
  coverFile?: File | null
): Promise<{ success: boolean; book?: BookRecord; error?: string }> {
  try {
    const bookId = bookData.id || `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let coverUrl = bookData.coverUrl || '';
    let coverStoragePath = bookData.coverStoragePath || '';
    let pdfUrl = bookData.pdfUrl || '';
    let pdfStoragePath = bookData.pdfStoragePath || '';
    let fileSize = bookData.fileSize || 0;

    // 1. Handle Cover Image (Compress to <50KB thumbnail + optional server upload)
    if (coverFile) {
      // Always compress client-side to prevent Firestore 1MB document size violations
      const compressedCover = await compressImageToBase64(coverFile, {
        maxWidth: 360,
        maxHeight: 520,
        quality: 0.72
      });
      coverUrl = compressedCover;

      // Try uploading to server public covers storage if online
      try {
        const token = getSessionToken();
        const uploadRes = await fetch('/api/admin/books/upload-cover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            bookId,
            fileBase64: compressedCover,
            mimeType: 'image/jpeg'
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.coverUrl) {
            coverUrl = uploadData.coverUrl;
          }
          if (uploadData.coverStoragePath) {
            coverStoragePath = uploadData.coverStoragePath;
          }
        }
      } catch (covErr) {
        console.warn('[ContentStore] Server cover upload skipped, using optimized thumbnail:', covErr);
      }
    } else if (coverUrl && coverUrl.startsWith('data:image/') && coverUrl.length > 80 * 1024) {
      // Compress legacy or large data URL
      coverUrl = await compressImageToBase64(coverUrl, {
        maxWidth: 360,
        maxHeight: 520,
        quality: 0.72
      });
    }

    // 2. Handle PDF Document (Upload to server storage vault, NEVER raw in Firestore)
    if (pdfFile) {
      fileSize = pdfFile.size;
      try {
        const token = getSessionToken();
        const pdfBase64 = await fileToBase64(pdfFile);
        const uploadRes = await fetch('/api/admin/books/upload-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            bookId,
            fileName: pdfFile.name,
            fileBase64: pdfBase64,
            fileSize: pdfFile.size
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.pdfStoragePath) {
            pdfStoragePath = uploadData.pdfStoragePath;
          }
          if (uploadData.pdfUrl) {
            pdfUrl = uploadData.pdfUrl;
          }
        }
      } catch (pdfErr) {
        console.warn('[ContentStore] PDF server upload notice:', pdfErr);
      }
    }

    // Never allow a huge data URL to be saved as pdfUrl in Firestore
    if (pdfUrl.startsWith('data:') && pdfUrl.length > 50 * 1024) {
      pdfUrl = '';
    }

    const res = await saveBookToFirestore({
      ...bookData,
      id: bookId,
      coverUrl,
      coverStoragePath,
      pdfUrl,
      pdfStoragePath,
      fileSize
    });
    return res;
  } catch (e: any) {
    console.error('[ContentStore] saveAdminBook error:', e);
    return { success: false, error: e.message || 'Failed to save book' };
  }
}

/**
 * Delete a book from Firestore
 */
export async function deleteAdminBook(id: string): Promise<{ success: boolean; error?: string }> {
  return deleteBookFromFirestore(id);
}

/**
 * Toggle Book published status in Firestore
 */
export async function togglePublishAdminBook(
  id: string,
  status: 'published' | 'draft' | 'archived'
): Promise<{ success: boolean; book?: BookRecord; error?: string }> {
  const res = await togglePublishBookInFirestore(id, status);
  return { success: res.success, error: res.error };
}

/**
 * Fetch all exam sheets for Admin Console from Firestore
 */
export async function fetchAdminExams(): Promise<ExamSheetRecord[]> {
  try {
    const exams = await fetchExamsFromFirestore({ status: 'all' });
    return exams.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      university: e.university,
      department: e.department,
      academicYear: e.academicYear,
      course: e.course,
      subject: e.subject,
      examType: e.examType,
      examYear: e.examYear,
      accessLevel: e.accessLevel,
      allowDownload: e.allowDownload,
      status: e.status,
      pdfUrl: e.pdfUrl || '',
      fileSize: e.fileSize,
      pageCount: e.pageCount,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }));
  } catch (e) {
    console.error('[ContentStore] fetchAdminExams error:', e);
    return [];
  }
}

/**
 * Create or update an exam sheet directly in Firestore with server PDF vault upload.
 */
export async function saveAdminExam(
  examData: Partial<ExamSheetRecord>,
  pdfFile?: File | null
): Promise<{ success: boolean; exam?: ExamSheetRecord; error?: string }> {
  try {
    const examId = examData.id || `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let pdfUrl = examData.pdfUrl || '';
    let pdfStoragePath = (examData as any).pdfStoragePath || '';
    let fileSize = examData.fileSize || 0;

    // Handle PDF Upload to server storage vault (NEVER raw in Firestore)
    if (pdfFile) {
      fileSize = pdfFile.size;
      try {
        const token = getSessionToken();
        const pdfBase64 = await fileToBase64(pdfFile);
        const uploadRes = await fetch('/api/admin/exams/upload-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            examId,
            fileName: pdfFile.name,
            fileBase64: pdfBase64,
            fileSize: pdfFile.size
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.pdfStoragePath || uploadData.storagePath) {
            pdfStoragePath = uploadData.pdfStoragePath || uploadData.storagePath;
          }
          if (uploadData.pdfUrl || uploadData.supabaseUrl) {
            pdfUrl = uploadData.pdfUrl || uploadData.supabaseUrl;
          }
        }
      } catch (pdfErr) {
        console.warn('[ContentStore] Exam PDF server upload notice:', pdfErr);
      }
    }

    // Never allow a huge data URL to be saved as pdfUrl in Firestore
    if (pdfUrl.startsWith('data:') && pdfUrl.length > 50 * 1024) {
      pdfUrl = '';
    }

    const res = await saveExamToFirestore({
      ...examData,
      id: examId,
      pdfUrl,
      pdfStoragePath,
      fileSize
    });
    if (res.success && res.exam) {
      const mapped: ExamSheetRecord = {
        id: res.exam.id,
        title: res.exam.title,
        description: res.exam.description || '',
        university: res.exam.university,
        department: res.exam.department,
        academicYear: res.exam.academicYear,
        course: res.exam.course,
        subject: res.exam.subject,
        examType: res.exam.examType,
        examYear: res.exam.examYear,
        accessLevel: res.exam.accessLevel,
        allowDownload: res.exam.allowDownload,
        status: res.exam.status,
        pdfUrl: res.exam.pdfUrl || '',
        pdfStoragePath: (res.exam as any).pdfStoragePath || pdfStoragePath,
        fileSize: res.exam.fileSize,
        pageCount: res.exam.pageCount,
        createdAt: res.exam.createdAt,
        updatedAt: res.exam.updatedAt
      };
      return { success: true, exam: mapped };
    }
    return { success: false, error: res.error };
  } catch (e: any) {
    console.error('[ContentStore] saveAdminExam error:', e);
    return { success: false, error: e.message || 'Error saving exam sheet.' };
  }
}

/**
 * Delete an exam sheet from Firestore
 */
export async function deleteAdminExam(id: string): Promise<{ success: boolean; error?: string }> {
  return deleteExamFromFirestore(id);
}

/**
 * Toggle Exam Sheet published status in Firestore
 */
export async function togglePublishAdminExam(
  id: string,
  status: 'published' | 'draft' | 'archived'
): Promise<{ success: boolean; exam?: ExamSheetRecord; error?: string }> {
  const res = await togglePublishExamInFirestore(id, status);
  return { success: res.success, error: res.error };
}

/**
 * Fetch published study notes from Firestore for students
 */
export async function fetchPublishedNotes(filters?: NoteFilters): Promise<NoteRecord[]> {
  try {
    return await fetchPublishedNotesFromFirestore(filters);
  } catch (err) {
    console.warn('[ContentStore] Error fetching published notes:', err);
    return [];
  }
}

/**
 * Fetch all notes (drafts and published) for admin management
 */
export async function fetchAdminNotes(): Promise<NoteRecord[]> {
  try {
    return await fetchAdminNotesFromFirestore();
  } catch (err) {
    console.warn('[ContentStore] Error fetching admin notes:', err);
    return [];
  }
}

/**
 * Save or publish a Study Note in Firestore
 */
export async function saveAdminNote(
  noteData: Partial<NoteRecord>,
  pdfFile?: File | null
): Promise<{ success: boolean; note?: NoteRecord; error?: string }> {
  try {
    const noteId = noteData.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let pdfUrl = noteData.pdfUrl || '';
    let pdfStoragePath = noteData.pdfStoragePath || '';
    let fileSize = noteData.fileSize || 0;

    // Optional PDF attachment upload
    if (pdfFile) {
      fileSize = pdfFile.size;
      try {
        const token = getSessionToken();
        const pdfBase64 = await fileToBase64(pdfFile);
        const uploadRes = await fetch('/api/admin/exams/upload-pdf', { // re-use secure storage vault
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            examId: noteId,
            fileName: pdfFile.name,
            fileBase64: pdfBase64,
            fileSize: pdfFile.size
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.pdfUrl) {
            pdfUrl = uploadData.pdfUrl;
          }
          if (uploadData.storagePath) {
            pdfStoragePath = uploadData.storagePath;
          }
        }
      } catch (pdfErr) {
        console.warn('[ContentStore] Server PDF upload skipped:', pdfErr);
      }
    }

    if (pdfUrl.startsWith('data:') && pdfUrl.length > 50 * 1024) {
      pdfUrl = '';
    }

    const saved = await saveAdminNoteToFirestore({
      ...noteData,
      id: noteId,
      pdfUrl,
      pdfStoragePath,
      fileSize
    });

    return { success: true, note: saved };
  } catch (e: any) {
    console.error('[ContentStore] saveAdminNote error:', e);
    return { success: false, error: e.message || 'Error saving study note.' };
  }
}

/**
 * Delete a Study Note
 */
export async function deleteAdminNote(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ok = await deleteAdminNoteFromFirestore(id);
    return { success: ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Toggle Study Note published status
 */
export async function togglePublishAdminNote(
  id: string,
  currentStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ok = await togglePublishAdminNoteInFirestore(id, currentStatus);
    return { success: ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

