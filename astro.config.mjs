import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const projectName = basename(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  site: 'https://dareka-san.github.io',
  base: `/${projectName}`,
  vite: {
    build: {
      // シェーダー内の改行をエスケープして、出力 JS を 1 行にまとめる。
      minify: 'terser',
    },
  },
});
