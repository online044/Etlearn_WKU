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

/**
 * Derives a full public URL for a file in Supabase Storage 'books' bucket
 */
export function getSupabaseStoragePublicUrl(bucket: string = SUPABASE_BOOKS_BUCKET, pathOrFilename: string): string {
  if (!pathOrFilename || typeof pathOrFilename !== 'string') return '';
  const clean = pathOrFilename.trim().replace(/^['"]+|['"]+$/g, '');
  if (!clean) return '';

  // If already an absolute HTTP URL, return as-is
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Strip bucket prefix if user passed "books/Economics.pdf"
  const cleanPath = clean.replace(new RegExp(`^${bucket}/`, 'i'), '').replace(/^\/+/, '');

  // 1. Try via Supabase client instance
  try {
    const supa = getSupabase();
    if (supa) {
      const { data } = supa.storage.from(bucket).getPublicUrl(cleanPath);
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
    return `${baseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(cleanPath)}`;
  }

  return cleanPath;
}

/**
 * Lists all uploaded PDF books inside the Supabase 'books' bucket
 */
export async function listSupabaseBooksFiles(bucket: string = SUPABASE_BOOKS_BUCKET): Promise<SupabaseStorageFile[]> {
  try {
    const supa = getSupabase();
    if (!supa) {
      console.warn('[supabaseStorage] Supabase client not initialized yet');
      return [];
    }

    const { data, error } = await supa.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) {
      console.warn(`[supabaseStorage] Error listing files from '${bucket}' bucket:`, error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data
      .filter(item => item.name && !item.name.startsWith('.'))
      .map(item => {
        const { data: urlData } = supa.storage.from(bucket).getPublicUrl(item.name);
        return {
          name: item.name,
          id: item.id,
          size: (item as any).metadata?.size,
          publicUrl: urlData?.publicUrl || getSupabaseStoragePublicUrl(bucket, item.name),
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });
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
