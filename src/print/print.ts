import type { SlipData } from './renderSlip'
import { renderFitted } from './paginate'
import { ensurePrintStyles } from './styles'
import { renderCalibration } from './calibration'
import { renderToken, TOKEN_CSS, type TokenSlip } from './token'
import { paper } from '../paper'
import { applyPageGeometry } from './styles'

/**
 * ONE PRINT AT A TIME.
 *
 * Every print path in this app writes to the same `#print-root` and the same
 * global `@page` rule, because there is only one of each in a document. Two
 * jobs overlapping is not a race that produces a slow print, it is a race that
 * produces a WRONG print: the token rewrites the page box to 58mm and restores
 * it a third of a second later, so a prescription that starts in that window
 * comes out on a strip of receipt paper, or with the token's markup in it.
 *
 * The counter fires a token without awaiting it, on purpose, so this is not
 * theoretical: it is one compounder tapping "add to queue" and the doctor
 * pressing PRINT at the same moment on the same machine.
 *
 * So every job queues behind the last one. A print is a few hundred
 * milliseconds; a queue of two is invisible, and a collision is not.
 */
let jobs: Promise<unknown> = Promise.resolve()
function queued<T>(job: () => Promise<T>): Promise<T> {
  const next = jobs.then(job, job)      // a failed job must not block the next
  jobs = next.catch(() => {})
  return next
}

/**
 * Renders the slip and prints it.
 *
 * The markup is measured at real paper size first (see paginate.ts) so that no
 * row can end up underneath the signature box. `.page` is overflow:hidden, so
 * that mistake is invisible on screen and only appears on paper.
 *
 * Chrome must be started with --kiosk-printing, otherwise a dialog appears for
 * every patient — at 140 patients an evening that alone sinks the pilot.
 */
export function printSlip(data: SlipData): Promise<void> {
  return queued(() => doPrintSlip(data))
}

async function doPrintSlip(data: SlipData): Promise<void> {
  ensurePrintStyles()
  const root = document.getElementById('print-root')!
  root.innerHTML = await renderFitted(data)
  const restore = useTitle(slipFileName(data))
  await settle(60)
  await printAndWait()
  root.innerHTML = ''
  restore()
}

/** Two frames and a beat, so layout and fonts are settled before the snapshot. */
function settle(ms: number): Promise<void> {
  return new Promise(r => requestAnimationFrame(() => setTimeout(r, ms)))
}

/**
 * WAIT FOR THE BROWSER, NOT FOR A GUESS.
 *
 * Every print path used to hold the page for a fixed 350 or 400ms and then wipe
 * `#print-root`. On a clinic laptop with a cold laser driver, a three-sheet slip
 * can still be spooling when that fires, and the next job in the queue then
 * replaces the markup and the page size underneath a job that has not finished:
 * a prescription printed at 58mm on a receipt roll, or a token with a
 * prescription's content. The queue was written to prevent exactly that and the
 * timeout quietly undid it.
 *
 * `afterprint` is what the browser fires when it has taken what it needs. The
 * timeout stays as a floor, because a browser that never fires the event must
 * not freeze the queue for the rest of the evening.
 */
function printAndWait(fallback = 1500): Promise<void> {
  return new Promise(resolve => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.removeEventListener('afterprint', finish)
      clearTimeout(t)
      // one more frame: afterprint can arrive before the last paint is released
      requestAnimationFrame(() => setTimeout(resolve, 60))
    }
    window.addEventListener('afterprint', finish)
    const t = setTimeout(finish, fallback)
    try { window.print() } catch { finish() }
  })
}

/**
 * What Chrome calls the file when the doctor picks "Save as PDF".
 *
 * Chrome takes the filename from document.title, so every slip was arriving as
 * Nuskho.pdf and the second one as Nuskho (1).pdf. Nobody can find anything in
 * that folder a week later.
 *
 * THE PATIENT'S NAME IS DELIBERATELY NOT IN IT. A filename is the one piece of
 * a medical document that escapes the document: it shows in the Downloads list,
 * in recent files, in the file picker of every other program on that machine,
 * and in any backup listing. A name there tells whoever walks past the clinic
 * desk that this person saw a doctor. The code tells them nothing, and it is
 * already the key the clinic searches by, so this is also the more useful of
 * the two.
 */
export function slipFileName(d: SlipData): string {
  const at = new Date(d.visit.createdAt || Date.now())
  const day = [at.getFullYear(), at.getMonth() + 1, at.getDate()]
    .map((n, i) => (i ? String(n).padStart(2, '0') : n)).join('-')
  const code = (d.patientCode || '').replace(/[^A-Za-z0-9]/g, '') || 'slip'
  return `Nuskho-${code}-${day}`
}

/** Set the title for the duration of one print, then put it back. Chrome reads
 *  it at the moment of printing, and leaving it changed would rename the tab. */
function useTitle(t: string): () => void {
  const was = document.title
  document.title = t
  return () => { document.title = was }
}

/** Screen preview — same renderer and same fitting, so what you see is what prints. */
export async function previewHtml(data: SlipData): Promise<string> {
  return renderFitted(data)
}

/** Print the millimetre scale onto one of the doctor's own letterheads. */
export function printCalibration(): Promise<void> {
  return queued(() => doPrintCalibration())
}

async function doPrintCalibration(): Promise<void> {
  ensurePrintStyles()
  const root = document.getElementById('print-root')!
  root.innerHTML = renderCalibration()
  await settle(60)
  await printAndWait()
  root.innerHTML = ''
}

/**
 * The counter receipt, on the thermal printer.
 *
 * Two things make this different from every other print in the app.
 *
 * First, the page size. `@page` is global, so the roll width is written in,
 * used, and then the sheet geometry is put back. A token print that left the
 * page at 58mm would make the next prescription come out on a strip.
 *
 * Second, and more important: THIS NEVER THROWS AT THE CALLER. The token number
 * has already been issued and is already on screen. If the printer is out of
 * paper, unplugged, or simply not installed, the desk carries on and somebody
 * writes the number on a pad. The receipt is a courtesy, never the record.
 */
export function printToken(t: TokenSlip): Promise<boolean> {
  return queued(() => doPrintToken(t))
}

async function doPrintToken(t: TokenSlip): Promise<boolean> {
  const p = paper()
  if (!p.token) return false
  try {
    ensurePrintStyles()
    ensureTokenStyles()
    const w = p.tokenWidth
    setPageStyle(`@media print{@page{size:${w}mm auto;margin:0}}`)
    const root = document.getElementById('print-root')!
    root.innerHTML = renderToken(t, w)
    const restore = useTitle(`Token-${t.token}-${t.patientCode || 'x'}`)
    await settle(50)
    await printAndWait()
    root.innerHTML = ''
    restore()
    return true
  } catch {
    return false
  } finally {
    // whatever happened, the next prescription must find its own paper size
    applyPageGeometry()
  }
}

/**
 * Anything that wants the shared print root has to queue for it.
 *
 * Exported so card.ts can join the same line instead of writing into
 * `#print-root` from the side, which is what it used to do — mid-slip, at a
 * hard-coded A5 page box, on a clinic that may be set to A4.
 */
export function queuedPrint(render: () => Promise<string> | string, pageCss?: string): Promise<void> {
  return queued(async () => {
    ensurePrintStyles()
    if (pageCss) setPageStyle(pageCss)
    const root = document.getElementById('print-root')!
    try {
      root.innerHTML = await render()
      await settle(90)
      await printAndWait()
    } finally {
      root.innerHTML = ''
      applyPageGeometry()
    }
  })
}

let tokenStyled = false
function ensureTokenStyles(): void {
  if (tokenStyled) return
  const s = document.createElement('style')
  s.id = 'nuskho-token'
  s.textContent = TOKEN_CSS
  document.head.appendChild(s)
  tokenStyled = true
}

/**
 * Overwrite the PAGE rule for one job. applyPageGeometry() puts it back.
 *
 * Note that the measuring host's width lives in its own element now (see
 * styles.ts). It used to share this one, so a token print deleted the measure
 * width for a third of a second — and any pagination that ran in that window
 * measured a shrink-to-fit box, cached the wrong plan under layoutKey, and the
 * real print then reused it. Rows landed under the footer, invisible on screen
 * because .page is overflow:hidden.
 */
function setPageStyle(css: string): void {
  let el = document.getElementById('nuskho-page') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'nuskho-page'
    document.head.appendChild(el)
  }
  el.textContent = css
}
