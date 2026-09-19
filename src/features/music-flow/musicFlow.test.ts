import { describe, expect, it } from 'vitest';
import { buildExternalLyricsPrompt, buildSunoOutput, createArrangement, MOOD_TEMPLATES, parseAndReviewLyrics, suggestStyleFromReference } from './musicFlow';

const style = suggestStyleFromReference({ artist: '參考樂團', song: '', vocal: '溫暖女聲', melody: '', url: '', notes: '漸進式編曲' });
const arrangement = createArrangement(style);

describe('music flow', () => {
  it('提供多種可直接修改的情緒樣板', () => {
    expect(MOOD_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(MOOD_TEMPLATES.map((template) => template.id)).size).toBe(MOOD_TEMPLATES.length);
    expect(MOOD_TEMPLATES.every((template) => template.value.length > 20)).toBe(true);
  });

  it('從參考描述產生可調 style 與完整起伏', () => {
    expect(style.genre).toContain('參考樂團');
    expect(arrangement.at(-2)).toMatchObject({ tag: 'Final Chorus', energy: 10 });
  });
  it('產生可交給外部 AI 的填詞 prompt', () => {
    expect(buildExternalLyricsPrompt({ title: '雨停以前', concept: '告別', language: '繁體中文', style, sections: arrangement })).toContain('[Chorus]');
  });
  it('解析回貼歌詞並指出缺少段落', () => {
    const review = parseAndReviewLyrics('[Verse 1]\n第一句\n\n[Chorus]\n記住我 記住我 再一次記住我', arrangement);
    expect(review.sections).toHaveLength(2);
    expect(review.issues).toContain('缺少 [Bridge]。');
  });
  it('輸出 Suno style custom lyrics 與 settings', () => {
    const output = buildSunoOutput({ style, sections: arrangement, lyrics: '[Verse 1]\n歌詞', instrumental: false, model: 'v6' });
    expect(output.settings).toMatchObject({ mode: 'Custom', instrumental: false, model: 'v6' });
    expect(output.customLyrics).toContain('[Verse 1]');
  });
});
