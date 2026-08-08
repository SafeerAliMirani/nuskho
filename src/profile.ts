/**
 * Everything about one doctor that used to be hard-coded in clinic.ts.
 *
 * It was hard-coded because we were going to install it ourselves. That does
 * not survive contact with the second clinic: every doctor has a different
 * name, registration number, letterhead, printer and screen. So this is stored,
 * set once in the first-run wizard, and editable afterwards in Setup.
 *
 * It is read synchronously by the print renderer, which is deliberately
 * framework-free, so it lives in a module cache backed by localStorage rather
 * than in the database.
 */
export type Profile = {
  doctorEn: string
  doctorSd: string
  degreesEn: string
  degreesSd: string
  reg: string
  addressEn: string
  /**
   * THE APPOINTMENTS NUMBER, AND IT IS NOT THE DOCTOR'S.
   *
   * Doctors here do not print a number people can ring them on. Some print the
   * compounder's, for appointments and for asking when the clinic is open, and
   * it goes at the FOOT of the slip rather than in the heading beside the
   * doctor's name — where it read as "call me".
   *
   * That placement is the whole difference between a convenience and a nuisance
   * a doctor turns off after a week of being telephoned at ten at night.
   */
  phone: string
  timing: string
  /** data URL, printed instead of the typed name block when we print the heading */
  logo?: string
  /** how tall the logo prints, in mm */
  logoMm: number
  /** the small Nuskho mark at the foot. Removal is always free. */
  showCredit: boolean
  /** the patient-code square in the corner of the slip. On by default: it costs
   *  nothing, and a clinic with a 600-rupee USB scanner stops typing codes. */
  showQr: boolean
  /**
   * A blank line for a signature and stamp.
   *
   * Off. A slip that a machine prints identically every time, carrying the
   * doctor's registration number, does not become more his because there is an
   * empty rectangle at the bottom of it — and the rectangle costs about 20mm,
   * which is two more medicines on an A5 sheet. It is still a setting, because
   * a doctor who is asked for a signature by a hospital or an insurer needs the
   * line to be there.
   */
  showSign: boolean
  /** the consultation fee the counter charges, in rupees. The doctor changes it
   *  whenever he likes; it is only ever a default the counter can override. */
  fee: number
  /** which list of diagnoses he starts from. See data/specialty.ts. */
  specialty: string
  /**
   * HIS diagnoses, not ours.
   *
   * Seeded from the specialty he picks and then edited by him. The eight we
   * used to hard-code were a general physician's, which is useless to a skin
   * or an eye specialist, and a specialist reading somebody else's diagnoses
   * learns in ten seconds that this was not built for him.
   */
  dx: string[]

  /** set once the wizard has been completed */
  ready: boolean
}

/** Fixed, not per-doctor. */
/**
 * `web` is BLANK until the domain is actually registered.
 *
 * A slip is permanent. Printing an address we do not own onto a few thousand of
 * them, handed to people who keep them in a drawer for years, means that whoever
 * registers nuskho.pk next inherits every patient who ever types it in. Put the
 * string back the day the registration is confirmed and not one day before.
 */
export const APP = { en: 'Nuskho', sd: 'نسخو', web: '' }

const DEFAULT: Profile = {
  doctorEn: '', doctorSd: '', degreesEn: '', degreesSd: '', reg: '',
  addressEn: '', phone: '', timing: '',
  logoMm: 16, showCredit: true, showQr: true, showSign: false, fee: 0,
  specialty: 'gp', dx: [], ready: false,
}

const KEY = 'nuskho.profile'
let current: Profile | null = null

export function profile(): Profile {
  if (current) return current
  let next: Profile
  try {
    const raw = localStorage.getItem(KEY)
    next = raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT }
  } catch { next = { ...DEFAULT } }
  current = next
  return next
}

export function saveProfile(p: Partial<Profile>): Profile {
  const next = { ...profile(), ...p }
  current = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent('nuskho:profile'))
  return next
}

/**
 * Enough to print a slip that identifies the doctor.
 *
 * THE REGISTRATION NUMBER IS NO LONGER PART OF THIS. It was required because a
 * prescription ought to name who is legally answerable for it, which is true
 * everywhere and beside the point here: doctors in Larkana do not put a PMC
 * number on a slip, and an app that will not open until one is typed is an app
 * that gets a made-up number typed into it on the first evening. A field nobody
 * fills honestly is worse than no field.
 *
 * So it stays, it is optional, and it prints only when a doctor has actually
 * entered it.
 */
export function profileComplete(p = profile()): boolean {
  return !!p.doctorEn.trim()
}

/* --------------------------------------------------------------------------
   THE SCREEN LOCK USED TO LIVE HERE. It does not any more.

   Before roles there was one PIN for the whole app, at `nuskho.pin`, with
   `pinIsSet`, `setPin` and `checkPin` beside it. Roles gave every job its own
   PIN in `roles.ts` and nothing here was ever removed, so three authentication
   functions sat in this file reading a key no door consulted. `checkPin`
   returned TRUE for any input on a machine that had moved on, which is
   correct-looking, plausible, and would open anything the next person wired it
   to.

   Dead authentication is worse than missing authentication: it looks like a
   lock. The real one is `checkRolePin` in roles.ts, and `adoptOldPin()` there
   carries an old machine's number onto the doctor at startup, which is the only
   reason `nuskho.pin` is ever read now.

   The hashing stayed, because the ADMIN passphrase below still uses it.
   -------------------------------------------------------------------------- */

async function hash(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + '|' + pin)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/* --------------------------------------------------------------------------
   Admin.

   A second, separate passphrase held by the company, not the clinic. It guards
   the things that constitute a legal identity on a medical document — the
   doctor's name, his degrees, his PMC registration number, the logo — plus the
   Nuskho credit line.

   It deliberately does NOT guard the medicine list. The medicines a doctor
   prescribes are his clinical vocabulary and his legal responsibility, and an
   offline app that cannot add a medicine without phoning us is an app that gets
   abandoned the first busy evening. We review and correct his list on visits;
   we do not stand in front of it.
   -------------------------------------------------------------------------- */
const ADMIN_KEY = 'nuskho.admin'

/** Cleared on reload, on purpose: unlocking is per sitting, not for ever. */
let adminOpen = false

export function adminIsSet(): boolean {
  try { return !!localStorage.getItem(ADMIN_KEY) } catch { return false }
}

/** With no admin passphrase set, nothing is locked — a machine we have not yet
 *  handed over must not lock us out of it either. */
export function adminUnlocked(): boolean {
  return adminOpen || !adminIsSet()
}

/** What the person at the keyboard is allowed to do right now. */
export type Role = 'clinic' | 'admin'

export function role(): Role {
  return adminUnlocked() ? 'admin' : 'clinic'
}

export const ROLE_NAME: Record<Role, string> = {
  clinic: 'Clinic',
  admin: 'Nuskho admin',
}

export function lockAdmin(): void {
  adminOpen = false
  window.dispatchEvent(new CustomEvent('nuskho:admin'))
}

/**
 * `keepOpen` is false when the passphrase is set at the end of the first-run
 * wizard: setup is finished and the machine is about to be handed over, so it
 * must be locked from that moment, not from the next reload. It is true when an
 * already-unlocked admin changes the passphrase — locking him out mid-edit
 * would be absurd.
 */
export async function setAdminKey(pass: string, keepOpen = true): Promise<void> {
  if (!pass) { try { localStorage.removeItem(ADMIN_KEY) } catch { /* ignore */ } adminOpen = true; return }
  const salt = [...crypto.getRandomValues(new Uint8Array(8))]
    .map(b => b.toString(16).padStart(2, '0')).join('')
  const h = await hash(pass, salt)
  try { localStorage.setItem(ADMIN_KEY, JSON.stringify({ salt, h })) } catch { /* ignore */ }
  adminOpen = keepOpen
}

export async function unlockAdmin(pass: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    if (!raw) { adminOpen = true; return true }
    const { salt, h } = JSON.parse(raw)
    const ok = (await hash(pass, salt)) === h
    if (ok) { adminOpen = true; window.dispatchEvent(new CustomEvent('nuskho:admin')) }
    return ok
  } catch { return false }
}

/** The stored hash, so a setup file can carry the lock to the next machine.
 *  Without this, exporting the setup and importing it elsewhere would strip the
 *  lock, which would make it theatre. */
export function adminBlob(): string | null {
  try { return localStorage.getItem(ADMIN_KEY) } catch { return null }
}

export function restoreAdminBlob(blob: string | null | undefined): void {
  if (!blob) return
  try { localStorage.setItem(ADMIN_KEY, blob) } catch { /* ignore */ }
  adminOpen = false
}
