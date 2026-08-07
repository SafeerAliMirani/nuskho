import fontsCss from './fonts.css?raw'
import slipCss from './slip.css?raw'
import { paper, PAGE_MM } from '../paper'
import { CALIBRATION_CSS } from './calibration'
import { isDemo } from '../version'

let injected = false

/**
 * THE PRACTICE COPY MUST NOT BE ABLE TO BECOME A CLINIC.
 *
 * The public copy of Nuskho rebuilds on every push. That is fine for showing
 * people and fatal for treating patients, and the danger is not that somebody
 * decides to misuse it — it is that a doctor is shown the app, likes it, and
 * simply carries on using the thing already open in front of him. Nobody ever
 * decides to start; they just do not stop.
 *
 * Refusing to run is not the answer either: a demo that will not do anything
 * sells nothing, and the whole product is one piece of paper.
 *
 * So the paper is what is poisoned. Every printed sheet from a practice copy
 * carries this across it, in both scripts. A clinic cannot run on prescriptions
 * that say SPECIMEN over the medicines — a chemist will not fill one and a
 * patient will ask — so the practice copy fails at the exact moment somebody
 * tries to use it for real, which is the only moment that matters.
 *
 * It is drawn as a repeating background rather than as an element, so nothing
 * in the layout moves: the demo prints the same rows in the same places as the
 * real thing. What is being sold is still what is being seen.
 */
const TILE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='150'%3E" +
  "%3Ctext x='150' y='80' text-anchor='middle' transform='rotate(-30 150 75)' " +
  "font-family='Helvetica,Arial,sans-serif' font-size='26' font-weight='bold' " +
  "letter-spacing='3' fill='%23000' fill-opacity='0.14'%3E" +
  "SPECIMEN %D9%86%D9%85%D9%88%D9%86%D9%88%3C/text%3E%3C/svg%3E"

const DEMO_PRINT_CSS = `
@media print{
  /* A TILE, NOT ONE BIG WORD ACROSS THE MIDDLE.
     The first version centred a single line on the sheet — and a prescription
     with three medicines puts them all in the top third, so the word sat in
     the empty space underneath and crossed nothing. A slip whose medicines are
     perfectly clean is a slip somebody will use. Tiling covers the rows
     wherever they fall, on one medicine or on nine, on A5 or A4. */
  .page{position:relative}
  .page::after{
    content:"";position:absolute;inset:0;
    background-image:url("${TILE}");
    background-repeat:repeat;
    pointer-events:none;z-index:9999;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
  }
  .tok{position:relative}
  .tok::after{
    content:"SPECIMEN";
    position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-family:Helvetica,Arial,sans-serif;font-size:13pt;font-weight:700;letter-spacing:3px;
    color:rgba(0,0,0,.17);transform:rotate(-26deg);
    pointer-events:none;z-index:9999;
  }
}`

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
     }` +
    (isDemo ? '\n' + DEMO_PRINT_CSS : '')
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

/**
 * EMBEDDED FONTS CHANGE EVERY TEXT HEIGHT. NEVER MEASURE BEFORE THEY LAND.
 *
 * That was the intent and this function did not achieve it. `document.fonts
 * .ready` settles the font loads that are already PENDING, and a face is only
 * pending once some laid-out text asks for it. The fitting pass runs before any
 * slip markup exists, so nothing had asked for NK, `ready` resolved on the spot,
 * and every sheet was measured in the browser's fallback font.
 *
 * The Sindhi lines are the tall ones on this page, so the fallback measured
 * SHORTER than the truth. The fitter then agreed to a sheet that did not fit,
 * and the tests box, the advice box and the handwriting strip printed
 * underneath the footer. `.page` is overflow:hidden, so nothing on any screen
 * ever showed it: this failed only on paper, only at the bottom, and only on a
 * full prescription.
 *
 * So the faces are ASKED FOR first, with a string that actually contains the
 * script, and only then is `ready` awaited.
 */
export async function fontsReady(): Promise<void> {
  ensurePrintStyles()
  try {
    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts
    if (!fonts) return
    await Promise.all([
      fonts.load('400 12pt NK', 'گوري 1'),
      fonts.load('700 12pt NK', 'گوري 1'),
    ].map(p => p.catch(() => [])))
    await fonts.ready
  } catch { /* older browser: proceed, and be wrong the old way rather than fail */ }
}
