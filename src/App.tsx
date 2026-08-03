import { useEffect, useState } from 'react'
import Intake from './screens/Intake'
import Compose from './screens/Compose'
import Setup from './screens/Setup'
import StatsScreen from './screens/Stats'
import About from './screens/About'
import Welcome, { needsWelcome } from './screens/Welcome'
import Lock from './screens/Lock'
import { profile, adminIsSet, lockAdmin } from './profile'
import { role, can, signOut, ROLE_NAME, ROLE_SD } from './roles'
import { todaysVisits } from './db'
import { Mark, IcChart, IcCog, IcLock, IcUser, IcQueue, IcInfo } from './ui/art'
import Toasts from './ui/Toasts'
import { startPresence, onSignal } from './ui/bus'
import type { Visit } from './types'

export default function App() {
  const [visitId, setVisitId] = useState<string | null>(null)
  const [setup, setSetup] = useState(false)
  const [stats, setStats] = useState(false)
  const [about, setAbout] = useState(false)
  const [today, setToday] = useState<Visit[]>([])
  const [welcome, setWelcome] = useState(needsWelcome)
  // The lock stands between the doctor and the app only when opening it. Once
  // he is in, nothing here can come back and interrupt a consultation.
  // The first page is a sign-in page, whether or not a PIN is set. It is what
  // everyone expects software to open with, and it gives the evening a start.
  const [locked, setLocked] = useState(() => !needsWelcome())
  const [, bump] = useState(0)
  const [menu, setMenu] = useState(false)

  const refresh = async () => setToday(await todaysVisits())
  // announce this window so the bell can honestly say whether anyone hears it
  useEffect(() => startPresence(), [])

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
    window.addEventListener('nuskho:open', h)
    window.addEventListener('nuskho:profile', p)
    window.addEventListener('nuskho:admin', p)
    window.addEventListener('nuskho:role', p)
    window.addEventListener('nuskho:wizard', w)
    return () => {
      window.removeEventListener('nuskho:open', h)
      window.removeEventListener('nuskho:profile', p)
      window.removeEventListener('nuskho:admin', p)
      window.removeEventListener('nuskho:role', p)
      window.removeEventListener('nuskho:wizard', w)
    }
  }, [])

  // Back to the front door after setup, NOT straight into the app. Before this,
  // a fresh machine finished the wizard with nobody signed in, so role() fell
  // back to 'counter' — and the wizard's own last step is "print one slip",
  // which the counter is not allowed to do. The installer's first experience of
  // the app was that it would not print.
  if (welcome) return <Welcome onDone={() => { setWelcome(false); setLocked(true); refresh() }} />
  if (locked) return <Lock onOpen={() => setLocked(false)} />

  const printed = today.filter(v => v.printedAt).length

  return (
    <div className="app">
      <Toasts />
      <header className="top">
        <div className="brandwrap">
          <Mark size={30} className="mk" />
          <div className="who2">
            <b>{profile().doctorEn || 'Nuskho'}</b>
            <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
        <div className="counts">
          <span><IcQueue size={15} /> {today.length} waiting</span>
          <span className="pr">{printed} printed</span>

          {/* The role is not just a label — everything it lets you do hangs off it. */}
          <div className="menuwrap">
            <button className={'rolechip ' + role()} onClick={() => setMenu(m => !m)}>
              {ROLE_NAME[role()]} <i className="sd">{ROLE_SD[role()]}</i> <i>▾</i>
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

      {/* The router is the gate, not the menu. Hiding a button is a courtesy;
          refusing to render the screen is the rule. A counter that reaches
          Compose by any route — an old link, a stale state, a bug — still
          cannot read a prescription. */}
      {about
        ? <About onBack={() => setAbout(false)} />
        : stats && can('figures')
        ? <StatsScreen onBack={() => setStats(false)} />
        : setup && (can('paper') || can('identity'))
        ? <Setup onBack={() => setSetup(false)} />
        : visitId && can('prescribe')
        ? <Compose
            visitId={visitId}
            onDone={async () => { setVisitId(null); await refresh() }}
            // must refresh: a discount decided in the room has to be waiting at
            // the counter by the time the patient walks the few steps back to it
            onBack={async () => { setVisitId(null); await refresh() }} />
        : <Intake visits={today} onOpen={setVisitId} onChange={refresh} />}
    </div>
  )
}
