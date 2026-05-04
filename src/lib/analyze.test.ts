import { describe, it, expect } from 'vitest';
import { analyzeLyrics } from './analyze';

describe('analyzeLyrics', () => {
  it('回傳空結果當輸入為空字串', () => {
    const result = analyzeLyrics('');
    expect(result.lines).toHaveLength(0);
    expect(result.totalChars).toBe(0);
    expect(result.avgChars).toBe(0);
    expect(result.stdDev).toBe(0);
  });

  it('正確計算中文字數', () => {
    const result = analyzeLyrics('你好世界\n再見');
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].cnCount).toBe(4);
    expect(result.lines[1].cnCount).toBe(2);
  });

  it('英文以 word*1.3 估計音節數', () => {
    const result = analyzeLyrics('hello world');
    // 2 words * 1.3 = 2.6 → round = 3
    expect(result.lines[0].syllableEstimate).toBe(3);
  });

  it('忽略空白行', () => {
    const result = analyzeLyrics('第一行\n\n\n第二行');
    expect(result.lines).toHaveLength(2);
  });

  it('偵測重複行', () => {
    const result = analyzeLyrics('副歌一句\n中間\n副歌一句');
    expect(result.duplicateLines).toContain('副歌一句');
    expect(result.duplicateLines).not.toContain('中間');
  });

  it('字數差異大時 isUneven 為 true', () => {
    const result = analyzeLyrics('短\n非常長的一行歌詞超過十個字');
    expect(result.isUneven).toBe(true);
  });

  it('字數平均時 isUneven 為 false', () => {
    const result = analyzeLyrics('五個字一行\n六字一行詞\n七字一行的詞');
    expect(result.isUneven).toBe(false);
  });

  it('回傳最長與最短行字數', () => {
    const result = analyzeLyrics('短\n中等的句\n最最最長的歌詞句子');
    expect(result.shortestLine).toBe(1);
    expect(result.longestLine).toBe(9);
  });
});
