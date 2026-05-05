/**
 * 成功 Patterns 儀表板分析。
 *
 * 核心問題：什麼樣的 tag / 設定真的跟「高分作品」相關？
 *
 * 純統計：top-tag 頻率太天真（你常用什麼就出現什麼）。
 * 改用 lift = highRate / baseRate − 1：表示「在高分作品中出現的機率，
 * 比整體出現的機率高出多少」。lift > 0 = 正相關，可能是成功因子。
 */

import type { HistoryEntry, SongState } from '../types';

/** 可分析的多選欄位。 */
export type AnalyzableField =
  | 'moods'
  | 'instruments'
  | 'vocals'
  | 'textures'
  | 'negatives';

export interface TagInsight {
  tag: string;
  /** 高分作品中的出現次數。 */
  highCount: number;
  /** 整體（所有評分作品）中的出現次數。 */
  baseCount: number;
  /** 高分中的佔比 (0-1)。 */
  highRate: number;
  /** 整體中的佔比 (0-1)。 */
  baseRate: number;
  /** lift = highRate / baseRate − 1。正值表示在高分中出現比較頻繁。 */
  lift: number;
}

export interface FieldInsight {
  field: AnalyzableField | 'genre';
  /** 依 highCount 排序的前 N 個 tag。 */
  topTags: TagInsight[];
}

export interface NumericInsight {
  highMin: number;
  highMax: number;
  highAvg: number;
  baseAvg: number;
  count: number;
}

export interface InsightsReport {
  /** 總紀錄數。 */
  totalEntries: number;
  /** 有評分的紀錄數。 */
  ratedCount: number;
  /** 高分（>= threshold）紀錄數。 */
  highCount: number;
  /** 評分閾值（預設 4）。 */
  threshold: number;
  /** 各星等的數量。 */
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  /** 各欄位 top tag 洞察。 */
  fields: FieldInsight[];
  /** BPM 統計（從評分作品的 state.bpm 解析）。 */
  bpm: NumericInsight | null;
  /** Style prompt 字元長度統計。 */
  styleLength: NumericInsight | null;
  /** 是否資料量足夠產生有意義的洞察（>= 3 筆高分）。 */
  meaningful: boolean;
}

const FIELDS_MULTI: AnalyzableField[] = [
  'moods',
  'instruments',
  'vocals',
  'textures',
  'negatives',
];

/** 把欄位值取出（多選回 array、單選回 [val]）。 */
function getFieldValues(state: SongState, field: AnalyzableField | 'genre'): string[] {
  if (field === 'genre') return state.genre ? [state.genre] : [];
  return state[field] ?? [];
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function buildFieldInsight(
  field: AnalyzableField | 'genre',
  rated: HistoryEntry[],
  high: HistoryEntry[],
  topN: number,
): FieldInsight {
  const baseCount: Record<string, number> = {};
  const highCount: Record<string, number> = {};

  for (const e of rated) {
    for (const tag of getFieldValues(e.state, field)) {
      baseCount[tag] = (baseCount[tag] ?? 0) + 1;
    }
  }
  for (const e of high) {
    for (const tag of getFieldValues(e.state, field)) {
      highCount[tag] = (highCount[tag] ?? 0) + 1;
    }
  }

  const baseTotal = rated.length;
  const highTotal = high.length;

  const tags: TagInsight[] = Object.keys(highCount).map((tag) => {
    const hc = highCount[tag];
    const bc = baseCount[tag] ?? 0;
    const highRate = highTotal > 0 ? hc / highTotal : 0;
    const baseRate = baseTotal > 0 ? bc / baseTotal : 0;
    const lift = baseRate > 0 ? highRate / baseRate - 1 : 0;
    return { tag, highCount: hc, baseCount: bc, highRate, baseRate, lift };
  });

  // 排序：先按高分中的出現次數，同分按 lift（更具分辨力的優先）
  tags.sort((a, b) => {
    if (b.highCount !== a.highCount) return b.highCount - a.highCount;
    return b.lift - a.lift;
  });

  return { field, topTags: tags.slice(0, topN) };
}

function buildNumericInsight(
  rated: HistoryEntry[],
  high: HistoryEntry[],
  pick: (e: HistoryEntry) => number | null,
): NumericInsight | null {
  const baseNums = rated.map(pick).filter((n): n is number => n !== null && !isNaN(n));
  const highNums = high.map(pick).filter((n): n is number => n !== null && !isNaN(n));
  if (highNums.length === 0) return null;
  return {
    highMin: Math.min(...highNums),
    highMax: Math.max(...highNums),
    highAvg: avg(highNums),
    baseAvg: avg(baseNums),
    count: highNums.length,
  };
}

/**
 * 從歷史紀錄產生洞察報告。
 * threshold 預設 4，表示 4★ 以上算「高分」。
 * topN 預設 5，每個欄位最多回傳 5 個 tag。
 */
export function analyzeInsights(
  entries: HistoryEntry[],
  threshold: 4 | 5 = 4,
  topN = 5,
): InsightsReport {
  const rated = entries.filter((e) => e.result?.rating);
  const high = rated.filter((e) => (e.result!.rating ?? 0) >= threshold);

  const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const e of rated) {
    const r = e.result!.rating!;
    ratingDistribution[r]++;
  }

  const fields: FieldInsight[] = [
    buildFieldInsight('moods', rated, high, topN),
    buildFieldInsight('instruments', rated, high, topN),
    buildFieldInsight('vocals', rated, high, topN),
    buildFieldInsight('textures', rated, high, topN),
    buildFieldInsight('negatives', rated, high, topN),
    buildFieldInsight('genre', rated, high, topN),
  ];

  const bpm = buildNumericInsight(rated, high, (e) => {
    const n = parseInt(e.state.bpm, 10);
    return isNaN(n) ? null : n;
  });

  const styleLength = buildNumericInsight(rated, high, (e) => e.stylePrompt.length);

  return {
    totalEntries: entries.length,
    ratedCount: rated.length,
    highCount: high.length,
    threshold,
    ratingDistribution,
    fields,
    bpm,
    styleLength,
    meaningful: high.length >= 3,
  };
}

/** 標籤：lift 區間 → 顏色語意。供 UI 用。 */
export type LiftLevel = 'strong' | 'mild' | 'neutral' | 'negative';

export function classifyLift(lift: number): LiftLevel {
  if (lift >= 0.3) return 'strong'; // 高分中至少多 30% 機率出現
  if (lift >= 0.1) return 'mild';
  if (lift > -0.1) return 'neutral';
  return 'negative';
}
