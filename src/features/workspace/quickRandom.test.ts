import { describe, expect, it } from 'vitest';
import { createQuickRandomDraft } from './quickRandom';
import type { WorkspaceDraft } from './workspaceReducer';

const draft = {
  title: '保留歌名', concept: '', language: '', genres: '', moods: '', instruments: '', vocals: '', tempo: '', key: '',
  overallFeel: '', structure: '', sections: [], lyrics: '保留歌詞', avoid: '', workflow: 'create', model: 'v6', exploration: '',
  scope: '', preserve: '', change: '', sources: [], rightsConfirmed: false,
} satisfies WorkspaceDraft;

describe('createQuickRandomDraft', () => {
  it('相同 seed 產生相同且完整的創作方向', () => {
    expect(createQuickRandomDraft(draft, 'balanced', 42)).toEqual(createQuickRandomDraft(draft, 'balanced', 42));
    const result = createQuickRandomDraft(draft, 'balanced', 42);
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.concept).not.toBe('');
    expect(result.title).toBe('保留歌名');
    expect(result.lyrics).toBe('保留歌詞');
  });

  it('wild 模式使用 v6-wild 並加入探索方向', () => {
    const result = createQuickRandomDraft(draft, 'wild', 7);
    expect(result.model).toBe('v6-wild');
    expect(result.exploration).toContain('大膽探索');
  });
});
