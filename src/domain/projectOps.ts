import type { Revision, SongProject } from './model';

export interface StructuredChange {
  field: string;
  before: string;
  after: string;
}

function text(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? '是' : '否';
  return String(value ?? '');
}

export function getActiveRevision(project: SongProject): Revision {
  return project.revisions.find((revision) => revision.id === project.activeRevisionId)
    ?? project.revisions[project.revisions.length - 1];
}

export function appendRevision(project: SongProject, revision: Revision): SongProject {
  if (project.revisions.some((item) => item.id === revision.id)) {
    throw new Error(`Revision already exists: ${revision.id}`);
  }
  if (revision.parentRevisionId && !project.revisions.some((item) => item.id === revision.parentRevisionId)) {
    throw new Error(`Parent revision does not exist: ${revision.parentRevisionId}`);
  }
  return {
    ...project,
    updatedAt: Math.max(project.updatedAt, revision.createdAt),
    activeRevisionId: revision.id,
    revisions: [...project.revisions, structuredClone(revision)],
  };
}

export function selectRevision(project: SongProject, revisionId: string): SongProject {
  if (!project.revisions.some((revision) => revision.id === revisionId)) {
    throw new Error(`Revision does not exist: ${revisionId}`);
  }
  return { ...project, activeRevisionId: revisionId };
}

export function deleteRevision(project: SongProject, revisionId: string): SongProject {
  if (project.revisions.length === 1) throw new Error('Cannot delete the only revision');
  if (project.revisions.some((revision) => revision.parentRevisionId === revisionId)) {
    throw new Error('Cannot delete a revision that has descendants');
  }
  const revisions = project.revisions.filter((revision) => revision.id !== revisionId);
  if (revisions.length === project.revisions.length) throw new Error(`Revision does not exist: ${revisionId}`);
  return {
    ...project,
    activeRevisionId: project.activeRevisionId === revisionId
      ? revisions[revisions.length - 1].id
      : project.activeRevisionId,
    revisions,
  };
}

export function compareRevisions(before: Revision, after: Revision): StructuredChange[] {
  const fields: Array<[string, unknown, unknown]> = [
    ['模型', before.generationTarget.model, after.generationTarget.model],
    ['工作流', before.generationTarget.workflow, after.generationTarget.workflow],
    ['創作意圖', before.brief.theme, after.brief.theme],
    ['曲風', before.brief.genre, after.brief.genre],
    ['情緒弧線', before.brief.moods, after.brief.moods],
    ['整體 Feel', before.brief.additionalDirection, after.brief.additionalDirection],
    ['Tempo', before.arrangement.bpm, after.arrangement.bpm],
    ['調性', before.arrangement.key, after.arrangement.key],
    ['樂器角色', before.arrangement.instruments, after.arrangement.instruments],
    [
      '人聲方向',
      before.vocalIntent.mode === 'vocal' ? before.vocalIntent.descriptors : ['純樂器'],
      after.vocalIntent.mode === 'vocal' ? after.vocalIntent.descriptors : ['純樂器'],
    ],
    ['結構', before.arrangement.sections.map((section) => section.tag), after.arrangement.sections.map((section) => section.tag)],
    ['保留', before.constraints.preserve, after.constraints.preserve],
    ['修改', before.constraints.change, after.constraints.change],
    ['排除', before.constraints.avoid, after.constraints.avoid],
  ];
  return fields
    .map(([field, a, b]) => ({ field, before: text(a), after: text(b) }))
    .filter((change) => change.before !== change.after);
}
