import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        'index':                               resolve(__dirname, 'src/index.js'),
        'adapters/tabulator':                  resolve(__dirname, 'src/adapters/tabulator/index.js'),
        'adapters/tabulator/themes/simple':    resolve(__dirname, 'src/adapters/tabulator/themes/simple.js'),
        'adapters/tabulator/themes/midnight':  resolve(__dirname, 'src/adapters/tabulator/themes/midnight.js'),
        'adapters/tabulator/themes/modern':    resolve(__dirname, 'src/adapters/tabulator/themes/modern.js'),
        'adapters/tabulator/themes/site':      resolve(__dirname, 'src/adapters/tabulator/themes/site.js'),
        'adapters/tabulator/themes/site-dark': resolve(__dirname, 'src/adapters/tabulator/themes/site-dark.js'),
        'adapters/gridjs':                     resolve(__dirname, 'src/adapters/gridjs/index.js'),
        'adapters/gridjs/themes/mermaid':      resolve(__dirname, 'src/adapters/gridjs/themes/mermaid.js'),
      },
      name: 'JsonDynamicViewer',
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'tabulator-tables',
        'gridjs',
        'gridjs-react',
      ],
    },
    cssCodeSplit: false,
  },
});
