import { db } from './db'
import { FIRST_DOCTOR } from './doctors'
import type { Visit } from './types'

/**
 * The doctor's own figures, computed on this machine from his own records.
 *
 * Two things are true at once and the whole design comes from holding both:
 * a doctor is rightly proud of a busy honest practice, and a small town is a
 * place where three numbers and a village name identify a person. So this
 * module produces the PRIVATE picture, and card.ts produces a separate,
 * whitelisted, shareable one. The wall between them is structural, not a
 * matter of remembering to crop a screenshot.
 *
 * Rules that are not negotiable here:
 *   - never cross a diagnosis with a village, an age or a sex. Not even privately:
 *     a private screen gets photographed too. That single rule removes nearly
 *     the whole re-identification surface.
 *   - any breakdown cell below MIN_CELL merges into "Other".
 *   - every percentage carries its count. A percentage with no denominator is
 *     how a doctor tells a colleague something confidently wrong.
 *   - "not recorded" is always its own visible category, never quietly dropped.
 *   - no projections, no trend arrows on thin data, no smoothing.
 */

/** Below this, a category is not shown separately. */
export const MIN_CELL = 5
/** Below this, no comparison between two periods is offered at all. */
export const MIN_TREND = 30

export type Bar = { label: string; n: number; pct: number }

export type Stats = {
  /* counts */
  today: number
  month: number
  lifetime: number
  monthLabel: string
  since?: number

  /* quality, not speed */
  returningPct: number
  returningN: number
  loyalN: number            // patients on their third visit or beyond

  /* money — private, never exported */
  received: number
  /** rupees actually handed back at the counter this month, already
   *  subtracted from `received` — the same arithmetic the desk uses. */
  refunded: number
  waivedCount: number
  waivedTotal: number
  dueTotal: number
  due: { name: string; code: string; amount: number; at: number }[]
  feeUnrecorded: number

  /* the queue */
  leftN: number
  leftPct: number
  cancelledN: number
  referredN: number
  seenOnlyN: number
  byHour: { hour: number; arrived: number; left: number }[]
  hoursUnreliable: boolean
  busiestDay?: string
  /** distinct days worked this month, and the plain count per day. Counts
   *  only: no projections, no smoothing, no trend arrows. */
  evenings: number
  byEvening: { day: number; n: number }[]

  /* clinical */
  diagnoses: Bar[]
  dxRecordedPct: number
  places: Bar[]
  placeCount: number
  medicines: Bar[]          // GENERIC names only, private, never exported
  avgMedicines: number

  /* honesty */
  thin: boolean             // too little data to say anything confidently
  clockOdd: boolean
}

const DAY = 86400000
/** The clinical day starts at 4 am (see safety.ts): an evening past midnight
 *  is one evening here too, or the figures would disagree with the desk. */
const startOfDay = (t = Date.now()) =>
  new Date(new Date(t - 14400000).toDateString()).getTime() + 14400000
const startOfMonth = (t = Date.now()) => {
  const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

/** Seen by the doctor at all — a prescription, or a consultation without one. */
const counted = (v: Visit) => v.status === 'done' || v.status === 'seen' || !!v.printedAt

/** "Larkana", "larkano ", "Larkana City" must not become three bars. */
export function canonPlace(s?: string): string {
  const t = (s ?? '').trim().replace(/\s+/g, ' ')
  if (!t) return ''
  const k = t.toLowerCase().replace(/\b(city|town|village|shareef|sharif)\b/g, '').trim()
  return k ? k.replace(/\b\w/g, c => c.toUpperCase()) : t
}

/** Cells under MIN_CELL are pooled, and the pool says how many things are in it. */
function bars(counts: Map<string, number>, total: number, otherWord = 'Other'): Bar[] {
  const kept: Bar[] = []
  let otherN = 0, otherK = 0
  for (const [label, n] of counts) {
    if (n >= MIN_CELL) kept.push({ label, n, pct: total ? Math.round((n / total) * 100) : 0 })
    else { otherN += n; otherK++ }
  }
  kept.sort((a, b) => b.n - a.n)
  if (otherN) kept.push({
    label: `${otherWord} (${otherK} ${otherK === 1 ? 'kind' : 'kinds'})`,
    n: otherN, pct: total ? Math.round((otherN / total) * 100) : 0,
  })
  return kept
}

/**
 * `forDoctor` scopes the whole page to one doctor's visits, for a building
 * with several rooms: his patients, his money, his evenings, his card.
 * Visits from the solo era carry no doctorId and belong to the first doctor.
 * A solo clinic passes nothing and the figures are the machine's, as always.
 */
export async function computeStats(forDoctor?: string): Promise<Stats> {
  const [allVisits, patients, drugs] = await Promise.all([
    db.visits.toArray(), db.patients.toArray(), db.drugs.toArray(),
  ])
  const visits = forDoctor
    ? allVisits.filter(v => (v.doctorId ?? FIRST_DOCTOR) === forDoctor)
    : allVisits
  const pById = new Map(patients.map(p => [p.id, p]))
  const dById = new Map(drugs.map(d => [d.id, d]))

  const t0 = startOfDay()
  const m0 = startOfMonth()
  const seen = visits.filter(counted)
  const monthAll = visits.filter(v => v.createdAt >= m0)
  const monthSeen = seen.filter(v => v.createdAt >= m0)

  /* --- returning: the best quality signal this data honestly supports.
         Patients who come back trust the doctor. It rewards care, not speed. --- */
  const order = new Map<string, number>()          // visit id -> which visit this is for that patient
  const perPatient = new Map<string, Visit[]>()
  for (const v of seen.slice().sort((a, b) => a.createdAt - b.createdAt)) {
    const arr = perPatient.get(v.patientId) ?? []
    arr.push(v); perPatient.set(v.patientId, arr)
    order.set(v.id, arr.length)
  }
  const returningN = monthSeen.filter(v => (order.get(v.id) ?? 1) > 1).length
  const loyalN = [...perPatient.values()].filter(a => a.length >= 3).length

  /* --- money. Private for ever: no rupee figure reaches any export path. --- */
  let received = 0, refunded = 0, waivedTotal = 0, waivedCount = 0, dueTotal = 0
  const due: Stats['due'] = []
  for (const v of monthAll) {
    const f = v.fee
    if (!f) continue
    if (f.refund && f.refundedAt) refunded += f.refund
    // Anything not still owed was COLLECTED at the desk, including money later
    // waived and handed back: it enters here and the refund subtraction below
    // takes it out exactly once. Counting only 'paid' made a collected-then-
    // waived fee subtract its refund from other patients' money, so this page
    // disagreed with the drawer by the refunded amount.
    if (f.state !== 'due') received += f.amount
    if (f.state === 'waived') { waivedCount++; waivedTotal += f.amount }
    else if (f.state === 'due') {
      dueTotal += f.amount
      const p = pById.get(v.patientId)
      due.push({ name: p?.name ?? '—', code: p ? String(p.num) : '—', amount: f.amount, at: v.createdAt })
    }
  }
  due.sort((a, b) => b.at - a.at)
  // What was handed back is not money received. The desk's own summary already
  // subtracts it; this page must not quietly disagree with the drawer.
  received -= refunded
  const feeUnrecorded = monthAll.filter(v => !v.fee && v.status !== 'waiting').length

  /* --- the queue. "Left" paired with the hour it happened is a staffing
         decision; on its own it is only a sad number. --- */
  const leftN = monthAll.filter(v => v.status === 'left').length
  const cancelledN = monthAll.filter(v => v.status === 'cancelled').length
  const referredN = monthAll.filter(v => v.status === 'referred').length
  const seenOnlyN = monthAll.filter(v => v.status === 'seen').length

  const from = Date.now() - 28 * DAY
  const recent = visits.filter(v => v.createdAt >= from)
  const hours = new Map<number, { arrived: number; left: number }>()
  for (const v of recent) {
    const h = new Date(v.createdAt).getHours()
    const e = hours.get(h) ?? { arrived: 0, left: 0 }
    e.arrived++
    if (v.status === 'left') e.left++
    hours.set(h, e)
  }
  const byHour = [...hours.entries()].map(([hour, e]) => ({ hour, ...e })).sort((a, b) => a.hour - b.hour)

  // If tokens are issued in batches at the door, arrival times cluster falsely
  // and this chart is a picture of the compounder, not of the patients.
  const perMinute = new Map<number, number>()
  for (const v of recent) {
    const k = Math.floor(v.createdAt / 60000)
    perMinute.set(k, (perMinute.get(k) ?? 0) + 1)
  }
  const batched = [...perMinute.values()].filter(n => n >= 4).reduce((a, n) => a + n, 0)
  const hoursUnreliable = recent.length > 0 && batched / recent.length > 0.25

  const evenMap = new Map<number, number>()
  for (const v of monthSeen) {
    const d = startOfDay(v.createdAt)
    evenMap.set(d, (evenMap.get(d) ?? 0) + 1)
  }
  const byEvening = [...evenMap.entries()].map(([day, n]) => ({ day, n }))
    .sort((a, b) => a.day - b.day)

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayCount = new Map<number, number>()
  for (const v of seen) {
    const d = new Date(v.createdAt).getDay()
    dayCount.set(d, (dayCount.get(d) ?? 0) + 1)
  }
  const busiest = [...dayCount.entries()].sort((a, b) => b[1] - a[1])[0]
  const busiestDay = busiest && seen.length >= MIN_TREND ? DAYS[busiest[0]] : undefined

  /* --- diagnosis: whole clinic only. Never crossed with a place or a person. --- */
  const dx = new Map<string, number>()
  let dxRecorded = 0
  for (const v of monthSeen) {
    const d = (v.diagnosis ?? '').trim()
    if (d) { dxRecorded++; dx.set(d, (dx.get(d) ?? 0) + 1) }
  }
  const diagnoses = bars(dx, monthSeen.length, 'Other diagnoses')
  if (monthSeen.length - dxRecorded > 0) {
    diagnoses.push({
      label: 'Not recorded', n: monthSeen.length - dxRecorded,
      pct: monthSeen.length ? Math.round(((monthSeen.length - dxRecorded) / monthSeen.length) * 100) : 0,
    })
  }

  /* --- geography: where these patients travelled from. Not a claim about
         disease in those places, and never joined to one. --- */
  const place = new Map<string, number>()
  const placeSeen = new Set<string>()
  for (const v of monthSeen) {
    const c = canonPlace(pById.get(v.patientId)?.city)
    if (!c) continue
    placeSeen.add(c)
    place.set(c, (place.get(c) ?? 0) + 1)
  }
  const places = bars(place, monthSeen.length, 'Other places')

  /* --- medicines by GENERIC name. Brand-level prescribing data is exactly what
         pharmaceutical companies buy; it does not exist in this app. --- */
  const med = new Map<string, number>()
  let lines = 0
  for (const v of monthSeen) {
    lines += v.lines.length
    for (const l of v.lines) {
      const m = l.snap ?? dById.get(l.drugId)
      const g = (m?.generic || m?.brand || '').trim()
      if (g) med.set(g, (med.get(g) ?? 0) + 1)
    }
  }
  const medicines = bars(med, lines, 'Other medicines')

  const firstSeen = seen.length ? Math.min(...seen.map(v => v.createdAt)) : undefined
  const now = Date.now()
  const clockOdd = visits.some(v => v.createdAt > now + DAY)
    || (!!firstSeen && firstSeen < Date.parse('2024-01-01'))

  return {
    today: seen.filter(v => v.createdAt >= t0).length,
    month: monthSeen.length,
    lifetime: seen.length,
    monthLabel: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    since: firstSeen,

    returningPct: monthSeen.length ? Math.round((returningN / monthSeen.length) * 100) : 0,
    returningN,
    loyalN,

    received, refunded, waivedCount, waivedTotal, dueTotal, due, feeUnrecorded,

    leftN,
    leftPct: monthAll.length ? Math.round((leftN / monthAll.length) * 100) : 0,
    cancelledN, referredN, seenOnlyN,
    byHour, hoursUnreliable, busiestDay,
    evenings: evenMap.size, byEvening,

    diagnoses,
    dxRecordedPct: monthSeen.length ? Math.round((dxRecorded / monthSeen.length) * 100) : 0,
    places,
    placeCount: placeSeen.size,
    medicines,
    avgMedicines: monthSeen.length ? Math.round((lines / monthSeen.length) * 10) / 10 : 0,

    thin: monthSeen.length < MIN_TREND,
    clockOdd,
  }
}
