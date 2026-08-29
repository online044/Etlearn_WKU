/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StudentProfile, CustomNote, Promotion } from '../types';

// Safe initialization to prevent "duplicate default app" warnings and missing service crashes
export const app = (() => {
  try {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (err) {
    console.warn('[Firebase App] Initialization failed:', err);
    return null as any;
  }
})();

export const db = (() => {
  if (!app) return null;
  const dbId = (firebaseConfig as any).firestoreDatabaseId || undefined;
  try {
    if (dbId) {
      try {
        return initializeFirestore(app, {
          experimentalForceLongPolling: true,
        }, dbId);
      } catch {
        return getFirestore(app, dbId);
      }
    }
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
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
    console.warn('[Firestore Service] Firestore database instance is not available.');
    return;
  }
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore network timeout')), 3000)
    );
    await Promise.race([
      getDocFromServer(doc(currentDb, 'test', 'connection')),
      timeoutPromise
    ]);
    console.log('[Firestore Service] Initial boot liveness check succeeded.');
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    } else {
      console.warn("[Firestore Service] Operating in cached/offline mode:", error?.message || error);
    }
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
