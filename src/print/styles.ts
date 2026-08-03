import fontsCss from './fonts.css?raw'
import slipCss from './slip.css?raw'
import { paper, PAGE_MM } from '../paper'
import { CALIBRATION_CSS } from './calibration'

let injected = false

/**
 * The print stylesheet lives outside the app's CSS and is injected once.
 * Both the printer and the off-screen measuring host depend on it, so it lives
 * in its own module rather than inside print.ts (which would make the
 * print <-> paginate import cycle).
 */
export function ensurePrintStyles(): void {
  applyPageGeometry()
  if (injected) return
  const s = document.createElement('style')
  s.id = 'nuskho-print'
  s.textContent =
    fontsCss + '\n' + slipCss + '\n' + CALIBRATION_CSS + '\n' +
    // on screen the slip stays hidden; on paper only the slip exists
    `#print-root{position:fixed;left:-10000px;top:0}
     #nuskho-measure{position:fixed;left:-20000px;top:0;
       visibility:hidden;pointer-events:none;contain:layout}
     @media print{
       body>*{display:none !important}
       #print-root{display:block !important;position:static;left:0}
       #nuskho-measure{display:none !important}
     }`
  document.head.appendChild(s)
  injected = true
}

/**
 * Page size is a setting, so it cannot live in the static stylesheet. This rule
 * is rewritten whenever the doctor changes paper — including `@page`, which the
 * browser needs in order to pick the right tray size, and the measuring host,
 * which must be exactly as wide as the real sheet or every measurement lies.
 */
export function applyPageGeometry(): void {
  const { w, h } = PAGE_MM[paper().size]
  let el = document.getElementById('nuskho-page') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'nuskho-page'
    document.head.appendChild(el)
  }
  // Only what cannot live on the element: the sheet the printer must pull, and
  // the width of the measuring host. The page box itself is inline (see pageVars).
  const css = `@media print{@page{size:${w}mm ${h}mm;margin:0}}`
  if (el.textContent !== css) el.textContent = css

  // The measuring host gets its OWN element, so nothing that rewrites the page
  // box for one job can take the ruler away while a measurement is running.
  let m = document.getElementById('nuskho-measure-w') as HTMLStyleElement | null
  if (!m) {
    m = document.createElement('style')
    m.id = 'nuskho-measure-w'
    document.head.appendChild(m)
  }
  const mcss = `#nuskho-measure{width:${w}mm}`
  if (m.textContent !== mcss) m.textContent = mcss
}

/** Embedded fonts change every text height. Never measure before they land. */
export async function fontsReady(): Promise<void> {
  ensurePrintStyles()
  try { await (document as any).fonts?.ready } catch { /* older browser: proceed */ }
}
