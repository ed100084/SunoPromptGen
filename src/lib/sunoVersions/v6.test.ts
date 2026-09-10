import { describe, expect, it } from 'vitest';
import type { SongState } from '../../types';
import { sunoV6 } from './v6';

const baseState: SongState = {
  songTitle: '',
  language: '華語(繁體)',
  genre: '華語抒情',
  moods: ['溫暖'],
  energy: '中（穩定流動）',
  instruments: ['暖音鋼琴'],
  vocals: ['女聲(柔/氣音)'],
  textures: ['電影感製作'],
  negatives: [],
  bpm: '75',
  musicKey: 'C major',
  extra: '',
  cohesion: false,
  voiceCloneActive: false,
  structureName: '',
  sections: [],
  lyricsTheme: '',
  lyricsKeywords: '',
  lyricsStory: '',
};

describe('sunoV6 metadata', () => {
  it('提供 v6 識別、UI 文案與完整 vocab', () => {
    expect(sunoV6.id).toBe('v6');
    expect(sunoV6.label).toBe('Suno v6');
    expect(sunoV6.ui.tagline).toContain('自然語言');
    expect(Object.keys(sunoV6.GENRES).length).toBeGreaterThan(10);
    expect(Object.keys(sunoV6.INSTRUMENTS).length).toBeGreaterThan(20);
  });

  it('使用精簡但較寬裕的意圖建議範圍', () => {
    expect(sunoV6.constraints.maxStyleLength).toBe(1000);
    expect(sunoV6.constraints.recommendedTagRange).toEqual([8, 18]);
  });
});

describe('sunoV6.buildStylePrompt', () => {
  it('輸出帶語意標題的自然語言意圖區塊', () => {
    const output = sunoV6.buildStylePrompt(baseState);
    expect(output).toContain('Musical direction:');
    expect(output).toContain('75 BPM');
    expect(output).toContain('in C major');
    expect(output).toContain('Instrumentation: warm piano');
    expect(output).toContain('Vocals: mandarin chinese vocals');
    expect(output).toContain('Production: cinematic production');
  });

  it('加入整體 feel 與自然段落流動描述', () => {
    const output = sunoV6.buildStylePrompt({ ...baseState, cohesion: true });
    expect(output).toContain('Overall feel:');
    expect(output).toContain('natural section-to-section transitions');
    expect(output).toContain('recurring motifs');
  });

  it('純樂器模式不輸出指定歌手聲線', () => {
    const output = sunoV6.buildStylePrompt({
      ...baseState,
      language: '純樂器(無歌詞)',
      vocals: ['女聲(柔/氣音)'],
    });
    expect(output).toContain('instrumental with no vocals');
    expect(output).not.toContain('soft female vocals');
  });

  it('使用 Voice 時略過人聲描述', () => {
    const output = sunoV6.buildStylePrompt({ ...baseState, voiceCloneActive: true });
    expect(output).not.toContain('Vocals:');
    expect(output).not.toContain('soft female vocals');
  });

  it('保留創意參考與具體排除項目', () => {
    const output = sunoV6.buildStylePrompt({
      ...baseState,
      extra: 'midnight on a rooftop, neon reflections',
      negatives: ['無 Autotune'],
    });
    expect(output).toContain('Creative reference: midnight on a rooftop, neon reflections');
    expect(output).toContain('Avoid: no autotune');
  });

  it('結構視圖依 v6 意圖分類', () => {
    const labels = sunoV6
      .buildStyleLayers({ ...baseState, cohesion: true })
      .map((layer) => layer.label);
    expect(labels).toEqual([
      '🎯 核心方向',
      '🎸 演奏與編制',
      '🎤 人聲意圖',
      '🎚️ 製作方向',
      '✨ 整體 Feel',
    ]);
  });

  it('可用額外意圖引導 v6-wild 類型的探索', () => {
    const output = sunoV6.buildStylePrompt({
      ...baseState,
      genre: 'EDM',
      energy: '極高（爆發/嗨）',
      extra: 'unpredictable switch-up, ambitious yet coherent arrangement',
      negatives: [],
    });
    expect(output).toContain('Musical direction: festival EDM');
    expect(output).toContain('very high energy');
    expect(output).toContain('explosive');
    expect(output).toContain(
      'Creative reference: unpredictable switch-up, ambitious yet coherent arrangement',
    );
  });
});
