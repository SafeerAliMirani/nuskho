import type { Patient, Correction } from './types'

/**
 * TWO RECORDS THAT ARE ONE PERSON, MADE INTO ONE.
 *
 * "Duplicates are cheap, seconds are not" is the rule at the door, and it is
 * the right rule: a desk that interrogates every patient about whether he has
 * been here before loses the evening. The household list (household.ts)
 * catches most duplicates before they are born. This is for the ones it did
 * not, and it is what keeps the rule honest: a duplicate is only cheap if it
 * is also cheap to fix.
 *
 * WHAT A MERGE IS, EXACTLY
 *
 *   Every visit of the record that GOES is re-pointed at the record that
 *   STAYS. The history becomes one history.
 *
 *   The record that goes is not deleted. It is marked `mergedInto` and kept,
 *   with its number, because that number is printed on a slip in somebody's
 *   drawer, and when that slip is handed over next year the desk must land on
 *   the right person and not on "no patient with that number".
 *
 *   The record that stays fills its blanks from the one that goes: an age it
 *   never had, a phone, a village. It never OVERWRITES a field it already has,
 *   because the person doing the merge chose which record is the truth and
 *   that choice is respected. The one exception is the allergy line, which is
 *   joined when the two differ: losing an allergy is the one outcome worse
 *   than a slightly untidy line.
 *
 *   A correction is written on the surviving record saying what was folded in
 *   and when, so the trail can be followed in both directions.
 *
 * WHAT IT REFUSES
 *
 *   The same record twice. A record already merged away (it is a signpost,
 *   not a person; merge the record it points to instead). A record that has
 *   itself absorbed the other, which would be a loop.
 *
 * Pure: it answers with what should be written and never writes. merge in
 * db.ts does the writing, in one transaction, against the live rows.
 */

export interface MergePlan {
  /** the surviving record, as it should now be stored */
  keep: Patient
  /** the absorbed record, as it should now be stored: a signpost */
  gone: Patient
}

export function mergeRefusal(keep: Patient, gone: Patient): string | null {
  if (keep.id === gone.id) return 'That is the same record twice.'
  if (keep.mergedInto) return `Number ${keep.num} was already folded into another record. Merge into that one instead.`
  if (gone.mergedInto) return `Number ${gone.num} was already folded into another record.`
  return null
}

/** The allergy lines, joined when both exist and differ. */
export function joinAlerts(a?: string, b?: string): string | undefined {
  const x = (a ?? '').trim(), y = (b ?? '').trim()
  if (!x) return y || undefined
  if (!y || x.toLowerCase() === y.toLowerCase()) return x
  return `${x} / ${y}`
}

export function planMerge(keep: Patient, gone: Patient, by: string, at = Date.now()): MergePlan | null {
  if (mergeRefusal(keep, gone)) return null
  const note: Correction = { at, by, merged: gone.num, was: {} }
  const next: Patient = {
    ...keep,
    age: keep.age || gone.age || undefined,
    sex: keep.sex || gone.sex || undefined,
    phone: keep.phone || gone.phone || undefined,
    city: keep.city || gone.city || undefined,
    alert: joinAlerts(keep.alert, gone.alert),
    corrections: [...(keep.corrections ?? []), note].slice(-20),
  }
  const sign: Patient = { ...gone, mergedInto: keep.id }
  return { keep: next, gone: sign }
}

/**
 * Which of two records should survive, when the person merging has not said.
 * The OLDER one, because its number is on more slips. Only a suggestion; the
 * screen lets it be swapped.
 */
export const suggestKeep = (a: Patient, b: Patient): [Patient, Patient] =>
  a.createdAt <= b.createdAt ? [a, b] : [b, a]
