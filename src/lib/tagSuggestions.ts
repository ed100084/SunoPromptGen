/**
 * Tag 共現推薦：
 *   - 從 SCENARIOS（22 個專家配方）+ 使用者高分（>=4★）歷史紀錄
 *     統計各欄位之間的共現次數
 *   - 給定當前選擇，推薦最常一起出現但尚未選的 tag
 *
 * 使用範例：
 *   const ctx = buildSuggestionContext(SCENARIOS, history);
 *   const recs = suggestForField(ctx, 'instruments', state, 4);
 */

import type { HistoryEntry, Scenario, SongState } from '../types';

/** 可被推薦的欄位（皆為 string[] 型別）。 */
export type SuggestableField = 'moods' | 'instruments' | 'vocals' | 'textures' | 'negatives';

/** 一筆「樣本」的多欄位選擇 — 從 SCENARIO 或 HistoryEntry.state 萃取。 */
interface Sample {
  moods: string[];
  instruments: string[];
  vocals: string[];
  textures: string[];
  negatives: string[];
  genre?: string;
  language?: string;
  /** 樣本權重（高分歷史可加權；專家配方預設 1）。 */
  weight: number;
}

export interface SuggestionContext {
  samples: Sample[];
  /**
   * 每個欄位每個 tag 的整體出現次數（用於 confidence = co/popularity 的計算）。
   * 結構：popularity[field][tag] = totalWeightedCount。
   */
  popularity: Record<SuggestableField, Record<string, number>>;
}

function emptyPop(): Record<SuggestableField, Record<string, number>> {
  return {
    moods: {},
    instruments: {},
    vocals: {},
    textures: {},
    negatives: {},
  };
}

function scenarioToSample(s: Scenario): Sample {
  return {
    moods: s.moods,
    instruments: s.instruments,
    vocals: s.vocals,
    textures: s.textures,
    negatives: s.negatives,
    genre: s.genre,
    language: s.language,
    weight: 1,
  };
}

function entryToSample(e: HistoryEntry): Sample | null {
  // 只取有評分且 >=4 星的歷史
  const rating = e.result?.rating;
  if (!rating || rating < 4) return null;
  return {
    moods: e.state.moods,
    instruments: e.state.instruments,
    vocals: e.state.vocals,
    textures: e.state.textures,
    negatives: e.state.negatives,
    genre: e.state.genre,
    language: e.state.language,
    weight: rating === 5 ? 2 : 1, // 5★ 加倍
  };
}

/**
 * 建立推薦上下文（一次性計算，可在 useMemo 中快取）。
 */
export function buildSuggestionContext(
  scenarios: Record<string, Scenario>,
  history: HistoryEntry[],
): SuggestionContext {
  const samples: Sample[] = [];
  for (const sc of Object.values(scenarios)) samples.push(scenarioToSample(sc));
  for (const e of history) {
    const s = entryToSample(e);
    if (s) samples.push(s);
  }

  const popularity = emptyPop();
  const fields: SuggestableField[] = ['moods', 'instruments', 'vocals', 'textures', 'negatives'];
  for (const sample of samples) {
    for (const f of fields) {
      for (const t of sample[f]) {
        popularity[f][t] = (popularity[f][t] ?? 0) + sample.weight;
      }
    }
  }

  return { samples, popularity };
}

export interface Suggestion {
  /** 推薦的 tag 鍵值（中文 key）。 */
  tag: string;
  /** 共現次數（已加權）。 */
  coCount: number;
  /** 信心分數：co-occurrence 占被推薦 tag 整體出現次數的比例（0-1）。 */
  confidence: number;
}

/**
 * 給定當前 SongState 與要推薦的欄位，回傳排序後的建議。
 *
 * 演算法：
 *   1. 找出所有「至少包含一個當前已選 tag」的樣本（語意上：與使用者品味相近）
 *   2. 在這些樣本中，統計目標欄位每個 tag 的加權共現次數（排除已選）
 *   3. 排序：先按共現次數，同分按 confidence
 *
 * 若使用者完全沒選，則退化為「目標欄位整體最熱門」。
 */
export function suggestForField(
  ctx: SuggestionContext,
  targetField: SuggestableField,
  state: Pick<
    SongState,
    'moods' | 'instruments' | 'vocals' | 'textures' | 'negatives' | 'genre' | 'language'
  >,
  topN = 4,
): Suggestion[] {
  const alreadySelected = new Set(state[targetField] ?? []);

  // 收集使用者已選的多選 tag 作為「品味指紋」。
  // 不納入 genre / language 因為它們可能是預設值（如「華語抒情」「華語(繁體)」），
  // 會稀釋多選 tag 的篩選力。但若使用者只選了 genre 而沒選任何 multi-select，
  // 我們把符合 genre 的樣本視為匹配，作為補充訊號。
  const fingerprint = new Set<string>([
    ...state.moods,
    ...state.instruments,
    ...state.vocals,
    ...state.textures,
    ...state.negatives,
  ]);

  const sampleMatches = (s: Sample): boolean => {
    if (fingerprint.size > 0) {
      for (const m of s.moods) if (fingerprint.has(m)) return true;
      for (const i of s.instruments) if (fingerprint.has(i)) return true;
      for (const v of s.vocals) if (fingerprint.has(v)) return true;
      for (const t of s.textures) if (fingerprint.has(t)) return true;
      for (const n of s.negatives) if (fingerprint.has(n)) return true;
      return false;
    }
    // fallback：沒指紋時用 genre 過濾，再不行就全收
    if (state.genre && s.genre) return s.genre === state.genre;
    return true;
  };

  const co: Record<string, number> = {};
  for (const sample of ctx.samples) {
    if (!sampleMatches(sample)) continue;
    for (const t of sample[targetField]) {
      if (alreadySelected.has(t)) continue;
      co[t] = (co[t] ?? 0) + sample.weight;
    }
  }

  const pop = ctx.popularity[targetField];
  const list: Suggestion[] = Object.entries(co).map(([tag, coCount]) => ({
    tag,
    coCount,
    confidence: pop[tag] ? coCount / pop[tag] : 0,
  }));

  list.sort((a, b) => {
    if (b.coCount !== a.coCount) return b.coCount - a.coCount;
    return b.confidence - a.confidence;
  });

  return list.slice(0, topN);
}
