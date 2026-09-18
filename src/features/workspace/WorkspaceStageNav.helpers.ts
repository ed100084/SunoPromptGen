export const WORKSPACE_STAGE_IDS = ['brief', 'arrangement', 'lyrics', 'prompt', 'results'] as const;

export type WorkspaceStageId = typeof WORKSPACE_STAGE_IDS[number];
export type WorkspaceStageStatus = 'current' | 'completed' | 'upcoming';

export interface WorkspaceStageDefinition {
  id: WorkspaceStageId;
  label: string;
  shortLabel?: string;
  description?: string;
}

export interface WorkspaceStageItem extends WorkspaceStageDefinition {
  index: number;
  status: WorkspaceStageStatus;
}

export const DEFAULT_WORKSPACE_STAGES: readonly WorkspaceStageDefinition[] = [
  { id: 'brief', label: 'Brief', description: '定義創作意圖' },
  { id: 'arrangement', label: 'Arrangement', shortLabel: 'Arrange', description: '規劃編曲與段落' },
  { id: 'lyrics', label: 'Lyrics', description: '撰寫與精修歌詞' },
  { id: 'prompt', label: 'Prompt', description: '檢查生成指令' },
  { id: 'results', label: 'Results', description: '保存與比較結果' },
] as const;

export function isWorkspaceStageId(value: string): value is WorkspaceStageId {
  return WORKSPACE_STAGE_IDS.includes(value as WorkspaceStageId);
}

export function getWorkspaceStageStatus(
  stageId: WorkspaceStageId,
  activeStageId: WorkspaceStageId,
  completedStageIds: readonly WorkspaceStageId[] = [],
): WorkspaceStageStatus {
  if (stageId === activeStageId) return 'current';
  return completedStageIds.includes(stageId) ? 'completed' : 'upcoming';
}

export function buildWorkspaceStageItems(
  activeStageId: WorkspaceStageId,
  completedStageIds: readonly WorkspaceStageId[] = [],
  stages: readonly WorkspaceStageDefinition[] = DEFAULT_WORKSPACE_STAGES,
): WorkspaceStageItem[] {
  const completed = new Set(completedStageIds);
  return stages.map((stage, index) => ({
    ...stage,
    index,
    status: stage.id === activeStageId
      ? 'current'
      : completed.has(stage.id) ? 'completed' : 'upcoming',
  }));
}

export function getAdjacentWorkspaceStage(
  activeStageId: WorkspaceStageId,
  direction: 'previous' | 'next',
  stages: readonly WorkspaceStageDefinition[] = DEFAULT_WORKSPACE_STAGES,
): WorkspaceStageId | null {
  const currentIndex = stages.findIndex((stage) => stage.id === activeStageId);
  if (currentIndex < 0) return null;
  const targetIndex = currentIndex + (direction === 'next' ? 1 : -1);
  return stages[targetIndex]?.id ?? null;
}

export function getWorkspaceProgress(
  completedStageIds: readonly WorkspaceStageId[],
  stages: readonly WorkspaceStageDefinition[] = DEFAULT_WORKSPACE_STAGES,
): number {
  if (stages.length === 0) return 0;
  const stageIds = new Set(stages.map((stage) => stage.id));
  const completedCount = new Set(completedStageIds.filter((id) => stageIds.has(id))).size;
  return Math.round((completedCount / stages.length) * 100);
}
