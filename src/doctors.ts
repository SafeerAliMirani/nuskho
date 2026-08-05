import { profile } from './profile'

/**
 * SEVERAL DOCTORS' ROOMS ON ONE MACHINE.
 *
 * A Larkana hospital clinic in the evening is a corridor of doors: Room 1 is
 * medicine, Room 2 is children, Room 4 sits on Thursdays. One desk at the gate
 * takes the fee and issues the token, and each room's tokens count from one,
 * because "token 12 for Room 2" is how the corridor already talks.
 *
 * THE FIRST DOCTOR IS NOT STORED HERE, ON PURPOSE. He is the profile — the
 * name set in the first-run wizard, edited under Setup, printed on every slip
 * since the pilot. Storing a copy of him here would create two spellings of
 * the same man and no rule about which one prints. So the first doctor is
 * DERIVED from the profile on every read, and only the ADDITIONAL doctors
 * live in this module's storage. A solo clinic therefore stores nothing,
 * changes nothing, and never sees any of this.
 *
 * Like profile.ts, this is localStorage behind a module cache, because the
 * print renderer is framework-free and reads synchronously.
 */
export type Doctor = {
  id: string
  nameEn: string
  nameSd: string
  degreesEn: string
  degreesSd: string
  reg: string
  /** his consultation fee — each room charges its own */
  fee: number
  /** the door label the corridor uses: "1", "2", "4" */
  room: string
  /** retired from the pickers. The record stays: printed slips name him. */
  archived?: boolean
}

/** The id every pre-rooms visit belongs to: visits with no doctorId are his. */
export const FIRST_DOCTOR = 'D1'

const KEY = 'nuskho.doctors'

let cache: Doctor[] | null = null

function extras(): Doctor[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? (JSON.parse(raw) as Doctor[]) : []
  } catch { cache = [] }
  return cache
}

function persist(list: Doctor[]): void {
  cache = list
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent('nuskho:doctors'))
}

/** The profile, worn as a doctor. Always fresh, never copied. */
export function firstDoctor(): Doctor {
  const p = profile()
  return {
    id: FIRST_DOCTOR,
    nameEn: p.doctorEn || 'Doctor',
    nameSd: p.doctorSd,
    degreesEn: p.degreesEn,
    degreesSd: p.degreesSd,
    reg: p.reg,
    fee: p.fee,
    room: '1',
  }
}

export const allDoctors = (): Doctor[] => [firstDoctor(), ...extras()]

export const activeDoctors = (): Doctor[] => allDoctors().filter(d => !d.archived)

export const doctorById = (id?: string): Doctor | undefined =>
  id ? allDoctors().find(d => d.id === id) : undefined

/** Which doctor a visit belongs to, old visits included. */
export const visitDoctorId = (doctorId?: string): string => doctorId ?? FIRST_DOCTOR

/**
 * The one switch everything else hangs off. With one active doctor the app is
 * the shipped solo product: no room strip, no doctor picker at the door, no
 * room tags, tokens counted the way they always were.
 */
export const multiRoom = (): boolean => activeDoctors().length > 1

export function addDoctor(d: Omit<Doctor, 'id'>): Doctor {
  const id = 'D' + Date.now().toString(36).toUpperCase()
  const next = { ...d, id }
  persist([...extras(), next])
  return next
}

export function updateDoctor(id: string, patch: Partial<Omit<Doctor, 'id'>>): void {
  if (id === FIRST_DOCTOR) return   // he is the profile; Setup edits him there
  persist(extras().map(d => (d.id === id ? { ...d, ...patch } : d)))
}

/** Never deleted: a printed slip in a drawer names him. */
export function setDoctorArchived(id: string, archived: boolean): void {
  if (id === FIRST_DOCTOR) return
  persist(extras().map(d => (d.id === id ? { ...d, archived: archived || undefined } : d)))
}

/* ----------------------------------------------------------- sitting tonight
 *
 * Per evening, and it stores who is OFF rather than who is on. The default is
 * therefore "everyone is sitting", which costs the desk nothing on the normal
 * night and one tap on the night a doctor does not come. A selection that had
 * to be built every evening would be abandoned by the second week.
 *
 * Keyed by day so yesterday's absence cannot leak into tonight.
 */
const SIT_KEY = 'nuskho.sitting'

const dayOf = () => new Date().toDateString()

function offIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SIT_KEY) ?? 'null')
    return raw && raw.day === dayOf() ? (raw.off as string[]) : []
  } catch { return [] }
}

export const isSitting = (id: string): boolean => !offIds().includes(id)

export function setSitting(id: string, sitting: boolean): void {
  const off = offIds().filter(x => x !== id)
  if (!sitting) off.push(id)
  try { localStorage.setItem(SIT_KEY, JSON.stringify({ day: dayOf(), off })) } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('nuskho:doctors'))
}

export const sittingDoctors = (): Doctor[] => activeDoctors().filter(d => isSitting(d.id))

/* ------------------------------------------------------------------- backup
 * The extra doctors are identity on a medical document, exactly like the
 * profile, so the setup file carries them the same way. */

export function doctorsBlob(): string | null {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function restoreDoctorsBlob(blob: string | null | undefined): void {
  if (!blob) return
  try {
    JSON.parse(blob)                       // refuse to store something unreadable
    localStorage.setItem(KEY, blob)
    cache = null
  } catch { /* ignore a corrupt field rather than break the restore */ }
}
