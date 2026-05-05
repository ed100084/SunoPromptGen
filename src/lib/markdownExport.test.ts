import { describe, it, expect } from 'vitest';
import { exportEntryAsMarkdown, safeFilename } from './markdownExport';
import type { HistoryEntry, SongState } from '../types';

const baseState: SongState = {
  songTitle: '',
  language: '華語(繁體)',
  genre: '華語抒情',
  moods: ['溫暖', '希望'],
  energy: '中（穩定流動）',
  instruments: ['鋼琴', '弦樂'],
  vocals: ['女聲(柔/氣音)'],
  textures: ['電影感製作'],
  negatives: ['無 Autotune'],
  bpm: '75',
  musicKey: 'C major',
  extra: '',
  cohesion: true,
  voiceCloneActive: false,
  structureName: '抒情骨架',
  sections: [],
  lyricsTheme: '',
  lyricsKeywords: '',
  lyricsStory: '',
};

const mkEntry = (overrides: Partial<HistoryEntry>): HistoryEntry => ({
  id: 'x',
  savedAt: 1700000000000,
  title: '我的歌',
  state: baseState,
  stylePrompt: 'pop, 75 BPM, warm',
  lyricsPrompt: '[Verse]\n歌詞',
  ...overrides,
});

describe('exportEntryAsMarkdown', () => {
  it('包含標題與 metadata 表格', () => {
    const md = exportEntryAsMarkdown(mkEntry({}));
    expect(md).toContain('# 我的歌');
    expect(md).toContain('| 欄位 | 值 |');
    expect(md).toContain('| 語言 | 華語(繁體) |');
  });

  it('陣列欄位以逗號分隔', () => {
    const md = exportEntryAsMarkdown(mkEntry({}));
    expect(md).toContain('溫暖, 希望');
    expect(md).toContain('鋼琴, 弦樂');
  });

  it('Style 與 Lyrics 用 code fence', () => {
    const md = exportEntryAsMarkdown(mkEntry({}));
    expect(md).toContain('## 📤 Style Prompt');
    expect(md).toContain('## 📝 Lyrics');
    expect(md).toMatch(/```\npop, 75 BPM, warm\n```/);
  });

  it('有評分時顯示星等與分數', () => {
    const md = exportEntryAsMarkdown(
      mkEntry({ result: { rating: 4, audioUrl: 'https://suno.com/x', notes: '副歌記憶點不錯' } }),
    );
    expect(md).toContain('★★★★☆ (4/5)');
    expect(md).toContain('https://suno.com/x');
    expect(md).toContain('## 📝 評分筆記');
    expect(md).toContain('> 副歌記憶點不錯');
  });

  it('Voice Clone 取代人聲清單', () => {
    const md = exportEntryAsMarkdown(
      mkEntry({ state: { ...baseState, voiceCloneActive: true } }),
    );
    expect(md).toContain('| 人聲 | Voice Clone |');
    expect(md).not.toContain('女聲(柔/氣音)');
  });

  it('創作背景區塊條件顯示', () => {
    const noTheme = exportEntryAsMarkdown(mkEntry({}));
    expect(noTheme).not.toContain('## 🎨 創作背景');

    const withTheme = exportEntryAsMarkdown(
      mkEntry({ state: { ...baseState, lyricsTheme: '離別' } }),
    );
    expect(withTheme).toContain('## 🎨 創作背景');
    expect(withTheme).toContain('離別');
  });

  it('跳脫 Markdown 特殊字元', () => {
    const md = exportEntryAsMarkdown(mkEntry({ title: '*重點* | 測試' }));
    expect(md).toContain('# \\*重點\\* \\| 測試');
  });
});

describe('safeFilename', () => {
  it('去除非法字元', () => {
    const fn = safeFilename('a/b\\c:d*e?f"g<h>i|j', 'md');
    expect(fn).not.toMatch(/[\\/:*?"<>|]/);
    expect(fn).toMatch(/\.md$/);
  });

  it('空字串退化為 song', () => {
    expect(safeFilename('', 'md')).toMatch(/^song-\d{4}-\d{2}-\d{2}\.md$/);
  });

  it('截斷過長標題', () => {
    const long = 'x'.repeat(100);
    const fn = safeFilename(long, 'md');
    expect(fn.length).toBeLessThan(80);
  });
});
