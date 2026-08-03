import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const built = new Date().toISOString().slice(0, 10)

// base:'./' matters — the build has to run by double-clicking dist/index.html
// on a clinic laptop with no server and no internet.
export default defineConfig({
  plugins: [react()],
  base: './',
  // Stamped in, not read at runtime: the app must be able to say which copy of
  // itself is on a clinic laptop without asking anything.
  define: {
    __NK_VERSION__: JSON.stringify(pkg.version ?? '0.0.0'),
    __NK_BUILT__: JSON.stringify(built),
  },
  build: { assetsInlineLimit: 1024 * 1024 },   // inline everything; one folder to copy
})
