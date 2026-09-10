/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  collection, 
  getDocs, 
  query,
  where,
  orderBy,
  limit,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { GOOGLE_SERVICES_PROJECT } from './googleServicesConfig';
import { 
  StudentProfile, 
  CustomNote, 
  Promotion,
  FirestoreBook,
  FirestoreChapter,
  FirestoreExam,
  FirestoreQuestion,
  FirestoreResult,
  FirestoreUser,
  FirestoreStudyNote,
  NoteFilters
} from '../types';
import { 
  INITIAL_BOOKS, 
  INITIAL_CHAPTERS, 
  INITIAL_EXAMS, 
  INITIAL_QUESTIONS,
  INITIAL_NOTES
} from '../data/initialFirestoreContent';
import { compressImageToBase64 } from './imageCompressor';

// Safe initialization to prevent "duplicate default app" warnings and missing service crashes
export const app = (() => {
  try {
    let activeConfig: any = firebaseConfig;
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      // If running on user's Vercel domains specified in google-services.json
      if (hostname.includes('etlearn') || hostname.includes('vercel.app')) {
        activeConfig = {
          projectId: GOOGLE_SERVICES_PROJECT.projectId,
          appId: GOOGLE_SERVICES_PROJECT.clients[0].appId,
          apiKey: GOOGLE_SERVICES_PROJECT.apiKey,
          authDomain: GOOGLE_SERVICES_PROJECT.authDomain,
          storageBucket: GOOGLE_SERVICES_PROJECT.storageBucket,
          messagingSenderId: GOOGLE_SERVICES_PROJECT.projectNumber,
          measurementId: ""
        };
      }
    }
    return getApps().length === 0 ? initializeApp(activeConfig) : getApp();
  } catch (err) {
    console.warn('[Firebase App] Initialization failed:', err);
    return null as any;
  }
})();

export const db = (() => {
  if (!app) return null;
  const isCustomDomain = typeof window !== 'undefined' && 
    (window.location.hostname.toLowerCase().includes('etlearn') || window.location.hostname.toLowerCase().includes('vercel.app'));
  const dbId = isCustomDomain ? undefined : ((firebaseConfig as any).firestoreDatabaseId || undefined);
  try {
    // Avoid verbose warnings when operating offline or on sandboxed proxies
    try {
      setLogLevel('error');
    } catch {
      // Ignore if setLogLevel is not permitted in current environment
    }

    if (dbId) {
      try {
        return initializeFirestore(app, {
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true,
        }, dbId);
      } catch {
        return getFirestore(app, dbId);
      }
    }
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    });
  } catch (err) {
    try {
      return getFirestore(app);
    } catch {
      console.warn('[Firestore] Service is not available:', err);
      return null;
    }
  }
})();

export const auth = (() => {
  if (!app) return null;
  try {
    return getAuth(app);
  } catch (err) {
    console.warn('[Firebase Auth] Service is not available:', err);
    return null;
  }
})();

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && app) {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn('[Firebase Analytics] Initialization skipped:', e);
      }
    }
  }).catch(() => {});
}

export function getDb() {
  return db;
}

export function getAuthInstance() {
  return auth;
}

// Error Operation Enum
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Structured error format required by platform skills
interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Handle and map Firestore errors with rich contextual metadata in JSON format
 */
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Service Error]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate liveness/connectivity with Firestore on application startup
 */
export async function testFirestoreConnection() {
  const currentDb = getDb();
  if (!currentDb) {
    return;
  }
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout')), 3000)
    );
    const snap = await Promise.race([
      getDoc(doc(currentDb, 'test', 'connection')),
      timeoutPromise
    ]) as any;
    if (snap && snap.exists && snap.exists()) {
      console.log('[Firestore Service] Firestore connection active.');
    }
  } catch (error: any) {
    console.info("[Firestore Service] Operating in offline-ready/cached mode:", error?.message || 'ready');
  }
}

/**
 * Save or update student profile in Firestore
 */
export async function syncProfileToFirestore(userId: string, profile: StudentProfile): Promise<void> {
  const currentDb = getDb();
  if (!currentDb) return;
  const path = `profiles/${userId}`;
  try {
    const cleanProfile = {
      name: profile.name,
      email: profile.email || '',
      university: profile.university,
      year: profile.year,
      subjects: profile.subjects || [],
      claudeApiKey: profile.claudeApiKey || '',
      dailyGoalHours: profile.dailyGoalHours || 2,
      theme: profile.theme || 'dark',
      language: profile.language || 'en'
    };
    await setDoc(doc(currentDb, 'profiles', userId), cleanProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch student profile from Firestore
 */
export async function fetchProfileFromFirestore(userId: string): Promise<StudentProfile | null> {
  const currentDb = getDb();
  if (!currentDb) return null;
  const path = `profiles/${userId}`;
  try {
    const snap = await getDoc(doc(currentDb, 'profiles', userId));
    if (snap.exists()) {
      return snap.data() as StudentProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save a study note to subcollection
 */
export async function saveNoteToFirestore(userId: string, note: CustomNote): Promise<void> {
  const currentDb = getDb();
  if (!currentDb) return;
  const path = `profiles/${userId}/notes/${note.id}`;
  try {
    await setDoc(doc(currentDb, 'profiles', userId, 'notes', note.id), note);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a study note from subcollection
 */
export async function deleteNoteFromFirestore(userId: string, noteId: string): Promise<void> {
  const currentDb = getDb();
  if (!currentDb) return;
  const path = `profiles/${userId}/notes/${noteId}`;
  try {
    await deleteDoc(doc(currentDb, 'profiles', userId, 'notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Load all study notes from student subcollection
 */
export async function fetchNotesFromFirestore(userId: string): Promise<CustomNote[]> {
  const currentDb = getDb();
  if (!currentDb) return [];
  const path = `profiles/${userId}/notes`;
  try {
    const querySnapshot = await getDocs(collection(currentDb, 'profiles', userId, 'notes'));
    const notes: CustomNote[] = [];
    querySnapshot.forEach((doc) => {
      notes.push(doc.data() as CustomNote);
    });
    return notes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    code: 'WKU2026',
    title: 'Wolkite University Promo',
    description: 'Exclusive 30% discount for Wolkite University students',
    discountPercentage: 30,
    maxUses: 500,
    usedCount: 18,
    expiresAt: '2026-12-31',
    isActive: true
  },
  {
    code: 'ETHIOLEARN50',
    title: '50% Semester Discount',
    description: 'Half-price promo code on all subscription tiers',
    discountPercentage: 50,
    maxUses: 250,
    usedCount: 42,
    expiresAt: '2026-12-31',
    isActive: true
  },
  {
    code: 'FRESHMAN25',
    title: 'Freshman Welcome 25%',
    description: '25% discount for freshman university scholars',
    discountPercentage: 25,
    maxUses: 1000,
    usedCount: 75,
    expiresAt: '2026-12-31',
    isActive: true
  },
  {
    code: 'EXAMPASS40',
    title: 'Exam Season Flat 40 ETB',
    description: 'Flat 40 ETB discount on any subscription package',
    discountPercentage: 0,
    fixedDiscountETB: 40,
    maxUses: 300,
    usedCount: 29,
    expiresAt: '2026-12-31',
    isActive: true
  },
  {
    code: 'TELEBIRR10',
    title: 'Telebirr 10% Off',
    description: '10% instant promo code when paying with Telebirr',
    discountPercentage: 10,
    maxUses: 500,
    usedCount: 33,
    expiresAt: '2026-12-31',
    isActive: true
  }
];

const LOCAL_STORAGE_PROMOTIONS_KEY = 'ethiolearn_db_promotions';

/**
 * Fetch all active promotions from Firestore 'promotions' collection with local fallback
 */
export async function fetchPromotionsFromFirestore(): Promise<Promotion[]> {
  const currentDb = getDb();
  let firestorePromos: Promotion[] = [];

  if (currentDb) {
    try {
      const snap = await getDocs(collection(currentDb, 'promotions'));
      snap.forEach((doc) => {
        const data = doc.data();
        firestorePromos.push({
          id: doc.id,
          code: (data.code || doc.id).toUpperCase().trim(),
          title: data.title,
          description: data.description,
          discountPercentage: Number(data.discountPercentage ?? data.discount_percentage ?? 0),
          fixedDiscountETB: Number(data.fixedDiscountETB ?? data.fixed_discount_etb ?? 0),
          maxUses: Number(data.maxUses ?? data.max_uses ?? 1000),
          usedCount: Number(data.usedCount ?? data.used_count ?? 0),
          expiresAt: data.expiresAt || data.expires_at || '2026-12-31',
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
          applicableTiers: data.applicableTiers
        });
      });
    } catch (e: any) {
      console.warn('[Firestore Promotions] Fetch notice:', e?.message || e);
    }
  }

  // Read local storage promotions cache
  let cachedPromos: Promotion[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROMOTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cachedPromos = parsed;
    }
  } catch {}

  // Merge defaults + cache + firestore promos
  const promoMap = new Map<string, Promotion>();
  DEFAULT_PROMOTIONS.forEach(p => promoMap.set(p.code.toUpperCase(), p));
  cachedPromos.forEach(p => promoMap.set(p.code.toUpperCase(), p));
  firestorePromos.forEach(p => promoMap.set(p.code.toUpperCase(), p));

  const result = Array.from(promoMap.values());
  try {
    localStorage.setItem(LOCAL_STORAGE_PROMOTIONS_KEY, JSON.stringify(result));
  } catch {}

  return result;
}

/**
 * Validate a student entered promo code against the database 'promotions' collection
 */
export async function validatePromotionInDatabase(
  code: string, 
  originalAmountETB: number, 
  tier?: string
): Promise<{
  valid: boolean;
  promotion?: Promotion;
  discountETB: number;
  finalAmountETB: number;
  message: string;
}> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      discountETB: 0,
      finalAmountETB: originalAmountETB,
      message: 'Please enter a valid promotion code.'
    };
  }

  // 1. Query Firestore doc directly for optimal speed
  const currentDb = getDb();
  let matchedPromo: Promotion | undefined;

  if (currentDb) {
    try {
      const promoDoc = await getDoc(doc(currentDb, 'promotions', cleanCode));
      if (promoDoc.exists()) {
        const data = promoDoc.data();
        matchedPromo = {
          id: promoDoc.id,
          code: cleanCode,
          title: data.title,
          description: data.description,
          discountPercentage: Number(data.discountPercentage ?? data.discount_percentage ?? 0),
          fixedDiscountETB: Number(data.fixedDiscountETB ?? data.fixed_discount_etb ?? 0),
          maxUses: Number(data.maxUses ?? data.max_uses ?? 1000),
          usedCount: Number(data.usedCount ?? data.used_count ?? 0),
          expiresAt: data.expiresAt || data.expires_at || '2026-12-31',
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
          applicableTiers: data.applicableTiers
        };
      }
    } catch (err) {
      console.warn('[Firestore Promo direct query notice]:', err);
    }
  }

  // If not found in direct Firestore doc, fetch merged list
  if (!matchedPromo) {
    const allPromotions = await fetchPromotionsFromFirestore();
    matchedPromo = allPromotions.find(p => p.code.toUpperCase() === cleanCode);
  }

  if (!matchedPromo) {
    return {
      valid: false,
      discountETB: 0,
      finalAmountETB: originalAmountETB,
      message: `Promo code "${cleanCode}" was not found in the database.`
    };
  }

  if (!matchedPromo.isActive) {
    return {
      valid: false,
      discountETB: 0,
      finalAmountETB: originalAmountETB,
      message: `Promo code "${cleanCode}" is no longer active.`
    };
  }

  if (matchedPromo.maxUses && matchedPromo.maxUses > 0 && (matchedPromo.usedCount || 0) >= matchedPromo.maxUses) {
    return {
      valid: false,
      discountETB: 0,
      finalAmountETB: originalAmountETB,
      message: `Promo code "${cleanCode}" has reached its maximum usage limit.`
    };
  }

  if (matchedPromo.expiresAt) {
    const expiryTime = new Date(matchedPromo.expiresAt).getTime();
    if (!isNaN(expiryTime) && expiryTime < Date.now()) {
      return {
        valid: false,
        discountETB: 0,
        finalAmountETB: originalAmountETB,
        message: `Promo code "${cleanCode}" expired on ${matchedPromo.expiresAt}.`
      };
    }
  }

  // Calculate discount
  let discount = 0;
  if (matchedPromo.fixedDiscountETB && matchedPromo.fixedDiscountETB > 0) {
    discount = Math.min(originalAmountETB, matchedPromo.fixedDiscountETB);
  } else if (matchedPromo.discountPercentage > 0) {
    discount = Math.round((originalAmountETB * matchedPromo.discountPercentage) / 100);
  }

  const finalAmount = Math.max(0, originalAmountETB - discount);

  return {
    valid: true,
    promotion: matchedPromo,
    discountETB: discount,
    finalAmountETB: finalAmount,
    message: `Promo code "${cleanCode}" verified! ${matchedPromo.discountPercentage ? `${matchedPromo.discountPercentage}% OFF` : `${discount} ETB OFF`} applied.`
  };
}

/**
 * Increment promotion redemptions in Firestore and local storage
 */
export async function incrementPromotionUsage(code: string): Promise<void> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return;

  const currentDb = getDb();
  if (currentDb) {
    try {
      const docRef = doc(currentDb, 'promotions', cleanCode);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const count = Number(snap.data()?.usedCount || 0);
        await setDoc(docRef, { usedCount: count + 1 }, { merge: true });
      }
    } catch (e) {
      console.warn('[Firestore Increment Promo usage]:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROMOTIONS_KEY);
    if (raw) {
      const list: Promotion[] = JSON.parse(raw);
      const updated = list.map(p => {
        if (p.code.toUpperCase() === cleanCode) {
          return { ...p, usedCount: (p.usedCount || 0) + 1 };
        }
        return p;
      });
      localStorage.setItem(LOCAL_STORAGE_PROMOTIONS_KEY, JSON.stringify(updated));
    }
  } catch {}
}

// ============================================================================
// 1. "users" COLLECTION: Profiles, Study Progress, Streaks & Stats
// ============================================================================

export async function syncUserToFirestore(userData: Partial<FirestoreUser> & { id: string }): Promise<FirestoreUser | null> {
  const currentDb = getDb();
  if (!currentDb) return null;
  const path = `users/${userData.id}`;
  try {
    const now = new Date().toISOString();
    const existingSnap = await getDoc(doc(currentDb, 'users', userData.id));
    const prev = existingSnap.exists() ? existingSnap.data() : {};

    const cleanUser: FirestoreUser = {
      id: userData.id,
      name: userData.name || prev.name || 'Ethiopian Scholar',
      email: userData.email || prev.email || '',
      university: userData.university || prev.university || 'Wolkite University',
      department: userData.department || prev.department || 'Freshman Common Courses',
      year: userData.year || prev.year || 'Year 1 (Freshman)',
      subjects: userData.subjects || prev.subjects || ['Mathematics', 'Physics', 'Emerging Technologies'],
      studyStreak: userData.studyStreak ?? prev.studyStreak ?? 1,
      totalStudyMinutes: userData.totalStudyMinutes ?? prev.totalStudyMinutes ?? 0,
      isPro: userData.isPro !== undefined ? userData.isPro : (prev.isPro ?? false),
      theme: userData.theme || prev.theme || 'dark',
      language: userData.language || prev.language || 'en',
      createdAt: prev.createdAt || userData.createdAt || now,
      updatedAt: now
    };

    await setDoc(doc(currentDb, 'users', userData.id), cleanUser);
    return cleanUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserFromFirestore(userId: string): Promise<FirestoreUser | null> {
  const currentDb = getDb();
  if (!currentDb) return null;
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(currentDb, 'users', userId));
    if (snap.exists()) {
      return snap.data() as FirestoreUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ============================================================================
// 2. "books" COLLECTION: Authentic University & Grade 12 Textbooks
// ============================================================================

export interface FirestoreBookFilters {
  university?: string;
  department?: string;
  academicYear?: string;
  course?: string;
  subject?: string;
  accessLevel?: string;
  search?: string;
  status?: string;
}

export async function fetchBooksFromFirestore(filters: FirestoreBookFilters = {}): Promise<FirestoreBook[]> {
  const currentDb = getDb();
  let dbBooks: FirestoreBook[] = [];

  if (currentDb) {
    try {
      const snap = await getDocs(collection(currentDb, 'books'));
      snap.forEach(docSnap => {
        const item = docSnap.data() as FirestoreBook;
        dbBooks.push({ ...item, id: docSnap.id });
      });
    } catch (error) {
      console.warn('[Firestore Books] Notice, using initial/cached dataset:', error);
    }
  }

  // Combine with initial authentic books
  const bookMap = new Map<string, FirestoreBook>();
  INITIAL_BOOKS.forEach(b => bookMap.set(b.id, b));
  dbBooks.forEach(b => bookMap.set(b.id, b));

  let results = Array.from(bookMap.values());

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    results = results.filter(b => b.status === filters.status);
  } else if (!filters.status) {
    // By default for students, show published only
    results = results.filter(b => b.status === 'published' || !b.status);
  }

  if (filters.university && filters.university !== 'all') {
    results = results.filter(b => b.university?.toLowerCase().includes(filters.university!.toLowerCase()));
  }
  if (filters.department && filters.department !== 'all') {
    results = results.filter(b => b.department?.toLowerCase().includes(filters.department!.toLowerCase()));
  }
  if (filters.academicYear && filters.academicYear !== 'all') {
    results = results.filter(b => b.academicYear === filters.academicYear || b.academicYear?.includes(filters.academicYear!));
  }
  if (filters.course && filters.course !== 'all') {
    results = results.filter(b => b.course?.toLowerCase().includes(filters.course!.toLowerCase()));
  }
  if (filters.subject && filters.subject !== 'all') {
    results = results.filter(b => b.subject?.toLowerCase().includes(filters.subject!.toLowerCase()));
  }
  if (filters.accessLevel && filters.accessLevel !== 'all') {
    results = results.filter(b => b.accessLevel === filters.accessLevel);
  }
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    results = results.filter(b => 
      b.title.toLowerCase().includes(s) || 
      b.description.toLowerCase().includes(s) || 
      b.subject.toLowerCase().includes(s) ||
      b.course.toLowerCase().includes(s)
    );
  }

  return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function fetchBookByIdFromFirestore(bookId: string): Promise<FirestoreBook | null> {
  const currentDb = getDb();
  if (currentDb) {
    try {
      const snap = await getDoc(doc(currentDb, 'books', bookId));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as FirestoreBook;
      }
    } catch (e) {
      console.warn('[Firestore Book by ID] notice:', e);
    }
  }

  const found = INITIAL_BOOKS.find(b => b.id === bookId);
  return found || null;
}

export async function saveBookToFirestore(book: Partial<FirestoreBook>): Promise<{ success: boolean; book?: FirestoreBook; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };
  
  const id = book.id || `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const path = `books/${id}`;

  let coverUrl = book.coverUrl || '';
  // Safeguard: If coverUrl is an uncompressed or oversized base64 data URL, compress it down
  if (coverUrl.startsWith('data:image/') && coverUrl.length > 80 * 1024) {
    if (typeof window !== 'undefined') {
      try {
        coverUrl = await compressImageToBase64(coverUrl, { maxWidth: 360, maxHeight: 520, quality: 0.72 });
      } catch (covErr) {
        console.warn('[Firestore] Failed to compress oversized coverUrl, pruning to protect document size limit:', covErr);
        if (coverUrl.length > 200 * 1024) {
          coverUrl = '';
        }
      }
    } else if (coverUrl.length > 200 * 1024) {
      coverUrl = '';
    }
  }

  // Safeguard: Never allow huge raw binary data URLs in pdfUrl in Firestore
  let pdfUrl = book.pdfUrl || '';
  if (pdfUrl.startsWith('data:') && pdfUrl.length > 50 * 1024) {
    console.warn('[Firestore] Stripping oversized binary data URL from pdfUrl field to protect 1MB Firestore limit.');
    pdfUrl = '';
  }

  const cleanBook: FirestoreBook = {
    id,
    title: book.title?.trim() || 'Untitled Textbook',
    description: book.description?.trim() || '',
    university: book.university?.trim() || 'Wolkite University',
    department: book.department?.trim() || 'Freshman Common Courses',
    academicYear: book.academicYear?.trim() || 'Year 1 (Freshman)',
    course: book.course?.trim() || 'General',
    subject: book.subject?.trim() || 'General',
    unit: book.unit?.trim() || 'Full Curriculum',
    accessLevel: book.accessLevel || 'free',
    allowDownload: book.allowDownload !== undefined ? book.allowDownload : true,
    status: book.status || 'published',
    pdfUrl,
    pdfStoragePath: (book as any).pdfStoragePath || '',
    coverUrl,
    coverStoragePath: (book as any).coverStoragePath || '',
    fileSize: Number(book.fileSize || 0),
    pageCount: Number(book.pageCount || 0),
    createdAt: book.createdAt || now,
    updatedAt: now
  };

  // Defensive check: ensure total document size does not exceed Firestore's 1MB limit
  const estimatedBytes = new TextEncoder().encode(JSON.stringify(cleanBook)).length;
  if (estimatedBytes > 850 * 1024) {
    console.warn(`[Firestore] Book document size (${estimatedBytes} bytes) near 1MB ceiling. Pruning oversized fields.`);
    if (cleanBook.coverUrl && cleanBook.coverUrl.startsWith('data:')) {
      cleanBook.coverUrl = '';
    }
    if (cleanBook.description && cleanBook.description.length > 20000) {
      cleanBook.description = cleanBook.description.slice(0, 20000);
    }
  }

  try {
    await setDoc(doc(currentDb, 'books', id), cleanBook);
    return { success: true, book: cleanBook };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBookFromFirestore(bookId: string): Promise<{ success: boolean; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };
  const path = `books/${bookId}`;

  try {
    await deleteDoc(doc(currentDb, 'books', bookId));
    // Also delete associated chapters
    try {
      const q = query(collection(currentDb, 'chapters'), where('bookId', '==', bookId));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await deleteDoc(doc(currentDb, 'chapters', d.id));
      });
    } catch {}

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function togglePublishBookInFirestore(bookId: string, status: 'published' | 'draft' | 'archived'): Promise<{ success: boolean; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };
  const path = `books/${bookId}`;

  try {
    await setDoc(doc(currentDb, 'books', bookId), { status, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// 3. "chapters" COLLECTION: Structured Textbook Chapter Learning Modules
// ============================================================================

export async function fetchChaptersForBookFromFirestore(bookId: string): Promise<FirestoreChapter[]> {
  const currentDb = getDb();
  let dbChapters: FirestoreChapter[] = [];

  if (currentDb) {
    try {
      const q = query(collection(currentDb, 'chapters'), where('bookId', '==', bookId));
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        const item = docSnap.data() as FirestoreChapter;
        dbChapters.push({ ...item, id: docSnap.id });
      });
    } catch (e) {
      console.warn('[Firestore Chapters] Notice, checking initial dataset:', e);
    }
  }

  // Combine with initial chapters
  const initialMatches = INITIAL_CHAPTERS.filter(c => c.bookId === bookId);
  const chapterMap = new Map<string, FirestoreChapter>();
  initialMatches.forEach(c => chapterMap.set(c.id, c));
  dbChapters.forEach(c => chapterMap.set(c.id, c));

  return Array.from(chapterMap.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);
}

export async function saveChapterToFirestore(chapter: Partial<FirestoreChapter>): Promise<{ success: boolean; chapter?: FirestoreChapter; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };

  if (!chapter.bookId) return { success: false, error: 'bookId is required' };

  const id = chapter.id || `chap_${chapter.bookId}_${chapter.chapterNumber || Date.now()}`;
  const now = new Date().toISOString();
  const path = `chapters/${id}`;

  const cleanChapter: FirestoreChapter = {
    id,
    bookId: chapter.bookId,
    chapterNumber: Number(chapter.chapterNumber || 1),
    title: chapter.title?.trim() || 'Untitled Chapter',
    intro: chapter.intro?.trim() || '',
    sections: chapter.sections || [],
    asciiDiagram: chapter.asciiDiagram || '',
    formulas: chapter.formulas || [],
    examAlert: chapter.examAlert || '',
    summary: chapter.summary || '',
    createdAt: chapter.createdAt || now,
    updatedAt: now
  };

  try {
    await setDoc(doc(currentDb, 'chapters', id), cleanChapter);
    return { success: true, chapter: cleanChapter };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteChapterFromFirestore(chapterId: string): Promise<{ success: boolean; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };
  const path = `chapters/${chapterId}`;

  try {
    await deleteDoc(doc(currentDb, 'chapters', chapterId));
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 4. "exams" COLLECTION: University Midterm, Final, & Model Past Exam Papers
// ============================================================================

export interface FirestoreExamFilters {
  university?: string;
  department?: string;
  academicYear?: string;
  course?: string;
  subject?: string;
  examType?: string;
  examYear?: string;
  accessLevel?: string;
  search?: string;
  status?: string;
}

export async function fetchExamsFromFirestore(filters: FirestoreExamFilters = {}): Promise<FirestoreExam[]> {
  const currentDb = getDb();
  let dbExams: FirestoreExam[] = [];

  if (currentDb) {
    try {
      const snap = await getDocs(collection(currentDb, 'exams'));
      snap.forEach(docSnap => {
        const item = docSnap.data() as FirestoreExam;
        dbExams.push({ ...item, id: docSnap.id });
      });
    } catch (e) {
      console.warn('[Firestore Exams] Notice, using initial/cached dataset:', e);
    }
  }

  // Combine with initial authentic exams
  const examMap = new Map<string, FirestoreExam>();
  INITIAL_EXAMS.forEach(ex => examMap.set(ex.id, ex));
  dbExams.forEach(ex => examMap.set(ex.id, ex));

  let results = Array.from(examMap.values());

  if (filters.status && filters.status !== 'all') {
    results = results.filter(e => e.status === filters.status);
  } else if (!filters.status) {
    results = results.filter(e => e.status === 'published' || !e.status);
  }

  if (filters.university && filters.university !== 'all') {
    results = results.filter(e => e.university?.toLowerCase().includes(filters.university!.toLowerCase()));
  }
  if (filters.department && filters.department !== 'all') {
    results = results.filter(e => e.department?.toLowerCase().includes(filters.department!.toLowerCase()));
  }
  if (filters.academicYear && filters.academicYear !== 'all') {
    results = results.filter(e => e.academicYear === filters.academicYear || e.academicYear?.includes(filters.academicYear!));
  }
  if (filters.subject && filters.subject !== 'all') {
    results = results.filter(e => e.subject?.toLowerCase().includes(filters.subject!.toLowerCase()));
  }
  if (filters.examType && filters.examType !== 'all') {
    results = results.filter(e => e.examType === filters.examType);
  }
  if (filters.accessLevel && filters.accessLevel !== 'all') {
    results = results.filter(e => e.accessLevel === filters.accessLevel);
  }
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    results = results.filter(e => 
      e.title.toLowerCase().includes(s) || 
      (e.description && e.description.toLowerCase().includes(s)) ||
      e.subject.toLowerCase().includes(s) ||
      e.course.toLowerCase().includes(s)
    );
  }

  return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function fetchExamByIdFromFirestore(examId: string): Promise<FirestoreExam | null> {
  const currentDb = getDb();
  if (currentDb) {
    try {
      const snap = await getDoc(doc(currentDb, 'exams', examId));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as FirestoreExam;
      }
    } catch (e) {
      console.warn('[Firestore Exam by ID] notice:', e);
    }
  }

  const found = INITIAL_EXAMS.find(e => e.id === examId);
  return found || null;
}

export async function saveExamToFirestore(exam: Partial<FirestoreExam>): Promise<{ success: boolean; exam?: FirestoreExam; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };

  const id = exam.id || `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const path = `exams/${id}`;

  let pdfUrl = exam.pdfUrl || '';
  if (pdfUrl.startsWith('data:') && pdfUrl.length > 50 * 1024) {
    console.warn('[Firestore] Stripping oversized binary data URL from exam pdfUrl field to protect 1MB Firestore limit.');
    pdfUrl = '';
  }

  const cleanExam: FirestoreExam = {
    id,
    title: exam.title?.trim() || 'Untitled Examination',
    description: exam.description?.trim() || '',
    university: exam.university?.trim() || 'Wolkite University',
    department: exam.department?.trim() || 'Freshman Common Courses',
    academicYear: exam.academicYear?.trim() || 'Year 1 (Freshman)',
    course: exam.course?.trim() || 'General',
    subject: exam.subject?.trim() || 'General',
    examType: exam.examType || 'midterm',
    examYear: exam.examYear?.trim() || '2025/2026',
    durationMinutes: Number(exam.durationMinutes || 30),
    totalMarks: Number(exam.totalMarks || 30),
    passingScore: Number(exam.passingScore || 50),
    totalQuestions: Number(exam.totalQuestions || 10),
    accessLevel: exam.accessLevel || 'free',
    allowDownload: exam.allowDownload !== undefined ? exam.allowDownload : true,
    status: exam.status || 'published',
    pdfUrl,
    pdfStoragePath: (exam as any).pdfStoragePath || '',
    fileSize: Number(exam.fileSize || 0),
    pageCount: Number(exam.pageCount || 0),
    createdAt: exam.createdAt || now,
    updatedAt: now
  };

  const estimatedBytes = new TextEncoder().encode(JSON.stringify(cleanExam)).length;
  if (estimatedBytes > 850 * 1024) {
    console.warn(`[Firestore] Exam document estimated size (${estimatedBytes} bytes) near 1MB ceiling. Pruning oversized fields.`);
    if (cleanExam.pdfUrl && cleanExam.pdfUrl.startsWith('data:')) {
      cleanExam.pdfUrl = '';
    }
    if (cleanExam.description && cleanExam.description.length > 20000) {
      cleanExam.description = cleanExam.description.slice(0, 20000);
    }
  }

  try {
    await setDoc(doc(currentDb, 'exams', id), cleanExam);
    return { success: true, exam: cleanExam };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExamFromFirestore(examId: string): Promise<{ success: boolean; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };
  const path = `exams/${examId}`;

  try {
    await deleteDoc(doc(currentDb, 'exams', examId));
    // Also delete associated questions
    try {
      const q = query(collection(currentDb, 'questions'), where('examId', '==', examId));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await deleteDoc(doc(currentDb, 'questions', d.id));
      });
    } catch {}

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function togglePublishExamInFirestore(examId: string, status: 'published' | 'draft' | 'archived'): Promise<{ success: boolean; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };
  const path = `exams/${examId}`;

  try {
    await setDoc(doc(currentDb, 'exams', examId), { status, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// 5. "questions" COLLECTION: Exam Questions, Options & Explanations
// ============================================================================

export async function fetchQuestionsForExamFromFirestore(examId: string): Promise<FirestoreQuestion[]> {
  const currentDb = getDb();
  let dbQuestions: FirestoreQuestion[] = [];

  if (currentDb) {
    try {
      const q = query(collection(currentDb, 'questions'), where('examId', '==', examId));
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        const item = docSnap.data() as FirestoreQuestion;
        dbQuestions.push({ ...item, id: docSnap.id });
      });
    } catch (e) {
      console.warn('[Firestore Questions] Notice, checking initial dataset:', e);
    }
  }

  // Combine with initial questions
  const initialMatches = INITIAL_QUESTIONS.filter(q => q.examId === examId);
  const qMap = new Map<string, FirestoreQuestion>();
  initialMatches.forEach(q => qMap.set(q.id, q));
  dbQuestions.forEach(q => qMap.set(q.id, q));

  return Array.from(qMap.values()).sort((a, b) => a.questionNumber - b.questionNumber);
}

export async function saveQuestionToFirestore(question: Partial<FirestoreQuestion>): Promise<{ success: boolean; question?: FirestoreQuestion; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };

  if (!question.examId) return { success: false, error: 'examId is required' };

  const id = question.id || `q_${question.examId}_${question.questionNumber || Date.now()}`;
  const now = new Date().toISOString();
  const path = `questions/${id}`;

  const cleanQuestion: FirestoreQuestion = {
    id,
    examId: question.examId,
    questionNumber: Number(question.questionNumber || 1),
    text: question.text?.trim() || 'Question text',
    textAmharic: question.textAmharic?.trim() || '',
    options: question.options || [
      { id: 'A', text: 'Option A' },
      { id: 'B', text: 'Option B' },
      { id: 'C', text: 'Option C' },
      { id: 'D', text: 'Option D' }
    ],
    correctAnswerId: question.correctAnswerId || 'A',
    explanation: question.explanation?.trim() || '',
    explanationAmharic: question.explanationAmharic?.trim() || '',
    difficulty: question.difficulty || 'medium',
    points: Number(question.points || 1),
    createdAt: question.createdAt || now
  };

  try {
    await setDoc(doc(currentDb, 'questions', id), cleanQuestion);
    return { success: true, question: cleanQuestion };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuestionFromFirestore(questionId: string): Promise<{ success: boolean; error?: string }> {
  const currentDb = getDb();
  if (!currentDb) return { success: false, error: 'Database service unavailable' };
  const path = `questions/${questionId}`;

  try {
    await deleteDoc(doc(currentDb, 'questions', questionId));
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 6. "results" COLLECTION: Student Exam Scores, Answers & Performance History
// ============================================================================

export async function saveExamResultToFirestore(result: Partial<FirestoreResult> & { userId: string; examId: string }): Promise<{ success: boolean; result?: FirestoreResult; error?: string }> {
  const currentDb = getDb();
  const id = result.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const path = `results/${id}`;

  const cleanResult: FirestoreResult = {
    id,
    userId: result.userId,
    examId: result.examId,
    examTitle: result.examTitle || 'Exam Submission',
    subject: result.subject || 'General',
    score: Number(result.score || 0),
    totalQuestions: Number(result.totalQuestions || 1),
    correctAnswers: Number(result.correctAnswers || 0),
    percentage: Number(result.percentage || 0),
    passed: Boolean(result.passed),
    timeSpentSeconds: Number(result.timeSpentSeconds || 0),
    answers: result.answers || {},
    completedAt: result.completedAt || now,
    createdAt: result.createdAt || now
  };

  if (currentDb) {
    try {
      await setDoc(doc(currentDb, 'results', id), cleanResult);
      
      // Update user statistics in users collection
      try {
        const userDocRef = doc(currentDb, 'users', result.userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          const addedMinutes = Math.max(1, Math.round(cleanResult.timeSpentSeconds / 60));
          await setDoc(userDocRef, {
            totalStudyMinutes: (u.totalStudyMinutes || 0) + addedMinutes,
            updatedAt: now
          }, { merge: true });
        }
      } catch {}

    } catch (error) {
      console.warn('[Firestore saveExamResult error]:', error);
    }
  }

  // Also cache locally for immediate UI reactivity
  try {
    const key = `ethiolearn_results_${result.userId}`;
    const raw = localStorage.getItem(key);
    const list: FirestoreResult[] = raw ? JSON.parse(raw) : [];
    list.unshift(cleanResult);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  } catch {}

  return { success: true, result: cleanResult };
}

export async function fetchUserExamResultsFromFirestore(userId: string): Promise<FirestoreResult[]> {
  const currentDb = getDb();
  let dbResults: FirestoreResult[] = [];

  if (currentDb && userId) {
    try {
      const q = query(collection(currentDb, 'results'), where('userId', '==', userId));
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        const item = docSnap.data() as FirestoreResult;
        dbResults.push({ ...item, id: docSnap.id });
      });
    } catch (e) {
      console.warn('[Firestore User Results notice]:', e);
    }
  }

  // Fallback to local storage
  let localResults: FirestoreResult[] = [];
  try {
    const key = `ethiolearn_results_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) localResults = list;
    }
  } catch {}

  const resultMap = new Map<string, FirestoreResult>();
  localResults.forEach(r => resultMap.set(r.id, r));
  dbResults.forEach(r => resultMap.set(r.id, r));

  return Array.from(resultMap.values()).sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
}

// ============================================================================
// 7. AUTO-SEEDING INITIAL AUTHENTIC FIRESTORE DATA
// ============================================================================

export async function seedInitialFirestoreData(): Promise<void> {
  const currentDb = getDb();
  if (!currentDb) return;

  try {
    const seededFlagKey = 'ethiolearn_firestore_seeded_v1';
    if (typeof localStorage !== 'undefined' && localStorage.getItem(seededFlagKey)) {
      return;
    }

    // 1. Seed Books
    for (const b of INITIAL_BOOKS) {
      const bookDoc = doc(currentDb, 'books', b.id);
      const snap = await getDoc(bookDoc);
      if (!snap.exists()) {
        await setDoc(bookDoc, b);
      }
    }

    // 2. Seed Chapters
    for (const c of INITIAL_CHAPTERS) {
      const chapDoc = doc(currentDb, 'chapters', c.id);
      const snap = await getDoc(chapDoc);
      if (!snap.exists()) {
        await setDoc(chapDoc, c);
      }
    }

    // 3. Seed Exams
    for (const e of INITIAL_EXAMS) {
      const examDoc = doc(currentDb, 'exams', e.id);
      const snap = await getDoc(examDoc);
      if (!snap.exists()) {
        await setDoc(examDoc, e);
      }
    }

    // 4. Seed Questions
    for (const q of INITIAL_QUESTIONS) {
      const qDoc = doc(currentDb, 'questions', q.id);
      const snap = await getDoc(qDoc);
      if (!snap.exists()) {
        await setDoc(qDoc, q);
      }
    }

    // 5. Seed Promotions
    for (const p of DEFAULT_PROMOTIONS) {
      const pDoc = doc(currentDb, 'promotions', p.code);
      const snap = await getDoc(pDoc);
      if (!snap.exists()) {
        await setDoc(pDoc, p);
      }
    }

    // 6. Seed Notes
    for (const n of INITIAL_NOTES) {
      const nDoc = doc(currentDb, 'notes', n.id);
      const snap = await getDoc(nDoc);
      if (!snap.exists()) {
        await setDoc(nDoc, n);
      }
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(seededFlagKey, 'true');
    }
    console.log('[Firestore] Successfully initialized and verified real standalone dataset in Firestore.');
  } catch (err) {
    console.info('[Firestore] Seeding notice (cached mode active):', err);
  }
}

/**
 * Fetch published study notes from Firestore with local fallback
 */
export async function fetchPublishedNotesFromFirestore(filters: NoteFilters = {}): Promise<FirestoreStudyNote[]> {
  const currentDb = getDb();
  let dbNotes: FirestoreStudyNote[] = [];

  if (currentDb) {
    try {
      const snap = await getDocs(collection(currentDb, 'notes'));
      snap.forEach(docSnap => {
        const item = docSnap.data() as FirestoreStudyNote;
        dbNotes.push({ ...item, id: docSnap.id });
      });
    } catch (e) {
      console.warn('[Firestore Notes] Notice, using initial/cached dataset:', e);
    }
  }

  // Fallback to local storage cache if available
  let localNotes: FirestoreStudyNote[] = [];
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ethiolearn_admin_notes') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localNotes = parsed;
    }
  } catch {}

  // Combine with initial authentic notes and local cache
  const noteMap = new Map<string, FirestoreStudyNote>();
  INITIAL_NOTES.forEach(n => noteMap.set(n.id, n));
  localNotes.forEach(n => noteMap.set(n.id, n));
  dbNotes.forEach(n => noteMap.set(n.id, n));

  let results = Array.from(noteMap.values());

  if (filters.status && filters.status !== 'all') {
    results = results.filter(n => n.status === filters.status);
  } else if (!filters.status) {
    results = results.filter(n => n.status === 'published' || !n.status);
  }

  if (filters.university && filters.university !== 'all') {
    results = results.filter(n => n.university?.toLowerCase().includes(filters.university!.toLowerCase()));
  }
  if (filters.department && filters.department !== 'all') {
    results = results.filter(n => n.department?.toLowerCase().includes(filters.department!.toLowerCase()));
  }
  if (filters.academicYear && filters.academicYear !== 'all') {
    results = results.filter(n => n.academicYear === filters.academicYear || n.academicYear?.includes(filters.academicYear!));
  }
  if (filters.course && filters.course !== 'all') {
    results = results.filter(n => n.course?.toLowerCase().includes(filters.course!.toLowerCase()));
  }
  if (filters.subject && filters.subject !== 'all') {
    results = results.filter(n => n.subject?.toLowerCase().includes(filters.subject!.toLowerCase()));
  }
  if (filters.accessLevel && filters.accessLevel !== 'all') {
    results = results.filter(n => n.accessLevel === filters.accessLevel);
  }
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    results = results.filter(n => 
      n.title.toLowerCase().includes(s) || 
      (n.description && n.description.toLowerCase().includes(s)) ||
      (n.content && n.content.toLowerCase().includes(s)) ||
      n.subject.toLowerCase().includes(s) ||
      n.course.toLowerCase().includes(s)
    );
  }

  return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Fetch all notes (including drafts) for Admin
 */
export async function fetchAdminNotesFromFirestore(): Promise<FirestoreStudyNote[]> {
  return fetchPublishedNotesFromFirestore({ status: 'all' });
}

/**
 * Save or update a study note in Firestore
 */
export async function saveAdminNoteToFirestore(noteData: Partial<FirestoreStudyNote>): Promise<FirestoreStudyNote> {
  const currentDb = getDb();
  const id = noteData.id || `note_${Date.now()}`;
  const now = new Date().toISOString();

  const fullNote: FirestoreStudyNote = {
    id,
    title: noteData.title || 'Untitled Note',
    description: noteData.description || '',
    university: noteData.university || 'Wolkite University',
    department: noteData.department || 'Freshman Common Courses',
    academicYear: noteData.academicYear || 'Year 1 (Freshman)',
    course: noteData.course || 'General',
    subject: noteData.subject || 'General',
    unit: noteData.unit || 'Unit 1',
    content: noteData.content || '',
    accessLevel: noteData.accessLevel || 'free',
    allowDownload: noteData.allowDownload !== undefined ? noteData.allowDownload : true,
    status: noteData.status || 'published',
    pdfUrl: noteData.pdfUrl,
    pdfStoragePath: noteData.pdfStoragePath,
    fileSize: noteData.fileSize,
    tags: noteData.tags || [],
    author: noteData.author || 'Educator',
    createdAt: noteData.createdAt || now,
    updatedAt: now
  };

  if (currentDb) {
    try {
      const noteDoc = doc(currentDb, 'notes', id);
      await setDoc(noteDoc, fullNote, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error saving admin note:', err);
    }
  }

  // Resilient local caching so educator never loses published notes
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ethiolearn_admin_notes') : null;
    const list: FirestoreStudyNote[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(n => n.id !== id);
    filtered.unshift(fullNote);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ethiolearn_admin_notes', JSON.stringify(filtered));
    }
  } catch {}

  return fullNote;
}

/**
 * Delete a study note from Firestore
 */
export async function deleteAdminNoteFromFirestore(noteId: string): Promise<boolean> {
  const currentDb = getDb();
  if (currentDb) {
    try {
      await deleteDoc(doc(currentDb, 'notes', noteId));
    } catch (err) {
      console.warn('[Firestore] Error deleting admin note:', err);
    }
  }
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ethiolearn_admin_notes') : null;
    if (raw) {
      const list: FirestoreStudyNote[] = JSON.parse(raw);
      localStorage.setItem('ethiolearn_admin_notes', JSON.stringify(list.filter(n => n.id !== noteId)));
    }
  } catch {}
  return true;
}

/**
 * Toggle published status of a study note
 */
export async function togglePublishAdminNoteInFirestore(noteId: string, currentStatus: string): Promise<boolean> {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  const currentDb = getDb();
  if (currentDb) {
    try {
      await updateDoc(doc(currentDb, 'notes', noteId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Firestore] Error toggling note status:', err);
    }
  }
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ethiolearn_admin_notes') : null;
    if (raw) {
      const list: FirestoreStudyNote[] = JSON.parse(raw);
      const updated = list.map(n => n.id === noteId ? { ...n, status: newStatus as any, updatedAt: new Date().toISOString() } : n);
      localStorage.setItem('ethiolearn_admin_notes', JSON.stringify(updated));
    }
  } catch {}
  return true;
}

// ============================================================================
// 8. ANNOUNCEMENTS & CAMPUS POSTS FIRESTORE INTEGRATION
// ============================================================================

export interface FirestoreAnnouncementItem {
  id: string;
  title: string;
  message: string;
  badgeText?: string;
  isImportant?: boolean;
  status: 'published' | 'draft' | 'archived';
  date: string;
  createdAt?: string;
}

/**
 * Fetch platform announcements from Firestore with resilient local fallback
 */
export async function fetchAnnouncementsFromFirestore(publishedOnly: boolean = false): Promise<FirestoreAnnouncementItem[]> {
  const currentDb = getDb();
  let dbAnnouncements: FirestoreAnnouncementItem[] = [];

  if (currentDb) {
    try {
      const snap = await getDocs(collection(currentDb, 'announcements'));
      snap.forEach(docSnap => {
        const item = docSnap.data() as FirestoreAnnouncementItem;
        dbAnnouncements.push({ ...item, id: docSnap.id });
      });
    } catch (err) {
      console.warn('[Firestore Announcements notice]:', err);
    }
  }

  let localAnnouncements: FirestoreAnnouncementItem[] = [];
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ethiolearn_announcements') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localAnnouncements = parsed;
    }
  } catch {}

  const map = new Map<string, FirestoreAnnouncementItem>();
  localAnnouncements.forEach(a => map.set(a.id, a));
  dbAnnouncements.forEach(a => map.set(a.id, a));

  let results = Array.from(map.values()).sort((a, b) => {
    return new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
  });

  if (publishedOnly) {
    results = results.filter(a => a.status === 'published' || !a.status);
  }

  return results;
}

/**
 * Save or publish an announcement to Firestore and local cache
 */
export async function saveAnnouncementToFirestore(annData: Partial<FirestoreAnnouncementItem>): Promise<FirestoreAnnouncementItem> {
  const currentDb = getDb();
  const id = annData.id || `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const dateStr = annData.date || now.split('T')[0];

  const fullAnn: FirestoreAnnouncementItem = {
    id,
    title: annData.title?.trim() || 'Platform Notice',
    message: annData.message?.trim() || '',
    badgeText: annData.badgeText?.trim() || 'Notice',
    isImportant: Boolean(annData.isImportant),
    status: (['published', 'draft', 'archived'].includes(annData.status as any) ? annData.status : 'published') as any,
    date: dateStr,
    createdAt: annData.createdAt || now,
  };

  if (currentDb) {
    try {
      const annDoc = doc(currentDb, 'announcements', id);
      await setDoc(annDoc, fullAnn, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error saving announcement:', err);
    }
  }

  // Update local storage cache
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ethiolearn_announcements') : null;
    const list: FirestoreAnnouncementItem[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(a => a.id !== id);
    filtered.unshift(fullAnn);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ethiolearn_announcements', JSON.stringify(filtered));
    }
  } catch {}

  // Dispatch global event for instant UI reactivity
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ethiolearn_data_updated'));
    }
  } catch {}

  return fullAnn;
}

/**
 * Delete an announcement from Firestore and local cache
 */
export async function deleteAnnouncementFromFirestore(annId: string): Promise<boolean> {
  const currentDb = getDb();
  if (currentDb) {
    try {
      await deleteDoc(doc(currentDb, 'announcements', annId));
    } catch (err) {
      console.warn('[Firestore] Error deleting announcement:', err);
    }
  }

  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ethiolearn_announcements') : null;
    if (raw) {
      const list: FirestoreAnnouncementItem[] = JSON.parse(raw);
      localStorage.setItem('ethiolearn_announcements', JSON.stringify(list.filter(a => a.id !== annId)));
    }
  } catch {}

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ethiolearn_data_updated'));
    }
  } catch {}

  return true;
}


