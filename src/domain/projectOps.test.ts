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
    const removed = deleteRevision(appended, 'r2');
    expect(removed.revisions.map((revision) => revision.id)).toEqual(['r1']);
    expect(removed.activeRevisionId).toBe('r1');
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

  it('拒絕重複 revision 與不存在的 parent / selection', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r1', now: 10 });
    const duplicate = structuredClone(project.revisions[0]);
    const orphan = { ...structuredClone(duplicate), id: 'r2', parentRevisionId: 'missing' };

    expect(() => appendRevision(project, duplicate)).toThrow('Revision already exists: r1');
    expect(() => appendRevision(project, orphan)).toThrow('Parent revision does not exist: missing');
    expect(() => selectRevision(project, 'missing')).toThrow('Revision does not exist: missing');
    expect(project.revisions).toHaveLength(1);
  });

  it('append 深層複製 revision 並維持 updatedAt 單調遞增', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r1', now: 10 });
    const revision = structuredClone(project.revisions[0]);
    revision.id = 'r2';
    revision.parentRevisionId = 'r1';
    revision.createdAt = 5;
    revision.brief.moods = ['朦朧'];

    const appended = appendRevision(project, revision);
    revision.brief.moods.push('外部突變');

    expect(appended.updatedAt).toBe(10);
    expect(appended.revisions[1].brief.moods).toEqual(['朦朧']);
    expect(project.revisions).toHaveLength(1);
  });

  it('禁止刪除唯一或不存在的 revision，刪除非 active 不改 active', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r1', now: 1 });
    expect(() => deleteRevision(project, 'r1')).toThrow('Cannot delete the only revision');

    const sibling = structuredClone(project.revisions[0]);
    sibling.id = 'r2';
    sibling.parentRevisionId = null;
    sibling.createdAt = 2;
    const appended = appendRevision(project, sibling);
    const activeFirst = selectRevision(appended, 'r1');

    expect(deleteRevision(activeFirst, 'r2').activeRevisionId).toBe('r1');
    expect(() => deleteRevision(appended, 'missing')).toThrow('Revision does not exist: missing');
  });

  it('比較陣列、布林衍生的人聲與結構文字', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r1', now: 1 });
    const before = project.revisions[0];
    const after = structuredClone(before);
    after.arrangement.sections = [{ tag: 'Verse', description: '', lyrics: '' }, { tag: 'Chorus', description: '', lyrics: '' }];
    after.vocalIntent = { mode: 'instrumental' };
    after.constraints.change = ['鼓組', '速度'];

    expect(compareRevisions(before, after)).toEqual([
      { field: '人聲方向', before: '', after: '純樂器' },
      { field: '結構', before: '', after: 'Verse, Chorus' },
      { field: '修改', before: '', after: '鼓組, 速度' },
    ]);
  });
});
