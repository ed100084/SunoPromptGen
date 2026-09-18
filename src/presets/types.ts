import type {
  ArrangementSection,
  CreativeBrief,
  GenerationModel,
  GenerationWorkflow,
  VocalIntent,
} from '../domain/model';

export type V6PresetId =
  | 'mandarin-cinematic-ballad'
  | 'urban-synth-pop'
  | 'live-band'
  | 'anime-ending'
  | 'lofi-instrumental'
  | 'film-score'
  | 'experimental-mashup';

export interface PresetSection {
  tag: string;
  description: string;
  lyrics: string;
  energy: string;
  instrumentation: string;
}

export interface PresetEnergyStage {
  section: string;
  level: 'very-low' | 'low' | 'medium' | 'high' | 'peak';
  direction: string;
}

export interface PresetEnergyArc {
  summary: string;
  stages: PresetEnergyStage[];
}

export interface PresetRecommendation {
  model: GenerationModel;
  workflow: GenerationWorkflow;
  rationale: string;
}

export interface V6Preset {
  id: V6PresetId;
  name: string;
  shortDescription: string;
  tags: string[];
  brief: Omit<CreativeBrief, 'title'>;
  bpm: number | null;
  key: string;
  instruments: string[];
  textures: string[];
  sections: PresetSection[];
  vocalDirection: VocalIntent;
  energyArc: PresetEnergyArc;
  recommendation: PresetRecommendation;
  avoid: string[];
}

export interface PresetApplicableState {
  brief: CreativeBrief;
  arrangement: {
    bpm: number | null;
    key: string;
    structureName: string;
    sections: ArrangementSection[];
    instruments: string[];
    textures: string[];
    cohesion: boolean;
  };
  vocalIntent: VocalIntent;
  constraints: {
    avoid: string[];
  };
  generationTarget: {
    provider: 'suno';
    model: GenerationModel;
    workflow: GenerationWorkflow;
    variant: string | null;
  };
}
