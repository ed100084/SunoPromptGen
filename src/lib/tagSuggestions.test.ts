import { describe, it, expect } from 'vitest';
import { buildSuggestionContext, suggestForField } from './tagSuggestions';
import type { HistoryEntry, Scenario, SongState } from '../types';

const mkScenario = (overrides: Partial<Scenario>): Scenario => ({
  desc: '',
  language: '華語(繁體)',
  genre: '華語抒情',
  moods: [],
  instruments: [],
  vocals: [],
  textures: [],
  energy: '中（穩定流動）',
  bpm: '80',
  key: 'C major',
  structure: '簡短版 (V-C-V-C-Outro)',
  negatives: [],
  extra: '',
  ...overrides,
});

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

describe('buildSuggestionContext', () => {
  it('合併 SCENARIOS 與高分歷史', () => {
    const scenarios = {
      a: mkScenario({ moods: ['溫暖'], instruments: ['鋼琴'] }),
    };
    const history: HistoryEntry[] = [
      {
        id: '1',
        savedAt: 0,
        title: 't',
        state: { ...baseState, moods: ['希望'], instruments: ['吉他'] },
        stylePrompt: '',
        lyricsPrompt: '',
        result: { rating: 5 },
      },
      // 3★ 不應該被納入
      {
        id: '2',
        savedAt: 0,
        title: 't',
        state: { ...baseState, moods: ['悲傷'] },
        stylePrompt: '',
        lyricsPrompt: '',
        result: { rating: 3 },
      },
    ];

    const ctx = buildSuggestionContext(scenarios, history);
    expect(ctx.samples).toHaveLength(2); // scenario + 1 高分
    expect(ctx.popularity.moods['溫暖']).toBe(1);
    // 5★ 加倍權重
    expect(ctx.popularity.moods['希望']).toBe(2);
    expect(ctx.popularity.moods['悲傷']).toBeUndefined();
  });

  it('忽略未評分的歷史', () => {
    const history: HistoryEntry[] = [
      { id: '1', savedAt: 0, title: 't', state: { ...baseState, moods: ['未評'] }, stylePrompt: '', lyricsPrompt: '' },
    ];
    const ctx = buildSuggestionContext({}, history);
    expect(ctx.samples).toHaveLength(0);
  });
});

describe('suggestForField', () => {
  const scenarios = {
    'A': mkScenario({ moods: ['溫暖'], instruments: ['鋼琴', '弦樂'] }),
    'B': mkScenario({ moods: ['溫暖'], instruments: ['鋼琴', '吉他'] }),
    'C': mkScenario({ moods: ['溫暖'], instruments: ['弦樂', '貝斯'] }),
    'D': mkScenario({ moods: ['激昂'], instruments: ['電吉他'] }),
  };
  const ctx = buildSuggestionContext(scenarios, []);

  it('選了「溫暖」會推薦相關樂器', () => {
    const recs = suggestForField(ctx, 'instruments', { ...baseState, moods: ['溫暖'] });
    const tags = recs.map((r) => r.tag);
    expect(tags).toContain('鋼琴');
    expect(tags).toContain('弦樂');
    expect(tags).not.toContain('電吉他'); // 「電吉他」只跟「激昂」共現
  });

  it('排序按共現次數', () => {
    const recs = suggestForField(ctx, 'instruments', { ...baseState, moods: ['溫暖'] });
    // 鋼琴出現 2 次（A、B），弦樂 2 次（A、C），貝斯 1 次（C），吉他 1 次（B）
    expect(recs[0].coCount).toBe(2);
    expect(recs[recs.length - 1].coCount).toBeLessThanOrEqual(recs[0].coCount);
  });

  it('排除已選的 tag', () => {
    const recs = suggestForField(ctx, 'instruments', {
      ...baseState,
      moods: ['溫暖'],
      instruments: ['鋼琴'], // 已選
    });
    expect(recs.find((r) => r.tag === '鋼琴')).toBeUndefined();
  });

  it('沒有任何指紋時退化為熱門排序', () => {
    const recs = suggestForField(ctx, 'instruments', baseState);
    // 鋼琴與弦樂出現 2 次最熱門
    expect(recs.slice(0, 2).map((r) => r.tag).sort()).toEqual(['弦樂', '鋼琴']);
  });

  it('topN 限制結果數量', () => {
    const recs = suggestForField(ctx, 'instruments', { ...baseState, moods: ['溫暖'] }, 2);
    expect(recs).toHaveLength(2);
  });

  it('confidence 計算正確', () => {
    // 鋼琴在所有樣本中出現 2 次（A、B），溫暖共現也是 2 → confidence = 1.0
    const recs = suggestForField(ctx, 'instruments', { ...baseState, moods: ['溫暖'] });
    const piano = recs.find((r) => r.tag === '鋼琴')!;
    expect(piano.confidence).toBe(1);
  });

  it('沒有多選指紋時，genre 作為 fallback 過濾', () => {
    const scs = {
      'A': mkScenario({ genre: 'House', moods: ['活力'] }),
      'B': mkScenario({ genre: 'House', moods: ['歡樂'] }),
      'C': mkScenario({ genre: 'Ambient', moods: ['平靜'] }),
    };
    const c2 = buildSuggestionContext(scs, []);
    // 沒選任何多選 tag，但有 genre = House
    const recs = suggestForField(c2, 'moods', {
      ...baseState,
      moods: [],
      genre: 'House',
    });
    const tags = recs.map((r) => r.tag);
    expect(tags).toContain('活力');
    expect(tags).toContain('歡樂');
    expect(tags).not.toContain('平靜');
  });

  it('多選指紋優先於 genre — 跨 genre 但有共同 mood 也會匹配', () => {
    const scs = {
      'A': mkScenario({ genre: 'House', moods: ['活力', '歡樂'] }),
      'B': mkScenario({ genre: 'Rock', moods: ['活力', '憤怒'] }),
    };
    const c2 = buildSuggestionContext(scs, []);
    // 已選了「活力」mood + Rock genre，應推薦其他 mood（含 House 的 歡樂）
    const recs = suggestForField(c2, 'moods', {
      ...baseState,
      moods: ['活力'],
      genre: 'Rock',
    });
    const tags = recs.map((r) => r.tag);
    expect(tags).toContain('歡樂'); // 來自 A，雖然 genre 不同
    expect(tags).toContain('憤怒');
  });
});
