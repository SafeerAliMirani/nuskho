import { useEffect, useState } from 'react'
import Intake from './screens/Intake'
import Pharmacy from './screens/Pharmacy'
import AdminDesk from './screens/AdminDesk'
import Compose from './screens/Compose'
import Setup from './screens/Setup'
import StatsScreen from './screens/Stats'
import About from './screens/About'
import Welcome, { needsWelcome } from './screens/Welcome'
import Lock from './screens/Lock'
import { profile, adminIsSet, lockAdmin } from './profile'
import { role, can, signOut, currentDoctorId, ROLE_NAME, ROLE_SD } from './roles'
import { multiRoom, doctorById, visitDoctorId } from './doctors'
import { buildingMode } from './building'
import Mirror from './screens/Mirror'
import Tour from './ui/Tour'
import { tourFor, tourSeen } from './tour'
import { todaysVisits } from './db'
import { Mark, IcChart, IcCog, IcLock, IcUser, IcQueue, IcInfo, IcBook } from './ui/art'
import Toasts from './ui/Toasts'
import Bill from './ui/Bill'
import Frozen from './screens/Frozen'
import { frozen as licenceRanOut } from './service'
import { startPresence, onSignal } from './ui/bus'
import { isDemo } from './version'
import { clearDemo, touchDemo } from './demo'
import type { Visit } from './types'

export default function App() {
  // A phone in the building never sees the app below: it is a mirror, a door
  // and a screen holding nothing. The record holder and every copy outside a
  // building fall through to the app exactly as it has always been.
  if (buildingMode() === 'mirror') return <Mirror />
  return <Clinic />
}

function Clinic() {
  const [visitId, setVisitId] = useState<string | null>(null)
  const [setup, setSetup] = useState(false)
  const [stats, setStats] = useState(false)
  const [pharm, setPharm] = useState(false)
  const [about, setAbout] = useState(false)
  const [tour, setTour] = useState(false)
  // read once, at mount. See the block above the early return.
  const [dead] = useState(() => licenceRanOut())
  const [unlocked, setUnlocked] = useState(false)
  // the building's day, for a doctor who owns the clinic
  const [ops, setOps] = useState(false)
  const [today, setToday] = useState<Visit[]>([])
  const [welcome, setWelcome] = useState(needsWelcome)
  // The lock stands between the doctor and the app only when opening it. Once
  // he is in, nothing here can come back and interrupt a consultation.
  // The first page is a sign-in page, whether or not a PIN is set. It is what
  // everyone expects software to open with, and it gives the evening a start.
  // The public copy is the exception: demo.ts has already signed the visitor in
  // as the doctor, so the first thing seen is the working day itself.
  const [locked, setLocked] = useState(() => isDemo ? false : !needsWelcome())
  const [, bump] = useState(0)
  const [menu, setMenu] = useState(false)

  const refresh = async () => setToday(await todaysVisits())
  // announce this window so the bell can honestly say whether anyone hears it
  useEffect(() => startPresence(), [])

  // A new screen starts at its top. Opening a patient from the bottom of a
  // forty-row queue used to keep the queue's scroll position, so Compose
  // opened on the middle of the medicine grid with the patient's name out of
  // sight — which looks broken and invites the wrong-patient mistake.
  useEffect(() => { window.scrollTo(0, 0) }, [visitId, setup, stats, pharm, about])

  // Keep the practice copy alive while somebody is actually using it, so a
  // demonstration survives reloads and a walk to another room, and still
  // clears itself by tomorrow. No-op in a real clinic.
  useEffect(() => {
    if (!isDemo) return
    touchDemo()
    const t = setInterval(touchDemo, 5 * 60 * 1000)
    // The practice copy opens already signed in, with nobody in the room to
    // explain it. The tour is the person who would have been standing there.
    if (!tourSeen(role())) setTour(true)
    return () => clearInterval(t)
  }, [])

  /**
   * The other window changed something, so this one reloads the day.
   *
   * Before this, the doctor's screen only refreshed when the doctor himself did
   * something. A patient added at the counter simply did not appear until he
   * navigated, which meant an urgent patient could be announced by a chime and
   * a red card and then not be in the list underneath it. A notification that
   * points at something not on the screen teaches people to distrust
   * notifications.
   *
   * This is a nudge to re-read, never a copy of the data. The database is still
   * the only source, so a dropped message costs at most a few seconds.
   */
  useEffect(() => onSignal(s => {
    if (s.kind === 'patient' || s.kind === 'urgent' || s.kind === 'refund'
        || s.kind === 'printed' || s.kind === 'seen') refresh()
  }), [])
  useEffect(() => { refresh() }, [])
  useEffect(() => {
    const h = (e: Event) => { setVisitId((e as CustomEvent).detail); refresh() }
    const p = () => bump(n => n + 1)
    const w = () => { setSetup(false); setVisitId(null); setWelcome(true) }
    // a phone in the building changed the day: re-read, disturb nothing
    const r = () => refresh()
    window.addEventListener('nuskho:refresh', r)
    window.addEventListener('nuskho:open', h)
    window.addEventListener('nuskho:profile', p)
    window.addEventListener('nuskho:admin', p)
    window.addEventListener('nuskho:role', p)
    window.addEventListener('nuskho:doctors', p)
    window.addEventListener('nuskho:wizard', w)
    return () => {
      window.removeEventListener('nuskho:refresh', r)
      window.removeEventListener('nuskho:open', h)
      window.removeEventListener('nuskho:profile', p)
      window.removeEventListener('nuskho:admin', p)
      window.removeEventListener('nuskho:role', p)
      window.removeEventListener('nuskho:doctors', p)
      window.removeEventListener('nuskho:wizard', w)
    }
  }, [])

  // Back to the front door after setup, NOT straight into the app. Before this,
  // a fresh machine finished the wizard with nobody signed in, so role() fell
  // back to 'counter' — and the wizard's own last step is "print one slip",
  // which the counter is not allowed to do. The installer's first experience of
  // the app was that it would not print.
  /**
   * THE LICENCE, READ ONCE AND NEVER AGAIN.
   *
   * `useState(() => ...)` runs the check on the first render of this component
   * and stores the answer. It is deliberately NOT a hook that re-runs, not a
   * timer, and not called anywhere in the render path. A clinic already working
   * at seven in the evening keeps working until somebody closes the app, no
   * matter how long the evening runs or what midnight does. Whoever edits this
   * next: rule 1 in service.ts, and it is not a style preference.
   *
   * It sits above the wizard and the door on purpose. There is no route around
   * it, and equally no route into it for a clinic with no licence set at all,
   * because frozen() answers false the moment paidUntil is empty.
   */
  if (dead && !unlocked) return <Frozen onOpen={() => setUnlocked(true)} />

  if (welcome) return <Welcome onDone={() => { setWelcome(false); setLocked(true); refresh() }} />
  if (locked) return <Lock onOpen={() => { setLocked(false); if (!tourSeen(role())) setTour(true) }} />

  const printed = today.filter(v => v.printedAt).length

  /**
   * THE ROOM RULE, ENFORCED WHERE IT COUNTS. In a building with several rooms
   * a signed-in doctor opens his own visits; another room's prescription does
   * not render for him by any route. The compounder, who types for every room,
   * is untouched, and a solo clinic never reaches this test.
   */
  const roomOk = (id: string): boolean => {
    if (!multiRoom() || role() !== 'doctor') return true
    const me = currentDoctorId()
    const v = today.find(x => x.id === id)
    return !me || !v || visitDoctorId(v.doctorId) === me
  }

  /** The signed-in doctor, for the header chip. Null in a solo clinic. */
  const me = multiRoom() && role() === 'doctor' ? doctorById(currentDoctorId() ?? undefined) : undefined

  return (
    <div className="app">
      <Toasts />
      {/* Never hidden, never dismissible. The failure this prevents is not
          somebody deciding to misuse the practice copy — it is a doctor who
          was shown it, liked it, and simply never stopped. He should not be
          able to look at this screen and not know. */}
      {isDemo && (
        <div className="demobar">
          <b>Practice copy</b>
          <span>Everything printed says SPECIMEN. Nothing is saved to a file. It clears itself.</span>
          <button className="lnk" onClick={async () => {
            if (!confirm('Clear the practice patients and start again?')) return
            await clearDemo()
            location.reload()
          }}>Clear and start again</button>
        </div>
      )}
      <header className="top">
        <div className="brandwrap">
          <Mark size={30} className="mk" />
          <div className="who2">
            {/* In a building with rooms this said the FIRST doctor's name to
                whoever was signed in, so Dr Soomro worked all evening under a
                heading that read Dr Khan. Whoever is at the keyboard is named
                here; a solo clinic is unchanged. */}
            <b>{me?.nameEn ?? (profile().doctorEn || 'Nuskho')}</b>
            <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
        <div className="counts">
          {/* THE DAY'S SHAPE IS THE QUEUE'S, AND THE PHARMACY IS NOT THE QUEUE.
              A medical store renting space in the building was being told how
              many patients attended tonight and how many were prescribed for,
              in the header, on every screen. That is the roll of who came to
              this clinic, in miniature, and it is exactly what store.ts says
              such a counter must never be handed. A role without the queue has
              no use for either number. */}
          {can('queue') && <>
            <span><IcQueue size={15} /> {today.length} waiting</span>
            <span className="pr">{printed} printed</span>
          </>}

          {/* The role is not just a label — everything it lets you do hangs off it. */}
          <div className="menuwrap">
            <button className={'rolechip ' + role()} onClick={() => setMenu(m => !m)}>
              {me ? <>{me.nameEn} · R{me.room}</> : <>{ROLE_NAME[role()]} <i className="sd">{ROLE_SD[role()]}</i></>} <i>▾</i>
            </button>
            {menu && (
              <>
                <div className="scrim" onClick={() => setMenu(false)} />
                <div className="menu">
                  {can('figures') && (
                    <button onClick={() => { setMenu(false); setSetup(false); setVisitId(null); setStats(true) }}>
                      <IcChart size={16} /> My figures <small>patients, fees, month card</small>
                    </button>
                  )}
                  {/* A doctor who OWNS his clinic gets the building's day, which
                      until now only a clinic admin could see. `can('ops')` is
                      true for him only when he is the owner (roles.ts), so this
                      never appears for an employed doctor. */}
                  {can('ops') && can('queue') && (
                    <button onClick={() => { setMenu(false); setSetup(false); setStats(false); setVisitId(null); setOps(true) }}>
                      <IcChart size={16} /> The building <small>money by room, the day, the machines</small>
                    </button>
                  )}
                  {can('dispense') && can('queue') && (
                    <button onClick={() => { setMenu(false); setSetup(false); setStats(false); setVisitId(null); setPharm(true) }}>
                      <IcQueue size={16} /> Pharmacy desk <small>printed slips, mark medicines given</small>
                    </button>
                  )}
                  {(can('paper') || can('identity')) &&
                  <button onClick={() => { setMenu(false); setStats(false); setSetup(true) }}>
                    <IcCog size={16} /> Setup <small>paper, medicines, PINs</small>
                  </button>}
                  {role() === 'admin' && (
                    <button onClick={() => {
                      setMenu(false); setSetup(false); setStats(false); setVisitId(null); setWelcome(true)
                    }}><IcCog size={16} /> Run setup again <small>the whole first-run sequence</small></button>
                  )}
                  {role() === 'admin' && adminIsSet() ? (
                    <button onClick={() => { setMenu(false); lockAdmin(); bump(n => n + 1) }}>
                      <IcUser size={16} /> Sign out of admin <small>back to clinic access</small>
                    </button>
                  ) : role() !== 'admin' && (
                    <button onClick={() => {
                      // Back to the door: Nuskho is a role you pick, not a mode
                      // you slip into from inside somebody else's screen.
                      setMenu(false); signOut(); setStats(false); setSetup(false)
                      setVisitId(null); setLocked(true)
                    }}>
                      <IcUser size={16} /> Sign in as Nuskho <small>name, logo, medicine review, backups</small>
                    </button>
                  )}
                  {/* Learning where things are must never mean finding a
                      manual. It sits one tap away, for ever, in the same
                      menu the role is chosen from. */}
                  {tourFor(role()).length > 0 && (
                    <button onClick={() => { setMenu(false); setTour(true) }}>
                      <IcBook size={16} /> How this works <small>a short tour of your own screen</small>
                    </button>
                  )}

                  <button onClick={() => {
                    setMenu(false); setStats(false); setSetup(false); setVisitId(null); setAbout(true)
                  }}>
                    <IcInfo size={16} /> About &amp; help <small>version, what it promises, report a problem</small>
                  </button>

                  <button onClick={() => { setMenu(false); signOut(); setStats(false); setSetup(false); setVisitId(null); setLocked(true) }}>
                    <IcLock size={16} /> Sign out <small>hand this computer to someone else</small>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* The counter has nothing to change on this machine, so it is not
              offered a door into Setup that opens onto an empty room. */}
          {(can('paper') || can('identity')) &&
            <button className="lnk paper" onClick={() => setSetup(s => !s)}>Setup</button>}
        </div>
      </header>

      {/* Asking for the money, and only asking. It renders for the doctor, the
          clinic admin and the Nuskho role, sits above the work rather than over
          it, and changes nothing about how the app behaves. See service.ts. */}
      <Bill />

      {/* The router is the gate, not the menu. Hiding a button is a courtesy;
          refusing to render the screen is the rule. A counter that reaches
          Compose by any route — an old link, a stale state, a bug — still
          cannot read a prescription. */}
      {about
        ? <About onBack={() => setAbout(false)} />
        : ops && can('ops')
        ? <><button className="btn ghost" style={{ margin: 'var(--s5) 0 0 var(--s5)' }}
                   onClick={() => setOps(false)}>&larr; Queue</button>
            <AdminDesk visits={today} /></>
        : stats && can('figures')
        ? <StatsScreen onBack={() => setStats(false)} />
        : setup && (can('paper') || can('identity'))
        ? <Setup onBack={() => setSetup(false)} />
        : pharm && can('dispense')
        ? <PharmWrap visits={today} onChange={refresh} onBack={() => setPharm(false)} showBack={can('queue')} />
        : visitId && can('prescribe') && roomOk(visitId)
        ? <Compose
            visitId={visitId}
            onDone={async () => { setVisitId(null); await refresh() }}
            // must refresh: a discount decided in the room has to be waiting at
            // the counter by the time the patient walks the few steps back to it
            onBack={async () => { setVisitId(null); await refresh() }} />
        // The Nuskho role has no business on the day's list — it is names and
        // who came in. It lands in Setup, which is the only reason it exists.
        : can('queue')
        ? <Intake visits={today} onOpen={setVisitId} onChange={refresh} />
        : can('dispense')
        ? <PharmWrap visits={today} onChange={refresh} onBack={() => {}} showBack={false} />
        : can('ops')
        ? <AdminDesk visits={today} />
        : <Setup onBack={() => setSetup(false)} />}

      {/* Over the top of whatever is showing, and deliberately not instead
          of it: the tour rings the real control on the real screen. */}
      {tour && <Tour role={role()} onClose={() => setTour(false)} />}
    </div>
  )
}


/** The pharmacy desk, with a way back for the roles that also hold a queue. */
function PharmWrap({ visits, onChange, onBack, showBack }: {
  visits: Visit[]; onChange: () => void; onBack: () => void; showBack: boolean
}) {
  return (
    <div>
      {showBack && (
        <div className="pane" style={{ paddingBottom: 0 }}>
          <button className="btn ghost" onClick={onBack}>← Queue</button>
        </div>
      )}
      <Pharmacy visits={visits} onChange={onChange} />
    </div>
  )
}
