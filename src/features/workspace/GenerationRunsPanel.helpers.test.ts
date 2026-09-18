import { describe, expect, it } from 'vitest';
import { createDefaultGenerationRun, createDefaultSongProject } from '../../domain';
import {
  draftFromGenerationRun,
  reconcileComparisonRunIds,
  toggleComparisonRunId,
} from './GenerationRunsPanel.helpers';

describe('GenerationRunsPanel helpers', () => {
  it('建立可編輯 draft 且不共用來源物件', () => {
    const run = createDefaultGenerationRun({
      id: 'a', createdAt: 1, submittedPrompt: 'prompt', status: 'succeeded', rating: 5,
    });
    const draft = draftFromGenerationRun(run);

    expect(draft).toEqual({
      submittedPrompt: 'prompt', audioUrl: '', rating: 5, notes: '', status: 'succeeded',
    });
    draft.notes = 'changed';
    expect(run.notes).toBe('');
  });

  it('A/B 選取最多保留兩筆並可取消', () => {
    expect(toggleComparisonRunId([], 'a')).toEqual(['a']);
    expect(toggleComparisonRunId(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleComparisonRunId(['a', 'b'], 'c')).toEqual(['b', 'c']);
    expect(toggleComparisonRunId(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('revision 更新後移除不存在的比較 id', () => {
    const revision = createDefaultSongProject({ revisionId: 'r', now: 1 }).revisions[0];
    revision.generationRuns = [createDefaultGenerationRun({ id: 'b', createdAt: 2 })];

    expect(reconcileComparisonRunIds(['a', 'b', 'c'], revision)).toEqual(['b']);
  });
});
