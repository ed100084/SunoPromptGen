import { describe, expect, it } from 'vitest';
import {
  appendRevision,
  compareRevisions,
  createDefaultSongProject,
  deleteRevision,
  getActiveRevision,
  selectRevision,
} from './index';

describe('project revision operations', () => {
  it('取得 active revision', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r1', now: 1 });
    expect(getActiveRevision(project).id).toBe('r1');
  });

  it('追加、選取與安全刪除 revision', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r1', now: 1 });
    const nextRevision = structuredClone(project.revisions[0]);
    nextRevision.id = 'r2';
    nextRevision.parentRevisionId = 'r1';
    nextRevision.createdAt = 2;
    const appended = appendRevision(project, nextRevision);
    expect(appended.activeRevisionId).toBe('r2');
    expect(selectRevision(appended, 'r1').activeRevisionId).toBe('r1');
    expect(() => deleteRevision(appended, 'r1')).toThrow('descendants');
    expect(deleteRevision(appended, 'r2').revisions.map((revision) => revision.id)).toEqual(['r1']);
  });

  it('只回傳真正變動的結構化欄位', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r1', now: 1 });
    const before = project.revisions[0];
    const after = structuredClone(before);
    after.generationTarget.model = 'v6-wild';
    after.brief.theme = '新的意圖';
    after.constraints.preserve = ['主旋律'];
    expect(compareRevisions(before, after)).toEqual([
      { field: '模型', before: 'v6', after: 'v6-wild' },
      { field: '創作意圖', before: '', after: '新的意圖' },
      { field: '保留', before: '', after: '主旋律' },
    ]);
  });
});
