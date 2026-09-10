/**
 * Suno v6 — 以自然語言音樂意圖為核心的 Style Prompt builder。
 *
 * v6 官方重點是更精準理解 vocals、instrumentation、structure、mood、
 * references 與歌曲整體 feel。此版本沿用既有中文詞彙，改以較完整、具關係的
 * 音樂描述輸出，避免只堆疊彼此割裂的 tags。
 */

import type { SongState } from '../../types';
import type { StyleLayer, SunoVersion } from './types';
import { sunoV5_5 } from './v5_5';

// v6 仍支援既有場景與歷史資料使用的中文鍵；複製映射以保持版本模組獨立。
const GENRES = { ...sunoV5_5.GENRES };
const MOODS = { ...sunoV5_5.MOODS };
const ENERGY = { ...sunoV5_5.ENERGY };
const INSTRUMENTS = { ...sunoV5_5.INSTRUMENTS };
const VOCALS = { ...sunoV5_5.VOCALS };
const TEXTURES = { ...sunoV5_5.TEXTURES };
const NEGATIVES = { ...sunoV5_5.NEGATIVES };
const LANGUAGES = { ...sunoV5_5.LANGUAGES };

/** v6 對整體 feel 與段落連續性理解更好，用自然語言描述音樂流動。 */
const COHESION_KEYWORDS =
  'a cohesive arrangement with natural section-to-section transitions, recurring motifs, and a consistent sonic identity';

function sentence(label: string, values: string[]): string | null {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  return clean.length ? `${label}: ${clean.join(', ')}` : null;
}

/**
 * 依 v6 較強的自然語言理解，把需求整理成「核心方向 → 演奏 → 人聲 → 製作 →
 * 整體 feel」的意圖區塊。結構視圖與最終 Style Prompt 共用同一份資料。
 */
function buildStyleLayers(s: SongState): StyleLayer[] {
  const isInstrumental = s.language === '純樂器(無歌詞)';
  const foundation: string[] = [];
  const genre = GENRES[s.genre] || s.genre;
  const moods = s.moods.map((mood) => MOODS[mood] || mood).filter(Boolean);

  if (genre) foundation.push(genre);
  if (s.bpm) foundation.push(`${s.bpm} BPM`);
  if (s.musicKey) foundation.push(`in ${s.musicKey}`);
  if (s.energy) foundation.push(ENERGY[s.energy] || s.energy);
  foundation.push(...moods);

  const instrumentation = s.instruments
    .map((instrument) => INSTRUMENTS[instrument] || instrument)
    .filter(Boolean);

  const vocals: string[] = [];
  if (isInstrumental) {
    vocals.push('instrumental with no vocals');
  } else if (!s.voiceCloneActive) {
    const language = LANGUAGES[s.language]?.suno;
    if (language) vocals.push(language);
    vocals.push(...s.vocals.map((vocal) => VOCALS[vocal] || vocal).filter(Boolean));
  }

  const production = s.textures
    .map((texture) => TEXTURES[texture] || texture)
    .filter(Boolean);
  const overallFeel = s.cohesion ? [COHESION_KEYWORDS] : [];
  const extra = s.extra.trim()
    ? s.extra
        .split(/[,，]/)
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const exclusions = s.negatives
    .map((negative) => NEGATIVES[negative] || negative)
    .filter(Boolean);

  return [
    {
      label: '🎯 核心方向',
      hint: '曲風、速度、調性、能量與 mood',
      tags: foundation,
    },
    {
      label: '🎸 演奏與編制',
      hint: '主要樂器、音色與演奏方式',
      tags: instrumentation,
    },
    {
      label: '🎤 人聲意圖',
      hint: '語言、音域、音色與演唱方式',
      tags: vocals,
    },
    {
      label: '🎚️ 製作方向',
      hint: '空間、混音、質地與完成度',
      tags: production,
    },
    {
      label: '✨ 整體 Feel',
      hint: '連貫性、段落流動與聲音識別',
      tags: overallFeel,
    },
    { label: '➕ 額外意圖', hint: '場景、畫面或其他自然語言參考', tags: extra },
    { label: '🚫 排除項目', hint: '不希望出現的聲音或製作方式', tags: exclusions },
  ].filter((layer) => layer.tags.length > 0);
}

function buildStylePrompt(s: SongState): string {
  const layers = buildStyleLayers(s);
  const labels: Record<string, string> = {
    '🎯 核心方向': 'Musical direction',
    '🎸 演奏與編制': 'Instrumentation',
    '🎤 人聲意圖': 'Vocals',
    '🎚️ 製作方向': 'Production',
    '✨ 整體 Feel': 'Overall feel',
    '➕ 額外意圖': 'Creative reference',
    '🚫 排除項目': 'Avoid',
  };

  return layers
    .map((layer) => sentence(labels[layer.label] || layer.label, layer.tags))
    .filter((value): value is string => value !== null)
    .join('. ')
    .concat('.');
}

export const sunoV6: SunoVersion = {
  id: 'v6',
  label: 'Suno v6',
  ui: {
    tagline: 'v6 自然語言意圖｜精準控制｜複雜音樂視野',
    foundationHint: 'v6 能綜合理解曲風、tempo、key、mood 與歌曲整體方向',
    instrumentsHint: '描述樂器、音色與演奏方式，v6 會理解它們在編曲中的關係',
    vocalsHint: '描述語言、音色、音域與演唱方式；使用 Voice 時可略過以避免衝突',
    texturesHint: '用空間、混音、質地與完成度描述你想要的製作方向',
    negativesTitle: '🚫 排除項目（選填，保持具體）',
    negativesHint: '只列出真正不希望出現的聲音，讓主要創作意圖維持清楚',
    cohesionTitle: '✨ 整體連貫性',
    cohesionHint: '加入段落流動、重複動機與一致聲音識別的自然語言描述',
  },

  GENRES,
  MOODS,
  ENERGY,
  INSTRUMENTS,
  VOCALS,
  TEXTURES,
  NEGATIVES,
  LANGUAGES,
  COHESION_KEYWORDS,

  // 官方尚未公布新的 Style 欄位硬上限；沿用現有安全上限與精簡建議。
  constraints: {
    maxStyleLength: 1000,
    recommendedTagRange: [8, 18],
    tagWarnThreshold: 24,
  },

  buildStylePrompt,
  buildStyleLayers,

  promptTips: [
    '用完整音樂意圖描述曲風、情緒、演奏、人聲、結構與整體 feel',
    'v6 更能理解音樂人的語言與複合需求，不必只堆疊零散 tags',
    '用具體場景或感受作為原創方向，例如「像午夜屋頂上的風」',
    '清楚交代主要樂器、演奏方式及它們在編曲中的角色',
    '段落標籤與段落描述仍能幫助控制歌曲結構與動態弧線',
    '排除項目保持精簡，只保留真正會破壞創作方向的限制',
    'v6 適合精準成品；v6-wild 適合探索，v6-mini 適合快速草稿',
  ],
};
