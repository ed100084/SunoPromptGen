import { describe, expect, it } from 'vitest';
import { workspaceReducer, type WorkspaceDraft } from './workspaceReducer';

const draft = {
  title: '', concept: '', language: '', genres: '', moods: '', instruments: '', vocals: '', tempo: '', key: '',
  overallFeel: '', structure: '', lyrics: '', avoid: '', workflow: 'create', model: 'v6', exploration: '', scope: '',
  preserve: '', change: '', sources: [{ id: 'a', name: '', role: '', range: '' }], rightsConfirmed: false,
} satisfies WorkspaceDraft;

describe('workspaceReducer', () => {
  it('更新欄位但不改變原狀態', () => {
    const next = workspaceReducer(draft, { type: 'set', key: 'title', value: '新歌' });
    expect(next.title).toBe('新歌');
    expect(draft.title).toBe('');
  });

  it('增刪及更新動態來源', () => {
    const source = { id: 'b', name: 'B', role: 'drums', range: '0-10' };
    const added = workspaceReducer(draft, { type: 'source-add', source });
    const updated = workspaceReducer(added, { type: 'source-update', id: 'b', field: 'role', value: 'vocals' });

    expect(updated.sources[1].role).toBe('vocals');
    expect(added.sources[1].role).toBe('drums');
    expect(updated.sources[0]).toBe(added.sources[0]);
    expect(workspaceReducer(updated, { type: 'source-remove', id: 'b' }).sources).toEqual([draft.sources[0]]);
  });

  it('replace 深層複製傳入草稿，避免後續互相污染', () => {
    const replacement = { ...draft, title: '匯入歌曲', sources: [{ id: 'x', name: '參考', role: 'vocal', range: '10-20' }] };
    const next = workspaceReducer(draft, { type: 'replace', draft: replacement });

    expect(next).toEqual(replacement);
    expect(next).not.toBe(replacement);
    expect(next.sources).not.toBe(replacement.sources);
    replacement.sources[0].name = '外部突變';
    expect(next.sources[0].name).toBe('參考');
  });

  it('找不到來源時保持來源陣列內容，移除也不誤刪', () => {
    const updated = workspaceReducer(draft, { type: 'source-update', id: 'missing', field: 'name', value: '錯誤更新' });
    const removed = workspaceReducer(draft, { type: 'source-remove', id: 'missing' });

    expect(updated.sources).toEqual(draft.sources);
    expect(removed.sources).toEqual(draft.sources);
  });
});
