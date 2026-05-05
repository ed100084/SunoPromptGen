/**
 * Suno v5.5 — 詞彙、四層架構 builder、限制、心法。
 *
 * 此檔案是 v5.5 的「真理之源」。data.ts 從這裡 re-export 以維持向後相容。
 */

import type { LanguageInfo, SongState } from '../../types';
import type { StyleLayer, SunoVersion } from './types';

// ───────── Vocab ─────────

const GENRES: Record<string, string> = {
  '華語抒情': 'mandarin emotional ballad, cinematic pop',
  '華語流行': 'mandarin contemporary pop',
  '華語搖滾': 'mandarin alternative rock',
  '華語民謠': 'mandarin indie folk',
  '華語嘻哈': 'mandarin hip hop, modern trap',
  '古風中國風': 'chinese traditional fusion, modern arrangement',
  'City Pop': 'japanese city pop, 80s funk-influenced',
  'Synthwave': 'synthwave, retro-futuristic 80s',
  'Lo-fi Hip Hop': 'lo-fi hip hop, jazzy chill beats',
  'Indie Pop': 'indie pop, dreamy jangly guitars',
  'Indie Folk': 'indie folk, intimate storytelling',
  'Dream Pop': 'dream pop, shoegaze textures',
  'K-Pop': 'k-pop, glossy hyper-pop production',
  'R&B / Soul': 'modern r&b, neo-soul',
  'Cinematic': 'cinematic orchestral score, epic',
  'Ambient': 'ambient, atmospheric soundscape',
  'EDM': 'festival EDM, big-room drop',
  'House': 'deep house, four-on-the-floor groove',
  'Bossa Nova': 'bossa nova, brazilian jazz',
  'Acoustic': 'acoustic singer-songwriter, intimate',
  'Pop Punk': 'pop punk, energetic distorted guitars',
  'Funk': 'funk, slap bass, tight horns',
};

const MOODS: Record<string, string> = {
  '溫暖': 'warm',
  '悲傷': 'melancholic, bittersweet',
  '勵志': 'uplifting, inspiring',
  '懷舊': 'nostalgic',
  '浪漫': 'romantic, tender',
  '希望': 'hopeful, optimistic',
  '孤獨': 'lonely, introspective',
  '憤怒': 'angry, intense',
  '平靜': 'calm, peaceful',
  '夢幻': 'dreamy, ethereal',
  '活力': 'energetic, vibrant',
  '莊重': 'solemn, dignified',
  '歡樂': 'joyful, cheerful',
  '深情': 'heartfelt, emotional',
  '神祕': 'mysterious, dark',
  '緊張': 'tense, suspenseful',
};

const ENERGY: Record<string, string> = {
  '極低（冥想/環境）': 'very low energy, ambient, meditative',
  '低（抒情/沉思）': 'low energy, intimate',
  '中（穩定流動）': 'medium energy, steady groove',
  '中高（有推進感）': 'medium-high energy, driving rhythm',
  '高（動感/燃）': 'high energy, anthemic',
  '極高（爆發/嗨）': 'very high energy, explosive',
};

const INSTRUMENTS: Record<string, string> = {
  '暖音鋼琴': 'warm piano',
  '氈式鋼琴(Felt Piano)': 'felt piano, intimate',
  '指彈原聲吉他': 'fingerpicked acoustic guitar',
  '刷弦原聲吉他': 'strummed acoustic guitar',
  '破音電吉他': 'overdriven electric guitar',
  '清音電吉他': 'clean electric guitar, chorus effect',
  '立式低音貝斯': 'warm upright bass',
  '電貝斯': 'electric bass, groovy',
  '808 Sub Bass': '808 sub bass',
  '刷扣鼓組': 'brushed drums',
  '緊湊鼓組': 'tight drum kit',
  '電子鼓': 'punchy electronic drums',
  '鼓機': 'drum machine',
  '弦樂': 'lush strings',
  '弦樂四重奏': 'string quartet',
  '管弦樂團': 'full orchestra, cinematic swells',
  '復古合成器': 'vintage analog synth, slightly detuned',
  '氛圍墊音': 'lush atmospheric pads',
  '電影感效果': 'cinematic risers and impacts',
  '二胡': 'erhu, expressive',
  '古箏': 'guzheng, plucked',
  '竹笛': 'chinese bamboo flute',
  '薩克斯風': 'smooth saxophone',
  '小號': 'muted trumpet',
  '管風琴': 'hammond organ',
  '音樂盒': 'music box, celesta',
  '口琴': 'harmonica',
  '烏克麗麗': 'ukulele, bright',
  '黑膠鼓點': 'dusty boom-bap drums',
};

const VOCALS: Record<string, string> = {
  '女聲(柔/氣音)': 'soft female vocals, breathy delivery',
  '女聲(高亢)': 'powerful female vocals, soaring belt',
  '女聲(中音/磁性)': 'smoky female alto, intimate',
  '男聲(低沉/磁性)': 'deep male baritone vocals',
  '男聲(清亮/抒情)': 'clear male tenor vocals, emotive',
  '男聲(沙啞)': 'raspy male vocals',
  '童聲合唱': "children's choir, innocent harmonies",
  '雙人對唱': 'male and female duet',
  '豐富和聲': 'rich layered backing harmonies',
  '全合唱團': 'full choir, anthemic',
  '饒舌': 'rap verses, flow-driven',
  '低語': 'intimate whisper vocals',
  '純音樂': 'instrumental, no vocals',
};

const TEXTURES: Record<string, string> = {
  '電影感製作': 'cinematic production',
  '復古類比': 'vintage analog warmth, tape saturation',
  '現代亮麗': 'polished modern production',
  'Lo-fi 質感': 'lo-fi texture, vinyl crackle',
  '氛圍空間': 'atmospheric, spacious reverb',
  '緊湊乾淨': 'tight dry mix',
  '大編制層次': 'epic layered arrangement',
  '極簡編制': 'minimal arrangement, sparse',
  '貼耳近距收音': 'close-mic intimacy',
  '板式殘響': 'subtle plate reverb',
  '房間感': 'warm room ambience',
  '膠帶失真': 'tape distortion, lo-fi grit',
  '顆粒紋理': 'gritty texture, sandy',
  '原始情感核心': 'raw emotional core',
};

const NEGATIVES: Record<string, string> = {
  '無 Autotune': 'no autotune',
  '無過度修音': 'no over-processing',
  '無合成器': 'no synths',
  '無鼓機': 'no drum machines',
  '無電子節拍': 'no electronic beats',
  '無大量殘響': 'no reverb wash',
  '無弦樂': 'no strings',
  '無人聲': 'no vocals',
  '無和聲': 'no backing vocals',
  '無破音': 'no distortion',
  '無饒舌': 'no rap',
  '無管樂': 'no horns',
  '無電吉他': 'no electric guitar',
  '無壓縮過度': 'no over-compression',
  '無爵士元素': 'no jazz elements',
  '無 EDM Drop': 'no EDM drop',
};

const COHESION_KEYWORDS =
  'seamless transitions, cohesive arrangement, consistent groove throughout, flowing dynamics';

const LANGUAGES: Record<string, LanguageInfo> = {
  '華語(繁體)': { suno: 'mandarin chinese vocals', llm: '繁體中文（台灣用語）' },
  '華語(簡體)': { suno: 'mandarin chinese vocals', llm: '簡體中文' },
  '台語': { suno: 'taiwanese hokkien vocals', llm: '台語（漢字書寫）' },
  '粵語': { suno: 'cantonese vocals', llm: '粵語（廣東話）' },
  '英文': { suno: 'english vocals', llm: 'English' },
  '日文': { suno: 'japanese vocals', llm: '日文（漢字＋假名）' },
  '韓文': { suno: 'korean vocals', llm: '한국어 (Korean)' },
  '西班牙文': { suno: 'spanish vocals', llm: 'Español (Spanish)' },
  '中英混合': {
    suno: 'mandarin and english bilingual vocals',
    llm: '中文為主、副歌穿插英文',
  },
  '純樂器(無歌詞)': { suno: 'instrumental, no vocals', llm: '（無，純樂器）' },
};

// ───────── Builder（v5.5 四層架構） ─────────

/**
 * 產生結構化的層級資料。buildStylePrompt 把這個結果攤平成字串；
 * UI 也可直接渲染分層視圖。
 */
function buildStyleLayers(s: SongState): StyleLayer[] {
  const isInstrumental = s.language === '純樂器(無歌詞)';
  const langKw = LANGUAGES[s.language]?.suno || '';

  // Layer 1: tempo + key + 曲風 + 能量強度 + 情緒
  const layer1: string[] = [];
  if (s.genre) layer1.push(GENRES[s.genre] || s.genre);
  if (s.bpm) layer1.push(`${s.bpm} BPM`);
  if (s.musicKey) layer1.push(`key of ${s.musicKey}`);
  if (s.energy) layer1.push(ENERGY[s.energy] || s.energy);
  if (s.moods.length) {
    const moodTags = s.moods.map((m) => MOODS[m]).filter(Boolean);
    if (moodTags.length) layer1.push(moodTags.join(', '));
  }

  // Layer 2: 樂器配置
  const layer2 = s.instruments.map((i) => INSTRUMENTS[i]).filter(Boolean);

  // Layer 3: 人聲方向（Voice Clone 啟用時略過）
  const layer3: string[] = [];
  if (isInstrumental) {
    layer3.push('instrumental, no vocals');
  } else if (!s.voiceCloneActive) {
    if (langKw) layer3.push(langKw);
    layer3.push(...s.vocals.map((v) => VOCALS[v]).filter(Boolean));
  }

  // Layer 4: 製作紋理
  const layer4 = s.textures.map((t) => TEXTURES[t]).filter(Boolean);

  // 連貫性
  const cohesion = s.cohesion ? [COHESION_KEYWORDS] : [];

  // 額外關鍵字（使用者自由填寫）
  const extra = s.extra.trim()
    ? s.extra
        .split(/[,，]/)
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  // Negatives
  const negs = s.negatives.map((n) => NEGATIVES[n]).filter(Boolean);

  const layers: StyleLayer[] = [
    { label: '🎼 Layer 1', hint: '基本骨架（曲風 / 速度 / 調性 / 能量 / 情緒）', tags: layer1 },
    { label: '🎸 Layer 2', hint: '樂器配置', tags: layer2 },
    { label: '🎤 Layer 3', hint: '人聲方向', tags: layer3 },
    { label: '🎚️ Layer 4', hint: '製作風格 / 紋理', tags: layer4 },
    { label: '✨ 連貫性', hint: '抗切割感關鍵字', tags: cohesion },
    { label: '➕ 額外', hint: '使用者自訂', tags: extra },
    { label: '🚫 Negatives', hint: '反向約束', tags: negs },
  ];

  // 過濾空層
  return layers.filter((l) => l.tags.length > 0);
}

function buildStylePrompt(s: SongState): string {
  return buildStyleLayers(s)
    .map((l) => l.tags.join(', '))
    .filter(Boolean)
    .join(', ');
}

// ───────── Export ─────────

export const sunoV5_5: SunoVersion = {
  id: 'v5.5',
  label: 'Suno v5.5',

  GENRES,
  MOODS,
  ENERGY,
  INSTRUMENTS,
  VOCALS,
  TEXTURES,
  NEGATIVES,
  LANGUAGES,
  COHESION_KEYWORDS,

  constraints: {
    maxStyleLength: 1000,
    recommendedTagRange: [8, 15],
    tagWarnThreshold: 20,
  },

  buildStylePrompt,
  buildStyleLayers,

  promptTips: [
    '四層架構：Tempo+Key → 樂器 → 人聲 → 製作紋理',
    'Negative Prompt 必加：no autotune / no synths 等',
    '具體形容詞：fingerpicked guitar 比 guitar 強',
    'Style 控制 1000 字內，tag 8-15 個',
    'Subgenre > 廣義 Genre',
    '啟用 Voice Clone 時略過人聲描述',
    '歌詞段落 [tag] 用英文，內容可用中文',
  ],
};
