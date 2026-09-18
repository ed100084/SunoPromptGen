import type {
  GenerationModel,
  GenerationWorkflow,
  Revision,
} from '../domain';

export type { GenerationModel, GenerationWorkflow } from '../domain';

/** Compiler-normalized song facts derived from a canonical revision. */
export interface PromptSong {
  title?: string;
  concept: string;
  language?: string;
  genres?: string[];
  moods?: string[];
  instruments?: string[];
  vocals?: string[];
  tempo?: string;
  key?: string;
  structure?: string[];
  lyrics?: string;
  avoid?: string[];
  notes?: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface EditDirective {
  preserve: string[];
  change: string[];
  scope: string;
}

export interface PromptSource {
  name: string;
  role: string;
  timeRange: TimeRange;
  description?: string;
}

interface TargetBase {
  model: GenerationModel;
  song: PromptSong;
}

export interface CreateTarget extends TargetBase { workflow: 'create' }
export interface ExploreTarget extends TargetBase { workflow: 'explore'; exploration?: string }
export interface EditSectionTarget extends TargetBase { workflow: 'edit-section'; edit: EditDirective }
export interface EditLyricsTarget extends TargetBase { workflow: 'edit-lyrics'; edit: EditDirective }
export interface MashupTarget extends TargetBase { workflow: 'mashup'; sources: PromptSource[] }
export interface SampleTarget extends TargetBase { workflow: 'sample'; source: PromptSource }

/**
 * @deprecated Pass a canonical Revision to compilePrompt. This compatibility shape remains for
 * the existing workspace adapter and derives its model/workflow vocabulary from the domain.
 */
export type PromptCompilerRequest =
  | CreateTarget
  | ExploreTarget
  | EditSectionTarget
  | EditLyricsTarget
  | MashupTarget
  | SampleTarget;

/** @deprecated Compatibility alias; canonical consumers should prefer Revision. */
export type GenerationTarget = PromptCompilerRequest;
export type PromptCompilerInput = Revision | PromptCompilerRequest;

export interface RenderedPromptSection {
  id: string;
  label: string;
  content: string;
}

export interface RenderedPrompt {
  title: string;
  model: GenerationModel;
  workflow: GenerationWorkflow;
  primaryPrompt: string;
  stylePrompt?: string;
  lyricsPrompt?: string;
  warnings: string[];
  sections: RenderedPromptSection[];
}
