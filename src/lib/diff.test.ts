import { describe, it, expect } from 'vitest';
import { diffTags, diffLines, diffSongState } from './diff';
import type { SongState } from '../types';

describe('diffTags', () => {
  it('正確計算新增/移除/相同', () => {
    const r = diffTags('a, b, c', 'a, c, d');
    expect(r.common).toEqual(['a', 'c']);
    expect(r.removed).toEqual(['b']);
    expect(r.added).toEqual(['d']);
  });

  it('支援全形逗號', () => {
    const r = diffTags('柔和，溫暖', '柔和，激昂');
    expect(r.common).toEqual(['柔和']);
    expect(r.removed).toEqual(['溫暖']);
    expect(r.added).toEqual(['激昂']);
  });

  it('空字串輸入', () => {
    const r = diffTags('', 'a, b');
    expect(r.added).toEqual(['a', 'b']);
    expect(r.removed).toEqual([]);
  });

  it('完全相同時 added/removed 為空', () => {
    const r = diffTags('a, b', 'a, b');
    expect(r.added).toEqual([]);
    expect(r.removed).toEqual([]);
    expect(r.common).toEqual(['a', 'b']);
  });

  it('忽略空白與空 token', () => {
    const r = diffTags('a, , b', 'a,b,');
    expect(r.added).toEqual([]);
    expect(r.removed).toEqual([]);
  });
});

describe('diffLines', () => {
  it('完全相同的兩段', () => {
    const ops = diffLines('a\nb', 'a\nb');
    expect(ops.every((o) => o.type === 'same')).toBe(true);
    expect(ops).toHaveLength(2);
  });

  it('新增一行', () => {
    const ops = diffLines('a\nb', 'a\nb\nc');
    expect(ops).toEqual([
      { type: 'same', text: 'a' },
      { type: 'same', text: 'b' },
      { type: 'add', text: 'c' },
    ]);
  });

  it('刪除一行', () => {
    const ops = diffLines('a\nb\nc', 'a\nc');
    expect(ops).toEqual([
      { type: 'same', text: 'a' },
      { type: 'del', text: 'b' },
      { type: 'same', text: 'c' },
    ]);
  });

  it('替換一行（同時 del 和 add）', () => {
    const ops = diffLines('a\nB\nc', 'a\nbeta\nc');
    const types = ops.map((o) => o.type);
    expect(types).toContain('del');
    expect(types).toContain('add');
    expect(ops.find((o) => o.type === 'del')?.text).toBe('B');
    expect(ops.find((o) => o.type === 'add')?.text).toBe('beta');
  });

  it('空字串對非空', () => {
    const ops = diffLines('', 'hi');
    // 空字串 split('\n') 會得到 [''], 會匹配空行，所以可能有 same:''
    expect(ops.some((o) => o.type === 'add' && o.text === 'hi')).toBe(true);
  });

  it('中文歌詞 diff', () => {
    const a = '我的眼神\n是你的倒影';
    const b = '我的眼神\n是時光的倒影';
    const ops = diffLines(a, b);
    expect(ops.find((o) => o.type === 'same')?.text).toBe('我的眼神');
    expect(ops.some((o) => o.type === 'del' && o.text === '是你的倒影')).toBe(true);
    expect(ops.some((o) => o.type === 'add' && o.text === '是時光的倒影')).toBe(true);
  });
});

describe('diffSongState', () => {
  const baseState: SongState = {
    songTitle: '原曲',
    language: '華語(繁體)',
    genre: '華語抒情',
    moods: ['溫暖'],
    energy: '中',
    instruments: ['鋼琴'],
    vocals: ['女聲'],
    textures: ['電影感'],
    negatives: [],
    bpm: '75',
    musicKey: 'C',
    extra: '',
    cohesion: true,
    voiceCloneActive: false,
    structureName: '抒情',
    sections: [],
    lyricsTheme: '',
    lyricsKeywords: '',
    lyricsStory: '',
  };

  it('完全相同時所有 changed=false', () => {
    const diffs = diffSongState(baseState, baseState);
    expect(diffs.every((d) => !d.changed)).toBe(true);
  });

  it('陣列欄位變動正確標記', () => {
    const b: SongState = { ...baseState, instruments: ['鋼琴', '弦樂'] };
    const diffs = diffSongState(baseState, b);
    const ins = diffs.find((d) => d.label === '樂器')!;
    expect(ins.changed).toBe(true);
    expect(ins.before).toBe('鋼琴');
    expect(ins.after).toBe('鋼琴, 弦樂');
  });

  it('布林欄位顯示為是/否', () => {
    const b: SongState = { ...baseState, cohesion: false };
    const diffs = diffSongState(baseState, b);
    const c = diffs.find((d) => d.label === '抗切割感')!;
    expect(c.before).toBe('是');
    expect(c.after).toBe('否');
    expect(c.changed).toBe(true);
  });
});
