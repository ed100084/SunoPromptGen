import { describe, it, expect } from 'vitest';
import { analyzeInsights, classifyLift } from './insights';
import type { HistoryEntry, SongState } from '../types';

const baseState: SongState = {
  songTitle: '',
  language: '華語(繁體)',
  genre: '華語抒情',
  moods: [],
  energy: '中（穩定流動）',
  instruments: [],
  vocals: [],
  textures: [],
  negatives: [],
  bpm: '75',
  musicKey: 'C major',
  extra: '',
  cohesion: false,
  voiceCloneActive: false,
  structureName: '',
  sections: [],
  lyricsTheme: '',
  lyricsKeywords: '',
  lyricsStory: '',
};

const mkEntry = (id: string, rating: 1 | 2 | 3 | 4 | 5 | undefined, overrides: Partial<SongState>, styleLen = 100): HistoryEntry => ({
  id,
  savedAt: 0,
  title: id,
  state: { ...baseState, ...overrides },
  stylePrompt: 'x'.repeat(styleLen),
  lyricsPrompt: '',
  result: rating ? { rating } : undefined,
});

describe('analyzeInsights', () => {
  it('沒有評分時 meaningful = false', () => {
    const r = analyzeInsights([mkEntry('1', undefined, {})]);
    expect(r.meaningful).toBe(false);
    expect(r.ratedCount).toBe(0);
    expect(r.highCount).toBe(0);
  });

  it('少於 3 筆高分時 meaningful = false', () => {
    const r = analyzeInsights([
      mkEntry('1', 5, {}),
      mkEntry('2', 4, {}),
    ]);
    expect(r.meaningful).toBe(false);
    expect(r.highCount).toBe(2);
  });

  it('rating distribution 正確', () => {
    const r = analyzeInsights([
      mkEntry('1', 5, {}),
      mkEntry('2', 5, {}),
      mkEntry('3', 4, {}),
      mkEntry('4', 3, {}),
      mkEntry('5', 1, {}),
      mkEntry('6', undefined, {}),
    ]);
    expect(r.totalEntries).toBe(6);
    expect(r.ratedCount).toBe(5);
    expect(r.highCount).toBe(3);
    expect(r.ratingDistribution[5]).toBe(2);
    expect(r.ratingDistribution[4]).toBe(1);
    expect(r.ratingDistribution[3]).toBe(1);
    expect(r.ratingDistribution[1]).toBe(1);
  });

  it('找出在高分中頻繁出現的 tag', () => {
    const entries = [
      mkEntry('h1', 5, { instruments: ['鋼琴', '弦樂'] }),
      mkEntry('h2', 5, { instruments: ['鋼琴', '吉他'] }),
      mkEntry('h3', 4, { instruments: ['鋼琴'] }),
      mkEntry('l1', 2, { instruments: ['鼓機'] }),
    ];
    const r = analyzeInsights(entries);
    const ins = r.fields.find((f) => f.field === 'instruments')!;
    // 鋼琴在 3/3 高分作品出現 = highRate 100%
    const piano = ins.topTags.find((t) => t.tag === '鋼琴')!;
    expect(piano.highCount).toBe(3);
    expect(piano.highRate).toBe(1);
    // 鋼琴整體出現於 3/4 = baseRate 0.75
    expect(piano.baseRate).toBe(0.75);
    // lift = 1/0.75 - 1 = 0.333...
    expect(piano.lift).toBeCloseTo(0.333, 2);
  });

  it('lift 為負時表示高分中反而少出現', () => {
    const entries = [
      mkEntry('h1', 5, { instruments: ['鋼琴'] }),
      mkEntry('h2', 5, { instruments: ['鋼琴'] }),
      mkEntry('h3', 4, { instruments: ['鋼琴'] }),
      // 低分都用合成器，高分都不用
      mkEntry('l1', 2, { instruments: ['合成器'] }),
      mkEntry('l2', 1, { instruments: ['合成器'] }),
    ];
    const r = analyzeInsights(entries);
    const ins = r.fields.find((f) => f.field === 'instruments')!;
    // 合成器在高分為 0 → 不會出現在 topTags（因為 highCount = 0）
    expect(ins.topTags.find((t) => t.tag === '合成器')).toBeUndefined();
    // 鋼琴 lift > 0
    const piano = ins.topTags.find((t) => t.tag === '鋼琴')!;
    expect(piano.lift).toBeGreaterThan(0);
  });

  it('genre 分析以單值處理', () => {
    const entries = [
      mkEntry('h1', 5, { genre: 'Lo-fi Hip Hop' }),
      mkEntry('h2', 5, { genre: 'Lo-fi Hip Hop' }),
      mkEntry('h3', 4, { genre: '華語抒情' }),
      mkEntry('l1', 2, { genre: 'EDM' }),
    ];
    const r = analyzeInsights(entries);
    const g = r.fields.find((f) => f.field === 'genre')!;
    expect(g.topTags[0].tag).toBe('Lo-fi Hip Hop');
    expect(g.topTags[0].highCount).toBe(2);
  });

  it('BPM 統計', () => {
    const entries = [
      mkEntry('h1', 5, { bpm: '75' }),
      mkEntry('h2', 5, { bpm: '80' }),
      mkEntry('h3', 4, { bpm: '85' }),
      mkEntry('l1', 2, { bpm: '128' }),
    ];
    const r = analyzeInsights(entries);
    expect(r.bpm).not.toBeNull();
    expect(r.bpm!.highMin).toBe(75);
    expect(r.bpm!.highMax).toBe(85);
    expect(r.bpm!.highAvg).toBe(80);
  });

  it('Style prompt 長度統計', () => {
    const entries = [
      mkEntry('h1', 5, {}, 100),
      mkEntry('h2', 5, {}, 200),
      mkEntry('h3', 4, {}, 150),
    ];
    const r = analyzeInsights(entries);
    expect(r.styleLength!.highAvg).toBe(150);
    expect(r.styleLength!.highMin).toBe(100);
    expect(r.styleLength!.highMax).toBe(200);
  });

  it('threshold 5 只看 5 星', () => {
    const entries = [
      mkEntry('h1', 5, { instruments: ['鋼琴'] }),
      mkEntry('h2', 5, { instruments: ['鋼琴'] }),
      mkEntry('h3', 4, { instruments: ['鼓機'] }), // 4★ 不算
    ];
    const r = analyzeInsights(entries, 5);
    expect(r.highCount).toBe(2);
    const ins = r.fields.find((f) => f.field === 'instruments')!;
    expect(ins.topTags.find((t) => t.tag === '鼓機')).toBeUndefined();
  });

  it('topN 限制每欄位輸出', () => {
    const entries = [
      mkEntry('h1', 5, { moods: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }),
      mkEntry('h2', 5, { moods: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }),
      mkEntry('h3', 5, { moods: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }),
    ];
    const r = analyzeInsights(entries, 4, 3);
    const m = r.fields.find((f) => f.field === 'moods')!;
    expect(m.topTags.length).toBe(3);
  });
});

describe('classifyLift', () => {
  it('lift >= 0.3 為 strong', () => {
    expect(classifyLift(0.5)).toBe('strong');
    expect(classifyLift(0.3)).toBe('strong');
  });

  it('0.1 ~ 0.3 為 mild', () => {
    expect(classifyLift(0.2)).toBe('mild');
    expect(classifyLift(0.1)).toBe('mild');
  });

  it('-0.1 ~ 0.1 為 neutral', () => {
    expect(classifyLift(0)).toBe('neutral');
    expect(classifyLift(0.05)).toBe('neutral');
  });

  it('< -0.1 為 negative', () => {
    expect(classifyLift(-0.5)).toBe('negative');
    expect(classifyLift(-0.1)).toBe('negative');
  });
});
