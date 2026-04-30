# Suno Prompt Generator

中文友善的 Suno AI v5.5 prompt 產生器，單檔 HTML，雙擊瀏覽器即可使用。

## Features

- **v5.5 四層架構** — Tempo+Key → Instrumentation → Vocal direction → Production / Negative
- **Negative Prompts** — v5.5 必用的反向約束（no autotune, no synths 等）
- **具體樂器形容詞** — fingerpicked acoustic guitar、warm upright bass 等高訊號描述
- **紋理 / 製作風格** — close-mic intimacy、subtle plate reverb、tape saturation
- **抗切割感** — 一鍵加入 seamless transitions 等連貫性關鍵字
- **段落結構模板** — 標準流行 / 抒情骨架 / 電子流行 Drop / 搖滾 / 純樂器 Loop
- **一鍵情境範本** — 抒情慢歌、流行燃曲、搖滾爆發、Lo-fi 讀書、古風中國風、Indie 民謠、電影配樂、City Pop、EDM 派對、氛圍環境
- **Voice Clone 模式** — 啟用後自動略過人聲描述，避免衝突
- **即時字元/tag 數警示** — Style 控制 1000 字內、tag 數 8-15 個
- **AI 歌詞生成（三模式）**
  - 📋 匯出 Prompt：產生完整 prompt 貼到 Claude/ChatGPT，再貼回 JSON 自動填入
  - 🚀 API 直接生成：支援 OpenRouter / OpenAI / Anthropic / Gemini，一鍵填入所有段落
  - 🎲 本地模板：純前端意象詞庫填空，離線可用

## Usage

雙擊 `index.html` 用瀏覽器開啟，或部署到任意靜態網站主機（GitHub Pages、IIS 等）。

1. 選擇情境範本當起點
2. 微調 Layer 1-4 各層級參數
3. 加上 Negative Prompts（v5.5 強烈推薦）
4. 在段落區填入歌詞
5. 複製 Style / Lyrics 到 Suno 對應欄位

## Tech Stack

- React 18 (CDN)
- Tailwind CSS (CDN)
- Babel Standalone (JSX 即時編譯)
- 純前端，無需 build / 後端

## Reference

- [Suno v5.5 Prompt Engineering Guide](https://suno.bi/blog/suno-v5-5-prompt-engineering-advanced-techniques-2026-en)
- [Song AI Farm — v5.5 Prompts](https://www.songaifarm.com/blog/suno-prompts-v5-5)
- [Suno v5 Best Practices](https://hookgenius.app/learn/suno-v5-complete-guide/)

## License

Personal use.
