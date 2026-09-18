export interface StructuredSection {
  id: string;
  name: string;
  role: string;
  energy: string;
  instrumentation: string;
  lyrics: string;
  locked: boolean;
}

export type StructuredSectionEditableField = Exclude<keyof StructuredSection, 'id'>;

export type StructuredSectionAction =
  | { type: 'add'; section: StructuredSection }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; direction: 'up' | 'down' }
  | { type: 'update'; id: string; field: StructuredSectionEditableField; value: string | boolean };

export function createStructuredSection(
  id: string,
  overrides: Partial<Omit<StructuredSection, 'id'>> = {},
): StructuredSection {
  return {
    id,
    name: 'Verse',
    role: '',
    energy: '',
    instrumentation: '',
    lyrics: '',
    locked: false,
    ...overrides,
  };
}

export function moveStructuredSection(
  sections: StructuredSection[],
  id: string,
  direction: 'up' | 'down',
): StructuredSection[] {
  const index = sections.findIndex((section) => section.id === id);
  if (index < 0 || sections[index].locked) return sections;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sections.length || sections[targetIndex].locked) {
    return sections;
  }

  const next = [...sections];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function structuredSectionsReducer(
  sections: StructuredSection[],
  action: StructuredSectionAction,
): StructuredSection[] {
  switch (action.type) {
    case 'add':
      return [...sections, action.section];
    case 'remove': {
      const section = sections.find((candidate) => candidate.id === action.id);
      if (!section || section.locked) return sections;
      return sections.filter((candidate) => candidate.id !== action.id);
    }
    case 'move':
      return moveStructuredSection(sections, action.id, action.direction);
    case 'update': {
      const section = sections.find((candidate) => candidate.id === action.id);
      if (!section || (section.locked && action.field !== 'locked')) {
        return sections;
      }
      return sections.map((candidate) => candidate.id === action.id
        ? { ...candidate, [action.field]: action.value }
        : candidate);
    }
  }
}
