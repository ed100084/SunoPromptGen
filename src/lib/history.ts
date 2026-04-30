import type { HistoryEntry, SongState } from '../types';

const STORAGE_KEY = 'suno_history_v1';
const MAX_ENTRIES = 50;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  try {
    const trimmed = entries.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('History save failed:', err);
  }
}

export function addEntry(state: SongState, stylePrompt: string, lyricsPrompt: string): HistoryEntry {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: Date.now(),
    title: state.songTitle || `未命名 (${new Date().toLocaleString('zh-TW')})`,
    state,
    stylePrompt,
    lyricsPrompt,
  };
  const all = loadHistory();
  saveHistory([entry, ...all]);
  return entry;
}

export function deleteEntry(id: string): void {
  const all = loadHistory();
  saveHistory(all.filter((e) => e.id !== id));
}

export function clearAll(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportAll(): string {
  return JSON.stringify(loadHistory(), null, 2);
}

export function importAll(json: string): number {
  const data = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error('JSON 必須是陣列');
  saveHistory(data);
  return data.length;
}
