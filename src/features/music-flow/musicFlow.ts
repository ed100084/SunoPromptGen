export interface ReferenceInput {
  artist: string;
  song: string;
  vocal: string;
  melody: string;
  url: string;
  notes: string;
}

export interface StyleFacets {
  genre: string;
  mood: string;
  instruments: string;
  vocal: string;
  tempo: string;
  production: string;
  avoid: string;
}

export interface FlowSection {
  tag: string;
  energy: number;
  direction: string;
}

export interface ParsedLyricsSection { tag: string; lyrics: string }
export interface LyricsReview { sections: ParsedLyricsSection[]; issues: string[] }

const DISCLAIMER = '以下為產品轉譯建議，不是 Suno 官方規格。';

export function suggestStyleFromReference(reference: ReferenceInput): StyleFacets {
  const source = [reference.artist, reference.song, reference.vocal, reference.melody, reference.notes].filter(Boolean).join('；');
  return {
    genre: source ? `以 ${source} 的特徵為參考，但不要直接模仿特定作品` : '',
    mood: 'coherent emotional arc, memorable and focused',
    instruments: '',
    vocal: reference.vocal,
    tempo: '',
    production: 'clear foreground, controlled dynamics, cohesive transitions',
    avoid: 'direct imitation, copyrighted lyrics, recognizable signature melody',
  };
}

export function createArrangement(style: StyleFacets, instrumental = false): FlowSection[] {
  const intro = style.instruments || 'signature motif and restrained texture';
  return [
    { tag: 'Intro', energy: 2, direction: `建立音色與主題動機；${intro}` },
    { tag: 'Verse 1', energy: 3, direction: instrumental ? '主旋律第一次完整陳述，保留空間' : '近距離敘事，節奏與配器克制' },
    { tag: 'Pre-Chorus', energy: 5, direction: '增加和聲張力與節奏推進，避免過早爆發' },
    { tag: 'Chorus', energy: 8, direction: '清楚 hook，拓寬音域與立體聲場' },
    { tag: 'Verse 2', energy: 5, direction: '保留辨識度並加入新的節奏或配器細節' },
    { tag: 'Bridge', energy: 4, direction: '抽離主節奏，建立對比與轉折' },
    { tag: 'Final Chorus', energy: 10, direction: '全曲唯一最高峰，加入和聲與完整編制' },
    { tag: 'Outro', energy: 2, direction: '回收主題動機，簡潔結束並留下餘韻' },
  ];
}

export function buildExternalLyricsPrompt(options: {
  title: string; concept: string; language: string; style: StyleFacets; sections: FlowSection[];
}): string {
  return [
    '你是專業歌曲作詞人。請依照以下規格寫出完整、可演唱的歌詞。',
    `歌名：${options.title || '未定'}`,
    `主題／故事：${options.concept || '請依音樂氣氛建立清楚敘事'}`,
    `語言：${options.language || '繁體中文'}`,
    `曲風與情緒：${options.style.genre}；${options.style.mood}`,
    `人聲方向：${options.style.vocal || '自然、清楚、具有情緒層次'}`,
    '段落與起伏：',
    ...options.sections.map((section) => `- [${section.tag}] 能量 ${section.energy}/10：${section.direction}`),
    '要求：每段必須保留 [Verse 1]、[Chorus] 等標籤；副歌要有可重複 hook；字句需適合演唱；不要解釋創作過程。',
    '只輸出完整歌詞，不要 Markdown code fence 或額外說明。',
  ].join('\n');
}

export function parseAndReviewLyrics(value: string, arrangement: FlowSection[]): LyricsReview {
  const normalized = value.trim().replace(/^```(?:\w+)?\s*|```$/g, '').trim();
  const matches = [...normalized.matchAll(/^\[([^\]]+)]\s*$/gm)];
  const sections: ParsedLyricsSection[] = matches.map((match, index) => ({
    tag: match[1].trim(),
    lyrics: normalized.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? normalized.length).trim(),
  }));
  const issues: string[] = [];
  if (!sections.length) issues.push('沒有偵測到 [Verse]、[Chorus] 等段落標籤。');
  for (const expected of arrangement) {
    if (!sections.some((section) => section.tag.toLowerCase() === expected.tag.toLowerCase())) issues.push(`缺少 [${expected.tag}]。`);
  }
  if (!sections.some((section) => /chorus/i.test(section.tag) && section.lyrics.length >= 12)) issues.push('副歌內容過短或缺少可辨識的 hook。');
  for (const section of sections) if (!section.lyrics) issues.push(`[${section.tag}] 沒有歌詞內容。`);
  return { sections, issues };
}

export function buildSunoOutput(options: {
  style: StyleFacets; sections: FlowSection[]; lyrics: string; instrumental: boolean; model: string;
}) {
  const stylePrompt = [options.style.genre, options.style.mood, options.style.instruments, options.style.vocal, options.style.tempo, options.style.production]
    .map((item) => item.trim()).filter(Boolean).join(', ');
  const sectionDirections = options.sections.map((section) => `[${section.tag}: energy ${section.energy}/10, ${section.direction}]`).join('\n');
  return {
    style: stylePrompt,
    customLyrics: options.instrumental ? sectionDirections : `${sectionDirections}\n\n${options.lyrics.trim()}`.trim(),
    settings: {
      model: options.model,
      mode: 'Custom',
      instrumental: options.instrumental,
      excludeStyles: options.style.avoid,
    },
    disclaimer: DISCLAIMER,
  };
}
