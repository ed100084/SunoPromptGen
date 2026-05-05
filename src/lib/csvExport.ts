/**
 * 把歷史紀錄 + 評分匯出成 CSV，方便用 Excel/Sheets 分析自己的成功 prompt
 * pattern。包含 RFC4180 escaping。
 */

import type { HistoryEntry } from '../types';

/** RFC4180：含逗號 / 雙引號 / 換行的欄位需用雙引號包起，內部雙引號重複。 */
function csvField(v: unknown): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADERS = [
  'id',
  'title',
  'savedAt',
  'rating',
  'audioUrl',
  'notes',
  'genre',
  'language',
  'moods',
  'instruments',
  'vocals',
  'textures',
  'negatives',
  'energy',
  'bpm',
  'key',
  'cohesion',
  'voiceClone',
  'styleLength',
  'tagCount',
  'stylePrompt',
];

export function exportHistoryAsCsv(entries: HistoryEntry[]): string {
  const lines: string[] = [HEADERS.join(',')];

  for (const e of entries) {
    const s = e.state;
    const styleLen = e.stylePrompt.length;
    const tagCount = e.stylePrompt.split(',').filter((x) => x.trim()).length;
    const row = [
      e.id,
      e.title,
      new Date(e.savedAt).toISOString(),
      e.result?.rating ?? '',
      e.result?.audioUrl ?? '',
      e.result?.notes ?? '',
      s.genre,
      s.language,
      s.moods.join('|'),
      s.instruments.join('|'),
      s.vocals.join('|'),
      s.textures.join('|'),
      s.negatives.join('|'),
      s.energy,
      s.bpm,
      s.musicKey,
      s.cohesion ? 'true' : 'false',
      s.voiceCloneActive ? 'true' : 'false',
      styleLen,
      tagCount,
      e.stylePrompt,
    ].map(csvField);
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

export interface RatingStats {
  total: number;
  rated: number;
  averageRating: number; // 0 表示沒有評分
  byStar: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function computeRatingStats(entries: HistoryEntry[]): RatingStats {
  const byStar: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let rated = 0;

  for (const e of entries) {
    if (e.result?.rating) {
      const r = e.result.rating;
      byStar[r]++;
      sum += r;
      rated++;
    }
  }

  return {
    total: entries.length,
    rated,
    averageRating: rated > 0 ? sum / rated : 0,
    byStar,
  };
}
