/**
 * Paper is a per-clinic decision, not a constant.
 *
 * Some doctors want a plain A5 slip we print entirely. Others insist on their
 * own A4 letterhead — pre-printed, often in colour, which their black-and-white
 * printer could never reproduce anyway. Both are legitimate, so both are settings.
 *
 * `top` and `bottom` are the bands of a letterhead sheet that are ALREADY
 * printed and must be left alone. Every pad is different; see Setup, which
 * prints a millimetre scale onto one of his own sheets so he reads the two
 * numbers off the real thing instead of estimating.
 */
export type PaperSize = 'A5' | 'A4'
export type PaperKind = 'plain' | 'letterhead'

export type Paper = {
  size: PaperSize
  kind: PaperKind
  /** mm from the top of the sheet that his pre-printed header occupies */
  top: number
  /** mm up from the bottom that his pre-printed footer occupies */
  bottom: number

  /**
   * The counter's thermal printer, which is a separate machine from the one the
   * prescription comes out of and is allowed to be absent. Off by default: a
   * clinic without one must never see a failed print dialog at the desk.
   */
  token: boolean
  /** roll width in mm. 58 and 80 are the only two anyone sells. */
  tokenWidth: 58 | 80
}

export const PAGE_MM: Record<PaperSize, { w: number; h: number }> = {
  A5: { w: 148, h: 210 },
  A4: { w: 210, h: 297 },
}

const DEFAULT: Paper = { size: 'A5', kind: 'plain', top: 0, bottom: 0, token: false, tokenWidth: 58 }
const KEY = 'nuskho.paper'

let current: Paper | null = null

export function paper(): Paper {
  if (current) return current
  let next: Paper
  try {
    const raw = localStorage.getItem(KEY)
    next = raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT }
  } catch {
    next = { ...DEFAULT }
  }
  current = next
  return next
}

export function setPaper(p: Paper): void {
  current = { ...p }
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent('nuskho:paper'))
}

/** Usable height once the doctor's own printing is kept clear. */
export function usableHeightMm(p = paper()): number {
  const h = PAGE_MM[p.size].h
  return p.kind === 'letterhead' ? h - p.top - p.bottom : h
}

/**
 * Inline CSS variables for one .page element.
 *
 * The page box travels on the element itself rather than in a stylesheet: an
 * inline style wins over any rule, so no injection order can quietly leave an
 * A4 slip being laid out at A5 and overflowing off the bottom.
 */
export function pageVars(p = paper()): string {
  const lh = p.kind === 'letterhead'
  const { w, h } = PAGE_MM[p.size]
  return `--pw:${w}mm;--ph:${h}mm;--lht:${lh ? p.top : 0}mm;--lhb:${lh ? p.bottom : 0}mm`
}
