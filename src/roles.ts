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
 *             the market importer. AND NOTHING CLINICAL — see below.
 *
 * WHY THE NUSKHO ROLE NO LONGER READS PRESCRIPTIONS.
 *
 * It used to hold every permission there is, including `prescribe`, `history`,
 * `backup` and `erase`, under a passphrase that profile.ts describes as "held
 * by the company, not the clinic". That is a vendor key that opens every
 * consultation on the machine and exports the lot to a file.
 *
 * Nothing about it was malicious and it was never used. It was simply the
 * shape the app grew into while one person was both the builder and the only
 * operator. But a capability, once it exists, is defended only by the courage
 * of whoever holds it — against a court order, a police officer, a hospital
 * owner, a buyer of the company, an employee in three years. "I cannot" ends
 * those conversations. "I could, but I would not" ends none of them, and the
 * promise printed on the About screen is the first thing a doctor will check.
 *
 * So the clinical grants moved to the people who own the data. BACKUP AND
 * ERASE MOVED TOO, and that is deliberate rather than tidy: an export is a
 * complete copy of every prescription in the building, so it belongs to the
 * doctor. Restoring on a fresh install now means the doctor unlocks it while
 * standing there — which is the correct ceremony anyway, since it is his
 * practice being written onto the disk.
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

export type Role = 'counter' | 'compounder' | 'doctor' | 'pharmacy' | 'clinicadmin' | 'admin'

export const ROLES: Role[] = ['doctor', 'compounder', 'counter', 'pharmacy', 'clinicadmin', 'admin']

export const ROLE_NAME: Record<Role, string> = {
  counter: 'Token counter',
  compounder: 'Compounder',
  doctor: 'Doctor',
  pharmacy: 'Pharmacy',
  clinicadmin: 'Clinic admin',
  admin: 'Nuskho',
}

export const ROLE_SD: Record<Role, string> = {
  counter: 'ٽوڪن ڪائونٽر',
  compounder: 'ڪمپائونڊر',
  doctor: 'ڊاڪٽر',
  pharmacy: 'فارميسي',
  clinicadmin: 'اڊمن',
  admin: 'نسخو',
}

export const ROLE_WHAT: Record<Role, string> = {
  counter: 'Take the fee, give the number, hand back refunds',
  compounder: 'Run the queue and the room screen for the doctor',
  doctor: 'See patients and print prescriptions',
  pharmacy: 'Read printed slips, mark the medicines given',
  clinicadmin: 'The building: money totals, the day, the machines',
  // Not backups. The grants below withhold 'backup' from this role on purpose,
  // and the door must not promise a power the role does not have.
  admin: 'Setup, the letterhead and the medicine review',
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
  | 'dispense'     // read PRINTED slips at the counter and mark medicines given
  | 'ops'          // the building's day: money totals, backup age, the machines

const GRANTS: Record<Role, Can[]> = {
  counter: ['queue', 'money'],
  // The compounder OPERATES the room screen — intake, queue, entry, print —
  // which is why he holds 'prescribe': the doctor speaks, he types. What he
  // does not hold is anything that shapes the practice itself: the fee rate,
  // the figures, the paper, the medicine list, the locks, the backups.
  compounder: ['queue', 'money', 'prescribe', 'history'],
  doctor: ['queue', 'money', 'rate', 'prescribe', 'history', 'figures', 'paper', 'medicines', 'lock',
           'backup', 'erase', 'dispense'],
  // The pharmacy reads what was PRINTED — the lines a patient already carries
  // on paper — and marks them given. No queue, no fees, no history, no
  // diagnosis: there is no route from this role to any of them.
  pharmacy: ['dispense'],
  // Operations, never the clinical record. Money totals the desk collected,
  // the day's shape, backup age, the machines. Not one prescription.
  clinicadmin: ['ops'],
  // Deliberately no 'queue', 'prescribe', 'history', 'figures', 'money',
  // 'backup' or 'erase'. If a permission here would let us read or copy a
  // patient's record, it is in the wrong list.
  admin: ['paper', 'medicines', 'lock', 'identity', 'review'],
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
  setDoctorIdentity(null)
  window.dispatchEvent(new CustomEvent('nuskho:role'))
}

/* ----------------------------------------------------- which doctor, exactly
 *
 * In a building with several rooms, "Doctor" is a role and also a question.
 * The front door asks it once, right after the role is picked, and the answer
 * lives beside the role for the same sitting: his figures are his, his queue
 * rows open for him, and the other rooms' prescriptions do not.
 *
 * A solo clinic never sets this and never sees the question.
 */
const DKEY = 'nuskho.doctorId'

let doc: string | null = null
let docLoaded = false

export function currentDoctorId(): string | null {
  if (!docLoaded) {
    docLoaded = true
    try { doc = sessionStorage.getItem(DKEY) } catch { doc = null }
  }
  return doc
}

export function setDoctorIdentity(id: string | null): void {
  doc = id
  docLoaded = true
  try {
    if (id) sessionStorage.setItem(DKEY, id)
    else sessionStorage.removeItem(DKEY)
  } catch { /* private mode: memory is enough */ }
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
