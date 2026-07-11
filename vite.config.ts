import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Generates dist/stats.html with a treemap of what's in the bundle.
    // Opt-in only: run `npm run build:analyze` (doesn't run on normal builds/CI).
    process.env.ANALYZE === 'true' &&
      visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@backend': path.resolve(__dirname, './backend'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
    proxy: {
      '/supabase': {
        target: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, ''),
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          data: ['@tanstack/react-query', 'zustand'],
          ui: ['lucide-react', 'sonner'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
