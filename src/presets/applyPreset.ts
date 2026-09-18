import type { PresetApplicableState, V6Preset } from './types';

/**
 * Applies a preset without mutating either input.
 * The existing title is preserved because presets describe a direction, not a project identity.
 */
export function applyV6Preset<T extends PresetApplicableState>(state: T, preset: V6Preset): T {
  return {
    ...structuredClone(state),
    brief: {
      ...structuredClone(state.brief),
      ...structuredClone(preset.brief),
      title: state.brief.title,
    },
    arrangement: {
      ...structuredClone(state.arrangement),
      bpm: preset.bpm,
      key: preset.key,
      structureName: preset.name,
      sections: preset.sections.map((section, index) => ({
        id: `preset-${preset.id}-section-${index + 1}`,
        name: section.tag,
        role: section.description,
        energy: section.energy,
        instrumentation: section.instrumentation.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
        lyrics: section.lyrics,
        locked: false,
      })),
      instruments: [...preset.instruments],
      textures: [...preset.textures],
    },
    vocalIntent: structuredClone(preset.vocalDirection),
    constraints: {
      ...structuredClone(state.constraints),
      avoid: [...preset.avoid],
    },
    generationTarget: {
      ...structuredClone(state.generationTarget),
      model: preset.recommendation.model,
      workflow: preset.recommendation.workflow,
    },
  };
}
