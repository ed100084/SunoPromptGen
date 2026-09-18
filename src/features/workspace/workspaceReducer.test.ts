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
    const added = workspaceReducer(draft, { type: 'source-add', source: { id: 'b', name: 'B', role: 'drums', range: '0-10' } });
    const updated = workspaceReducer(added, { type: 'source-update', id: 'b', field: 'role', value: 'vocals' });
    expect(updated.sources[1].role).toBe('vocals');
    expect(workspaceReducer(updated, { type: 'source-remove', id: 'b' }).sources).toHaveLength(1);
  });
});
