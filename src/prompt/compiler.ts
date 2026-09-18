import type { Revision, SourceReference } from '../domain';
import { checkPromptQuality } from './quality';
import type {
  EditDirective,
  GenerationModel,
  GenerationTarget,
  PromptCompilerInput,
  PromptCompilerRequest,
  PromptSong,
  PromptSource,
  RenderedPrompt,
  RenderedPromptSection,
} from './types';

interface ModelStrategy {
  label: string;
  renderPrimary: (context: string, song: PromptSong) => string;
  renderStyle: (song: PromptSong) => string | undefined;
}

const clean = (value: string | undefined): string => value?.trim() ?? '';

const cleanList = (values: string[] | undefined): string[] =>
  (values ?? []).map((value) => value.trim()).filter(Boolean);

const sentence = (label: string, values: string[] | undefined): string | undefined => {
  const items = cleanList(values);
  return items.length ? `${label}: ${items.join(', ')}` : undefined;
};

const songFacts = (song: PromptSong): string[] =>
  [
    clean(song.concept) ? `Intent: ${clean(song.concept)}` : undefined,
    clean(song.language) ? `Language: ${clean(song.language)}` : undefined,
    sentence('Genres', song.genres),
    sentence('Moods', song.moods),
    sentence('Instrumentation', song.instruments),
    sentence('Vocals', song.vocals),
    clean(song.tempo) ? `Tempo: ${clean(song.tempo)}` : undefined,
    clean(song.key) ? `Key: ${clean(song.key)}` : undefined,
    sentence('Structure', song.structure),
    sentence('Avoid', song.avoid),
    clean(song.notes) ? `Additional direction: ${clean(song.notes)}` : undefined,
  ].filter((line): line is string => Boolean(line));

const strategies: Record<GenerationModel, ModelStrategy> = {
  v6: {
    label: 'precision-first',
    renderPrimary: (context, song) =>
      [
        'V6 PRECISION BRIEF',
        context,
        ...songFacts(song),
        'Keep the hierarchy explicit, transitions coherent, and requested constraints stable.',
      ].join('\n'),
    renderStyle: (song) => {
      const details = [
        ...cleanList(song.genres),
        ...cleanList(song.moods),
        ...cleanList(song.instruments),
        ...cleanList(song.vocals),
        clean(song.tempo),
        clean(song.key),
      ].filter(Boolean);
      return details.length ? details.join(', ') : undefined;
    },
  },
  'v6-wild': {
    label: 'exploration-first',
    renderPrimary: (context, song) =>
      [
        'V6 WILD EXPLORATION BRIEF',
        context,
        ...songFacts(song),
        'Generate bold but musically coherent variation: permit surprising genre collisions, textures, and transitions while retaining the core intent.',
      ].join('\n'),
    renderStyle: (song) => {
      const anchors = [...cleanList(song.genres), ...cleanList(song.moods)];
      const palette = [...cleanList(song.instruments), ...cleanList(song.vocals)];
      if (!anchors.length && !palette.length) return undefined;
      return [
        anchors.length ? `anchors(${anchors.join(' + ')})` : '',
        palette.length ? `open palette(${palette.join(', ')})` : '',
        'high-variation, unexpected-but-coherent',
      ].filter(Boolean).join('; ');
    },
  },
  'v6-mini': {
    label: 'compact-draft',
    renderPrimary: (context, song) => {
      const compactFacts = songFacts(song).map((fact) => fact.replace('Additional direction:', 'Notes:'));
      return ['V6 MINI DRAFT', context, ...compactFacts].join(' | ');
    },
    renderStyle: (song) => {
      const tags = [
        ...cleanList(song.genres).slice(0, 2),
        ...cleanList(song.moods).slice(0, 2),
        ...cleanList(song.instruments).slice(0, 2),
        ...cleanList(song.vocals).slice(0, 1),
        clean(song.tempo),
      ].filter(Boolean);
      return tags.length ? tags.join(', ') : undefined;
    },
  },
};

function formatEdit(edit: EditDirective, kind: 'section' | 'lyrics'): string {
  return [
    `Edit ${kind} scope: ${clean(edit.scope) || '(scope not specified)'}`,
    `Preserve: ${cleanList(edit.preserve).join('; ') || '(nothing specified)'}`,
    `Change: ${cleanList(edit.change).join('; ') || '(nothing specified)'}`,
    'Apply changes only inside the stated scope; treat preserve items as invariants.',
  ].join('\n');
}

function formatSource(source: PromptSource, index?: number): string {
  const prefix = index === undefined ? 'Source' : `Source ${index + 1}`;
  return [
    `${prefix}: ${clean(source.name) || '(unnamed)'}`,
    `Role: ${clean(source.role) || '(role not specified)'}`,
    `Time range: ${clean(source.timeRange.start) || '?'}–${clean(source.timeRange.end) || '?'}`,
    clean(source.description) ? `Material: ${clean(source.description)}` : undefined,
  ].filter((line): line is string => Boolean(line)).join('\n');
}

function sourceFromDomain(source: SourceReference): PromptSource {
  return {
    name: source.label || source.value,
    role: source.role,
    timeRange: { start: source.startTime, end: source.endTime },
    description: source.note || undefined,
  };
}

function targetFromRevision(revision: Revision): PromptCompilerRequest {
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
  const edit: EditDirective = {
    scope: revision.constraints.editScope,
    preserve: revision.constraints.preserve,
    change: revision.constraints.change,
  };
  const sources = revision.sourceReferences.map(sourceFromDomain);
  switch (revision.generationTarget.workflow) {
    case 'explore':
      return { ...base, workflow: 'explore', exploration: revision.generationTarget.variant ?? undefined };
    case 'edit-section': return { ...base, workflow: 'edit-section', edit };
    case 'edit-lyrics': return { ...base, workflow: 'edit-lyrics', edit };
    case 'mashup': return { ...base, workflow: 'mashup', sources };
    case 'sample':
      return {
        ...base,
        workflow: 'sample',
        source: sources[0] ?? { name: '', role: '', timeRange: { start: '', end: '' } },
      };
    case 'create': return { ...base, workflow: 'create' };
  }
}

function isRevisionInput(input: PromptCompilerInput): input is Revision {
  return 'generationTarget' in input && 'brief' in input && 'arrangement' in input;
}

function workflowContext(target: PromptCompilerRequest): string {
  switch (target.workflow) {
    case 'create':
      return 'Workflow: create a new complete song concept from the supplied intent.';
    case 'explore':
      return [
        'Workflow: explore distinct musical interpretations before converging.',
        clean(target.exploration) ? `Exploration axis: ${clean(target.exploration)}` : undefined,
      ].filter(Boolean).join('\n');
    case 'edit-section':
      return `Workflow: edit an existing musical section.\n${formatEdit(target.edit, 'section')}`;
    case 'edit-lyrics':
      return `Workflow: edit existing lyrics.\n${formatEdit(target.edit, 'lyrics')}`;
    case 'mashup':
      return [
        'Workflow: construct a mashup using each source only in its assigned role and time range.',
        ...target.sources.map((source, index) => formatSource(source, index)),
        'Make source hand-offs and overlaps explicit; do not blur source roles.',
      ].join('\n');
    case 'sample':
      return [
        'Workflow: build from a selected sample source.',
        formatSource(target.source),
        'Use only the identified time range as source material and retain its assigned role.',
      ].join('\n');
  }
}

function collectWarnings(target: GenerationTarget): string[] {
  const warnings: string[] = [];
  if (target.workflow === 'explore' && target.model !== 'v6-wild') {
    warnings.push('Explore works with this model, but v6-wild provides the broadest variation strategy.');
  }
  if (target.workflow === 'edit-section' || target.workflow === 'edit-lyrics') {
    if (!cleanList(target.edit.preserve).length) warnings.push('Edit preserve list is empty.');
    if (!cleanList(target.edit.change).length) warnings.push('Edit change list is empty.');
  }
  if (target.workflow === 'mashup') {
    if (target.sources.length < 2) warnings.push('Mashup should define at least two sources.');
    target.sources.forEach((source, index) => validateSource(source, `Mashup source ${index + 1}`, warnings));
  }
  if (target.workflow === 'sample') validateSource(target.source, 'Sample source', warnings);
  return warnings;
}

function validateSource(source: PromptSource, label: string, warnings: string[]): void {
  if (!clean(source.name)) warnings.push(`${label} name is empty.`);
  if (!clean(source.role)) warnings.push(`${label} role is empty.`);
  if (!clean(source.timeRange.start) || !clean(source.timeRange.end)) {
    warnings.push(`${label} time range is incomplete.`);
  }
}

function buildSections(
  target: GenerationTarget,
  context: string,
  stylePrompt: string | undefined,
  lyricsPrompt: string | undefined,
): RenderedPromptSection[] {
  const strategy = strategies[target.model];
  const sections: RenderedPromptSection[] = [
    { id: 'strategy', label: 'Model strategy', content: `${target.model}: ${strategy.label}` },
    { id: 'workflow', label: 'Workflow directive', content: context },
    { id: 'intent', label: 'Song intent', content: clean(target.song.concept) || '(empty)' },
  ];
  if (stylePrompt) sections.push({ id: 'style', label: 'Style prompt', content: stylePrompt });
  if (lyricsPrompt) sections.push({ id: 'lyrics', label: 'Lyrics prompt', content: lyricsPrompt });
  return sections;
}

/**
 * Compiles a domain target into prompt text only. It does not call, submit to, or claim to operate Suno.
 */
export function compilePrompt(input: PromptCompilerInput): RenderedPrompt {
  const target = isRevisionInput(input) ? targetFromRevision(input) : input;
  const strategy = strategies[target.model];
  const context = workflowContext(target);
  const stylePrompt = strategy.renderStyle(target.song);
  const lyrics = clean(target.song.lyrics);
  const lyricsPrompt = lyrics || undefined;

  return {
    title: clean(target.song.title) || 'Untitled prompt',
    model: target.model,
    workflow: target.workflow,
    primaryPrompt: strategy.renderPrimary(context, target.song),
    stylePrompt,
    lyricsPrompt,
    warnings: [
      ...collectWarnings(target),
      ...checkPromptQuality(input).map((qualityIssue) => qualityIssue.message),
    ],
    sections: buildSections(target, context, stylePrompt, lyricsPrompt),
  };
}
