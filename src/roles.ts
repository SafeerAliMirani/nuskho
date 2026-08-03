/**
 * WHO IS AT THE KEYBOARD.
 *
 * Until now there was one role that was not really a role: `admin` if the
 * Nuskho passphrase happened to be unlocked, `clinic` otherwise, and on a
 * machine where no passphrase had ever been set, everybody was admin. Every
 * check in the app hung off that, and all of them were cosmetic. The practical
 * result was that the person at the counter could open any prescription, read
 * any patient's previous diagnosis, see the month's earnings, and export every
 * record in the database to a file.
 *
 * That was survivable while one doctor used one laptop. It stops being
 * survivable the moment a second machine exists, because a pharmacy terminal
 * inheriting "everyone can read everything" is precisely the prescribing-data
 * aggregator this design has refused from the start.
 *
 * SO THE ROLES ARE REAL NOW, AND THE SHAPE IS THE CLINIC'S, NOT A COMPUTER'S:
 *
 *   COUNTER   takes the money, issues the token, hands back a refund the doctor
 *             granted, closes a patient who left. Sees names, numbers, fees and
 *             the day's cash, because that is the job. Sees no prescription, no
 *             diagnosis, no history, and cannot export anything.
 *
 *   DOCTOR    prescribes, and everything the counter can do, because at eight in
 *             the evening he is sometimes also the counter. Sees his own figures.
 *             Owns his paper, his medicine list and his own PIN.
 *
 *   NUSKHO    us, on a visit. Identity, letterhead, the medicine review queue,
 *             the market importer, backups, and erasing the machine.
 *
 * THE RULE THAT KEEPS THIS HONEST: a role is a floor, never a ceiling on speed.
 * Nothing here may add a step between the doctor and the printed paper. Signing
 * in happens once, at the start of the evening, and never again.
 *
 * PINS ARE OPTIONAL AND PER ROLE. A single-room clinic where the doctor is also
 * the counter sets none, taps his role, and works. A clinic with staff sets one
 * on the doctor so the counter cannot open the room's screen. A forgotten PIN
 * must never be able to stop an evening, so a lock that cannot be read is a lock
 * that lets you in.
 */

export type Role = 'counter' | 'doctor' | 'admin'

export const ROLES: Role[] = ['counter', 'doctor', 'admin']

export const ROLE_NAME: Record<Role, string> = {
  counter: 'Counter',
  doctor: 'Doctor',
  admin: 'Nuskho admin',
}

export const ROLE_SD: Record<Role, string> = {
  counter: 'ڪائونٽر',
  doctor: 'ڊاڪٽر',
  admin: 'نسخو',
}

export const ROLE_WHAT: Record<Role, string> = {
  counter: 'Take the fee, give the number, hand back refunds',
  doctor: 'See patients and print prescriptions',
  admin: 'Setup, medicine review and backups',
}

/* ------------------------------------------------------------ what each may do */

/**
 * One list, in one file, read by every screen. A permission that is decided in
 * two places is a permission that disagrees with itself.
 */
export type Can =
  | 'queue'        // see and work the day's list
  | 'money'        // take fees, see the day's cash, hand back refunds
  | 'rate'         // decide what the fee IS. Charging it is not setting it.
  | 'prescribe'    // open a visit, write medicines, print a slip
  | 'history'      // read what a patient was prescribed before
  | 'figures'      // the month: patients, earnings, the shareable card
  | 'paper'        // paper size, letterhead, the token printer
  | 'medicines'    // add to the clinic's own medicine list
  | 'lock'         // change the PINs
  | 'identity'     // name, degrees, registration number, logo
  | 'review'       // the medicine review queue and the market importer
  | 'backup'       // export or restore the whole database
  | 'erase'        // clear records, factory reset

const GRANTS: Record<Role, Can[]> = {
  counter: ['queue', 'money'],
  doctor: ['queue', 'money', 'rate', 'prescribe', 'history', 'figures', 'paper', 'medicines', 'lock'],
  admin: ['queue', 'money', 'rate', 'prescribe', 'history', 'figures', 'paper', 'medicines', 'lock',
          'identity', 'review', 'backup', 'erase'],
}

export const can = (what: Can, who: Role = role()): boolean => GRANTS[who].includes(what)

/* ------------------------------------------------------------------- the session */

/**
 * sessionStorage, not localStorage and not memory.
 *
 * Memory would sign him out on every accidental reload, in the middle of a
 * queue. localStorage would leave the doctor's screen unlocked on a machine
 * somebody carried home. A tab that stays open stays signed in; closing it ends
 * the sitting. That is the same promise the screen lock already makes.
 */
const KEY = 'nuskho.role'

let current: Role | null = null
let loaded = false

export function role(): Role {
  if (!loaded) {
    loaded = true
    try {
      const raw = sessionStorage.getItem(KEY)
      current = raw && (ROLES as string[]).includes(raw) ? (raw as Role) : null
    } catch { current = null }
  }
  // Nobody signed in yet: assume the least. Every screen that matters checks a
  // permission rather than a name, so an unknown person gets the counter's view
  // and not the doctor's, which is the safe way round to be wrong.
  return current ?? 'counter'
}

export const signedIn = (): boolean => { role(); return current !== null }

export function signIn(r: Role): void {
  current = r
  loaded = true
  try { sessionStorage.setItem(KEY, r) } catch { /* private mode: memory is enough */ }
  window.dispatchEvent(new CustomEvent('nuskho:role'))
}

export function signOut(): void {
  current = null
  loaded = true
  try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('nuskho:role'))
}

/* ------------------------------------------------------------- per-role PINs */

const pinKey = (r: Role) => `nuskho.pin.${r}`

async function digest(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + '|' + pin)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function pinSet(r: Role): boolean {
  try { return !!localStorage.getItem(pinKey(r)) } catch { return false }
}

export async function setRolePin(r: Role, pin: string): Promise<void> {
  if (!pin) { try { localStorage.removeItem(pinKey(r)) } catch { /* ignore */ } return }
  const salt = [...crypto.getRandomValues(new Uint8Array(8))]
    .map(b => b.toString(16).padStart(2, '0')).join('')
  try { localStorage.setItem(pinKey(r), JSON.stringify({ salt, h: await digest(pin, salt) })) }
  catch { /* ignore */ }
}

/** A lock that cannot be read is a lock that opens. An evening must never end
 *  because a hash would not parse. */
export async function checkRolePin(r: Role, pin: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(pinKey(r))
    if (!raw) return true
    const { salt, h } = JSON.parse(raw)
    return (await digest(pin, salt)) === h
  } catch { return true }
}
