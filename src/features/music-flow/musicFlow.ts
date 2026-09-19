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

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  value: string;
}

export type StyleTemplateMap = Record<Exclude<keyof StyleFacets, 'mood'>, readonly StyleTemplate[]>;

export const MOOD_TEMPLATES: readonly StyleTemplate[] = [
  { id: 'bittersweet-rise', name: '苦澀後釋懷', description: '主歌內斂，副歌逐漸放開', value: 'bittersweet and intimate in the verses, gradually hopeful, cathartic but controlled in the final chorus' },
  { id: 'warm-nostalgia', name: '溫暖懷舊', description: '像回看一段珍貴記憶', value: 'warm, nostalgic and tender, softly glowing, emotionally sincere without becoming overly sentimental' },
  { id: 'night-drive', name: '深夜城市', description: '孤獨但有流動與節奏', value: 'nocturnal, urban and reflective, quietly lonely, hypnotic forward motion with a subtle sense of possibility' },
  { id: 'romantic-tension', name: '曖昧拉扯', description: '克制、靠近、退後', value: 'restrained romantic tension, vulnerable and magnetic, alternating closeness and distance before an emotional release' },
  { id: 'dark-cinematic', name: '黑暗電影感', description: '壓迫、懸疑、壯闊', value: 'dark, cinematic and suspenseful, slow-building pressure, dramatic scale with a dangerous undertone' },
  { id: 'bright-youth', name: '明亮青春', description: '有速度感與向前動力', value: 'bright, youthful and uplifting, playful momentum, open-hearted confidence and a memorable celebratory lift' },
  { id: 'healing-minimal', name: '安靜療癒', description: '留白、呼吸、慢慢安定', value: 'calm, healing and spacious, fragile at first, gradually settling into quiet reassurance and emotional clarity' },
  { id: 'defiant-power', name: '倔強爆發', description: '壓抑累積後一次釋放', value: 'defiant and determined, tension held beneath the surface, building toward one powerful and liberating peak' },
];

export const STYLE_TEMPLATES: StyleTemplateMap = {
  genre: [
    { id: 'cinematic-pop', name: '電影流行', description: '清楚旋律與寬闊發展', value: 'cinematic pop, melodic, emotionally focused, modern organic production' },
    { id: 'urban-synth', name: '都會電子', description: '夜色與電子律動', value: 'urban synth-pop, sleek electronic pulse, atmospheric and contemporary' },
    { id: 'live-rock', name: '現場搖滾', description: '真實樂團與動態', value: 'live alternative rock, organic band interplay, dynamic and emotionally direct' },
    { id: 'neo-soul', name: 'Neo Soul', description: '柔滑和聲與律動', value: 'modern neo-soul, rich harmony, laid-back pocket, intimate and sophisticated' },
    { id: 'indie-folk', name: '獨立民謠', description: '敘事、木質、親密', value: 'intimate indie folk, acoustic storytelling, warm and understated' },
    { id: 'ambient-score', name: '氛圍配樂', description: '空間、紋理、漸進', value: 'ambient cinematic score, evolving textures, spacious and immersive' },
  ],
  instruments: [
    { id: 'piano-strings', name: '鋼琴弦樂', description: '抒情且能漸進堆疊', value: 'felt piano carries the motif, warm strings widen the choruses, restrained drums enter gradually' },
    { id: 'guitar-band', name: '吉他樂團', description: '真實現場動態', value: 'clean electric guitar, melodic bass, live drums, overdriven guitars opening in the final chorus' },
    { id: 'synth-electronic', name: '合成器電子', description: '脈衝與空間層次', value: 'analog synth pulse, deep electronic bass, crisp programmed drums, airy pads and subtle arpeggios' },
    { id: 'acoustic-small', name: '小編制原聲', description: '留白與近距離感', value: 'fingerpicked acoustic guitar, upright piano, brushed percussion, sparse cello accents' },
    { id: 'orchestral', name: '電影管弦', description: '大尺度與戲劇張力', value: 'low strings and piano establish tension, brass and full orchestra reserved for the climax' },
  ],
  vocal: [
    { id: 'female-intimate', name: '細膩女聲', description: '近距離到高峰', value: 'intimate female alto, clear diction, breath-controlled verses, emotionally open but not over-sung choruses' },
    { id: 'male-warm', name: '溫暖男聲', description: '沉穩而具敘事感', value: 'warm male baritone, conversational verses, textured midrange, controlled lift in the chorus' },
    { id: 'airy', name: '空靈氣聲', description: '輕盈、脆弱、空間感', value: 'airy breathy vocal, delicate phrasing, soft falsetto layers, intimate and fragile' },
    { id: 'power', name: '爆發主唱', description: '前段克制、後段釋放', value: 'powerful lead vocal, restrained lower register in verses, full resonant belt reserved for the final chorus' },
    { id: 'duet', name: '男女對唱', description: '視角交替與合唱', value: 'male and female duet, alternating intimate perspectives, harmonizing together in the chorus' },
  ],
  tempo: [
    { id: 'slow', name: '慢板 72–82', description: '適合抒情與留白', value: '78 BPM, steady slow pulse, spacious phrasing' },
    { id: 'mid', name: '中板 88–102', description: '自然推進、用途廣', value: '96 BPM, steady mid-tempo groove, gentle forward momentum' },
    { id: 'upbeat', name: '輕快 112–124', description: '明亮且具律動', value: '118 BPM, upbeat driving pulse, danceable without feeling rushed' },
    { id: 'half-time', name: '半拍重量感', description: '寬廣、沉重、戲劇化', value: '84 BPM with a spacious half-time feel, heavy downbeats and controlled syncopation' },
    { id: 'free-rubato', name: '自由速度', description: '適合前奏與極簡作品', value: 'rubato opening, gradually settling into a subtle pulse, flexible expressive timing' },
  ],
  production: [
    { id: 'clean-modern', name: '清晰現代', description: '主體突出、層次乾淨', value: 'clean modern production, clear foreground, controlled low end, cohesive transitions and wide but natural choruses' },
    { id: 'warm-analog', name: '溫暖類比', description: '柔和顆粒與真實感', value: 'warm analog character, gentle tape saturation, organic room ambience, soft transients' },
    { id: 'wide-cinematic', name: '寬銀幕電影感', description: '景深與高潮尺度', value: 'wide cinematic depth, intimate dry verses, expanding stereo field and reverberant scale at the climax' },
    { id: 'raw-live', name: '真實現場', description: '保留呼吸和演奏感', value: 'raw live-room energy, natural performance imperfections, minimal polishing, dynamic band interaction' },
    { id: 'lofi-texture', name: 'Lo-fi 質感', description: '柔焦、舊感、親密', value: 'soft lo-fi texture, muted highs, subtle vinyl noise, close and nostalgic atmosphere' },
  ],
  avoid: [
    { id: 'no-overproduction', name: '避免過度製作', description: '保留空間與動態', value: 'overproduction, constant maximal energy, excessive layers, harsh limiting' },
    { id: 'no-cheesy', name: '避免俗套', description: '不要廉價煽情', value: 'cheesy sentimentality, predictable inspirational clichés, melodramatic key changes' },
    { id: 'no-dense', name: '避免擁擠', description: '讓主旋律與人聲呼吸', value: 'dense frequency masking, busy accompaniment under vocals, competing lead elements' },
    { id: 'no-imitation', name: '避免直接模仿', description: '保留參考但不要複製', value: 'direct imitation, copyrighted lyrics, recognizable signature melody, artist impersonation' },
    { id: 'no-vocal-effects', name: '避免重度人聲效果', description: '維持自然辨識度', value: 'heavy autotune artifacts, excessive vocal chopping, buried lead vocal, unnatural pronunciation' },
  ],
};

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
