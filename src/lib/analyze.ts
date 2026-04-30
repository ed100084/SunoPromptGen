/**
 * 歌詞分析工具
 * - 字數統計（每行）
 * - 不平均檢測（標準差）
 * - 重複行檢測（副歌記憶點）
 */

export interface LineStat {
  text: string;
  charCount: number;     // 字元數（含中英）
  cnCount: number;       // 中文字數
  syllableEstimate: number; // 估計音節數（中文≈字數，英文≈字數×1.3）
}

export interface LyricsAnalysis {
  lines: LineStat[];
  totalChars: number;
  avgChars: number;
  stdDev: number;
  isUneven: boolean;     // 標準差過大（>3）→ 不平均
  duplicateLines: string[]; // 重複出現的整行
  longestLine: number;
  shortestLine: number;
}

function countCn(text: string): number {
  return (text.match(/[一-鿿]/g) || []).length;
}

function estimateSyllables(text: string): number {
  const cn = countCn(text);
  // 英文字（粗略）：每個 word 約 1.3 syllables
  const enWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return cn + Math.round(enWords * 1.3);
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sq = arr.reduce((sum, x) => sum + (x - mean) ** 2, 0);
  return Math.sqrt(sq / arr.length);
}

export function analyzeLyrics(lyrics: string): LyricsAnalysis {
  const lines: LineStat[] = lyrics
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text) => ({
      text,
      charCount: text.length,
      cnCount: countCn(text),
      syllableEstimate: estimateSyllables(text),
    }));

  const charCounts = lines.map((l) => l.cnCount > 0 ? l.cnCount : l.charCount);
  const totalChars = charCounts.reduce((a, b) => a + b, 0);
  const avgChars = lines.length ? totalChars / lines.length : 0;
  const sd = stdDev(charCounts);
  const isUneven = sd > 3;

  // 找重複行
  const lineMap = new Map<string, number>();
  for (const l of lines) {
    lineMap.set(l.text, (lineMap.get(l.text) || 0) + 1);
  }
  const duplicateLines = Array.from(lineMap.entries())
    .filter(([_, n]) => n > 1)
    .map(([text]) => text);

  return {
    lines,
    totalChars,
    avgChars,
    stdDev: sd,
    isUneven,
    duplicateLines,
    longestLine: charCounts.length ? Math.max(...charCounts) : 0,
    shortestLine: charCounts.length ? Math.min(...charCounts) : 0,
  };
}
