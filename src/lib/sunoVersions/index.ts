/**
 * Suno 版本註冊與切換。
 *
 * 未來新增 v6 時：
 *   1. 建立 src/lib/sunoVersions/v6.ts 實作 SunoVersion
 *   2. 在此檔案 SUNO_VERSIONS 中加入 v6
 *   3. （選）修改 ACTIVE_VERSION_ID 或加 UI 切換
 *
 * 其餘程式碼不需改動 — 因為 data.ts 與 promptBuilder.ts 都透過
 * getActiveVersion() 取得。
 */

import type { SunoVersion } from './types';
import { sunoV5_5 } from './v5_5';

/** 全部已支援版本（依 id 索引）。 */
export const SUNO_VERSIONS: Record<string, SunoVersion> = {
  [sunoV5_5.id]: sunoV5_5,
};

/** 目前生效的版本 id。將來可改為從 localStorage / UI 設定讀取。 */
export const ACTIVE_VERSION_ID = 'v5.5';

/** 取得目前生效的 Suno 版本。 */
export function getActiveVersion(): SunoVersion {
  return SUNO_VERSIONS[ACTIVE_VERSION_ID] ?? sunoV5_5;
}

export type { SunoVersion } from './types';
