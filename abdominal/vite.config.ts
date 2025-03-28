import react from '@vitejs/plugin-react';
import { rmSync } from 'fs';
import { join } from 'path';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import pkg from './package.json';

rmSync(join(__dirname, 'dist'), { recursive: true, force: true }); // v14.14.0

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
      styles: join(__dirname, 'src/assets/styles'),
    },
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/ipc/main/index.ts',
        vite: {
          build: {
            sourcemap: false,
            outDir: 'dist/src/ipc/main',
            plugins: 'esbuild.plugins.js',
            external: ['pg-native', 'ssh2'],
          },
        },
      },
      preload: {
        input: {
          // You can configure multiple preload scripts here
          index: join(__dirname, 'src/ipc/preload/index.ts'),
        },
        vite: {
          build: {
            // For debug
            sourcemap: 'inline',
            outDir: 'dist/src/ipc/preload',
            plugins: 'esbuild.plugins.js',
            external: ['pg-native', 'ssh2'],
          },
        },
      },
      // Enables use of Node.js API in the Electron-Renderer
      renderer: {},
    }),
  ],
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
});
