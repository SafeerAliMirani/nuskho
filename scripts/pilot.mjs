/**
 * MAKE A SEALED COPY FOR THE PILOT CLINIC.
 *
 * `npm run pilot` builds the clinic channel and then packages it here, into a
 * folder named for the day and the commit. That name is the whole point: six
 * weeks from now the only useful question about a bug is "which copy was on
 * that machine on the eleventh", and a folder called `dist` cannot answer it.
 *
 * WHY THIS EXISTS AT ALL. The public copy redeploys on every push. If the
 * clinic ran that copy, every feature written during the pilot would arrive on
 * the one machine being measured, mid-measurement, and the six weeks would be
 * worth much less than they cost. So the clinic runs a folder that a person
 * carried there, and it changes when a person carries a new one.
 *
 * It also strips the service worker. A folder opened from disk cannot register
 * one anyway, but if the folder is ever put behind a web server "just to try
 * it", the worker would start caching and updating and the seal would be gone
 * without anybody deciding.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const sh = (cmd, fallback) => {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() }
  catch { return fallback }
}

const commit = sh('git rev-parse --short HEAD', 'nogit')
const dirty = sh('git status --porcelain', '') !== ''
const day = new Date().toISOString().slice(0, 10)
const name = `nuskho-${day}-${commit}${dirty ? '-DIRTY' : ''}`
const out = join('releases', name)

if (!existsSync('dist/index.html')) {
  console.error('\n  dist/ is not built. Run `npm run pilot`, not this script directly.\n')
  process.exit(1)
}

mkdirSync('releases', { recursive: true })
rmSync(out, { recursive: true, force: true })
cpSync('dist', out, { recursive: true })

// A folder on disk cannot register a worker, but a folder that later ends up
// behind a web server can. Take it out so the seal cannot be lost by accident.
rmSync(join(out, 'sw.js'), { force: true })

writeFileSync(join(out, 'WHAT-THIS-IS.txt'), `NUSKHO — sealed copy for a clinic

  Version   ${pkg.version}
  Commit    ${commit}${dirty ? '   *** BUILT FROM UNCOMMITTED CHANGES ***' : ''}
  Built     ${day}
  Channel   clinic

HOW TO USE IT

  Copy this whole folder to the clinic computer. Open index.html in Chrome.
  For real use, start Chrome with --kiosk-printing, or a print dialog appears
  for every patient.

WHAT IT DOES NOT DO

  It does not update itself. It does not reach the internet for anything. It
  will still be exactly this software in six weeks, which is the point: a
  pilot only means something if the thing being measured stops changing.

  To update a clinic, build a new folder and carry it there on purpose. Write
  the date in the clinic log when you do, or the week-seven numbers cannot be
  read.

IF SOMETHING IS WRONG

  Open About inside the app. It shows this commit and makes a report with no
  patient name, number, medicine, diagnosis or fee in it. Send that.
`)

if (dirty) {
  console.log(`\n  ⚠ Working tree is dirty — this release is not reproducible.`)
  console.log(`    Commit first if this is going to a real clinic.\n`)
}
console.log(`  Sealed copy: ${out}`)
console.log(`  Copy that folder to the clinic machine. It will never change on its own.\n`)
