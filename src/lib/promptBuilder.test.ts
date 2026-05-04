import { describe, it, expect } from 'vitest';
import {
  buildLyricsPrompt,
  buildFullPrompt,
  parseLlmResponse,
} from './promptBuilder';
import type { Section, SongState } from '../types';

const baseState: SongState = {
  songTitle: '',
  language: '華語(繁體)',
  genre: '華語抒情',
  moods: [],
  energy: '',
  instruments: [],
  vocals: [],
  textures: [],
  negatives: [],
  bpm: '',
  musicKey: '',
  extra: '',
  cohesion: false,
  voiceCloneActive: false,
  structureName: '',
  sections: [],
  lyricsTheme: '',
  lyricsKeywords: '',
  lyricsStory: '',
};

describe('buildLyricsPrompt', () => {
  it('段落含 desc 時加入 tag - desc 格式', () => {
    const sections: Section[] = [
      { tag: 'Verse', desc: '主歌', lyrics: '第一行\n第二行' },
    ];
    const result = buildLyricsPrompt(sections);
    expect(result).toContain('[Verse - 主歌]');
    expect(result).toContain('第一行\n第二行');
  });

  it('段落沒 desc 時只顯示 tag', () => {
    const sections: Section[] = [{ tag: 'Chorus', desc: '', lyrics: '記憶點' }];
    expect(buildLyricsPrompt(sections)).toContain('[Chorus]');
  });

  it('歌詞為空時填 (instrumental)', () => {
    const sections: Section[] = [{ tag: 'Intro', desc: '', lyrics: '' }];
    expect(buildLyricsPrompt(sections)).toContain('(instrumental)');
  });

  it('多段落以雙換行分隔', () => {
    const sections: Section[] = [
      { tag: 'Verse', desc: '', lyrics: 'A' },
      { tag: 'Chorus', desc: '', lyrics: 'B' },
    ];
    expect(buildLyricsPrompt(sections)).toBe('[Verse]\nA\n\n[Chorus]\nB');
  });
});

describe('buildFullPrompt', () => {
  it('有歌名時前綴 Title:', () => {
    const result = buildFullPrompt(
      { ...baseState, songTitle: '我的歌' },
      'pop, 75 BPM',
      '[Verse]\n歌詞',
    );
    expect(result).toContain('Title: 我的歌');
    expect(result).toContain('--- STYLE ---');
    expect(result).toContain('--- LYRICS ---');
  });

  it('沒歌名時不顯示 Title 區塊', () => {
    const result = buildFullPrompt(baseState, 'pop', 'lyrics');
    expect(result).not.toContain('Title:');
  });
});

describe('parseLlmResponse', () => {
  it('正確解析純 JSON 回應', () => {
    const text = '{"sections":[{"tag":"Verse","lyrics":"a"}]}';
    const result = parseLlmResponse(text);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].tag).toBe('Verse');
  });

  it('能從文字中萃取 JSON', () => {
    const text = '好的，這是您的歌詞：\n{"sections":[{"tag":"Chorus","lyrics":"記憶點"}]}\n還有什麼問題？';
    const result = parseLlmResponse(text);
    expect(result.sections[0].tag).toBe('Chorus');
  });

  it('找不到 JSON 時拋錯', () => {
    expect(() => parseLlmResponse('這不是 JSON')).toThrow('找不到 JSON');
  });

  it('缺少 sections 陣列時拋錯', () => {
    expect(() => parseLlmResponse('{"foo":"bar"}')).toThrow('sections');
  });
});
