import { useEffect, useMemo, useState } from 'react'
import {
  mirrorSubscribe, mirrorAuth, mirrorSignOut, intent, hostUp, setHostHere,
  MIRROR_ROLES, type WireState, type WireRx, type WireVisit, type WireDoctor,
} from '../building'
import { ROLE_NAME, ROLE_SD, ROLE_WHAT, type Role } from '../roles'
import { printToken } from '../print/print'
import { paper } from '../paper'
import { Mark, IcRupee, IcQueue, IcPill, IcChart, IcScan, IcUser, IcWarn } from '../ui/art'
import { APP } from '../profile'
import type { TokenSlip } from '../print/token'

/**
 * A PHONE IN THE BUILDING. A door and a screen, and deliberately nothing else.
 *
 * Everything this file shows arrived over the building's own wifi a moment
 * ago, lives in component state, and dies with the tab. There is no database
 * import here and there never will be: grep this file for 'db' and find
 * nothing, which is the whole point. A mirror left on a bus seat carries no
 * records, because none were ever written to it.
 *
 * Everything this file DOES is a question sent to the record holder — add
 * this patient, mark this given — answered by the same code the solo product
 * runs. If the clinic machine is off, this screen says so in plain words and
 * the paper pad takes over, which is the honest state of the world.
 */

const ICON: Record<string, (p: { size?: number }) => JSX.Element> = {
  counter: IcRupee, compounder: IcQueue, pharmacy: IcPill, clinicadmin: IcChart,
}

const LABEL: Record<string, string> = {
  waiting: 'waiting', done: 'printed ✓', seen: 'seen', left: 'left',
  cancelled: 'cancelled', referred: 'sent on',
}

const ROLE_KEY = 'nuskho.mirrorRole'

export default function Mirror() {
  const [role, setRole] = useState<Role | null>(() => {
    try {
      const r = sessionStorage.getItem(ROLE_KEY)
      return r && (MIRROR_ROLES as string[]).includes(r) ? (r as Role) : null
    } catch { return null }
  })
  const [s, setS] = useState<WireState | null>(null)
  const [rx, setRx] = useState<WireRx>([])
  const [up, setUp] = useState(hostUp())

  useEffect(() => {
    mirrorSubscribe({ state: setS, rx: setRx, up: setUp })
  }, [])

  const out = () => {
    mirrorSignOut()
    try { sessionStorage.removeItem(ROLE_KEY) } catch { /* ignore */ }
    setRole(null); setS(null)
  }

  return (
    <div className="app mirror">
      <header className="top">
        <div className="brandwrap">
          <Mark size={26} className="mk" />
          <div className="who2">
            <b>{APP.en}</b>
            <span>{up ? 'on the clinic’s wifi' : 'clinic machine not answering'}</span>
          </div>
        </div>
        <div className="counts">
          <span className={'hostdot' + (up ? ' up' : '')} title={up ? 'connected' : 'off'} />
          {role && (
            <>
              <span className={'rolechip ' + role} style={{ cursor: 'default' }}>
                {ROLE_NAME[role]} <i className="sd">{ROLE_SD[role]}</i>
              </span>
              <button className="lnk paper" onClick={out}>Sign out</button>
            </>
          )}
        </div>
      </header>

      {!role
        ? <MirrorDoor up={up} onIn={r => {
            setRole(r)
            try { sessionStorage.setItem(ROLE_KEY, r) } catch { /* ignore */ }
          }} />
        : !s
        ? <div className="pane"><p className="hint">
            {up ? 'Fetching the day from the clinic machine…'
                : 'The clinic machine is off or out of reach. This phone keeps no records of its own, so ask inside, or use the paper pad until it is back.'}
          </p></div>
        : role === 'counter' ? <MDesk s={s} />
        : role === 'compounder' ? <MQueue s={s} />
        : role === 'pharmacy' ? <MPharm s={s} rx={rx} />
        : <MOps s={s} />}
    </div>
  )
}

/* ------------------------------------------------------------------- the door */

function MirrorDoor({ up, onIn }: { up: boolean; onIn: (r: Role) => void }) {
  const [want, setWant] = useState<Role | null>(null)
  const [pin, setPin] = useState('')
  const [bad, setBad] = useState('')
  const [busy, setBusy] = useState(false)

  async function go(r: Role, p: string) {
    setBusy(true)
    const res = await mirrorAuth(r, p)
    setBusy(false)
    if (res.ok) { onIn(r); return }
    // the empty first tap just found out this role HAS a PIN: show its box
    if (p === '' && res.why.includes('right')) { setWant(r); setBad(''); return }
    setBad(res.why); setPin('')
  }

  return (
    <div className="pane">
      <p className="pick" style={{ marginTop: 8 }}>Who is holding this phone?</p>
      {!up && (
        <p className="hint" style={{ color: '#8a5b00' }}>
          The clinic machine is not answering. Signing in needs it on, because the
          PINs live there and nowhere else.
        </p>
      )}
      {want ? (
        <>
          <div className="whoback">
            <b>{ROLE_NAME[want]} <span className="sd">{ROLE_SD[want]}</span></b>
            <button className="lnk" onClick={() => { setWant(null); setBad('') }}>not me</button>
          </div>
          <div className="fld">
            <label>PIN</label>
            <input type="password" inputMode="numeric" autoFocus value={pin} maxLength={8}
                   onChange={e => { setPin(e.target.value.replace(/[^0-9]/g, '')); setBad('') }}
                   onKeyDown={e => { if (e.key === 'Enter' && pin) go(want, pin) }} />
          </div>
          {bad && <p className="usable bad">{bad}</p>}
          <button className="btn wide" disabled={!pin || busy} onClick={() => go(want, pin)}>
            Open &nbsp; کوليو
          </button>
        </>
      ) : (
        <>
          <div className="whos">
            {MIRROR_ROLES.map(r => {
              const I = ICON[r]
              return (
                <button key={r} className={'whobtn ' + r} disabled={busy || !up}
                        onClick={() => { setBad(''); go(r, '') }}>
                  <span className="wi"><I size={20} /></span>
                  <span className="n">{ROLE_NAME[r]} <i className="sd">{ROLE_SD[r]}</i></span>
                  <small>{ROLE_WHAT[r]}</small>
                  <span className="go">→</span>
                </button>
              )
            })}
          </div>
          {bad && <p className="usable bad">{bad}</p>}
          <p className="hint">
            The doctor and the Nuskho role sign in at the clinic machine itself, not on a phone.
          </p>
          {/* The installer's bootstrap. A building's first machine loads as a
              mirror, because nothing has been marked yet; this is the one way
              to mark it. On a phone this would only produce an empty clinic,
              which is why it asks twice in plain words. */}
          <p className="hint" style={{ marginTop: 18, opacity: .8 }}>
            Setting the building up, and this is the ONE computer that will hold the
            records? <button className="lnk" onClick={() => {
              if (confirm('Mark THIS machine as the record holder? Only the one computer that keeps the clinic’s database should be marked. A phone should never be.')) {
                setHostHere(true)
                location.reload()
              }
            }}>Mark it and reload</button>
          </p>
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- shared pieces */

const feeLine = (v: WireVisit): string =>
  v.fee ? (v.fee.state === 'waived' ? 'fee waived'
    : v.fee.state === 'due' ? `Rs ${v.fee.amount} due` : `Rs ${v.fee.amount} received`) : ''

const roomTag = (s: WireState, v: WireVisit): string => {
  if (!s.multi) return ''
  const d = s.doctors.find(x => x.id === (v.doctorId ?? s.doctors[0]?.id))
  return d ? `R${d.room} ${d.nameEn} · ` : ''
}

function Refund({ v, onDone }: { v: WireVisit; onDone: () => void }) {
  if (!v.fee?.refund || v.fee.refundedAt) return null
  return (
    <div className="refund">
      <b>Give back Rs {v.fee.refund}</b>
      {v.fee.refundNote ? <span>{v.fee.refundNote}</span> : null}
      <button className="btn warn" onClick={async () => {
        await intent('markRefunded', { visitId: v.id }); onDone()
      }}>Handed back</button>
    </div>
  )
}

const byUrgent = (a: WireVisit, b: WireVisit) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)

/* ---------------------------------------------------------- the counter's phone */

function MDesk({ s }: { s: WireState }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [selDoc, setSelDoc] = useState('')
  const sitting = s.doctors.filter(d => d.sitting)
  const sel: WireDoctor | undefined = s.multi
    ? (sitting.find(d => d.id === selDoc) ?? sitting[0] ?? s.doctors[0])
    : undefined
  const [amt, setAmt] = useState('')
  const [fstate, setFstate] = useState<'paid' | 'due' | 'waived'>('paid')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const rate = sel ? sel.fee : (s.doctors[0]?.fee ?? 0)
  useEffect(() => { setAmt(String(rate || '')) }, [sel?.id])   // eslint-disable-line react-hooks/exhaustive-deps

  async function fire(kind: 'addPatient' | 'openByCode') {
    if (busy) return
    setBusy(true); setMsg('')
    const r = await intent(kind, {
      code, name, age, city, urgent,
      amount: +amt || 0, feeState: fstate, doctorId: sel?.id,
      wantHostPrint: !paper().token,
    })
    setBusy(false)
    if (r.ok === false) { setMsg(String(r.why)); return }
    setMsg(`Token ${r.token} issued${sel ? ` for Room ${sel.room}` : ''}.`)
    setName(''); setAge(''); setCode(''); setUrgent(false)
    setAmt(String(rate || '')); setFstate('paid')
    if (r.slip && paper().token) printToken(r.slip as TokenSlip)
  }

  return (
    <div className="pane">
      {s.multi && (
        <div className="chips" style={{ marginBottom: 6 }}>
          {s.doctors.map(d => (
            <button key={d.id} className={'chip' + (sel?.id === d.id ? ' have' : '') + (d.sitting ? '' : ' off')}
                    disabled={!d.sitting}
                    onClick={() => setSelDoc(d.id)}>
              R{d.room} {d.nameEn}{d.sitting ? ` · Rs ${d.fee}` : ' · not in'}
            </button>
          ))}
        </div>
      )}

      <h2><IcScan size={17} /> Old slip's number</h2>
      <div className="row">
        <div className="fld" style={{ flex: 2 }}>
          <input value={code} inputMode="numeric" maxLength={13} placeholder="scan or type"
                 style={{ fontSize: 22, letterSpacing: 4, fontWeight: 700 }}
                 onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                 onKeyDown={e => { if (e.key === 'Enter' && code.length >= 5) fire('openByCode') }} />
        </div>
        <button className="btn" style={{ flex: 1 }} disabled={code.length < 5 || busy}
                onClick={() => fire('openByCode')}>Open</button>
      </div>

      <h2 style={{ marginTop: 16 }}><IcUser size={17} /> New patient</h2>
      <div className="fld"><label>Name — نالو</label>
        <input value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="row">
        <div className="fld"><label>Age — optional</label>
          <input value={age} inputMode="numeric" maxLength={3}
                 onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} /></div>
        <div className="fld"><label>City — optional</label>
          <input value={city} onChange={e => setCity(e.target.value)} /></div>
      </div>
      <label className="check urgentbox">
        <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
        <span><IcWarn size={15} /> <b>Cannot wait</b></span>
      </label>
      <div className="fld feerow">
        <label><IcRupee size={13} /> Fee taken now</label>
        <div className="row">
          <input value={amt} inputMode="numeric" placeholder="Rs"
                 onChange={e => setAmt(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          {([['paid', 'Received'], ['due', 'Not yet'], ['waived', 'Free']] as const).map(([k, l]) => (
            <button key={k} className={'chip' + (fstate === k ? ' have' : '')}
                    onClick={() => { setFstate(k); if (k === 'waived') setAmt('0') }}>{l}</button>
          ))}
        </div>
      </div>
      <button className="btn wide" disabled={!name.trim() || busy} onClick={() => fire('addPatient')}>
        {busy ? 'Asking the clinic machine…' : <>Add to queue &nbsp; قطار ۾ شامل ڪريو</>}
      </button>
      {msg && <p className="usable" style={{ marginTop: 8 }}>{msg}</p>}

      <h2 style={{ marginTop: 18 }}><IcQueue size={17} /> Today — {s.visits.length}</h2>
      <div className="daybar">
        <span><b>{s.sums.printed}</b> printed</span>
        <span><b>{s.sums.waiting}</b> waiting</span>
        <span className="money"><b>Rs {s.sums.collected}</b> in hand</span>
        {s.sums.toRefund > 0 && <span className="money back"><b>Rs {s.sums.toRefund}</b> to give back</span>}
      </div>
      {[...s.visits].sort(byUrgent).map(v => (
        <div key={v.id} className="qwrap">
          <div className={'qrow flat' + (v.urgent && v.status === 'waiting' ? ' urgent' : '')}>
            <span className="tk">{v.token}</span>
            <span className="nm">{v.name} · {v.code}
              <small>{roomTag(s, v)}{feeLine(v)}</small>
            </span>
            <span className={`st s-${v.status}`}>{LABEL[v.status]}</span>
          </div>
          <Refund v={v} onDone={() => undefined} />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------- the compounder's phone */

const VITAL_KEYS: [string, string][] = [['bp', 'BP'], ['temp', 'Temp °F'], ['pulse', 'Pulse'], ['weight', 'Weight kg']]

function MQueue({ s }: { s: WireState }) {
  const [open, setOpen] = useState<string | null>(null)
  const [vit, setVit] = useState<Record<string, string>>({})
  const [closing, setClosing] = useState<string | null>(null)

  return (
    <div className="pane">
      <h2><IcQueue size={17} /> The queue — {s.sums.waiting} waiting</h2>
      {[...s.visits].sort(byUrgent).map(v => (
        <div key={v.id} className="qwrap">
          <button className={'qrow' + (v.urgent && v.status === 'waiting' ? ' urgent' : '') + (v.status === 'done' ? ' done' : '')}
                  onClick={() => { setOpen(open === v.id ? null : v.id); setVit({}); setClosing(null) }}>
            <span className="tk">{v.token}</span>
            <span className="nm">{v.name}
              <small>{roomTag(s, v)}{v.hasVitals ? 'vitals taken · ' : ''}{feeLine(v)}</small>
            </span>
            {v.urgent && v.status === 'waiting'
              ? <span className="uflag"><IcWarn size={13} /> cannot wait</span>
              : <span className={`st s-${v.status}`}>{LABEL[v.status]}</span>}
          </button>

          {open === v.id && v.status === 'waiting' && (
            <div style={{ padding: '8px 2px' }}>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {VITAL_KEYS.map(([k, l]) => (
                  <div className="fld" key={k} style={{ minWidth: 120, flex: 1 }}>
                    <label>{l}</label>
                    <input value={vit[k] ?? ''} onChange={e => setVit(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn ghost" onClick={async () => {
                  const clean = Object.fromEntries(Object.entries(vit).filter(([, x]) => x.trim()))
                  await intent('setVitals', { visitId: v.id, vitals: clean })
                  setOpen(null)
                }}>Save vitals · ready for the room</button>
                {closing === v.id ? (
                  <div className="chips">
                    {([['seen', 'Seen, no medicine'], ['referred', 'Sent on'], ['left', 'Left'], ['cancelled', 'Cancelled']] as const)
                      .map(([st, l]) => (
                        <button key={st} className="chip" onClick={async () => {
                          await intent('closeVisit', { visitId: v.id, status: st }); setOpen(null)
                        }}>{l}</button>
                      ))}
                  </div>
                ) : (
                  <button className="lnk" onClick={() => setClosing(v.id)}>close without prescription</button>
                )}
              </div>
            </div>
          )}
          <Refund v={v} onDone={() => setOpen(null)} />
        </div>
      ))}
      {!s.visits.length && <p className="hint">Nobody yet. Tokens appear here the moment the desk issues them.</p>}
    </div>
  )
}

/* --------------------------------------------------------- the pharmacy's phone */

function MPharm({ s, rx }: { s: WireState; rx: WireRx }) {
  const [open, setOpen] = useState<string | null>(null)
  const byId = useMemo(() => new Map(rx.map(r => [r.visitId, r.lines])), [rx])
  const printed = s.visits.filter(v => v.printedAt && v.linesN > 0)
    .sort((a, b) => (b.printedAt ?? 0) - (a.printedAt ?? 0))

  return (
    <div className="pane">
      <h2><IcPill size={17} /> Printed today — {printed.length}</h2>
      {printed.map(v => {
        const lines = byId.get(v.id) ?? []
        const done = !!v.dispensedAt
        const isOpen = open === v.id
        return (
          <div className="line" key={v.id} style={done ? { opacity: .62 } : undefined}>
            <div className="hd" style={{ cursor: 'pointer' }} onClick={() => setOpen(isOpen ? null : v.id)}>
              <div>
                <b>Token {v.token} · {v.name}</b>
                <small>No. {v.code}{done ? ' · given ✓' : ` · ${lines.length} medicines`}</small>
              </div>
              <span className="lnk">{isOpen ? 'close' : done ? 'given ✓' : 'open'}</span>
            </div>
            {isOpen && (
              <>
                {lines.map((l, i) => (
                  <div className="row" key={i}
                       style={{ alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: '1px solid #eef2f0' }}>
                    <button className={'chip ' + (l.given !== undefined ? 'on' : '')}
                            onClick={() => intent('setGiven', { visitId: v.id, index: i, given: l.given !== undefined ? null : l.n })}>
                      {l.given !== undefined ? '✓' : '+'}
                    </button>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 14 }}>{l.brand} {l.strength}</b>
                      <small style={{ display: 'block', color: 'var(--mut)' }}>
                        {l.n > 0 ? `${l.n} ${l.unit} · ${l.days} days` : l.unit}
                        {l.given !== undefined && l.n > 0 && l.given < l.n ? ` · gave ${l.given}, short ${l.n - l.given}` : ''}
                      </small>
                    </div>
                    {l.n > 0 && !done && l.given !== undefined && (
                      <button className="lnk" onClick={() => {
                        const raw = prompt(`How many actually given? Course is ${l.n}.`, String(l.given ?? l.n))
                        if (raw === null) return
                        intent('setGiven', { visitId: v.id, index: i, given: +raw.replace(/[^0-9]/g, '') || 0 })
                      }}>gave {l.given}</button>
                    )}
                  </div>
                ))}
                <div className="row" style={{ marginTop: 10 }}>
                  {!done && <button className="btn" onClick={() => intent('giveAll', { visitId: v.id })}>All given · handed over</button>}
                  {done && <button className="lnk" onClick={() => intent('reopen', { visitId: v.id })}>reopen</button>}
                </div>
              </>
            )}
          </div>
        )
      })}
      {!printed.length && <p className="hint">Nothing printed yet. Slips appear the moment a room prints them.</p>}
      <p className="hint">
        This phone sees printed medicine lines only, and forgets them when it closes.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------- the admin's view */

function MOps({ s }: { s: WireState }) {
  const perRoom = s.multi ? s.doctors.map(d => {
    const mine = s.visits.filter(v => (v.doctorId ?? s.doctors[0]?.id) === d.id)
    const collected = mine.reduce((a, v) => a + (v.fee && v.fee.state !== 'due' ? v.fee.amount : 0), 0)
      - mine.reduce((a, v) => a + (v.fee?.refundedAt ? (v.fee.refund ?? 0) : 0), 0)
    return { d, n: mine.length, printed: mine.filter(v => v.printedAt).length, collected }
  }) : []

  return (
    <div className="pane">
      <h2><IcChart size={17} /> Today, as the desk counted it</h2>
      <div className="daybar">
        <span><b>{s.sums.total}</b> tokens</span>
        <span><b>{s.sums.printed}</b> printed</span>
        <span><b>{s.sums.waiting}</b> waiting</span>
        <span className="money"><b>Rs {s.sums.collected}</b> in hand</span>
        {s.sums.toRefund > 0 && <span className="money back"><b>Rs {s.sums.toRefund}</b> to give back</span>}
        {s.sums.due > 0 && <span className="money due"><b>Rs {s.sums.due}</b> due</span>}
      </div>
      {perRoom.map(({ d, n, printed, collected }) => (
        <div className="line" key={d.id}>
          <div className="hd"><div>
            <b>Room {d.room} · {d.nameEn}</b>
            <small>{n} tokens · {printed} printed · Rs {collected} taken</small>
          </div></div>
        </div>
      ))}
      <p className="hint" style={{ marginTop: 12 }}>
        Figures only, from the clinic machine, a moment old. This phone stores nothing,
        and no prescription can reach it.
      </p>
    </div>
  )
}
