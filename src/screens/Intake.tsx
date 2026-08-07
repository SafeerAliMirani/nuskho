import { useEffect, useState } from 'react'
import { readQrPayload } from '../print/qr'
import { ArtEmpty, IcScan, IcUser, IcMoney, IcQueue } from '../ui/art'
import { Note, Tip } from '../ui/Note'
import { signal } from '../ui/bus'
import Vitals from '../ui/Vitals'
import { IcWarn } from '../ui/art'
import { printToken } from '../print/print'
import { paper } from '../paper'
import { can, role, currentDoctorId } from '../roles'
import {
  activeDoctors, sittingDoctors, isSitting, setSitting, doctorById, multiRoom, visitDoctorId,
} from '../doctors'
import {
  db, uid, nextToken, nextPatientNum, findByCode, patientCode, parseCode, closeVisit,
  daySummary, markRefunded, owedRefund, setFee, markTestsPaid,
} from '../db'
import { chargesFor, chargeTotal } from '../testfees'
import { INSTANT } from '../data/vitals'
import type { Visit, VisitStatus, FeeState } from '../types'
import { isDemo } from '../version'
import { daysSinceExport } from '../safety'
import { profile } from '../profile'

// The compounder's whole screen. A code box, a name box, a list.
//
// Deliberately not queue-management software: no reordering, no priorities,
// no wait estimates, no "now serving" display. And deliberately no name search —
// a search box at the door is where the thirty-second budget dies. If the
// patient has no old slip, he is a new patient. Duplicates are cheap; seconds
// at the door are not.

/** Common places patients come in from. Tapped, not typed; anything else is typed once. */
const NEAR = ['Larkana', 'Naudero', 'Ratodero', 'Dokri', 'Bakrani', 'Warah']

/** Every way a visit can end other than a prescription. */
const OUTCOMES: { s: VisitStatus; label: string; sd: string }[] = [
  { s: 'seen', label: 'Seen, no medicine needed', sd: 'ڏٺو ويو' },
  { s: 'referred', label: 'Sent on / emergency', sd: 'اڳتي موڪليو' },
  { s: 'left', label: 'Left without being seen', sd: 'هليو ويو' },
  { s: 'cancelled', label: 'Cancelled', sd: 'منسوخ' },
]

const LABEL: Record<VisitStatus, string> = {
  waiting: 'waiting', done: 'printed ✓', seen: 'seen', left: 'left', cancelled: 'cancelled',
  referred: 'sent on',
}

/**
 * A barcode scanner is a keyboard that types very fast and then presses Enter.
 * It delivers the whole payload, prefix and all, into whichever box has focus.
 * So the code box accepts what a scanner sends as readily as what a thumb types,
 * and neither the compounder nor the scanner has to be configured.
 */
function scanned(v: string): string {
  const code = readQrPayload(v)
  if (code) return code
  return v.replace(/[^0-9]/g, '').slice(0, 5)
}

export default function Intake({ visits, onOpen, onChange }: {
  visits: Visit[]
  onOpen: (id: string) => void
  onChange: () => void
}) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState(NEAR[0])
  const [msg, setMsg] = useState('')
  const [names, setNames] = useState<Record<string, string>>({})
  const [closing, setClosing] = useState<string | null>(null)

  /**
   * The building's rooms. With one doctor none of this exists on screen and
   * the desk is exactly the shipped solo product. With several, the desk picks
   * the room first — that is the order the corridor already works in: "which
   * doctor?" comes before the money — and everything below follows the pick:
   * the fee, the token numbering, the name on the receipt.
   */
  const multi = multiRoom()
  // A doctor at his own desk at eight in the evening issues tokens for HIS
  // room, so his identity seeds the pick. Everyone else starts on the first
  // sitting room. Without this, Dr Soomro's first token went to Room 1 at
  // Room 1's fee, into a row he then could not even open.
  const [selDoc, setSelDoc] = useState<string>(() => {
    const me = role() === 'doctor' ? currentDoctorId() : null
    if (me && isSitting(me) && activeDoctors().some(d => d.id === me)) return me
    return (sittingDoctors()[0] ?? activeDoctors()[0])?.id ?? ''
  })
  const sel = !multi ? undefined : (() => {
    const d = doctorById(selDoc)
    return d && !d.archived && isSitting(d.id) ? d : (sittingDoctors()[0] ?? activeDoctors()[0])
  })()

  // The money comes first here. The counter takes it and hands over a token;
  // the doctor decides later whether any of it goes back.
  const rate = sel ? sel.fee : profile().fee
  const [amt, setAmt] = useState(String(rate || ''))
  // Switching rooms re-arms the fee box with that room's rate: the desk's next
  // motion is taking that money, not remembering to retype it.
  useEffect(() => { setAmt(String(rate || '')) }, [sel?.id])   // eslint-disable-line react-hooks/exhaustive-deps
  const [fstate, setFstate] = useState<FeeState>('paid')
  const [urgent, setUrgent] = useState(false)
  // a second tap while the first is still writing gives two patients one token
  const [adding, setAdding] = useState(false)
  const [sum, setSum] = useState<Awaited<ReturnType<typeof daySummary>> | null>(null)

  // The evening as it will be counted later. Shown now, because a figure nobody
  // sees until the end of the month is a figure nobody corrects.
  useEffect(() => { daySummary(visits).then(setSum) }, [visits])

  if (visits.length && Object.keys(names).length !== visits.length) {
    db.patients.bulkGet(visits.map(v => v.patientId)).then(ps => {
      const m: Record<string, string> = {}
      visits.forEach((v, i) => { m[v.id] = ps[i] ? `${ps[i]!.name} · ${patientCode(ps[i]!.num)}` : '—' })
      setNames(m)
    })
  }

  async function openVisitFor(patientId: string) {
    const token = await nextToken(sel?.id)
    const id = uid()
    const n = +amt || 0
    const fee = { amount: fstate === 'waived' ? 0 : n, state: (n === 0 ? 'waived' : fstate) as FeeState, at: Date.now() }
    await db.visits.add({
      id, patientId, token, status: 'waiting', createdAt: Date.now(),
      lines: [], tests: [], advice: [], fee, urgent: urgent || undefined,
      doctorId: sel?.id,
    })
    setAmt(String(rate || ''))
    setFstate('paid')
    const wasUrgent = urgent
    setUrgent(false)
    onChange()

    // The receipt, if there is a thermal printer. Deliberately AFTER the visit
    // is written and the queue has been told: the number exists whether or not
    // anything comes out of the printer, and nothing below can undo what is
    // above it. printToken never throws and never blocks.
    const pt = await db.patients.get(patientId)
    if (pt) {
      // Tell the doctor's screen. A message, never a record: the visit is
      // already written above and does not depend on anyone hearing this.
      const said = sel ? `${pt.name} · R${sel.room}` : pt.name
      signal(wasUrgent
        ? { kind: 'urgent', token, name: said }
        : { kind: 'patient', token, name: said })
      printToken({
        token, patientName: pt.name, patientCode: patientCode(pt.num),
        fee: fee.amount, feeState: fee.state === 'due' ? 'due' : fee.state === 'waived' ? 'waived' : 'paid',
        at: fee.at,
        doctorEn: sel?.nameEn, doctorSd: sel?.nameSd, degreesEn: sel?.degreesEn, room: sel?.room,
      }).then(ok => { if (ok) setMsg(`Token ${token} printed.`) })
    }
    return id
  }

  /** A second copy of a token that already exists. Never a new number. */
  async function reprint(v: Visit) {
    const pt = await db.patients.get(v.patientId)
    if (!pt) return
    const f = v.fee
    // the room the token was ISSUED for, not the one selected now
    const d = multi ? doctorById(visitDoctorId(v.doctorId)) : undefined
    const ok = await printToken({
      token: v.token, patientName: pt.name, patientCode: patientCode(pt.num),
      fee: f?.amount ?? 0,
      feeState: f?.state === 'due' ? 'due' : f?.state === 'waived' ? 'waived' : 'paid',
      at: f?.at ?? v.createdAt,
      doctorEn: d?.nameEn, doctorSd: d?.nameSd, degreesEn: d?.degreesEn, room: d?.room,
    })
    setMsg(ok ? `Token ${v.token} printed again.` : 'The receipt printer is switched off in Setup, Paper.')
  }

  /** Returning patient: they hand over the old slip, five digits, done. */
  async function lookup() {
    const n = parseCode(code)
    if (n === null) { setMsg('That number is not right. Check the slip, or add as new.'); return }
    const p = await findByCode(code)
    if (!p) { setMsg('No patient with that number. Add as new.'); return }
    setMsg('')
    setCode('')
    onOpen(await openVisitFor(p.id))
  }

  async function addNew() {
    if (!name.trim()) return
    const pid = uid()
    await db.patients.add({
      id: pid, num: await nextPatientNum(), name: name.trim(),
      phone: phone.trim() || undefined, age: age.trim() || undefined,
      city: city.trim() || undefined, createdAt: Date.now(),
    })
    await openVisitFor(pid)
    setName(''); setPhone(''); setAge(''); setNames({}); setMsg('')
    // city is NOT cleared: most of the queue comes from the same place, and
    // retyping it 60 times is exactly the kind of thing that kills adoption
  }

  async function close(id: string, s: VisitStatus) {
    await closeVisit(id, s)
    setClosing(null)
    onChange()
  }

  /**
   * Who may open a row into the prescription screen. The compounder serves
   * every room; a signed-in doctor opens his own. The router in App.tsx
   * enforces the same rule, so this is the courtesy and that is the gate.
   */
  const mayOpen = (v: Visit) =>
    can('prescribe') && (!multi || role() !== 'doctor' || !currentDoctorId()
      || visitDoctorId(v.doctorId) === currentDoctorId())

  /** "R2 · Dr S. Soomro", for the mixed list a shared desk reads. */
  const roomTag = (v: Visit): string => {
    if (!multi) return ''
    const d = doctorById(visitDoctorId(v.doctorId))
    return d ? `R${d.room} ${d.nameEn} · ` : ''
  }

  /**
   * WHOSE SCREEN IS THIS, AND WHAT SHOULD BE AT THE TOP OF IT.
   *
   * One component serves the counter, the compounder and the doctor, because
   * in a one room clinic they are frequently the same person and splitting it
   * would mean maintaining the same queue three times.
   *
   * But the order was written for the counter, and it stayed that way for the
   * doctor. Safeer signed in as the doctor in a two room clinic and got, top to
   * bottom: which room are you (a question he had just answered at the door),
   * the old-slip box, then the whole New patient form with the fee, and only
   * then, below all of it, his own patients. He asked whether he had opened the
   * compounder's screen or the receptionist's. That is the correct reading of
   * what was on the page.
   *
   * So the doctor's queue leads for the doctor, and taking a patient in stays
   * on the screen underneath, because a solo doctor really does do both. Nobody
   * else's order changes.
   */
  const queueFirst = role() === 'doctor'

  /** The desk's own work: find a returning patient, or take a new one in. */
  const intakeBlock = (
    <>
      <h2 style={multi && !queueFirst ? { marginTop: 22 } : { marginTop: queueFirst ? 30 : undefined }}>
        <IcScan size={17} /> Been here before? Number from the old slip, or scan it
      </h2>
      <div className="row">
        <div className="fld" style={{ flex: 2 }}>
          <input value={code} inputMode="numeric" maxLength={13} placeholder="the number on the slip"
                 className="codebox"
                 onChange={e => { setCode(scanned(e.target.value)); setMsg('') }}
                 onKeyDown={e => { if (e.key === 'Enter') lookup() }} />
        </div>
        {/* five was hard-coded here too, so patient 10000 could not be typed in
            at all — the Open button stayed grey however correct the number was */}
        <button className="btn" style={{ flex: 1 }} onClick={lookup} disabled={code.length < 5}>Open</button>
      </div>
      {msg && <p className="hint" style={{ color: '#8a5b00' }}>{msg}</p>}
      <Tip tone="info">
        A USB barcode scanner types into this box like a keyboard. Point it at the square on
        the patient's old slip and his record opens. No software, nothing to connect.
        A phone camera cannot take its place: on the clinic's own wifi a browser is not
        allowed to open a camera at all, so scanning happens at this desk.
      </Tip>

      <h2 id="newpatient" style={{ marginTop: 24 }}><IcUser size={17} /> New patient</h2>
      {queueFirst && (
        <p className="hint" style={{ marginTop: -6 }}>
          Normally the counter does this. It is here because plenty of evenings there is
          nobody else at the door.
        </p>
      )}
      <div className="fld"><label>Name — نالو</label>
        <input value={name} onChange={e => setName(e.target.value)}
               onKeyDown={e => { if (e.key === 'Enter') addNew() }} /></div>
      <div className="row">
        <div className="fld"><label>Phone — optional</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="numeric" /></div>
        <div className="fld"><label>Age — optional</label>
          {/* digits only, and nothing above 120: "231321" printed on a real slip */}
          <input value={age} inputMode="numeric" maxLength={3}
                 onChange={e => {
                   const v = e.target.value.replace(/\D/g, '').slice(0, 3)
                   if (v === '' || +v <= 120) setAge(v)
                 }} /></div>
      </div>
      <div className="fld"><label>City or village — شهر</label>
        <div className="chips">
          {NEAR.map(c => (
            <button key={c} className={'chip' + (city === c ? ' have' : '')}
                    onClick={() => setCity(c)}>{c}</button>
          ))}
        </div>
        <input value={city} onChange={e => setCity(e.target.value)}
               placeholder="or type somewhere else" />
        <span className="unit">Stays set between patients, because most of a queue comes from the same place.</span>
      </div>
      <label className="check urgentbox">
        <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
        <span><IcWarn size={15} /> <b>This one cannot wait</b>
          <small>Goes to the top of the list in red, and the doctor's screen is told at once.
            Use it for the patient in front of you, not as a guess about how ill somebody is.</small></span>
      </label>

      <div className="fld feerow">
        <label><IcMoney size={13} /> Fee taken now &nbsp; في</label>
        <div className="row">
          <input value={amt} inputMode="numeric" placeholder="Rs"
                 onChange={e => setAmt(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          {([['paid', 'Received'], ['due', 'Not paid yet'], ['waived', 'Free']] as const).map(([k, l]) => (
            <button key={k} className={'chip' + (fstate === k ? ' have' : '')}
                    onClick={() => { setFstate(k); if (k === 'waived') setAmt('0') }}>{l}</button>
          ))}
        </div>
        {rate > 0 && +amt !== rate && fstate !== 'waived' && (
          <span className="unit">The doctor's rate is Rs {rate}.
            <button className="lnk" onClick={() => setAmt(String(rate))}>use it</button></span>
        )}
      </div>

      <button className="btn wide" disabled={!name.trim() || adding}
              onClick={async () => {
                if (adding) return
                setAdding(true)
                try { await addNew() } finally { setAdding(false) }
              }}>
        {adding ? 'Adding…' : <>Add to queue &nbsp; قطار ۾ شامل ڪريو</>}
      </button>
      <p className="hint">No old slip? Add as new. A duplicate costs nothing; asking questions at the door costs the evening.</p>
    </>
  )

  return (
    <div className="pane">
      <BackupNudge />

      {/* TONIGHT. Only a building with several rooms sees this. The default is
          that everyone active is sitting, so the normal evening costs the desk
          nothing; the strip earns its place on the night a doctor does not
          come, and as the switch that decides where the next token goes. */}
      {multi && (
        <>
          <h2><IcQueue size={17} /> Tonight <span className="sd">اڄ رات</span></h2>
          <div className="rooms">
            {activeDoctors().map(d => {
              const mine = visits.filter(v => visitDoctorId(v.doctorId) === d.id)
              const waiting = mine.filter(v => v.status === 'waiting').length
              const nextTok = mine.reduce((m, v) => Math.max(m, v.token), 0) + 1
              const sitting = isSitting(d.id)
              const on = sel?.id === d.id
              return (
                <div key={d.id} className={'roomcard' + (on ? ' on' : '') + (sitting ? '' : ' off')}>
                  <button className="rc-main" disabled={!sitting} onClick={() => setSelDoc(d.id)}>
                    <span className="rc-room">R{d.room}</span>
                    <span className="rc-who"><b>{d.nameEn}</b>{d.nameSd ? <i className="sd">{d.nameSd}</i> : null}</span>
                    {sitting
                      ? <small>Rs {d.fee} · {waiting} waiting · next token {nextTok}</small>
                      : <small>not sitting tonight</small>}
                  </button>
                  <button className="lnk rc-sit" onClick={() => {
                    setSitting(d.id, !sitting)
                    if (sitting && sel?.id === d.id) {
                      const next = sittingDoctors().find(x => x.id !== d.id)
                      if (next) setSelDoc(next.id)
                    }
                  }}>{sitting ? 'not in tonight' : 'sitting after all'}</button>
                </div>
              )
            })}
          </div>
          {sel && (
            <p className="hint">
              {/* He answered "which doctor" at the door thirty seconds ago. Saying
                  it back to him as a statement, not as a fresh question, is the
                  difference between a screen that knows him and one that forgot. */}
              {queueFirst
                ? <>You are in <b>Room {sel.room}</b>. The queue below is yours, and any token you
                    take is issued for your room at your fee. The other rooms are here so you can
                    see the evening, and to hand the desk over if you take a token for a colleague.</>
                : <>Tokens below are issued for <b>Room {sel.room} · {sel.nameEn}</b>, at his fee.
                    Tap another room to change.</>}
            </p>
          )}
        </>
      )}

      {!queueFirst && intakeBlock}

      <h2 style={{ marginTop: 22 }}><IcQueue size={17} /> Today — {visits.length}</h2>
      {sum && visits.length > 0 && (
        <div className="daybar">
          <span><b>{sum.printed}</b> printed</span>
          {sum.waiting > 0 && <span><b>{sum.waiting}</b> waiting</span>}
          {sum.seen > 0 && <span><b>{sum.seen}</b> seen only</span>}
          {sum.left + sum.cancelled > 0 && <span><b>{sum.left + sum.cancelled}</b> left / cancelled</span>}
          {sum.referred > 0 && <span><b>{sum.referred}</b> sent on</span>}
          <span className="money"><b>Rs {sum.collected}</b> in hand</span>
          {sum.toRefund > 0 && <span className="money back"><b>Rs {sum.toRefund}</b> to give back
            <small> ({sum.refundCount})</small></span>}
          {sum.due > 0 && <span className="money due"><b>Rs {sum.due}</b> due</span>}
          {sum.testsTaken > 0 && <span className="money"><b>Rs {sum.testsTaken}</b> tests</span>}
          {sum.testsOwed > 0 && <span className="money due"><b>Rs {sum.testsOwed}</b> tests to collect
            <small> ({sum.testsOwedCount})</small></span>}
          {sum.unrecorded > 0 && <span className="soft">{sum.unrecorded} with no fee recorded</span>}
        </div>
      )}
      {!visits.length && (
        <div className="blank">
          <ArtEmpty />
          <b>Nobody waiting yet</b>
          {/* The form is above for the desk and below for the doctor, so the
              empty state cannot say "above" to everyone. For the doctor it
              carries the jump instead, which keeps the page order stable
              between an empty queue and a full one. */}
          {queueFirst ? (
            <>
              <p>The counter's tokens appear here as they are taken.</p>
              <button className="btn" onClick={() => {
                document.getElementById('newpatient')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}>Take a patient in yourself</button>
            </>
          ) : (
            <p>Take the fee, add the patient above, and the number appears here.</p>
          )}
        </div>
      )}
      <div className="qlist">
      {[...visits].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).map(v => {
        const shut = v.status !== 'waiting'
        return (
          <div key={v.id} className={`qwrap ${shut ? 'shut' : ''}`}>
            <button className={`qrow ${v.status === 'done' ? 'done' : ''}${v.urgent && v.status === 'waiting' ? ' urgent' : ''}${mayOpen(v) ? '' : ' flat'}${!mayOpen(v) && can('prescribe') ? ' notmine' : ''}`}
                    onClick={() => mayOpen(v) && onOpen(v.id)}
                    disabled={!mayOpen(v)}>
              <span className="tk">{v.token}</span>
              <span className="nm">{names[v.id] ?? '…'}
                <small>
                  {roomTag(v)}
                  {can('history')
                    ? (v.lines.length ? `${v.lines.length} medicine${v.lines.length === 1 ? '' : 's'}` : 'no prescription yet')
                    : (v.printedAt ? 'prescription printed' : 'with the doctor')}
                  {v.fee ? ` · ${v.fee.state === 'waived' ? 'fee waived'
                    : v.fee.state === 'due' ? `Rs ${v.fee.amount} due` : `Rs ${v.fee.amount} received`}` : ''}
                </small>
              </span>
              {v.urgent && v.status === 'waiting'
                ? <span className="uflag"><IcWarn size={13} /> cannot wait</span>
                : <span className={`st s-${v.status}`}>{LABEL[v.status]}</span>}
            </button>

            {/* The cuff goes on after the token, at the door or just inside it.
                It is the compounder's job and his screen, so it lives here and
                not in the room. Only what he fills is printed. */}
            {v.status === 'waiting' && (
              <Vitals which="vital" value={v.vitals ?? {}}
                      onChange={async nv => { await db.visits.update(v.id, { vitals: nv }); onChange() }} />
            )}

            {/* Reprint. Thermal rolls jam, run out, and get torn across the
                number. The token already exists in the record, so printing it
                again is not issuing anything — it is a second copy of a fact. */}
            {paper().token && (
              <button className="lnk qclose" onClick={() => reprint(v)}>print the token again</button>
            )}

            {/* A token nobody closes sits "waiting" for ever and quietly makes
                the evening's figures a lie. One tap, four honest endings. */}
            {/* The doctor sent this one back for money. It has to be loud at the
                counter, because the patient is walking past it right now. */}
            {/* THE MONEY FOR A TEST DONE IN THE ROOM.
                The doctor asked for it, the compounder did it there and then,
                and the patient pays on the way out. So it is owed from the
                moment the reading exists and it is collected here, at the
                door, by the person who did it. It is not a refund and it does
                not look like one: green, because money is coming in. */}
            {can('tests') && !v.testsPaidAt && chargesFor(v.vitals, INSTANT).length > 0 && (
              <div className="collect">
                <b>Take Rs {chargeTotal(chargesFor(v.vitals, INSTANT))} for the test{chargesFor(v.vitals, INSTANT).length === 1 ? '' : 's'}</b>
                <span>{chargesFor(v.vitals, INSTANT).map(c => `${c.en} Rs ${c.amount}`).join(' · ')}</span>
                <button className="btn" onClick={async () => { await markTestsPaid(v.id); onChange() }}>
                  Received
                </button>
              </div>
            )}

            {owedRefund(v) && (
              <div className="refund">
                <b>Give back Rs {v.fee!.refund}</b>
                {v.fee!.refundNote ? <span>{v.fee!.refundNote}</span> : null}
                <button className="btn warn" onClick={async () => { await markRefunded(v.id); onChange() }}>
                  Handed back
                </button>
              </div>
            )}

            {/* Money promised at the door and paid on the way out. Without this
                button a fee marked "not paid yet" stayed a debt for ever, the
                figures under-counted the drawer, and the owed list slowly
                filled with people who had in fact paid. */}
            {v.fee?.state === 'due' && v.fee.amount > 0 && (
              <button className="lnk qclose" onClick={async () => {
                await setFee(v.id, { ...v.fee!, state: 'paid', at: Date.now() })
                onChange()
              }}>Rs {v.fee.amount} received now</button>
            )}

            {!v.printedAt && (
              closing === v.id ? (
                <div className="closebox">
                  {OUTCOMES.map(o => (
                    <button key={o.s} className="chip" onClick={() => close(v.id, o.s)}>
                      {o.label} <span className="sd">{o.sd}</span>
                    </button>
                  ))}
                  <button className="lnk" onClick={() => setClosing(null)}>keep waiting</button>
                </div>
              ) : (
                <button className="lnk qclose" onClick={() => setClosing(v.id)}>
                  {shut ? 'change' : 'close without a prescription'}
                </button>
              )
            )}
          </div>
        )
      })}
      </div>
      {visits.length > 0 &&
        <p className="hint">Tap <b>any</b> row, in any order. The queue does not force you.</p>}

      {queueFirst && intakeBlock}
    </div>
  )
}

/**
 * Nothing here protects against the disk dying except a file that has actually
 * left the machine. Said once, quietly, and only when it is true.
 */
function BackupNudge() {
  const d = daysSinceExport()
  // The practice copy saves nothing to a file on purpose, so nagging a visitor
  // to back it up would contradict the banner right above that says so.
  if (isDemo) return null
  if (d !== null && d < 7) return null
  // Never a backup at all is a different situation from an old one, and the
  // tone says which: one is a problem now, the other is drifting toward one.
  return (
    <Note tone={d === null ? 'stop' : 'warn'}
          title={d === null ? 'No backup has ever been saved' : `Last backup was ${d} days ago`}>
      A copy inside this machine does not survive the machine. Go to
      <b> Setup, Backup, Save the full backup</b>, onto a pen drive.
    </Note>
  )
}
