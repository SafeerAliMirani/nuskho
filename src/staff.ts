import { ROLES, type Role } from './roles'

/**
 * WHICH JOBS THIS BUILDING ACTUALLY HAS, AND WHO DECIDES.
 *
 * Safeer, on how a clinic is really staffed:
 *
 *   "token counter and compounder can be same, and admin and doctor can be
 *    same, also if solo dr then it can play all roles even the pharmacy. So
 *    when we sell our app to someone, we ask them what roles they want."
 *
 * THE FIRST HALF NEEDED NO CODE, AND THAT IS WORTH SAYING OUT LOUD. The roles
 * already nest, on purpose:
 *
 *      doctor  ⊃  compounder  ⊃  counter
 *      doctor  ⊃  pharmacy
 *
 * So one person doing two jobs does not need two sign-ins or a way to merge
 * roles. He signs in as the WIDER one and the narrower job is inside it. A
 * counter clerk who also runs the queue is a compounder. A solo doctor is the
 * doctor, and dispensing is already in his hands. Anything that let a person
 * hold two roles at once would be a second way to express the same fact, and
 * two ways to express one fact is how permission systems start disagreeing
 * with themselves.
 *
 * WHAT DID NEED CODE is that every clinic saw all six doors whether or not
 * those jobs existed. A doctor alone in one room opened Nuskho and was asked
 * to choose between six people, five of whom were him. So a building now
 * declares which jobs it has, and the front door shows only those.
 *
 * THE ONE THAT IS NOT A SUBSET. `clinicadmin` holds `ops` and nothing else,
 * and `ops` is in no other role. That is deliberate: it is the building's
 * money and machines, never the clinical record. A doctor who OWNS his
 * building genuinely wants it, so he can be given it here without becoming a
 * different person. What he cannot do is hand somebody `ops` and have that
 * person reach a prescription, because `ops` does not contain one.
 */

const KEY = 'nuskho.staff'
const OWNER = 'nuskho.owner'

/** Jobs a building can switch on. `admin` is Nuskho's and is never in this list. */
export const STAFF_ROLES: Role[] = ROLES.filter(r => r !== 'admin')

/**
 * The default for a machine nobody has configured: the doctor, alone.
 *
 * That is the shipped solo product and the commonest clinic in Larkana. Every
 * other job is added deliberately, by somebody who knows the building.
 */
const DEFAULT: Role[] = ['doctor']

export function staffRoles(): Role[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    const v = JSON.parse(raw)
    if (!Array.isArray(v)) return DEFAULT
    const on = STAFF_ROLES.filter(r => v.includes(r))
    // A building with no doors at all cannot be opened by anybody, which is a
    // way to lose a clinic to a mis-tap. The doctor is never switchable off.
    return on.includes('doctor') ? on : ['doctor', ...on]
  } catch { return DEFAULT }
}

export function setStaffRoles(rs: Role[]): void {
  const on = STAFF_ROLES.filter(r => rs.includes(r) || r === 'doctor')
  try { localStorage.setItem(KEY, JSON.stringify(on)) } catch { /* ignore */ }
}

export const roleIsOn = (r: Role): boolean => r === 'admin' || staffRoles().includes(r)

/* ------------------------------------------------------------------- owner */

/**
 * WHO BOUGHT IT, WHICH IS WHO MAY CHANGE IT.
 *
 * Safeer: "if the app is directly purchased by doctor then doctor can assign
 * roles and if the app is purchased by admin then he can."
 *
 * That is an ordinary employer power and it belongs to whoever owns the
 * building. Nuskho records it at install and it is not the clinic's to change,
 * because a staff member who could promote himself to owner would make the
 * whole arrangement decorative.
 *
 * IT DOES NOT MOVE ONE CLINICAL PERMISSION. An owner who is not a doctor turns
 * jobs on and off and sets the PINs for the jobs he employs. He cannot give
 * himself `prescribe`, `history` or `figures`, he cannot set the DOCTOR's PIN,
 * and `ops` still contains no prescription. The website's promise that an
 * administrator never reaches further than the doctors allow stays literally
 * true, and it stays true because of what the roles contain, not because
 * anybody is being trusted.
 */
export type Owner = 'doctor' | 'clinicadmin'

export function owner(): Owner {
  try { return localStorage.getItem(OWNER) === 'clinicadmin' ? 'clinicadmin' : 'doctor' }
  catch { return 'doctor' }
}

export function setOwner(o: Owner): void {
  try { localStorage.setItem(OWNER, o) } catch { /* ignore */ }
}

/** May the person at the keyboard decide which jobs this building has? */
export const mayStaff = (r: Role): boolean => r === 'admin' || r === owner()

/**
 * Whose PIN may this person set?
 *
 * The doctor's PIN is the doctor's, always, whoever owns the building. It is
 * the one that guards the prescriptions.
 */
export function mayPin(who: Role, target: Role): boolean {
  if (who === 'admin') return target !== 'doctor'
  if (who === 'doctor') return true
  if (who === 'clinicadmin' && owner() === 'clinicadmin') return target !== 'doctor'
  return false
}
