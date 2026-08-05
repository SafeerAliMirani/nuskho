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

/**
 * DIRTY MEANS TRACKED CHANGES, NOT UNTRACKED FILES.
 *
 * The first version used plain `git status --porcelain`, which counts
 * untracked files too — so a clinic's own Sindhi worksheet sitting in the
 * folder marked every release DIRTY. A warning that fires every single time is
 * a warning nobody reads, and this one has to still mean something in week
 * seven when the question is which build was on the machine.
 *
 * Untracked files cannot change what was compiled. Modified tracked files can,
 * so only those make a release unreproducible. Untracked ones are still worth
 * mentioning once, quietly, in case something that should be committed is not.
 */
const dirty = sh('git status --porcelain --untracked-files=no', '') !== ''
const untracked = sh('git ls-files --others --exclude-standard', '')
  .split('\n').filter(Boolean)
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

/**
 * THE BUILDING'S WIRE TRAVELS WITH THE FOLDER.
 *
 * A clinic that runs phones needs tools/nuskho-wifi.cjs on the machine that
 * holds the records, and the folder a person carries is the only thing that
 * arrives there. Leaving it behind means discovering it while standing in a
 * clinic at seven in the evening, which is the worst possible moment to need
 * a file that is at home. A solo clinic simply never double-clicks it.
 */
const WIRE = 'tools/nuskho-wifi.cjs'
if (existsSync(WIRE)) {
  cpSync(WIRE, join(out, 'nuskho-wifi.cjs'))
  writeFileSync(join(out, 'Start Nuskho wifi.bat'),
`@echo off
title Nuskho wifi
echo.
echo   The building's own wire. Leave this window open all evening.
echo   Close it and the phones stop; the records are untouched either way.
echo.
cd /d "%~dp0"
node "nuskho-wifi.cjs" "."
pause
`)
}

/**
 * A LAUNCHER, BECAUSE DOUBLE-CLICKING index.html GIVES A BLANK PAGE.
 *
 * Found the hard way. Chrome refuses IndexedDB to a page opened from disk
 * unless it is started with --allow-file-access-from-files — and the flag is
 * only read when Chrome STARTS. If any Chrome window is already open, the flag
 * is silently ignored, the new tab joins the running instance, and the app
 * comes up white with no error anybody can see.
 *
 * On a clinic laptop with somebody's Facebook open in another window, that is
 * every single time. It would have looked like the software was broken on the
 * first evening of the pilot.
 *
 * So the release carries its own launcher with its own Chrome profile
 * directory, which forces a separate instance and makes the flags apply
 * whatever else is running. --kiosk-printing is in there too: without it a
 * print dialog appears for every patient, and at 140 patients an evening that
 * alone would end the pilot.
 */
writeFileSync(join(out, 'Start Nuskho.bat'),
`@echo off
title Nuskho
set HERE=%~dp0
start "" chrome.exe ^
 --user-data-dir="%LOCALAPPDATA%\\NuskhoChrome" ^
 --allow-file-access-from-files ^
 --kiosk-printing ^
 --new-window "file:///%HERE:\\=/%index.html"
exit
`)

writeFileSync(join(out, 'WHAT-THIS-IS.txt'), `NUSKHO — sealed copy for a clinic

  Version   ${pkg.version}
  Commit    ${commit}${dirty ? '   *** BUILT FROM UNCOMMITTED CHANGES ***' : ''}
  Built     ${day}
  Channel   clinic

HOW TO USE IT

  Copy this whole folder to the clinic computer, then double-click

      Start Nuskho.bat

  DO NOT double-click index.html. It will open a WHITE PAGE with no error.
  Chrome only allows a page opened from disk to keep records if it is STARTED
  with --allow-file-access-from-files, and that flag is ignored if any Chrome
  window is already open. The .bat file starts its own Chrome so the flags
  always apply. It also switches on --kiosk-printing, without which a print
  dialog appears for every patient.

  Make a shortcut to the .bat on the desktop and let nobody open it any other
  way.

PHONES ON THE CLINIC WIFI (only if this building uses them)

  On the ONE computer that holds the records, also double-click

      Start Nuskho wifi.bat

  and leave that window open for the evening. It prints an address; phones on
  the same wifi open it, or scan the square under Setup, Wifi. Needs Node
  installed on that one machine, and no internet at any point. That program
  keeps no records of its own; closing it stops the phones and touches
  nothing else.

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
  console.log(`\n  ⚠ Tracked files are modified — this release cannot be rebuilt from ${commit}.`)
  console.log(`    Commit first if this is going to a real clinic.`)
}
if (untracked.length) {
  console.log(`\n  ${untracked.length} untracked file(s), not part of the build:`)
  for (const f of untracked.slice(0, 6)) console.log(`      ${f}`)
  if (untracked.length > 6) console.log(`      …and ${untracked.length - 6} more`)
}
console.log(`\n  Sealed copy: ${out}`)
console.log(`  Copy that folder to the clinic machine. It will never change on its own.\n`)
