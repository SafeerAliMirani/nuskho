import type { Patient } from './types'
import { patientCode } from './code'

/**
 * ONE PHONE, ONE HOUSEHOLD. See patient-identity-design.md.
 *
 * A patient found by his number lands on his one record, whatever name he
 * gives. But a patient who comes without his slip is taken in by name, gets a
 * new number, and a duplicate is born. The name cannot catch this: Wazir Ali,
 * Wazir Ali s/o Ghulam, Wazeer Ali are one man. So intake asks for a phone
 * when there is time, and the phone is the thing that says "this family has
 * been here before" and shows the desk who.
 *
 * WHY THE PHONE IS A HOUSEHOLD KEY AND NOT A PERSONAL ONE
 *
 * In Larkana a number belongs to the house: the elder's phone is given for the
 * wife, the children, the siblings. One number legitimately maps to several
 * patients, and a rule that said "this phone already has a patient, so this
 * IS that patient" would merge a mother into her son. So the phone never
 * decides anything. It produces a SHORT LIST, and a person picks.
 *
 * WHAT COUNTS AS THE SAME NUMBER
 *
 * The desk writes 0300 1234567, the phone writes 03001234567, somebody writes
 * +92 300 1234567. All one number. `phoneKey` reduces every spelling to its
 * last ten digits, which for a Pakistani mobile is the subscriber number
 * without the leading 0 or the +92. Landlines and foreign numbers still get a
 * stable key, just not one this comment can vouch for. Anything shorter than
 * seven digits is treated as no number at all: a desk that typed "03" and
 * moved on must not be shown the whole clinic.
 *
 * Pure. The stored `phone` field is never rewritten to the key: what the desk
 * typed is what the desk sees again, and matching is done on the way in.
 */

export function phoneKey(raw: string | undefined | null): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.length < 7) return ''
  return d.slice(-10)
}

export const sameHousehold = (a: Patient, b: Patient): boolean => {
  const k = phoneKey(a.phone)
  return !!k && k === phoneKey(b.phone)
}

/**
 * Everyone already on the books under this number, oldest first, so the
 * elder whose phone it is tends to come first. Records merged away (see
 * merge.ts) are not people any more and are left out.
 */
export function household(phone: string, all: Patient[]): Patient[] {
  const k = phoneKey(phone)
  if (!k) return []
  return all
    .filter(p => !p.mergedInto && phoneKey(p.phone) === k)
    .sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * One line to tell two members of a family apart at a glance. The name and the
 * number always; the age because "Bibi" at 6 and "Bibi" at 60 are a
 * grandmother and a grandchild; the sex when the name does not say.
 */
export function tell(p: Patient): string {
  const bits = [p.name, patientCode(p.num)]
  if (p.age) bits.push(p.age)
  if (p.sex) bits.push(p.sex === 'M' ? 'man' : 'woman')
  return bits.join(' · ')
}
