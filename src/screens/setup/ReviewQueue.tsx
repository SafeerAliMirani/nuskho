import { useEffect, useState } from 'react'
import { db, similarDrugs, archiveDrug } from '../../db'
import {
  FORMS, FORM_LABEL, ROUTES, ROUTE_LABEL, routeMatters, defaultRoute, doseSdFor,
  pendingWords, setWordOk,
} from '../../data/forms'
import type { Drug } from '../../types'
import { profile } from '../../profile'

/**
 * What we do on a clinic visit instead of standing in front of the doctor.
 *
 * Every medicine he typed himself lands here. We fix the spelling, correct the
 * strength, merge the duplicates, write the Sindhi name properly, and promote
 * it. None of that ever blocked him from prescribing, and none of it changes a
 * prescription already printed — those carry their own copy of what was on them.
 *
 * The number at the top of this list, falling week by week, is the real answer
 * to "is the catalogue any good yet".
 */
/**
 * THE APP'S OWN WORDS, WAITING TO BE READ.
 *
 * The medicine names have had this all along: `sdReviewed`, and until it is
 * ticked the Sindhi does not print. The app's own vocabulary had no such gate,
 * because for a long time it was four words that had been on paper since the
 * first sheet.
 *
 * Adding drops, creams and sachets added words nobody in this project has read
 * yet, and a suggested spelling on a medical document is the one thing this
 * app must not do. So they sit here until a person ticks them, and until then
 * the slip prints the English word beside the pictogram, which is safe and
 * still says what is in the box.
 */
function WordsToRead() {
  const [, bump] = useState(0)
  const words = pendingWords()
  if (!words.length) return null
  const left = words.filter(w => !w.ok).length
  return (
    <div className="lhbox" style={{ marginBottom: 18 }}>
      <h3>Words waiting to be read {left > 0 ? `(${left})` : '\u2713'}</h3>
      <p>
        Nuskho suggests these for the new medicine forms. Until one is ticked it is
        NOT printed: the slip carries the English word and the picture instead.
        Tick it only if a Sindhi speaker has read it and it is right.
      </p>
      {words.map(w => (
        <label className="check" key={w.key}>
          <input type="checkbox" checked={w.ok}
                 onChange={e => { setWordOk(w.key, e.target.checked); bump(n => n + 1) }} />
          <span>
            <b className="sd" style={{ fontSize: 19 }}>{w.sd}</b>
            <small>{w.en}</small>
          </span>
        </label>
      ))}
    </div>
  )
}

export default function ReviewQueue() {
  const [all, setAll] = useState<Drug[]>([])
  const [edit, setEdit] = useState<Drug | null>(null)
  const [out, setOut] = useState('')

  const load = async () => setAll(await db.drugs.toArray())
  useEffect(() => { load() }, [])

  const live = all.filter(d => !d.archived)
  const pending = live.filter(d => !d.verified)
  const dupes = live.filter(d =>
    similarDrugs(d.brand, d.strength, live).some(o => o.id !== d.id))

  /**
   * Verification work is expensive and, until now, died on the machine where it
   * happened. The next clinic shipped with the same eight seeds and someone
   * re-checked the same PANADOL.
   *
   * This writes the verified entries out in the shape dictionary.ts wants, to be
   * pasted into the file and shipped. Every clinic then makes the next install
   * shorter, and the file grows from real prescribing rather than a download.
   *
   * Text on screen, on purpose: nothing about what a doctor prescribes leaves
   * this machine by itself.
   */
  function asDictionary() {
    const who = (profile().doctorEn || 'clinic').split(' ').pop()?.toLowerCase() ?? 'clinic'
    const stamp = new Date().toISOString().slice(0, 7)
    const rows = live
      .filter(d => d.verified && d.sdReviewed === true)
      .sort((a, b) => a.brand.localeCompare(b.brand))
      .map(d => `  { brand: '${d.brand.replace(/'/g, "\\'")}', strength: '${d.strength}', form: '${d.form}',`
              + ` generic: '${d.generic.replace(/'/g, "\\'")}', sd: '${d.sd}', verified: '${who} ${stamp}' },`)
    setOut(rows.length
      ? rows.join('\n')
      : 'Nothing to export yet. An entry needs to be promoted AND have its Sindhi ticked.')
  }

  async function promote(d: Drug) {
    await db.drugs.update(d.id, { verified: true, pending: false })
    await load()
  }
  async function saveEdit() {
    if (!edit) return
    // an edit is a change to the catalogue, so it needs looking at again
    await db.drugs.update(edit.id, { ...edit, verified: false })
    setEdit(null)
    await load()
  }

  return (
    <>
      <p className="hint">
        Medicines the clinic typed in itself. Nothing here has ever stopped a prescription —
        correcting them is housekeeping, and it cannot change any slip already printed.
      </p>

      <WordsToRead />

      <div className="sumbox">
        <div><span>On his list</span><b>{live.length}</b></div>
        <div><span>Waiting for us</span><b>{pending.length}</b></div>
        <div><span>Look like duplicates</span><b>{dupes.length}</b></div>
        <div><span>Sindhi not checked</span><b>{live.filter(d => d.sdReviewed !== true).length}</b></div>
      </div>

      {edit && (
        <div className="lhbox">
          <h3>{edit.brand} {edit.strength}</h3>
          <div className="row">
            <div className="fld"><label>Brand — as printed on the box</label>
              <input value={edit.brand} onChange={e => setEdit({ ...edit, brand: e.target.value.toUpperCase() })} /></div>
            <div className="fld"><label>Strength</label>
              <input value={edit.strength} onChange={e => setEdit({ ...edit, strength: e.target.value })} /></div>
          </div>
          <div className="fld"><label>Generic</label>
            <input value={edit.generic} onChange={e => setEdit({ ...edit, generic: e.target.value })} /></div>
          <div className="row">
            <div className="fld"><label>Sindhi name</label>
              <input className="sdin" dir="rtl" value={edit.sd}
                     onChange={e => setEdit({ ...edit, sd: e.target.value })} /></div>
            <div className="fld"><label>Form</label>
              <div className="chips">
                {FORMS.map(f => (
                  <button key={f} className={'chip' + (edit.form === f ? ' have' : '')}
                          onClick={() => setEdit({ ...edit, form: f, route: defaultRoute(f),
                            unitSd: doseSdFor(f) })}>{FORM_LABEL[f]}</button>
                ))}
              </div></div>
          </div>

          {/* WHERE IT GOES, asked only where it can differ. An eye drop and a
              drop by mouth for a baby are the same bottle and completely
              different instructions, and the slip prints the site instead of
              the meal picture for anything that is not swallowed. */}
          {routeMatters(edit.form) && (
            <div className="fld"><label>Where does it go?</label>
              <div className="chips">
                {ROUTES.map(r => (
                  <button key={r} className={'chip' + ((edit.route ?? defaultRoute(edit.form)) === r ? ' have' : '')}
                          onClick={() => setEdit({ ...edit, route: r })}>{ROUTE_LABEL[r]}</button>
                ))}
              </div>
              <span className="unit">A slip for an eye or ear drop shows the site
                where a tablet shows the plate, because "after food" says nothing
                about an eye drop.</span>
            </div>
          )}

          {/* Only a syrup, and only because the chemist picks a bottle by it. */}
          {edit.form === 'syr' && (
            <div className="fld"><label>One spoon is how many ml?</label>
              <input inputMode="numeric" value={String(edit.mlPerDose ?? 5)}
                     onChange={e => {
                       const v = e.target.value.replace(/[^0-9.]/g, '').slice(0, 5)
                       setEdit({ ...edit, mlPerDose: v === '' ? undefined : +v })
                     }} />
              <span className="unit">Almost always 5, the cap that comes with the
                bottle. It never changes the dose printed on the slip. It only
                works out the total the chemist reads, so he picks 60 ml or
                120 ml without doing the sum.</span>
            </div>
          )}
          <label className="check">
            <input type="checkbox" checked={edit.sdReviewed === true}
                   onChange={e => setEdit({ ...edit, sdReviewed: e.target.checked })} />
            <span>The Sindhi name above is correct.
              <small>Until this is ticked the Sindhi name is not printed at all.</small></span>
          </label>
          <div className="wiznav">
            <button className="btn ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn wide" onClick={saveEdit}>Save</button>
          </div>
        </div>
      )}

      <h3>Waiting for us — {pending.length}</h3>
      <div className="druglist">
        {pending.map(d => {
          const near = similarDrugs(d.brand, d.strength, live).filter(o => o.id !== d.id)
          return (
            <div className="drow rev" key={d.id}>
              <b>{d.brand} {d.strength}</b>
              <span>{d.generic || <i>no generic</i>}</span>
              <span className="sd">{d.sdReviewed === true ? d.sd : <i className="unv">{d.sd} — unchecked</i>}</span>
              {near.length > 0 && <span className="warnpill">like {near[0].brand} {near[0].strength}</span>}
              <button className="lnk" onClick={() => setEdit(d)}>edit</button>
              <button className="lnk" onClick={() => promote(d)}>promote</button>
              <button className="lnk" onClick={() => archiveDrug(d.id).then(load)}>retire</button>
            </div>
          )
        })}
        {!pending.length && <div className="drow"><span>Nothing waiting.</span></div>}
      </div>

      <h3>Send these back to the dictionary</h3>
      <p className="hint">
        Entries you have promoted <b>and</b> whose Sindhi you have ticked, written out ready to
        paste into <code>src/data/dictionary.ts</code>. Shipping them means the next clinic finds
        these medicines on day one instead of typing them again.
      </p>
      <button className="btn" onClick={asDictionary}>Write the dictionary lines</button>
      {out && (
        <>
          <textarea className="bulk" rows={8} readOnly value={out} onFocus={e => e.currentTarget.select()} />
          <p className="hint">
            {out.startsWith('Nothing')
              ? ''
              : `${out.split('\n').length} entries. Click the box to select it all, then paste into the file.`}
          </p>
        </>
      )}

      <p className="hint">
        <b>Retire</b> takes a medicine out of the picker. It is never deleted — prescriptions
        already printed name it, and that record has to stay answerable for years.
      </p>
    </>
  )
}
