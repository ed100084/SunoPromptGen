import { describe, expect, it } from 'vitest';
import { createDefaultGenerationRun, createDefaultSongProject } from './model';
import { computeRevisionHash, REVISION_HASH_VERSION } from './revisionHash';

describe('computeRevisionHash', () => {
  it('同步且 deterministic，忽略 identity、時間與 evaluation runs', () => {
    const left = createDefaultSongProject({ id: 'p1', revisionId: 'r1', now: 1 }).revisions[0];
    left.brief.theme = 'night train';
    const right = structuredClone(left);
    right.id = 'r2';
    right.createdAt = 99;
    right.generationRuns.push(createDefaultGenerationRun({ id: 'run', createdAt: 100, rating: 5 }));

    expect(computeRevisionHash(left)).toBe(computeRevisionHash(right));
    expect(computeRevisionHash(left)).toMatch(new RegExp(`^${REVISION_HASH_VERSION}:[0-9a-f]{8}$`));
  });

  it('authoring input 改變時 hash 改變', () => {
    const revision = createDefaultSongProject({ revisionId: 'r', now: 1 }).revisions[0];
    const changed = structuredClone(revision);
    changed.constraints.avoid.push('distortion');
    expect(computeRevisionHash(changed)).not.toBe(computeRevisionHash(revision));
  });
});
