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
const WIRE_EXE = 'tools/nuskho-wifi.exe'

/**
 * ONE WAY IN, FOR EVERY CLINIC, INCLUDING THE ONE-DOCTOR ONES.
 *
 * A browser files its records under the ADDRESS the app was opened from. We
 * used to ship two launchers: a solo clinic opened the folder from disk, a
 * building opened it through the wire. Two launchers, two addresses, two
 * databases. Which meant a solo clinic that later bought a phone did not gain
 * a feature, it lost its history, and somebody had to drive to it with a
 * backup file. We built that trap ourselves and there was nothing on the other
 * side of it.
 *
 * So now every clinic opens Nuskho the same way, through the wire, at
 * http://localhost:8123. A doctor alone in one room never notices the
 * difference. The evening he adds a phone, it just works, because the address
 * never changed.
 *
 * The wire ships as ONE Windows file with node inside it, so nothing has to be
 * installed on a clinic machine. Build it with `npm run wire:exe`. It is 55 MB
 * and deliberately not committed: it is a build output, and git is not where
 * binaries belong.
 */
if (!existsSync(WIRE_EXE)) {
  console.log(`\n  ✖ ${WIRE_EXE} is missing, and every launcher depends on it.`)
  console.log(`    Build it first:  npm run wire:exe\n`)
  process.exit(1)
}

if (existsSync(WIRE)) {
  cpSync(WIRE, join(out, 'nuskho-wifi.cjs'))
  cpSync(WIRE_EXE, join(out, 'nuskho-wifi.exe'))

  /**
   * THE ONE LAUNCHER. Starts the wire, waits for it, then opens the app at the
   * wire's own address with the printing flags in its own Chrome profile.
   *
   * --user-data-dir forces a SEPARATE Chrome instance. Without it the new tab
   * joins whatever Chrome is already open with somebody's Facebook in it, and
   * --kiosk-printing is silently ignored, which means a print dialog for every
   * patient. At 140 patients an evening that alone would end a pilot.
   */
  writeFileSync(join(out, 'Start Nuskho.bat'),
`@echo off
title Nuskho
cd /d "%~dp0"
echo.
echo   Starting Nuskho.
echo   A small window will open behind this one. LEAVE IT OPEN all evening.
echo   Closing it stops the phones and closes the clinic's records.
echo.
start "Nuskho wire" /min cmd /c "nuskho-wifi.exe ""."" & pause"
timeout /t 4 /nobreak >nul
start "" chrome.exe ^
 --user-data-dir="%LOCALAPPDATA%\\NuskhoClinic" ^
 --kiosk-printing ^
 --new-window "http://localhost:8123/"
echo   Opened. Phones use the address printed in the small window,
echo   or scan the square under Setup, Wifi.
timeout /t 6 /nobreak >nul
exit
`)

  /** For the evening somebody closes the small window by mistake, which will
   *  happen, and which must not mean closing and reopening the whole clinic. */
  writeFileSync(join(out, 'If the small window was closed.bat'),
`@echo off
title Nuskho wifi
echo.
echo   Starting the wire again, on its own. Leave this window open.
echo   Use this ONLY if Nuskho is already open on this computer and the
echo   small window was closed by mistake. Otherwise use Start Nuskho.bat.
echo.
cd /d "%~dp0"
nuskho-wifi.exe "."
pause
`)
}

/* The old "open the folder from disk" launcher is deliberately gone. It was a
   second address, and a second address was a second clinic. See the block
   above the wire for why. */

writeFileSync(join(out, 'WHAT-THIS-IS.txt'), `NUSKHO — sealed copy for a clinic

  Version   ${pkg.version}
  Commit    ${commit}${dirty ? '   *** BUILT FROM UNCOMMITTED CHANGES ***' : ''}
  Built     ${day}
  Channel   clinic

HOW TO USE IT

  Copy this whole folder to ONE computer in the clinic. That computer is where
  the records live. Then double-click

      Start Nuskho.bat

  Make a shortcut to it on the desktop, and let nobody open Nuskho any other
  way. Not index.html, not a bookmark, not a second browser. Every evening,
  that shortcut.

  Two windows appear. The big one is Nuskho. The small one is the clinic's own
  wifi service. LEAVE THE SMALL ONE OPEN all evening. Closing it closes the
  clinic. If somebody closes it by mistake while Nuskho is still open, run

      If the small window was closed.bat

  and carry on. Nothing is lost.

  If Windows says it protected your PC when the small window starts, that is
  only because this file is new and not signed yet. Click More info, then
  Run anyway. Nothing here reaches the internet.

WHY ONE LAUNCHER AND NOT TWO, WHICH IS NOT OBVIOUS

  A browser keeps its records under the ADDRESS the app was opened from. Open
  the same folder two different ways and the browser believes it is two
  different clinics, with two separate sets of records, and the second one
  looks brand new.

  So there is exactly one way in, for a doctor alone in one room and for a
  hospital floor alike. A doctor alone never notices. The evening he adds a
  phone at the door, it simply works, because the address never changed.

  Phones and tablets open the address printed in the small window, or scan the
  square under Setup, Wifi. They hold nothing: everything they show comes from
  this computer, and nothing is stored on them.

  IF THIS CLINIC WAS SET UP ON AN OLDER NUSKHO that opened the folder from
  disk, its records are at the old address. Before switching: open it the old
  way, Setup, Backup, Save the full backup. Then start this launcher and
  restore that file. Do it before an evening, never during one.

WHAT IT DOES NOT DO

  It does not update itself. It does not reach the internet for anything, ever,
  and neither does the small window. It will still be exactly this software in
  six weeks, which is the point: a pilot only means something if the thing
  being measured stops changing.

  To update a clinic, build a new folder and put it there on purpose. Only the
  app files change; the records stay where they are, because the address does
  not move. Write the date in the clinic log when you do, or the week-seven
  numbers cannot be read.

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
