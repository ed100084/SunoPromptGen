import {
  isSongProject,
  type GenerationModel,
  type GenerationWorkflow,
  type Revision,
  type SongProject,
} from './model';

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface InsightsV2Options {
  /** Include canonical projects produced by the legacy migration adapter. Defaults to false. */
  includeMigrated?: boolean;
  /** Run groups below this size are marked low-sample. Defaults to 5. */
  lowSampleThreshold?: number;
}

export interface CountShare<T extends string | number> {
  key: T;
  count: number;
  share: number;
}

export interface PerformanceBreakdown<T extends string> extends CountShare<T> {
  ratedCount: number;
  averageRating: number | null;
}

export interface RevisionDepthBucket extends CountShare<number> {
  ratedCount: number;
  averageRating: number | null;
}

export interface RunGroupInsight {
  key: string;
  count: number;
  ratedCount: number;
  succeededCount: number;
  successRate: number | null;
  averageRating: number | null;
  bestCount: number;
  bestRate: number | null;
  lowSample: boolean;
}

export interface InsightsV2Report {
  /** Explicit scope metadata lets the UI explain which records were excluded. */
  scope: {
    receivedCount: number;
    canonicalCount: number;
    includedProjectCount: number;
    includedRevisionCount: number;
    excludedInvalidOrLegacyCount: number;
    excludedMigratedCount: number;
  };
  models: PerformanceBreakdown<GenerationModel>[];
  workflows: PerformanceBreakdown<GenerationWorkflow>[];
  /** Correlational product analytics only; these summaries do not establish causality. */
  runAnalytics: {
    disclaimer: string;
    lowSampleThreshold: number;
    totalRuns: number;
    groups: {
      models: RunGroupInsight[];
      workflows: RunGroupInsight[];
      presets: RunGroupInsight[];
      tags: RunGroupInsight[];
    };
    bestVsOthers: {
      best: RunGroupInsight;
      others: RunGroupInsight;
    };
  };
  ratings: {
    ratedRevisionCount: number;
    unratedRevisionCount: number;
    average: number | null;
    distribution: CountShare<Rating>[];
  };
  revisionDepth: {
    /** Root revisions have depth 0. */
    maximum: number;
    average: number;
    distribution: RevisionDepthBucket[];
    orphanParentCount: number;
    cyclicParentCount: number;
  };
}

interface RevisionObservation {
  revision: Revision;
  depth: number;
}

function revisionRating(revision: Revision): Rating | null {
  const runs = revision.generationRuns ?? [];
  for (let index = runs.length - 1; index >= 0; index -= 1) {
    const rating = runs[index].rating;
    if (rating !== null) return rating;
  }
  return null;
}

const MODELS: readonly GenerationModel[] = ['v6', 'v6-wild', 'v6-mini'];
const WORKFLOWS: readonly GenerationWorkflow[] = [
  'create',
  'explore',
  'edit-section',
  'edit-lyrics',
  'mashup',
  'sample',
];
const RATINGS: readonly Rating[] = [1, 2, 3, 4, 5];

function share(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

function average(values: readonly number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isMigratedProject(project: SongProject): boolean {
  return project.revisions.some((revision) =>
    revision.generationTarget.variant?.startsWith('migrated-from:') === true,
  );
}

function resolveRevisionDepths(project: SongProject): {
  depths: Map<string, number>;
  orphanParentCount: number;
  cyclicParentCount: number;
} {
  const byId = new Map(project.revisions.map((revision) => [revision.id, revision]));
  const depths = new Map<string, number>();
  const orphanIds = new Set<string>();
  const cyclicIds = new Set<string>();

  const visit = (revision: Revision, path: string[]): number => {
    const cached = depths.get(revision.id);
    if (cached !== undefined) return cached;

    const cycleStart = path.indexOf(revision.id);
    if (cycleStart >= 0) {
      for (const id of path.slice(cycleStart)) cyclicIds.add(id);
      return 0;
    }

    if (revision.parentRevisionId === null) {
      depths.set(revision.id, 0);
      return 0;
    }

    const parent = byId.get(revision.parentRevisionId);
    if (!parent) {
      orphanIds.add(revision.id);
      depths.set(revision.id, 0);
      return 0;
    }

    const parentDepth = visit(parent, [...path, revision.id]);
    const depth = cyclicIds.has(revision.id) ? 0 : parentDepth + 1;
    depths.set(revision.id, depth);
    return depth;
  };

  for (const revision of project.revisions) visit(revision, []);

  return {
    depths,
    orphanParentCount: orphanIds.size,
    cyclicParentCount: cyclicIds.size,
  };
}

type RunObservation = Revision['generationRuns'][number];

function summarizeRunGroup(key: string, runs: readonly RunObservation[], lowSampleThreshold: number): RunGroupInsight {
  const ratings = runs.map((run) => run.rating).filter((rating): rating is Rating => rating !== null);
  const succeededCount = runs.filter((run) => run.status === 'succeeded').length;
  const bestCount = runs.filter((run) => run.isBest).length;
  return {
    key,
    count: runs.length,
    ratedCount: ratings.length,
    succeededCount,
    successRate: runs.length === 0 ? null : succeededCount / runs.length,
    averageRating: average(ratings),
    bestCount,
    bestRate: runs.length === 0 ? null : bestCount / runs.length,
    lowSample: runs.length < lowSampleThreshold,
  };
}

function groupRuns(
  runs: readonly RunObservation[],
  keysForRun: (run: RunObservation) => readonly string[],
  lowSampleThreshold: number,
): RunGroupInsight[] {
  const groups = new Map<string, RunObservation[]>();
  for (const run of runs) {
    for (const key of new Set(keysForRun(run).filter(Boolean))) {
      groups.set(key, [...(groups.get(key) ?? []), run]);
    }
  }
  return [...groups.entries()]
    .map(([key, matching]) => summarizeRunGroup(key, matching, lowSampleThreshold))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function buildPerformanceBreakdown<T extends string>(
  keys: readonly T[],
  observations: readonly RevisionObservation[],
  pick: (revision: Revision) => T,
): PerformanceBreakdown<T>[] {
  return keys.map((key) => {
    const matching = observations.filter(({ revision }) => pick(revision) === key);
    const ratings = matching
      .map(({ revision }) => revisionRating(revision))
      .filter((rating): rating is Rating => rating !== null);
    return {
      key,
      count: matching.length,
      share: share(matching.length, observations.length),
      ratedCount: ratings.length,
      averageRating: average(ratings),
    };
  });
}

/**
 * Build UI-ready Insights v2 from canonical SongProject records.
 *
 * Unknown/legacy inputs are rejected with `isSongProject`. Canonical projects carrying
 * a `migrated-from:*` variant are excluded by default, so imported historical data cannot
 * silently distort native v6 model/workflow performance.
 */
export function analyzeCanonicalInsights(
  inputs: readonly unknown[],
  options: InsightsV2Options = {},
): InsightsV2Report {
  const canonical = inputs.filter(isSongProject);
  const migrated = canonical.filter(isMigratedProject);
  const projects = options.includeMigrated
    ? canonical
    : canonical.filter((project) => !isMigratedProject(project));

  let orphanParentCount = 0;
  let cyclicParentCount = 0;
  const observations: RevisionObservation[] = [];

  for (const project of projects) {
    const resolved = resolveRevisionDepths(project);
    orphanParentCount += resolved.orphanParentCount;
    cyclicParentCount += resolved.cyclicParentCount;
    for (const revision of project.revisions) {
      observations.push({ revision, depth: resolved.depths.get(revision.id) ?? 0 });
    }
  }

  const ratings = observations
    .map(({ revision }) => revisionRating(revision))
    .filter((rating): rating is Rating => rating !== null);
  const depthValues = observations.map(({ depth }) => depth);
  const depthKeys = [...new Set(depthValues)].sort((a, b) => a - b);
  const runs = observations.flatMap(({ revision }) => revision.generationRuns);
  const lowSampleThreshold = Number.isInteger(options.lowSampleThreshold) && (options.lowSampleThreshold ?? 0) > 0
    ? options.lowSampleThreshold as number
    : 5;
  const bestRuns = runs.filter((run) => run.isBest);
  const otherRuns = runs.filter((run) => !run.isBest);

  return {
    scope: {
      receivedCount: inputs.length,
      canonicalCount: canonical.length,
      includedProjectCount: projects.length,
      includedRevisionCount: observations.length,
      excludedInvalidOrLegacyCount: inputs.length - canonical.length,
      excludedMigratedCount: options.includeMigrated ? 0 : migrated.length,
    },
    models: buildPerformanceBreakdown(MODELS, observations, (revision) => revision.generationTarget.model),
    workflows: buildPerformanceBreakdown(
      WORKFLOWS,
      observations,
      (revision) => revision.generationTarget.workflow,
    ),
    runAnalytics: {
      disclaimer: '相關性與產品分析摘要，不代表因果關係。',
      lowSampleThreshold,
      totalRuns: runs.length,
      groups: {
        models: groupRuns(runs, (run) => [run.actualModelVersion ?? run.model], lowSampleThreshold),
        workflows: groupRuns(runs, (run) => [run.workflow], lowSampleThreshold),
        presets: groupRuns(runs, (run) => run.tags.filter((tag) => tag.startsWith('preset:')).map((tag) => tag.slice(7)), lowSampleThreshold),
        tags: groupRuns(runs, (run) => run.tags, lowSampleThreshold),
      },
      bestVsOthers: {
        best: summarizeRunGroup('best', bestRuns, lowSampleThreshold),
        others: summarizeRunGroup('others', otherRuns, lowSampleThreshold),
      },
    },
    ratings: {
      ratedRevisionCount: ratings.length,
      unratedRevisionCount: observations.length - ratings.length,
      average: average(ratings),
      distribution: RATINGS.map((rating) => {
        const count = ratings.filter((value) => value === rating).length;
        return { key: rating, count, share: share(count, ratings.length) };
      }),
    },
    revisionDepth: {
      maximum: depthValues.length === 0 ? 0 : Math.max(...depthValues),
      average: average(depthValues) ?? 0,
      distribution: depthKeys.map((depth) => {
        const matching = observations.filter((observation) => observation.depth === depth);
        const matchingRatings = matching
          .map(({ revision }) => revisionRating(revision))
          .filter((rating): rating is Rating => rating !== null);
        return {
          key: depth,
          count: matching.length,
          share: share(matching.length, observations.length),
          ratedCount: matchingRatings.length,
          averageRating: average(matchingRatings),
        };
      }),
      orphanParentCount,
      cyclicParentCount,
    },
  };
}
