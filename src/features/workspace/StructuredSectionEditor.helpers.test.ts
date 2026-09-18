import { describe, expect, it } from 'vitest';
import {
  createStructuredSection,
  moveStructuredSection,
  structuredSectionsReducer,
  type StructuredSection,
} from './StructuredSectionEditor.helpers';

const sections: StructuredSection[] = [
  createStructuredSection('intro', { name: 'Intro' }),
  createStructuredSection('verse', { name: 'Verse', role: '建立故事' }),
  createStructuredSection('chorus', { name: 'Chorus', energy: 'high' }),
];

describe('createStructuredSection', () => {
  it('建立完整預設值並套用覆寫', () => {
    expect(createStructuredSection('new', { name: 'Bridge', locked: true })).toEqual({
      id: 'new',
      name: 'Bridge',
      role: '',
      energy: '',
      instrumentation: '',
      lyrics: '',
      locked: true,
    });
  });
});

describe('moveStructuredSection', () => {
  it('依 id 上移或下移且不突變原陣列', () => {
    const movedUp = moveStructuredSection(sections, 'verse', 'up');
    const movedDown = moveStructuredSection(sections, 'verse', 'down');

    expect(movedUp.map((section) => section.id)).toEqual(['verse', 'intro', 'chorus']);
    expect(movedDown.map((section) => section.id)).toEqual(['intro', 'chorus', 'verse']);
    expect(sections.map((section) => section.id)).toEqual(['intro', 'verse', 'chorus']);
  });

  it('邊界、未知 id 或鎖定段落不移動', () => {
    const locked = sections.map((section) => section.id === 'verse' ? { ...section, locked: true } : section);
    expect(moveStructuredSection(sections, 'intro', 'up')).toBe(sections);
    expect(moveStructuredSection(sections, 'missing', 'down')).toBe(sections);
    expect(moveStructuredSection(locked, 'verse', 'down')).toBe(locked);
  });

  it('不跨越相鄰的鎖定段落', () => {
    const lockedIntro = sections.map((section) => section.id === 'intro' ? { ...section, locked: true } : section);
    expect(moveStructuredSection(lockedIntro, 'verse', 'up')).toBe(lockedIntro);
  });
});

describe('structuredSectionsReducer', () => {
  it('新增與刪除段落', () => {
    const addedSection = createStructuredSection('outro', { name: 'Outro' });
    const added = structuredSectionsReducer(sections, { type: 'add', section: addedSection });
    const removed = structuredSectionsReducer(added, { type: 'remove', id: 'verse' });

    expect(added.at(-1)).toBe(addedSection);
    expect(removed.map((section) => section.id)).toEqual(['intro', 'chorus', 'outro']);
    expect(sections).toHaveLength(3);
  });

  it('只更新目標段落並保留其他物件參照', () => {
    const updated = structuredSectionsReducer(sections, {
      type: 'update',
      id: 'verse',
      field: 'instrumentation',
      value: 'muted guitar',
    });

    expect(updated[1].instrumentation).toBe('muted guitar');
    expect(updated[1]).not.toBe(sections[1]);
    expect(updated[0]).toBe(sections[0]);
    expect(sections[1].instrumentation).toBe('');
  });

  it('鎖定後禁止編輯、刪除與排序，但仍可解鎖', () => {
    const locked = structuredSectionsReducer(sections, {
      type: 'update', id: 'verse', field: 'locked', value: true,
    });

    expect(structuredSectionsReducer(locked, {
      type: 'update', id: 'verse', field: 'lyrics', value: '不可更新',
    })).toBe(locked);
    expect(structuredSectionsReducer(locked, { type: 'remove', id: 'verse' })).toBe(locked);
    expect(structuredSectionsReducer(locked, { type: 'move', id: 'verse', direction: 'down' })).toBe(locked);

    const unlocked = structuredSectionsReducer(locked, {
      type: 'update', id: 'verse', field: 'locked', value: false,
    });
    expect(unlocked[1].locked).toBe(false);
  });

  it('未知 id 是 no-op', () => {
    expect(structuredSectionsReducer(sections, {
      type: 'update', id: 'missing', field: 'name', value: 'Missing',
    })).toBe(sections);
    expect(structuredSectionsReducer(sections, { type: 'remove', id: 'missing' })).toBe(sections);
  });
});
