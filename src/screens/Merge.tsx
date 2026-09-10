import { useState } from 'react'
import type { Patient } from '../types'
import { db, findByCode, mergePatients } from '../db'
import { patientCode } from '../code'
import { role, ROLE_NAME } from '../roles'
import { suggestKeep, mergeRefusal } from '../merge'
import { sameHousehold } from '../household'
import { whyItFailed } from '../fail'
import { Note } from '../ui/Note'
import { IcUser, IcWarn } from '../ui/art'

/**
 * THE SAME PERSON, TWICE. See merge.ts for what a merge is and what it
 * refuses; this is only the screen.
 *
 * Two numbers in, two cards side by side, one sentence saying exactly what
 * will happen, one button. The person doing this is reading two records and
 * deciding they are one human being. Nothing on this screen helps him decide
 * that — it cannot; it has never met the patient — so it does the next best
 * thing and makes it very hard to fold the wrong two together by accident:
 *
 *   BOTH RECORDS ARE SHOWN IN FULL before anything can be pressed, with their
 *   visit counts and the date each was last seen. Two people with the same
 *   name and different villages look different on this screen.
 *
 *   THE SURVIVOR IS SAID IN WORDS, with its number, and can be swapped. The
 *   older number is suggested because it is on more slips.
 *
 *   THE HOUSEHOLD IS CHECKED. Two records under the same phone are very
 *   probably one person; two under different phones might not be, and the
 *   screen says so before the button.
 *
 * The card classes are m-stay and m-fold rather than the obvious words,
 * because slip.css is injected into the whole document unscoped and already
 * owns `.keep` (a flex row on the printed slip). The first draft of this
 * screen had its surviving card laid out as a slip row. See what-is-missing:
 * the print stylesheet leaking onto the screen is a standing hazard.
 *
 * Nothing clinical is on this screen. Names, numbers, ages, villages, counts
 * and dates. The clinic admin who reaches it holds no permission that could
 * fetch a diagnosis, and the merge moves visits without reading them.
 */

type Card = { p: Patient; visits: number; last?: number }

async function load(code: string): Promise<Card | string> {
  const p = await findByCode(code)
  if (!p) return `No patient with the number ${code}.`
  const vs = await db.visits.where('patientId').equals(p.id).toArray()
  const last = vs.reduce((m, v) => Math.max(m, v.createdAt), 0)
  return { p, visits: vs.length, last: last || undefined }
}

export default function Merge({ onBack }: { onBack: () => void }) {
  const [codeA, setCodeA] = useState('')
  const [codeB, setCodeB] = useState('')
  const [a, setA] = useState<Card | null>(null)
  const [b, setB] = useState<Card | null>(null)
  const [keepFirst, setKeepFirst] = useState<boolean | null>(null)
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)

  async function find() {
    setErr(''); setDone(''); setA(null); setB(null); setKeepFirst(null)
    const [ra, rb] = await Promise.all([load(codeA), load(codeB)])
    if (typeof ra === 'string') { setErr(ra); return }
    if (typeof rb === 'string') { setErr(rb); return }
    const no = mergeRefusal(ra.p, rb.p)
    if (no) { setErr(no); return }
    setA(ra); setB(rb)
    // the older number survives unless told otherwise
    setKeepFirst(suggestKeep(ra.p, rb.p)[0].id === ra.p.id)
  }

  const keep = a && b && keepFirst !== null ? (keepFirst ? a : b) : null
  const gone = a && b && keepFirst !== null ? (keepFirst ? b : a) : null
  const sameHouse = a && b ? sameHousehold(a.p, b.p) : false

  async function fold() {
    if (!keep || !gone || busy) return
    setBusy(true); setErr('')
    try {
      const why = await mergePatients(keep.p.id, gone.p.id, ROLE_NAME[role()])
      if (why) { setErr(why); return }
      setDone(`Done. Number ${patientCode(gone.p.num)} now opens ${keep.p.name}, ${patientCode(keep.p.num)}, `
        + `and ${gone.visits === 1 ? 'its one visit is' : `its ${gone.visits} visits are`} on that record.`)
      setA(null); setB(null); setKeepFirst(null); setCodeA(''); setCodeB('')
    } catch (e) {
      console.error('[nuskho] the merge was not written', e)
      setErr(whyItFailed(e, 'The two records were not merged'))
    } finally { setBusy(false) }
  }

  return (
    <div className="pane">
      <button className="btn ghost" onClick={onBack}>&larr; Back</button>
      <h2 style={{ marginTop: 16 }}><IcUser size={17} /> The same person, twice</h2>
      <p className="hint">
        A patient who came without his slip was taken in as new and got a second number. Put
        both numbers here, check the two cards are one person, and fold the newer record into
        the older one. The old number keeps working: a slip carrying it will open the merged
        record.
      </p>

      <div className="row">
        <div className="fld"><label>One number</label>
          <input value={codeA} inputMode="numeric" maxLength={6} className="codebox"
                 onChange={e => setCodeA(e.target.value.replace(/\D/g, '').slice(0, 6))} /></div>
        <div className="fld"><label>The other number</label>
          <input value={codeB} inputMode="numeric" maxLength={6} className="codebox"
                 onChange={e => setCodeB(e.target.value.replace(/\D/g, '').slice(0, 6))}
                 onKeyDown={e => { if (e.key === 'Enter') void find() }} /></div>
        <button className="btn" style={{ alignSelf: 'flex-end' }}
                disabled={codeA.length < 5 || codeB.length < 5} onClick={find}>Show both</button>
      </div>

      {err && <div className="saidno"><Note tone="stop" title="Not merged">{err}</Note></div>}
      {done && <Note tone="safe" title="Merged">{done}</Note>}

      {a && b && keep && gone && (
        <>
          <div className="mergecards">
            {[a, b].map((c, i) => {
              const isKeep = c.p.id === keep.p.id
              return (
                <div key={c.p.id} className={'mcard' + (isKeep ? ' m-stay' : ' m-fold')}>
                  <span className="mtag">{isKeep ? 'STAYS' : 'folds in'}</span>
                  <b dir="auto">{c.p.name}</b>
                  <span className="mnum">No. {patientCode(c.p.num)}</span>
                  <dl>
                    <dt>Age</dt><dd>{c.p.age ?? '—'}{c.p.sex ? ` · ${c.p.sex === 'M' ? 'man' : 'woman'}` : ''}</dd>
                    <dt>Phone</dt><dd>{c.p.phone ?? '—'}</dd>
                    <dt>From</dt><dd>{c.p.city ?? '—'}</dd>
                    <dt>Visits</dt><dd>{c.visits}{c.last ? `, last ${when(c.last)}` : ''}</dd>
                    <dt>Since</dt><dd>{when(c.p.createdAt)}</dd>
                    {c.p.alert && <><dt>Allergy</dt><dd>{c.p.alert}</dd></>}
                  </dl>
                  {!isKeep && (
                    <button className="lnk" onClick={() => setKeepFirst(i === 0)}>keep this one instead</button>
                  )}
                </div>
              )
            })}
          </div>

          {!sameHouse && (
            <Note tone="warn" title="Different phones, or none">
              These two records are not under the same phone number. Two people can share a
              name and a village. Be sure before you press the button, because a merge cannot
              be undone.
            </Note>
          )}

          <p className="mergesay">
            <IcWarn size={15} /><span><b>{gone.p.name}, {patientCode(gone.p.num)}</b> will be folded into{' '}
            <b>{keep.p.name}, {patientCode(keep.p.num)}</b>. {gone.visits === 0 ? 'It has no visits.'
              : gone.visits === 1 ? 'Its one visit moves across.' : `Its ${gone.visits} visits move across.`}
            {' '}Number {patientCode(gone.p.num)} stays as a signpost, so an old slip with it still opens
            the right person. Blank details on the one that stays are filled from the other;
            nothing already there is overwritten.</span>
          </p>

          <button className="btn warn wide" disabled={busy} onClick={fold}>
            {busy ? 'Merging…' : `Fold ${patientCode(gone.p.num)} into ${patientCode(keep.p.num)}`}
          </button>
        </>
      )}
    </div>
  )
}

const when = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
