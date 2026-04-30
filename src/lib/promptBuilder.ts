import {
  GENRES,
  MOODS,
  ENERGY,
  INSTRUMENTS,
  VOCALS,
  TEXTURES,
  NEGATIVES,
  LANGUAGES,
  COHESION_KEYWORDS,
} from '../data';
import type { Section, SongState } from '../types';

export function buildStylePrompt(s: SongState): string {
  const isInstrumental = s.language === '純樂器(無歌詞)';
  const langKw = LANGUAGES[s.language]?.suno || '';

  const layer1: string[] = [];
  if (s.genre) layer1.push(GENRES[s.genre] || s.genre);
  if (s.bpm) layer1.push(`${s.bpm} BPM`);
  if (s.musicKey) layer1.push(`key of ${s.musicKey}`);
  if (s.energy) layer1.push(ENERGY[s.energy] || s.energy);
  if (s.moods.length)
    layer1.push(s.moods.map((m) => MOODS[m]).filter(Boolean).join(', '));

  const layer2 = s.instruments
    .map((i) => INSTRUMENTS[i])
    .filter(Boolean)
    .join(', ');

  let layer3 = '';
  if (isInstrumental) {
    layer3 = 'instrumental, no vocals';
  } else if (!s.voiceCloneActive) {
    const vocalParts = [langKw, ...s.vocals.map((v) => VOCALS[v]).filter(Boolean)];
    layer3 = vocalParts.filter(Boolean).join(', ');
  }

  const layer4 = s.textures
    .map((t) => TEXTURES[t])
    .filter(Boolean)
    .join(', ');

  const negPart = s.negatives
    .map((n) => NEGATIVES[n])
    .filter(Boolean)
    .join(', ');

  const cohesionPart = s.cohesion ? COHESION_KEYWORDS : '';

  return [layer1.join(', '), layer2, layer3, layer4, cohesionPart, s.extra, negPart]
    .filter(Boolean)
    .join(', ');
}

export function buildLyricsPrompt(sections: Section[]): string {
  return sections
    .map((s) => {
      const tagLine = s.desc ? `[${s.tag} - ${s.desc}]` : `[${s.tag}]`;
      const body = s.lyrics.trim() || '(instrumental)';
      return `${tagLine}\n${body}`;
    })
    .join('\n\n');
}

export function buildFullPrompt(state: SongState, stylePrompt: string, lyricsPrompt: string): string {
  const t = state.songTitle ? `Title: ${state.songTitle}\n\n` : '';
  return `${t}--- STYLE ---\n${stylePrompt}\n\n--- LYRICS ---\n${lyricsPrompt}`;
}

export function buildLlmRequestPrompt(state: SongState, stylePrompt: string): string {
  const sectionList = state.sections
    .map((s) => `- [${s.tag}]${s.desc ? ` (${s.desc})` : ''}`)
    .join('\n');
  const kwList = state.lyricsKeywords
    .split(/[,，、]/)
    .map((k) => k.trim())
    .filter(Boolean);
  const moodTxt = state.moods.join('、');
  const langInfo = LANGUAGES[state.language]?.llm || '繁體中文';
  const isInstrumental = state.language === '純樂器(無歌詞)';

  if (isInstrumental) {
    return `這是一首純樂器作品，無歌詞。請回傳所有段落 lyrics 為空字串。

【段落結構】
${sectionList}

【回傳格式】嚴格回傳下列 JSON，不要 markdown code fence、不要其他文字：
{
  "sections": [
    {"tag": "段落標籤", "lyrics": ""},
    ...
  ]
}`;
  }

  return `你是一位專業歌詞作詞家。請依下列設定，創作一首完整歌詞。

【創作語言】${langInfo}
（請使用此語言完成所有歌詞，不要混用其他語言，除非語言設定特別指明）

【歌曲風格】
${stylePrompt}

【歌曲主題】
${state.lyricsTheme || '（自由發揮）'}

【關鍵字】
${kwList.length ? kwList.join('、') : '（無）'}

【故事背景】
${state.lyricsStory || '（無）'}

【情緒基調】
${moodTxt || '（依風格自由發揮）'}

【段落結構】請依下列段落順序創作，每段需配合段落特性（如 Verse 鋪陳敘事、Chorus 情感高峰、Bridge 轉折昇華）：
${sectionList}

【創作原則】
1. 用詞自然真摯，避免陳腔濫調與政治宗教敏感字眼
2. 副歌（Chorus）需有強記憶點，重複段落歌詞可一致
3. 每行字數均衡（依語言調整）：中文 7-12 字、英文 6-10 syllables 為佳
4. 留意押韻（ABAB 或 AABB）
5. Bridge 段需與主副歌情感對比或情緒昇華
6. 純樂器段（如 Intro / Outro / Solo）lyrics 欄位請回傳空字串 ""
7. 嚴格使用指定的【創作語言】，不要自行翻譯為其他語言

【回傳格式】嚴格回傳下列 JSON，不要 markdown code fence、不要其他文字、不要解釋：
{
  "sections": [
    {"tag": "段落標籤需與上方完全一致", "lyrics": "歌詞內容，換行用 \\n"},
    ...
  ]
}`;
}

export function parseLlmResponse(text: string): { sections: Array<{ tag: string; lyrics: string }> } {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('找不到 JSON 內容');
  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed.sections)) throw new Error('JSON 缺少 sections 陣列');
  return parsed;
}
