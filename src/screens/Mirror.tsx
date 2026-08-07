import { useEffect, useMemo, useState } from 'react'
import {
  mirrorSubscribe, mirrorAuth, mirrorSignOut, intent, hostUp, setHostHere, hubIsLocal,
  MIRROR_ROLES, buildingRoles, type WireState, type WireRx, type WireSlip, type WireVisit,
  type WireDoctor,
} from '../building'
import { ROLE_NAME, ROLE_SD, ROLE_WHAT, can, type Role } from '../roles'
import { roleIsOn } from '../staff'
import { VITALS, INSTANT, type VitalDef } from '../data/vitals'
import Tour from '../ui/Tour'
import { tourFor, tourSeen } from '../tour'
import { readQrPayload } from '../print/qr'
import { printToken } from '../print/print'
import { paper } from '../paper'
import { Mark, IcMoney, IcQueue, IcPill, IcChart, IcScan, IcUser, IcWarn } from '../ui/art'
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
  counter: IcMoney, compounder: IcQueue, pharmacy: IcPill, clinicadmin: IcChart,
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
  const [err, setErr] = useState('')
  const [tour, setTour] = useState(false)

  const out = () => {
    mirrorSignOut()
    try { sessionStorage.removeItem(ROLE_KEY) } catch { /* ignore */ }
    setRole(null); setS(null)
  }

  useEffect(() => {
    mirrorSubscribe({
      state: setS, rx: setRx, up: setUp,
      err: w => {
        setErr(w)
        setTimeout(() => setErr(''), 5000)
      },
      // the clinic machine restarted and forgot this sitting, and the PIN is
      // no longer in memory: the honest place to be is the door, not a screen
      // whose buttons quietly do nothing
      expired: () => {
        try { sessionStorage.removeItem(ROLE_KEY) } catch { /* ignore */ }
        setRole(null); setS(null)
      },
    })
  }, [])

  return (
    <div className="app mirror">
      <header className="top">
        <div className="brandwrap">
          <Mark size={26} className="mk" />
          <div className="who2">
            <b>{APP.en}</b>
            {/* "not answering" is wrong on the wire's own machine before any
                record holder exists: nothing is failing to answer, nothing has
                been chosen yet. Saying it that way sends an installer looking
                for a fault that is not there. */}
            <span>{up ? 'on the clinic’s wifi'
                      : hubIsLocal() ? 'no records machine chosen yet'
                      : 'clinic machine not answering'}</span>
          </div>
        </div>
        <div className="counts">
          <span className={'hostdot' + (up ? ' up' : '')} title={up ? 'connected' : 'off'} />
          {role && (
            <>
              <span className={'rolechip ' + role} style={{ cursor: 'default' }}>
                {ROLE_NAME[role]} <i className="sd">{ROLE_SD[role]}</i>
              </span>
              {tourFor(role).length > 0 &&
                <button className="lnk paper" onClick={() => setTour(true)}>Help</button>}
              <button className="lnk paper" onClick={out}>Sign out</button>
            </>
          )}
        </div>
      </header>

      {/* Losing the clinic machine is said in a banner, in words, on every
          signed-in screen — not with a six-pixel dot the rush will not see. */}
      {role && !up && (
        <div className="mirwarn">
          The clinic machine is not answering. What you see may be old, and
          nothing new can be saved until it is back. The paper pad takes over.
        </div>
      )}
      {err && role && <div className="mirwarn err">{err}</div>}

      {!role
        ? <MirrorDoor up={up} onIn={r => {
            setRole(r)
            if (!tourSeen(r)) setTour(true)
            try { sessionStorage.setItem(ROLE_KEY, r) } catch { /* ignore */ }
          }} />
        : !s
        ? <div className="pane"><p className="hint">
            {up ? 'Fetching the day from the clinic machine…'
                : 'The clinic machine is off or out of reach. This phone keeps no records of its own, so ask inside, or use the paper pad until it is back.'}
          </p></div>
        : role === 'counter' ? <MDesk s={s} />
        : role === 'compounder' ? <MQueue s={s} role={role} />
        : role === 'pharmacy' ? <MPharm s={s} rx={rx} />
        : <MOps s={s} />}

      {tour && role && <Tour role={role} onClose={() => setTour(false)} />}
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

  const local = hubIsLocal()

  /**
   * THE INSTALLER'S FIRST MINUTE, WHICH USED TO BE A DEAD END.
   *
   * A building's first machine starts the wire and opens the app at the wire's
   * own address. Nothing has been marked as the record holder yet, so the app
   * correctly loads as a mirror and correctly refuses every sign-in: the PINs
   * live with the records, and there are no records anywhere yet.
   *
   * What the screen SHOWED was four large role buttons that lit up under the
   * mouse and did nothing at all, with the single action that works written in
   * small grey text at the bottom. Safeer ran the building launcher on his own
   * laptop, pressed them, and reported that nothing pressed. He was right. The
   * screen was leading with the impossible and hiding the possible.
   *
   * So on the wire's own machine, with no record holder answering, the marking
   * offer IS the screen, and the roles come after it.
   */
  const setupHere = local && !up

  return (
    <div className="pane">
      {setupHere && (
        <div className="lhbox hostset">
          <h3>Set the clinic up on this computer</h3>
          <p>
            This computer is running the building's wifi, but nobody has said yet which
            machine keeps the clinic's records. Until that is settled nothing can be
            signed into and no token can be issued, here or on any phone.
          </p>
          <button className="btn wide" onClick={() => { setHostHere(true); location.reload() }}>
            This computer holds the clinic's records
          </button>
          <small>
            The records will live in this browser, at this address. Open the clinic here
            every evening from the same shortcut and every phone on the wifi follows it.
            If the desk machine is a different computer, leave this alone and start
            Nuskho over there instead.
          </small>
        </div>
      )}

      <p className="pick" style={{ marginTop: setupHere ? 24 : 8 }}>
        {local ? 'Who is at this computer?' : 'Who is holding this phone?'}
      </p>
      {!up && (
        <p className="hint" style={{ color: '#8a5b00' }}>
          {setupHere
            ? 'None of these can open until a machine is marked above. The PINs live with the records, and there are no records yet.'
            : 'The clinic machine is not answering. Signing in needs it on, because the PINs live there and nowhere else.'}
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
            {/* Only the jobs this building has, as the RECORD HOLDER reports
                them on its heartbeat. Reading this phone's own storage meant a
                phone that had never been used knew nothing, defaulted to the
                doctor alone, and was offered no door at all. Until the host has
                been heard we fall back to this phone's own idea, and then to
                every mirror role, because a door that is disabled anyway is
                better than an empty screen with no explanation. */}
            {(buildingRoles() ?? MIRROR_ROLES.filter(roleIsOn)).map(r => {
              const I = ICON[r]
              const off = busy || !up
              return (
                <button key={r} className={'whobtn ' + r} disabled={off}
                        // A disabled button that still lifts and turns green under
                        // the mouse is a lie told sixty times an evening. The arrow
                        // goes too: it is the part that says "this leads somewhere".
                        title={off && !busy ? 'The clinic machine is not answering' : undefined}
                        onClick={() => { setBad(''); go(r, '') }}>
                  <span className="wi"><I size={20} /></span>
                  <span className="n">{ROLE_NAME[r]} <i className="sd">{ROLE_SD[r]}</i></span>
                  <small>{ROLE_WHAT[r]}</small>
                  <span className="go">{off && !busy ? '' : '→'}</span>
                </button>
              )
            })}
          </div>
          {bad && <p className="usable bad">{bad}</p>}
          {/* On a phone this is the rule. On the wire's own machine, before it
              has been marked, telling the person to go and sign in "at the
              clinic machine" is telling him to walk to the chair he is sitting
              in, which is how a screen loses someone's trust. */}
          <p className="hint">
            {setupHere
              ? 'The doctor and the Nuskho role sign in once this computer is marked above, or at whichever machine holds the records.'
              : 'The doctor and the Nuskho role sign in at the clinic machine itself, not on a phone.'}
          </p>
          {/* The other half of the same offer, and a far rarer case: this
              machine runs the wire AND another machine is already answering as
              the record holder. That is legitimate, a small PC can run nothing
              but the wire, so the offer stays. It stays SMALL and it keeps its
              confirm, because taking it here would make a second record holder
              with an empty database and split the evening's tokens in two.
              Phones never see this at all: hubIsLocal() is answered by the wire
              from the request's own address. */}
          {local && up && (
            <p className="hint" style={{ marginTop: 18, opacity: .85 }}>
              This computer is running the wire, and another machine is answering as the
              one that holds the records. If that is wrong and the records belong
              here, <button className="lnk" onClick={() => {
                if (confirm('Mark THIS computer as the one that holds the records?\n\nAnother machine is already answering as the record holder. Two record holders means two separate sets of records, and tokens issued tonight would split between them.\n\nOnly do this if the other machine is wrong.')) {
                  setHostHere(true)
                  location.reload()
                }
              }}>mark it and reload</button>.
            </p>
          )}
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
        <label><IcMoney size={13} /> Fee taken now &nbsp; في</label>
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

/**
 * WHAT THIS PHONE CAN WRITE DOWN, AND IT USED TO BE FOUR THINGS.
 *
 * Blood pressure, temperature, pulse and weight, hard-coded here as four
 * strings, while the machine in the room knew five vitals and six tests. So the
 * compounder working from a phone could not record a sugar, could not record an
 * HbA1c, and therefore never saw the charge for either — although the tour that
 * runs on this very phone promises "the charge appears on your queue, and you
 * take it as the patient leaves".
 *
 * Both lists now come from `data/vitals.ts`, which is the one place that knows
 * what a clinic measures. Adding a test there now reaches the phone by itself.
 */
/**
 * One reading on the phone, in the same shape the room uses.
 *
 * A blood pressure is TWO numbers and the room has always taken it as two
 * boxes. Rendering it as one on the phone, with the definition's own three
 * character limit, silently cut "150/95" down to "150" — a plausible reading,
 * the wrong reading, and nothing on screen said so. Everything else here is
 * one box, and both come from the one definition list.
 */
function VBox({ d, vit, set }: {
  d: VitalDef
  vit: Record<string, string>
  set: (f: (p: Record<string, string>) => Record<string, string>) => void
}) {
  const parts = (vit[d.key] ?? '').split('/')
  const put = (i: number, x: string) => {
    const a = [parts[0] ?? '', parts[1] ?? '']
    a[i] = x.replace(/[^0-9.]/g, '').slice(0, d.max)
    set(p => ({ ...p, [d.key]: a[1] || i === 1 ? `${a[0]}/${a[1]}` : a[0] }))
  }
  return (
    <div className="fld" style={{ minWidth: 118, flex: 1 }}>
      <label>{d.short}{d.unit ? ` ${d.unit}` : ''}</label>
      {d.pair ? (
        <div className="row" style={{ gap: 6, alignItems: 'center' }}>
          <input inputMode="numeric" maxLength={d.max} placeholder="upper"
                 value={parts[0] ?? ''} onChange={e => put(0, e.target.value)} />
          <span style={{ opacity: .5 }}>/</span>
          <input inputMode="numeric" maxLength={d.max} placeholder="lower"
                 value={parts[1] ?? ''} onChange={e => put(1, e.target.value)} />
        </div>
      ) : (
        <input inputMode="decimal" maxLength={d.max} value={vit[d.key] ?? ''}
               onChange={e => set(p => ({ ...p, [d.key]: e.target.value.slice(0, d.max) }))} />
      )}
    </div>
  )
}

function MQueue({ s, role }: { s: WireState; role: Role }) {
  const [open, setOpen] = useState<string | null>(null)
  const [vit, setVit] = useState<Record<string, string>>({})
  const [closing, setClosing] = useState<string | null>(null)
  const [busy, setBusy] = useState('')

  /** The tests are the doctor's to order and this role's to do. A counter
   *  clerk on this screen sees the cuff and nothing else. */
  const mayTest = can('tests', role)

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
                {VITALS.map(d => <VBox key={d.key} d={d} vit={vit} set={setVit} />)}
              </div>

              {/* THE TESTS THE DOCTOR ASKED FOR, DONE HERE, NOW.
                  He does them while the patient is still sitting there, reads
                  the number out, and the doctor writes it on the slip. Writing
                  it here is what raises the charge below: no reading, no
                  charge, and there is no other way to bill one. */}
              {mayTest && (
                <>
                  <p className="hint" style={{ margin: '10px 0 4px' }}>
                    Tests done here in the room, if the doctor asked
                  </p>
                  <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                    {INSTANT.map(d => <VBox key={d.key} d={d} vit={vit} set={setVit} />)}
                  </div>
                </>
              )}
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
          {/* Money for a test done in the room, taken at the door on the way
              out, by the person who did it. Green, because it is coming in. */}
          {mayTest && !v.testsPaid && (v.tests?.length ?? 0) > 0 && (
            <div className="collect">
              <b>Take Rs {v.tests!.reduce((n, t) => n + t.amount, 0)} for the
                test{v.tests!.length === 1 ? '' : 's'}</b>
              <span>{v.tests!.map(t => `${t.en} Rs ${t.amount}`).join(' · ')}</span>
              <button className="btn" disabled={busy === v.id} onClick={async () => {
                setBusy(v.id)
                await intent('markTestsPaid', { visitId: v.id })
                setBusy('')
              }}>Received</button>
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
  // A shop renting space in the building is not the clinic's counter and is
  // not shown the clinic's day. See store.ts.
  if (s.store === 'rented') return <MShop />
  return <MOurCounter s={s} rx={rx} />
}

/**
 * THE RENTED SHOP'S PHONE.
 *
 * It holds nothing until a patient puts his paper on the counter, and it holds
 * one prescription at a time. The day's list is not hidden from this screen, it
 * was never sent to this device: the record holder refuses to push it (see
 * shapeFor in building.ts), so no bug here and no curiosity here can produce
 * it.
 */
function MShop() {
  const [q, setQ] = useState('')
  const [slip, setSlip] = useState<WireSlip | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const scanned = (v: string) => readQrPayload(v) ?? v.replace(/[^0-9]/g, '')

  async function look(code: string) {
    if (!code) return
    setBusy(true)
    const r = await intent('openSlip', { code })
    setBusy(false)
    if (r.ok === false) { setSlip(null); setMsg(String(r.why ?? 'Not found.')); return }
    setMsg(''); setSlip(r.slip as WireSlip)
  }

  /** Every tick goes to the record holder and the slip is read back, so what is
   *  on this screen is what is in the clinic's database and never a local copy
   *  drifting away from it. */
  async function act(kind: 'setGiven' | 'giveAll' | 'reopen', p: Record<string, unknown>) {
    if (!slip) return
    setBusy(true)
    await intent(kind, { visitId: slip.id, ...p })
    setBusy(false)
    await look(slip.code)
  }

  return (
    <div className="pane">
      <h2><IcScan size={17} /> The number on the patient's slip</h2>
      <div className="fld">
        <input value={q} inputMode="numeric" autoFocus
               placeholder="scan the square, or type the number"
               style={{ fontSize: 22, letterSpacing: 4, fontWeight: 700 }}
               onChange={e => { const v = scanned(e.target.value); setQ(v); setMsg(''); if (v.length >= 5) look(v) }}
               onKeyDown={e => { if (e.key === 'Enter') look(scanned(q)) }} />
      </div>
      {msg && <p className="hint" style={{ color: '#8a5b00' }}>{msg}</p>}

      {!slip && !msg && (
        <p className="hint">
          One prescription at a time, the one in your hand. This shop is not shown
          the clinic's patients and this phone is never sent them.
        </p>
      )}

      {slip && (
        <div className="line" style={slip.dispensedAt ? { opacity: .62 } : undefined}>
          <div className="hd">
            <div>
              <b>Token {slip.token} · {slip.name}</b>
              <small>No. {slip.code}{slip.dispensedAt ? ' · given ✓' : ` · ${slip.lines.length} medicine${slip.lines.length === 1 ? '' : 's'}`}</small>
            </div>
          </div>
          {slip.lines.map((l, i) => (
            <div className="row pline" key={i}
                 style={{ alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: '1px solid #eef2f0' }}>
              <button className={'chip tickbtn ' + (l.given !== undefined ? 'on' : '')} disabled={busy}
                      onClick={() => act('setGiven', { index: i, given: l.given !== undefined ? null : l.n })}>
                {l.given !== undefined ? '✓' : '+'}
              </button>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14 }}>{l.brand} {l.strength}</b>
                <small style={{ display: 'block', color: 'var(--mut)' }}>
                  {l.n > 0 ? `${l.n} ${l.unit} · ${l.days} days` : l.unit}
                  {l.given !== undefined && l.n > 0 && l.given < l.n ? ` · gave ${l.given}, short ${l.n - l.given}` : ''}
                </small>
              </div>
            </div>
          ))}
          <div className="row" style={{ marginTop: 10 }}>
            {!slip.dispensedAt
              ? <button className="btn" disabled={busy} onClick={() => act('giveAll', {})}>All given · handed over</button>
              : <button className="lnk" disabled={busy} onClick={() => act('reopen', {})}>reopen</button>}
            <button className="btn ghost" onClick={() => { setSlip(null); setQ(''); setMsg('') }}>
              Next patient
            </button>
          </div>
        </div>
      )}
      <p className="hint">
        A slip scanned twice says when it was given rather than raising an alarm: the person
        asking usually lost a box, not their honesty.
      </p>
    </div>
  )
}

function MOurCounter({ s, rx }: { s: WireState; rx: WireRx }) {
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
                <small>No. {v.code}{done ? ' · given ✓' : ` · ${lines.length} medicine${lines.length === 1 ? '' : 's'}`}</small>
              </div>
              <span className="lnk">{isOpen ? 'close' : done ? 'given ✓' : 'open'}</span>
            </div>
            {isOpen && (
              <>
                {lines.map((l, i) => (
                  <div className="row pline" key={i}
                       style={{ alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: '1px solid #eef2f0' }}>
                    <button className={'chip tickbtn ' + (l.given !== undefined ? 'on' : '')}
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
            <small>{n} token{n === 1 ? '' : 's'} · {printed} printed · Rs {collected} taken</small>
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
