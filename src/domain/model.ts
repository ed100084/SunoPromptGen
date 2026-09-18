import type { DecodeResult } from './runtime';
import { failure, isFiniteNumber, isRecord, isStringArray, success } from './runtime';

export const CANONICAL_DOMAIN_VERSION = 6 as const;
export const PERSISTED_PROJECT_SCHEMA_VERSION = 1 as const;

export type CanonicalDomainVersion = typeof CANONICAL_DOMAIN_VERSION;
export type PersistedProjectSchemaVersion = typeof PERSISTED_PROJECT_SCHEMA_VERSION;

export interface CreativeBrief {
  title: string;
  language: string;
  genre: string;
  moods: string[];
  energy: string;
  theme: string;
  keywords: string[];
  story: string;
  additionalDirection: string;
}

export interface ArrangementSection {
  tag: string;
  description: string;
  lyrics: string;
}

export interface Arrangement {
  bpm: number | null;
  key: string;
  structureName: string;
  sections: ArrangementSection[];
  instruments: string[];
  textures: string[];
  cohesion: boolean;
}

export interface VocalPerformanceIntent {
  mode: 'vocal';
  descriptors: string[];
  useVoiceClone: boolean;
}

export interface InstrumentalIntent {
  mode: 'instrumental';
}

/** Vocal-only settings cannot exist on an instrumental revision. */
export type VocalIntent = VocalPerformanceIntent | InstrumentalIntent;

export interface SourceReference {
  id: string;
  kind: 'text' | 'url' | 'audio' | 'image' | 'video' | 'other';
  label: string;
  value: string;
  role: string;
  startTime: string;
  endTime: string;
  note: string;
  rightsConfirmed: boolean;
}

export interface Constraints {
  avoid: string[];
  mustInclude: string[];
  preserve: string[];
  change: string[];
  editScope: string;
  maxStylePromptLength: number | null;
  notes: string;
}

export type GenerationModel = 'v6' | 'v6-wild' | 'v6-mini';
/** @deprecated Use GenerationModel. */
export type SunoV6Model = GenerationModel;
export type GenerationWorkflow =
  | 'create'
  | 'explore'
  | 'edit-section'
  | 'edit-lyrics'
  | 'mashup'
  | 'sample';

export interface GenerationTarget {
  provider: 'suno';
  model: GenerationModel;
  workflow: GenerationWorkflow;
  variant: string | null;
}

export interface RenderedPrompt {
  target: GenerationTarget;
  style: string;
  lyrics: string;
  renderedAt: number;
}

export interface Evaluation {
  rating: 1 | 2 | 3 | 4 | 5 | null;
  audioUrl: string;
  notes: string;
  evaluatedAt: number | null;
}

export interface Revision {
  id: string;
  createdAt: number;
  parentRevisionId: string | null;
  brief: CreativeBrief;
  arrangement: Arrangement;
  vocalIntent: VocalIntent;
  sourceReferences: SourceReference[];
  constraints: Constraints;
  generationTarget: GenerationTarget;
  renderedPrompt: RenderedPrompt | null;
  evaluation: Evaluation;
}

export interface SongProject {
  domainVersion: CanonicalDomainVersion;
  id: string;
  createdAt: number;
  updatedAt: number;
  activeRevisionId: string;
  revisions: Revision[];
}

export interface PersistedProjectEnvelope {
  kind: 'suno-prompt-gen/project';
  schemaVersion: PersistedProjectSchemaVersion;
  savedAt: number;
  project: SongProject;
}

export const DEFAULT_CREATIVE_BRIEF: Readonly<CreativeBrief> = Object.freeze({
  title: '',
  language: '',
  genre: '',
  moods: [],
  energy: '',
  theme: '',
  keywords: [],
  story: '',
  additionalDirection: '',
});

export const DEFAULT_ARRANGEMENT: Readonly<Arrangement> = Object.freeze({
  bpm: null,
  key: '',
  structureName: '',
  sections: [],
  instruments: [],
  textures: [],
  cohesion: true,
});

export const DEFAULT_VOCAL_INTENT: Readonly<VocalPerformanceIntent> = Object.freeze({
  mode: 'vocal',
  descriptors: [],
  useVoiceClone: false,
});

export const DEFAULT_CONSTRAINTS: Readonly<Constraints> = Object.freeze({
  avoid: [],
  mustInclude: [],
  preserve: [],
  change: [],
  editScope: '',
  maxStylePromptLength: null,
  notes: '',
});

export const DEFAULT_GENERATION_TARGET: Readonly<GenerationTarget> = Object.freeze({
  provider: 'suno',
  model: 'v6',
  workflow: 'create',
  variant: null,
});

function cloneDefaults<T>(value: T): T {
  return structuredClone(value);
}

export function createDefaultCreativeBrief(overrides: Partial<CreativeBrief> = {}): CreativeBrief {
  return { ...cloneDefaults(DEFAULT_CREATIVE_BRIEF), ...overrides };
}

export function createDefaultArrangement(overrides: Partial<Arrangement> = {}): Arrangement {
  return { ...cloneDefaults(DEFAULT_ARRANGEMENT), ...overrides };
}

export function createDefaultVocalIntent(
  overrides: Partial<VocalPerformanceIntent> & { mode?: 'vocal' } = {},
): VocalPerformanceIntent {
  return { ...cloneDefaults(DEFAULT_VOCAL_INTENT), ...overrides, mode: 'vocal' };
}

export function createInstrumentalIntent(): InstrumentalIntent {
  return { mode: 'instrumental' };
}

export function createDefaultConstraints(overrides: Partial<Constraints> = {}): Constraints {
  return { ...cloneDefaults(DEFAULT_CONSTRAINTS), ...overrides };
}

export function createDefaultGenerationTarget(
  overrides: Partial<GenerationTarget> = {},
): GenerationTarget {
  return { ...cloneDefaults(DEFAULT_GENERATION_TARGET), ...overrides };
}

export interface NewSongProjectOptions {
  id?: string;
  revisionId?: string;
  now?: number;
  brief?: Partial<CreativeBrief>;
  arrangement?: Partial<Arrangement>;
  vocalIntent?: VocalIntent | (Partial<VocalPerformanceIntent> & { mode?: 'vocal' });
  constraints?: Partial<Constraints>;
  generationTarget?: Partial<GenerationTarget>;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultSongProject(options: NewSongProjectOptions = {}): SongProject {
  const now = options.now ?? Date.now();
  const revisionId = options.revisionId ?? createId('revision');
  const generationTarget = createDefaultGenerationTarget(options.generationTarget);
  const vocalIntent = options.vocalIntent?.mode === 'instrumental'
    ? createInstrumentalIntent()
    : createDefaultVocalIntent(options.vocalIntent);
  const revision: Revision = {
    id: revisionId,
    createdAt: now,
    parentRevisionId: null,
    brief: createDefaultCreativeBrief(options.brief),
    arrangement: createDefaultArrangement(options.arrangement),
    vocalIntent,
    sourceReferences: [],
    constraints: createDefaultConstraints(options.constraints),
    generationTarget,
    renderedPrompt: null,
    evaluation: { rating: null, audioUrl: '', notes: '', evaluatedAt: null },
  };
  return {
    domainVersion: CANONICAL_DOMAIN_VERSION,
    id: options.id ?? createId('project'),
    createdAt: now,
    updatedAt: now,
    activeRevisionId: revisionId,
    revisions: [revision],
  };
}

export function createPersistedProjectEnvelope(
  project: SongProject,
  savedAt = Date.now(),
): PersistedProjectEnvelope {
  return {
    kind: 'suno-prompt-gen/project',
    schemaVersion: PERSISTED_PROJECT_SCHEMA_VERSION,
    savedAt,
    project: structuredClone(project),
  };
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isCreativeBrief(value: unknown): value is CreativeBrief {
  return isRecord(value)
    && typeof value.title === 'string'
    && typeof value.language === 'string'
    && typeof value.genre === 'string'
    && isStringArray(value.moods)
    && typeof value.energy === 'string'
    && typeof value.theme === 'string'
    && isStringArray(value.keywords)
    && typeof value.story === 'string'
    && typeof value.additionalDirection === 'string';
}

export function isArrangement(value: unknown): value is Arrangement {
  return isRecord(value)
    && (value.bpm === null || isFiniteNumber(value.bpm))
    && typeof value.key === 'string'
    && typeof value.structureName === 'string'
    && Array.isArray(value.sections)
    && value.sections.every((section) => isRecord(section)
      && typeof section.tag === 'string'
      && typeof section.description === 'string'
      && typeof section.lyrics === 'string')
    && isStringArray(value.instruments)
    && isStringArray(value.textures)
    && typeof value.cohesion === 'boolean';
}

export function isVocalIntent(value: unknown): value is VocalIntent {
  if (!isRecord(value)) return false;
  if (value.mode === 'instrumental') {
    return !('descriptors' in value) && !('useVoiceClone' in value);
  }
  return value.mode === 'vocal'
    && isStringArray(value.descriptors)
    && typeof value.useVoiceClone === 'boolean';
}

export function isSourceReference(value: unknown): value is SourceReference {
  return isRecord(value)
    && typeof value.id === 'string'
    && ['text', 'url', 'audio', 'image', 'video', 'other'].includes(String(value.kind))
    && typeof value.label === 'string'
    && typeof value.value === 'string'
    && typeof value.role === 'string'
    && typeof value.startTime === 'string'
    && typeof value.endTime === 'string'
    && typeof value.note === 'string'
    && typeof value.rightsConfirmed === 'boolean';
}

export function isConstraints(value: unknown): value is Constraints {
  return isRecord(value)
    && isStringArray(value.avoid)
    && isStringArray(value.mustInclude)
    && isStringArray(value.preserve)
    && isStringArray(value.change)
    && typeof value.editScope === 'string'
    && (value.maxStylePromptLength === null || isFiniteNumber(value.maxStylePromptLength))
    && typeof value.notes === 'string';
}

export function isGenerationTarget(value: unknown): value is GenerationTarget {
  return isRecord(value)
    && value.provider === 'suno'
    && (value.model === 'v6' || value.model === 'v6-wild' || value.model === 'v6-mini')
    && ['create', 'explore', 'edit-section', 'edit-lyrics', 'mashup', 'sample'].includes(String(value.workflow))
    && isNullableString(value.variant);
}

export function isRenderedPrompt(value: unknown): value is RenderedPrompt {
  return isRecord(value)
    && isGenerationTarget(value.target)
    && typeof value.style === 'string'
    && typeof value.lyrics === 'string'
    && isFiniteNumber(value.renderedAt);
}

export function isEvaluation(value: unknown): value is Evaluation {
  return isRecord(value)
    && (value.rating === null || [1, 2, 3, 4, 5].includes(Number(value.rating)))
    && typeof value.audioUrl === 'string'
    && typeof value.notes === 'string'
    && (value.evaluatedAt === null || isFiniteNumber(value.evaluatedAt));
}

export function isRevision(value: unknown): value is Revision {
  return isRecord(value)
    && typeof value.id === 'string'
    && isFiniteNumber(value.createdAt)
    && isNullableString(value.parentRevisionId)
    && isCreativeBrief(value.brief)
    && isArrangement(value.arrangement)
    && isVocalIntent(value.vocalIntent)
    && Array.isArray(value.sourceReferences)
    && value.sourceReferences.every(isSourceReference)
    && isConstraints(value.constraints)
    && isGenerationTarget(value.generationTarget)
    && (value.renderedPrompt === null || isRenderedPrompt(value.renderedPrompt))
    && isEvaluation(value.evaluation);
}

export function isSongProject(value: unknown): value is SongProject {
  if (!isRecord(value)
    || value.domainVersion !== CANONICAL_DOMAIN_VERSION
    || typeof value.id !== 'string'
    || !isFiniteNumber(value.createdAt)
    || !isFiniteNumber(value.updatedAt)
    || typeof value.activeRevisionId !== 'string'
    || !Array.isArray(value.revisions)
    || value.revisions.length === 0
    || !value.revisions.every(isRevision)) {
    return false;
  }
  const ids = value.revisions.map((revision) => revision.id);
  return new Set(ids).size === ids.length && ids.includes(value.activeRevisionId);
}

export function isPersistedProjectEnvelope(value: unknown): value is PersistedProjectEnvelope {
  return isRecord(value)
    && value.kind === 'suno-prompt-gen/project'
    && value.schemaVersion === PERSISTED_PROJECT_SCHEMA_VERSION
    && isFiniteNumber(value.savedAt)
    && isSongProject(value.project);
}

export function decodeSongProject(value: unknown): DecodeResult<SongProject> {
  return isSongProject(value)
    ? success(structuredClone(value))
    : failure('Invalid canonical v6 SongProject');
}

export function decodePersistedProjectEnvelope(
  value: unknown,
): DecodeResult<PersistedProjectEnvelope> {
  if (!isRecord(value)) return failure('Persisted project envelope must be an object');
  if (value.kind !== 'suno-prompt-gen/project') return failure('Unsupported persisted project kind');
  if (value.schemaVersion !== PERSISTED_PROJECT_SCHEMA_VERSION) {
    return failure(`Unsupported persisted project schemaVersion: ${String(value.schemaVersion)}`);
  }
  if (!isFiniteNumber(value.savedAt)) return failure('Persisted project savedAt must be a number');
  const decodedProject = decodeSongProject(value.project);
  if (!decodedProject.ok) return failure(...decodedProject.errors.map((error) => `project: ${error}`));
  return success({
    kind: 'suno-prompt-gen/project',
    schemaVersion: PERSISTED_PROJECT_SCHEMA_VERSION,
    savedAt: value.savedAt,
    project: decodedProject.value,
  });
}

export function parsePersistedProjectEnvelope(json: string): DecodeResult<PersistedProjectEnvelope> {
  try {
    return decodePersistedProjectEnvelope(JSON.parse(json));
  } catch (error) {
    return failure(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}
