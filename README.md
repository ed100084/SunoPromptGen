# Suno Prompt Generator

中文友善的 **Suno v6 Creative Workspace** — 從創作意圖建立新歌、探索變體、局部改歌詞或編曲，並產生可複製的 Suno 指令。
PWA 可離線使用，每次 push 自動部署到 GitHub Pages。

> v6-first 重寫版不直接呼叫 Suno；它將 Creative Brief 編譯成可貼入 Suno 的指令。v6 與 v6-wild 依官方說明僅供付費方案使用。

🌐 線上版：<https://ed100084.github.io/SunoPromptGen/>

---

## v6-first 工作流

- **Create** — 從一句話 Brief、整體 Feel、編制、人聲與結構產生完整指令
- **Explore** — 以 v6-wild 描述探索軸線，保留核心並打開大膽變化
- **Edit Section / Lyrics** — 明確指定 Scope、Preserve 與 Change，避免重建整首作品
- **Mashup / Sample** — 為每個來源指定角色與時間範圍，並提示素材權利確認
- **v6 Preset 系統** — 7 組完整創作方向，可一次套用 brief、段落、演唱方向、能量弧線與模型／工作流建議
- **Structured Section Editor** — canonical schema 完整保存每段 ID、名稱、角色、能量、編制、歌詞與鎖定狀態，並支援新增、刪除及排序
- **Generation Runs** — 每個 Revision 可保存、編輯與刪除多次生成結果，包含實際 submitted prompt、音檔 URL、狀態、備註、獨立評分、最佳結果與 A/B 比較
- **Prompt Quality Review** — 檢查矛盾方向、缺少 edit scope、來源資訊、過度抽象與 competing styles；所有檢查均標示為產品 heuristic，並非 Suno 官方規格
- **Generation Run 可追溯性** — 保存 compiler 版本、Revision hash、外部 Song/Job ID、seed、實際模型版本、tags 與最佳結果原因
- **五階段工作流** — Brief、Arrangement、Lyrics、Prompt、Results 導覽，桌面與行動版皆可快速定位
- **Generation Run 紀錄** — 同一 Revision 可保存多次輸出、音檔網址、狀態、備註與個別星等，不再把一次評分等同整個版本
- **Project Revisions** — 保存父子版本、模型與工作流，可從任意舊版建立分支、評分、刪除 leaf revision，並顯示結構化差異
- **備份與還原** — 版本化 Project envelope 匯入／匯出；匯入預設合併並以相同 project id 更新，不會清空其他作品
- **IndexedDB 優先** — 專案預設寫入 IndexedDB，不可用時才降級至 localStorage
- **Legacy Migration** — 首次載入時把舊 `suno_history_v1` 歷史安全遷移到版本化 Project envelope

### 🎼 Prompt 生成
- **Suno v6 自然語言意圖** — 核心方向 → 演奏與編制 → 人聲意圖 → 製作方向 → 整體 Feel
- **v6 / v6-wild / v6-mini 對應思路** — 精準成品、探索性變化與快速草稿可共用同一套意圖描述
- **可插拔版本層** — `lib/sunoVersions/` 同時保留 v5.5 與 v6，active version 目前為 v6
- **具體排除項目** — 可加入 no autotune / no synths 等真正不希望出現的聲音
- **整體連貫性** — 一鍵加入自然段落轉場、重複動機與一致聲音識別
- **Voice Clone 模式** — 啟用後自動略過人聲描述
- **結構化檢查** — 依工作流檢查空白 Brief、缺少 edit scope、來源角色與時間範圍；不再用 tag 數冒充品質指標
- **22 個情境範本** — 華語抒情、流行燃曲、搖滾爆發、Lo-fi 讀書、古風中國風、Indie 民謠、電影配樂、City Pop、EDM 派對、氛圍環境、K-Pop 偶像舞曲、R&B 慢板、華語嘻哈、Synthwave 80s、House 律動、Bossa Nova 咖啡、Pop Punk 熱血、Funk 派對、Dream Pop 迷幻、Acoustic 純粹、粵語金曲、童趣兒歌
- **15 種段落結構模板** — 標準流行、抒情骨架、電子流行 Drop、搖滾骨架、簡短版、極簡 V-C、純樂器 Loop、Hip-Hop 結構、K-Pop 舞曲（含 Dance Break）、EDM 完整版（Buildup-Drop）、AABA 32-bar 爵士標準、古風敘事長篇、Funk Vamp、童謠循環、Folk 敘事

### 🧠 智能推薦（差異化功能）
- **Tag 共現推薦** — 從 22 個情境範本 + 4★+ 歷史紀錄統計，使用者選了一個情緒/樂器/紋理，自動推薦常一起出現但尚未選的 tag
- 每個 multi-select 下方顯示 `💡 常搭配：[+鋼琴] [+弦樂] ...` 一鍵加入
- 5★ 歷史權重加倍，越用越懂你的口味

### 📝 歌詞工具
- **AI 歌詞生成（三模式）**
  - 📋 匯出 Prompt：產生完整 prompt 貼到 Claude/ChatGPT，再貼回 JSON 自動填入
  - 🚀 API 直接生成：支援 OpenRouter / OpenAI / Anthropic / Gemini，串流可中斷
  - 🎲 本地模板：純前端意象詞庫填空，離線可用
- **10 種語言** — 華語繁/簡、台語、粵語、英文、日文、韓文、西班牙文、中英混合、純樂器
- **押韻分析** — 基於 pinyin-pro，14 韻系映射，即時上色
- **字數統計** — 每行字數、標準差、不平均提示、重複行偵測

### 🔍 結構視圖（v6 意圖教學）
Style Prompt 區塊提供「文字 / 結構」雙 tab，把 prompt 拆成核心方向、演奏、人聲、製作、整體 Feel、創意參考與排除項目，方便檢查複雜音樂視野。

### 📊 歷史紀錄 + 結果回饋
- **本機歷史** — localStorage 最多 50 筆，可匯出/匯入 JSON
- **Prompt Diff 對比** — 任選兩筆紀錄並排對比 tag 差異 + LCS 行級歌詞 diff + 欄位變動表
- **⭐ 結果回填評分** — 對每首生成結果打 1-5 星 + 音檔連結 + 筆記
- **統計卡片** — 「共 N 筆 · 已評分 X · 平均 Y★」
- **評分篩選器** — 全部 / 5★ / 4★+ / 已評 / 未評
- **多種匯出**：
  - 📄 **Markdown** — 單筆作品完整文件（標題/評分/metadata/Style/Lyrics），可貼到 Notion / 部落格
  - 📊 **CSV** — 22 欄位 dataset（含 Suno 版本），可丟 Excel/Sheets 分析自己的成功 patterns
  - 📦 **JSON** — 完整備份/還原

### 📈 成功 Patterns 儀表板
利用累積評分自動分析「什麼真的在你身上有用」：

- **Lift 分數演算法** — 不只「你常用什麼」，而是「在高分中比整體更常出現多少」（過濾掉純使用頻率噪音）
- **★★ / ★ / · / ↓** 視覺化每個 tag 的相關強度
- **評分分布橫條圖**、**BPM 甜蜜點**、**Style Prompt 長度範圍**
- 4★+ / 5★ 切換閾值
- 資料 < 3 筆高分時顯示 onboarding 訊息，避免誤導性洞察

### 🎨 介面
- **🌗 Dark mode** — 自動跟隨系統，可手動切換
- **PWA** — 可安裝、離線使用
- **響應式設計** — 手機/平板/桌面皆可用

---

## Usage

線上版可直接使用，或本地：

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 產出 dist/
npm run preview  # 預覽生產版本
npm test         # 執行測試
npm run lint     # 型別檢查
```

### 工作流程

1. 從 **🎯 一鍵情境範本** 選一個起點（22 個，涵蓋多種曲風 / 語言）
2. 微調 **Layer 1-4** 各層級參數（基本骨架 / 樂器 / 人聲 / 紋理）
3. 視需要加入具體的 **排除項目**，避免與主要創作意圖互相競爭
4. 用 **AI 歌詞生成** 三模式之一補上歌詞
5. 複製 **Style / Lyrics** 到 Suno 對應欄位
6. 生成完音樂後回到工具 **💾 儲存歷史 + ⭐ 評分**，累積成功配方

---

## Tech Stack

- **Suno v6 active version** — 依官方 v6 對 vocals / instrumentation / structure / mood / references / overall feel 的強化設計
- **React 18** + **TypeScript 5.7**（strict mode）
- **Vite 6** — Build with manualChunks（react-vendor / pinyin / app 三 chunk 拆分）
- **Tailwind CSS 3.4** — 含 dark mode
- **vite-plugin-pwa** — Service Worker + 離線快取
- **pinyin-pro** — 中文押韻分析
- **Vitest 4** — 312 個測試覆蓋核心邏輯（押韻、diff、共現/洞察演算法、CSV/Markdown 匯出）
- 模組化架構：`data / lib / components / hooks` + `lib/sunoVersions/`

### 專案結構

```
src/
├── components/         # 16 React 元件
│   ├── AppHeader / StyleBuilderPanel / AiGeneratorPanel
│   ├── SectionsEditor / OutputPanel
│   ├── HistoryDrawer / DiffViewer / RatingEditor
│   ├── InsightsDashboard # 📈 成功 Patterns 儀表板
│   ├── SuggestionStrip   # 💡 常搭配推薦條
│   └── LyricsAnalyzer / MultiSelectChips / SingleSelect / ...
├── hooks/              # useTheme / useApiSettings
├── lib/
│   ├── sunoVersions/   # 版本抽象層（v5_5.ts + v6.ts，active=v6）
│   ├── promptBuilder.ts    # 委託給 active version
│   ├── llm.ts              # 多家 LLM provider 統一介面
│   ├── rhyme.ts            # 中文押韻 14 韻系
│   ├── analyze.ts          # 字數 / 標準差
│   ├── diff.ts             # Tag set + LCS line diff
│   ├── tagSuggestions.ts   # 共現推薦演算法
│   ├── insights.ts         # 成功 Patterns lift 分析
│   ├── csvExport.ts        # 評分 dataset CSV
│   ├── markdownExport.ts   # 單筆作品 Markdown 匯出
│   ├── history.ts          # localStorage 持久化
│   ├── storage.ts          # 集中 storage helper
│   └── template.ts         # 離線意象詞庫填詞
├── data.ts             # 情境範本 / 段落骨架 / Provider config
├── types.ts            # SongState / HistoryEntry / SongResult
└── App.tsx             # 350 行 - 純元件組裝
```

---

## Deployment

GitHub Actions 自動部署到 Pages：見 `.github/workflows/deploy.yml`，每次 push 到 `main` 自動建置部署。

啟用步驟：
1. GitHub Repo → Settings → Pages → Source 選 `GitHub Actions`
2. push 後等待 workflow 完成
3. 訪問 `https://<username>.github.io/SunoPromptGen/`

---

## 擴充：新增 Suno 版本（v7+）

目前 `v5.5` 與 `v6` 都保留在 registry。未來 Suno 出新版的核心步驟：

1. 建立 `src/lib/sunoVersions/v7.ts` 實作 `SunoVersion` 介面
2. 在 `index.ts` 的 `SUNO_VERSIONS` 註冊並修改 `ACTIVE_VERSION_ID`
3. 新增版本 builder 測試，確認所有情境範本的 vocab key 相容
4. 同步更新 README、HTML title 與 PWA description 等發布 metadata

vocab、限制、builder、結構視圖、UI 教學文案與 Prompt 心法會透過版本物件切換。

---

## Reference

- [Suno 官方：Introducing v6](https://suno.com/blog/introducing-v6)
- [Suno 官方 Release Notes](https://suno.com/release-notes)
- [Suno 官方：v5.5](https://suno.com/blog/v5-5)（legacy 版本參考）

---

## License

Personal use.
