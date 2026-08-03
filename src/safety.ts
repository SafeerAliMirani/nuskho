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
