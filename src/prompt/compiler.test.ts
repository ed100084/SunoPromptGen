import { describe, expect, it } from 'vitest';
import { createDefaultSongProject } from '../domain';
import { compilePrompt } from './compiler';
import type { GenerationModel, GenerationTarget, PromptSong } from './types';

const song: PromptSong = {
  title: 'Neon Tide',
  concept: 'A nocturnal synth-pop song about choosing hope after a difficult year.',
  language: 'English',
  genres: ['synth-pop', 'dream pop'],
  moods: ['hopeful', 'bittersweet'],
  instruments: ['analog synth', 'gated drums'],
  vocals: ['intimate alto'],
  tempo: '112 BPM',
  key: 'A minor',
  structure: ['Intro', 'Verse', 'Chorus', 'Bridge', 'Final Chorus'],
  lyrics: '[Verse]\nThe city learns to breathe again',
  avoid: ['harsh distortion'],
};

const createTarget = (model: GenerationModel): GenerationTarget => ({
  model,
  workflow: 'create',
  song,
});

describe('compilePrompt model strategies', () => {
  it.each([
    ['v6', 'V6 PRECISION BRIEF', 'precision-first'],
    ['v6-wild', 'V6 WILD EXPLORATION BRIEF', 'exploration-first'],
    ['v6-mini', 'V6 MINI DRAFT', 'compact-draft'],
  ] as const)('renders a distinct %s strategy', (model, marker, strategyLabel) => {
    const result = compilePrompt(createTarget(model));

    expect(result.model).toBe(model);
    expect(result.primaryPrompt).toContain(marker);
    expect(result.sections[0]).toEqual({
      id: 'strategy',
      label: 'Model strategy',
      content: `${model}: ${strategyLabel}`,
    });
  });

  it('keeps v6 precise, v6-wild exploratory, and v6-mini compact', () => {
    const precise = compilePrompt(createTarget('v6'));
    const wild = compilePrompt(createTarget('v6-wild'));
    const mini = compilePrompt(createTarget('v6-mini'));

    expect(precise.primaryPrompt).toContain('hierarchy explicit');
    expect(wild.primaryPrompt).toContain('surprising genre collisions');
    expect(mini.primaryPrompt).toContain(' | ');
    expect(mini.primaryPrompt.length).toBeLessThan(precise.primaryPrompt.length);
    expect(new Set([precise.stylePrompt, wild.stylePrompt, mini.stylePrompt]).size).toBe(3);
  });
});

describe('canonical domain adapter', () => {
  it('直接接受 Revision 並以 canonical target、brief、arrangement 與 constraints 編譯', () => {
    const project = createDefaultSongProject({
      id: 'project',
      revisionId: 'revision',
      now: 1,
      brief: {
        title: 'Canonical Song',
        language: '繁體中文',
        genre: 'dream pop',
        moods: ['warm'],
        theme: '雨後重新出發',
      },
      arrangement: {
        bpm: 96,
        key: 'D major',
        instruments: ['piano'],
        sections: [{ tag: 'Chorus', description: '', lyrics: '天亮以後繼續走' }],
      },
      vocalIntent: { mode: 'vocal', descriptors: ['intimate alto'], useVoiceClone: false },
      constraints: { avoid: ['harsh distortion'] },
      generationTarget: { model: 'v6-wild', workflow: 'explore', variant: 'three arrangements' },
    });

    const result = compilePrompt(project.revisions[0]);

    expect(result).toMatchObject({
      title: 'Canonical Song',
      model: 'v6-wild',
      workflow: 'explore',
      lyricsPrompt: '天亮以後繼續走',
    });
    expect(result.primaryPrompt).toContain('雨後重新出發');
    expect(result.primaryPrompt).toContain('Exploration axis: three arrangements');
    expect(result.stylePrompt).toContain('intimate alto');
  });

  it('instrumental intent 不會產生 vocal descriptors', () => {
    const project = createDefaultSongProject({
      id: 'project', revisionId: 'revision', now: 1, vocalIntent: { mode: 'instrumental' },
    });
    expect(compilePrompt(project.revisions[0]).stylePrompt).toBeUndefined();
  });
});

describe('compilePrompt output contract', () => {
  it('returns title, prompts, warnings, and ordered sections', () => {
    const result = compilePrompt(createTarget('v6'));

    expect(result).toMatchObject({
      title: 'Neon Tide',
      model: 'v6',
      workflow: 'create',
      warnings: [],
      lyricsPrompt: song.lyrics,
    });
    expect(result.primaryPrompt).toContain(song.concept);
    expect(result.stylePrompt).toContain('synth-pop');
    expect(result.sections.map((section) => section.id)).toEqual([
      'strategy',
      'workflow',
      'intent',
      'style',
      'lyrics',
    ]);
  });

  it('omits optional style and lyrics prompts when no material exists', () => {
    const result = compilePrompt({
      model: 'v6-mini',
      workflow: 'create',
      song: { concept: 'Solo field recording.' },
    });

    expect(result.stylePrompt).toBeUndefined();
    expect(result.lyricsPrompt).toBeUndefined();
    expect(result.sections.map((section) => section.id)).toEqual(['strategy', 'workflow', 'intent']);
  });

  it('never claims to call or submit directly to Suno', () => {
    const serialized = JSON.stringify(compilePrompt(createTarget('v6'))).toLowerCase();
    expect(serialized).not.toMatch(/call(?:ing)? suno|submit(?:ting)? to suno|directly (?:uses|calls) suno/);
  });
});

describe('compilePrompt workflows', () => {
  it('renders create workflow', () => {
    const result = compilePrompt(createTarget('v6'));
    expect(result.workflow).toBe('create');
    expect(result.primaryPrompt).toContain('create a new complete song concept');
  });

  it('renders explore workflow and recommends v6-wild for non-wild models', () => {
    const result = compilePrompt({
      model: 'v6',
      workflow: 'explore',
      exploration: 'three contrasting drum and harmony treatments',
      song,
    });

    expect(result.primaryPrompt).toContain('three contrasting drum and harmony treatments');
    expect(result.warnings).toContain(
      'Explore works with this model, but v6-wild provides the broadest variation strategy.',
    );
  });

  it('does not warn when explore uses v6-wild', () => {
    const result = compilePrompt({ model: 'v6-wild', workflow: 'explore', song });
    expect(result.warnings).toEqual([]);
  });

  it.each([
    ['edit-section', 'section'],
    ['edit-lyrics', 'lyrics'],
  ] as const)('expresses preserve/change/scope for %s', (workflow, kind) => {
    const result = compilePrompt({
      model: 'v6',
      workflow,
      song,
      edit: {
        scope: workflow === 'edit-section' ? 'Bridge, bars 49–56' : 'Verse 2, lines 3–6',
        preserve: ['lead vocal identity', 'rhyme scheme'],
        change: ['increase tension', 'replace weather imagery'],
      },
    });

    expect(result.primaryPrompt).toContain(`Edit ${kind} scope:`);
    expect(result.primaryPrompt).toContain('Preserve: lead vocal identity; rhyme scheme');
    expect(result.primaryPrompt).toContain('Change: increase tension; replace weather imagery');
    expect(result.primaryPrompt).toContain('treat preserve items as invariants');
  });

  it('warns when edit directives are incomplete', () => {
    const result = compilePrompt({
      model: 'v6-mini',
      workflow: 'edit-section',
      song,
      edit: { scope: '', preserve: [], change: [] },
    });

    expect(result.warnings).toEqual([
      'Edit scope is empty.',
      'Edit preserve list is empty.',
      'Edit change list is empty.',
    ]);
  });

  it('expresses every mashup source role and time range', () => {
    const result = compilePrompt({
      model: 'v6-wild',
      workflow: 'mashup',
      song,
      sources: [
        {
          name: 'Source A',
          role: 'rhythmic bed',
          timeRange: { start: '00:12', end: '00:28' },
          description: 'syncopated drums',
        },
        {
          name: 'Source B',
          role: 'chorus vocal hook',
          timeRange: { start: '01:04', end: '01:19' },
        },
      ],
    });

    expect(result.primaryPrompt).toContain('Source 1: Source A');
    expect(result.primaryPrompt).toContain('Role: rhythmic bed');
    expect(result.primaryPrompt).toContain('Time range: 00:12–00:28');
    expect(result.primaryPrompt).toContain('Source 2: Source B');
    expect(result.primaryPrompt).toContain('Role: chorus vocal hook');
    expect(result.primaryPrompt).toContain('Time range: 01:04–01:19');
    expect(result.warnings).toEqual([]);
  });

  it('warns when mashup lacks multiple complete sources', () => {
    const result = compilePrompt({
      model: 'v6',
      workflow: 'mashup',
      song,
      sources: [{ name: '', role: '', timeRange: { start: '', end: '' } }],
    });

    expect(result.warnings).toEqual([
      'Mashup should define at least two sources.',
      'Mashup source 1 name is empty.',
      'Mashup source 1 role is empty.',
      'Mashup source 1 time range is incomplete.',
    ]);
  });

  it('expresses sample source role and selected time range', () => {
    const result = compilePrompt({
      model: 'v6-mini',
      workflow: 'sample',
      song,
      source: {
        name: 'Tape Loop 7',
        role: 'intro texture and recurring transition motif',
        timeRange: { start: '00:08.500', end: '00:14.250' },
      },
    });

    expect(result.primaryPrompt).toContain('Source: Tape Loop 7');
    expect(result.primaryPrompt).toContain('Role: intro texture and recurring transition motif');
    expect(result.primaryPrompt).toContain('Time range: 00:08.500–00:14.250');
    expect(result.primaryPrompt).toContain('Use only the identified time range');
  });
});

describe('compilePrompt warnings', () => {
  it('warns for an empty concept and long v6-mini structures', () => {
    const result = compilePrompt({
      model: 'v6-mini',
      workflow: 'create',
      song: {
        concept: ' ',
        structure: ['Intro', 'Verse 1', 'Pre', 'Chorus', 'Verse 2', 'Bridge', 'Solo', 'Outro'],
      },
    });

    expect(result.title).toBe('Untitled prompt');
    expect(result.warnings).toContain('Song concept is empty.');
    expect(result.warnings).toContain(
      'v6-mini compresses long structures; use v6 when every section must be controlled precisely.',
    );
  });
});
