/**
 * Diff 工具：
 * - diffTags: 逗號分隔的 tag 集合差異（增/減/相同）
 * - diffLines: 行級 LCS diff
 * - diffSongState: 整個 SongState 的結構化欄位比較
 */

import type { SongState } from '../types';

// ───────── Tag Set Diff ─────────

export interface TagDiff {
  added: string[];
  removed: string[];
  common: string[];
}

/** 將逗號分隔字串 split + trim + 去空。 */
function splitTags(s: string): string[] {
  return s
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** 比較兩串 tag（保留順序：以 a 為主排「相同 / 移除」，以 b 為主排「新增」）。 */
export function diffTags(a: string, b: string): TagDiff {
  const aTags = splitTags(a);
  const bTags = splitTags(b);
  const aSet = new Set(aTags);
  const bSet = new Set(bTags);
  const common = aTags.filter((t) => bSet.has(t));
  const removed = aTags.filter((t) => !bSet.has(t));
  const added = bTags.filter((t) => !aSet.has(t));
  return { added, removed, common };
}

// ───────── Line Diff（LCS） ─────────

export type DiffOp = 'same' | 'add' | 'del';

export interface DiffLine {
  type: DiffOp;
  text: string;
}

/**
 * 行級 LCS diff。回傳合併過的序列：
 *   same → 兩邊都有
 *   del  → 只在 a 出現（從 a 視角是「被刪除」）
 *   add  → 只在 b 出現（從 a 視角是「新增」）
 */
export function diffLines(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const m = aLines.length;
  const n = bLines.length;

  // dp[i][j] = LCS length of aLines[0..i) vs bLines[0..j)
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aLines[i - 1] === bLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯
  const ops: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (aLines[i - 1] === bLines[j - 1]) {
      ops.push({ type: 'same', text: aLines[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: 'del', text: aLines[i - 1] });
      i--;
    } else {
      ops.push({ type: 'add', text: bLines[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    ops.push({ type: 'del', text: aLines[i - 1] });
    i--;
  }
  while (j > 0) {
    ops.push({ type: 'add', text: bLines[j - 1] });
    j--;
  }
  return ops.reverse();
}

// ───────── SongState 結構化比較 ─────────

export interface FieldDiff {
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

/** 把陣列欄位顯示為「a, b, c」字串。 */
function fmt(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? '是' : '否';
  return String(v ?? '');
}

/**
 * 列出兩個 SongState 在主要欄位上的差異，方便表格化顯示。
 * 不包含 sections 與 lyrics（那些由 diffLines 處理）。
 */
export function diffSongState(a: SongState, b: SongState): FieldDiff[] {
  const fields: Array<[string, keyof SongState]> = [
    ['歌曲標題', 'songTitle'],
    ['語言', 'language'],
    ['曲風', 'genre'],
    ['情緒', 'moods'],
    ['能量', 'energy'],
    ['樂器', 'instruments'],
    ['人聲', 'vocals'],
    ['紋理', 'textures'],
    ['Negatives', 'negatives'],
    ['BPM', 'bpm'],
    ['調性', 'musicKey'],
    ['抗切割感', 'cohesion'],
    ['Voice Clone', 'voiceCloneActive'],
    ['段落骨架', 'structureName'],
    ['額外關鍵字', 'extra'],
    ['歌詞主題', 'lyricsTheme'],
    ['歌詞關鍵字', 'lyricsKeywords'],
    ['故事背景', 'lyricsStory'],
  ];

  return fields.map(([label, key]) => {
    const before = fmt(a[key]);
    const after = fmt(b[key]);
    return { label, before, after, changed: before !== after };
  });
}
