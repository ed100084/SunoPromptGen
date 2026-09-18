import { describe, expect, it } from 'vitest';
import {
  appendGenerationRun,
  createDefaultGenerationRun,
  createDefaultSongProject,
  createPersistedProjectEnvelope,
  decodePersistedProjectEnvelope,
  deleteGenerationRun,
  isGenerationRun,
  isSongProject,
  updateGenerationRun,
} from './index';

describe('GenerationRun canonical domain', () => {
  it('建立完整預設值並驗證必要欄位', () => {
    const run = createDefaultGenerationRun({ id: 'run-1', createdAt: 10 });

    expect(run).toEqual({
      id: 'run-1',
      createdAt: 10,
      model: 'v6',
      workflow: 'create',
      audioUrl: '',
      rating: null,
      notes: '',
      status: 'pending',
    });
    expect(isGenerationRun(run)).toBe(true);
    expect(isGenerationRun({ ...run, status: 'unknown' })).toBe(false);
    expect(isGenerationRun({ ...run, rating: 6 })).toBe(false);
  });

  it('允許每個 revision 保存多筆且 run id 必須唯一', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r', now: 1 });
    project.revisions[0].generationRuns = [
      createDefaultGenerationRun({ id: 'a', createdAt: 2 }),
      createDefaultGenerationRun({ id: 'b', createdAt: 3, status: 'succeeded', rating: 5 }),
    ];

    expect(isSongProject(project)).toBe(true);
    project.revisions[0].generationRuns.push({ ...project.revisions[0].generationRuns[0] });
    expect(isSongProject(project)).toBe(false);
  });
});

describe('GenerationRun pure operations', () => {
  it('append/update/delete 不突變來源 revision', () => {
    const original = createDefaultSongProject({ revisionId: 'r', now: 1 }).revisions[0];
    const run = createDefaultGenerationRun({ id: 'run', createdAt: 2 });
    const appended = appendGenerationRun(original, run);
    const updated = updateGenerationRun(appended, 'run', {
      status: 'succeeded', audioUrl: 'https://example.com/audio.mp3', rating: 4, notes: 'good',
    });
    const removed = deleteGenerationRun(updated, 'run');

    expect(original.generationRuns).toEqual([]);
    expect(appended.generationRuns?.[0]).not.toBe(run);
    expect(updated.generationRuns?.[0]).toMatchObject({ status: 'succeeded', rating: 4 });
    expect(removed.generationRuns).toEqual([]);
    expect(() => appendGenerationRun(appended, run)).toThrow('already exists');
    expect(() => updateGenerationRun(original, 'missing', { notes: 'x' })).toThrow('does not exist');
  });
});

describe('legacy evaluation persistence migration', () => {
  it('在相同 schemaVersion 讀取舊 envelope 時轉成一筆 generation run', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 });
    const envelope = createPersistedProjectEnvelope(project, 30) as unknown as {
      project: { revisions: Array<Record<string, unknown>> };
    };
    const legacyRevision = envelope.project.revisions[0];
    delete legacyRevision.generationRuns;
    legacyRevision.evaluation = {
      rating: 5,
      audioUrl: 'https://example.com/legacy.mp3',
      notes: 'legacy note',
      evaluatedAt: 20,
    };

    const decoded = decodePersistedProjectEnvelope(envelope);

    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.value.project.revisions[0].generationRuns).toEqual([{
      id: 'r-legacy-evaluation',
      createdAt: 20,
      model: 'v6',
      workflow: 'create',
      audioUrl: 'https://example.com/legacy.mp3',
      rating: 5,
      notes: 'legacy note',
      status: 'succeeded',
    }]);
  });

  it('空白 legacy evaluation 遷移為空陣列且不突變輸入', () => {
    const envelope = createPersistedProjectEnvelope(
      createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 }),
      30,
    );
    const legacy = structuredClone(envelope) as unknown as {
      project: { revisions: Array<Record<string, unknown>> };
    };
    delete legacy.project.revisions[0].generationRuns;

    const decoded = decodePersistedProjectEnvelope(legacy);

    expect(decoded.ok && decoded.value.project.revisions[0].generationRuns).toEqual([]);
    expect('generationRuns' in legacy.project.revisions[0]).toBe(false);
  });
});
