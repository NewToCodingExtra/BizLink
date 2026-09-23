import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnvDir = path.resolve(__dirname, '../backend');

export default defineConfig(({ mode }) => {
  // Load Laravel's .env so APP_URL is available to laravel-vite-plugin.
  const env = loadEnv(mode, backendEnvDir, '');
  if (env.APP_URL) {
    process.env.APP_URL = env.APP_URL;
  }

  return {
    envDir: backendEnvDir,
    plugins: [
      laravel({
        input: ['src/app.jsx'],
        publicDirectory: '../backend/public',
        buildDirectory: 'build',
        hotFile: '../backend/public/hot',
        refresh: [
          '../backend/resources/views/**',
          '../backend/routes/**',
          '../backend/app/Http/Controllers/**',
        ],
      }),
      react(),
      tailwindcss(),
    ],
    build: {
      // outDir is outside frontend/ (backend/public/build); allow emptying it.
      emptyOutDir: true,
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      watch: {
        ignored: ['**/storage/framework/views/**'],
      },
    },
  };
});
