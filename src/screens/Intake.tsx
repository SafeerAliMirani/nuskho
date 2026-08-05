import { useEffect, useState } from 'react'
import { readQrPayload } from '../print/qr'
import { ArtEmpty, IcScan, IcUser, IcRupee, IcQueue } from '../ui/art'
import { Note, Tip } from '../ui/Note'
import { signal } from '../ui/bus'
import Vitals from '../ui/Vitals'
import { IcWarn } from '../ui/art'
import { printToken } from '../print/print'
import { paper } from '../paper'
import { can } from '../roles'
import {
  db, uid, nextToken, nextPatientNum, findByCode, patientCode, parseCode, closeVisit,
  daySummary, markRefunded, owedRefund,
} from '../db'
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
  // The money comes first here. The counter takes it and hands over a token;
  // the doctor decides later whether any of it goes back.
  const rate = profile().fee
  const [amt, setAmt] = useState(String(rate || ''))
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
    const token = await nextToken()
    const id = uid()
    const n = +amt || 0
    const fee = { amount: fstate === 'waived' ? 0 : n, state: (n === 0 ? 'waived' : fstate) as FeeState, at: Date.now() }
    await db.visits.add({
      id, patientId, token, status: 'waiting', createdAt: Date.now(),
      lines: [], tests: [], advice: [], fee, urgent: urgent || undefined,
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
      signal(wasUrgent
        ? { kind: 'urgent', token, name: pt.name }
        : { kind: 'patient', token, name: pt.name })
      printToken({
        token, patientName: pt.name, patientCode: patientCode(pt.num),
        fee: fee.amount, feeState: fee.state === 'due' ? 'due' : fee.state === 'waived' ? 'waived' : 'paid',
        at: fee.at,
      }).then(ok => { if (ok) setMsg(`Token ${token} printed.`) })
    }
    return id
  }

  /** A second copy of a token that already exists. Never a new number. */
  async function reprint(v: Visit) {
    const pt = await db.patients.get(v.patientId)
    if (!pt) return
    const f = v.fee
    const ok = await printToken({
      token: v.token, patientName: pt.name, patientCode: patientCode(pt.num),
      fee: f?.amount ?? 0,
      feeState: f?.state === 'due' ? 'due' : f?.state === 'waived' ? 'waived' : 'paid',
      at: f?.at ?? v.createdAt,
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

  return (
    <div className="pane">
      <BackupNudge />

      <h2><IcScan size={17} /> Been here before? Number from the old slip, or scan it</h2>
      <div className="row">
        <div className="fld" style={{ flex: 2 }}>
          <input value={code} inputMode="numeric" maxLength={13} placeholder="the number on the slip"
                 style={{ fontSize: 26, letterSpacing: 6, fontWeight: 700 }}
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
      </Tip>

      <h2 style={{ marginTop: 24 }}><IcUser size={17} /> New patient</h2>
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
        <label><IcRupee size={13} /> Fee taken now &nbsp; في</label>
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
          {sum.unrecorded > 0 && <span className="soft">{sum.unrecorded} with no fee recorded</span>}
        </div>
      )}
      {!visits.length && (
        <div className="blank">
          <ArtEmpty />
          <b>Nobody waiting yet</b>
          <p>Take the fee, add the patient above, and the number appears here.</p>
        </div>
      )}
      <div className="qlist">
      {[...visits].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).map(v => {
        const shut = v.status !== 'waiting'
        return (
          <div key={v.id} className={`qwrap ${shut ? 'shut' : ''}`}>
            <button className={`qrow ${v.status === 'done' ? 'done' : ''}${v.urgent && v.status === 'waiting' ? ' urgent' : ''}${can('prescribe') ? '' : ' flat'}`}
                    onClick={() => can('prescribe') && onOpen(v.id)}
                    disabled={!can('prescribe')}>
              <span className="tk">{v.token}</span>
              <span className="nm">{names[v.id] ?? '…'}
                <small>
                  {can('history')
                    ? (v.lines.length ? `${v.lines.length} medicines` : 'no prescription yet')
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
            {owedRefund(v) && (
              <div className="refund">
                <b>Give back Rs {v.fee!.refund}</b>
                {v.fee!.refundNote ? <span>{v.fee!.refundNote}</span> : null}
                <button className="btn warn" onClick={async () => { await markRefunded(v.id); onChange() }}>
                  Handed back
                </button>
              </div>
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
