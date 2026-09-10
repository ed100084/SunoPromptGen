import { describe, expect, it } from 'vitest';
import { ACTIVE_VERSION_ID, getActiveVersion, SUNO_VERSIONS } from './index';

describe('sunoVersions registry', () => {
  it('同時保留 v5.5 與 v6', () => {
    expect(SUNO_VERSIONS['v5.5']?.id).toBe('v5.5');
    expect(SUNO_VERSIONS.v6?.id).toBe('v6');
  });

  it('預設使用 v6', () => {
    expect(ACTIVE_VERSION_ID).toBe('v6');
    expect(getActiveVersion().id).toBe('v6');
  });
});
