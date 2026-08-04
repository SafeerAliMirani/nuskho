import { db } from './db'
import { profile, saveProfile, adminBlob, restoreAdminBlob, type Profile } from './profile'
import { paper, setPaper, type Paper } from './paper'
import { bumpHighWaterPastRestore, noteExported } from './safety'
import { isDemo } from './version'
import type { Drug, Patient, Visit } from './types'

/**
 * Moving a clinic to another machine, and getting the records back after one
 * dies.
 *
 * Everything this app knows lives in one browser on one device. That is what
 * makes it work with no internet, and it is also the whole risk: a stolen
 * laptop, a reinstalled Windows or a cleared browser takes the lot. So there
 * are two files, and they are deliberately different things.
 *
 *   SETUP   — who the doctor is, what he prints on, and his medicine list.
 *             No patients. Safe to email, safe to keep on a pen drive, safe to
 *             carry to his tablet or a new PC. This is the one to hand over.
 *
 *   FULL    — the same plus every patient and every prescription.
 *             This is medical records. It never leaves the clinic, it is not
 *             emailed, and it is not ours.
 */
const MAGIC = 'nuskho.backup'
const VERSION = 1

export type SetupFile = {
  magic: typeof MAGIC
  version: number
  kind: 'setup' | 'full'
  at: number
  profile: Profile
  paper: Paper
  drugs: Drug[]
  patients?: Patient[]
  visits?: Visit[]
  /** the Nuskho passphrase hash, so the lock survives the move to a new machine */
  admin?: string | null
}

export async function makeBackup(kind: 'setup' | 'full'): Promise<SetupFile> {
  const out: SetupFile = {
    magic: MAGIC, version: VERSION, kind, at: Date.now(),
    profile: profile(), paper: paper(),
    drugs: await db.drugs.toArray(),
    admin: adminBlob(),
  }
  if (kind === 'full') {
    out.patients = await db.patients.toArray()
    out.visits = await db.visits.toArray()
  }
  return out
}

export function backupFilename(kind: 'setup' | 'full', p = profile()): string {
  const who = (p.doctorEn || 'clinic').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `nuskho-${kind}-${who}-${stamp}.json`
}

/**
 * THE PRACTICE COPY CANNOT EXPORT. THIS IS THE DOOR THAT HAD TO BE SHUT.
 *
 * The watermark stops a demo slip being used as a prescription, and the
 * separate database stops demo patients appearing in a real clinic by
 * accident. This closes the third and least obvious route: somebody works in
 * the demo for a fortnight, decides to go properly, and exports the lot into
 * the real install. Everything about those records is untrustworthy — half
 * typed to see what happens, Sindhi never reviewed by a person, numbers issued
 * by a copy of the app that has since been rebuilt four times — and once they
 * are in the clinic database nothing distinguishes them from real ones.
 *
 * Retyping three patients costs an afternoon. A clinic that cannot tell which
 * of its records are real costs the practice.
 *
 * Moving a MEDICINE LIST out of the demo would be harmless and is worth
 * building when somebody asks; moving patients never is.
 */
export class DemoRefusal extends Error {
  constructor() {
    super('This is a practice copy. It cannot save records to a file — set up the clinic first.')
    this.name = 'DemoRefusal'
  }
}

export async function downloadBackup(kind: 'setup' | 'full'): Promise<void> {
  if (isDemo) throw new DemoRefusal()
  const data = await makeBackup(kind)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = backupFilename(kind)
  a.click()
  noteExported()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

export type RestoreReport = {
  kind: 'setup' | 'full'
  drugs: number
  patients: number
  visits: number
  skipped: number
}

export function readBackup(text: string): SetupFile {
  const f = JSON.parse(text)
  if (f?.magic !== MAGIC) throw new Error('That is not a Nuskho setup file.')
  if (typeof f.version !== 'number' || f.version > VERSION)
    throw new Error('That file was made by a newer version of Nuskho.')
  return f as SetupFile
}

/**
 * Restore onto this machine.
 *
 * Adds, never replaces: a medicine or patient that already exists here is left
 * exactly as it is. Restoring the same file twice must not double the list, and
 * must never overwrite something this clinic has since corrected.
 */
export async function restore(f: SetupFile, takeIdentity = false): Promise<RestoreReport> {
  const rep: RestoreReport = { kind: f.kind, drugs: 0, patients: 0, visits: 0, skipped: 0 }

  /**
   * WHOSE NAME IS ON THE PRESCRIPTION.
   *
   * This used to overwrite the doctor's name, degrees, PMC registration number
   * and logo from whatever file was handed to it, from a tab any clinic user can
   * reach. Those are exactly the fields the admin passphrase exists to protect,
   * so the lock was bypassable by anyone holding a JSON file — and the field it
   * rewrote is the one that legally identifies who prescribed.
   *
   * It also replaced the admin hash, which locks admin out permanently on this
   * machine if you do not know the passphrase in the file, with the only escape
   * sitting behind that same lock.
   *
   * So identity now only moves when the caller explicitly asks for it, which is
   * the first-run wizard setting up a second machine for the same doctor, and
   * never the Restore button in a running clinic.
   */
  if (takeIdentity) {
    saveProfile({ ...f.profile, ready: true })
    setPaper(f.paper)
    restoreAdminBlob(f.admin)
  }

  const have = new Set((await db.drugs.toArray())
    .map(d => `${d.brand} ${d.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')))
  for (const d of f.drugs ?? []) {
    const k = `${d.brand} ${d.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (have.has(k)) { rep.skipped++; continue }
    have.add(k)
    await db.drugs.put(d)
    rep.drugs++
  }

  for (const p of f.patients ?? []) {
    if (await db.patients.get(p.id)) { rep.skipped++; continue }
    await db.patients.put(p)
    rep.patients++
  }
  // Numbers issued since this file was made may already be on paper in someone's
  // hand. Jump the counter clear of everything restored rather than risk a
  // collision; a gap in the numbering costs nothing.
  const top = Math.max(0, ...(f.patients ?? []).map(p => p.num || 0))
  if (top) bumpHighWaterPastRestore(top)
  for (const v of f.visits ?? []) {
    if (await db.visits.get(v.id)) { rep.skipped++; continue }
    await db.visits.put(v)
    rep.visits++
  }
  return rep
}

/** Read a chosen file as text. */
export function readFile(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onerror = () => rej(new Error('The file could not be read.'))
    fr.onload = () => res(String(fr.result))
    fr.readAsText(f)
  })
}
