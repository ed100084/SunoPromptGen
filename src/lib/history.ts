import type { HistoryEntry, SongState } from '../types';
import { STORAGE_KEYS, getJSON, setJSON, removeItem } from './storage';

const MAX_ENTRIES = 50;

export function loadHistory(): HistoryEntry[] {
  const data = getJSON<HistoryEntry[]>(STORAGE_KEYS.history, []);
  return Array.isArray(data) ? data : [];
}

export function saveHistory(entries: HistoryEntry[]): void {
  const trimmed = entries.slice(0, MAX_ENTRIES);
  setJSON(STORAGE_KEYS.history, trimmed);
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
  removeItem(STORAGE_KEYS.history);
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
