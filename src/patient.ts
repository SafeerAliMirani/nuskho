import type { Patient, Correction, Visit, WhoSnap } from './types'
import { cleanName, cleanPhone, cleanAge, cleanCity, cleanSex } from './fields'

/**
 * CORRECTING A PATIENT'S DETAILS AFTER THE TOKEN HAS BEEN ISSUED.
 *
 * WHY THIS DID NOT EXIST FOR A YEAR
 *
 * A patient record was sealed the moment it was created. That was not an
 * oversight — it came from the one promise this app makes most loudly, that a
 * printed slip never changes, and identity is printed. So the safe thing was
 * to write nothing twice.
 *
 * The cost showed up the first evening anybody put real names in. "Wazir" goes
 * in as "Wazeer", an age is typed into the phone box, a woman is chipped as a
 * man, and the number is already printed and in her hand. The desk's only way
 * out was a second record: a new number, a split history, and the patient
 * holding a card that no longer names her. A clinic that cannot fix a typo
 * makes a duplicate instead, which is the worse of the two faults, and the app
 * was quietly pushing it toward that every time.
 *
 * THE TWO MISTAKES, WHICH ARE NOT THE SAME SIZE
 *
 * A typo is the small one, and correcting it is unambiguously right: everyone,
 * including the record, wanted the name to be Wazir all along.
 *
 * The large one is the desk correcting the RIGHT record with the WRONG
 * person's details — the old slip was misread, the wrong number was opened,
 * and the details of the man standing at the counter are typed over a record
 * belonging to somebody else. That does not look like a mistake afterwards. It
 * looks like a patient whose history is full of another man's illnesses.
 *
 * So the rules below are shaped almost entirely around the second one:
 *
 *   THE NUMBER IS NOT CORRECTABLE. It is the identity, it is printed large,
 *   and the slip is the card. Changing it is not a correction, it is a swap.
 *   A record opened by mistake is left alone; the right one is opened instead.
 *
 *   NOTHING IS OVERWRITTEN IN SILENCE. Every changed field is kept as it was,
 *   dated, with the role that changed it, on the record itself. If a history
 *   ever has to be untangled, the way back is in the record and not in
 *   somebody's memory of a Tuesday.
 *
 *   A NAME CANNOT BE EMPTIED. It is the only field the app has ever required,
 *   and a blank one turns a person into a row.
 *
 *   WHAT IS ALREADY PRINTED STAYS PRINTED. That is not enforced here — it is
 *   the WhoSnap frozen onto the visit at print time (see rx.ts). This module
 *   only tells the screen how many slips are already out, so the person about
 *   to press Save is told what is and is not going to change.
 *
 * Nothing here touches storage or React. It is the rules, and they are the
 * same rules at the desk, in the room and over the wire.
 */

/** What a correction may touch. The number, the allergy and createdAt are not
 *  in here, on purpose: the first is identity, the second belongs to the care
 *  line in the room, the third is a fact about the past. */
export interface PatientPatch {
  name?: string
  age?: string
  sex?: 'M' | 'F' | ''
  phone?: string
  city?: string
}

/** A record is not an audit log. Twenty is far more than any real record will
 *  see and still small enough that a backup does not grow teeth. When it
 *  overflows the OLDEST goes, because the earliest states are the ones a long
 *  argument is least likely to be about. */
export const MAX_CORRECTIONS = 20

/** Every cleaner applied, at this door as at all the others. `undefined` for a
 *  key the caller did not send: absent means "leave it", not "clear it". */
export function cleanPatch(raw: PatientPatch): PatientPatch {
  const out: PatientPatch = {}
  if (raw.name !== undefined) out.name = cleanName(raw.name)
  if (raw.age !== undefined) out.age = cleanAge(raw.age)
  if (raw.sex !== undefined) out.sex = cleanSex(raw.sex) ?? ''
  if (raw.phone !== undefined) out.phone = cleanPhone(raw.phone)
  if (raw.city !== undefined) out.city = cleanCity(raw.city)
  return out
}

/** '' and undefined are the same absence on a patient record, and a field
 *  going from one to the other is not a change anybody made. */
const same = (a: unknown, b: unknown) => (a ?? '') === (b ?? '')

/** Only the fields that actually differ, already cleaned. An empty object
 *  means the person pressed Save without changing anything, which is a
 *  no-op and must not leave a correction behind. */
export function changedFields(pt: Patient, raw: PatientPatch): PatientPatch {
  const p = cleanPatch(raw)
  const out: PatientPatch = {}
  if (p.name !== undefined && !same(p.name, pt.name)) out.name = p.name
  if (p.age !== undefined && !same(p.age, pt.age)) out.age = p.age
  if (p.sex !== undefined && !same(p.sex, pt.sex)) out.sex = p.sex
  if (p.phone !== undefined && !same(p.phone, pt.phone)) out.phone = p.phone
  if (p.city !== undefined && !same(p.city, pt.city)) out.city = p.city
  return out
}

/** The one refusal. Said as a sentence because it goes straight on the screen. */
export function refusal(pt: Patient, raw: PatientPatch): string | null {
  const p = cleanPatch(raw)
  if (p.name !== undefined && !p.name) {
    return 'A patient needs a name. Type it back in, or press cancel to leave the record as it is.'
  }
  if (!Object.keys(changedFields(pt, raw)).length) {
    return 'Nothing was changed.'
  }
  return null
}

/**
 * The record as it should be stored, and the correction that records the
 * change. Returns null when there is nothing to do, so a caller that writes
 * on a null has a bug rather than an empty correction in the log.
 *
 * `by` is a role name, not a person: this app has no user accounts, and
 * pretending otherwise in an audit trail would be worse than saying less.
 */
export function correct(pt: Patient, raw: PatientPatch, by: string, at = Date.now())
  : { next: Patient; correction: Correction } | null {
  const ch = changedFields(pt, raw)
  const keys = Object.keys(ch) as (keyof PatientPatch)[]
  if (!keys.length) return null

  const was: Correction['was'] = {}
  for (const k of keys) {
    if (k === 'sex') { if (pt.sex) was.sex = pt.sex }
    else if (pt[k]) was[k] = pt[k] as string
  }
  const correction: Correction = { at, by, was }

  const next: Patient = { ...pt }
  if (ch.name !== undefined) next.name = ch.name
  // '' clears the field rather than storing an empty string, so a record that
  // has been corrected reads exactly like one that was typed right the first
  // time. An age nobody knows is an absent age, not a blank one.
  if (ch.age !== undefined) next.age = ch.age || undefined
  if (ch.sex !== undefined) next.sex = ch.sex || undefined
  if (ch.phone !== undefined) next.phone = ch.phone || undefined
  if (ch.city !== undefined) next.city = ch.city || undefined
  next.corrections = [...(pt.corrections ?? []), correction].slice(-MAX_CORRECTIONS)
  return { next, correction }
}

/* ------------------------------------------------------- saying it out loud */

const LABEL: Record<keyof PatientPatch, string> = {
  name: 'name', age: 'age', sex: 'man or woman', phone: 'phone', city: 'city',
}

const shown = (k: keyof PatientPatch, v: string | undefined): string =>
  !v ? 'nothing' : k === 'sex' ? (v === 'M' ? 'man' : 'woman') : v

/** "name Wazeer to Wazir, age nothing to 34". For the desk to read back before
 *  it presses Save, and for the little history under the box afterwards. */
export function describe(pt: Patient, raw: PatientPatch): string {
  const ch = changedFields(pt, raw)
  return (Object.keys(ch) as (keyof PatientPatch)[])
    .map(k => `${LABEL[k]} ${shown(k, (pt[k] as string) ?? '')} to ${shown(k, ch[k])}`)
    .join(', ')
}

/** The same sentence for a correction already in the log, read the other way
 *  round: what it was, and therefore what somebody changed. */
export function describeOld(c: Correction): string {
  return (Object.keys(c.was) as (keyof Correction['was'])[])
    .map(k => `${LABEL[k as keyof PatientPatch]} was ${shown(k as keyof PatientPatch, c.was[k])}`)
    .join(', ')
}

/**
 * WHAT THE PERSON PRESSING SAVE HAS TO BE TOLD, and it is not a warning about
 * data. It is a sentence about paper that is already in somebody's hand.
 *
 * A slip already printed keeps its own copy of the name (WhoSnap), so it does
 * not change and cannot be made to. That is the right behaviour and it is also
 * the surprising one: a desk that has just corrected a spelling reasonably
 * expects the reprint to carry the correction. So it is said plainly, with the
 * count, rather than discovered at the printer.
 *
 * Null when nothing has been printed for this patient, which is the ordinary
 * case at the door — the correction happens in the same minute as the typo.
 */
export function printedNote(n: number): string | null {
  if (!n) return null
  return n === 1
    ? 'One prescription has already been printed for this patient. That slip keeps the '
      + 'details it was printed with, and printing it again will not change them. Only '
      + 'this record and future slips are corrected.'
    : `${n} prescriptions have already been printed for this patient. Those slips keep the `
      + 'details they were printed with, and printing them again will not change them. Only '
      + 'this record and future slips are corrected.'
}

/** How many of these visits have been printed. The caller counts, so this
 *  module keeps knowing nothing about how visits are fetched. */
export const printedCount = (visits: Visit[]): number =>
  visits.filter(v => v.printedAt).length

/**
 * The patient as a printed slip names him. The one place this shape is built,
 * so the freeze at the desk, in the room and over the wire cannot differ.
 */
export const whoFor = (pt: Patient): WhoSnap => ({
  name: pt.name,
  num: pt.num,
  ...(pt.age ? { age: pt.age } : {}),
  ...(pt.sex ? { sex: pt.sex } : {}),
  ...(pt.alert ? { alert: pt.alert } : {}),
})
