import type { Revision } from './model';

/** Hash format/version. Bump when the canonical projection or algorithm changes. */
export const REVISION_HASH_VERSION = 'fnv1a32-v1' as const;

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Synchronous, browser-safe fingerprint of the immutable authoring inputs for a revision.
 * Runtime/evaluation fields and identity/timestamps are intentionally excluded.
 */
export function computeRevisionHash(revision: Revision): string {
  const projection = {
    brief: revision.brief,
    arrangement: revision.arrangement,
    vocalIntent: revision.vocalIntent,
    sourceReferences: revision.sourceReferences,
    constraints: revision.constraints,
    generationTarget: revision.generationTarget,
    renderedPrompt: revision.renderedPrompt === null ? null : {
      target: revision.renderedPrompt.target,
      style: revision.renderedPrompt.style,
      lyrics: revision.renderedPrompt.lyrics,
    },
  };
  return `${REVISION_HASH_VERSION}:${fnv1a32(stableJson(projection))}`;
}
