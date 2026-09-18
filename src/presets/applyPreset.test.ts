import { describe, expect, it } from 'vitest';
import { createDefaultSongProject } from '../domain';
import { applyV6Preset } from './applyPreset';
import { V6_PRESETS, getV6Preset } from './data';

function activeRevision() {
  return createDefaultSongProject({
    id: 'project',
    revisionId: 'revision',
    now: 100,
    brief: { title: '保留的歌名', theme: '原始主題' },
    constraints: { preserve: ['original hook'] },
    generationTarget: { variant: 'candidate-a' },
  }).revisions[0];
}

describe('v6 preset catalog', () => {
  it('提供七個唯一且可查找的 v6-first presets', () => {
    expect(V6_PRESETS).toHaveLength(7);
    expect(new Set(V6_PRESETS.map((preset) => preset.id)).size).toBe(7);
    expect(getV6Preset('experimental-mashup')?.recommendation).toMatchObject({
      model: 'v6-wild',
      workflow: 'mashup',
    });
  });

  it('每個 preset 都包含 brief、sections、vocal、energy arc 與 model/workflow 建議', () => {
    for (const preset of V6_PRESETS) {
      expect(preset.brief.genre).not.toBe('');
      expect(preset.sections.length).toBeGreaterThan(0);
      expect(preset.vocalDirection.mode).toMatch(/vocal|instrumental/);
      expect(preset.energyArc.stages.length).toBeGreaterThan(0);
      expect(preset.recommendation.model).toMatch(/^v6/);
      expect(preset.recommendation.workflow).not.toBe('');
    }
  });
});

describe('applyV6Preset', () => {
  it('以 pure function 套用方向並保留專案身份欄位', () => {
    const revision = activeRevision();
    const original = structuredClone(revision);
    const preset = getV6Preset('mandarin-cinematic-ballad');
    if (!preset) throw new Error('missing preset');

    const result = applyV6Preset(revision, preset);

    expect(revision).toEqual(original);
    expect(result).not.toBe(revision);
    expect(result.brief.title).toBe('保留的歌名');
    expect(result.brief.genre).toBe(preset.brief.genre);
    expect(result.arrangement.structureName).toBe(preset.name);
    expect(result.arrangement.sections[0]).toEqual({
      id: `preset-${preset.id}-section-1`,
      name: preset.sections[0].tag,
      role: preset.sections[0].description,
      energy: preset.sections[0].energy,
      instrumentation: preset.sections[0].instrumentation.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
      lyrics: preset.sections[0].lyrics,
      locked: false,
    });
    expect(result.vocalIntent).toEqual(preset.vocalDirection);
    expect(result.constraints.avoid).toEqual(preset.avoid);
    expect(result.constraints.preserve).toEqual(['original hook']);
    expect(result.generationTarget).toMatchObject({
      model: preset.recommendation.model,
      workflow: preset.recommendation.workflow,
      variant: 'candidate-a',
    });
  });

  it('產生深層獨立資料，不會回寫 preset 或原始 state', () => {
    const revision = activeRevision();
    const preset = getV6Preset('lofi-instrumental');
    if (!preset) throw new Error('missing preset');

    const result = applyV6Preset(revision, preset);
    result.arrangement.instruments.push('mutation');
    result.brief.moods.push('mutation');
    result.constraints.avoid.push('mutation');

    expect(revision.arrangement.instruments).toEqual([]);
    expect(preset.instruments).not.toContain('mutation');
    expect(preset.brief.moods).not.toContain('mutation');
    expect(preset.avoid).not.toContain('mutation');
    expect(result.vocalIntent).toEqual({ mode: 'instrumental' });
  });
});
