/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Client Content Store for Books & Exam Sheets
 * Direct integration with Firebase Firestore
 */

import { BookRecord, ExamSheetRecord, StudentProfile, FirestoreBook, FirestoreExam } from '../types';
import { getSessionToken } from './supabaseClient';
import { 
  fetchBooksFromFirestore, 
  fetchExamsFromFirestore, 
  saveBookToFirestore, 
  deleteBookFromFirestore, 
  togglePublishBookInFirestore,
  saveExamToFirestore,
  deleteExamFromFirestore,
  togglePublishExamInFirestore
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
 * Create or update a book record directly in Firestore
 */
export async function saveAdminBook(
  bookData: Partial<BookRecord>,
  pdfFile?: File | null,
  coverFile?: File | null
): Promise<{ success: boolean; book?: BookRecord; error?: string }> {
  try {
    let coverUrl = bookData.coverUrl || '';
    if (coverFile) {
      coverUrl = await fileToBase64(coverFile);
    }
    const res = await saveBookToFirestore({
      ...bookData,
      coverUrl: coverUrl || bookData.coverUrl
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
 * Create or update an exam sheet directly in Firestore
 */
export async function saveAdminExam(
  examData: Partial<ExamSheetRecord>,
  pdfFile?: File | null
): Promise<{ success: boolean; exam?: ExamSheetRecord; error?: string }> {
  try {
    const res = await saveExamToFirestore(examData);
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
