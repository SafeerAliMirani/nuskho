import { useEffect, useMemo, useRef, useState } from 'react'
import { db, uid, nextToken, doctorDrugs, usageCounts, lastVisit, patientCode, similarDrugs, grantDiscount, listSets, saveSet, deleteSet } from '../db'
import { formulary, labTests, adviceList } from '../data/formulary'
import { seedDiagnoses } from '../data/specialty'
import Vitals from '../ui/Vitals'
import { profile } from '../profile'
import { toSindhi, splitBrand } from '../data/translit'
import { searchDictionary, dictLine, type DictEntry } from '../data/dictionary'
import { printSlip } from '../print/print'
import { doctorById, multiRoom, visitDoctorId } from '../doctors'
import { sendOn, unsend, incoming, sendTargets, destinationEn, destinationSd, type Incoming } from '../refer'
import { filled } from '../data/vitals'
import { IcBook, IcPill } from '../ui/art'
import { Note } from '../ui/Note'
import { signal } from '../ui/bus'
import Bell from '../ui/Bell'
import Tour from '../ui/Tour'
import { tourFor, tourSeen } from '../tour'
import { role } from '../roles'
import { warmPlan } from '../print/paginate'
import type { Visit, Patient, RxLine, Drug, RxSet } from '../types'
import { doseSdFor, defaultRoute } from '../data/forms'

/** 0 → 1 → 2 → ½ → 0. "2 tablets" is routine for adult paracetamol; without it
 *  the doctor reaches for his pad, and after three reaches he stops opening the app. */
const cycle = (n: number) => (n === 0 ? 1 : n === 1 ? 2 : n === 2 ? 0.5 : 0)
const isEmpty = (l: RxLine) => !l.dose.m && !l.dose.d && !l.dose.n

export default function Compose({ visitId, onDone, onBack }: {
  visitId: string; onDone: () => void; onBack: () => void
}) {
  const [visit, setVisit] = useState<Visit | null>(null)
  const [pt, setPt] = useState<Patient | null>(null)
  /**
   * THE STARTING GRID MUST BE THE ONE THIS DOCTOR WILL ACTUALLY GET.
   *
   * This was seeded with our sample formulary for every clinic, and then
   * replaced a moment later by `doctorDrugs()`, which for a doctor who has been
   * through setup returns HIS list and ours not at all. So for the first frames
   * of every visit a set-up clinic was shown medicines that are not on its
   * list, and a tap inside that window added a line whose drug then vanished.
   * At print time freeze() found nothing to copy and wrote a snapshot of empty
   * strings, and the slip came out with a numbered row, a dose, a day count and
   * NO MEDICINE NAME.
   *
   * The initial value now matches what the load will return, so the grid never
   * offers something it is about to take away. The guard below catches the case
   * anyway, because a blank medicine on a prescription must be impossible by
   * two routes, not one.
   */
  const [all, setAll] = useState<Drug[]>(() => (profile().ready ? [] : formulary))
  const [use, setUse] = useState<Record<string, number>>({})
  const [prev, setPrev] = useState<Visit | null>(null)
  const [inc, setInc] = useState<Incoming | null>(null)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<number | null>(null)
  const [nearMiss, setNearMiss] = useState<{ text: string; near: Drug[] } | null>(null)
  const [repeatMsg, setRepeatMsg] = useState('')
  const [err, setErr] = useState('')
  const [sets, setSets] = useState<RxSet[]>([])
  const [naming, setNaming] = useState('')
  /**
   * THE PRESCRIPTION SCREEN TEACHES ITSELF, ONCE.
   *
   * Five of the doctor's tour steps describe THIS screen, and they used to run
   * over the queue where none of their controls exist. The ring vanished for
   * the middle of the tour and it read as broken, which is exactly how Safeer
   * described it. They run here now, the first time he opens a patient, with
   * every step ringing something in front of him.
   */
  const [tour, setTour] = useState(false)

  // The single source of truth between renders. Two quick taps used to read the
  // same stale copy and the second overwrote the first — which is what put the
  // prescription out of order. Every mutation now goes through this ref.
  const cur = useRef<Visit | null>(null)
  const rows = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    (async () => {
      const v = await db.visits.get(visitId); if (!v) return
      cur.current = v; setVisit(v)
      const p = (await db.patients.get(v.patientId)) ?? null
      setPt(p)
      // drugs and usage arrive TOGETHER, in one commit, so the frozen grid
      // below freezes an order that already has the counts in it. Awaiting
      // them one after the other froze an alphabetical grid every visit.
      const [ds, uc, ss] = await Promise.all([doctorDrugs(formulary), usageCounts(), listSets()])
      setAll(ds); setUse(uc); setSets(ss)
      if (p) setPrev((await lastVisit(p.id, v.id)) ?? null)
      setInc(await incoming(v))
      // after the screen has something on it to point at, never before
      if (!tourSeen(role(), 'compose') && tourFor(role(), 'compose').length > 0) {
        setTimeout(() => setTour(true), 500)
      }
    })()
  }, [visitId])

  const drugs = useMemo(() => Object.fromEntries(all.map(d => [d.id, d])), [all])

  /** His list, or the starting list for his field until he has edited one. */
  const myDx = useMemo(() => {
    const p = profile()
    return p.dx.length ? p.dx : seedDiagnoses(p.specialty)
  }, [])

  /**
   * Chip positions are FIXED once the visit opens and never re-sorted while he
   * works. If the grid moved under his finger he would add the wrong medicine
   * and never see it.
   *
   * But "fixed" was implemented with a dependency array that was the literal
   * string 'once' either way, so the memo settled on the very first render —
   * the one where the usage counts had not arrived yet and `use` was still {}.
   * The grid was therefore alphabetical for every patient, all evening, and
   * nothing on screen said so. `all` and `use` are now loaded together and the
   * freeze is done honestly, with a ref.
   */
  const frozen = useRef<Drug[] | null>(null)
  const ordered = useMemo(() => {
    // Once frozen, the order NEVER re-sorts this visit. A medicine the doctor
    // types mid-consultation is APPENDED to the end, where his eye already is,
    // instead of the whole grid reshuffling by usage under his finger.
    if (frozen.current) {
      if (all.length > frozen.current.length) {
        const have = new Set(frozen.current.map(d => d.id))
        frozen.current = [...frozen.current, ...all.filter(d => !have.has(d.id))]
      }
      return frozen.current
    }
    if (!all.length) return all
    const list = [...all].sort((a, b) =>
      (use[b.id] ?? 0) - (use[a.id] ?? 0) || a.brand.localeCompare(b.brand))
    frozen.current = list
    return list
  }, [all, use])
  const grid = useMemo(() => {
    const s = q.trim().toLowerCase()
    return ordered.filter(d => !s || d.brand.toLowerCase().includes(s) || d.generic.toLowerCase().includes(s))
  }, [ordered, q])

  // Work out the sheet layout while the doctor is still choosing, not when he
  // taps PRINT. On a twelve-medicine slip the fitting pass is close to a second,
  // and that second must not sit between the tap and the paper.
  // NOTE: every hook must stay ABOVE the early return below. Putting this one
  // under it made React render a different number of hooks once a visit loaded,
  // which blanked the whole screen.
  useEffect(() => {
    if (!visit || !pt || !visit.lines.length) return
    const t = setTimeout(() => {
      try { warmPlan(slipData()) } catch { /* the print path recomputes */ }
    }, 350)
    return () => clearTimeout(t)
  }, [visit, pt, drugs])

  if (!visit || !pt) return <div className="pane">…</div>
  const locked = !!visit.printedAt

  /** Re-read from the database — used after a write that did not go through apply(). */
  async function reload() {
    const v = await db.visits.get(visitId)
    if (v) { cur.current = v; setVisit(v) }
  }

  /**
   * THE ROOM AND THE COUNTER WRITE TO THE SAME ROW.
   *
   * This used to `put()` the whole visit, rebuilt from a copy taken when the
   * screen opened. Every counter-side action is a partial update on that same
   * row: a blood pressure typed at the door, a fee corrected, a refund marked
   * handed back, a patient closed. So one dose tap in the room silently undid
   * whatever the desk had done since — and the worst case is not theoretical:
   * the compounder marks a refund paid, the doctor taps a dose, `refundedAt`
   * disappears, the refund reappears at the counter, and the patient is paid
   * twice.
   *
   * Compose now writes ONLY the fields it owns, as a patch, inside a
   * transaction. Everything else on the row is left exactly as it was found.
   *
   * VITALS AND STATUS ARE DELIBERATELY NOT IN THIS LIST. Both are written by
   * the desk and by phones on the building's wire while this screen is open —
   * a blood pressure taken at the door, a patient closed as left. Blanket
   * re-writing them from this screen's copy silently erased whatever arrived
   * after the visit opened: a dose tap deleted a BP, and a closed visit came
   * back to life. Vitals now merge against the LIVE row (see saveVitals), and
   * status changes only in the explicit print path.
   */
  const MINE = ['lines', 'diagnosis', 'tests', 'advice', 'nextVisit'] as const

  async function apply(fn: (v: Visit) => Visit) {
    const next = fn(cur.current!)
    cur.current = next
    setVisit(next)
    await db.transaction('rw', db.visits, async () => {
      const live = await db.visits.get(next.id)
      if (!live) return
      const patch: Partial<Visit> = {}
      for (const k of MINE) (patch as Record<string, unknown>)[k] = (next as unknown as Record<string, unknown>)[k]
      await db.visits.update(next.id, patch)
      // keep our copy honest about the fields the counter owns
      cur.current = { ...live, ...patch }
      setVisit(cur.current)
    })
  }

  /**
   * Vitals merge against the LIVE row, never replace it. The value this screen
   * holds may be minutes old, and the compounder may have written a BP from
   * the door or a phone since. What the doctor typed here wins for the fields
   * he touched; everything else on the live row survives. An emptied field is
   * an intentional deletion and is honoured.
   */
  async function saveVitals(nv: Record<string, string>) {
    await db.transaction('rw', db.visits, async () => {
      const live = await db.visits.get(visitId)
      if (!live) return
      const merged: Record<string, string> = { ...(live.vitals ?? {}) }
      const before = cur.current?.vitals ?? {}
      for (const k of new Set([...Object.keys(nv), ...Object.keys(before)])) {
        const v = (nv[k] ?? '').trim()
        if (v) merged[k] = v
        else if (before[k] !== undefined && !nv[k]) delete merged[k]
      }
      await db.visits.update(visitId, { vitals: merged })
      cur.current = { ...live, vitals: merged }
      setVisit(cur.current)
    })
  }

  const setLine = (i: number, patch: Partial<RxLine>) =>
    apply(v => ({ ...v, lines: v.lines.map((l, k) => (k === i ? { ...l, ...patch } : l)) }))

  function bump(i: number) {
    setFlash(i)
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    rows.current[i]?.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' })
    setTimeout(() => setFlash(null), 1800)
  }

  /** Already on the list? Show him the row he already has instead of adding a
   *  second one. No dialog — the flashing row says more than a warning would. */
  function addDrug(id: string, force = false) {
    const at = cur.current!.lines.findIndex(l => l.drugId === id)
    if (at >= 0 && !force) { bump(at); return }
    const d = drugs[id]
    apply(v => ({ ...v, lines: [...v.lines, { drugId: id, dose: { m: 1, d: 0, n: 1 },
      meal: 'after', days: d?.defaultDays ?? 5 }] }))
    setQ('')
  }

  async function addTyped(force = false) {
    const text = q.trim(); if (!text) return
    const norm = text.toLowerCase().replace(/\s+/g, ' ')
    // a typo must not become a permanent chip — check what he already has first
    const hit = all.find(d => `${d.brand} ${d.strength}`.toLowerCase().replace(/\s+/g, ' ') === norm
                           || d.brand.toLowerCase() === norm)
    if (hit) { addDrug(hit.id); return }
    const { name, rest } = splitBrand(text)

    // One medicine under four spellings starts here, so ask once — never block.
    // Confirming shows him exactly what will be printed on the paper.
    const near = similarDrugs(name.toUpperCase(), rest, all)
    if (near.length && !force) {
      setNearMiss({ text, near })
      return
    }
    const d: Drug = {
      id: 'own_' + uid(), brand: name.toUpperCase(), strength: rest, generic: '',
      sd: toSindhi(name), sdReviewed: false, pending: true, form: 'tab', unitSd: 'گوري',
      addedAt: Date.now(),
    }
    await db.drugs.add(d)
    setNearMiss(null)
    setAll(await doctorDrugs(formulary))
    setQ('')
    apply(v => ({ ...v, lines: [...v.lines, { drugId: d.id, dose: { m: 1, d: 0, n: 1 }, meal: 'after', days: 5 }] }))
  }

  /**
   * Copy the last prescription onto this visit, doses and days included.
   *
   * It appends rather than replaces, and skips anything already on the sheet,
   * because the doctor has usually already tapped one or two things before he
   * thinks of this. Medicines the doctor has since retired are dropped, and he
   * is told how many, rather than silently printing something withdrawn.
   */
  async function repeatLast() {
    if (!prev || locked) return
    const have = new Set(cur.current!.lines.map(l => l.drugId))
    const live = prev.lines.filter(l => drugs[l.drugId] && !have.has(l.drugId))
    const gone = prev.lines.length - live.length - prev.lines.filter(l => have.has(l.drugId)).length
    if (!live.length) { setRepeatMsg('Everything from last time is already here.'); return }
    // snap AND given are stripped: this is a fresh prescription, not a copy of
    // what the pharmacy handed over last month
    await apply(v => ({ ...v, lines: [...v.lines, ...live.map(l => ({ ...l, snap: undefined, given: undefined }))] }))
    setRepeatMsg(gone > 0
      ? `${live.length} brought back. ${gone} no longer on your list, so left out.`
      : `${live.length} brought back from last time. Check every dose before printing.`)
  }

  /** His own set, applied the same way a combination is: append, never remove. */
  function applySet(st: RxSet) {
    apply(v => {
      const have = new Set(v.lines.map(l => l.drugId))
      const add = st.lines.filter(l => drugs[l.drugId] && !have.has(l.drugId))
      return { ...v, lines: [...v.lines, ...add] }
    })
  }

  async function keepAsSet() {
    if (!naming.trim() || !cur.current!.lines.length) return
    await saveSet(naming, cur.current!.lines)
    setNaming('')
    setSets(await listSets())
  }

  /**
   * Take an entry out of the dictionary and make it his.
   *
   * A COPY, not a reference. From here it behaves like every other medicine on
   * his list, and a later dictionary update can never quietly rewrite something
   * he has already reviewed and prescribed.
   */
  async function takeFromDictionary(e: DictEntry) {
    const key = `${e.brand} ${e.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    const already = all.find(d => `${d.brand} ${d.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '') === key)
    if (already) { setQ(''); addDrug(already.id); return }
    const d: Drug = {
      id: 'own_' + uid(), brand: e.brand, strength: e.strength, generic: e.generic,
      // NOT !!e.sd. A dictionary entry is a candidate, not a verdict: the person
      // in this clinic still has to read the word before it can print.
      sd: e.sd, sdReviewed: false, form: e.form, addedAt: Date.now(),
      unitSd: doseSdFor(e.form), route: defaultRoute(e.form),
    }
    await db.drugs.add(d)
    setAll(await doctorDrugs(formulary))
    setQ(''); setNearMiss(null)
    apply(v => ({ ...v, lines: [...v.lines, { drugId: d.id, dose: { m: 1, d: 0, n: 1 }, meal: 'after', days: 5 }] }))
  }

  const badIdx = visit.lines.findIndex(isEmpty)

  /**
   * A LINE WHOSE MEDICINE CANNOT BE NAMED MUST NOT REACH PAPER.
   *
   * Either it carries a printed snapshot with a name in it, or its drug is on
   * the list right now. Anything else prints a row with a dose and no medicine,
   * which is worse than not printing at all: the patient takes it to a chemist
   * who cannot serve it, and nobody in the clinic sees what went out.
   */
  const namelessIdx = visit.lines.findIndex(l => !(l.snap?.brand || drugs[l.drugId]?.brand))

  /** Build exactly what printSlip will be given, so the warm-up and the real
   *  print agree on the layout key. */
  function slipData() {
    // In a building with several rooms the heading names the visit's own
    // doctor. Solo visits carry no doctorId and the profile prints, as always.
    const room = doctorById(cur.current!.doctorId)
    return {
      visit: cur.current!, patientName: pt!.name, patientAge: pt!.age, patientSex: pt!.sex,
      patientCode: patientCode(pt!.num), drugs, rxId: cur.current!.id.slice(-6),
      doctor: room ? {
        nameEn: room.nameEn, nameSd: room.nameSd,
        degreesEn: room.degreesEn, degreesSd: room.degreesSd, reg: room.reg,
      } : undefined,
      // Resolved here rather than in the print module, which is handed data and
      // never looks anything up. See SlipData.sentTo.
      sentTo: cur.current!.sentOn
        ? { en: destinationEn(cur.current!.sentOn), sd: destinationSd(cur.current!.sentOn) }
        : undefined,
    }
  }

  /**
   * Freeze what is about to be printed onto the prescription itself.
   *
   * From this moment the slip no longer depends on the medicine list. Correct a
   * spelling, merge a duplicate or retire a medicine later and the paper in the
   * patient's hand still says exactly what it said — which is the only honest
   * answer to "what did you prescribe this patient in March".
   */
  async function freeze() {
    await apply(v => ({
      ...v,
      lines: v.lines.map(l => {
        const g = drugs[l.drugId]
        return l.snap ? l : {
          ...l,
          snap: {
            brand: g?.brand ?? '', strength: g?.strength ?? '', generic: g?.generic ?? '',
            sd: g?.sd ?? '', sdReviewed: g?.sdReviewed === true, unitSd: g?.unitSd ?? '',
            form: g?.form ?? 'tab',
          },
        }
      }),
    }))
  }

  /**
   * THE BUTTON MUST ALWAYS COME BACK.
   *
   * There was no try/finally here. Anything thrown inside — a font that never
   * loaded, a drug row the fitter could not measure, a printer the driver had
   * given up on — left `busy` true for ever. The PRINT button then reads
   * "Printing…", stays disabled, and that patient cannot be printed again
   * without reloading the page, in the middle of a queue of a hundred.
   *
   * A failure has to end with the doctor able to press the button again, and
   * told plainly that nothing came out.
   */
  async function print() {
    if (busy) return                                   // double-tap on a slow printer
    if (badIdx >= 0) { bump(badIdx); return }
    if (namelessIdx >= 0) { bump(namelessIdx); return }
    setBusy(true)
    try {
      await freeze()
      await printSlip(slipData())
      // status and printedAt are written HERE and only here, as their own
      // targeted patch: they are not in MINE, so no other tap on this screen
      // can drag a stale copy of them over what the desk did meanwhile
      const stamp = { printedAt: Date.now(), status: 'done' as const }
      await db.visits.update(visitId, stamp)
      cur.current = { ...cur.current!, ...stamp }
      setVisit(cur.current)
      signal({ kind: 'printed', token: cur.current?.token ?? 0 })
      setErr('')
    } catch (e) {
      console.error('[nuskho] print failed', e)
      setErr('Check the printer is on, has paper, and is not showing an error, then press PRINT again.')
    } finally {
      setBusy(false)
    }
  }

  async function reprint() {
    if (busy) return
    setBusy(true)
    try {
      await printSlip(slipData())
      setErr('')
    } catch (e) {
      console.error('[nuskho] reprint failed', e)
      setErr('Check the printer is on and has paper, then press it again.')
    } finally {
      setBusy(false)
    }
  }

  /** Amending makes a NEW prescription. The paper already in the patient's hand
   *  must never quietly stop matching what the record says. */
  async function amend() {
    const id = uid()
    const v = cur.current!
    // The fee and the token belong to the ORIGINAL visit. Copying them made the
    // clinic show two rows with the same number, and made the evening's cash
    // total count the same rupees twice, every time a slip was corrected.
    const { fee: _fee, token: _tok, closedAt: _c, closeNote: _n, dispensedAt: _d, ...rest } = v
    await db.visits.add({
      // the room's own numbering: an amended slip in Room 2 is a Room 2 token.
      // dispensedAt and per-line given are stripped: the pharmacy has not
      // touched THIS slip, whatever it handed over against the old one —
      // otherwise the corrected medicines show as already given and the
      // patient walks past the counter empty-handed.
      ...rest, id, token: await nextToken(v.doctorId), printedAt: undefined,
      lines: rest.lines.map(l => ({ ...l, given: undefined })),
      status: 'waiting', createdAt: Date.now(), amendsId: v.id,
    })
    onDone()
    location.hash = ''
    setTimeout(() => window.dispatchEvent(new CustomEvent('nuskho:open', { detail: id })), 0)
  }

  return (
    <div className="pane">
      <button className="btn ghost" onClick={onBack} style={{ marginBottom: 12 }}>← Queue</button>
      <div className="who">{pt.name}<span>Token {visit.token} · No. {patientCode(pt.num)}{pt.age ? ` · ${pt.age}` : ''}
        {multiRoom() && doctorById(visit.doctorId) &&
          <> · Room {doctorById(visit.doctorId)!.room} · {doctorById(visit.doctorId)!.nameEn}</>}
      </span></div>

      {/* THE OTHER DOCTOR'S RECORD, AND IT STAYS HIS.
          Everything in this card is read from the sending consultation live and
          rendered as text. There is no control in it, nothing here writes, and
          the prescription this doctor is about to build below is empty and his
          own. See refer.ts for why it is a card and not an inbox. */}
      {inc && (
        <div className="fromdoc">
          <div className="fd-h">
            <b>Sent to you by {inc.doctorEn}{inc.room ? ` · Room ${inc.room}` : ''}</b>
            <span>{new Date(inc.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="fd-why">{inc.note}</p>
          <div className="fd-body">
            {inc.from.diagnosis && <div><b>He found</b> {inc.from.diagnosis}</div>}
            {filled(inc.from.vitals).length > 0 && (
              <div><b>He recorded</b> {filled(inc.from.vitals)
                .map(([d, val]) => `${d.short} ${val}${d.unit ? ' ' + d.unit : ''}`).join(' · ')}</div>
            )}
            <div><b>He prescribed</b> {inc.from.lines.length
              ? inc.from.lines.map(l => `${l.snap?.brand ?? drugs[l.drugId]?.brand ?? '?'} ${l.snap?.strength ?? ''}`.trim()).join(', ')
              : 'nothing — he sent him straight on'}</div>
          </div>
          <small>You are reading {inc.doctorEn}'s consultation, not writing in it. Your prescription
            below is your own and prints under your name.</small>
        </div>
      )}

      {/* The returning patient is a large share of an OPD evening, and re-entering
          the same prescription by hand is where transcription errors breed. This
          brings the last one back to be edited, never to be printed unread: the
          doses and days come with it and every one is still tappable. */}
      {prev && (
        <div className="prev">
          {/* WHOSE last visit. In a building with several rooms this strip has
              always shown the patient's previous prescription whatever room
              wrote it, which is right — a doctor treating a man tonight must
              know what he was given last month, and hiding it is how two
              courses of the same antibiotic get prescribed. But it said
              nothing about who wrote it, so a doctor read a colleague's line
              as his own. It names him now. */}
          {multiRoom() && doctorById(visitDoctorId(prev.doctorId))?.id !== visitDoctorId(visit.doctorId)
            ? `${doctorById(visitDoctorId(prev.doctorId))?.nameEn ?? 'Another room'}, ` : ''}
          Last visit {Math.round((Date.now() - prev.createdAt) / 86400000)} days ago
          {prev.diagnosis ? `, ${prev.diagnosis}` : ''}. {prev.lines.map(l => (l.snap?.brand ?? drugs[l.drugId]?.brand ?? '?')).join(', ')}
          {!locked && prev.lines.length > 0 && (
            <button className="lnk" onClick={repeatLast}>bring it back to edit</button>
          )}
        </div>
      )}

      {locked && (
        <div className="lockbar">
          Printed at {new Date(visit.printedAt!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.
          The patient has this paper, so it cannot be edited.
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn ghost" onClick={reprint} disabled={busy}>Reprint same slip</button>
            <button className="btn" onClick={amend}>Amend on a new slip</button>
          </div>
        </div>
      )}
      {repeatMsg && <div className="note">{repeatMsg}</div>}

      {/* The money was already taken at the door. All the doctor does here is
          decide that this one pays less, or nothing, and send him back to the
          counter for it. */}
      <FeeBar visit={visit} onChange={reload} />

      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, opacity: locked ? .55 : 1 }}>
        {/* Vitals the compounder already took, and anything the doctor runs on a
            strip machine while the patient is sitting there. Both print. */}
        <Vitals which="vital" value={visit.vitals ?? {}}
                onChange={saveVitals}
                title="Checked before you saw them" />
        <Vitals which="test" value={visit.vitals ?? {}}
                onChange={saveVitals} />

        {/* THE DESK. On a wide screen the prescription grows on the left while
            the picking surface stays put on the right, so adding the fourth
            medicine does not mean scrolling past the first three. On a phone
            the two stack and the flow is what it always was. */}
        <div className="composegrid">
        <div className="cg-left">
        <h2><IcBook size={17} /> Diagnosis</h2>
        <div className="chips">
          {myDx.map(d => (
            <button key={d} className={`chip ${visit.diagnosis === d ? 'on' : ''}`}
                    onClick={() => apply(v => ({ ...v, diagnosis: v.diagnosis === d ? undefined : d }))}>{d}</button>
          ))}
        </div>

        <h2><IcPill size={17} /> Medicines, printed in this order</h2>
        {visit.lines.map((l, i) => {
          const d = drugs[l.drugId]; if (!d) return null
          const empty = isEmpty(l)
          return (
            <div className={`line ${flash === i ? 'flash' : ''} ${empty ? 'bad' : ''}`} key={i}
                 ref={el => { rows.current[i] = el }}>
              <div className="hd">
                <div><b>{i + 1}. {d.brand} {d.strength}</b>
                  <small>{d.generic || (d.pending ? 'typed in, tidy this up tonight' : '')}</small></div>
                <button className="x" onClick={() => apply(v => ({ ...v, lines: v.lines.filter((_, k) => k !== i) }))}>×</button>
              </div>
              <div className="dosegrid">
                {(['m', 'd', 'n'] as const).map(k => (
                  <button key={k} className={`dbtn ${l.dose[k] ? 'on' : ''}`}
                          onClick={() => setLine(i, { dose: { ...l.dose, [k]: cycle(l.dose[k]) } })}>
                    {l.dose[k] === 0.5 ? '½' : l.dose[k] || '—'}
                    <small>{k === 'm' ? 'MORNING' : k === 'd' ? 'MIDDAY' : 'NIGHT'}</small>
                  </button>
                ))}
                <button className="dbtn on" style={{ minWidth: 96 }}
                        onClick={() => setLine(i, { meal: l.meal === 'after' ? 'before' : l.meal === 'before' ? 'any' : 'after' })}>
                  {l.meal === 'after' ? 'after' : l.meal === 'before' ? 'before' : '—'}<small>FOOD</small>
                </button>
                <div className="stp">
                  <button onClick={() => setLine(i, { days: Math.max(1, l.days - 1) })}>−</button>
                  <div className="v">{l.days} d</div>
                  <button onClick={() => setLine(i, { days: Math.min(30, l.days + 1) })}>+</button>
                </div>
              </div>
              {empty && <div className="badmsg">No dose set. This would print with no instruction.</div>}
              {flash === i && <div className="badmsg ok">Already on this prescription.
                <button className="lnk" onClick={() => addDrug(l.drugId, true)}>Add a second line anyway</button></div>}
            </div>
          )
        })}

        </div>

        <div className="cg-right">
        {/* Only his own. Nothing we wrote fills a prescription — see formulary.ts. */}
        {sets.length > 0 && (<>
          <h2>Your own sets, one tap</h2>
          <div className="chips">
            {sets.map(st => (
              <button key={st.id} className="chip mine" onClick={() => applySet(st)}
                      title="A set you saved yourself">{st.name}</button>
            ))}
          </div>
        </>)}

        <div className="fld">
          <input value={q} onChange={e => { setQ(e.target.value); setNearMiss(null) }}
                 placeholder="Type two letters to find a medicine…"
                 onKeyDown={e => { if (e.key === 'Enter' && grid.length === 0) addTyped() }} />
        </div>

        {/* Asked once, never enforced. One tap on an existing medicine is the
            only thing that stops the same drug living under four spellings. */}
        {nearMiss && (
          <div className="nearmiss">
            <b>You already have something like “{nearMiss.text}”.</b>
            <div className="chips">
              {nearMiss.near.map(d => (
                <button key={d.id} className="chip on"
                        onClick={() => { setNearMiss(null); setQ(''); addDrug(d.id) }}>
                  Use {d.brand}{d.strength ? ' ' + d.strength : ''}
                </button>
              ))}
            </div>
            <button className="lnk" onClick={() => addTyped(true)}>
              No, add “{nearMiss.text}” as a new medicine
            </button>
          </div>
        )}
        <div className="chips">
          {grid.slice(0, 24).map(d => {
            const on = visit.lines.some(l => l.drugId === d.id)
            return <button key={d.id} className={`chip ${on ? 'have' : ''}`} onClick={() => addDrug(d.id)}>
              {on ? '✓' : '+'} {d.brand}{d.strength ? ' ' + d.strength : ''}</button>
          })}
        </div>

        {/* Type-to-find, and the only place the dictionary appears. Every row
            shows brand, strength, form and generic, because that is what
            actually separates two medicines whose names look alike. A picture
            would raise his confidence without raising his accuracy. */}
        {q.trim().length >= 2 && (() => {
          const have = new Set(all.map(d => `${d.brand} ${d.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')))
          const found = searchDictionary(q).filter(
            e => !have.has(`${e.brand} ${e.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')))
          return (
            <div className="dict">
              {found.length > 0 && <div className="dhead">Not on your list yet</div>}
              {found.map(e => (
                <button className="drow2" key={e.brand + e.strength} onClick={() => takeFromDictionary(e)}>
                  <span className="dl">{dictLine(e)}</span>
                  {e.sd && <span className="sd">{e.sd}</span>}
                  <span className="add">add</span>
                </button>
              ))}
              <button className="drow2 own" onClick={() => addTyped()}>
                <span className="dl">Add “{q.trim()}” in your own words</span>
                <span className="add">add</span>
              </button>
            </div>
          )
        })()}

        {/* Saved only because he typed a name for it. Nothing here is inferred
            from a pattern, and no set is ever offered because of a diagnosis or
            a patient: the moment the app proposes a medicine he did not choose,
            it stops being a typewriter. */}
        {visit.lines.length > 1 && (
          <div className="saveset">
            <input value={naming} placeholder="save these as a set, e.g. my chest infection"
                   onChange={e => setNaming(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter') keepAsSet() }} />
            <button className="btn ghost" disabled={!naming.trim()} onClick={keepAsSet}>Save the set</button>
          </div>
        )}
        {sets.length > 0 && (
          <p className="hint">
            Your sets: {sets.map(st => (
              <span key={st.id} className="setrow">{st.name}
                <button className="lnk" onClick={async () => { await deleteSet(st.id); setSets(await listSets()) }}>remove</button>
              </span>
            ))}
          </p>
        )}

        </div>
        </div>

        <h2>Lab tests</h2>
        <div className="chips">
          {labTests.map(t => {
            const key = `${t.en}|${t.sd}`; const on = visit.tests.includes(key)
            return <button key={t.en} className={`chip ${on ? 'on' : ''}`}
                     onClick={() => apply(v => ({ ...v, tests: on ? v.tests.filter(x => x !== key) : [...v.tests, key] }))}>
              {t.en}</button>
          })}
        </div>

        <h2>Advice</h2>
        <div className="chips">
          {adviceList.map(a => {
            const key = `${a.sd}|${a.en}|${a.icon}`; const on = visit.advice.includes(key)
            return <button key={a.en} className={`chip ${on ? 'on' : ''}`}
                     onClick={() => apply(v => ({ ...v, advice: on ? v.advice.filter(x => x !== key) : [...v.advice, key] }))}>
              {a.en}</button>
          })}
        </div>
      </fieldset>

      {/* OUTSIDE the fieldset, so it works after the slip has printed too.
          A doctor prints the prescription and then says "and go and see Dr
          Soomro" constantly. Locking that behind Amend would mean the app can
          only record referrals decided in the right order. */}
      <SendOnBar visit={visit} locked={locked} onChange={reload} />

      {!locked && (<>
        <Bell />

        <div className="sticky">
          {err && <Note tone="stop" title="Nothing was printed">{err}</Note>}
          <button className={`btn wide ${badIdx >= 0 || namelessIdx >= 0 ? 'warn' : ''}`} onClick={print}
                  disabled={busy || visit.lines.length === 0}>
            {busy ? 'Printing…'
              : namelessIdx >= 0 ? `Line ${namelessIdx + 1} has no medicine name. Remove it and add it again`
              : badIdx >= 0 ? `${drugs[visit.lines[badIdx].drugId]?.brand} has no dose. Tap to fix`
              : `PRINT for ${pt.name}  (${visit.lines.length})`}
          </button>
        </div>
      </>)}
      <p className="hint">The paper pad stays on the desk. If anything fails, the doctor handwrites that one patient and we continue.</p>

      {tour && <Tour role={role()} screen="compose" onClose={() => setTour(false)} />}
    </div>
  )
}

/* -------------------------------------------------------------- sent on */

/**
 * SENDING A PATIENT ON.
 *
 * One control for both of the things a doctor means by it: down the corridor to
 * another room in this building, or out of it to a hospital or a specialist in
 * another city. They feel like one act to him, so they are one control.
 *
 * IT IS CLOSED UNTIL HE OPENS IT. Most consultations do not end in a referral,
 * and a permanently expanded block of destination pickers below the medicines
 * would be one more thing to scroll past two hundred times an evening.
 *
 * THE REASON IS REQUIRED. Not out of tidiness: it is the entire content of the
 * referral. "Room 4" tells the next doctor nothing he cannot see from the
 * patient's face. Every referral protocol worth the name is a sentence about
 * why, and a referral with no why is why specialists complain about referrals.
 */
function SendOnBar({ visit, locked, onChange }: {
  visit: Visit; locked: boolean; onChange: () => Promise<void>
}) {
  const rooms = sendTargets()
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(rooms[0]?.id ?? '')
  const [place, setPlace] = useState('')
  const [note, setNote] = useState('')
  const [charge, setCharge] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const s = visit.sentOn
  const target = rooms.find(d => d.id === to)

  async function go() {
    if (busy) return
    setBusy(true)
    const r = await sendOn(visit.id, {
      toDoctorId: to || undefined, toPlace: to ? undefined : place, note, charge,
    })
    setBusy(false)
    if (!r.ok) { setErr(r.why); return }
    setErr(''); setOpen(false); setNote(''); setPlace('')
    await onChange()
  }

  if (s) {
    const where = destinationEn(s)
    return (
      <div className="senton done">
        <div>
          <b>Sent on to {where}</b>
          <span>{s.note}</span>
          {/* Said plainly, because it is the difference between the other
              doctor reading this and not reading it. */}
          <small>{s.toVisitId
            ? locked
              ? 'That room has the token. It is NOT on the paper he is holding — press Reprint above if he should carry it too.'
              : 'That room has the token, and it prints on his slip.'
            : locked
              ? 'Recorded. It is NOT on the paper he is holding — press Reprint above if he should carry it.'
              : 'It prints on his slip.'}</small>
        </div>
        <button className="lnk" onClick={async () => {
          const r = await unsend(visit.id)
          if (!r.ok) { setErr(r.why); return }
          setErr(''); await onChange()
        }}>undo</button>
        {err && <p className="hint" style={{ color: '#8a5b00', width: '100%' }}>{err}</p>}
      </div>
    )
  }

  if (!open) {
    return (
      <div className="senton">
        <button className="lnk" onClick={() => setOpen(true)}>
          Send this patient on to another doctor
        </button>
      </div>
    )
  }

  return (
    <div className="senton open">
      <h2 style={{ marginTop: 0 }}>Send this patient on</h2>
      <div className="chips">
        {rooms.map(d => (
          <button key={d.id} className={'chip' + (to === d.id ? ' on' : '')}
                  onClick={() => setTo(d.id)}>Room {d.room} · {d.nameEn}</button>
        ))}
        <button className={'chip' + (to === '' ? ' on' : '')} onClick={() => setTo('')}>
          Somewhere else
        </button>
      </div>

      {to === '' && (
        <div className="fld"><label>Where</label>
          <input value={place} maxLength={80} placeholder="CMC Hospital, Larkana"
                 onChange={e => setPlace(e.target.value)} /></div>
      )}

      <div className="fld"><label>Why — the other doctor sees this, and it prints</label>
        <input value={note} maxLength={240} autoFocus
               placeholder="chest pain, ECG changes, please see today"
               onChange={e => { setNote(e.target.value); setErr('') }}
               onKeyDown={e => { if (e.key === 'Enter') go() }} /></div>

      {target && (
        <div className="chips">
          <button className={'chip' + (charge ? ' on' : '')} onClick={() => setCharge(true)}
                  disabled={target.fee <= 0}>
            He pays Room {target.room}'s fee, Rs {target.fee}
          </button>
          <button className={'chip' + (!charge ? ' on' : '')} onClick={() => setCharge(false)}>
            No second fee
          </button>
        </div>
      )}

      {err && <p className="hint" style={{ color: '#8a5b00' }}>{err}</p>}
      <div className="row">
        <button className="btn" onClick={go} disabled={busy || !note.trim()}>
          {target ? `Send to Room ${target.room}` : 'Record it'}
        </button>
        <button className="btn ghost" onClick={() => { setOpen(false); setErr('') }}>Cancel</button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- fee */

/**
 * The counter already took the money before this patient sat down. The only
 * decision left in the room is whether some of it goes back, which happens
 * often here, and is the one thing a doctor does not want to have to argue
 * about at the desk afterwards.
 */
function FeeBar({ visit, onChange }: { visit: Visit; onChange: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [amt, setAmt] = useState('')
  const [note, setNote] = useState('')
  const f = visit.fee

  if (!f) {
    return <div className="feebar plain">No fee was recorded at the counter for this token.</div>
  }

  async function give(newAmount: number) {
    await grantDiscount(visit.id, newAmount, note)
    // The patient is about to walk the few steps back to the desk. Tell the
    // desk now rather than letting the compounder discover it when he looks.
    const back = (visit.fee?.amount ?? 0) - newAmount
    if (back > 0) {
      const pt = await db.patients.get(visit.patientId)
      signal({ kind: 'refund', token: visit.token, name: pt?.name ?? '', amount: back })
    }
    setOpen(false); setNote(''); setAmt('')
    await onChange()
  }

  if (f.refund) {
    return (
      <div className={'feebar ' + (f.refundedAt ? 'done' : 'back')}>
        <b>{f.refundedAt
          ? `Rs ${f.refund} was given back at the counter`
          : `Send him to the counter for Rs ${f.refund}`}</b>
        {!f.refundedAt && <button className="lnk" onClick={() => give(f.amount)}>cancel that</button>}
      </div>
    )
  }

  return (
    <div className="feebar">
      <label>Rs {f.amount} taken at the counter{f.state === 'due' ? ', not actually paid yet' : ''}</label>
      {!open ? (
        <div className="row">
          <button className="btn ghost" onClick={() => setOpen(true)} disabled={!f.amount}>
            Charge him less
          </button>
          <button className="btn ghost" onClick={() => give(0)} disabled={!f.amount}>
            Free, give it all back
          </button>
        </div>
      ) : (
        <>
          <div className="row">
            <div className="fld"><input value={amt} inputMode="numeric" placeholder="he should pay"
                   onChange={e => setAmt(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} /></div>
            <button className="btn" disabled={amt === '' || +amt > f.amount}
                    onClick={() => give(+amt)}>Give back Rs {Math.max(0, f.amount - (+amt || 0))}</button>
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <div className="fld"><input value={note} placeholder="reason, for your own records only"
                 onChange={e => setNote(e.target.value)} /></div>
        </>
      )}
    </div>
  )
}
