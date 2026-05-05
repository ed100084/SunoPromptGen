# Suno Prompt Generator

中文友善的 Suno AI prompt 產生器 — **22 個情境範本、4 層架構視覺化、歷史比對與評分**。
PWA 可離線使用，每次 push 自動部署到 GitHub Pages。

🌐 線上版：<https://ed100084.github.io/SunoPromptGen/>

---

## Features

### 🎼 Prompt 生成
- **Suno v5.5 四層架構** — Tempo+Key → 樂器 → 人聲方向 → 製作紋理
- **可插拔版本層** — `lib/sunoVersions/` 抽象介面，未來 v6 / v7 只需新增檔案，現有程式碼零修改
- **Negative Prompts** — v5.5 必用的反向約束（no autotune / no synths 等）
- **抗切割感** — 一鍵加入 seamless transitions 等連貫性關鍵字
- **Voice Clone 模式** — 啟用後自動略過人聲描述
- **即時字元 / tag 數警示** — 1000 字以內、建議 8-15 tags
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

### 🔍 結構視圖（v5.5 教學）
Style Prompt 區塊提供「文字 / 結構」雙 tab，把 prompt 拆成各層 tag chips，幫助理解四層架構。

### 📊 歷史紀錄 + 結果回饋
- **本機歷史** — localStorage 最多 50 筆，可匯出/匯入 JSON
- **Prompt Diff 對比** — 任選兩筆紀錄並排對比 tag 差異 + LCS 行級歌詞 diff + 欄位變動表
- **⭐ 結果回填評分** — 對每首生成結果打 1-5 星 + 音檔連結 + 筆記
- **統計卡片** — 「共 N 筆 · 已評分 X · 平均 Y★」
- **評分篩選器** — 全部 / 5★ / 4★+ / 已評 / 未評
- **多種匯出**：
  - 📄 **Markdown** — 單筆作品完整文件（標題/評分/metadata/Style/Lyrics），可貼到 Notion / 部落格
  - 📊 **CSV** — 21 欄位 dataset，可丟 Excel/Sheets 分析自己的成功 patterns
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
3. 加上 **Negative Prompts**（v5.5 強烈推薦）
4. 用 **AI 歌詞生成** 三模式之一補上歌詞
5. 複製 **Style / Lyrics** 到 Suno 對應欄位
6. 生成完音樂後回到工具 **💾 儲存歷史 + ⭐ 評分**，累積成功配方

---

## Tech Stack

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
├── components/         # 12+ React 元件
│   ├── AppHeader / StyleBuilderPanel / AiGeneratorPanel
│   ├── SectionsEditor / OutputPanel
│   ├── HistoryDrawer / DiffViewer / RatingEditor
│   ├── InsightsDashboard # 📈 成功 Patterns 儀表板
│   ├── SuggestionStrip   # 💡 常搭配推薦條
│   └── LyricsAnalyzer / MultiSelectChips / SingleSelect / ...
├── hooks/              # useTheme / useApiSettings
├── lib/
│   ├── sunoVersions/   # 版本抽象層（v5_5.ts 是真理之源）
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

## 擴充：新增 Suno 版本（v6+）

未來 Suno 出新版只需 3 步驟：

1. 建立 `src/lib/sunoVersions/v6.ts` 實作 `SunoVersion` 介面
2. 在 `index.ts` 的 `SUNO_VERSIONS` 註冊
3. 改 `ACTIVE_VERSION_ID`（或加 UI 切換）

其餘程式碼一行都不用改 — vocab / 限制 / builder / 心法都會自動切換。

---

## Reference

- [Suno v5.5 Prompt Engineering Guide](https://suno.bi/blog/suno-v5-5-prompt-engineering-advanced-techniques-2026-en)
- [Song AI Farm — v5.5 Prompts](https://www.songaifarm.com/blog/suno-prompts-v5-5)
- [Suno v5 Best Practices](https://hookgenius.app/learn/suno-v5-complete-guide/)

---

## License

Personal use.
