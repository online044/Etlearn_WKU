/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Server-Side Database & Private Storage Content Engine for Books and Exam Sheets
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseAdmin, authenticateRequest, PRIMARY_ADMIN_EMAIL } from './security';
import { BookRecord, ExamSheetRecord, ContentAccessLevel, ContentStatus, ExamType } from '../src/types';

// Storage directories
const BASE_STORAGE_DIR = path.join(process.cwd(), 'storage');
const PRIVATE_BOOKS_DIR = path.join(BASE_STORAGE_DIR, 'private', 'books');
const PRIVATE_EXAMS_DIR = path.join(BASE_STORAGE_DIR, 'private', 'exams');
const PUBLIC_COVERS_DIR = path.join(BASE_STORAGE_DIR, 'public', 'covers');
const DB_DIR = path.join(BASE_STORAGE_DIR, 'db');

const BOOKS_DB_FILE = path.join(DB_DIR, 'books.json');
const EXAMS_DB_FILE = path.join(DB_DIR, 'exams.json');

// Ensure required directories exist
function ensureStorageDirectories() {
  [
    BASE_STORAGE_DIR,
    path.join(BASE_STORAGE_DIR, 'private'),
    PRIVATE_BOOKS_DIR,
    PRIVATE_EXAMS_DIR,
    path.join(BASE_STORAGE_DIR, 'public'),
    PUBLIC_COVERS_DIR,
    DB_DIR
  ].forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.warn(`[Content Engine] Failed to create directory ${dir}:`, err);
      }
    }
  });
}

ensureStorageDirectories();

// Cryptographic signing secret for temporary streaming/download tokens
const CONTENT_TOKEN_SECRET = process.env.CONTENT_TOKEN_SECRET || process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Generate a cryptographically signed temporary access token for viewing/downloading
 */
export function generateContentAccessToken(payload: {
  itemId: string;
  type: 'book' | 'exam';
  action: 'view' | 'download';
  userId?: string;
  isPro?: boolean;
  expiresInSeconds?: number;
}): { token: string; expiresAt: number } {
  const exp = Math.floor(Date.now() / 1000) + (payload.expiresInSeconds || 900); // 15 minutes default
  const data = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000)
  };
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', CONTENT_TOKEN_SECRET).update(body).digest('base64url');
  return {
    token: `${body}.${sig}`,
    expiresAt: exp * 1000
  };
}

/**
 * Verify signed temporary access token
 */
export function verifyContentAccessToken(token: string): { valid: boolean; data?: any } {
  try {
    if (!token || typeof token !== 'string') return { valid: false };
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', CONTENT_TOKEN_SECRET).update(body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return { valid: false };
    }
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false }; // Expired
    }
    return { valid: true, data };
  } catch (e) {
    return { valid: false };
  }
}

// ============================================================================
// DURABLE DATABASE PERSISTENCE LAYER
// ============================================================================

/**
 * Load Books from JSON storage (synced with Supabase/Firestore where available)
 */
function readBooksFromStore(): BookRecord[] {
  ensureStorageDirectories();
  if (fs.existsSync(BOOKS_DB_FILE)) {
    try {
      const raw = fs.readFileSync(BOOKS_DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Content Engine] Error reading books db file:', e);
    }
  }
  return [];
}

/**
 * Persist Books to JSON store
 */
function writeBooksToStore(books: BookRecord[]): void {
  ensureStorageDirectories();
  try {
    fs.writeFileSync(BOOKS_DB_FILE, JSON.stringify(books, null, 2), 'utf8');
  } catch (e) {
    console.error('[Content Engine] Failed to save books db file:', e);
  }
}

/**
 * Load Exam Sheets from JSON storage
 */
function readExamsFromStore(): ExamSheetRecord[] {
  ensureStorageDirectories();
  if (fs.existsSync(EXAMS_DB_FILE)) {
    try {
      const raw = fs.readFileSync(EXAMS_DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Content Engine] Error reading exams db file:', e);
    }
  }
  return [];
}

/**
 * Persist Exam Sheets to JSON store
 */
function writeExamsToStore(exams: ExamSheetRecord[]): void {
  ensureStorageDirectories();
  try {
    fs.writeFileSync(EXAMS_DB_FILE, JSON.stringify(exams, null, 2), 'utf8');
  } catch (e) {
    console.error('[Content Engine] Failed to save exams db file:', e);
  }
}

// ============================================================================
// STUDENT PUBLIC API ENDPOINTS
// ============================================================================

/**
 * GET /api/books - Get all published books with filtering
 */
export async function getPublishedBooks(req: Request, res: Response) {
  try {
    const { university, department, academicYear, course, subject, accessLevel, search } = req.query;

    let books = readBooksFromStore();

    // Filter strictly for published books for students
    books = books.filter(b => b.status === 'published');

    // Apply university filter
    if (university && typeof university === 'string' && university !== 'all' && university !== 'All Universities') {
      books = books.filter(b => b.university.toLowerCase() === university.toLowerCase());
    }

    // Apply department filter
    if (department && typeof department === 'string' && department !== 'all' && department !== 'All Departments') {
      books = books.filter(b => b.department.toLowerCase() === department.toLowerCase());
    }

    // Apply academic year filter
    if (academicYear && typeof academicYear === 'string' && academicYear !== 'all' && academicYear !== 'All Years') {
      books = books.filter(b => b.academicYear.toLowerCase().includes(academicYear.toLowerCase()));
    }

    // Apply course filter
    if (course && typeof course === 'string' && course !== 'all' && course !== 'All Courses') {
      books = books.filter(b => b.course.toLowerCase().includes(course.toLowerCase()));
    }

    // Apply subject filter
    if (subject && typeof subject === 'string' && subject !== 'all' && subject !== 'All Subjects') {
      books = books.filter(b => b.subject.toLowerCase().includes(subject.toLowerCase()));
    }

    // Apply accessLevel filter
    if (accessLevel && typeof accessLevel === 'string' && ['free', 'pro'].includes(accessLevel.toLowerCase())) {
      books = books.filter(b => b.accessLevel === accessLevel.toLowerCase());
    }

    // Search text query matching title, description, course, subject, unit
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.toLowerCase().trim();
      books = books.filter(b => 
        b.title.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        b.course.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        (b.unit && b.unit.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Never return private server storage paths to client
    const sanitizedBooks = books.map(({ pdfStoragePath, coverStoragePath, ...rest }) => rest);

    return res.json({
      success: true,
      books: sanitizedBooks,
      count: sanitizedBooks.length
    });
  } catch (error: any) {
    console.error('[Content API] getPublishedBooks error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch books' });
  }
}

/**
 * GET /api/exams - Get all published exam sheets with filtering
 */
export async function getPublishedExams(req: Request, res: Response) {
  try {
    const { university, department, academicYear, course, examType, examYear, accessLevel, search } = req.query;

    let exams = readExamsFromStore();

    // Filter strictly for published exam sheets
    exams = exams.filter(e => e.status === 'published');

    // Filter by university
    if (university && typeof university === 'string' && university !== 'all' && university !== 'All Universities') {
      exams = exams.filter(e => e.university.toLowerCase() === university.toLowerCase());
    }

    // Filter by department
    if (department && typeof department === 'string' && department !== 'all' && department !== 'All Departments') {
      exams = exams.filter(e => e.department.toLowerCase() === department.toLowerCase());
    }

    // Filter by academic year
    if (academicYear && typeof academicYear === 'string' && academicYear !== 'all' && academicYear !== 'All Years') {
      exams = exams.filter(e => e.academicYear.toLowerCase().includes(academicYear.toLowerCase()));
    }

    // Filter by course
    if (course && typeof course === 'string' && course !== 'all' && course !== 'All Courses') {
      exams = exams.filter(e => e.course.toLowerCase().includes(course.toLowerCase()));
    }

    // Filter by exam type
    if (examType && typeof examType === 'string' && examType !== 'all' && examType !== 'All Types') {
      exams = exams.filter(e => e.examType.toLowerCase() === examType.toLowerCase());
    }

    // Filter by exam year
    if (examYear && typeof examYear === 'string' && examYear !== 'all' && examYear !== 'All Years') {
      exams = exams.filter(e => e.examYear.toLowerCase().includes(examYear.toLowerCase()));
    }

    // Filter by access level
    if (accessLevel && typeof accessLevel === 'string' && ['free', 'pro'].includes(accessLevel.toLowerCase())) {
      exams = exams.filter(e => e.accessLevel === accessLevel.toLowerCase());
    }

    // Search query
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.toLowerCase().trim();
      exams = exams.filter(e => 
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.course.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.university.toLowerCase().includes(q) ||
        e.examYear.toLowerCase().includes(q)
      );
    }

    exams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const sanitizedExams = exams.map(({ pdfStoragePath, ...rest }) => rest);

    return res.json({
      success: true,
      exams: sanitizedExams,
      count: sanitizedExams.length
    });
  } catch (error: any) {
    console.error('[Content API] getPublishedExams error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch exam sheets' });
  }
}

/**
 * POST /api/content/access-token - Request a secure temporary token to view or download a book/exam
 * Enforces Free vs. Pro entitlement on the server.
 */
export async function createContentToken(req: Request, res: Response) {
  try {
    const { id, type, action } = req.body;
    if (!id || !type || !['book', 'exam'].includes(type) || !['view', 'download'].includes(action)) {
      return res.status(400).json({ error: 'Valid id, type (book|exam), and action (view|download) required.' });
    }

    // Authenticate the user (optional for free public view, required for pro or download)
    const user = await authenticateRequest(req);
    const isPro = user?.is_pro || user?.is_admin || false;
    const isAdmin = user?.is_admin || false;

    let item: BookRecord | ExamSheetRecord | undefined;
    if (type === 'book') {
      item = readBooksFromStore().find(b => b.id === id);
    } else {
      item = readExamsFromStore().find(e => e.id === id);
    }

    if (!item) {
      return res.status(404).json({ error: 'Content item not found.' });
    }

    // Check publication status: Only admins can access draft/archived items
    if (item.status !== 'published' && !isAdmin) {
      return res.status(403).json({ error: 'This content has not been published yet.' });
    }

    // Server-Side Pro Gating: If resource is Pro-only, non-Pro users are denied access
    if (item.accessLevel === 'pro' && !isPro && !isAdmin) {
      return res.status(403).json({
        error: 'Pro Subscription Required',
        code: 'PRO_REQUIRED',
        message: 'This academic material is exclusive to EthioLearn Pro members. Please upgrade your account to access.'
      });
    }

    // Server-Side Download Gating:
    if (action === 'download') {
      if (!item.allowDownload && !isAdmin) {
        return res.status(403).json({
          error: 'Downloads Disabled',
          code: 'DOWNLOADS_DISABLED',
          message: 'The administrator has disabled offline file downloads for this document.'
        });
      }
    }

    // Generate signed temporary token valid for 15 minutes
    const tokenResult = generateContentAccessToken({
      itemId: id,
      type,
      action,
      userId: user?.id,
      isPro,
      expiresInSeconds: 900
    });

    const streamUrl = `/api/content/stream?token=${encodeURIComponent(tokenResult.token)}`;

    return res.json({
      success: true,
      token: tokenResult.token,
      streamUrl,
      expiresAt: tokenResult.expiresAt
    });
  } catch (error: any) {
    console.error('[Content API] createContentToken error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate access token.' });
  }
}

/**
 * GET /api/content/stream - Stream PDF bytes securely for in-app viewing or downloading
 */
export async function streamContent(req: Request, res: Response) {
  try {
    const token = (req.query.token as string) || '';
    if (!token) {
      return res.status(401).send('Missing access token.');
    }

    const { valid, data } = verifyContentAccessToken(token);
    if (!valid || !data) {
      return res.status(403).send('Expired or invalid content access token.');
    }

    const { itemId, type, action } = data;
    let filePath = '';
    let itemTitle = 'EthioLearn_Document';

    if (type === 'book') {
      const book = readBooksFromStore().find(b => b.id === itemId);
      if (!book) return res.status(404).send('Book not found.');
      itemTitle = book.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
      
      // Determine file path
      if (book.pdfStoragePath && fs.existsSync(book.pdfStoragePath)) {
        filePath = book.pdfStoragePath;
      } else {
        const defaultPath = path.join(PRIVATE_BOOKS_DIR, `${book.id}.pdf`);
        if (fs.existsSync(defaultPath)) filePath = defaultPath;
      }
    } else {
      const exam = readExamsFromStore().find(e => e.id === itemId);
      if (!exam) return res.status(404).send('Exam sheet not found.');
      itemTitle = exam.title.replace(/[^a-zA-Z0-9_\-]/g, '_');

      if (exam.pdfStoragePath && fs.existsSync(exam.pdfStoragePath)) {
        filePath = exam.pdfStoragePath;
      } else {
        const defaultPath = path.join(PRIVATE_EXAMS_DIR, `${exam.id}.pdf`);
        if (fs.existsSync(defaultPath)) filePath = defaultPath;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      // Fallback: If no custom PDF file was uploaded yet, stream a clean placeholder certified PDF or error
      return res.status(404).send('The PDF document file is currently unavailable or being processed.');
    }

    const stat = fs.statSync(filePath);
    const disposition = action === 'download' 
      ? `attachment; filename="${itemTitle}.pdf"` 
      : `inline; filename="${itemTitle}.pdf"`;

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': stat.size,
      'Content-Disposition': disposition,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error: any) {
    console.error('[Content API] streamContent error:', error);
    if (!res.headersSent) {
      res.status(500).send('Streaming error.');
    }
  }
}

// ============================================================================
// ADMIN CONSOLE API ENDPOINTS (Protected by requireAdmin)
// ============================================================================

/**
 * GET /api/admin/books - Admin fetch all books (draft, published, archived)
 */
export async function getAdminBooks(req: Request, res: Response) {
  try {
    const books = readBooksFromStore();
    books.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return res.json({ success: true, books });
  } catch (error: any) {
    console.error('[Admin Content API] getAdminBooks error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/admin/books - Create or update a book record
 */
export async function saveAdminBook(req: Request, res: Response) {
  try {
    const bookData: Partial<BookRecord> = req.body;
    if (!bookData.title || !bookData.university || !bookData.department || !bookData.course || !bookData.subject) {
      return res.status(400).json({ error: 'Title, University, Department, Course, and Subject are required.' });
    }

    const books = readBooksFromStore();
    const now = new Date().toISOString();
    const isEdit = Boolean(bookData.id && books.some(b => b.id === bookData.id));

    const id = bookData.id || `book_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const existing = books.find(b => b.id === id);

    const savedBook: BookRecord = {
      id,
      title: bookData.title.trim(),
      description: (bookData.description || '').trim(),
      university: bookData.university.trim(),
      department: bookData.department.trim(),
      academicYear: (bookData.academicYear || 'Year 1').trim(),
      course: bookData.course.trim(),
      subject: bookData.subject.trim(),
      unit: (bookData.unit || 'General Curriculum').trim(),
      accessLevel: (bookData.accessLevel as ContentAccessLevel) || 'free',
      allowDownload: bookData.allowDownload !== undefined ? Boolean(bookData.allowDownload) : true,
      status: (bookData.status as ContentStatus) || 'published',
      pdfUrl: bookData.pdfUrl || existing?.pdfUrl || '',
      pdfStoragePath: bookData.pdfStoragePath || existing?.pdfStoragePath || '',
      coverUrl: bookData.coverUrl || existing?.coverUrl || '',
      coverStoragePath: bookData.coverStoragePath || existing?.coverStoragePath || '',
      fileSize: bookData.fileSize || existing?.fileSize || 0,
      pageCount: bookData.pageCount || existing?.pageCount || 0,
      publishedAt: bookData.status === 'published' ? (existing?.publishedAt || now) : undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    if (isEdit) {
      const idx = books.findIndex(b => b.id === id);
      books[idx] = savedBook;
    } else {
      books.unshift(savedBook);
    }

    writeBooksToStore(books);

    return res.json({
      success: true,
      book: savedBook,
      message: isEdit ? 'Book updated successfully.' : 'Book created and published successfully.'
    });
  } catch (error: any) {
    console.error('[Admin Content API] saveAdminBook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/admin/books/:id - Delete a book and its associated private files
 */
export async function deleteAdminBook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Book id is required.' });

    const books = readBooksFromStore();
    const target = books.find(b => b.id === id);
    if (!target) return res.status(404).json({ error: 'Book not found.' });

    // Delete associated files from storage if present
    if (target.pdfStoragePath && fs.existsSync(target.pdfStoragePath)) {
      try { fs.unlinkSync(target.pdfStoragePath); } catch (e) { /* ignore */ }
    }
    if (target.coverStoragePath && fs.existsSync(target.coverStoragePath)) {
      try { fs.unlinkSync(target.coverStoragePath); } catch (e) { /* ignore */ }
    }

    const filtered = books.filter(b => b.id !== id);
    writeBooksToStore(filtered);

    return res.json({ success: true, message: 'Book deleted successfully.' });
  } catch (error: any) {
    console.error('[Admin Content API] deleteAdminBook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/admin/books/:id/publish - Toggle published status
 */
export async function togglePublishAdminBook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const newStatus: ContentStatus = status || 'published';

    const books = readBooksFromStore();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Book not found.' });

    books[idx].status = newStatus;
    books[idx].updatedAt = new Date().toISOString();
    if (newStatus === 'published' && !books[idx].publishedAt) {
      books[idx].publishedAt = new Date().toISOString();
    }

    writeBooksToStore(books);

    return res.json({ success: true, book: books[idx] });
  } catch (error: any) {
    console.error('[Admin Content API] togglePublishAdminBook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/admin/books/upload-pdf - Handle PDF upload and store in private storage
 */
export async function uploadBookPdf(req: Request, res: Response) {
  try {
    const { bookId, fileName, fileBase64, fileSize, pageCount } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 data is required.' });
    }

    ensureStorageDirectories();

    const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const id = bookId || `book_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const storagePath = path.join(PRIVATE_BOOKS_DIR, `${id}.pdf`);

    fs.writeFileSync(storagePath, buffer);

    const actualSize = buffer.length;

    // If bookId matches an existing book, update its storage path
    const books = readBooksFromStore();
    const idx = books.findIndex(b => b.id === id);
    if (idx !== -1) {
      books[idx].pdfStoragePath = storagePath;
      books[idx].fileSize = actualSize;
      if (pageCount) books[idx].pageCount = Number(pageCount);
      books[idx].updatedAt = new Date().toISOString();
      writeBooksToStore(books);
    }

    return res.json({
      success: true,
      id,
      pdfStoragePath: storagePath,
      fileSize: actualSize,
      fileName: fileName || `${id}.pdf`
    });
  } catch (error: any) {
    console.error('[Admin Content API] uploadBookPdf error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/admin/books/upload-cover - Handle cover image upload
 */
export async function uploadBookCover(req: Request, res: Response) {
  try {
    const { bookId, fileBase64, mimeType } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 data is required.' });
    }

    ensureStorageDirectories();

    const cleanBase64 = fileBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const ext = mimeType?.includes('png') ? 'png' : 'jpg';
    const id = bookId || `cover_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const storagePath = path.join(PUBLIC_COVERS_DIR, `${id}.${ext}`);

    fs.writeFileSync(storagePath, buffer);

    // Return URL and storage path
    const coverUrl = `/api/content/cover/${id}.${ext}`;

    const books = readBooksFromStore();
    const idx = books.findIndex(b => b.id === id);
    if (idx !== -1) {
      books[idx].coverUrl = coverUrl;
      books[idx].coverStoragePath = storagePath;
      books[idx].updatedAt = new Date().toISOString();
      writeBooksToStore(books);
    }

    return res.json({
      success: true,
      coverUrl,
      coverStoragePath: storagePath
    });
  } catch (error: any) {
    console.error('[Admin Content API] uploadBookCover error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/content/cover/:filename - Serve public cover images
 */
export function serveCoverImage(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const coverPath = path.join(PUBLIC_COVERS_DIR, safeFilename);

    if (fs.existsSync(coverPath)) {
      const ext = path.extname(safeFilename).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(coverPath).pipe(res);
    }

    return res.status(404).send('Cover not found');
  } catch (e) {
    return res.status(404).send('Cover not found');
  }
}

// ============================================================================
// EXAM SHEETS ADMIN API ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/exams - Admin fetch all exam sheets
 */
export async function getAdminExams(req: Request, res: Response) {
  try {
    const exams = readExamsFromStore();
    exams.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return res.json({ success: true, exams });
  } catch (error: any) {
    console.error('[Admin Content API] getAdminExams error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/admin/exams - Create or update an exam sheet record
 */
export async function saveAdminExam(req: Request, res: Response) {
  try {
    const examData: Partial<ExamSheetRecord> = req.body;
    if (!examData.title || !examData.university || !examData.department || !examData.course || !examData.examType || !examData.examYear) {
      return res.status(400).json({ error: 'Title, University, Department, Course, Exam Type, and Exam Year are required.' });
    }

    const exams = readExamsFromStore();
    const now = new Date().toISOString();
    const isEdit = Boolean(examData.id && exams.some(e => e.id === examData.id));

    const id = examData.id || `exam_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const existing = exams.find(e => e.id === id);

    const savedExam: ExamSheetRecord = {
      id,
      title: examData.title.trim(),
      description: (examData.description || '').trim(),
      university: examData.university.trim(),
      department: examData.department.trim(),
      academicYear: (examData.academicYear || 'Year 1').trim(),
      course: examData.course.trim(),
      subject: (examData.subject || examData.course).trim(),
      examType: (examData.examType as ExamType) || 'midterm',
      examYear: examData.examYear.trim(),
      accessLevel: (examData.accessLevel as ContentAccessLevel) || 'free',
      allowDownload: examData.allowDownload !== undefined ? Boolean(examData.allowDownload) : true,
      status: (examData.status as ContentStatus) || 'published',
      pdfUrl: examData.pdfUrl || existing?.pdfUrl || '',
      pdfStoragePath: examData.pdfStoragePath || existing?.pdfStoragePath || '',
      fileSize: examData.fileSize || existing?.fileSize || 0,
      pageCount: examData.pageCount || existing?.pageCount || 0,
      publishedAt: examData.status === 'published' ? (existing?.publishedAt || now) : undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    if (isEdit) {
      const idx = exams.findIndex(e => e.id === id);
      exams[idx] = savedExam;
    } else {
      exams.unshift(savedExam);
    }

    writeExamsToStore(exams);

    return res.json({
      success: true,
      exam: savedExam,
      message: isEdit ? 'Exam sheet updated successfully.' : 'Exam sheet uploaded and published successfully.'
    });
  } catch (error: any) {
    console.error('[Admin Content API] saveAdminExam error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/admin/exams/:id - Delete an exam sheet and its PDF file
 */
export async function deleteAdminExam(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Exam sheet id is required.' });

    const exams = readExamsFromStore();
    const target = exams.find(e => e.id === id);
    if (!target) return res.status(404).json({ error: 'Exam sheet not found.' });

    if (target.pdfStoragePath && fs.existsSync(target.pdfStoragePath)) {
      try { fs.unlinkSync(target.pdfStoragePath); } catch (e) { /* ignore */ }
    }

    const filtered = exams.filter(e => e.id !== id);
    writeExamsToStore(filtered);

    return res.json({ success: true, message: 'Exam sheet deleted successfully.' });
  } catch (error: any) {
    console.error('[Admin Content API] deleteAdminExam error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/admin/exams/:id/publish - Toggle exam sheet published status
 */
export async function togglePublishAdminExam(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const newStatus: ContentStatus = status || 'published';

    const exams = readExamsFromStore();
    const idx = exams.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Exam sheet not found.' });

    exams[idx].status = newStatus;
    exams[idx].updatedAt = new Date().toISOString();
    if (newStatus === 'published' && !exams[idx].publishedAt) {
      exams[idx].publishedAt = new Date().toISOString();
    }

    writeExamsToStore(exams);

    return res.json({ success: true, exam: exams[idx] });
  } catch (error: any) {
    console.error('[Admin Content API] togglePublishAdminExam error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/admin/exams/upload-pdf - Handle exam sheet PDF upload
 */
export async function uploadExamPdf(req: Request, res: Response) {
  try {
    const { examId, fileName, fileBase64, fileSize, pageCount } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 data is required.' });
    }

    ensureStorageDirectories();

    const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const id = examId || `exam_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const storagePath = path.join(PRIVATE_EXAMS_DIR, `${id}.pdf`);

    fs.writeFileSync(storagePath, buffer);
    const actualSize = buffer.length;

    const exams = readExamsFromStore();
    const idx = exams.findIndex(e => e.id === id);
    if (idx !== -1) {
      exams[idx].pdfStoragePath = storagePath;
      exams[idx].fileSize = actualSize;
      if (pageCount) exams[idx].pageCount = Number(pageCount);
      exams[idx].updatedAt = new Date().toISOString();
      writeExamsToStore(exams);
    }

    return res.json({
      success: true,
      id,
      pdfStoragePath: storagePath,
      fileSize: actualSize,
      fileName: fileName || `${id}.pdf`
    });
  } catch (error: any) {
    console.error('[Admin Content API] uploadExamPdf error:', error);
    return res.status(500).json({ error: error.message });
  }
}
