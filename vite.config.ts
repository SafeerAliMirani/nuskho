import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const built = new Date().toISOString().slice(0, 10)

/**
 * WHICH COPY OF THE APP IS ON THAT MACHINE.
 *
 * The version alone stopped being enough the day the same version number could
 * mean two different things: a clinic install copied from a folder in August,
 * and the public demo that rebuilds on every push. So a build now carries
 * three facts, all stamped in and none of them read from a network:
 *
 *   VERSION  1.0.0        which release
 *   BUILT    2026-08-04   which day
 *   BUILD    a4f19c3      which commit, exactly
 *   CHANNEL  clinic|demo  what it is FOR
 *
 * CHANNEL is the load-bearing one and it exists because of a specific danger.
 * The web copy redeploys on every push to main. A pilot is six weeks of
 * measuring one clinic — and if features written in week three arrive on that
 * machine in week three, the thing being measured changed halfway through and
 * the six weeks are worth much less than they cost.
 *
 * So the clinic build is a FOLDER, copied by a person, that registers no
 * service worker (see main.tsx: file:// is not http, so it cannot) and reaches
 * nothing. It changes when somebody carries a new folder to the clinic and not
 * one moment sooner. The demo build is the one that may move freely, because
 * nothing real depends on it.
 */
function commit(): string {
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() }
  catch { return 'nogit' }
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // base:'./' matters — the build has to run by double-clicking dist/index.html
  // on a clinic laptop with no server and no internet.
  base: './',
  // Stamped in, not read at runtime: the app must be able to say which copy of
  // itself is on a clinic laptop without asking anything.
  define: {
    __NK_VERSION__: JSON.stringify(pkg.version ?? '0.0.0'),
    __NK_BUILT__: JSON.stringify(built),
    __NK_BUILD__: JSON.stringify(commit()),
    __NK_CHANNEL__: JSON.stringify(mode === 'demo' ? 'demo' : 'clinic'),
  },
  build: { assetsInlineLimit: 1024 * 1024 },   // inline everything; one folder to copy
}))
