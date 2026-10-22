/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Lightweight Image Compression Utility
 * Prevents Firestore 1MB document size violations by downscaling and compressing
 * book covers, avatars, and thumbnails into compact web-ready base64 strings (<50KB).
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number;
}

/**
 * Compresses an image file, blob, or data URL string to a compact JPEG base64 string.
 * Guarantees that the output will fit well within Firestore's 1MB document limit.
 */
export async function compressImageToBase64(
  input: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 360,
    maxHeight = 520,
    quality = 0.72,
    maxBytes = 60 * 1024 // 60 KB safety ceiling
  } = options;

  if (typeof window === 'undefined') {
    return typeof input === 'string' ? input : '';
  }

  // If input is already an external URL or small string, return as-is
  if (typeof input === 'string') {
    if (!input.startsWith('data:image/')) {
      return input;
    }
    // If it's already a tiny data URL (< 30KB), return as-is
    if (input.length < 30 * 1024) {
      return input;
    }
  }

  return new Promise((resolve) => {
    let srcUrl = '';
    let needsRevoke = false;

    if (input instanceof File || input instanceof Blob) {
      srcUrl = URL.createObjectURL(input);
      needsRevoke = true;
    } else if (typeof input === 'string') {
      srcUrl = input;
    } else {
      return resolve('');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (needsRevoke && srcUrl) {
        URL.revokeObjectURL(srcUrl);
      }
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          cleanup();
          return resolve(typeof input === 'string' ? input.slice(0, maxBytes) : '');
        }

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(Math.round(width * ratio), 1);
          height = Math.max(Math.round(height * ratio), 1);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          cleanup();
          return resolve(typeof input === 'string' ? input.slice(0, maxBytes) : '');
        }

        // Fill background with warm dark slate to prevent transparent PNGs rendering black
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // If still exceeds safety ceiling, re-encode with slightly lower quality
        if (compressedDataUrl.length > maxBytes) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', Math.max(quality - 0.2, 0.45));
        }

        cleanup();
        resolve(compressedDataUrl);
      } catch (err) {
        cleanup();
        console.warn('[ImageCompressor] Canvas compression failed, falling back:', err);
        resolve(typeof input === 'string' ? input.slice(0, maxBytes) : '');
      }
    };

    img.onerror = (err) => {
      cleanup();
      console.warn('[ImageCompressor] Image failed to load for compression:', err);
      resolve(typeof input === 'string' ? input.slice(0, maxBytes) : '');
    };

    img.src = srcUrl;
  });
}
