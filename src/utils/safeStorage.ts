/**
 * Safe localStorage wrapper to prevent crashes on iOS/Safari in private mode,
 * inside sandboxed iframes, or when storage limits are exceeded.
 */

class InMemoryStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

const memoryStore = new InMemoryStorage();
let isStorageAvailable = false;

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const testKey = '__storage_test_key__';
    window.localStorage.setItem(testKey, testKey);
    const retrieved = window.localStorage.getItem(testKey);
    window.localStorage.removeItem(testKey);
    if (retrieved === testKey) {
      isStorageAvailable = true;
    }
  }
} catch (e) {
  isStorageAvailable = false;
  console.warn('[SafeStorage] Native localStorage is not fully accessible. Using in-memory fallback.', e);
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (!isStorageAvailable) {
      return memoryStore.getItem(key);
    }
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return memoryStore.getItem(key);
    }
  },

  setItem(key: string, value: string): void {
    if (!isStorageAvailable) {
      memoryStore.setItem(key, value);
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to setItem for key "${key}". Falling back to in-memory store.`, e);
      memoryStore.setItem(key, value);
    }
  },

  removeItem(key: string): void {
    if (!isStorageAvailable) {
      memoryStore.removeItem(key);
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      memoryStore.removeItem(key);
    }
  },

  clear(): void {
    if (!isStorageAvailable) {
      memoryStore.clear();
      return;
    }
    try {
      window.localStorage.clear();
    } catch (e) {
      memoryStore.clear();
    }
  }
};
