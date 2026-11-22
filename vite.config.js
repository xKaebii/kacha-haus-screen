import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'

// One id per build. It is baked into the page and written to build.json;
// open screens compare the two every minute and reload themselves smoothly when they differ.
const BUILD = createHash('sha1').update(String(Date.now()) + Math.random()).digest('hex').slice(0, 10)

export default defineConfig({
  base: './',
  optimizeDeps: { include: ['firebase/app', 'firebase/auth', 'firebase/database'] },
  define: { __BUILD__: JSON.stringify(BUILD) },
  build: {
    target: ['es2017', 'chrome64'], chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: 'index.html', control: 'control.html' } }
  },
  plugins: [
    react(),
    { name: 'build-id', generateBundle () { this.emitFile({ type: 'asset', fileName: 'build.json', source: JSON.stringify({ build: BUILD }) + '\n' }) } }
  ]
})
