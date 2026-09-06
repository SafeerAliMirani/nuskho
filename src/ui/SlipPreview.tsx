import { useEffect, useRef, useState } from 'react'
import type { SlipData } from '../print/renderSlip'
import { renderFitted } from '../print/paginate'
import { ensurePrintStyles } from '../print/styles'
import { paper, PAGE_MM } from '../paper'

/**
 * THE SLIP, WHILE IT IS STILL BEING WRITTEN.
 *
 * The laptop's right column had room, and the one picture worth putting there
 * is the paper the patient will walk out holding. It is the REAL slip: the
 * same renderSlip and the same fitter the printer uses, scaled down with a
 * transform so nothing inside it is laid out differently from paper. What the
 * doctor sees here is what comes out, minus the SPECIMEN tile on the practice
 * copy, which only exists at print time.
 *
 * It is a picture, not a control: nothing in it can be clicked, and a slip
 * that cannot be rendered yet (no medicine, a line still being typed) simply
 * shows the last good one or nothing. It never blocks the doctor and it never
 * touches #print-root, which belongs to the printer alone.
 *
 * Rendering runs through the measuring host, so it is debounced: a doctor
 * tapping MORNING, NIGHT, +, + in a second gets one render at the end, not
 * four. Below 1081px the column is not shown and this renders nothing at all.
 */
export function SlipPreview({ data, deps }: { data: () => SlipData; deps: unknown }) {
  const [html, setHtml] = useState('')
  const [scale, setScale] = useState(0.4)
  const wrap = useRef<HTMLDivElement>(null)
  const pw = PAGE_MM[paper().size].w

  useEffect(() => {
    if (!matchMedia('(min-width:1081px)').matches) return
    ensurePrintStyles()
    let live = true
    const t = setTimeout(async () => {
      try {
        const out = await renderFitted(data())
        if (live) setHtml(out)
      } catch { /* a slip that cannot be fitted yet keeps the last picture */ }
    }, 320)
    return () => { live = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const fit = () => {
      const pagePx = pw * 96 / 25.4
      setScale(Math.min(1, (el.clientWidth - 2) / pagePx))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pw])

  const ph = PAGE_MM[paper().size].h
  return (
    <div className="slippv" ref={wrap} aria-hidden>
      <div className="slippv-cap">What will print</div>
      <div className="slippv-box" style={{ height: ph * 96 / 25.4 * scale + 4 }}>
        {html
          ? <div className="slippv-in" style={{ transform: `scale(${scale})` }}
                 dangerouslySetInnerHTML={{ __html: html }} />
          : <div className="slippv-empty">Add a medicine and the slip appears here.</div>}
      </div>
    </div>
  )
}
