import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GH Pages 子目錄部署需設定 base 為 /<repo>/
export default defineConfig({
  base: '/SunoPromptGen/',
  plugins: [react()],
});
