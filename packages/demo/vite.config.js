import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/json_dynamic_viewer/' : '/',
  plugins: [react()],
  resolve: {
    // Array form required: Vite treats string aliases as prefix matches, so
    // more-specific entries must come before shorter ones to avoid interception.
    alias: [
      { find: 'json-dynamic-viewer/adapters/tabulator/themes/simple',    replacement: resolve(__dirname, '../lib/src/adapters/tabulator/themes/simple.js') },
      { find: 'json-dynamic-viewer/adapters/tabulator/themes/midnight',  replacement: resolve(__dirname, '../lib/src/adapters/tabulator/themes/midnight.js') },
      { find: 'json-dynamic-viewer/adapters/tabulator/themes/modern',    replacement: resolve(__dirname, '../lib/src/adapters/tabulator/themes/modern.js') },
      { find: 'json-dynamic-viewer/adapters/tabulator/themes/site-dark', replacement: resolve(__dirname, '../lib/src/adapters/tabulator/themes/site-dark.js') },
      { find: 'json-dynamic-viewer/adapters/tabulator/themes/site',      replacement: resolve(__dirname, '../lib/src/adapters/tabulator/themes/site.js') },
      { find: 'json-dynamic-viewer/adapters/tabulator',                  replacement: resolve(__dirname, '../lib/src/adapters/tabulator/index.js') },
      { find: 'json-dynamic-viewer/adapters/gridjs/themes/mermaid',      replacement: resolve(__dirname, '../lib/src/adapters/gridjs/themes/mermaid.js') },
      { find: 'json-dynamic-viewer/adapters/gridjs',                     replacement: resolve(__dirname, '../lib/src/adapters/gridjs/index.js') },
      { find: 'json-dynamic-viewer',                                     replacement: resolve(__dirname, '../lib/src/index.js') },
    ],
  },
}));
