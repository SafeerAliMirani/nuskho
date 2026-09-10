import { useEffect, useMemo, useRef, useState } from 'react'
import {
  mirrorSubscribe, mirrorAuth, mirrorSignOut, intent, hostUp, setHostHere, hubIsLocal,
  MIRROR_ROLES, buildingRoles, buildingDocs, type WireState, type WireRx, type WireSlip,
  type WireVisit, type WireDoctor, type WireMed, type WireOpenVisit, type IntentKind, type WirePerson,
} from '../building'
import { ROLE_NAME, ROLE_SD, ROLE_WHAT, can, type Role } from '../roles'
import { roleIsOn } from '../staff'
import { VITALS, INSTANT, filled, vitalText, firstImpossible, impossible, incomplete, type VitalDef } from '../data/vitals'
import { cleanDecimal } from '../fields'
import Tour from '../ui/Tour'
import { tourFor, tourSeen } from '../tour'
import { readQrPayload } from '../print/qr'
import { printToken, printSlip } from '../print/print'
import { paper } from '../paper'
import { Mark, IcMoney, IcQueue, IcPill, IcChart, IcScan, IcUser, IcWarn, FormIcon } from '../ui/art'
import { CareLine } from '../ui/CareLine'
import { FixPatient } from '../ui/FixPatient'
import { parseCode } from '../code'
import { phoneKey } from '../household'
import type { Patient } from '../types'
import type { PatientPatch } from '../patient'
import { courseCheck } from '../course'
import { isChild } from '../data/vitals'
import { APP } from '../profile'
import Broke from '../ui/Broke'
import Toasts from '../ui/Toasts'
import { whyItFailed } from '../fail'
import { Note } from '../ui/Note'
import type { TokenSlip } from '../print/token'
import { signal } from '../ui/bus'
import { primeSound } from '../ui/sound'
import { searchDictionary, dictLine, type DictEntry } from '../data/dictionary'
import { sideMatters, TIMES } from '../data/forms'
import { sameMolecule } from '../data/who'
import { labTests, adviceList } from '../data/formulary'
import { sosReasons } from '../data/sos'
import { lineIsEmpty } from '../rx'
import type { SlipData } from '../print/renderSlip'
import type { RxLine } from '../types'

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
  // same icon Lock.tsx uses for the doctor at the clinic machine: one person,
  // one picture, whichever door he walks through
  doctor: IcUser,
}

const LABEL: Record<string, string> = {
  waiting: 'waiting', done: 'printed ✓', seen: 'seen', left: 'left',
  cancelled: 'cancelled', referred: 'sent on',
}

const ROLE_KEY = 'nuskho.mirrorRole'
/** Which room this doctor's phone belongs to, beside the role in the same
 *  sitting. Restored on reload exactly like the role is, just below. */
const DOC_KEY = 'nuskho.mirrorDoc'

export default function Mirror() {
  const [role, setRole] = useState<Role | null>(() => {
    try {
      const r = sessionStorage.getItem(ROLE_KEY)
      return r && (MIRROR_ROLES as string[]).includes(r) ? (r as Role) : null
    } catch { return null }
  })
  const [docId, setDocId] = useState<string | null>(() => {
    try { return sessionStorage.getItem(DOC_KEY) } catch { return null }
  })
  const [s, setS] = useState<WireState | null>(null)
  const [rx, setRx] = useState<WireRx>([])
  const [rawUp, setRawUp] = useState(hostUp())
  /**
   * What the header SHOWS, which deliberately lags what the wire KNOWS when
   * the news is bad. iOS drops the WebSocket on every screen lock and it
   * reconnects by itself within a heartbeat or two, so without this lag the
   * compounder read "clinic machine not answering" sixty times an evening
   * for a condition that healed before he finished the sentence. Bad news
   * waits six seconds; good news shows instantly.
   */
  const [up, setUp] = useState(hostUp())
  useEffect(() => {
    if (rawUp) { setUp(true); return }
    const t = setTimeout(() => setUp(false), 6000)
    return () => clearTimeout(t)
  }, [rawUp])
  const [err, setErr] = useState('')
  const [tour, setTour] = useState(false)

  const out = () => {
    mirrorSignOut()
    try { sessionStorage.removeItem(ROLE_KEY); sessionStorage.removeItem(DOC_KEY) } catch { /* ignore */ }
    setRole(null); setDocId(null); setS(null)
  }

  useEffect(() => {
    mirrorSubscribe({
      state: setS, rx: setRx, up: setRawUp,
      err: w => {
        setErr(w)
        setTimeout(() => setErr(''), 5000)
      },
      // the clinic machine restarted and forgot this sitting, and the PIN is
      // no longer in memory: the honest place to be is the door, not a screen
      // whose buttons quietly do nothing
      expired: () => {
        try { sessionStorage.removeItem(ROLE_KEY); sessionStorage.removeItem(DOC_KEY) } catch { /* ignore */ }
        setRole(null); setDocId(null); setS(null)
      },
    })
  }, [])

  return (
    <div className="app mirror">
      {/* The chimes. This was missing entirely, so the doctor's bell reached a
          phone that had no way to show it, and the compounder holding that
          phone was the one person in the building the bell was FOR. */}
      <Toasts />
      {/* A phone breaks the same ways a laptop does, and the person holding it
          is further from anybody who could tell them what happened. */}
      <Broke />
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
              {/* tourFor('doctor') is written for the HOST screens (the queue,
                  the rooms strip, My figures) and none of those controls are
                  on this phone. A ring pointing at a control that is not
                  there is the exact bug commit c108939 fixed, so this screen
                  gets no tour yet rather than a wrong one. */}
              {role !== 'doctor' && tourFor(role).length > 0 &&
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
        ? <MirrorDoor up={up} onIn={(r, doctorId) => {
            setRole(r); setDocId(doctorId ?? null)
            // doctor-mirror steps are host-only (see the Help gate above): never
            // auto-open a tour that would ring nothing on this phone
            if (r !== 'doctor' && !tourSeen(r)) setTour(true)
            try {
              sessionStorage.setItem(ROLE_KEY, r)
              if (doctorId) sessionStorage.setItem(DOC_KEY, doctorId)
              else sessionStorage.removeItem(DOC_KEY)
            } catch { /* ignore */ }
          }} />
        : !s
        ? <div className="pane"><p className="hint">
            {up ? 'Fetching the day from the clinic machine…'
                : 'The clinic machine is off or out of reach. This phone keeps no records of its own, so ask inside, or use the paper pad until it is back.'}
          </p></div>
        : role === 'counter' ? <MDesk s={s} />
        : role === 'compounder' ? <MQueue s={s} role={role} />
        : role === 'pharmacy' ? <MPharm s={s} rx={rx} />
        : role === 'doctor' ? <MDr s={s} docId={docId} />
        : role === 'clinicadmin' ? <MOps s={s} />
        /* Every mirror role above is named. A role this switch has never
           heard of used to fall through to the clinic admin's figures, which
           is a screen quietly shown to the wrong job. A new role added to
           MIRROR_ROLES without a screen now says so instead of guessing. */
        : <div className="pane"><p className="hint">
            This job has no phone screen yet. Sign out and pick another role,
            or use the clinic machine.
          </p></div>}

      {tour && role && <Tour role={role} onClose={() => setTour(false)} />}
    </div>
  )
}

/* ------------------------------------------------------------------- the door */

/** An empty list is not an answer, it is the absence of one. */
const mine = (rs: Role[]): Role[] => (rs.length ? rs : MIRROR_ROLES)

function MirrorDoor({ up, onIn }: { up: boolean; onIn: (r: Role, doctorId?: string) => void }) {
  const [want, setWant] = useState<Role | null>(null)
  const [pin, setPin] = useState('')
  const [bad, setBad] = useState('')
  const [busy, setBusy] = useState(false)
  /** Doctor tapped, more than one room in this building: which room this phone
   *  is asking for, remembered through the PIN step below. */
  const [askDoc, setAskDoc] = useState(false)
  const [wantDoc, setWantDoc] = useState<string | undefined>(undefined)

  async function go(r: Role, p: string, doctorId?: string) {
    // Wake the audio hardware INSIDE the tap, before any await. WebKit only
    // honours AudioContext.resume() during a real user gesture, so without
    // this line the doctor's bell is silent on every iPhone mirror for the
    // life of the tab: the context is created suspended inside a WebSocket
    // handler and can never be resumed. Chrome forgave this; Safari does not.
    // Same call, same reason, as Lock.tsx's choose().
    primeSound()
    setBusy(true)
    const res = await mirrorAuth(r, p, doctorId)
    setBusy(false)
    if (res.ok) { onIn(r, res.doctorId); return }
    // the empty first tap just found out this role HAS a PIN: show its box
    if (p === '' && res.why.includes('right')) { setWant(r); setWantDoc(doctorId); setBad(''); return }
    setBad(res.why); setPin('')
  }

  /** Doctor, chosen room: one tap here starts the same PIN dance every other
   *  role goes through, now carrying which room it is for. */
  function pickDoctor(doctorId: string) {
    setAskDoc(false)
    go('doctor', '', doctorId)
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
      {askDoc ? (
        <>
          <div className="whoback">
            <b>{ROLE_NAME.doctor} <span className="sd">{ROLE_SD.doctor}</span></b>
            <button className="lnk" onClick={() => setAskDoc(false)}>not me</button>
          </div>
          <p className="pick">Which doctor?</p>
          <div className="chips">
            {buildingDocs().map(d => (
              <button key={d.id} className="chip mdr-docpick" disabled={busy}
                      onClick={() => pickDoctor(d.id)}>
                {d.nameEn} · Room {d.room}
              </button>
            ))}
          </div>
        </>
      ) : want ? (
        <>
          <div className="whoback">
            <b>{ROLE_NAME[want]} <span className="sd">{ROLE_SD[want]}</span></b>
            <button className="lnk" onClick={() => { setWant(null); setBad('') }}>not me</button>
          </div>
          <div className="fld">
            <label>PIN</label>
            <input type="password" inputMode="numeric" autoFocus value={pin} maxLength={8}
                   onChange={e => { setPin(e.target.value.replace(/[^0-9]/g, '')); setBad('') }}
                   onKeyDown={e => { if (e.key === 'Enter' && pin) go(want, pin, wantDoc) }} />
          </div>
          {bad && <p className="usable bad">{bad}</p>}
          <button className="btn wide" disabled={!pin || busy} onClick={() => go(want, pin, wantDoc)}>
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
                better than an empty screen with no explanation.

                THE THIRD FALLBACK WAS WRITTEN DOWN HERE AND NOT WRITTEN IN
                CODE. A phone out of its box has an empty staff list, so it
                answers "doctor", and a doctor is not a mirror role. The filter
                below therefore came back empty and the installer got the exact
                screen this paragraph promised he would not: a heading, a
                sentence, and nothing under it. He rings up, and the first
                minute of the wire is a phone call. */}
            {(buildingRoles() ?? mine(MIRROR_ROLES.filter(roleIsOn))).map(r => {
              const I = ICON[r]
              const off = busy || !up
              return (
                <button key={r} className={'whobtn ' + r} disabled={off}
                        // A disabled button that still lifts and turns green under
                        // the mouse is a lie told sixty times an evening. The arrow
                        // goes too: it is the part that says "this leads somewhere".
                        title={off && !busy ? 'The clinic machine is not answering' : undefined}
                        onClick={() => {
                          setBad('')
                          // several rooms: ask which one BEFORE the PIN, so the
                          // very first mirrorAuth call already carries it
                          if (r === 'doctor' && buildingDocs().length > 1) { setAskDoc(true); return }
                          const solo = r === 'doctor' && buildingDocs().length === 1 ? buildingDocs()[0].id : undefined
                          go(r, '', solo)
                        }}>
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
  const [sex, setSex] = useState<'' | 'M' | 'F'>('')
  const [city, setCity] = useState('')
  /* THE PHONE, AND THE FAMILY UNDER IT. The desk collected a phone from the
     first day; this screen never asked, so every patient taken in on a phone
     had none, and the household list could not exist for them. Now it asks,
     and asks the record holder who is already on the books under it. */
  const [phone, setPhone] = useState('')
  const [fam, setFam] = useState<WirePerson[]>([])
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

  // the household, asked for as the number is typed: seven digits, then a
  // pause. The record holder answers a short list or nothing.
  useEffect(() => {
    if (!phoneKey(phone)) { setFam([]); return }
    let live = true
    const t = setTimeout(async () => {
      try {
        const r = await intent('household', { phone })
        if (live && r.ok !== false) setFam((r.people as WirePerson[]) ?? [])
      } catch { if (live) setFam([]) }
    }, 350)
    return () => { live = false; clearTimeout(t) }
  }, [phone])

  /** `useCode` is a family member tapped from the household list: his number
   *  goes in place of whatever is in the slip box, and the token lands on his
   *  old record. Everything else about the token is as the desk set it. */
  async function fire(kind: 'addPatient' | 'openByCode', useCode?: string) {
    if (busy) return
    setBusy(true); setMsg('')
    const r = await intent(kind, {
      code: useCode ?? code, name, phone, age, sex: sex || undefined, city, urgent,
      amount: +amt || 0, feeState: fstate, doctorId: sel?.id,
      wantHostPrint: !paper().token,
    })
    setBusy(false)
    if (r.ok === false) { setMsg(String(r.why)); return }
    setMsg(`Token ${r.token} issued${sel ? ` for Room ${sel.room}` : ''}.`)
    setName(''); setAge(''); setSex(''); setCode(''); setPhone(''); setFam([]); setUrgent(false)
    setAmt(String(rate || '')); setFstate('paid')
    if (r.slip && paper().token) printToken(r.slip as TokenSlip)
  }

  return (
    <div className="pane">
      {s.multi && <MRooms s={s} picked={selDoc || sel?.id} tokensTo={sel} onPick={setSelDoc} />}

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
      <div className="fld"><label>Phone — optional</label>
        <input value={phone} inputMode="numeric"
               onChange={e => setPhone(e.target.value.replace(/[^0-9+ ]/g, '').slice(0, 15))} /></div>
      {fam.length > 0 && (
        <div className="famlist">
          <b>This phone is already here — {fam.length === 1 ? 'is it the same person?' : 'which one is it?'}</b>
          <div className="chips">
            {fam.map(p => (
              <button key={p.code} className="chip fam" disabled={busy} onClick={() => fire('openByCode', p.code)}>
                <IcUser size={13} /> {[p.name, p.code, p.age, p.sex === 'M' ? 'man' : p.sex === 'F' ? 'woman' : ''].filter(Boolean).join(' · ')}
                {p.city ? <small> · {p.city}</small> : null}
              </button>
            ))}
          </div>
          <span className="unit">Tap the person for a token on their old number. Somebody new in the
            family: fill the name and add as new.</span>
        </div>
      )}
      <div className="row">
        <div className="fld"><label>Age — optional</label>
          <input value={age} inputMode="numeric" maxLength={3}
                 onChange={e => {
                   const v = e.target.value.replace(/\D/g, '').slice(0, 3)
                   if (v === '' || +v <= 120) setAge(v)
                 }} /></div>
        <div className="fld"><label>City — optional</label>
          <input value={city} onChange={e => setCity(e.target.value)} /></div>
      </div>
      {/* the desk collects this; the phone at the door did not, so every
          phone-registered patient printed with a blank beside the age */}
      <div className="fld"><label>Man or woman — optional</label>
        <div className="chips">
          {([['M', 'Man'], ['F', 'Woman']] as const).map(([k, l]) => (
            <button key={k} className={'chip' + (sex === k ? ' have' : '')}
                    onClick={() => setSex(sex === k ? '' : k)}>{l}</button>
          ))}
        </div>
      </div>
      <label className="check urgentbox">
        <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
        <span><IcWarn size={15} /> <b>Cannot wait</b></span>
      </label>
      {/* no fee box in a clinic that does not charge; the record holder says so */}
      {s.fees !== false && (
      <div className="fld feerow">
        <label><IcMoney size={13} /> Fee taken now &nbsp; فيس</label>
        <div className="row">
          <input value={amt} inputMode="numeric" placeholder="Rs"
                 onChange={e => setAmt(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          {([['paid', 'Received'], ['due', 'Not yet'], ['waived', 'Free']] as const).map(([k, l]) => (
            <button key={k} className={'chip' + (fstate === k ? ' have' : '')}
                    onClick={() => { setFstate(k); if (k === 'waived') setAmt('0') }}>{l}</button>
          ))}
        </div>
      </div>
      )}
      <button className="btn wide" disabled={!name.trim() || busy} onClick={() => fire('addPatient')}>
        {busy ? 'Asking the clinic machine…' : <>Add to queue &nbsp; لائين ۾ شامل ڪريو</>}
      </button>
      {msg && <p className="usable" style={{ marginTop: 8 }}>{msg}</p>}

      <h2 style={{ marginTop: 18 }}><IcQueue size={17} /> Today — {s.visits.length}</h2>
      <div className="daybar">
        <span><b>{s.sums.printed}</b> printed</span>
        <span><b>{s.sums.waiting}</b> waiting</span>
        {s.fees !== false && <span className="money"><b>Rs {s.sums.collected}</b> in hand</span>}
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
          <Reprint v={v} />
          <Refund v={v} onDone={() => undefined} />
        </div>
      ))}
    </div>
  )
}

/**
 * THE ROOMS, ON A PHONE, WITH THE SWITCH THAT DECIDES WHERE TOKENS GO.
 *
 * The `setSitting` intent has existed since the wire was built and the host has
 * always obeyed it. No screen ever sent one. So on the evening Dr Soomro does
 * not come in, the counter clerk standing at the door with a phone had to walk
 * to the clinic computer to say so, and until he did every token he issued
 * could still be pointed at an empty room.
 *
 * The room's own strip is two controls on one card. A phone has no room for
 * that, so the chips pick and ONE line underneath switches whichever room is
 * picked. A not-sitting room is still tappable here, which it is not in the
 * room: on a phone it is the only way back.
 */
function MRooms({ s, picked, tokensTo, onPick }: {
  s: WireState
  /** the chip the thumb is on. NOT the room tokens go to: see below. */
  picked?: string
  /** the room the next token will actually be issued for. Always a sitting one. */
  tokensTo?: WireDoctor
  onPick: (id: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [why, setWhy] = useState('')
  /**
   * THE PICKED ROOM IS NOT THE ROOM TOKENS GO TO, AND KEEPING THEM APART IS THE
   * WHOLE OF THIS COMPONENT.
   *
   * The first version drove the switch from the token room, which is by
   * definition a SITTING room. So the moment somebody marked Dr Soomro absent,
   * the highlight jumped to Room 1 and the link underneath now offered to send
   * Dr Khan home. There was no way back: the one switch that could bring
   * Soomro in had stopped pointing at him.
   *
   * The chip decides what the switch acts on and nothing else. The fee and the
   * next token still follow a sitting room, exactly as they did.
   */
  const on = s.doctors.find(d => d.id === picked) ?? tokensTo ?? s.doctors[0]

  async function flip() {
    if (!on || busy) return
    setBusy(true); setWhy('')
    const r = await intent('setSitting', { doctorId: on.id, sitting: !on.sitting })
    setBusy(false)
    if (r.ok === false) setWhy(String(r.why))
  }

  return (
    <>
      <div className="chips" style={{ marginBottom: 6 }}>
        {s.doctors.map(d => (
          <button key={d.id} className={'chip' + (d.id === on?.id ? ' have' : '') + (d.sitting ? '' : ' off')}
                  onClick={() => onPick(d.id)}>
            R{d.room} {d.nameEn}{d.sitting ? ` \u00b7 Rs ${d.fee}` : ' \u00b7 not in'}
          </button>
        ))}
      </div>
      {on && (
        <p className="hint" style={{ marginTop: 0 }}>
          {on.sitting
            ? <>Tokens go to Room {on.room}. </>
            : <>Room {on.room} is not taking tokens{tokensTo && tokensTo.id !== on.id
                ? <>, they go to Room {tokensTo.room}</> : null}. </>}
          <button className="lnk" disabled={busy} onClick={flip}>
            {busy ? 'telling the clinic machine\u2026'
              : on.sitting ? `${on.nameEn} is not in tonight` : `${on.nameEn} is sitting after all`}
          </button>
        </p>
      )}
      {why && <p className="usable bad" style={{ marginTop: 4 }}>{why}</p>}
    </>
  )
}

/**
 * A SECOND COPY OF A TOKEN, FROM THE PHONE THAT ISSUED IT.
 *
 * The `reprint` intent has existed as long as the wire and no screen sent one.
 * A thermal receipt is a small piece of paper handed to a person standing in a
 * corridor, and it gets dropped, blown off a bench and handed to a child. The
 * clerk holding the phone that printed it could not print it again without
 * walking to the clinic computer.
 *
 * Never a new number: the same token, the same fee, the same room. A reprint
 * that issued a second number would put one patient in the queue twice.
 */
function Reprint({ v }: { v: WireVisit }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  /**
   * WHICH MACHINE HAS THE PRINTER.
   *
   * Almost always the clinic machine: the thermal roll sits on the desk beside
   * it and a phone in a corridor has nothing attached. So this asks the HOST to
   * print, exactly as issuing a token from this phone already does, and prints
   * here only on the rare tablet that has its own.
   *
   * The first version refused to render at all unless THIS device had a
   * printer, which hid the control on every phone in every clinic, which is
   * every case it was built for.
   */
  const here = paper().token
  return (
    <div className="rprow">
      <button className="lnk qclose" disabled={busy} onClick={async () => {
        setBusy(true); setMsg('')
        const r = await intent('reprint', { visitId: v.id, wantHostPrint: !here })
        setBusy(false)
        if (r.ok === false) { setMsg(String(r.why)); return }
        if (here && r.slip) printToken(r.slip as TokenSlip)
        setMsg(`Token ${v.token} printed again.`)
      }}>{busy ? 'asking\u2026' : 'print the token again'}</button>
      {msg && <span className="rpmsg">{msg}</span>}
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
  /* THE SAME STRING THE DESK WOULD HAVE STORED.
     This wrote a systolic-only reading as "180" with no slash, while the
     clinic machine writes "180/". The same half-taken blood pressure then
     printed as a bare unlabelled 180 from one device and not at all from the
     other, which is worse than either answer on its own. */
  const put = (i: number, x: string) => {
    const a = [parts[0] ?? '', parts[1] ?? '']
    a[i] = x.replace(/[^0-9.]/g, '').slice(0, d.max)
    set(p => ({ ...p, [d.key]: a[0] || a[1] ? `${a[0]}/${a[1]}` : '' }))
  }
  const raw = vit[d.key] ?? ''
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
        <input inputMode="decimal" maxLength={d.max} value={raw}
               onChange={e => set(p => ({ ...p, [d.key]: cleanDecimal(e.target.value).slice(0, d.max) }))} />
      )}
      {impossible(d, raw)
        ? <span className="unit" style={{ color: 'var(--bad)', fontWeight: 700 }}>
            not a possible reading — the slip will not print</span>
        : incomplete(d, raw)
        ? <span className="unit" style={{ color: 'var(--w-text)', fontWeight: 600 }}>
            only half typed — it will not print</span>
        : null}
    </div>
  )
}

function MQueue({ s, role }: { s: WireState; role: Role }) {
  const [open, setOpen] = useState<string | null>(null)
  const [vit, setVit] = useState<Record<string, string>>({})
  const [closing, setClosing] = useState<string | null>(null)
  const [busy, setBusy] = useState('')
  /** What the clinic machine refused, or never heard, in words for the person
   *  holding the phone. Cleared the moment he tries again. */
  const [err, setErr] = useState('')

  /**
   * NOTHING ON THIS PANEL CLOSES UNTIL THE CLINIC MACHINE HAS SAID YES.
   *
   * A phone on a clinic's wifi loses the wire in the corridor, by the X-ray
   * door, in the middle of a busy evening. `intent` does not throw when that
   * happens: it waits eight seconds for an answer that never comes and then
   * hands back a no, exactly as it does when the record holder refuses the
   * write. A handler that never reads that answer cannot tell a blood pressure
   * that reached the records from one that died in a phone in a corridor, and
   * this panel used to shut on both. The compounder went back to the queue
   * certain the reading was in the system, and the doctor called the patient in
   * to a slip with nothing on it.
   *
   * `done` runs on a yes and on nothing else. On a no the typed readings stay
   * in their boxes, because the alternative is asking a man to put the cuff
   * back on somebody who has already rolled his sleeve down and gone to sit
   * outside.
   */
  async function ask(
    key: string, did: string, kind: 'setVitals' | 'closeVisit',
    p: Record<string, unknown>, done: () => void,
  ): Promise<void> {
    if (busy === key) return
    setBusy(key); setErr('')
    try {
      const r = await intent(kind, p)
      if (r.ok === false) { setErr(whyItFailed(r.why, did)); return }
      done()
    } catch (e) {
      // The wire answers rather than throwing, so this is for the day somebody
      // changes that. The console keeps the real thing for whoever is looking.
      console.error('[nuskho] ' + did, e)
      setErr(whyItFailed(e, did))
    } finally {
      // Whatever the answer was. A button that never comes back is the same
      // evening lost by a slower route.
      setBusy('')
    }
  }

  /** The tests are the doctor's to order and this role's to do. A counter
   *  clerk on this screen sees the cuff and nothing else. */
  const mayTest = can('tests', role)

  return (
    <div className="pane">
      <h2><IcQueue size={17} /> The queue — {s.sums.waiting} waiting</h2>
      {[...s.visits].sort(byUrgent).map(v => (
        <div key={v.id} className="qwrap">
          <button className={'qrow' + (v.urgent && v.status === 'waiting' ? ' urgent' : '') + (v.status === 'done' ? ' done' : '')}
                  onClick={() => { setOpen(open === v.id ? null : v.id); setVit({}); setClosing(null); setErr('') }}>
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
                <button className="btn ghost" disabled={busy === 'vitals:' + v.id} onClick={() => {
                  const clean = Object.fromEntries(Object.entries(vit).filter(([, x]) => x.trim()))
                  ask('vitals:' + v.id, 'The vitals were not saved', 'setVitals',
                      { visitId: v.id, vitals: clean }, () => setOpen(null))
                }}>Save vitals · ready for the room</button>
                {closing === v.id ? (
                  <div className="chips">
                    {([['seen', 'Seen, no medicine'], ['referred', 'Sent on'], ['left', 'Left'], ['cancelled', 'Cancelled']] as const)
                      .map(([st, l]) => (
                        // An ending is a record too, and one that did not land
                        // leaves a patient sitting in the queue all evening
                        // while the phone that closed him says he has gone.
                        <button key={st} className="chip" disabled={busy === 'close:' + v.id}
                                onClick={() => ask('close:' + v.id, 'The token was not closed', 'closeVisit',
                                                   { visitId: v.id, status: st }, () => setOpen(null))}>{l}</button>
                      ))}
                  </div>
                ) : (
                  <button className="lnk" onClick={() => setClosing(v.id)}>close without prescription</button>
                )}
              </div>
              {/* Beside the button that was pressed, not at the top of a queue
                  the thumb has already scrolled past. This is the last thing he
                  reads before he walks away from the patient. */}
              {err && (
                <div className="saidno" style={{ marginTop: 8 }}>
                  <Note tone="stop" title="That did not go through">{err}</Note>
                </div>
              )}
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

/* ---------------------------------------------------------- the doctor's phone
 *
 * SINCE 11 AUG 2026, THE SECOND ROOM PRESCRIBES FROM ITS OWN SCREEN.
 *
 * Everything below composes in memory and asks the clinic machine, exactly
 * like every other mirror screen. The room check happens on the record
 * holder, not here (see building.ts): this screen only ever sees the patients
 * `openVisit` hands back, and it never gets to choose whose room it is.
 *
 * A LINE IS NEVER FROZEN HERE. `freezeLines`, `snapFor` and the medicine
 * picker's `Drug` records all stay on the record holder. This screen holds
 * `RxLine`s and a thin `WireMed` list (id, brand, strength, generic, form,
 * route). That is enough to draw the grid, never enough to print without asking.
 */

/** 0 to 1 to 2 to half to 0. The same convention Compose's dose grid uses,
 *  copied rather than shared: the two screens do not import each other. */
const cycle = (n: number) => (n === 0 ? 1 : n === 1 ? 2 : n === 2 ? 0.5 : 0)

/** Compose's own list, word for word. It is not exported there, since the two
 *  prescribing screens stay independent files, so it is repeated here. */
const NEXT_VISIT = ['in 3 days', 'in 5 days', 'in 1 week', 'in 2 weeks', 'in 1 month',
                    'only if it gets worse']

/** One medicine line, drawn and edited. Split out of MDr so the per-line
 *  JSX reads as one thing, the way VBox does for a vitals box. */
function MedLine({ l, i, medsMap, twin, onChange, onRemove }: {
  l: RxLine; i: number
  medsMap: Record<string, WireMed>
  /** the other line numbers sharing this one's molecule, if any */
  twin?: number[]
  onChange: (patch: Partial<RxLine>) => void
  onRemove: () => void
}) {
  const med = medsMap[l.drugId]
  // the snap wins once the visit is printed: it is what actually went on
  // paper, and it must read the same even if the medicine list changes later
  const brand = l.snap?.brand ?? med?.brand ?? '?'
  const strength = l.snap?.strength ?? med?.strength ?? ''
  const generic = l.snap?.generic ?? med?.generic ?? ''
  const route = l.snap?.route ?? med?.route
  const empty = lineIsEmpty(l)
  return (
    <div className="line">
      <div className="hd">
        <div><b><span className="ln">{i + 1}</span><FormIcon form={l.snap?.form ?? med?.form ?? 'other'} route={route} className="fi" />{brand} {strength}</b><small>{generic}</small></div>
        <button className="x" onClick={onRemove}>×</button>
      </div>
      <div className="dosegrid">
        {!l.sos && <>
        {TIMES.map(k => (
          <button key={k} className={`dbtn mdr-dose-${k}${l.dose[k] ? ' on' : ''}`}
                  onClick={() => onChange({ dose: { ...l.dose, [k]: cycle(l.dose[k] ?? 0) } })}>
            {l.dose[k] === 0.5 ? '½' : l.dose[k] || '-'}
            <small>{k.toUpperCase()}</small>
          </button>
        ))}
        {/* an eye or an ear asks which side; everything else asks about food,
            and never both. See sideMatters in data/forms.ts. */}
        {sideMatters(route) ? (
          <button className="dbtn on" style={{ minWidth: 64 }}
                  onClick={() => onChange({ side: l.side === undefined ? 'R' : l.side === 'R' ? 'L' : undefined })}>
            {l.side === 'R' ? 'R' : l.side === 'L' ? 'L' : 'Both'}
            <small>{route === 'ear' ? 'EAR' : 'EYE'}</small>
          </button>
        ) : (
          <button className="dbtn on" style={{ minWidth: 96 }}
                  onClick={() => onChange({ meal: l.meal === 'after' ? 'before' : l.meal === 'before' ? 'any' : 'after' })}>
            {l.meal === 'after' ? 'after' : l.meal === 'before' ? 'before' : '—'}<small>FOOD</small>
          </button>
        )}
        <div className="stp">
          <button onClick={() => onChange({ days: Math.max(1, l.days - 1) })}>−</button>
          <div className="v">{l.days} d</div>
          <button onClick={() => onChange({ days: Math.min(30, l.days + 1) })}>+</button>
        </div>
        </>}
        {l.sos && (
          <div className="stp">
            <button onClick={() => onChange({ supply: Math.max(0, (l.supply ?? 0) - 1) })}>−</button>
            <div className="v">{l.supply ?? 0} give</div>
            <button onClick={() => onChange({ supply: Math.min(200, (l.supply ?? 0) + 1) })}>+</button>
          </div>
        )}
        <button className={`dbtn sosb${l.sos ? ' on' : ''}`}
                onClick={() => onChange(l.sos
                  ? { sos: false, sosReason: undefined, supply: undefined, sosMax: undefined }
                  : { sos: true, dose: { m: 0, d: 0, n: 0 }, supply: l.supply ?? 10 })}>
          SOS<small>{l.sos ? 'SCHEDULE' : 'NEEDED'}</small>
        </button>
      </div>
      {!l.sos && (
      <div className="chips mdr-dayschips">
        {[3, 5, 7, 10, 15, 30].map(n => (
          <button key={n} className={'chip mdr-dayschip' + (l.days === n ? ' on' : '')}
                  onClick={() => onChange({ days: n })}>{n}</button>
        ))}
      </div>
      )}
      {l.sos && (
        <div className="chips sosrow">
          {sosReasons.map(r => (
            <button key={r.key} className={`chip ${l.sosReason?.en === r.en ? 'on' : ''}`}
                    onClick={() => onChange({ sosReason: { en: r.en, sd: r.sd } })}>
              {r.en.replace(/^for /, '')}
            </button>
          ))}
          <label className="sosmaxin">max/day&nbsp;
            <input inputMode="numeric" maxLength={2} value={l.sosMax ?? ''}
                   onChange={e => onChange({ sosMax: +e.target.value.replace(/\D/g, '') || undefined })} />
          </label>
        </div>
      )}
      <div className="fld" style={{ marginTop: 8, marginBottom: 0 }}>
        <input value={l.note ?? ''} maxLength={160} placeholder="note, optional"
               onChange={e => onChange({ note: e.target.value || undefined })} />
      </div>
      {empty && <div className="badmsg">{l.sos
                ? (!l.sosReason?.en ? 'Pick what it is for. This would print with no reason.' : 'Nothing to hand over: set how many to give.')
                : 'No dose set. This would print with no instruction.'}</div>}
      {twin && (
        <div className="badmsg warn">
          Same medicine as line {twin.map(k => k + 1).join(' and ')}:
          {' '}both are {generic}. Check the total dose is what you mean.
        </div>
      )}
      {/* the same arithmetic the clinic machine shows */}
      {courseCheck(l, l.snap) && <div className="badmsg warn">{courseCheck(l, l.snap)}</div>}
    </div>
  )
}

/**
 * The three fields the wire sends, shaped as the correction box expects.
 *
 * Not a Patient and never stored as one: a mirror holds no records. The id is
 * empty because nothing on this screen may address a record by id — the intent
 * carries a TOKEN and the record holder does the looking up — and the number
 * is read back out of the printed code so the box can say whose record this is
 * before anybody types.
 */
function asPatient(p: WireOpenVisit['patient']): Patient {
  return {
    id: '', num: parseCode(p.code) ?? 0, name: p.name,
    age: p.age, sex: p.sex, alert: p.alert, createdAt: 0,
  }
}

function MDr({ s, docId }: { s: WireState; docId: string | null }) {
  const me = s.doctors.find(d => d.id === docId)

  const [meds, setMeds] = useState<WireMed[]>([])
  const medsMap = useMemo(() => Object.fromEntries(meds.map(m => [m.id, m])), [meds])

  const [openId, setOpenId] = useState<string | null>(null)
  const [fixing, setFixing] = useState(false)
  const [visit, setVisit] = useState<WireOpenVisit | null>(null)
  const [lines, setLines] = useState<RxLine[]>([])
  const [diagnosis, setDiagnosis] = useState('')
  const [tests, setTests] = useState<string[]>([])
  const [advice, setAdvice] = useState<string[]>([])
  const [nextVisit, setNextVisit] = useState('')
  const [q, setQ] = useState('')

  /** MQueue's own pattern, generalised over the five things this screen can
   *  ask: a busy guard keyed by what is happening, a plain sentence the
   *  moment the clinic machine refuses or never answers, and the guard always
   *  comes back so the next tap works. */
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  async function ask(key: string, did: string, kind: IntentKind, p: Record<string, unknown>) {
    if (busy === key) return null
    setBusy(key); setErr('')
    try {
      const r = await intent(kind, p)
      if (r.ok === false) { setErr(whyItFailed(r.why, did)); return null }
      return r
    } catch (e) {
      console.error('[nuskho] ' + did, e)
      setErr(whyItFailed(e, did))
      return null
    } finally {
      setBusy('')
    }
  }

  // his own list, once, the moment this screen opens. Not a db read, a wire ask.
  useEffect(() => {
    (async () => {
      const r = await ask('meds', 'Your medicine list could not be fetched', 'myMeds', {})
      if (r) setMeds((r.meds as WireMed[]) ?? [])
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyVisit(v: WireOpenVisit) {
    setFixing(false)
    setVisit(v)
    setLines(v.lines)
    setDiagnosis(v.diagnosis ?? '')
    setTests(v.tests)
    setAdvice(v.advice)
    setNextVisit(v.nextVisit ?? '')
  }

  /**
   * THE LATEST EDIT, OFF A REF, SO A DEBOUNCED SAVE NEVER SENDS A STALE
   * CLOSURE. Every render refreshes this; `flush` below reads it rather than
   * whatever `lines` happened to be when the timer was scheduled.
   */
  const formRef = useRef({ lines, diagnosis, tests, advice, nextVisit })
  formRef.current = { lines, diagnosis, tests, advice, nextVisit }
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** stops two saves overlapping; deliberately not the `busy` state above, so
   *  a background save never disables a button the doctor is looking at */
  const savingRef = useRef(false)

  function touch() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { flush() }, 600)
  }

  /** Send whatever is pending now. Used by the debounce above, and awaited
   *  directly before print and before leaving the patient, so nothing typed
   *  in the last 600ms is ever left behind on the record holder. */
  async function flush(): Promise<boolean> {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    if (!openId || visit?.printedAt) return true
    if (savingRef.current) return true
    savingRef.current = true
    const f = formRef.current
    try {
      const r = await intent('saveRx', {
        visitId: openId, lines: f.lines,
        diagnosis: f.diagnosis || undefined,
        tests: f.tests, advice: f.advice,
        nextVisit: f.nextVisit || undefined,
      })
      if (r.ok === false) {
        setErr(String(r.why ?? 'That was not saved.'))
        await resync()   // the host's state is the truth; this screen catches up to it
        return false
      }
      return true
    } catch (e) {
      console.error('[nuskho] the prescription was not saved', e)
      setErr(whyItFailed(e, 'That change was not saved'))
      return false
    } finally {
      savingRef.current = false
    }
  }

  /** Re-read the patient after a refused save. Deliberately not `ask()`: that
   *  clears `err` on the way in, and the sentence just set above is the one
   *  thing the doctor needs to still see when this finishes. */
  async function resync() {
    if (!openId) return
    try {
      const r = await intent('openVisit', { visitId: openId })
      if (r.ok === false) { setErr(String(r.why ?? 'That patient could not be reopened.')); return }
      applyVisit(r.v as WireOpenVisit)
    } catch (e) {
      console.error('[nuskho] resync failed', e)
      setErr(whyItFailed(e, 'That patient could not be reopened'))
    }
  }

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  async function openRow(vid: string) {
    await flush()   // whatever was pending on the last patient lands first
    setErr(''); setQ(''); setVisit(null); setOpenId(vid)
    const r = await ask('open:' + vid, 'That patient could not be opened', 'openVisit', { visitId: vid })
    if (r) applyVisit(r.v as WireOpenVisit)
    else setOpenId(null)
  }

  async function back() {
    const ok = await flush()
    if (!ok) return   // stay put; the sentence explains why, and resync already ran
    setOpenId(null); setVisit(null); setErr('')
  }

  function setLine(i: number, patch: Partial<RxLine>) {
    setLines(ls => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)))
    touch()
  }
  function removeLine(i: number) {
    setLines(ls => ls.filter((_, k) => k !== i))
    touch()
  }
  function setDiag(v: string) { setDiagnosis(v); touch() }
  function toggleTest(key: string) {
    setTests(ts => (ts.includes(key) ? ts.filter(x => x !== key) : [...ts, key]))
    touch()
  }
  function toggleAdvice(key: string) {
    setAdvice(as => (as.includes(key) ? as.filter(x => x !== key) : [...as, key]))
    touch()
  }
  function setNext(v: string) { setNextVisit(v); touch() }

  function addOwn(hit: WireMed) {
    setLines(ls => [...ls, { drugId: hit.id, dose: { m: 1, d: 0, n: 1 }, meal: 'after', days: 5 }])
    setQ('')
    touch()
  }

  async function addFromShelf(e: DictEntry) {
    const r = await ask('take:' + e.brand + '|' + e.strength, 'That medicine could not be added',
      'takeMed', { brand: e.brand, strength: e.strength, form: e.form })
    if (!r) return
    const med = r.med as WireMed
    setMeds(ms => [...ms, med])
    setLines(ls => [...ls, { drugId: (r.id as string | undefined) ?? med.id,
      dose: { m: 1, d: 0, n: 1 }, meal: 'after', days: 5 }])
    setQ('')
    touch()
  }

  async function doPrint() {
    if (!openId || busy === 'print') return
    setBusy('print'); setErr('')
    try {
      const ok = await flush()
      if (!ok) return
      const r = await intent('printRx', { visitId: openId })
      if (r.ok === false) { setErr(String(r.why ?? 'That did not print.')); return }
      const slip = r.slip as SlipData
      try {
        await printSlip(slip)
      } catch (e) {
        console.error('[nuskho] print failed', e)
        setErr('Check the printer is on and has paper, then press PRINT again.')
        return
      }
      // the slip carries the just-frozen visit back: printedAt and the
      // snapped lines come from the record holder, never invented here
      setVisit(v => (v ? { ...v, status: 'done', printedAt: slip.visit.printedAt, lines: slip.visit.lines } : v))
      setQ(''); setErr('')
    } catch (e) {
      console.error('[nuskho] printRx failed', e)
      setErr(whyItFailed(e, 'That did not print'))
    } finally {
      setBusy('')
    }
  }

  const ownHits = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (k.length < 2) return []
    return meds.filter(m => m.brand.toLowerCase().startsWith(k) || m.generic.toLowerCase().startsWith(k)).slice(0, 12)
  }, [meds, q])

  const shelfHits = useMemo(() => {
    if (q.trim().length < 2) return []
    const norm = (b: string, st: string) => (b + st).toLowerCase().replace(/[^a-z0-9]/g, '')
    const have = new Set(meds.map(m => norm(m.brand, m.strength)))
    return searchDictionary(q).filter(e => !have.has(norm(e.brand, e.strength)))
  }, [meds, q])

  const twins = useMemo(
    () => sameMolecule(lines.map(l => l.snap?.generic ?? medsMap[l.drugId]?.generic)),
    [lines, medsMap],
  )

  // mirrors visitDoctorId in doctors.ts: a visit with no doctorId at all is
  // the first doctor's, the sentinel every pre-rooms record already carries.
  // Nothing is imported for this. It is inlined so this screen's only source
  // of truth about rooms stays the wire, never a second copy of doctors.ts.
  const mine = useMemo(() => s.visits.filter(v => (v.doctorId ?? 'D1') === docId), [s.visits, docId])
  const waiting = useMemo(
    () => [...mine.filter(v => v.status === 'waiting')]
      .sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || a.token - b.token),
    [mine],
  )
  const printedToday = mine.filter(v => v.printedAt).length

  const locked = !!visit?.printedAt

  return (
    <div className="pane">
      {!openId ? (
        <>
          <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <h2 style={{ marginBottom: 0 }}>
              <IcUser size={17} /> {me ? `${me.nameEn} · Room ${me.room}` : 'Your room'}
            </h2>
            {/* Plain, on purpose: ui/Bell.tsx counts who else is listening, which
                is host-only state a phone cannot see, and would tell a doctor on
                his own mirror that nobody could hear him even while the
                compounder's phone is open right beside him. This just rings. */}
            <button className="btn ghost mdr-bell" onClick={() => signal({ kind: 'bell', from: 'doctor' })}>
              Ring the desk
            </button>
          </div>
          {!docId && (
            <p className="usable bad">
              This phone does not know which room it is signed in for. Sign out and sign in again.
            </p>
          )}
          {err && <p className="usable bad">{err}</p>}
          <p className="hint">{printedToday} printed today.</p>
          {waiting.map(v => (
            <div key={v.id} className="qwrap">
              <button className={'qrow mdr-qrow' + (v.urgent ? ' urgent' : '')} onClick={() => openRow(v.id)}>
                <span className="tk">{v.token}</span>
                <span className="nm">{v.name}</span>
                {v.urgent && <span className="uflag"><IcWarn size={13} /> cannot wait</span>}
                {v.hasVitals && (
                  <span className="mdr-vdot" title="vitals taken" aria-label="vitals taken" style={{
                    width: 8, height: 8, borderRadius: '50%', background: 'var(--g)', flex: 'none', marginLeft: 6,
                  }} />
                )}
              </button>
            </div>
          ))}
          {!waiting.length && <p className="hint">Nobody waiting in your room right now.</p>}
        </>
      ) : !visit ? (
        <>
          <button className="btn ghost mdr-back" onClick={() => { setOpenId(null); setErr('') }}>← Queue</button>
          <p className="hint">{err || 'Fetching this patient from the clinic machine…'}</p>
        </>
      ) : (
        <>
          <button className="btn ghost mdr-back" onClick={back} style={{ marginBottom: 12 }}>← Queue</button>

          <div className="who ptcard">
            <span className="tk-badge" aria-label={`Token ${visit.token}`}>{visit.token}</span>
            <span className="pt-main">{visit.patient.name}
              <span>No. {visit.patient.code}
                {visit.patient.age ? ` · ${visit.patient.age}` : ''}
                {visit.patient.sex ? ` · ${visit.patient.sex}` : ''}
              </span>
            </span>
            <IcUser size={22} className="pt-ic" />
          </div>

          {/* THE AGE IS WRONG AND HE IS THE ONE WHO CAN SEE IT.
              The desk types the age; the doctor is the person who notices it
              says 4 for the man in front of him, and until now his screen
              could show him the mistake and do nothing about it — including
              when the app was about to judge that man's pulse by a child's
              range. The record holder applies it, the same rules as the desk,
              and this phone stores nothing. Name, age and sex only: see the
              `slim` note in FixPatient. */}
          {fixing ? (
            <FixPatient slim pt={asPatient(visit.patient)} printed={visit.printedForPatient ?? 0}
                        /* the record holder stamps the real role from the
                           sitting; this is only the sentence under the button,
                           and this screen is the doctor's by construction */
                        by={ROLE_NAME.doctor}
                        onClose={() => setFixing(false)}
                        onSave={async (patch: PatientPatch) => {
                          const r = await ask('fix', 'The details were not corrected', 'fixPatient',
                                              { visitId: visit.id, ...patch })
                          if (!r) return err || 'The details were not corrected.'
                          setVisit(v => (v ? { ...v, patient: {
                            ...v.patient,
                            name: patch.name ?? v.patient.name,
                            age: patch.age || undefined,
                            sex: patch.sex || undefined,
                          } } : v))
                          return null
                        }} />
          ) : (
            <button className="lnk" onClick={() => setFixing(true)}>correct these details</button>
          )}

          {/* the same two facts, and the same silence about what they mean */}
          <CareLine alert={visit.patient.alert} pregnant={visit.pregnant}
                    sex={visit.patient.sex} disabled={locked || !!busy}
                    /* NOTHING HERE IS BELIEVED UNTIL THE RECORD HOLDER SAYS
                       SO. These two were sent and forgotten: on a phone in a
                       corridor with the wifi gone, the chip went on, the text
                       stayed in the box, and the slip printed without either.
                       That is the same failure this file's own `ask` was
                       written about, three hundred lines up. */
                    onAlert={async a => {
                      const r = await ask('care', 'The allergy was not saved', 'setCare',
                                          { visitId: visit.id, alert: a ?? '' })
                      if (r) setVisit(v => (v ? { ...v, patient: { ...v.patient, alert: a } } : v))
                    }}
                    onPregnant={async b => {
                      const r = await ask('care', 'That was not saved', 'setCare',
                                          { visitId: visit.id, pregnant: b })
                      if (r) setVisit(v => (v ? { ...v, pregnant: b } : v))
                    }} />
          {visit.prev && (visit.prev.diagnosis || visit.prev.brands.length > 0) && (
            <div className="prev">
              Last time: {[visit.prev.diagnosis, visit.prev.brands.join(', ')].filter(Boolean).join(', ')}
            </div>
          )}

          <h2>Vitals</h2>
          {filled(visit.vitals).length > 0 ? (
            <p className="hint mdr-vitals">
              {filled(visit.vitals).map(([d, val]) => `${d.short} ${vitalText(d.key, val)}`).join(' · ')}
            </p>
          ) : (
            <p className="hint">No vitals taken yet.</p>
          )}
          {/* A READING THAT STOPS THE PRINT, AND A WAY OUT OF IT ON THIS SCREEN.
              The slip refuses to carry a number no body produces, which is
              right — and this screen does not enter vitals, which is also
              right. Between those two a doctor could be refused a print
              because of somebody else's typo with nothing on his phone able
              to fix it. He cannot type a reading here; he can take one off. */}
          {(() => {
            const bad = firstImpossible(visit.vitals)
            if (!bad || locked) return null
            return (
              <div className="badmsg">
                {bad.en} reads &ldquo;{(visit.vitals ?? {})[bad.key]}&rdquo;, which is not a possible
                reading. The slip will not print until it is corrected at the clinic machine,
                or taken off here.
                <button className="lnk" disabled={busy === 'clr'} onClick={async () => {
                  const r = await ask('clr', 'The reading was not cleared', 'clearVital',
                                      { visitId: visit.id, key: bad.key })
                  if (r) setVisit(v => {
                    if (!v) return v
                    const vs = { ...(v.vitals ?? {}) }
                    delete vs[bad.key]
                    return { ...v, vitals: vs }
                  })
                }}>take {bad.short} off this visit</button>
              </div>
            )
          })()}

          {/* Above the locked note and above the medicines, because it is true
              of the whole panel and a doctor scrolled past a long prescription
              must not have to hunt for why the last thing he did failed. */}
          {err && (
            <div className="saidno" style={{ marginTop: 8 }}>
              <Note tone="stop" title="That did not go through">{err}</Note>
            </div>
          )}

          {locked && (
            <div className="lockbar mdr-locked-note">
              Printed. Amend at the clinic machine if something must change.
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn ghost mdr-reprint" disabled={busy === 'print'} onClick={doPrint}>
                  {busy === 'print' ? 'Printing…' : 'Reprint'}
                </button>
              </div>
            </div>
          )}

          <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, opacity: locked ? .55 : 1 }}>
            <h2>Diagnosis</h2>
            <div className="fld">
              <input value={diagnosis} maxLength={240} placeholder="what he found"
                     onChange={e => setDiag(e.target.value)} />
            </div>

            <h2><IcPill size={17} /> Medicines</h2>
            {isChild(visit.patient.age) && (
              <p className="hint" style={{ marginTop: -6 }}>
                {visit.patient.name} is {visit.patient.age}. Nuskho does not check doses by age or weight.
              </p>
            )}
            <div className="fld">
              <input className="mdr-search" value={q} placeholder="Type two letters to find a medicine…"
                     onChange={e => setQ(e.target.value)} />
            </div>
            {q.trim().length >= 2 && (
              <div className="dict">
                {ownHits.length === 0 && shelfHits.length === 0 && <div className="dhead">Nothing found</div>}
                {ownHits.length > 0 && <div className="dhead">Your list</div>}
                {ownHits.map(m => (
                  <button key={m.id} className="drow2 mdr-ownhit" onClick={() => addOwn(m)}>
                    <FormIcon form={m.form} route={m.route} size={16} className="fi" />
                    <span className="dl">{m.brand}{m.strength ? ' ' + m.strength : ''} · {m.generic}</span>
                    <span className="add">add</span>
                  </button>
                ))}
                {shelfHits.length > 0 && <div className="dhead">shelf</div>}
                {shelfHits.map(e => (
                  <button key={e.brand + '|' + e.strength} className="drow2 mdr-shelfhit"
                          disabled={busy === 'take:' + e.brand + '|' + e.strength}
                          onClick={() => addFromShelf(e)}>
                    <FormIcon form={e.form} route={e.route} size={16} className="fi" />
                    <span className="dl">{dictLine(e)}</span>
                    <span className="add">add</span>
                  </button>
                ))}
              </div>
            )}

            {lines.map((l, i) => (
              <MedLine key={i} l={l} i={i} medsMap={medsMap} twin={twins.get(i)}
                       onChange={patch => setLine(i, patch)} onRemove={() => removeLine(i)} />
            ))}
            {!lines.length && <p className="hint">Nothing prescribed yet. Search above to add the first medicine.</p>}

            <h2>Lab tests</h2>
            <div className="chips">
              {labTests.map(t => {
                const key = `${t.en}|${t.sd}`; const on = tests.includes(key)
                return (
                  <button key={t.en} className={`chip ${on ? 'on' : ''}`} onClick={() => toggleTest(key)}>
                    {t.en}
                  </button>
                )
              })}
            </div>

            <h2>Advice</h2>
            <div className="chips">
              {adviceList.map(a => {
                const key = `${a.sd}|${a.en}|${a.icon}`; const on = advice.includes(key)
                return (
                  <button key={a.en} className={`chip ${on ? 'on' : ''}`} onClick={() => toggleAdvice(key)}>
                    {a.en}
                  </button>
                )
              })}
            </div>

            <h2>Next visit</h2>
            <div className="chips">
              {NEXT_VISIT.map(w => {
                const on = nextVisit === w
                return (
                  <button key={w} className={`chip ${on ? 'on' : ''}`}
                          onClick={() => setNext(on ? '' : w)}>{w}</button>
                )
              })}
            </div>
            <input className="nextvin" value={nextVisit} maxLength={60}
                   placeholder="or type it, printed as you type it"
                   onChange={e => setNext(e.target.value)} />
          </fieldset>

          {!locked && (
            <div className="sticky">
              <button className="btn wide mdr-print" disabled={busy === 'print' || !lines.length} onClick={doPrint}>
                {busy === 'print' ? 'Printing…' : `PRINT for ${visit.patient.name} (${lines.length})`}
              </button>
            </div>
          )}
        </>
      )}
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
  /** Which line's partial count is being typed, and the digits so far. An
   *  inline box instead of prompt(): iOS offers "block dialogs" after a busy
   *  evening's third one, and once ticked, prompt() returns null with no
   *  message and the "gave 6, short 4" flow is dead for the sitting. */
  const [askIdx, setAskIdx] = useState<number | null>(null)
  const [askVal, setAskVal] = useState('')
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
                      askIdx === i ? (
                        <span className="row" style={{ gap: 6, alignItems: 'center' }}>
                          <input className="mdr-gave" type="text" inputMode="numeric" autoFocus
                                 value={askVal} style={{ width: 64, fontSize: 18, padding: '6px 8px' }}
                                 onChange={e => setAskVal(e.target.value.replace(/[^0-9]/g, ''))} />
                          <button className="chip on" onClick={() => {
                            const k = Math.max(0, Math.min(l.n, +askVal || 0))
                            intent('setGiven', { visitId: v.id, index: i, given: k })
                            setAskIdx(null)
                          }}>OK</button>
                          <button className="lnk" onClick={() => setAskIdx(null)}>x</button>
                        </span>
                      ) : (
                        <button className="lnk" onClick={() => {
                          setAskIdx(i); setAskVal(String(l.given ?? l.n))
                        }}>gave {l.given}</button>
                      )
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
        <span><b>{s.sums.total}</b> token{s.sums.total === 1 ? '' : 's'}</span>
        <span><b>{s.sums.printed}</b> printed</span>
        <span><b>{s.sums.waiting}</b> waiting</span>
        {s.fees !== false && <span className="money"><b>Rs {s.sums.collected}</b> in hand</span>}
        {s.sums.toRefund > 0 && <span className="money back"><b>Rs {s.sums.toRefund}</b> to give back</span>}
        {s.sums.due > 0 && <span className="money due"><b>Rs {s.sums.due}</b> due</span>}
      </div>
      {perRoom.map(({ d, n, printed, collected }) => (
        <div className="line" key={d.id}>
          <div className="hd"><div>
            <b>Room {d.room} · {d.nameEn}</b>
            <small>{n} token{n === 1 ? '' : 's'} · {printed} printed
              {s.fees !== false && <> · Rs {collected} taken</>}</small>
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
