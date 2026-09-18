import { describe, expect, it } from 'vitest';
import {
  buildWorkspaceStageItems,
  DEFAULT_WORKSPACE_STAGES,
  getAdjacentWorkspaceStage,
  getWorkspaceProgress,
  getWorkspaceStageStatus,
  isWorkspaceStageId,
} from './WorkspaceStageNav.helpers';

describe('WorkspaceStageNav helpers', () => {
  it('固定提供五階段並辨識合法 id', () => {
    expect(DEFAULT_WORKSPACE_STAGES.map((stage) => stage.id)).toEqual([
      'brief', 'arrangement', 'lyrics', 'prompt', 'results',
    ]);
    expect(isWorkspaceStageId('prompt')).toBe(true);
    expect(isWorkspaceStageId('publish')).toBe(false);
  });

  it('目前階段優先於完成狀態', () => {
    expect(getWorkspaceStageStatus('lyrics', 'lyrics', ['brief', 'lyrics'])).toBe('current');
    expect(getWorkspaceStageStatus('brief', 'lyrics', ['brief'])).toBe('completed');
    expect(getWorkspaceStageStatus('prompt', 'lyrics', ['brief'])).toBe('upcoming');
  });

  it('建立具順序與狀態的導覽項目且不突變輸入', () => {
    const completed = ['brief', 'arrangement'] as const;
    const items = buildWorkspaceStageItems('lyrics', completed);

    expect(items.map(({ id, index, status }) => ({ id, index, status }))).toEqual([
      { id: 'brief', index: 0, status: 'completed' },
      { id: 'arrangement', index: 1, status: 'completed' },
      { id: 'lyrics', index: 2, status: 'current' },
      { id: 'prompt', index: 3, status: 'upcoming' },
      { id: 'results', index: 4, status: 'upcoming' },
    ]);
    expect(completed).toEqual(['brief', 'arrangement']);
  });

  it('取得相鄰階段並處理邊界', () => {
    expect(getAdjacentWorkspaceStage('lyrics', 'previous')).toBe('arrangement');
    expect(getAdjacentWorkspaceStage('lyrics', 'next')).toBe('prompt');
    expect(getAdjacentWorkspaceStage('brief', 'previous')).toBeNull();
    expect(getAdjacentWorkspaceStage('results', 'next')).toBeNull();
  });

  it('只計算流程內不重複的完成階段', () => {
    expect(getWorkspaceProgress(['brief', 'brief', 'lyrics'])).toBe(40);
    expect(getWorkspaceProgress([])).toBe(0);
    expect(getWorkspaceProgress(['brief'], [])).toBe(0);
  });
});
