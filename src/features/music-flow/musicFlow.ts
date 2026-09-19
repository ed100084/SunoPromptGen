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
  { id: 'dreamlike', name: '夢境漂浮', description: '朦朧、失重、似真似幻', value: 'dreamlike, weightless and hazy, gently surreal, floating between wonder and quiet uncertainty' },
  { id: 'heartbreak', name: '失戀崩解', description: '從克制到情緒潰堤', value: 'heartbroken and exposed, restrained disbelief in the verses, gradually unraveling into an honest emotional collapse' },
  { id: 'epic-hope', name: '史詩希望', description: '逆境後抬頭向前', value: 'resilient, expansive and hopeful, rising from uncertainty toward a hard-earned sense of triumph' },
  { id: 'playful-flirty', name: '俏皮心動', description: '輕盈、機靈、帶曖昧', value: 'playful, flirtatious and buoyant, witty confidence with sparkling romantic tension' },
  { id: 'ritual-mystic', name: '神秘儀式感', description: '古老、莊嚴、催眠', value: 'mystical, ceremonial and hypnotic, ancient-feeling gravity with a slow sense of revelation' },
  { id: 'anxious-fragile', name: '焦慮脆弱', description: '不安、急促、內心拉扯', value: 'anxious and fragile, restless inner tension, emotionally exposed with brief flashes of fragile calm' },
  { id: 'cool-confident', name: '冷酷自信', description: '俐落、克制、有掌控感', value: 'cool, self-assured and controlled, understated swagger, emotionally detached but magnetic' },
  { id: 'peaceful-release', name: '平靜放下', description: '接受、鬆開、留下餘韻', value: 'peaceful and accepting, gently reflective, releasing emotional weight into quiet closure' },
];

export const STYLE_TEMPLATES: StyleTemplateMap = {
  genre: [
    { id: 'cinematic-pop', name: '電影流行', description: '清楚旋律與寬闊發展', value: 'cinematic pop, melodic, emotionally focused, modern organic production' },
    { id: 'urban-synth', name: '都會電子', description: '夜色與電子律動', value: 'urban synth-pop, sleek electronic pulse, atmospheric and contemporary' },
    { id: 'live-rock', name: '現場搖滾', description: '真實樂團與動態', value: 'live alternative rock, organic band interplay, dynamic and emotionally direct' },
    { id: 'neo-soul', name: 'Neo Soul', description: '柔滑和聲與律動', value: 'modern neo-soul, rich harmony, laid-back pocket, intimate and sophisticated' },
    { id: 'indie-folk', name: '獨立民謠', description: '敘事、木質、親密', value: 'intimate indie folk, acoustic storytelling, warm and understated' },
    { id: 'ambient-score', name: '氛圍配樂', description: '空間、紋理、漸進', value: 'ambient cinematic score, evolving textures, spacious and immersive' },
    { id: 'dream-pop', name: 'Dream Pop', description: '朦朧、漂浮、旋律化', value: 'dream pop, shimmering guitars, soft-focus atmosphere, melodic and weightless' },
    { id: 'city-pop', name: 'City Pop', description: '都會、復古、明亮律動', value: 'city pop, polished retro groove, colorful harmony, bright urban sophistication' },
    { id: 'rnb-ballad', name: 'R&B 抒情', description: '細膩轉音與現代節奏', value: 'contemporary R&B ballad, intimate groove, expressive melody, spacious modern production' },
    { id: 'post-rock', name: '後搖滾', description: '器樂漸進與巨大高峰', value: 'post-rock, patient instrumental build, repeating motif, massive but earned dynamic climax' },
    { id: 'electropop', name: '電子流行', description: '強 hook 與俐落節拍', value: 'electropop, sharp rhythmic hooks, glossy synth textures, concise and energetic' },
    { id: 'jazz-pop', name: '爵士流行', description: '豐富和聲但保持好聽', value: 'jazz-pop, colorful extended harmony, relaxed swing influence, accessible melodic focus' },
    { id: 'folk-rock', name: '民謠搖滾', description: '敘事加上樂團推進', value: 'folk rock, acoustic storytelling, live drums and gradually expanding electric guitars' },
    { id: 'darkwave', name: 'Darkwave', description: '低冷、陰暗、電子脈衝', value: 'darkwave, cold synth pulse, deep bass, restrained gothic atmosphere and nocturnal momentum' },
    { id: 'funk-pop', name: 'Funk Pop', description: '切分、彈性、明亮', value: 'funk pop, syncopated bass groove, crisp guitar, playful rhythmic precision and bright hooks' },
    { id: 'world-fusion', name: '世界融合', description: '跨文化節奏與音色', value: 'contemporary world fusion, organic regional instruments, interlocking rhythms, modern cinematic framing' },
  ],
  instruments: [
    { id: 'piano-strings', name: '鋼琴弦樂', description: '抒情且能漸進堆疊', value: 'felt piano carries the motif, warm strings widen the choruses, restrained drums enter gradually' },
    { id: 'guitar-band', name: '吉他樂團', description: '真實現場動態', value: 'clean electric guitar, melodic bass, live drums, overdriven guitars opening in the final chorus' },
    { id: 'synth-electronic', name: '合成器電子', description: '脈衝與空間層次', value: 'analog synth pulse, deep electronic bass, crisp programmed drums, airy pads and subtle arpeggios' },
    { id: 'acoustic-small', name: '小編制原聲', description: '留白與近距離感', value: 'fingerpicked acoustic guitar, upright piano, brushed percussion, sparse cello accents' },
    { id: 'orchestral', name: '電影管弦', description: '大尺度與戲劇張力', value: 'low strings and piano establish tension, brass and full orchestra reserved for the climax' },
    { id: 'rhodes-groove', name: 'Rhodes 律動', description: '溫暖電鋼琴與鬆弛節奏', value: 'warm Rhodes chords, rounded electric bass, pocket drums, tasteful muted guitar accents' },
    { id: 'dream-guitars', name: '夢幻吉他牆', description: '延遲、殘響、寬闊層次', value: 'layered reverb guitars, delayed melodic figures, soft bass and gradually blooming live drums' },
    { id: 'dark-electronic', name: '暗黑電子', description: '低頻、工業質地、壓迫感', value: 'sub bass, distorted electronic pulse, metallic percussion, ominous drones and sparse synth stabs' },
    { id: 'brass-funk', name: '銅管 Funk', description: '切分與現場爆發力', value: 'syncopated bass, tight drums, clipped rhythm guitar, punchy brass hits and short keyboard stabs' },
    { id: 'asian-organic', name: '東方有機', description: '傳統音色與現代編制', value: 'plucked Asian strings, bamboo flute accents, cinematic percussion, modern bass and restrained ambient layers' },
    { id: 'percussion-led', name: '打擊樂主導', description: '以節奏推動段落變化', value: 'layered hand percussion, tom-driven groove, sparse bass, rhythmic vocal textures and minimal harmony' },
    { id: 'minimal-electronic', name: '極簡電子', description: '少量元素精準變化', value: 'minimal synth motif, dry electronic kick, restrained sub bass, tiny textural changes and deliberate silence' },
  ],
  vocal: [
    { id: 'female-intimate', name: '細膩女聲', description: '近距離到高峰', value: 'intimate female alto, clear diction, breath-controlled verses, emotionally open but not over-sung choruses' },
    { id: 'male-warm', name: '溫暖男聲', description: '沉穩而具敘事感', value: 'warm male baritone, conversational verses, textured midrange, controlled lift in the chorus' },
    { id: 'airy', name: '空靈氣聲', description: '輕盈、脆弱、空間感', value: 'airy breathy vocal, delicate phrasing, soft falsetto layers, intimate and fragile' },
    { id: 'power', name: '爆發主唱', description: '前段克制、後段釋放', value: 'powerful lead vocal, restrained lower register in verses, full resonant belt reserved for the final chorus' },
    { id: 'duet', name: '男女對唱', description: '視角交替與合唱', value: 'male and female duet, alternating intimate perspectives, harmonizing together in the chorus' },
    { id: 'female-clear', name: '清亮女聲', description: '透明、穩定、旋律突出', value: 'clear bright female vocal, precise pitch, open tone, graceful lift without excessive belting' },
    { id: 'male-raspy', name: '沙啞男聲', description: '粗糙質地與真實情緒', value: 'textured raspy male vocal, close conversational delivery, controlled grit at emotional peaks' },
    { id: 'falsetto', name: '假音主導', description: '柔軟高音與脆弱感', value: 'expressive falsetto-led vocal, smooth register transitions, vulnerable phrasing and restrained harmonies' },
    { id: 'spoken-sung', name: '半說半唱', description: '節奏化敘事與自然口吻', value: 'spoken-sung delivery, rhythmic conversational phrasing, understated melody opening into a sung chorus' },
    { id: 'choir', name: '合唱堆疊', description: '群體感與寬闊高潮', value: 'focused lead vocal with layered choir responses, widening harmonies reserved for the final chorus' },
    { id: 'androgynous', name: '中性聲線', description: '冷靜、細緻、難以定義', value: 'androgynous lead vocal, controlled intimate tone, subtle dynamics and emotionally ambiguous phrasing' },
    { id: 'rap-melodic', name: '旋律說唱', description: '節奏主歌與旋律副歌', value: 'rhythmic melodic rap verses, clear diction and pocket, transitioning into a fully sung memorable chorus' },
  ],
  tempo: [
    { id: 'slow', name: '慢板 72–82', description: '適合抒情與留白', value: '78 BPM, steady slow pulse, spacious phrasing' },
    { id: 'mid', name: '中板 88–102', description: '自然推進、用途廣', value: '96 BPM, steady mid-tempo groove, gentle forward momentum' },
    { id: 'upbeat', name: '輕快 112–124', description: '明亮且具律動', value: '118 BPM, upbeat driving pulse, danceable without feeling rushed' },
    { id: 'half-time', name: '半拍重量感', description: '寬廣、沉重、戲劇化', value: '84 BPM with a spacious half-time feel, heavy downbeats and controlled syncopation' },
    { id: 'free-rubato', name: '自由速度', description: '適合前奏與極簡作品', value: 'rubato opening, gradually settling into a subtle pulse, flexible expressive timing' },
    { id: 'very-slow', name: '極慢 58–68', description: '沉重、空間與長音', value: '64 BPM, very slow deliberate pulse, long sustained phrases and generous space' },
    { id: 'groove-105', name: '律動 104–110', description: '適合 R&B 與 Funk', value: '106 BPM, syncopated pocket groove, relaxed but clearly propulsive' },
    { id: 'dance-126', name: '舞曲 124–130', description: '穩定四拍與舞動感', value: '126 BPM, steady four-on-the-floor pulse, energetic and club-ready without overcrowding' },
    { id: 'fast-rock', name: '快速搖滾 138–152', description: '直接、推進、現場感', value: '146 BPM, urgent live-rock drive, energetic eighth-note momentum and dynamic fills' },
    { id: 'waltz', name: '三拍搖曳', description: '華爾滋或六八拍流動', value: '72 BPM in 6/8, lilting compound-meter motion, broad swaying phrases' },
    { id: 'double-time', name: '雙倍速度感', description: '旋律中板、鼓組加速', value: '92 BPM with selective double-time drum energy, stable vocal phrasing over urgent percussion' },
  ],
  production: [
    { id: 'clean-modern', name: '清晰現代', description: '主體突出、層次乾淨', value: 'clean modern production, clear foreground, controlled low end, cohesive transitions and wide but natural choruses' },
    { id: 'warm-analog', name: '溫暖類比', description: '柔和顆粒與真實感', value: 'warm analog character, gentle tape saturation, organic room ambience, soft transients' },
    { id: 'wide-cinematic', name: '寬銀幕電影感', description: '景深與高潮尺度', value: 'wide cinematic depth, intimate dry verses, expanding stereo field and reverberant scale at the climax' },
    { id: 'raw-live', name: '真實現場', description: '保留呼吸和演奏感', value: 'raw live-room energy, natural performance imperfections, minimal polishing, dynamic band interaction' },
    { id: 'lofi-texture', name: 'Lo-fi 質感', description: '柔焦、舊感、親密', value: 'soft lo-fi texture, muted highs, subtle vinyl noise, close and nostalgic atmosphere' },
    { id: 'dreamy-wash', name: '夢幻霧化', description: '殘響包覆但保留主體', value: 'dreamy soft-focus production, blooming reverb tails, gently blurred edges with the lead remaining intelligible' },
    { id: 'punchy-radio', name: '俐落電台感', description: '緊湊、有力、hook 清楚', value: 'punchy radio-ready production, tight transients, focused low end, immediate vocal and concise arrangement' },
    { id: 'dark-intimate', name: '暗色近距離', description: '乾燥主歌、陰影低頻', value: 'dark intimate production, dry close verses, restrained sub weight and selectively widening choruses' },
    { id: 'retro-80s', name: '80 年代復古', description: '閘門鼓與類比光澤', value: 'polished 1980s-inspired production, gated drums, analog synth sheen, wide chorus and controlled nostalgia' },
    { id: 'retro-70s', name: '70 年代溫暖', description: '自然房間與柔和飽和', value: '1970s-inspired warmth, natural room sound, tape saturation, rounded bass and unhurried dynamics' },
    { id: 'experimental', name: '實驗聲響', description: '意外轉場與質地對比', value: 'experimental but coherent production, unexpected textural edits, contrasting spaces and bold transitional sound design' },
    { id: 'acoustic-natural', name: '純淨原聲', description: '少加工、自然空間', value: 'natural acoustic production, honest room ambience, minimal processing, realistic dynamics and close performance detail' },
  ],
  avoid: [
    { id: 'no-overproduction', name: '避免過度製作', description: '保留空間與動態', value: 'overproduction, constant maximal energy, excessive layers, harsh limiting' },
    { id: 'no-cheesy', name: '避免俗套', description: '不要廉價煽情', value: 'cheesy sentimentality, predictable inspirational clichés, melodramatic key changes' },
    { id: 'no-dense', name: '避免擁擠', description: '讓主旋律與人聲呼吸', value: 'dense frequency masking, busy accompaniment under vocals, competing lead elements' },
    { id: 'no-imitation', name: '避免直接模仿', description: '保留參考但不要複製', value: 'direct imitation, copyrighted lyrics, recognizable signature melody, artist impersonation' },
    { id: 'no-vocal-effects', name: '避免重度人聲效果', description: '維持自然辨識度', value: 'heavy autotune artifacts, excessive vocal chopping, buried lead vocal, unnatural pronunciation' },
    { id: 'no-long-intro', name: '避免前奏過長', description: '儘快建立主題', value: 'overly long intro, slow setup without a clear motif, delayed vocal entrance' },
    { id: 'no-drum-loop', name: '避免死板鼓循環', description: '段落間需要動態變化', value: 'unchanging drum loop, identical dynamics across sections, mechanical repetitive fills' },
    { id: 'no-high-pitch', name: '避免過度高音', description: '不要整首都在極限音域', value: 'constant high-register belting, strained vocal range, excessive climactic notes' },
    { id: 'no-genre-chaos', name: '避免曲風混亂', description: '保留單一核心語彙', value: 'random genre switching, unrelated stylistic detours, incoherent instrumentation changes' },
    { id: 'no-big-drop', name: '避免 EDM 大 Drop', description: '維持歌曲與敘事導向', value: 'festival EDM drop, aggressive risers, oversized sub impact, abrupt dance breakdown' },
    { id: 'no-fadeout', name: '避免淡出結尾', description: '需要明確收束', value: 'generic fade-out ending, unresolved final cadence, unnecessarily prolonged outro' },
    { id: 'no-adlibs', name: '避免過多 Ad-lib', description: '維持主旋律清楚', value: 'constant vocal ad-libs, excessive runs, competing background vocals, obscured main melody' },
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

export function normalizeGeneratedLyrics(value: string): string {
  let normalized = value.trim();
  const fenced = normalized.match(/^```(?:text|markdown|md)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenced) normalized = fenced[1].trim();
  return normalized.replace(/^(?:最終歌詞|完整歌詞|歌詞|lyrics)\s*[：:]\s*\n?/i, '').trim();
}

export function parseAndReviewLyrics(value: string, arrangement: FlowSection[]): LyricsReview {
  const normalized = normalizeGeneratedLyrics(value);
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
