import type { Revision } from '../domain';
import type { PromptCompilerInput, PromptCompilerRequest, PromptSong, PromptSource } from './types';

/**
 * Product-owned prompt quality heuristics. These checks are not an official Suno specification,
 * do not predict generation success, and should be presented as review hints rather than errors.
 */
export const PROMPT_QUALITY_HEURISTICS_DISCLAIMER =
  'Product heuristic — not an official Suno specification.' as const;

export type PromptQualityIssueCode =
  | 'empty-brief'
  | 'vocal-instrumental-conflict'
  | 'tempo-conflict'
  | 'edit-scope-missing'
  | 'preserve-change-overlap'
  | 'mashup-source-role-missing'
  | 'sample-time-range-missing'
  | 'v6-mini-structure-too-long'
  | 'overly-abstract'
  | 'competing-styles';

export interface PromptQualityIssue {
  code: PromptQualityIssueCode;
  message: string;
  /** Every issue is a product heuristic, never an official provider rule. */
  provenance: 'product-heuristic';
  severity: 'warning';
}

interface QualityContext {
  target: PromptCompilerRequest;
  briefText: string;
  vocalMode?: 'vocal' | 'instrumental';
}

const clean = (value: string | undefined): string => value?.trim() ?? '';
const cleanList = (values: string[] | undefined): string[] =>
  (values ?? []).map((value) => value.trim()).filter(Boolean);
const normalized = (value: string): string => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
const allSongText = (song: PromptSong): string => [
  song.concept,
  song.notes,
  song.tempo,
  ...cleanList(song.genres),
  ...cleanList(song.moods),
  ...cleanList(song.instruments),
  ...cleanList(song.vocals),
  ...cleanList(song.structure),
  ...cleanList(song.avoid),
].filter(Boolean).join(' ');

function sourceFromRevision(source: Revision['sourceReferences'][number]): PromptSource {
  return {
    name: source.label || source.value,
    role: source.role,
    timeRange: { start: source.startTime, end: source.endTime },
    description: source.note || undefined,
  };
}

function requestFromRevision(revision: Revision): PromptCompilerRequest {
  const song: PromptSong = {
    title: revision.brief.title,
    concept: revision.brief.theme || revision.brief.story || revision.brief.additionalDirection,
    language: revision.brief.language,
    genres: revision.brief.genre ? [revision.brief.genre] : [],
    moods: revision.brief.moods,
    instruments: revision.arrangement.instruments,
    vocals: revision.vocalIntent.mode === 'vocal' ? revision.vocalIntent.descriptors : [],
    tempo: revision.arrangement.bpm === null ? undefined : `${revision.arrangement.bpm} BPM`,
    key: revision.arrangement.key,
    structure: revision.arrangement.sections.map((section) => section.tag),
    lyrics: revision.arrangement.sections.map((section) => section.lyrics).filter(Boolean).join('\n\n'),
    avoid: revision.constraints.avoid,
    notes: revision.brief.additionalDirection || revision.constraints.notes,
  };
  const base = { model: revision.generationTarget.model, song };
  const edit = {
    scope: revision.constraints.editScope,
    preserve: revision.constraints.preserve,
    change: revision.constraints.change,
  };
  const sources = revision.sourceReferences.map(sourceFromRevision);
  switch (revision.generationTarget.workflow) {
    case 'explore': return { ...base, workflow: 'explore', exploration: revision.generationTarget.variant ?? undefined };
    case 'edit-section': return { ...base, workflow: 'edit-section', edit };
    case 'edit-lyrics': return { ...base, workflow: 'edit-lyrics', edit };
    case 'mashup': return { ...base, workflow: 'mashup', sources };
    case 'sample': return {
      ...base,
      workflow: 'sample',
      source: sources[0] ?? { name: '', role: '', timeRange: { start: '', end: '' } },
    };
    case 'create': return { ...base, workflow: 'create' };
  }
}

function isRevision(input: PromptCompilerInput): input is Revision {
  return 'generationTarget' in input && 'brief' in input && 'arrangement' in input;
}

function toContext(input: PromptCompilerInput): QualityContext {
  if (!isRevision(input)) {
    return { target: input, briefText: clean(input.song.concept) };
  }
  return {
    target: requestFromRevision(input),
    vocalMode: input.vocalIntent.mode,
    briefText: [
      input.brief.title,
      input.brief.language,
      input.brief.genre,
      ...input.brief.moods,
      input.brief.energy,
      input.brief.theme,
      ...input.brief.keywords,
      input.brief.story,
      input.brief.additionalDirection,
    ].map((value) => value.trim()).filter(Boolean).join(' '),
  };
}

function issue(code: PromptQualityIssueCode, detail: string): PromptQualityIssue {
  return {
    code,
    message: `${PROMPT_QUALITY_HEURISTICS_DISCLAIMER} ${detail}`,
    provenance: 'product-heuristic',
    severity: 'warning',
  };
}

const VOCAL_PATTERN = /\b(vocal|vocals|voice|singer|singing|sung|choir|rap(?:ped|ping)?|spoken[- ]word)\b|人聲|歌聲|主唱|合唱|演唱|說唱/i;
const INSTRUMENTAL_PATTERN = /\b(instrumental|no vocals?|without vocals?|wordless)\b|純音樂|無人聲|不要人聲/i;
const FAST_PATTERN = /\b(fast|uptempo|up-tempo|high[- ]tempo|driving)\b|快速|快節奏/i;
const SLOW_PATTERN = /\b(slow|downtempo|down-tempo|low[- ]tempo|ballad tempo)\b|慢速|慢節奏/i;

function hasVocalConflict(context: QualityContext): boolean {
  const text = allSongText(context.target.song);
  const hasVocalDirection = cleanList(context.target.song.vocals).length > 0 || VOCAL_PATTERN.test(text);
  const hasInstrumentalDirection = context.vocalMode === 'instrumental' || INSTRUMENTAL_PATTERN.test(text);
  return hasVocalDirection && hasInstrumentalDirection;
}

function hasTempoConflict(song: PromptSong): boolean {
  const text = allSongText(song);
  const bpms = [...text.matchAll(/\b(\d{2,3}(?:\.\d+)?)\s*bpm\b/gi)].map((match) => Number(match[1]));
  const distinctBpms = new Set(bpms.filter((bpm) => bpm >= 20 && bpm <= 300));
  return distinctBpms.size > 1 || (FAST_PATTERN.test(text) && SLOW_PATTERN.test(text));
}

function preserveChangeOverlap(preserve: string[], change: string[]): string[] {
  const preserved = cleanList(preserve).map((value) => ({ value, key: normalized(value) }));
  const changed = cleanList(change).map((value) => ({ value, key: normalized(value) }));
  return preserved.flatMap((left) => changed
    .filter((right) => left.key === right.key || left.key.includes(right.key) || right.key.includes(left.key))
    .map(() => left.value));
}

const ABSTRACT_TERMS = new Set([
  'abstract', 'atmospheric', 'beautiful', 'cool', 'dreamy', 'emotional', 'epic', 'experimental',
  'good', 'interesting', 'modern', 'nice', 'powerful', 'unique', 'vibe', 'vibes',
  '抽象', '氛圍', '好聽', '夢幻', '情緒', '史詩', '現代', '獨特', '感覺', '酷',
]);

function isOverlyAbstract(concept: string): boolean {
  const words = normalized(concept).match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.length) return false;
  const abstractCount = words.filter((word) => ABSTRACT_TERMS.has(word)).length;
  return words.length <= 5 && abstractCount / words.length >= 0.5;
}

const COMPETING_STYLE_PAIRS: ReadonlyArray<readonly [RegExp, RegExp, string]> = [
  [/\bminimal(?:ist)?\b|極簡/i, /\bmaximal(?:ist)?\b|極繁/i, 'minimal and maximal'],
  [/\blo[- ]fi\b|低傳真/i, /\bhi[- ]fi\b|高傳真/i, 'lo-fi and hi-fi'],
  [/\braw\b|粗糙|原始/i, /\bpolished\b|精緻|精修/i, 'raw and polished'],
  [/\borganic\b|有機/i, /\bsynthetic\b|合成感/i, 'organic and synthetic'],
  [/\bintimate\b|私密|貼耳/i, /\bstadium\b|體育場|宏大/i, 'intimate and stadium-scale'],
];

function competingStyles(song: PromptSong): string | undefined {
  const text = allSongText(song);
  const pair = COMPETING_STYLE_PAIRS.find(([left, right]) => left.test(text) && right.test(text));
  if (pair) return pair[2];
  if (new Set(cleanList(song.genres).map(normalized)).size >= 5) return 'five or more genre anchors';
  return undefined;
}

/**
 * Runs deterministic, side-effect-free product heuristics over a canonical Revision or compiler
 * request. Results are advisory and explicitly are not an official Suno specification.
 */
export function checkPromptQuality(input: PromptCompilerInput): PromptQualityIssue[] {
  const context = toContext(input);
  const { target } = context;
  const issues: PromptQualityIssue[] = [];

  if (!context.briefText) issues.push(issue('empty-brief', 'The creative brief is empty.'));
  if (hasVocalConflict(context)) {
    issues.push(issue('vocal-instrumental-conflict', 'Vocal and instrumental-only directions appear to conflict.'));
  }
  if (hasTempoConflict(target.song)) {
    issues.push(issue('tempo-conflict', 'Multiple incompatible tempo directions appear in the prompt.'));
  }
  if (target.workflow === 'edit-section' || target.workflow === 'edit-lyrics') {
    if (!clean(target.edit.scope)) issues.push(issue('edit-scope-missing', 'The edit has no scope.'));
    const overlap = preserveChangeOverlap(target.edit.preserve, target.edit.change);
    if (overlap.length) {
      issues.push(issue('preserve-change-overlap', `Preserve and change overlap: ${[...new Set(overlap)].join(', ')}.`));
    }
  }
  if (target.workflow === 'mashup') {
    target.sources.forEach((source, index) => {
      if (!clean(source.role)) {
        issues.push(issue('mashup-source-role-missing', `Mashup source ${index + 1} has no assigned role.`));
      }
    });
  }
  if (target.workflow === 'sample'
    && (!clean(target.source.timeRange.start) || !clean(target.source.timeRange.end))) {
    issues.push(issue('sample-time-range-missing', 'The sample source needs both a start and end time.'));
  }
  if (target.model === 'v6-mini' && cleanList(target.song.structure).length > 6) {
    issues.push(issue('v6-mini-structure-too-long', 'v6-mini may compress a structure longer than six sections.'));
  }
  if (isOverlyAbstract(target.song.concept)) {
    issues.push(issue('overly-abstract', 'The concept may be too abstract to establish a concrete musical or narrative intent.'));
  }
  const competition = competingStyles(target.song);
  if (competition) {
    issues.push(issue('competing-styles', `Style directions may compete (${competition}); clarify hierarchy if the contrast is not intentional.`));
  }

  return issues;
}
