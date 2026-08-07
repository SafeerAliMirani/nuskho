import { useEffect, useState } from 'react'
import { tourFor, noteTourSeen, type TourStep, type Screen } from '../tour'
import { ROLE_NAME, ROLE_SD, type Role } from '../roles'

/**
 * THE GUIDED TOUR, DRAWN OVER THE REAL SCREEN.
 *
 * Every step rings the actual control it is talking about, so the person
 * learns where the thing IS, not what it is called. If a step's control is
 * not on this screen right now the ring simply does not appear and the card
 * still reads correctly, which is why a layout change can never break the
 * tour into nonsense.
 *
 * IT DOES NOT TAKE CLICKS. The dimming is `pointer-events: none`, so a
 * compounder halfway through the tour can tap a waiting patient's row and
 * work. Nothing in this app may stand between a person and a patient, and a
 * modal overlay is exactly that.
 */
export default function Tour({ role, screen = 'queue', onClose }: {
  role: Role; screen?: Screen; onClose: () => void
}) {
  const steps = tourFor(role, screen)
  const [i, setI] = useState(0)
  const [box, setBox] = useState<DOMRect | null>(null)

  const step: TourStep | undefined = steps[i]

  /**
   * Pick the control this step is about, ONCE, and use the same element for
   * scrolling and for the ring so the two cannot disagree.
   *
   * A selector may match something that is present but empty — `.qlist` with
   * nobody in the queue is a real element two pixels tall — and ringing that
   * draws a gold sliver at the bottom of the screen pointing at nothing. So a
   * candidate has to be big enough to be worth pointing at, and the next
   * selector in the list gets its turn if it is not. When nothing qualifies
   * there is no ring, no dimming, and the step simply reads as a card.
   *
   * THE FLOOR WAS 26 PIXELS TALL AND THAT WAS TOO HIGH. A heading is about 24,
   * so every step that pointed at one silently rang nothing — which is part of
   * what Safeer saw when he said the middle steps were not working. The guard
   * exists to reject a collapsed two-pixel list, so twelve is enough for the
   * height, and the width does the rest of the work.
   */
  const pick = (at?: string): Element | null => {
    if (!at) return null
    for (const sel of at.split(',')) {
      let el: Element | null = null
      try { el = document.querySelector(sel.trim()) } catch { el = null }
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (r.height >= 12 && r.width >= 40) return el
    }
    return null
  }

  useEffect(() => {
    if (!step) return
    let alive = true
    const el = pick(step.at)
    if (!el) { setBox(null); return }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const measure = () => { if (alive) setBox(el.getBoundingClientRect()) }
    measure()
    // once the smooth scroll has settled, and again while the page moves
    const t = setTimeout(measure, 340)
    const t2 = setTimeout(measure, 700)
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      alive = false
      clearTimeout(t); clearTimeout(t2)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [i, step])

  const done = () => { noteTourSeen(role, screen); onClose() }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') done()
      if (e.key === 'ArrowRight') setI(n => Math.min(n + 1, steps.length - 1))
      if (e.key === 'ArrowLeft') setI(n => Math.max(n - 1, 0))
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  if (!step) return null
  const last = i === steps.length - 1

  return (
    <>
      {box && (
        <div className="tourspot" style={{
          top: Math.max(4, box.top - 6), left: Math.max(4, box.left - 6),
          width: box.width + 12, height: box.height + 12,
        }} />
      )}

      {/* The card sits in the half of the screen the ring is NOT in. Without
          this it settles over the very control it is pointing at, and on a
          phone it covers the bottom third permanently, which makes "you can
          keep working" only half true. */}
      <div className={'tourcard' + (box && box.top + box.height / 2 > window.innerHeight / 2 ? ' top' : '')}
           role="dialog" aria-label={`How the ${ROLE_NAME[role]} screen works`}>
        <div className="tc-top">
          <span className="tc-who">{ROLE_NAME[role]} <i className="sd">{ROLE_SD[role]}</i></span>
          <button className="tc-x" onClick={done} aria-label="Close the tour">×</button>
        </div>

        <div className="tc-body">
          <span className="tc-n">{i + 1}<i>/{steps.length}</i></span>
          <h3>{step.title}{step.sd && <i className="sd">{step.sd}</i>}</h3>
          <p>{step.body}</p>
        </div>

        <div className="tc-foot">
          {/* THESE WERE SEVEN PIXELS WIDE.
              Safeer reported the middle ones "not working"; a seven pixel
              target is not a control, it is a decoration that occasionally
              responds. The dot still LOOKS seven pixels, and the thing you
              press is a button with room around it, with a name a screen
              reader can say. */}
          <span className="tc-dots">
            {steps.map((_, k) => (
              <button key={k} className={'tc-dot' + (k === i ? ' on' : k < i ? ' past' : '')}
                      aria-label={`Step ${k + 1} of ${steps.length}`}
                      aria-current={k === i ? 'step' : undefined}
                      onClick={() => setI(k)}><i /></button>
            ))}
          </span>
          <span className="tc-btns">
            {i > 0 && <button className="lnk" onClick={() => setI(i - 1)}>Back</button>}
            {last
              ? <button className="btn" onClick={done}>Done</button>
              : <button className="btn" onClick={() => setI(i + 1)}>Next</button>}
          </span>
        </div>

        <p className="tc-note">You can keep working while this is open. Nothing here blocks the screen.</p>
      </div>
    </>
  )
}
