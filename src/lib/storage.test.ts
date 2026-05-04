import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STORAGE_KEYS, getItem, setItem, removeItem, getJSON, setJSON } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('STORAGE_KEYS 全部以 suno_ 前綴', () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(key).toMatch(/^suno_/);
    }
  });

  it('setItem / getItem 正確讀寫', () => {
    setItem(STORAGE_KEYS.apiKey, 'sk-test');
    expect(getItem(STORAGE_KEYS.apiKey)).toBe('sk-test');
  });

  it('getItem 對未設定 key 回傳 null', () => {
    expect(getItem(STORAGE_KEYS.apiKey)).toBeNull();
  });

  it('removeItem 能清除', () => {
    setItem(STORAGE_KEYS.apiKey, 'x');
    removeItem(STORAGE_KEYS.apiKey);
    expect(getItem(STORAGE_KEYS.apiKey)).toBeNull();
  });

  it('setJSON / getJSON 正確序列化物件', () => {
    setJSON(STORAGE_KEYS.history, [{ id: '1', title: 'hi' }]);
    const result = getJSON<Array<{ id: string; title: string }>>(STORAGE_KEYS.history, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('getJSON 解析失敗時回 fallback', () => {
    localStorage.setItem(STORAGE_KEYS.history, 'not-json');
    const result = getJSON<string[]>(STORAGE_KEYS.history, ['fallback']);
    expect(result).toEqual(['fallback']);
  });

  it('getJSON 對未設定 key 回 fallback', () => {
    const result = getJSON<number>(STORAGE_KEYS.history, 42);
    expect(result).toBe(42);
  });

  it('setItem 拋錯時不中斷', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => setItem(STORAGE_KEYS.apiKey, 'x')).not.toThrow();
    spy.mockRestore();
  });
});
