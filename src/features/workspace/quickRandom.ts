import { V6_PRESETS } from '../../presets';
import type { WorkspaceDraft } from './workspaceReducer';

export type RandomnessLevel = 'safe' | 'balanced' | 'wild';

const THEMES = [
  '在陌生城市重新找到自己的方向',
  '一段沒有說出口的告別，在清晨獲得釋懷',
  '把平凡日常變成值得記住的瞬間',
  '穿越失敗後仍選擇再次相信',
  '兩個不同世界的人在短暫相遇後彼此改變',
];
const TWISTS = ['加入半拍留白與突然收束', '第二段改用更私密的視角', '橋段短暫轉為極簡聲景', '最後副歌升級編制但保持克制', '以意外的質感對比製造記憶點'];

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function createQuickRandomDraft(
  current: WorkspaceDraft,
  level: RandomnessLevel = 'balanced',
  seed = Date.now(),
): WorkspaceDraft {
  const random = seeded(seed);
  const preset = V6_PRESETS[Math.floor(random() * V6_PRESETS.length)];
  const theme = THEMES[Math.floor(random() * THEMES.length)];
  const twist = TWISTS[Math.floor(random() * TWISTS.length)];
  const intensity = level === 'safe' ? 0 : level === 'balanced' ? 1 : 2;
  const genreExtras = ['dream pop', 'neo-soul', 'ambient electronica', 'post-rock', 'UK garage'];
  const extraGenre = genreExtras[Math.floor(random() * genreExtras.length)];

  return {
    ...current,
    concept: intensity === 0 ? preset.brief.theme : theme,
    language: preset.brief.language,
    genres: [preset.brief.genre, intensity === 2 ? extraGenre : ''].filter(Boolean).join(', '),
    moods: preset.brief.moods.join(', '),
    instruments: preset.instruments.join(', '),
    vocals: preset.vocalDirection.mode === 'vocal' ? preset.vocalDirection.descriptors.join(', ') : 'instrumental',
    tempo: preset.bpm ? `${preset.bpm + (intensity === 2 ? Math.floor(random() * 17) - 8 : 0)} BPM` : '',
    key: preset.key,
    overallFeel: [preset.brief.additionalDirection, intensity > 0 ? twist : ''].filter(Boolean).join(' '),
    structure: preset.sections.map((section) => section.tag).join(', '),
    sections: preset.sections.map((section, index) => ({
      id: `random-${seed}-${index}`,
      name: section.tag,
      role: section.description,
      energy: section.energy,
      instrumentation: section.instrumentation,
      lyrics: '',
      locked: false,
    })),
    avoid: preset.avoid.join(', '),
    workflow: preset.recommendation.workflow,
    model: level === 'wild' ? 'v6-wild' : preset.recommendation.model,
    exploration: level === 'wild' ? `大膽探索：${twist}` : '',
    scope: '', preserve: '', change: '', sources: current.sources, rightsConfirmed: false,
  };
}
