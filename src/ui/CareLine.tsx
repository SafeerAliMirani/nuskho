import { useEffect, useRef, useState } from 'react'
import { IcWarn } from './art'

/**
 * A TYPED ALLERGY THAT HAS NOT BEEN WRITTEN DOWN YET MUST NOT BE PRINTED
 * AROUND.
 *
 * The box below saves a moment after the typing stops, so a round trip to the
 * database cannot eat a keystroke. That debounce very nearly cost a patient
 * his warning: a doctor who typed "PENICILLIN ALLERGY" and reached straight
 * for PRINT — which is exactly what a doctor in a hurry does, and this whole
 * app is built so he never has to wait — printed a slip with no band on it,
 * because the write was still sitting in a timer.
 *
 * So the pending write is registered here, and the print path awaits it. One
 * promise, module level, because there is only ever one care line on screen.
 */
let pending: (() => Promise<void>) | null = null

/** Awaited by both print paths before anything is frozen. Resolves at once
 *  when nothing is waiting, which is the ordinary case. */
export async function flushCare(): Promise<void> {
  const p = pending
  pending = null
  if (p) await p()
}

/**
 * WHAT THIS PATIENT REACTS TO, AND WHETHER SHE IS PREGNANT.
 *
 * Two facts the app had nowhere to put, sitting where the doctor cannot miss
 * them: directly under the patient's name, above everything he is about to
 * write.
 *
 * THE APP MAKES NO CLINICAL CLAIM ABOUT EITHER. There is no drug database
 * here good enough to decide that a medicine is unsafe in pregnancy or that it
 * contains the thing this patient reacts to, and a wrong warning on a
 * prescription is worse than no warning: the doctor who is told something
 * false twice stops reading the true one. So these are a line a person writes
 * and a person reads, carried faithfully to the screen and to the paper. If a
 * doctor ever wants the app to check a list, the list has to be his, and that
 * is a decision he has not made yet (clinical-decisions-needed.md).
 *
 * The allergy belongs to the PATIENT and survives the token; the pregnancy
 * belongs to THIS visit and does not, because a flag that is never taken off
 * is a flag nobody believes.
 */
export function CareLine({ alert, pregnant, sex, onAlert, onPregnant, disabled }: {
  alert?: string
  pregnant?: boolean
  sex?: 'M' | 'F'
  onAlert: (s: string | undefined) => void | Promise<void>
  onPregnant: (b: boolean) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(alert ?? '')
  const typed = useRef(0)
  const saved = useRef(alert ?? '')
  // the parent wins again once the finger has been off the box for a moment
  if (Date.now() - typed.current > 1500 && saved.current !== (alert ?? '')) {
    saved.current = alert ?? ''
    if (draft !== (alert ?? '')) setDraft(alert ?? '')
  }

  /* THE WRITE, IN ONE PLACE, CALLED BY THREE THINGS: the debounce, the blur,
     and the print path through flushCare. Whichever gets there first, the
     other two find nothing left to do. */
  const write = useRef<() => Promise<void>>(async () => {})
  write.current = async () => {
    if (draft === saved.current) return
    saved.current = draft
    await onAlert(draft.trim() || undefined)
  }

  useEffect(() => {
    if (draft === saved.current) { if (pending) pending = null; return }
    pending = () => write.current()
    const t = setTimeout(() => { pending = null; void write.current() }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  /* AND ON THE WAY OUT. A doctor who types the allergy and taps back to the
     queue inside half a second used to lose it silently: the timer was
     cleared by the unmount and nothing had been written. */
  useEffect(() => () => { void flushCare() }, [])

  // A man is not offered it. A patient whose sex nobody recorded is, because
  // the commonest reason the field is empty is that the counter was busy.
  const mayBePregnant = sex !== 'M'

  return (
    <div className={'careline' + (alert || pregnant ? ' on' : '')}>
      <span className="cl-i"><IcWarn size={16} /></span>
      <input className="cl-in" value={draft} maxLength={120} disabled={disabled}
             placeholder="allergies or conditions, in your own words (prints)"
             onChange={e => { typed.current = Date.now(); setDraft(e.target.value) }}
             onBlur={() => { pending = null; void write.current() }} />
      {mayBePregnant && (
        <button type="button" className={'chip cl-pg' + (pregnant ? ' on' : '')} disabled={disabled}
                aria-pressed={!!pregnant}
                onClick={() => onPregnant(!pregnant)}>
          {pregnant ? '\u2713 ' : ''}Pregnant
        </button>
      )}
    </div>
  )
}
