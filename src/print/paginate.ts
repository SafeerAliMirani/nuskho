import { renderOneSheet, type SlipData, type SheetPlan } from './renderSlip'
import { ensurePrintStyles, fontsReady } from './styles'
import { paper } from '../paper'

/**
 * How many medicines fit on one sheet is NOT a constant, and guessing it is how
 * rows ended up printing underneath the signature box.
 *
 * The budget changes per prescription and per sheet:
 *   - is there a diagnosis row, and how many vitals
 *   - how many tests and advice lines  (last sheet only)
 *   - how tall each Sindhi name wraps
 *   - last sheet (legend + tests + advice + handwriting area) vs continuation
 *     sheet (one thin bar) — these two are nowhere near the same size
 *
 * So we do not guess. Each candidate sheet is rendered off-screen at the real
 * paper size and measured. `.page` is `overflow:hidden`, which means a bad
 * layout is invisible on screen and only appears on paper; measuring is the
 * only honest check.
 */

/** Clear space we insist on between the last block and the footer. */
const GAP_MM = 1.6
/** Runaway guard. No real prescription comes near this. */
const MAX_SHEETS = 40

let host: HTMLDivElement | null = null
let pxPerMm = 0

function measureHost(): HTMLDivElement {
  ensurePrintStyles()
  if (host && host.isConnected) return host
  host = document.createElement('div')
  host.id = 'nuskho-measure'
  host.setAttribute('aria-hidden', 'true')
  document.body.appendChild(host)
  return host
}

function mm(v: number): number {
  if (!pxPerMm) {
    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;height:100mm;width:1mm'
    measureHost().appendChild(probe)
    pxPerMm = probe.getBoundingClientRect().height / 100
    probe.remove()
  }
  return v * pxPerMm
}

/** True when this one sheet keeps every block clear of the footer. */
function sheetFits(d: SlipData, from: number, count: number,
                   compact: boolean, isLast: boolean, sheetNo: number): boolean {
  const h = measureHost()
  h.innerHTML = renderOneSheet(d, from, count, compact, isLast, sheetNo)
  const page = h.querySelector<HTMLElement>('.page')
  const foot = page?.querySelector<HTMLElement>('.foot')
  const pad = page?.querySelector<HTMLElement>('.pad')
  if (!page || !foot || !pad) return true

  const limit = foot.getBoundingClientRect().top - mm(GAP_MM)
  let bottom = pad.getBoundingClientRect().top
  for (const el of Array.from(pad.children) as HTMLElement[]) {
    if (!el.getClientRects().length) continue      // an empty block costs nothing
    bottom = Math.max(bottom, el.getBoundingClientRect().bottom)
  }
  return bottom <= limit
}

/**
 * Largest count that fits on this sheet, or 0.
 * Binary search, not a countdown: at 140 patients an evening the doctor waits
 * for this. Fit is monotonic in the row count for a fixed sheet role, and the
 * one role change (last sheet carries the trailing blocks) is tested first.
 */
function largestFit(d: SlipData, from: number, want: number,
                    compact: boolean, total: number, sheetNo: number): number {
  if (sheetFits(d, from, want, compact, from + want === total, sheetNo)) return want
  let lo = 1, hi = want - 1, best = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (sheetFits(d, from, mid, compact, false, sheetNo)) { best = mid; lo = mid + 1 }
    else hi = mid - 1
  }
  return best
}

function allFit(d: SlipData, groups: number[], compact: boolean, total: number): boolean {
  let from = 0
  for (let k = 0; k < groups.length; k++) {
    if (groups[k] < 1) return false
    if (!sheetFits(d, from, groups[k], compact, from + groups[k] === total, k)) return false
    from += groups[k]
  }
  return true
}

/** The fitting pass costs real time on a 12-medicine slip, so its result is
 *  cached and warmed while the doctor is still choosing. The key covers every
 *  field that can change a height. */
function layoutKey(d: SlipData): string {
  return JSON.stringify([
    d.visit.lines.map(l => {
      const g = d.drugs[l.drugId]
      const m = l.snap ?? g
      return [l.drugId, l.dose.m, l.dose.d, l.dose.n, l.meal, l.days,
              m?.brand, m?.strength, m?.generic, m?.sd, m?.sdReviewed, m?.unitSd, m?.form]
    }),
    d.visit.diagnosis, d.visit.vitals, d.visit.tests, d.visit.advice, d.visit.nextVisit,
    d.patientName, d.patientAge, d.patientSex, d.patientCode,
    paper(),   // page size and letterhead bands change every height on the sheet
  ])
}

let cached: { key: string; plan: SheetPlan } | null = null

/** Fire-and-forget: compute the plan now so the PRINT tap does not pay for it. */
export function warmPlan(d: SlipData): void {
  if (!d.visit.lines.length) return
  planSheets(d).catch(() => { /* the print path will just recompute */ })
}

export async function planSheets(d: SlipData): Promise<SheetPlan> {
  const key = layoutKey(d)
  if (cached && cached.key === key) return cached.plan
  const plan = await computePlan(d)
  cached = { key, plan }
  return plan
}

/**
 * Preference order:
 *   1. one sheet, comfortable spacing
 *   2. one sheet, compact spacing     — a second sheet gets lost; density does not
 *   3. the fewest sheets that fit, each filled before the next is started —
 *      but never leaving one lonely medicine by itself on the last sheet
 */
async function computePlan(d: SlipData): Promise<SheetPlan> {
  await fontsReady()
  const n = Math.max(1, d.visit.lines.length)

  if (sheetFits(d, 0, n, false, true, 0)) return { groups: [n], compact: false }
  if (sheetFits(d, 0, n, true, true, 0)) return { groups: [n], compact: true }

  // It needs more than one sheet. Fill each sheet as far as it goes, in both
  // spacings, and take whichever needs fewer sheets. Comfort wins a tie: once
  // the paper is being spent anyway, an illiterate patient reads a roomy slip
  // better than a dense one.
  const comfort = pack(d, n, false)
  const dense = pack(d, n, true)
  const compact = dense.length < comfort.length
  let groups = compact ? dense : comfort

  // A sheet holding one lonely medicine looks like a fault, and it is the sheet
  // most likely to be dropped on the way to the chemist. Try the smallest fix
  // first (pull one down from the sheet before it), then an even spread.
  if (groups.length > 1 && groups.some(g => g < 2)) {
    const moved = groups.slice()
    const last = moved.length - 1
    if (moved[last] < 2 && moved[last - 1] > 1) { moved[last - 1] -= 1; moved[last] += 1 }
    if (!moved.some(g => g < 2) && allFit(d, moved, compact, n)) groups = moved
    else {
      const even = balanced(n, groups.length)
      if (allFit(d, even, compact, n)) groups = even
    }
  }
  return { groups, compact }
}

/** Spread n medicines over s sheets, heavier at the front — the last sheet also
 *  carries the legend and the handwriting area, so it has the least room. */
function balanced(n: number, s: number): number[] {
  const base = Math.floor(n / s), extra = n % s
  return Array.from({ length: s }, (_, k) => base + (k < extra ? 1 : 0))
}

/** Fill sheet after sheet with as many medicines as measure to fit. */
function pack(d: SlipData, n: number, compact: boolean): number[] {
  const groups: number[] = []
  let from = 0
  while (from < n && groups.length < MAX_SHEETS) {
    const take = largestFit(d, from, n - from, compact, n, groups.length) || 1
    groups.push(take)
    from += take
  }
  if (from < n) {
    console.warn('[nuskho] slip too tall to paginate; printing the remainder cramped')
    groups.push(n - from)
  }
  return groups
}

/** Fitted markup, ready for #print-root or an on-screen preview. */
export async function renderFitted(d: SlipData): Promise<string> {
  const { renderSlip } = await import('./renderSlip')
  return renderSlip(d, await planSheets(d))
}
