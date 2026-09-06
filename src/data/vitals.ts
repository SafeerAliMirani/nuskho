/**
 * THE SINDHI IN THIS FILE WAS CHECKED ON 8 AUG 2026.
 *
 * Every Sindhi string that Nuskho prints was pulled out into one worksheet and
 * read by a Sindhi speaker on Safeer's side. Most of it came back fine. What
 * was wrong is corrected here, and the corrections are worth knowing because
 * they are all the same kind of mistake and the next person will make it too:
 *
 *   URDU WEARING SINDHI CLOTHES. خون for blood where a Sindhi speaker says رت.
 *   ڪمر for the back where he says پٺي. Both were perfectly correct words that
 *   nobody in Larkana would have used, which on this document is the same as
 *   being wrong.
 *
 *   GENDER. A ٽيسٽ is feminine in Sindhi, so it takes جي and not جو. Three of
 *   the six lab tests had it the other way round.
 *
 *   AND ONE THAT WAS NOT A NUANCE AT ALL. Constipation was listed as قبضو,
 *   which is not constipation. It means an illegal occupation of land. It is
 *   corrected to قبضي. It was on the doctor's screen and never on paper, which
 *   is the only reason it was not worse.
 *
 * The rule this file now inherits: a Sindhi string added here is a claim in a
 * language, and it does not become true by being typed carefully. It needs a
 * speaker.
 */

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
  /**
   * THE BOUNDS OF A POSSIBLE READING, WHICH IS NOT THE SAME AS A NORMAL ONE.
   *
   * `lo`/`hi` are the ordinary adult range: outside them the number is marked
   * and printed, because an abnormal reading is exactly what the doctor needs
   * to see. `pmin`/`pmax` are wider and mean something else entirely — outside
   * them there is no patient, only a typo. A blood pressure of 999/999 was
   * accepted, marked "higher than usual" and printed on the slip.
   *
   * They are deliberately generous. A number inside them is the compounder's
   * business; a number outside them is arithmetic, and the app may say so.
   */
  pmin?: number
  pmax?: number
  /** for a pair, the possible range of the second number */
  pmin2?: number
  pmax2?: number
  /** shown under the field so nobody has to remember the units */
  hint?: string
}

/** Taken by the compounder, before the doctor. */
export const VITALS: VitalDef[] = [
  { key: 'bp', short: 'BP', en: 'Blood pressure', sd: 'بلڊ پريشر', unit: 'mmHg', kind: 'vital',
    max: 3, pair: true, lo: 90, hi: 140, lo2: 60, hi2: 90,
    pmin: 40, pmax: 300, pmin2: 20, pmax2: 200, hint: 'upper / lower' },
  { key: 'pulse', short: 'Pulse', en: 'Pulse', sd: 'نبض', unit: '/min', kind: 'vital', max: 3, lo: 60, hi: 100, pmin: 20, pmax: 300 },
  { key: 'temp', short: 'Temp', en: 'Temperature', sd: 'حرارت', unit: '°F', kind: 'vital', max: 5, lo: 97, hi: 99.5, pmin: 80, pmax: 115 },
  { key: 'weight', short: 'Weight', en: 'Weight', sd: 'وزن', unit: 'kg', kind: 'vital', max: 5, lo: 2, hi: 200, pmin: 0.5, pmax: 400 },
  { key: 'spo2', short: 'SpO₂', en: 'Oxygen', sd: 'آڪسيجن', unit: '%', kind: 'vital', max: 3, lo: 94, hi: 100, pmin: 40, pmax: 100 },
]

/**
 * Done in the room, on a strip machine, while the patient sits there.
 *
 * Only the tests that genuinely give a number in seconds. A test whose result
 * comes back tomorrow is not this: it is an order, and orders already have
 * their own place on the slip.
 */
export const INSTANT: VitalDef[] = [
  { key: 'rbs', short: 'Sugar R', en: 'Random sugar', sd: 'شگر', unit: 'mg/dL', kind: 'test', max: 3, lo: 70, hi: 140, pmin: 10, pmax: 1500 },
  { key: 'fbs', short: 'Sugar F', en: 'Fasting sugar', sd: 'خالي پيٽ شگر', unit: 'mg/dL', kind: 'test', max: 3, lo: 70, hi: 100, pmin: 10, pmax: 1500 },
  { key: 'hba1c', short: 'HbA1c', en: 'HbA1c', sd: 'ايڇ بي اي', unit: '%', kind: 'test', max: 4, lo: 4, hi: 5.7, pmin: 2, pmax: 25 },
  { key: 'hb', short: 'Hb', en: 'Haemoglobin', sd: 'هيموگلوبن', unit: 'g/dL', kind: 'test', max: 4, lo: 11, hi: 16, pmin: 1, pmax: 30 },
  { key: 'chol', short: 'Chol', en: 'Cholesterol', sd: 'ڪوليسٽرول', unit: 'mg/dL', kind: 'test', max: 3, lo: 125, hi: 200, pmin: 20, pmax: 1000 },
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
/**
 * IS THIS A CHILD, AS FAR AS THE ADULT RANGES ARE CONCERNED?
 *
 * The ranges in this file are an ordinary adult's, and were applied to
 * everybody: a two-year-old's perfectly normal pulse of 120 came back "higher
 * than usual", and a doctor who is shown a false alarm twice stops reading the
 * true one. This app has no paediatric ranges of its own and will not invent
 * any (see clinical-decisions-needed.md); until a doctor supplies them, a
 * child's reading is simply not judged. Saying nothing is honest. Saying the
 * wrong thing is not.
 *
 * The age is free text, so anything unparseable is treated as an adult, which
 * is what the app did before this existed.
 */
export const isChild = (age?: string): boolean => {
  const n = parseFloat(String(age ?? ''))
  return Number.isFinite(n) && n < 12
}

/**
 * A reading no human body produces: a typo, not a patient. Returns true only
 * when the number is outside the generous pmin/pmax, so a genuinely alarming
 * reading is never called impossible. A box with nothing in it is not
 * impossible, it is empty.
 */
export function impossible(def: VitalDef, raw: string): boolean {
  const t = (raw ?? '').trim()
  if (!t) return false
  const out = (n: number, lo?: number, hi?: number) =>
    Number.isFinite(n) && ((lo != null && n < lo) || (hi != null && n > hi))
  if (def.pair) {
    const [a, b] = t.split('/').map(x => parseFloat(x))
    // a pair needs both halves: "180/" is half a reading, and half a blood
    // pressure on a slip is worse than none
    if (t.includes('/') && (!Number.isFinite(a) || !Number.isFinite(b))) return true
    return out(a, def.pmin, def.pmax) || out(b, def.pmin2, def.pmax2)
  }
  if (!def.pmin && !def.pmax) return false      // a text box, like the urine strip
  const n = parseFloat(t)
  if (!Number.isFinite(n)) return true
  return out(n, def.pmin, def.pmax)
}

/** The first box whose reading cannot be a reading, or null. Both print paths
 *  ask this, so neither can put a typo on a patient's paper. */
export function firstImpossible(v: Record<string, string> | undefined): VitalDef | null {
  if (!v) return null
  for (const d of ALL_VITALS) {
    if (impossible(d, v[d.key] ?? '')) return d
  }
  return null
}

export function flag(def: VitalDef, raw: string, age?: string): Flag {
  if (!raw) return null
  // a child is not judged by an adult's numbers; see isChild
  if (isChild(age)) return null
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
