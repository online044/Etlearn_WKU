/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Supabase Storage Integration for University Books
 * Direct access to Supabase 'books' bucket with zero Google Drive dependencies.
 */

import { getSupabase } from './supabaseClient';
import { safeStorage } from './safeStorage';

export interface SupabaseStorageFile {
  name: string;
  id?: string;
  size?: number;
  publicUrl: string;
  created_at?: string;
  updated_at?: string;
}

export const SUPABASE_BOOKS_BUCKET = 'books';
export const CANDIDATE_BOOK_BUCKETS = ['books', 'book', 'pdfs', 'pdf', 'textbooks', 'documents', 'files', 'public', 'modules', 'courses', 'exams'];

/**
 * Auto-creates the 'books' storage bucket in Supabase if missing
 */
export async function ensureBooksBucketExists(bucket: string = SUPABASE_BOOKS_BUCKET): Promise<boolean> {
  try {
    const supa = getSupabase();
    if (!supa) return false;
    const { error } = await supa.storage.createBucket(bucket, { public: true });
    if (!error || error.message?.includes('already exists') || (error as any).statusCode === '409') {
      return true;
    }
  } catch {
    // Ignore permissions notice
  }
  return false;
}

/**
 * Derives a full public URL for a file in Supabase Storage
 */
export function getSupabaseStoragePublicUrl(bucket: string = SUPABASE_BOOKS_BUCKET, pathOrFilename: string): string {
  if (!pathOrFilename || typeof pathOrFilename !== 'string') return '';
  const clean = pathOrFilename.trim().replace(/^['"]+|['"]+$/g, '');
  if (!clean) return '';

  // If already an absolute HTTP URL, return as-is
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Detect bucket if prefix supplied in path (e.g. "pdfs/Economics.pdf" or "book/file.pdf")
  let targetBucket = bucket;
  let cleanPath = clean;

  const parts = clean.split('/');
  if (parts.length > 1 && CANDIDATE_BOOK_BUCKETS.includes(parts[0].toLowerCase())) {
    targetBucket = parts[0];
    cleanPath = parts.slice(1).join('/');
  } else {
    cleanPath = clean.replace(new RegExp(`^${bucket}/`, 'i'), '').replace(/^\/+/, '');
  }

  // 1. Try via Supabase client instance
  try {
    const supa = getSupabase();
    if (supa) {
      const { data } = supa.storage.from(targetBucket).getPublicUrl(cleanPath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  } catch (err) {
    console.warn('[supabaseStorage] getPublicUrl error:', err);
  }

  // 2. Fallback using configured Supabase URL
  const storedUrl = safeStorage.getItem('ethiolearn_supabase_url');
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const baseUrl = (storedUrl || envUrl || '').trim().replace(/\/+$/, '');

  if (baseUrl) {
    return `${baseUrl}/storage/v1/object/public/${targetBucket}/${encodeURIComponent(cleanPath)}`;
  }

  return cleanPath;
}

/**
 * Lists all uploaded PDF books across available Supabase Storage buckets ('books', 'book', 'pdfs', etc.)
 */
export async function listSupabaseBooksFiles(preferredBucket: string = SUPABASE_BOOKS_BUCKET): Promise<SupabaseStorageFile[]> {
  try {
    const supa = getSupabase();
    if (!supa) {
      console.warn('[supabaseStorage] Supabase client not initialized yet');
      return [];
    }

    // Try creating preferred 'books' bucket if missing
    await ensureBooksBucketExists(preferredBucket);

    // Dynamically discover actual buckets present in the user's Supabase Storage project
    let bucketsToSearch = Array.from(new Set([preferredBucket, ...CANDIDATE_BOOK_BUCKETS]));
    try {
      const { data: userBuckets } = await supa.storage.listBuckets();
      if (userBuckets && userBuckets.length > 0) {
        const discoveredNames = userBuckets.map(b => b.name).filter(Boolean);
        bucketsToSearch = Array.from(new Set([preferredBucket, ...discoveredNames, ...CANDIDATE_BOOK_BUCKETS]));
      }
    } catch {}

    const allFiles: SupabaseStorageFile[] = [];
    const seenFileKeys = new Set<string>();

    for (const bName of bucketsToSearch) {
      try {
        const { data, error } = await supa.storage.from(bName).list('', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

        if (error || !data || data.length === 0) {
          // Silent skip for missing bucket ("no such bucket", 404, etc.)
          continue;
        }

        for (const item of data) {
          if (!item.name || item.name.startsWith('.')) continue;

          const uniqueKey = `${bName}/${item.name}`.toLowerCase();
          if (seenFileKeys.has(uniqueKey)) continue;
          seenFileKeys.add(uniqueKey);

          const { data: urlData } = supa.storage.from(bName).getPublicUrl(item.name);
          const publicUrl = urlData?.publicUrl || getSupabaseStoragePublicUrl(bName, item.name);

          allFiles.push({
            name: item.name,
            id: item.id || uniqueKey,
            size: (item as any).metadata?.size,
            publicUrl,
            created_at: item.created_at,
            updated_at: item.updated_at
          });
        }
      } catch {
        // Continue searching next candidate bucket
      }
    }

    return allFiles;
  } catch (err) {
    console.warn('[supabaseStorage] Exception in listSupabaseBooksFiles:', err);
    return [];
  }
}

/**
 * Normalizes a text string for fuzzy filename matching
 */
function normalizeForMatching(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/module|compressed|revised|final|october|2022|2023|2024|2025|flen|1011|1012/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Resolves the most accurate Supabase Storage PDF URL for a given book record
 */
export function resolveBookSupabasePdfUrl(
  book: {
    id?: string;
    title?: string;
    code?: string;
    subject?: string;
    pdf_url?: string;
    storageFileName?: string;
  },
  availableBucketFiles: SupabaseStorageFile[] = []
): { pdfUrl: string; downloadUrl: string; fileName: string } {
  // 1. Explicit pdf_url (e.g. from Supabase courses table)
  if (book.pdf_url && book.pdf_url.trim()) {
    const fullUrl = getSupabaseStoragePublicUrl(SUPABASE_BOOKS_BUCKET, book.pdf_url.trim());
    return {
      pdfUrl: fullUrl,
      downloadUrl: fullUrl,
      fileName: book.pdf_url.split('/').pop() || `${book.id || 'book'}.pdf`
    };
  }

  // 2. Check if available bucket files match storageFileName or title
  if (availableBucketFiles.length > 0) {
    // Exact storageFileName match
    if (book.storageFileName) {
      const exactMatch = availableBucketFiles.find(
        f => f.name.toLowerCase() === book.storageFileName!.toLowerCase()
      );
      if (exactMatch) {
        return {
          pdfUrl: exactMatch.publicUrl,
          downloadUrl: exactMatch.publicUrl,
          fileName: exactMatch.name
        };
      }
    }

    // Fuzzy matching against available uploaded files in 'books' bucket
    const normTitle = normalizeForMatching(book.title || '');
    const normSubject = normalizeForMatching(book.subject || '');
    const normId = normalizeForMatching(book.id || '');
    const normCode = normalizeForMatching(book.code || '');

    for (const f of availableBucketFiles) {
      const normFileName = normalizeForMatching(f.name);
      if (
        (normTitle && normFileName.includes(normTitle)) ||
        (normFileName && normTitle.includes(normFileName)) ||
        (normSubject && normFileName.includes(normSubject)) ||
        (normId && normFileName.includes(normId)) ||
        (normCode && normFileName.includes(normCode))
      ) {
        return {
          pdfUrl: f.publicUrl,
          downloadUrl: f.publicUrl,
          fileName: f.name
        };
      }
    }
  }

  // 3. Fallback to candidate storageFileName in Supabase 'books' bucket
  const targetFileName = book.storageFileName || `${(book.title || book.id || 'book').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const derivedUrl = getSupabaseStoragePublicUrl(SUPABASE_BOOKS_BUCKET, targetFileName);

  return {
    pdfUrl: derivedUrl,
    downloadUrl: derivedUrl,
    fileName: targetFileName
  };
}
