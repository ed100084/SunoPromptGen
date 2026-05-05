import { describe, it, expect } from 'vitest';
import { sunoV5_5 } from './v5_5';
import { getActiveVersion, SUNO_VERSIONS } from './index';
import type { SongState } from '../../types';

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

describe('sunoV5_5 metadata', () => {
  it('id 為 v5.5', () => {
    expect(sunoV5_5.id).toBe('v5.5');
  });

  it('限制符合 Suno v5.5 規範', () => {
    expect(sunoV5_5.constraints.maxStyleLength).toBe(1000);
    expect(sunoV5_5.constraints.recommendedTagRange).toEqual([8, 15]);
  });

  it('vocab map 不為空', () => {
    expect(Object.keys(sunoV5_5.GENRES).length).toBeGreaterThan(10);
    expect(Object.keys(sunoV5_5.MOODS).length).toBeGreaterThan(10);
    expect(Object.keys(sunoV5_5.INSTRUMENTS).length).toBeGreaterThan(20);
  });

  it('promptTips 包含關鍵心法', () => {
    const all = sunoV5_5.promptTips.join('|');
    expect(all).toContain('Negative');
    expect(all).toContain('Voice Clone');
  });
});

describe('sunoV5_5.buildStylePrompt', () => {
  it('包含 BPM 與 key', () => {
    const out = sunoV5_5.buildStylePrompt(baseState);
    expect(out).toContain('75 BPM');
    expect(out).toContain('key of C major');
  });

  it('查表轉成英文 tag', () => {
    const out = sunoV5_5.buildStylePrompt(baseState);
    expect(out).toContain('warm piano');
    expect(out).toContain('warm');
  });

  it('純樂器模式略過人聲', () => {
    const s: SongState = { ...baseState, language: '純樂器(無歌詞)', vocals: ['女聲(柔/氣音)'] };
    const out = sunoV5_5.buildStylePrompt(s);
    expect(out).toContain('instrumental, no vocals');
    // 不應該有「soft female vocals」
    expect(out).not.toContain('soft female vocals');
  });

  it('Voice Clone 啟用時略過人聲描述', () => {
    const s: SongState = { ...baseState, voiceCloneActive: true };
    const out = sunoV5_5.buildStylePrompt(s);
    expect(out).not.toContain('soft female vocals');
    expect(out).not.toContain('mandarin chinese vocals');
  });

  it('cohesion 開啟時加入抗切割關鍵字', () => {
    const a = sunoV5_5.buildStylePrompt({ ...baseState, cohesion: false });
    const b = sunoV5_5.buildStylePrompt({ ...baseState, cohesion: true });
    expect(a).not.toContain('seamless');
    expect(b).toContain('seamless transitions');
  });

  it('negatives 在最後串接', () => {
    const s: SongState = { ...baseState, negatives: ['無 Autotune'] };
    const out = sunoV5_5.buildStylePrompt(s);
    expect(out).toContain('no autotune');
  });
});

describe('sunoVersions registry', () => {
  it('SUNO_VERSIONS 含 v5.5', () => {
    expect(SUNO_VERSIONS['v5.5']).toBeDefined();
    expect(SUNO_VERSIONS['v5.5'].id).toBe('v5.5');
  });

  it('getActiveVersion 預設回 v5.5', () => {
    expect(getActiveVersion().id).toBe('v5.5');
  });
});
