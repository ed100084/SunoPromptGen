import { describe, expect, it } from 'vitest';
import { analyzeCanonicalInsights } from './insights';
import { createDefaultSongProject, type Revision, type SongProject } from './model';

function revision(
  base: Revision,
  overrides: {
    id: string;
    parentRevisionId?: string | null;
    model?: Revision['generationTarget']['model'];
    workflow?: Revision['generationTarget']['workflow'];
    rating?: Revision['evaluation']['rating'];
    variant?: string | null;
  },
): Revision {
  return {
    ...structuredClone(base),
    id: overrides.id,
    parentRevisionId: overrides.parentRevisionId ?? null,
    generationTarget: {
      ...base.generationTarget,
      model: overrides.model ?? base.generationTarget.model,
      workflow: overrides.workflow ?? base.generationTarget.workflow,
      variant: overrides.variant ?? null,
    },
    evaluation: {
      ...base.evaluation,
      rating: overrides.rating ?? null,
    },
  };
}

function projectWithRevisions(id: string, revisions: Revision[]): SongProject {
  const project = createDefaultSongProject({ id, revisionId: revisions[0].id, now: 1 });
  return {
    ...project,
    activeRevisionId: revisions[revisions.length - 1].id,
    revisions,
  };
}

describe('analyzeCanonicalInsights', () => {
  it('彙整 model、workflow、rating 與 UI-ready shares', () => {
    const seed = createDefaultSongProject({ id: 'seed', revisionId: 'seed-r', now: 1 }).revisions[0];
    const project = projectWithRevisions('native', [
      revision(seed, { id: 'r1', model: 'v6', workflow: 'create', rating: 5 }),
      revision(seed, {
        id: 'r2',
        parentRevisionId: 'r1',
        model: 'v6-wild',
        workflow: 'explore',
        rating: 3,
      }),
      revision(seed, {
        id: 'r3',
        parentRevisionId: 'r2',
        model: 'v6-wild',
        workflow: 'explore',
      }),
    ]);

    const report = analyzeCanonicalInsights([project]);

    expect(report.scope).toMatchObject({
      receivedCount: 1,
      canonicalCount: 1,
      includedProjectCount: 1,
      includedRevisionCount: 3,
    });
    expect(report.models.find(({ key }) => key === 'v6')).toEqual({
      key: 'v6',
      count: 1,
      share: 1 / 3,
      ratedCount: 1,
      averageRating: 5,
    });
    expect(report.models.find(({ key }) => key === 'v6-wild')).toEqual({
      key: 'v6-wild',
      count: 2,
      share: 2 / 3,
      ratedCount: 1,
      averageRating: 3,
    });
    expect(report.workflows.find(({ key }) => key === 'explore')).toMatchObject({
      count: 2,
      ratedCount: 1,
      averageRating: 3,
    });
    expect(report.ratings).toMatchObject({
      ratedRevisionCount: 2,
      unratedRevisionCount: 1,
      average: 4,
    });
    expect(report.ratings.distribution.find(({ key }) => key === 3)).toEqual({
      key: 3,
      count: 1,
      share: 0.5,
    });
    expect(report.ratings.distribution.find(({ key }) => key === 5)).toEqual({
      key: 5,
      count: 1,
      share: 0.5,
    });
  });

  it('依 parentRevisionId 計算 revision depth 與各深度評分', () => {
    const seed = createDefaultSongProject({ revisionId: 'seed', now: 1 }).revisions[0];
    const project = projectWithRevisions('chain', [
      revision(seed, { id: 'root', rating: 2 }),
      revision(seed, { id: 'child', parentRevisionId: 'root', rating: 4 }),
      revision(seed, { id: 'grandchild', parentRevisionId: 'child', rating: 5 }),
      revision(seed, { id: 'branch', parentRevisionId: 'root' }),
    ]);

    const report = analyzeCanonicalInsights([project]);

    expect(report.revisionDepth.maximum).toBe(2);
    expect(report.revisionDepth.average).toBe(1);
    expect(report.revisionDepth.distribution).toEqual([
      { key: 0, count: 1, share: 0.25, ratedCount: 1, averageRating: 2 },
      { key: 1, count: 2, share: 0.5, ratedCount: 1, averageRating: 4 },
      { key: 2, count: 1, share: 0.25, ratedCount: 1, averageRating: 5 },
    ]);
  });

  it('預設隔離 legacy shape 與 migrated canonical project，避免污染統計', () => {
    const seed = createDefaultSongProject({ revisionId: 'seed', now: 1 }).revisions[0];
    const native = projectWithRevisions('native', [
      revision(seed, { id: 'native-r', model: 'v6-wild', workflow: 'sample', rating: 5 }),
    ]);
    const migrated = projectWithRevisions('migrated', [
      revision(seed, {
        id: 'migrated-r',
        model: 'v6',
        workflow: 'create',
        rating: 1,
        variant: 'migrated-from:v5.5',
      }),
    ]);
    const legacy = {
      id: 'legacy-history',
      savedAt: 100,
      state: { genre: 'old schema' },
      result: { rating: 1 },
    };

    const report = analyzeCanonicalInsights([native, migrated, legacy]);

    expect(report.scope).toEqual({
      receivedCount: 3,
      canonicalCount: 2,
      includedProjectCount: 1,
      includedRevisionCount: 1,
      excludedInvalidOrLegacyCount: 1,
      excludedMigratedCount: 1,
    });
    expect(report.ratings.average).toBe(5);
    expect(report.models.find(({ key }) => key === 'v6')).toMatchObject({ count: 0, ratedCount: 0 });
    expect(report.models.find(({ key }) => key === 'v6-wild')).toMatchObject({ count: 1, ratedCount: 1 });
  });

  it('可顯式納入 migrated canonical project', () => {
    const migrated = createDefaultSongProject({ id: 'migrated', revisionId: 'r', now: 1 });
    migrated.revisions[0].generationTarget.variant = 'migrated-from:v5';
    migrated.revisions[0].evaluation.rating = 2;

    const report = analyzeCanonicalInsights([migrated], { includeMigrated: true });

    expect(report.scope.excludedMigratedCount).toBe(0);
    expect(report.scope.includedProjectCount).toBe(1);
    expect(report.ratings.average).toBe(2);
  });

  it('空輸入回傳穩定、無 NaN 的 report shape', () => {
    const report = analyzeCanonicalInsights([]);

    expect(report.ratings.average).toBeNull();
    expect(report.ratings.distribution.every(({ count, share }) => count === 0 && share === 0)).toBe(true);
    expect(report.models.every(({ share, averageRating }) => share === 0 && averageRating === null)).toBe(true);
    expect(report.revisionDepth).toMatchObject({ maximum: 0, average: 0, distribution: [] });
  });

  it('標示 orphan parent，並以 root depth 安全統計', () => {
    const seed = createDefaultSongProject({ revisionId: 'seed', now: 1 }).revisions[0];
    const project = projectWithRevisions('orphan', [
      revision(seed, { id: 'orphan-r', parentRevisionId: 'missing', rating: 4 }),
    ]);

    const report = analyzeCanonicalInsights([project]);

    expect(report.revisionDepth.orphanParentCount).toBe(1);
    expect(report.revisionDepth.distribution[0]).toMatchObject({ key: 0, count: 1 });
  });

  it('遇到循環 parent 鏈不遞迴溢位並回報資料品質', () => {
    const seed = createDefaultSongProject({ revisionId: 'seed', now: 1 }).revisions[0];
    const project = projectWithRevisions('cycle', [
      revision(seed, { id: 'a', parentRevisionId: 'b' }),
      revision(seed, { id: 'b', parentRevisionId: 'a' }),
    ]);

    const report = analyzeCanonicalInsights([project]);

    expect(report.revisionDepth.cyclicParentCount).toBe(2);
    expect(report.revisionDepth.distribution).toEqual([
      { key: 0, count: 2, share: 1, ratedCount: 0, averageRating: null },
    ]);
  });
});
