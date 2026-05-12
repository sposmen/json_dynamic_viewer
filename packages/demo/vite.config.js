import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/json_dynamic_viewer/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      'json-dynamic-viewer': resolve(__dirname, '../lib/src/index.js'),
    },
  },
}));
