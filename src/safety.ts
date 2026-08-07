import { db } from './db'
import { makeBackup } from './backup'

/**
 * The four things that can lose a clinic its records, none of which are exotic.
 *
 * This is a browser app on a Windows machine in a clinic. The failure modes are
 * not database corruption or exotic race conditions — they are a helpful nephew
 * clearing browsing data, a disk dying at nine in the evening, and a restore
 * quietly handing two families the same patient number.
 */

/* ------------------------------------------------------------- 1. eviction */

/**
 * Without this, Chrome treats the whole practice as cache and is entitled to
 * throw it away when the disk gets tight — and "Clear browsing data" takes it
 * instantly. Asking is free and the answer is remembered.
 */
export async function keepStorage(): Promise<boolean> {
  try {
    const s = navigator.storage
    if (!s?.persist) return false
    if (await s.persisted?.()) return true
    return await s.persist()
  } catch { return false }
}

export async function storageReport(): Promise<{ persisted: boolean; usedMb: number; quotaMb: number }> {
  try {
    const s = navigator.storage
    const persisted = (await s?.persisted?.()) ?? false
    const e = (await s?.estimate?.()) ?? {}
    return {
      persisted,
      usedMb: Math.round(((e.usage ?? 0) / 1048576) * 10) / 10,
      quotaMb: Math.round((e.quota ?? 0) / 1048576),
    }
  } catch { return { persisted: false, usedMb: 0, quotaMb: 0 } }
}

/* ------------------------------------------- 2. the patient number counter */

const HWM = 'nuskho.patientHighWater'

/**
 * The number printed on a slip IS the patient's card, so it may never be issued
 * twice. A restore rewinds the patients table to last night — and the forty
 * families who were given numbers today are still holding them on paper.
 *
 * The high-water mark therefore lives OUTSIDE the restorable set and only ever
 * goes up. A gap in the numbering costs nothing; a collision costs two people
 * one identity.
 */
export function noteIssued(num: number): void {
  try {
    const cur = +(localStorage.getItem(HWM) ?? 0)
    if (num > cur) localStorage.setItem(HWM, String(num))
  } catch { /* private mode: fall back to the table */ }
}

export function highWater(): number {
  try { return +(localStorage.getItem(HWM) ?? 0) } catch { return 0 }
}

/** After a restore, never re-enter numbers that may already be on paper. */
export function bumpHighWaterPastRestore(seen: number): void {
  const SAFETY = 50
  const to = Math.max(highWater(), seen) + SAFETY
  try { localStorage.setItem(HWM, String(to)) } catch { /* ignore */ }
}

/* ------------------------------------------------- 2b. the token counter
   The same failure, one day wide, and it was left unguarded.

   nextToken() was max(today's visits) + 1 read straight from the table. Restore
   a backup taken at lunchtime and the afternoon's visits vanish — so the next
   patient is issued token 8 while another family is sitting in the room holding
   a thermal receipt that says 8, and the doctor calls it. Two people stand up.

   Patient numbers were protected against exactly this and tokens were not,
   because tokens reset daily and looked disposable. They are not disposable:
   they are shouted out loud in a room full of people, which makes a collision
   more visible and more immediate than a duplicated patient number.

   Keyed by day, so it cannot leak into tomorrow, and it only ever rises. */

const TOKEN_HWM = 'nuskho.tokenHighWater'

/**
 * THE CLINICAL DAY ENDS AT 4 AM, NOT MIDNIGHT.
 *
 * A famous doctor's evening runs past twelve. At the stroke of midnight a
 * calendar day would empty the queue mid-sitting, restart every room's tokens
 * at 1 while a family holds receipt 1 from eleven o'clock, and flip a "not
 * sitting tonight" doctor back on — three lies at once, at the worst hour.
 * Shifting the boundary to 4 am means a sitting is one day however late it
 * runs, and nobody is at the desk at 4 am to notice the seam.
 */
export const CLINIC_DAY_SHIFT = 4 * 3600 * 1000

export const dayKey = (t = Date.now()): string => new Date(t - CLINIC_DAY_SHIFT).toDateString()

/** Rooms count their own tokens, so each room guards its own mark. The solo
 *  clinic passes nothing and keeps the key it has used since the pilot. */
const tokenKey = (who?: string) => (who ? `${TOKEN_HWM}.${who}` : TOKEN_HWM)

export function tokenHighWater(day = dayKey(), who?: string): number {
  try {
    const raw = JSON.parse(localStorage.getItem(tokenKey(who)) ?? 'null')
    return raw && raw.day === day ? +raw.n || 0 : 0
  } catch { return 0 }
}

export function noteToken(n: number, day = dayKey(), who?: string): void {
  try {
    if (n <= tokenHighWater(day, who)) return
    localStorage.setItem(tokenKey(who), JSON.stringify({ day, n }))
  } catch { /* private mode: fall back to the table */ }
}

/* ------------------------------------------------------ 3. nightly snapshot */

const SNAP_KEY = 'nuskho.lastSnapshot'
const EXPORT_KEY = 'nuskho.lastExport'
const DAY = 86400000

/**
 * A browser cannot silently write a file to a second drive, so this is the
 * honest version: a full snapshot kept inside the database, once a day, three
 * deep. It survives a crash, a bad restore and a mistake. It does NOT survive
 * the disk dying — only an exported file does, which is why the nudge below
 * exists and why off-site backup is still the real answer.
 */
export async function snapshotDaily(): Promise<boolean> {
  try {
    const last = +(localStorage.getItem(SNAP_KEY) ?? 0)
    if (Date.now() - last < DAY) return false
    const blob = JSON.stringify(await makeBackup('full'))
    await db.table('snapshots').put({ at: Date.now(), blob })
    const all = await db.table('snapshots').orderBy('at').toArray()
    for (const s of all.slice(0, Math.max(0, all.length - 3))) {
      await db.table('snapshots').delete(s.at)
    }
    localStorage.setItem(SNAP_KEY, String(Date.now()))
    return true
  } catch { return false }
}

export function noteExported(): void {
  try { localStorage.setItem(EXPORT_KEY, String(Date.now())) } catch { /* ignore */ }
}

/**
 * THE SNAPSHOTS, WHERE A PERSON CAN REACH THEM.
 *
 * `snapshotDaily` has been writing a full dump into the database every day,
 * three deep, since the pilot build. Nothing read them. `reset.ts` cleared
 * them. So the app carried the cost of the safety net every night and could not
 * have caught anybody with it, which is the worst of both: the reassurance
 * without the rescue.
 *
 * They are for the two failures an exported file is bad at. A restore that went
 * wrong, and a mistake somebody made this morning: in both cases last night's
 * copy is already here, and the pen drive is at home in a drawer. They are NOT
 * for a dead disk. Only a file that left the machine survives that, which is
 * why the nudge to export one still exists and still nags.
 */
export type Snap = { at: number; kb: number }

export async function snapshotList(): Promise<Snap[]> {
  try {
    const all = await db.table('snapshots').orderBy('at').reverse().toArray()
    return all.map((s: { at: number; blob: string }) => ({
      at: s.at, kb: Math.max(1, Math.round((s.blob?.length ?? 0) / 1024)),
    }))
  } catch { return [] }
}

export async function snapshotText(at: number): Promise<string | null> {
  try {
    const s = await db.table('snapshots').get(at)
    return s?.blob ?? null
  } catch { return null }
}

/** Days since a file actually left this machine. Null = never. */
export function daysSinceExport(): number | null {
  try {
    const t = +(localStorage.getItem(EXPORT_KEY) ?? 0)
    return t ? Math.floor((Date.now() - t) / DAY) : null
  } catch { return null }
}

/* ---------------------------------------------------------- 4. cold printer */

const WARM_KEY = 'nuskho.lastPrint'

/**
 * The first print after an idle hour is the slow one — the laser has to wake,
 * and it happens at nine in the evening in front of a full room. Knowing it is
 * coming is most of the fix; the screen can say "waking the printer" instead of
 * looking frozen.
 */
export function notePrinted(): void {
  try { localStorage.setItem(WARM_KEY, String(Date.now())) } catch { /* ignore */ }
}

export function printerLikelyCold(): boolean {
  try {
    const t = +(localStorage.getItem(WARM_KEY) ?? 0)
    return !t || Date.now() - t > 20 * 60000
  } catch { return true }
}
