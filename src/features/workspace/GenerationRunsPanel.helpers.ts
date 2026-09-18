import type { GenerationRun, GenerationRunStatus, Revision } from '../../domain';

export const GENERATION_RUN_STATUSES: readonly GenerationRunStatus[] = [
  'pending',
  'running',
  'succeeded',
  'failed',
  'cancelled',
];

export interface GenerationRunDraft {
  submittedPrompt: string;
  audioUrl: string;
  rating: GenerationRun['rating'];
  notes: string;
  status: GenerationRunStatus;
}

export const EMPTY_GENERATION_RUN_DRAFT: Readonly<GenerationRunDraft> = Object.freeze({
  submittedPrompt: '',
  audioUrl: '',
  rating: null,
  notes: '',
  status: 'pending',
});

export function draftFromGenerationRun(run: GenerationRun): GenerationRunDraft {
  return {
    submittedPrompt: run.submittedPrompt,
    audioUrl: run.audioUrl,
    rating: run.rating,
    notes: run.notes,
    status: run.status,
  };
}

export function toggleComparisonRunId(selectedIds: readonly string[], runId: string): string[] {
  if (selectedIds.includes(runId)) return selectedIds.filter((id) => id !== runId);
  if (selectedIds.length >= 2) return [selectedIds[1], runId];
  return [...selectedIds, runId];
}

export function reconcileComparisonRunIds(
  selectedIds: readonly string[],
  revision: Revision,
): string[] {
  const available = new Set(revision.generationRuns.map((run) => run.id));
  return selectedIds.filter((id) => available.has(id)).slice(0, 2);
}
