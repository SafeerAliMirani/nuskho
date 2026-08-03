/**
 * THE NUMBERS TAKEN BEFORE AND DURING THE CONSULTATION.
 *
 * This is the workflow that already exists in every clinic in Larkana and that
 * the app had no idea about:
 *
 *   1. the counter takes the fee and issues the token
 *   2. the compounder puts a cuff on the patient's arm, outside or just inside
 *      the door, and writes the reading on the corner of a slip of paper
 *   3. sometimes the doctor asks for a sugar or an HbA1c right there in the
 *      room, on a strip machine, and the number comes back in seconds
 *
 * All of that ends up on the prescription, written by hand in the margin. The
 * app printed a `vitals` field, the print renderer laid it out, and **nothing
 * in the entire application ever wrote to it**. It has been dead since the day
 * it was added.
 *
 * TWO SEPARATE MOMENTS, TWO SEPARATE PEOPLE
 *
 * The vitals belong to the compounder and are taken before the doctor sees the
 * patient. The instant tests belong to the doctor and are taken during. They are
 * kept apart here because they are entered on different screens by different
 * people at different times, and collapsing them into one list would mean the
 * counter could enter an HbA1c, which is not his to enter.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not interpret. It flags a reading as high or low against the ordinary
 * adult range, which is arithmetic and helps a compounder notice he mistyped
 * 220 for 120 — and it stops exactly there. It does not say "hypertensive", it
 * does not suggest a diagnosis, and it does not withhold anything from the
 * doctor. The person in the room decides what a number means.
 */

export type VitalKind = 'vital' | 'test'

export interface VitalDef {
  key: string
  /** what the compounder calls it, short enough for a phone-width label */
  en: string
  /**
   * What goes on PAPER, which is a different problem from what goes on screen.
   *
   * A vitals cell on an A5 slip is about 20mm wide and carries an English label,
   * a Sindhi label and the reading. "BLOOD PRESSURE" wraps onto three lines in
   * that space and pushes the number out of the box. Everyone in a clinic here
   * already says BP.
   */
  short: string
  sd: string
  unit: string
  kind: VitalKind
  /** numeric input hint: how many characters make sense */
  max: number
  /** two boxes, like a blood pressure */
  pair?: boolean
  /** ordinary adult range. Outside it we mark the number, never explain it. */
  lo?: number
  hi?: number
  /** for a pair, the range of the second number */
  lo2?: number
  hi2?: number
  /** shown under the field so nobody has to remember the units */
  hint?: string
}

/** Taken by the compounder, before the doctor. */
export const VITALS: VitalDef[] = [
  { key: 'bp', short: 'BP', en: 'Blood pressure', sd: 'بلڊ پريشر', unit: 'mmHg', kind: 'vital',
    max: 3, pair: true, lo: 90, hi: 140, lo2: 60, hi2: 90, hint: 'upper / lower' },
  { key: 'pulse', short: 'Pulse', en: 'Pulse', sd: 'نبض', unit: '/min', kind: 'vital', max: 3, lo: 60, hi: 100 },
  { key: 'temp', short: 'Temp', en: 'Temperature', sd: 'حرارت', unit: '°F', kind: 'vital', max: 5, lo: 97, hi: 99.5 },
  { key: 'weight', short: 'Weight', en: 'Weight', sd: 'وزن', unit: 'kg', kind: 'vital', max: 5, lo: 2, hi: 200 },
  { key: 'spo2', short: 'SpO₂', en: 'Oxygen', sd: 'آڪسيجن', unit: '%', kind: 'vital', max: 3, lo: 94, hi: 100 },
]

/**
 * Done in the room, on a strip machine, while the patient sits there.
 *
 * Only the tests that genuinely give a number in seconds. A test whose result
 * comes back tomorrow is not this: it is an order, and orders already have
 * their own place on the slip.
 */
export const INSTANT: VitalDef[] = [
  { key: 'rbs', short: 'Sugar R', en: 'Random sugar', sd: 'شگر', unit: 'mg/dL', kind: 'test', max: 3, lo: 70, hi: 140 },
  { key: 'fbs', short: 'Sugar F', en: 'Fasting sugar', sd: 'شگر خالي', unit: 'mg/dL', kind: 'test', max: 3, lo: 70, hi: 100 },
  { key: 'hba1c', short: 'HbA1c', en: 'HbA1c', sd: 'ايڇ بي اي', unit: '%', kind: 'test', max: 4, lo: 4, hi: 5.7 },
  { key: 'hb', short: 'Hb', en: 'Haemoglobin', sd: 'هيموگلوبن', unit: 'g/dL', kind: 'test', max: 4, lo: 11, hi: 16 },
  { key: 'urine', short: 'Urine', en: 'Urine strip', sd: 'پيشاب', unit: '', kind: 'test', max: 14 },
]

export const ALL_VITALS = [...VITALS, ...INSTANT]
export const vitalDef = (key: string) => ALL_VITALS.find(v => v.key === key)

export type Flag = 'low' | 'high' | null

/**
 * Arithmetic only.
 *
 * The point of this is not clinical. It is that a compounder typing 1210 for a
 * pulse, or 22 for a systolic, sees it go amber before the paper is printed. A
 * mistyped vital on a slip is believed by whoever reads it next, and a person
 * checking their own typing is the cheapest safety net there is.
 */
export function flag(def: VitalDef, raw: string): Flag {
  if (!raw) return null
  if (def.pair) {
    const [a, b] = raw.split('/').map(x => parseFloat(x))
    if (Number.isFinite(a) && def.lo != null && def.hi != null) {
      if (a < def.lo) return 'low'
      if (a > def.hi) return 'high'
    }
    if (Number.isFinite(b) && def.lo2 != null && def.hi2 != null) {
      if (b < def.lo2) return 'low'
      if (b > def.hi2) return 'high'
    }
    return null
  }
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return null
  if (def.lo != null && n < def.lo) return 'low'
  if (def.hi != null && n > def.hi) return 'high'
  return null
}

/** "120/80 mmHg". What goes on the paper. */
export function vitalText(key: string, raw: string): string {
  const d = vitalDef(key)
  if (!d || !raw) return raw
  return d.unit ? `${raw} ${d.unit}` : raw
}

/** Only what was actually filled in, in a fixed order, so the slip never
 *  reorders itself between two prescriptions for the same patient. */
export function filled(v: Record<string, string> | undefined): [VitalDef, string][] {
  if (!v) return []
  return ALL_VITALS
    .filter(d => (v[d.key] ?? '').trim())
    .map(d => [d, v[d.key].trim()] as [VitalDef, string])
}
