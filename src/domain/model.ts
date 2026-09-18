import type { DecodeResult } from './runtime';
import { failure, isFiniteNumber, isRecord, isStringArray, success } from './runtime';

export const CANONICAL_DOMAIN_VERSION = 8 as const;
export const PERSISTED_PROJECT_SCHEMA_VERSION = 3 as const;
export const LEGACY_PERSISTED_PROJECT_SCHEMA_VERSIONS = [1, 2] as const;

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
  id: string;
  name: string;
  role: string;
  energy: string;
  instrumentation: string[];
  lyrics: string;
  locked: boolean;
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

export type GenerationRunStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';

/** One concrete generation attempt produced from a revision. */
export interface GenerationRun {
  id: string;
  createdAt: number;
  model: GenerationModel;
  workflow: GenerationWorkflow;
  compilerVersion: string | null;
  revisionHash: string | null;
  externalSongId: string | null;
  externalJobId: string | null;
  seed: number | null;
  actualModelVersion: string | null;
  tags: string[];
  /** Exact prompt text submitted to the generation provider. */
  submittedPrompt: string;
  audioUrl: string;
  rating: 1 | 2 | 3 | 4 | 5 | null;
  notes: string;
  status: GenerationRunStatus;
  /** At most one run per revision may be marked as the best result. */
  isBest: boolean;
  bestReason: string | null;
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
  /** Concrete outputs generated from this revision. */
  generationRuns: GenerationRun[];
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

export const DEFAULT_GENERATION_RUN: Readonly<Omit<GenerationRun, 'id' | 'createdAt'>> = Object.freeze({
  model: 'v6',
  workflow: 'create',
  compilerVersion: null,
  revisionHash: null,
  externalSongId: null,
  externalJobId: null,
  seed: null,
  actualModelVersion: null,
  tags: [],
  submittedPrompt: '',
  audioUrl: '',
  rating: null,
  notes: '',
  status: 'pending',
  isBest: false,
  bestReason: null,
});

function cloneDefaults<T>(value: T): T {
  return structuredClone(value);
}

export function createDefaultCreativeBrief(overrides: Partial<CreativeBrief> = {}): CreativeBrief {
  return { ...cloneDefaults(DEFAULT_CREATIVE_BRIEF), ...overrides };
}

export function createDefaultArrangementSection(
  overrides: Partial<ArrangementSection> = {},
): ArrangementSection {
  return {
    id: '',
    name: '',
    role: '',
    energy: '',
    instrumentation: [],
    lyrics: '',
    locked: false,
    ...overrides,
  };
}

export function createDefaultArrangement(overrides: Partial<Arrangement> = {}): Arrangement {
  const arrangement = { ...cloneDefaults(DEFAULT_ARRANGEMENT), ...overrides };
  return {
    ...arrangement,
    sections: arrangement.sections.map((section) => createDefaultArrangementSection(section)),
  };
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

export function createDefaultGenerationRun(
  options: Partial<GenerationRun> & Pick<GenerationRun, 'id' | 'createdAt'>,
): GenerationRun {
  return { ...cloneDefaults(DEFAULT_GENERATION_RUN), ...options };
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
    generationRuns: [],
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

export function isArrangementSection(value: unknown): value is ArrangementSection {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.role === 'string'
    && typeof value.energy === 'string'
    && isStringArray(value.instrumentation)
    && typeof value.lyrics === 'string'
    && typeof value.locked === 'boolean';
}

export function isArrangement(value: unknown): value is Arrangement {
  return isRecord(value)
    && (value.bpm === null || isFiniteNumber(value.bpm))
    && typeof value.key === 'string'
    && typeof value.structureName === 'string'
    && Array.isArray(value.sections)
    && value.sections.every(isArrangementSection)
    && new Set(value.sections.map((section) => section.id)).size === value.sections.length
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

export function isGenerationRun(value: unknown): value is GenerationRun {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.length > 0
    && isFiniteNumber(value.createdAt)
    && (value.model === 'v6' || value.model === 'v6-wild' || value.model === 'v6-mini')
    && ['create', 'explore', 'edit-section', 'edit-lyrics', 'mashup', 'sample'].includes(String(value.workflow))
    && isNullableString(value.compilerVersion)
    && isNullableString(value.revisionHash)
    && isNullableString(value.externalSongId)
    && isNullableString(value.externalJobId)
    && (value.seed === null || isFiniteNumber(value.seed))
    && isNullableString(value.actualModelVersion)
    && isStringArray(value.tags)
    && typeof value.submittedPrompt === 'string'
    && typeof value.audioUrl === 'string'
    && (value.rating === null || [1, 2, 3, 4, 5].includes(Number(value.rating)))
    && typeof value.notes === 'string'
    && ['pending', 'running', 'succeeded', 'failed', 'cancelled'].includes(String(value.status))
    && typeof value.isBest === 'boolean'
    && isNullableString(value.bestReason)
    && (value.isBest || value.bestReason === null);
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
    && Array.isArray(value.generationRuns)
    && value.generationRuns.every(isGenerationRun)
    && new Set(value.generationRuns.map((run) => run.id)).size === value.generationRuns.length
    && value.generationRuns.filter((run) => run.isBest).length <= 1
    && !('evaluation' in value);
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
    : failure(`Invalid canonical v${CANONICAL_DOMAIN_VERSION} SongProject`);
}

interface LegacyEvaluation {
  rating: 1 | 2 | 3 | 4 | 5 | null;
  audioUrl: string;
  notes: string;
  evaluatedAt: number | null;
}

function isLegacyEvaluation(value: unknown): value is LegacyEvaluation {
  return isRecord(value)
    && (value.rating === null || [1, 2, 3, 4, 5].includes(Number(value.rating)))
    && typeof value.audioUrl === 'string'
    && typeof value.notes === 'string'
    && (value.evaluatedAt === null || isFiniteNumber(value.evaluatedAt));
}

function migrateEvaluationToGenerationRuns(
  revision: Record<string, unknown>,
): GenerationRun[] | null {
  if (!isLegacyEvaluation(revision.evaluation)
    || typeof revision.id !== 'string'
    || !isFiniteNumber(revision.createdAt)
    || !isGenerationTarget(revision.generationTarget)) {
    return null;
  }
  const evaluation = revision.evaluation;
  const isEmpty = evaluation.rating === null
    && evaluation.audioUrl === ''
    && evaluation.notes === ''
    && evaluation.evaluatedAt === null;
  if (isEmpty) return [];
  return [createDefaultGenerationRun({
    id: `${revision.id}-legacy-evaluation`,
    createdAt: evaluation.evaluatedAt ?? revision.createdAt,
    model: revision.generationTarget.model,
    workflow: revision.generationTarget.workflow,
    audioUrl: evaluation.audioUrl,
    rating: evaluation.rating,
    notes: evaluation.notes,
    status: 'succeeded',
  })];
}

function migrateGenerationRunFields(value: unknown): GenerationRun | null {
  if (!isRecord(value)) return null;
  const isBest = typeof value.isBest === 'boolean' ? value.isBest : false;
  const candidate = {
    ...value,
    compilerVersion: isNullableString(value.compilerVersion) ? value.compilerVersion : null,
    revisionHash: isNullableString(value.revisionHash) ? value.revisionHash : null,
    externalSongId: isNullableString(value.externalSongId) ? value.externalSongId : null,
    externalJobId: isNullableString(value.externalJobId) ? value.externalJobId : null,
    seed: value.seed === null || isFiniteNumber(value.seed) ? value.seed : null,
    actualModelVersion: isNullableString(value.actualModelVersion) ? value.actualModelVersion : null,
    tags: isStringArray(value.tags) ? [...value.tags] : [],
    submittedPrompt: typeof value.submittedPrompt === 'string' ? value.submittedPrompt : '',
    isBest,
    bestReason: isBest && isNullableString(value.bestReason) ? value.bestReason : null,
  };
  return isGenerationRun(candidate) ? candidate : null;
}

function migrateArrangementSection(
  value: unknown,
  revisionId: string,
  index: number,
): ArrangementSection | null {
  if (!isRecord(value) || typeof value.lyrics !== 'string') return null;
  const legacyName = typeof value.tag === 'string' ? value.tag : '';
  const legacyRole = typeof value.description === 'string' ? value.description : '';
  const section = createDefaultArrangementSection({
    id: typeof value.id === 'string' ? value.id : `${revisionId}-section-${index + 1}`,
    name: typeof value.name === 'string' ? value.name : legacyName,
    role: typeof value.role === 'string' ? value.role : legacyRole,
    energy: typeof value.energy === 'string' ? value.energy : '',
    instrumentation: isStringArray(value.instrumentation) ? [...value.instrumentation] : [],
    lyrics: value.lyrics,
    locked: typeof value.locked === 'boolean' ? value.locked : false,
  });
  return isArrangementSection(section) ? section : null;
}

function migrateRevision(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !isRecord(value.arrangement)
    || !Array.isArray(value.arrangement.sections)) return null;
  const sections = value.arrangement.sections.map((section, index) =>
    migrateArrangementSection(section, value.id as string, index));
  if (sections.some((section) => section === null)) return null;
  const generationRuns = Array.isArray(value.generationRuns)
    ? value.generationRuns.map(migrateGenerationRunFields)
    : migrateEvaluationToGenerationRuns(value);
  if (generationRuns === null || generationRuns.some((run) => run === null)) return null;
  const { evaluation: _legacyEvaluation, ...revision } = value;
  return {
    ...revision,
    arrangement: { ...value.arrangement, sections },
    generationRuns,
  };
}

/** Upgrade projects only while crossing the legacy persistence boundary. */
function migrateLegacyPersistedProject(value: unknown): DecodeResult<SongProject> {
  if (!isRecord(value)
    || (![6, 7, CANONICAL_DOMAIN_VERSION].includes(Number(value.domainVersion)))
    || !Array.isArray(value.revisions)) {
    return failure(`Invalid canonical v${CANONICAL_DOMAIN_VERSION} SongProject`);
  }
  const project = structuredClone(value) as Record<string, unknown>;
  const revisions = (project.revisions as unknown[]).map(migrateRevision);
  if (revisions.some((revision) => revision === null)) {
    return failure(`Invalid canonical v${CANONICAL_DOMAIN_VERSION} SongProject`);
  }
  project.domainVersion = CANONICAL_DOMAIN_VERSION;
  project.revisions = revisions;
  return decodeSongProject(project);
}

export function decodePersistedProjectEnvelope(
  value: unknown,
): DecodeResult<PersistedProjectEnvelope> {
  if (!isRecord(value)) return failure('Persisted project envelope must be an object');
  if (value.kind !== 'suno-prompt-gen/project') return failure('Unsupported persisted project kind');
  const isLegacySchema = LEGACY_PERSISTED_PROJECT_SCHEMA_VERSIONS.includes(value.schemaVersion as 1 | 2);
  if (!isLegacySchema && value.schemaVersion !== PERSISTED_PROJECT_SCHEMA_VERSION) {
    return failure(`Unsupported persisted project schemaVersion: ${String(value.schemaVersion)}`);
  }
  if (!isFiniteNumber(value.savedAt)) return failure('Persisted project savedAt must be a number');
  const decodedProject = isLegacySchema
    ? migrateLegacyPersistedProject(value.project)
    : decodeSongProject(value.project);
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
