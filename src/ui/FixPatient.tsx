import { useState } from 'react'
import type { Patient } from '../types'
import { NEAR } from '../data/places'
import { describe, describeOld, refusal, printedNote, type PatientPatch } from '../patient'
import { patientCode } from '../code'
import { Note } from './Note'
import { IcUser } from './art'

/**
 * THE BOX THAT FIXES A NAME TYPED WRONG AT THE DOOR.
 *
 * One component for the desk, the room and the phone, for the same reason
 * fields.ts is one cleaner: three copies of a screen that rewrites identity
 * would be three chances to get the guard rails different.
 *
 * Everything about how it looks is about the mistake it is preventing rather
 * than the one it is fixing. A typo is easy and the app should get out of the
 * way. Typing the man at the counter over somebody else's record is the fault
 * that does not announce itself, so:
 *
 *   THE NUMBER AND THE OLD NAME LEAD, in the heading, before any input. The
 *   desk should see whose record this is while it still has the old slip in
 *   its hand, not after saving.
 *
 *   THE CHANGE IS READ BACK as a sentence, live, above the button — "name
 *   Wazeer to Wazir". Reading a sentence catches a wrong record in a way that
 *   comparing two filled boxes does not.
 *
 *   THE PAPER ALREADY OUT IS NAMED, with a count, because the reasonable
 *   expectation is that a reprint carries the correction and it does not.
 *
 *   THE OLD DETAILS ARE LISTED underneath if this record has been corrected
 *   before. A record corrected three times in one evening is a record somebody
 *   is confused about, and the only place that can be noticed is here.
 */
export function FixPatient({ pt, printed, by, slim, onSave, onClose }: {
  pt: Patient
  /** how many prescriptions are already printed for this patient */
  printed: number
  /** the role doing it, for the sentence above the button */
  by: string
  /**
   * Name, age and man-or-woman only. This is the doctor's phone, where the
   * wire sends exactly those three and never the phone number or the village:
   * a mirror holds nothing it has not been given, and a box offering a field
   * it was never told the current value of would show every patient a blank
   * phone number and invite somebody to save it. The patch simply leaves those
   * keys out, and an absent key means "leave it alone" (see changedFields), so
   * the desk's fields survive a correction made in the room.
   */
  slim?: boolean
  /** answers a sentence when it refused, or null when it was written */
  onSave: (patch: PatientPatch) => Promise<string | null>
  onClose: () => void
}) {
  const [name, setName] = useState(pt.name)
  const [age, setAge] = useState(pt.age ?? '')
  const [sex, setSex] = useState<'M' | 'F' | ''>(pt.sex ?? '')
  const [phone, setPhone] = useState(pt.phone ?? '')
  const [city, setCity] = useState(pt.city ?? '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const patch: PatientPatch = slim ? { name, age, sex } : { name, age, sex, phone, city }
  const said = describe(pt, patch)
  const no = refusal(pt, patch)
  const note = printedNote(printed)

  async function save() {
    if (busy) return
    setBusy(true)
    try {
      const why = await onSave(patch)
      if (why) { setErr(why); return }
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <div className="fixpt">
      <h3><IcUser size={15} /> Correct the details</h3>
      {/* WHOSE RECORD, on its own line and above every box.
          The number first because that is what the desk is holding — it read
          it off the slip thirty seconds ago — and the name after it, in its
          own element with dir="auto" so a Sindhi name is not turned inside out
          by the punctuation around it. Both were once in the heading, in a
          sentence, and a bidi name inside a sentence with a comma after it
          renders with the comma in the wrong place. */}
      <p className="fixwho">No. <b>{patientCode(pt.num)}</b> · <b dir="auto">{pt.name}</b></p>
      {/* Not a heading and not decoration: this is the sentence that stops a
          desk correcting the wrong man. */}
      <p className="hint">
        The patient number never changes. If this is not the right person, close this
        and open the right number instead.
      </p>

      <div className="fld"><label>Name — نالو</label>
        <input value={name} autoFocus onChange={e => { setName(e.target.value); setErr('') }} /></div>
      <div className="row">
        {!slim && (
        <div className="fld"><label>Phone — optional</label>
          <input value={phone} inputMode="numeric"
                 onChange={e => setPhone(e.target.value.replace(/[^0-9+ ]/g, '').slice(0, 15))} /></div>
        )}
        <div className="fld"><label>Age — optional</label>
          <input value={age} inputMode="numeric" maxLength={3}
                 onChange={e => {
                   const v = e.target.value.replace(/\D/g, '').slice(0, 3)
                   if (v === '' || +v <= 120) setAge(v)
                 }} /></div>
        <div className="fld"><label>Man or woman</label>
          <div className="chips">
            {([['M', 'Man'], ['F', 'Woman']] as const).map(([k, l]) => (
              <button key={k} className={'chip' + (sex === k ? ' have' : '')}
                      onClick={() => setSex(sex === k ? '' : k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      {!slim && (
      <div className="fld"><label>City or village — شهر</label>
        <div className="chips">
          {NEAR.map(c => (
            <button key={c} className={'chip' + (city === c ? ' have' : '')}
                    onClick={() => setCity(c)}>{c}</button>
          ))}
        </div>
        <input value={city} onChange={e => setCity(e.target.value)} />
      </div>
      )}

      {/* What is about to happen, in words, before it happens. */}
      {said && <p className="fixsay">Changing <b>{said}</b>.</p>}
      {note && <Note tone="info" title="The slips already printed do not change">{note}</Note>}
      {err && <div className="saidno"><Note tone="stop" title="Not corrected">{err}</Note></div>}

      <div className="row">
        <button className="btn" disabled={!!no || busy} onClick={save}>
          {busy ? 'Saving…' : 'Save the correction'}
        </button>
        <button className="btn ghost" onClick={onClose}>Leave it as it is</button>
      </div>
      <p className="hint">Saved as a correction by the <b>{by}</b>, with the old details kept.</p>

      {!!pt.corrections?.length && (
        <div className="fixlog">
          <b>Corrected before</b>
          {[...pt.corrections].reverse().map((c, i: number) => (
            <span key={i}>{when(c.at)} · {c.by} · {describeOld(c)}</span>
          ))}
        </div>
      )}
    </div>
  )
}

const when = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
