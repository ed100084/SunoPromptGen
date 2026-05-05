import { describe, it, expect } from 'vitest';
import { exportHistoryAsCsv, computeRatingStats } from './csvExport';
import type { HistoryEntry, SongState } from '../types';

const baseState: SongState = {
  songTitle: '',
  language: '華語(繁體)',
  genre: '華語抒情',
  moods: ['溫暖'],
  energy: '中（穩定流動）',
  instruments: ['暖音鋼琴'],
  vocals: ['女聲(柔/氣音)'],
  textures: ['電影感製作'],
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

const mkEntry = (overrides: Partial<HistoryEntry>): HistoryEntry => ({
  id: 'x',
  savedAt: 1700000000000,
  title: '測試',
  state: baseState,
  stylePrompt: 'pop, 75 BPM, warm',
  lyricsPrompt: '[Verse]\n歌詞',
  ...overrides,
});

describe('exportHistoryAsCsv', () => {
  it('回傳含 header 與資料列的 CSV', () => {
    const csv = exportHistoryAsCsv([mkEntry({})]);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('id,title,savedAt');
    expect(lines).toHaveLength(2);
  });

  it('含逗號/雙引號的欄位被正確 escape', () => {
    const csv = exportHistoryAsCsv([
      mkEntry({ title: 'a, b "c"', stylePrompt: 'has, commas' }),
    ]);
    expect(csv).toContain('"a, b ""c"""');
    expect(csv).toContain('"has, commas"');
  });

  it('rating 與 audioUrl 出現在輸出中', () => {
    const csv = exportHistoryAsCsv([
      mkEntry({ result: { rating: 5, audioUrl: 'https://suno.ai/abc' } }),
    ]);
    expect(csv).toContain(',5,');
    expect(csv).toContain('https://suno.ai/abc');
  });

  it('陣列欄位以 | 分隔', () => {
    const csv = exportHistoryAsCsv([
      mkEntry({ state: { ...baseState, moods: ['溫暖', '希望'] } }),
    ]);
    expect(csv).toContain('溫暖|希望');
  });
});

describe('computeRatingStats', () => {
  it('全空時 averageRating 為 0', () => {
    const s = computeRatingStats([]);
    expect(s.total).toBe(0);
    expect(s.rated).toBe(0);
    expect(s.averageRating).toBe(0);
  });

  it('正確計算平均分數', () => {
    const s = computeRatingStats([
      mkEntry({ id: '1', result: { rating: 5 } }),
      mkEntry({ id: '2', result: { rating: 3 } }),
      mkEntry({ id: '3' }), // 未評分
    ]);
    expect(s.total).toBe(3);
    expect(s.rated).toBe(2);
    expect(s.averageRating).toBe(4);
  });

  it('byStar 分布正確', () => {
    const s = computeRatingStats([
      mkEntry({ id: '1', result: { rating: 5 } }),
      mkEntry({ id: '2', result: { rating: 5 } }),
      mkEntry({ id: '3', result: { rating: 3 } }),
    ]);
    expect(s.byStar[5]).toBe(2);
    expect(s.byStar[3]).toBe(1);
    expect(s.byStar[1]).toBe(0);
  });
});
