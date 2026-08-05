import { factoryReset } from './reset'
import { isDemo } from './version'
import { signedIn, signIn } from './roles'
import { profile, saveProfile } from './profile'

/**
 * THE PRACTICE COPY, AND WHY IT FORGETS.
 *
 * Nuskho's public copy exists so a doctor can be shown the thing rather than
 * described it. That is worth a lot: the product is one piece of paper and
 * nobody buys a description of paper.
 *
 * The danger is not misuse. It is drift. A doctor is shown the app, likes it,
 * and simply carries on — his next patient goes in, then the one after, and
 * within a fortnight a copy of the software that rebuilds on every push is
 * holding a real clinic's records. Nobody decided to start; they just never
 * stopped.
 *
 * Three things prevent it, and they work whether or not anyone is paying
 * attention:
 *
 *   1. Everything it prints says SPECIMEN across it, in both scripts. A
 *      chemist will not fill that and a patient will ask. See print/styles.ts.
 *   2. It writes to its own database, so nothing here can ever appear inside a
 *      real clinic installed later on the same machine. See db.ts.
 *   3. It forgets. This file.
 *
 * WHY TWELVE HOURS AND NOT ON EXIT. Wiping when the tab closes sounds tidier
 * and does not work: `beforeunload` is not delivered when a phone kills the
 * browser, when the battery dies, or when a laptop is simply shut. It also
 * punishes the ordinary case — a reload in the middle of showing somebody,
 * which would wipe the queue mid-sentence and make the demo look broken.
 *
 * So it forgets on the next START after a gap. One demonstration survives
 * reloads, mistakes and a walk to another room. Come back tomorrow and it is
 * clean. Nothing can accumulate across days, which is the only thing that
 * actually needed preventing.
 */

const TOUCHED = 'nuskho.practice.touched'
const GAP = 12 * 60 * 60 * 1000

/** Note that somebody is using it now. Cheap; called from the app shell. */
export function touchDemo(): void {
  if (!isDemo) return
  try { localStorage.setItem(TOUCHED, String(Date.now())) } catch { /* private mode */ }
}

function lastTouched(): number {
  try { return +(localStorage.getItem(TOUCHED) ?? 0) } catch { return 0 }
}

/**
 * Called once at startup, before the app renders.
 *
 * Returns true if it wiped, so the shell can say so rather than leaving
 * somebody wondering where yesterday's practice patients went.
 */
export async function freshenDemo(): Promise<boolean> {
  if (!isDemo) return false
  const last = lastTouched()
  const stale = !last || Date.now() - last > GAP
  if (stale) {
    // factoryReset is the same clearing the real app uses when a machine moves
    // between clinics, which is exactly the guarantee wanted here: no records,
    // no medicine list, no profile, no PINs, nothing carried over.
    try { await factoryReset() } catch { /* a demo that cannot clear must still open */ }
  }
  touchDemo()
  // The practice copy opens already working: signed in as the doctor, on the
  // queue, samples in the picker. Every screen between the tap and the product
  // is a screen where a curious doctor gives up. Sign-out still shows the role
  // door, which is itself worth seeing; no PIN exists here, so one tap returns.
  if (!signedIn()) signIn('doctor')
  // The practice doctor has a NAME. A blank profile put the word "Doctor" and
  // "Rs 0" on the demo's flagship surfaces — the door, the Tonight strip, the
  // Doctors tab — which is data-honest and demo-ugly. The name is fictional,
  // the same one the design studies use.
  if (!profile().doctorEn) {
    saveProfile({
      doctorEn: 'Dr G. Abro', doctorSd: 'ڊاڪٽر غلام ابڙو',
      degreesEn: 'MBBS', fee: 500, timing: '5:00 pm – 10:00 pm',
    })
  }
  return stale
}

/** The visible way out, for the person showing it. Same clearing, on demand. */
export async function clearDemo(): Promise<void> {
  if (!isDemo) return
  try { await factoryReset() } finally { touchDemo() }
}
