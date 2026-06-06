import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
  server: {
    port: 8000,
    open: false,
  },
});
