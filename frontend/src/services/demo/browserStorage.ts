/** Minimal key/value storage used by the demo adapter (subset of the Web Storage API). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const createMemoryStorage = (): KeyValueStorage => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    }
  };
};

/**
 * Wraps `localStorage` so that any failure (private mode, blocked site data, quota,
 * sandboxed iframe...) silently falls back to an in-memory copy. The demo keeps
 * working; data just won't survive a reload in that case.
 */
export const createBrowserStorage = (
  resolveStorage: () => KeyValueStorage = () => window.localStorage
): KeyValueStorage => {
  const memory = createMemoryStorage();

  const withStorage = <T>(action: (storage: KeyValueStorage) => T, fallback: () => T): T => {
    try {
      return action(resolveStorage());
    } catch {
      return fallback();
    }
  };

  return {
    // The in-memory copy always holds this session's latest write, so it wins over a
    // possibly stale value left in localStorage by a failed write (e.g. quota exceeded).
    getItem: (key) =>
      memory.getItem(key) ??
      withStorage(
        (storage) => storage.getItem(key),
        () => null
      ),
    setItem: (key, value) => {
      memory.setItem(key, value);
      withStorage(
        (storage) => storage.setItem(key, value),
        () => undefined
      );
    },
    removeItem: (key) => {
      memory.removeItem(key);
      withStorage(
        (storage) => storage.removeItem(key),
        () => undefined
      );
    }
  };
};
