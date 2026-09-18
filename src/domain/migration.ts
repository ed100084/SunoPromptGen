import type { HistoryEntry, SongState } from '../types';
import {
  CANONICAL_DOMAIN_VERSION,
  PERSISTED_PROJECT_SCHEMA_VERSION,
  createDefaultArrangement,
  createDefaultConstraints,
  createDefaultCreativeBrief,
  createDefaultGenerationTarget,
  createDefaultVocalIntent,
  createInstrumentalIntent,
  type PersistedProjectEnvelope,
  type Revision,
  type SongProject,
} from './model';
import { isFiniteNumber, isRecord, isStringArray } from './runtime';

const INSTRUMENTAL_LANGUAGE = '純樂器(無歌詞)';

function isLegacySection(value: unknown): boolean {
  return isRecord(value)
    && typeof value.tag === 'string'
    && typeof value.desc === 'string'
    && typeof value.lyrics === 'string';
}

export function isLegacySongState(value: unknown): value is SongState {
  return isRecord(value)
    && typeof value.songTitle === 'string'
    && typeof value.language === 'string'
    && typeof value.genre === 'string'
    && isStringArray(value.moods)
    && typeof value.energy === 'string'
    && isStringArray(value.instruments)
    && isStringArray(value.vocals)
    && isStringArray(value.textures)
    && isStringArray(value.negatives)
    && typeof value.bpm === 'string'
    && typeof value.musicKey === 'string'
    && typeof value.extra === 'string'
    && typeof value.cohesion === 'boolean'
    && typeof value.voiceCloneActive === 'boolean'
    && typeof value.structureName === 'string'
    && Array.isArray(value.sections)
    && value.sections.every(isLegacySection)
    && typeof value.lyricsTheme === 'string'
    && typeof value.lyricsKeywords === 'string'
    && typeof value.lyricsStory === 'string';
}

export function isLegacyHistoryEntry(value: unknown): value is HistoryEntry {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || !isFiniteNumber(value.savedAt)
    || typeof value.title !== 'string'
    || !isLegacySongState(value.state)
    || typeof value.stylePrompt !== 'string'
    || typeof value.lyricsPrompt !== 'string') {
    return false;
  }
  if (value.sunoVersion !== undefined && typeof value.sunoVersion !== 'string') return false;
  if (value.result === undefined) return true;
  if (!isRecord(value.result)) return false;
  return (value.result.rating === undefined
      || value.result.rating === 1
      || value.result.rating === 2
      || value.result.rating === 3
      || value.result.rating === 4
      || value.result.rating === 5)
    && (value.result.audioUrl === undefined || typeof value.result.audioUrl === 'string')
    && (value.result.notes === undefined || typeof value.result.notes === 'string')
    && (value.result.ratedAt === undefined || isFiniteNumber(value.result.ratedAt));
}

function parseLegacyBpm(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function splitLegacyKeywords(value: string): string[] {
  return value
    .split(/[,，、\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function modelFromLegacyVersion(version: string | undefined): 'v6' | 'v6-wild' | 'v6-mini' {
  if (version === 'v6-wild' || version === 'v6-mini') return version;
  return 'v6';
}

export interface LegacyMigrationOptions {
  projectId?: string;
  revisionId?: string;
  createdAt?: number;
}

export function migrateLegacySongState(
  state: SongState,
  options: LegacyMigrationOptions & {
    stylePrompt?: string;
    lyricsPrompt?: string;
    sunoVersion?: string;
  } = {},
): SongProject {
  const createdAt = options.createdAt ?? Date.now();
  const revisionId = options.revisionId ?? `${options.projectId ?? 'project'}-revision-1`;
  const originalVersion = options.sunoVersion?.trim();
  const target = createDefaultGenerationTarget({
    model: modelFromLegacyVersion(originalVersion),
    variant: originalVersion && !['v6', 'v6-wild', 'v6-mini'].includes(originalVersion)
      ? `migrated-from:${originalVersion}`
      : null,
  });
  const revision: Revision = {
    id: revisionId,
    createdAt,
    parentRevisionId: null,
    brief: createDefaultCreativeBrief({
      title: state.songTitle,
      language: state.language,
      genre: state.genre,
      moods: [...state.moods],
      energy: state.energy,
      theme: state.lyricsTheme,
      keywords: splitLegacyKeywords(state.lyricsKeywords),
      story: state.lyricsStory,
      additionalDirection: state.extra,
    }),
    arrangement: createDefaultArrangement({
      bpm: parseLegacyBpm(state.bpm),
      key: state.musicKey,
      structureName: state.structureName,
      sections: state.sections.map((section) => ({
        tag: section.tag,
        description: section.desc,
        lyrics: section.lyrics,
      })),
      instruments: [...state.instruments],
      textures: [...state.textures],
      cohesion: state.cohesion,
    }),
    vocalIntent: state.language === INSTRUMENTAL_LANGUAGE
      ? createInstrumentalIntent()
      : createDefaultVocalIntent({
          descriptors: [...state.vocals],
          useVoiceClone: state.voiceCloneActive,
        }),
    sourceReferences: [],
    constraints: createDefaultConstraints({ avoid: [...state.negatives] }),
    generationTarget: target,
    renderedPrompt: options.stylePrompt !== undefined || options.lyricsPrompt !== undefined
      ? {
          target: { ...target },
          style: options.stylePrompt ?? '',
          lyrics: options.lyricsPrompt ?? '',
          renderedAt: createdAt,
        }
      : null,
    evaluation: { rating: null, audioUrl: '', notes: '', evaluatedAt: null },
  };
  return {
    domainVersion: CANONICAL_DOMAIN_VERSION,
    id: options.projectId ?? `migrated-${createdAt}`,
    createdAt,
    updatedAt: createdAt,
    activeRevisionId: revisionId,
    revisions: [revision],
  };
}

export function migrateLegacyHistoryEntry(entry: HistoryEntry): PersistedProjectEnvelope {
  const project = migrateLegacySongState(entry.state, {
    projectId: entry.id,
    revisionId: `${entry.id}-revision-1`,
    createdAt: entry.savedAt,
    stylePrompt: entry.stylePrompt,
    lyricsPrompt: entry.lyricsPrompt,
    sunoVersion: entry.sunoVersion,
  });
  return {
    kind: 'suno-prompt-gen/project',
    schemaVersion: PERSISTED_PROJECT_SCHEMA_VERSION,
    savedAt: entry.savedAt,
    project,
  };
}
