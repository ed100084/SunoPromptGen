import { describe, expect, it } from 'vitest';
import { buildLyricsAiPrompt, canRunLyricsAiTask, normalizeLyricsAiOutput } from './lyricsAi';

describe('buildLyricsAiPrompt', () => {
  it('建立整首生成 prompt 並要求純文字輸出', () => {
    const prompt = buildLyricsAiPrompt({
      task: 'generate',
      lyrics: '',
      instruction: '副歌加入一句 hook',
      context: { title: '天亮以前', language: '繁體中文', structure: 'Verse, Chorus' },
    });

    expect(prompt).toContain('任務：根據歌曲背景創作一首完整');
    expect(prompt).toContain('只輸出最終歌詞純文字');
    expect(prompt).toContain('- 歌名：天亮以前');
    expect(prompt).toContain('創作指令：副歌加入一句 hook');
  });

  it('局部修改要求回傳完整歌詞並帶入契約', () => {
    const prompt = buildLyricsAiPrompt({
      task: 'edit-lyrics',
      lyrics: '[Verse]\n舊句\n\n[Chorus]\n保留我',
      instruction: '只改主歌並增加內韻',
      context: { editScope: 'Verse', preserve: '副歌原文' },
    });

    expect(prompt).toContain('必須輸出修改後的完整歌詞');
    expect(prompt).toContain('修改範圍：Verse');
    expect(prompt).toContain('必須保留：副歌原文');
    expect(prompt).toContain('[Chorus]\n保留我');
  });

  it('忽略空白背景，修剪內容並附上可參考草稿', () => {
    const prompt = buildLyricsAiPrompt({
      task: 'generate',
      lyrics: '  [Verse]\n草稿  ',
      instruction: '  ',
      context: { title: '  ', concept: ' 夜行 ', moods: ' 迷離 ' },
    });

    expect(prompt).toContain('創作指令：建立清楚的敘事弧線與有記憶點的副歌。');
    expect(prompt).toContain('- 主題／故事：夜行');
    expect(prompt).toContain('- 情緒：迷離');
    expect(prompt).not.toContain('- 歌名：');
    expect(prompt).toContain('可參考或重寫的草稿：\n[Verse]\n草稿');
  });

  it('局部修改空白契約時套用安全預設', () => {
    const prompt = buildLyricsAiPrompt({
      task: 'edit-lyrics',
      lyrics: '  原詞  ',
      instruction: '',
      context: { editScope: ' ', preserve: ' ' },
    });

    expect(prompt).toContain('修改範圍：依修改指令判斷必要範圍');
    expect(prompt).toContain('必須保留：未被指示修改的文字、段落結構與敘事視角');
    expect(prompt).toContain('修改指令：改善指定範圍的文字，但維持原意與可唱性。');
    expect(prompt).toMatch(/既有歌詞：\n原詞$/);
  });
});

describe('normalizeLyricsAiOutput', () => {
  it('移除 code fence 與歌詞標題', () => {
    expect(normalizeLyricsAiOutput('```text\n歌詞：\n[Verse]\n第一行\n```')).toBe('[Verse]\n第一行');
  });

  it('支援 Markdown fence 與英文標題，不移除內文中的標題字樣', () => {
    expect(normalizeLyricsAiOutput('```markdown\nLyrics:\n[Verse]\nLyrics: stay\n```')).toBe('[Verse]\nLyrics: stay');
  });

  it('不改寫一般純文字內容', () => {
    expect(normalizeLyricsAiOutput('  [Chorus]\n留下來  ')).toBe('[Chorus]\n留下來');
  });
});

describe('canRunLyricsAiTask', () => {
  it('局部修改必須有既有歌詞', () => {
    expect(canRunLyricsAiTask('edit-lyrics', '   ')).toBe(false);
    expect(canRunLyricsAiTask('edit-lyrics', '一句歌詞')).toBe(true);
    expect(canRunLyricsAiTask('generate', '')).toBe(true);
  });
});
