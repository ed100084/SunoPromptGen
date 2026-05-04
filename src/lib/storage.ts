/**
 * 集中管理 localStorage keys 與安全存取。
 *
 * 所有 key 統一以 `suno_` 前綴避免與其他應用衝突。
 * 集中於此可方便未來：
 *   - 改用 IndexedDB 或其他儲存方案
 *   - 加入 schema 版本控制與遷移
 *   - 統一 try/catch 錯誤處理
 */

export const STORAGE_KEYS = {
  apiKey: 'suno_api_key',
  apiProvider: 'suno_api_provider',
  apiModel: 'suno_api_model',
  apiBase: 'suno_api_base',
  theme: 'suno_theme',
  history: 'suno_history_v1',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** 安全讀取字串（失敗回傳 null）。 */
export function getItem(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 安全寫入字串（失敗時 console.warn 不中斷）。 */
export function setItem(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[storage] setItem failed for ${key}:`, err);
  }
}

/** 安全刪除。 */
export function removeItem(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[storage] removeItem failed for ${key}:`, err);
  }
}

/** 讀取並 JSON.parse，失敗回傳 fallback。 */
export function getJSON<T>(key: StorageKey, fallback: T): T {
  const raw = getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON.stringify 後寫入。 */
export function setJSON(key: StorageKey, value: unknown): void {
  try {
    setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] setJSON failed for ${key}:`, err);
  }
}
