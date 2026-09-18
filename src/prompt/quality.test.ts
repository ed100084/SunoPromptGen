import { describe, expect, it } from 'vitest';
import { createDefaultSongProject } from '../domain';
import { compilePrompt } from './compiler';
import {
  checkPromptQuality,
  PROMPT_QUALITY_HEURISTICS_DISCLAIMER,
  type PromptQualityIssueCode,
} from './quality';
import type { GenerationTarget, PromptSong } from './types';

const concreteSong: PromptSong = {
  concept: 'A tense night-drive song about leaving a flooded city before dawn.',
  genres: ['synth-pop'],
  moods: ['urgent'],
  instruments: ['analog synth', 'dry drum machine'],
  vocals: ['restrained alto'],
  tempo: '112 BPM',
  structure: ['Intro', 'Verse', 'Chorus'],
};

const create = (song: PromptSong = concreteSong): GenerationTarget => ({
  model: 'v6',
  workflow: 'create',
  song,
});

const codes = (target: GenerationTarget): PromptQualityIssueCode[] =>
  checkPromptQuality(target).map((result) => result.code);

const issueMessages = (target: GenerationTarget): string[] =>
  checkPromptQuality(target).map((result) => result.message);

describe('checkPromptQuality product heuristic contract', () => {
  it('is deterministic, side-effect free, and labels every result as a non-official product heuristic', () => {
    const target = create({ concept: 'dreamy vibes' });
    const snapshot = structuredClone(target);

    const first = checkPromptQuality(target);
    const second = checkPromptQuality(target);

    expect(first).toEqual(second);
    expect(target).toEqual(snapshot);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((result) => result.provenance === 'product-heuristic')).toBe(true);
    expect(first.every((result) => result.severity === 'warning')).toBe(true);
    expect(first.every((result) => result.message.startsWith(PROMPT_QUALITY_HEURISTICS_DISCLAIMER))).toBe(true);
    expect(PROMPT_QUALITY_HEURISTICS_DISCLAIMER).toContain('not an official Suno specification');
  });

  it('returns no quality issues for a concrete, internally consistent prompt', () => {
    expect(checkPromptQuality(create())).toEqual([]);
  });
});

describe('checkPromptQuality requested heuristics', () => {
  it('detects an empty compatibility brief', () => {
    expect(codes(create({ concept: '   ' }))).toContain('empty-brief');
  });

  it('detects a fully empty canonical CreativeBrief even when non-brief fields exist', () => {
    const revision = createDefaultSongProject({
      now: 1,
      arrangement: { bpm: 120, instruments: ['piano'] },
    }).revisions[0];

    expect(checkPromptQuality(revision).map((result) => result.code)).toContain('empty-brief');
  });

  it('does not call a title-only canonical brief empty', () => {
    const revision = createDefaultSongProject({ now: 1, brief: { title: 'Untold' } }).revisions[0];
    expect(checkPromptQuality(revision).map((result) => result.code)).not.toContain('empty-brief');
  });

  it('detects vocal versus instrumental conflicts when explicit text makes detection possible', () => {
    expect(codes(create({
      concept: 'Instrumental cinematic cue with no vocals.',
      vocals: ['intimate female vocal'],
    }))).toContain('vocal-instrumental-conflict');
  });

  it('uses canonical instrumental mode when checking vocal conflicts', () => {
    const revision = createDefaultSongProject({
      now: 1,
      brief: { theme: 'A wordless journey' },
      vocalIntent: { mode: 'instrumental' },
      constraints: { notes: 'Add a choir vocal in the final chorus.' },
    }).revisions[0];

    expect(checkPromptQuality(revision).map((result) => result.code)).toContain('vocal-instrumental-conflict');
  });

  it.each([
    ['multiple BPM values', { concept: 'Start at 80 BPM, then stay at 140 BPM.', tempo: '80 BPM' }],
    ['opposed verbal tempo directions', { concept: 'Both slow and fast throughout.' }],
  ])('detects tempo conflict from %s', (_label, song) => {
    expect(codes(create(song))).toContain('tempo-conflict');
  });

  it('does not treat one tempo value as a conflict', () => {
    expect(codes(create({ concept: 'Driving night music.', tempo: '128 BPM' }))).not.toContain('tempo-conflict');
  });

  it('detects missing edit scope', () => {
    const target: GenerationTarget = {
      model: 'v6', workflow: 'edit-section', song: concreteSong,
      edit: { scope: ' ', preserve: ['lead melody'], change: ['drums'] },
    };
    expect(codes(target)).toContain('edit-scope-missing');
  });

  it('detects normalized and containment-based preserve/change overlap', () => {
    const target: GenerationTarget = {
      model: 'v6', workflow: 'edit-lyrics', song: concreteSong,
      edit: {
        scope: 'Verse 2',
        preserve: ['Lead Vocal Identity', 'rhyme scheme'],
        change: ['lead vocal identity and phrasing', 'imagery'],
      },
    };
    expect(codes(target)).toContain('preserve-change-overlap');
    expect(issueMessages(target).join(' ')).toContain('Lead Vocal Identity');
  });

  it('does not report unrelated preserve/change instructions', () => {
    const target: GenerationTarget = {
      model: 'v6', workflow: 'edit-lyrics', song: concreteSong,
      edit: { scope: 'Verse 2', preserve: ['rhyme scheme'], change: ['weather imagery'] },
    };
    expect(codes(target)).not.toContain('preserve-change-overlap');
  });

  it('reports each mashup source with no assigned role', () => {
    const target: GenerationTarget = {
      model: 'v6-wild', workflow: 'mashup', song: concreteSong,
      sources: [
        { name: 'A', role: '', timeRange: { start: '00:00', end: '00:10' } },
        { name: 'B', role: 'vocal hook', timeRange: { start: '00:10', end: '00:20' } },
        { name: 'C', role: ' ', timeRange: { start: '00:20', end: '00:30' } },
      ],
    };
    const issues = checkPromptQuality(target).filter((result) => result.code === 'mashup-source-role-missing');
    expect(issues).toHaveLength(2);
    expect(issues.map((result) => result.message).join(' ')).toMatch(/source 1.*source 3/i);
  });

  it.each([
    [{ start: '', end: '00:10' }],
    [{ start: '00:02', end: '' }],
  ])('detects a sample source missing either time boundary', (timeRange) => {
    const target: GenerationTarget = {
      model: 'v6', workflow: 'sample', song: concreteSong,
      source: { name: 'Loop', role: 'intro bed', timeRange },
    };
    expect(codes(target)).toContain('sample-time-range-missing');
  });

  it('detects v6-mini structures longer than six sections only', () => {
    const long = create({ ...concreteSong, structure: ['1', '2', '3', '4', '5', '6', '7'] });
    long.model = 'v6-mini';
    expect(codes(long)).toContain('v6-mini-structure-too-long');

    const boundary = create({ ...concreteSong, structure: ['1', '2', '3', '4', '5', '6'] });
    boundary.model = 'v6-mini';
    expect(codes(boundary)).not.toContain('v6-mini-structure-too-long');
  });

  it.each(['dreamy emotional vibes', '夢幻 情緒 氛圍'])('detects overly abstract brief: %s', (concept) => {
    expect(codes(create({ concept }))).toContain('overly-abstract');
  });

  it('does not flag a concrete short brief as overly abstract', () => {
    expect(codes(create({ concept: 'Piano waltz for a rainy funeral.' }))).not.toContain('overly-abstract');
  });

  it.each([
    [['minimal techno', 'maximalist orchestral'], 'minimal and maximal'],
    [['lo-fi hip-hop', 'hi-fi pop'], 'lo-fi and hi-fi'],
  ] as const)('detects an explicit competing style pair', (genres, label) => {
    const target = create({ concept: concreteSong.concept, genres: [...genres] });
    expect(codes(target)).toContain('competing-styles');
    expect(issueMessages(target).join(' ')).toContain(label);
  });

  it('detects too many unprioritized genre anchors', () => {
    expect(codes(create({
      concept: concreteSong.concept,
      genres: ['jazz', 'metal', 'folk', 'techno', 'reggae'],
    }))).toContain('competing-styles');
  });
});

describe('compilePrompt quality integration', () => {
  it('adds quality issue messages to warnings without changing the rendering contract', () => {
    const target: GenerationTarget = {
      model: 'v6-mini',
      workflow: 'edit-section',
      song: { concept: 'dreamy vibes', structure: ['1', '2', '3', '4', '5', '6', '7'] },
      edit: { scope: '', preserve: [], change: [] },
    };

    const qualityMessages = checkPromptQuality(target).map((result) => result.message);
    const rendered = compilePrompt(target);

    expect(rendered.primaryPrompt).toContain('V6 MINI DRAFT');
    expect(rendered.warnings).toEqual(expect.arrayContaining(qualityMessages));
    expect(rendered.warnings).toContain('Edit preserve list is empty.');
  });

  it('adds explicitly labelled heuristic guidance to compiler warnings', () => {
    const rendered = compilePrompt(create({ concept: '' }));
    expect(rendered.warnings).toEqual([
      'Product heuristic — not an official Suno specification. The creative brief is empty.',
    ]);
  });
});
