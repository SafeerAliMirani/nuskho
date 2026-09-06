import { useEffect, useRef, useState } from 'react'
import { IcWarn } from './art'

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
 *
 * The box types like every other one on this screen: local while the finger is
 * on it, saved a moment after it stops, so a round trip to the database can
 * never eat a keystroke.
 */
export function CareLine({ alert, pregnant, sex, onAlert, onPregnant, disabled }: {
  alert?: string
  pregnant?: boolean
  sex?: 'M' | 'F'
  onAlert: (s: string | undefined) => void
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
  useEffect(() => {
    if (draft === (alert ?? '')) return
    const t = setTimeout(() => { saved.current = draft; onAlert(draft.trim() || undefined) }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  // A man is not offered it. A patient whose sex nobody recorded is, because
  // the commonest reason the field is empty is that the counter was busy.
  const mayBePregnant = sex !== 'M'

  return (
    <div className={'careline' + (alert || pregnant ? ' on' : '')}>
      <span className="cl-i"><IcWarn size={16} /></span>
      <input className="cl-in" value={draft} maxLength={120} disabled={disabled}
             placeholder="allergies or conditions, in your own words (prints)"
             onChange={e => { typed.current = Date.now(); setDraft(e.target.value) }} />
      {mayBePregnant && (
        <button type="button" className={'chip cl-pg' + (pregnant ? ' on' : '')} disabled={disabled}
                aria-pressed={!!pregnant}
                onClick={() => onPregnant(!pregnant)}>
          {pregnant ? '✓ ' : ''}Pregnant
        </button>
      )}
    </div>
  )
}
