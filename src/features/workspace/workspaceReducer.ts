import type { GenerationModel, GenerationWorkflow } from '../../domain';

export interface WorkspaceSourceDraft {
  id: string;
  name: string;
  role: string;
  range: string;
}

export interface WorkspaceDraft {
  title: string;
  concept: string;
  language: string;
  genres: string;
  moods: string;
  instruments: string;
  vocals: string;
  tempo: string;
  key: string;
  overallFeel: string;
  structure: string;
  lyrics: string;
  avoid: string;
  workflow: GenerationWorkflow;
  model: GenerationModel;
  exploration: string;
  scope: string;
  preserve: string;
  change: string;
  sources: WorkspaceSourceDraft[];
  rightsConfirmed: boolean;
}

export type WorkspaceAction =
  | { type: 'replace'; draft: WorkspaceDraft }
  | { type: 'set'; key: keyof WorkspaceDraft; value: WorkspaceDraft[keyof WorkspaceDraft] }
  | { type: 'source-update'; id: string; field: 'name' | 'role' | 'range'; value: string }
  | { type: 'source-add'; source: WorkspaceSourceDraft }
  | { type: 'source-remove'; id: string };

export function workspaceReducer(state: WorkspaceDraft, action: WorkspaceAction): WorkspaceDraft {
  switch (action.type) {
    case 'replace': return structuredClone(action.draft);
    case 'set': return { ...state, [action.key]: action.value };
    case 'source-update': return {
      ...state,
      sources: state.sources.map((source) => source.id === action.id
        ? { ...source, [action.field]: action.value }
        : source),
    };
    case 'source-add': return { ...state, sources: [...state.sources, action.source] };
    case 'source-remove': return { ...state, sources: state.sources.filter((source) => source.id !== action.id) };
  }
}
