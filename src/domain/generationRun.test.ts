import { describe, expect, it } from 'vitest';
import {
  appendGenerationRun,
  createDefaultGenerationRun,
  createDefaultSongProject,
  createPersistedProjectEnvelope,
  decodePersistedProjectEnvelope,
  compareGenerationRuns,
  deleteGenerationRun,
  isGenerationRun,
  isSongProject,
  markBestGenerationRun,
  setGenerationRunStatus,
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
      submittedPrompt: 'actual prompt', status: 'succeeded', audioUrl: 'https://example.com/audio.mp3', rating: 4, notes: 'good',
    });
    const removed = deleteGenerationRun(updated, 'run');

    expect(original.generationRuns).toEqual([]);
    expect(appended.generationRuns?.[0]).not.toBe(run);
    expect(updated.generationRuns?.[0]).toMatchObject({ submittedPrompt: 'actual prompt', status: 'succeeded', rating: 4 });
    expect(removed.generationRuns).toEqual([]);
    expect(() => appendGenerationRun(appended, run)).toThrow('already exists');
    expect(() => updateGenerationRun(original, 'missing', { notes: 'x' })).toThrow('does not exist');
  });

  it('切換狀態、唯一最佳結果與兩筆 A/B 比較', () => {
    const original = createDefaultSongProject({ revisionId: 'r', now: 1 }).revisions[0];
    const withA = appendGenerationRun(original, createDefaultGenerationRun({ id: 'a', createdAt: 2, submittedPrompt: 'A' }));
    const withBoth = appendGenerationRun(withA, createDefaultGenerationRun({ id: 'b', createdAt: 3, submittedPrompt: 'B', isBest: true }));
    const bestA = markBestGenerationRun(withBoth, 'a');
    const runningA = setGenerationRunStatus(bestA, 'a', 'running');
    const comparison = compareGenerationRuns(runningA, 'a', 'b');

    expect(runningA.generationRuns.map((run) => [run.id, run.isBest, run.status])).toEqual([
      ['a', true, 'running'],
      ['b', false, 'pending'],
    ]);
    expect(comparison.left.submittedPrompt).toBe('A');
    expect(comparison.right.submittedPrompt).toBe('B');
    expect(comparison.left).not.toBe(runningA.generationRuns[0]);
    expect(() => compareGenerationRuns(runningA, 'a', 'a')).toThrow('different');
  });
});

describe('legacy evaluation persistence migration', () => {
  it('在相同 schemaVersion 讀取舊 envelope 時轉成一筆 generation run', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 });
    const envelope = createPersistedProjectEnvelope(project, 30) as unknown as {
      schemaVersion: number;
      project: { domainVersion: number; revisions: Array<Record<string, unknown>> };
    };
    envelope.schemaVersion = 2;
    envelope.project.domainVersion = 7;
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
      compilerVersion: null,
      revisionHash: null,
      externalSongId: null,
      externalJobId: null,
      seed: null,
      actualModelVersion: null,
      tags: [],
      submittedPrompt: '',
      audioUrl: 'https://example.com/legacy.mp3',
      rating: 5,
      notes: 'legacy note',
      status: 'succeeded',
      isBest: false,
      bestReason: null,
    }]);
    expect('evaluation' in decoded.value.project.revisions[0]).toBe(false);
  });

  it('補齊舊 generation run 新欄位且不突變輸入', () => {
    const envelope = createPersistedProjectEnvelope(
      createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 }),
      30,
    ) as unknown as {
      schemaVersion: number;
      project: { domainVersion: number; revisions: Array<{ generationRuns: Array<Record<string, unknown>> }> };
    };
    envelope.schemaVersion = 2;
    envelope.project.domainVersion = 7;
    const legacyRun = createDefaultGenerationRun({ id: 'old-run', createdAt: 11 });
    delete (legacyRun as unknown as Record<string, unknown>).submittedPrompt;
    delete (legacyRun as unknown as Record<string, unknown>).isBest;
    envelope.project.revisions[0].generationRuns = [legacyRun as unknown as Record<string, unknown>];
    const input = structuredClone(envelope);

    const decoded = decodePersistedProjectEnvelope(input);

    expect(decoded.ok && decoded.value.project.revisions[0].generationRuns[0]).toMatchObject({
      id: 'old-run', submittedPrompt: '', isBest: false,
    });
    expect('submittedPrompt' in input.project.revisions[0].generationRuns[0]).toBe(false);
  });

  it('空白 legacy evaluation 遷移為空陣列且不突變輸入', () => {
    const envelope = createPersistedProjectEnvelope(
      createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 }),
      30,
    );
    const legacy = structuredClone(envelope) as unknown as {
      schemaVersion: number;
      project: { domainVersion: number; revisions: Array<Record<string, unknown>> };
    };
    legacy.schemaVersion = 1;
    legacy.project.domainVersion = 6;
    delete legacy.project.revisions[0].generationRuns;
    legacy.project.revisions[0].evaluation = {
      rating: null, audioUrl: '', notes: '', evaluatedAt: null,
    };

    const decoded = decodePersistedProjectEnvelope(legacy);

    expect(decoded.ok && decoded.value.project.revisions[0].generationRuns).toEqual([]);
    expect(decoded.ok && 'evaluation' in decoded.value.project.revisions[0]).toBe(false);
    expect('generationRuns' in legacy.project.revisions[0]).toBe(false);
  });

  it('現行 schema 不接受 legacy evaluation，僅 legacy schema migration 邊界可轉換', () => {
    const current = createPersistedProjectEnvelope(
      createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 }),
      30,
    ) as unknown as { project: { revisions: Array<Record<string, unknown>> } };
    delete current.project.revisions[0].generationRuns;
    current.project.revisions[0].evaluation = {
      rating: 4, audioUrl: '', notes: 'legacy', evaluatedAt: 20,
    };

    expect(decodePersistedProjectEnvelope(current).ok).toBe(false);
  });

  it('重複解碼已遷移 envelope 不會新增第二筆 legacy run', () => {
    const legacy = createPersistedProjectEnvelope(
      createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 }),
      30,
    ) as unknown as {
      schemaVersion: number;
      project: { domainVersion: number; revisions: Array<Record<string, unknown>> };
    };
    legacy.schemaVersion = 2;
    legacy.project.domainVersion = 7;
    delete legacy.project.revisions[0].generationRuns;
    legacy.project.revisions[0].evaluation = {
      rating: 4, audioUrl: '', notes: 'once', evaluatedAt: 20,
    };

    const first = decodePersistedProjectEnvelope(legacy);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = decodePersistedProjectEnvelope(first.value);

    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.project.revisions[0].generationRuns).toHaveLength(1);
    expect(second.value.project.revisions[0].generationRuns[0].id).toBe('r-legacy-evaluation');
  });
});
