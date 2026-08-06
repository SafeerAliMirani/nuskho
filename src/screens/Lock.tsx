import { useState } from 'react'
import { Mark, ArtSlip, IcUser, IcMoney, IcCog, IcQueue, IcPill, IcChart } from '../ui/art'
import { profile, APP, adminIsSet, unlockAdmin } from '../profile'
import { primeSound } from '../ui/sound'
import { ROLES, ROLE_NAME, ROLE_SD, ROLE_WHAT, pinSet, checkRolePin, signIn, setDoctorIdentity, type Role } from '../roles'
import { multiRoom, activeDoctors, isSitting } from '../doctors'
import { buildingMode } from '../building'

/**
 * The front door, and the only place a role is chosen.
 *
 * Two jobs, one screen. It keeps the laptop-left-open-on-a-desk problem solved,
 * and it asks the question the app could not previously ask: who is at the
 * keyboard. Both happen once, at the start of the evening, and never again.
 *
 * Design rules this screen obeys:
 *
 *   - A role with no PIN is ONE TAP. In a single-room clinic where the doctor is
 *     also the counter, this screen must not become a daily toll.
 *   - The PIN box only appears for the role that has one. Asking for a PIN
 *     nobody set is how people learn to distrust a lock.
 *   - No lockout after wrong attempts, ever. Locking a doctor out of his own
 *     patients while twenty people wait is a far worse failure than the one this
 *     screen prevents.
 *   - A lock that cannot be read lets you in. See checkRolePin.
 */
const ICON: Record<Role, (p: { size?: number }) => JSX.Element> = {
  counter: IcMoney,
  compounder: IcQueue,
  doctor: IcUser,
  pharmacy: IcPill,
  clinicadmin: IcChart,
  admin: IcCog,
}

export default function Lock({ onOpen }: { onOpen: () => void }) {
  const [want, setWant] = useState<Role | null>(null)
  const [pin, setPin] = useState('')
  const [bad, setBad] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pickDoc, setPickDoc] = useState(false)
  const p = profile()

  /**
   * The Nuskho role is guarded by the passphrase that already exists, not by a
   * fourth PIN. Two different secrets protecting the same thing is how people
   * end up writing one of them on the machine.
   */
  const needsSecret = (r: Role) => (r === 'admin' ? adminIsSet() : pinSet(r))

  /**
   * The role is chosen; finish or, in a building with several rooms, ask the
   * one question the role leaves open: which doctor. One tap, no second PIN —
   * the doctor PIN guards the role, and inside the building the rooms are
   * colleagues, not strangers.
   */
  function enter(r: Role) {
    if (r === 'doctor' && multiRoom()) { setWant(r); setPickDoc(true); return }
    setDoctorIdentity(null)
    signIn(r)
    onOpen()
  }

  function choose(r: Role) {
    primeSound()   // browsers only allow audio after a real click; this is it
    if (!needsSecret(r)) { enter(r); return }
    setWant(r); setPin(''); setBad(false)
  }

  async function submit() {
    if (busy || !want || !pin) return
    setBusy(true)
    const ok = want === 'admin' ? await unlockAdmin(pin) : await checkRolePin(want, pin)
    if (ok) { enter(want) } else { setBad(true); setPin('') }
    setBusy(false)
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="door">
      {/* LEFT: who made this and what it does. It is the first thing anyone sees
          of Nuskho, including a doctor being shown it by a colleague, so it is
          allowed to be the one place in the app that is purely presentation. */}
      <aside className="doorbrand">
        <div className="db-in">
          <div className="db-mark"><Mark size={40} /><span className="sd">{APP.sd}</span><b>{APP.en}</b></div>
          <h2 className="db-line">The prescription,<br />printed.</h2>
          <p className="db-sub">
            English for the chemist. Sindhi for the family. Pictures for whoever reads neither.
          </p>
          <div className="db-art"><ArtSlip /></div>
          <p className="db-foot">
            {buildingMode() === 'off'
              ? 'Works with the internet down. Nothing leaves this computer.'
              // A building must not print the solo promise: names and printed
              // medicine lines DO cross the clinic's own wire to its phones.
              // The true promise is the one worth making.
              : 'Works with the internet down. Records live on this machine only; the building’s phones are mirrors that keep nothing, and nothing reaches the internet.'}
          </p>
        </div>
      </aside>

      {/* RIGHT: the actual door. */}
      <main className="doorcard">
        <div className="card2">
          <p className="day">{today}</p>
          <h1>{p.doctorEn || 'Nuskho'}</h1>
          {p.degreesEn && <p className="deg">{p.degreesEn}</p>}
          {p.doctorSd && <p className="sd nm">{p.doctorSd}</p>}

          {pickDoc ? (
            <>
              <div className="whoback">
                <b>{ROLE_NAME.doctor} <span className="sd">{ROLE_SD.doctor}</span></b>
                <button className="lnk" onClick={() => { setPickDoc(false); setWant(null) }}>not me</button>
              </div>
              <p className="pick">Which doctor?</p>
              <div className="whos">
                {activeDoctors().map(d => (
                  <button key={d.id} className="whobtn doctor"
                          onClick={() => { setDoctorIdentity(d.id); signIn('doctor'); onOpen() }}>
                    <span className="wi"><IcUser size={20} /></span>
                    <span className="n">{d.nameEn} {d.nameSd && <i className="sd">{d.nameSd}</i>}</span>
                    <small>Room {d.room}{isSitting(d.id) ? '' : ' · marked not sitting tonight'}</small>
                    <span className="go">{'→'}</span>
                  </button>
                ))}
              </div>
              <p className="hint">
                Your queue, your prescriptions and your figures follow this choice for the evening.
              </p>
            </>
          ) : want ? (
            <>
              <div className="whoback">
                <b>{ROLE_NAME[want]} <span className="sd">{ROLE_SD[want]}</span></b>
                <button className="lnk" onClick={() => setWant(null)}>not me</button>
              </div>
              <div className="fld">
                <label>{want === 'admin' ? 'Nuskho passphrase' : 'PIN'}</label>
                <input type="password" inputMode={want === 'admin' ? 'text' : 'numeric'}
                       autoFocus value={pin} maxLength={want === 'admin' ? 64 : 8}
                       onChange={e => {
                         const v = e.target.value
                         setPin(want === 'admin' ? v : v.replace(/[^0-9]/g, '')); setBad(false)
                       }}
                       onKeyDown={e => { if (e.key === 'Enter') submit() }} />
              </div>
              {bad && <p className="usable bad">That is not right. Try again.</p>}
              <button className="btn wide" disabled={!pin || busy} onClick={submit}>
                Open &nbsp; کوليو
              </button>
              <p className="hint">
                Held on this computer only. Nobody, including us, can look it up or reset it.
              </p>
            </>
          ) : (
            <>
              <p className="pick">Who is at this computer?</p>
              <div className="whos">
                {ROLES.map(r => {
                  const I = ICON[r]
                  return (
                    <button key={r} className={'whobtn ' + r} onClick={() => choose(r)}>
                      <span className="wi"><I size={20} /></span>
                      <span className="n">{ROLE_NAME[r]} <i className="sd">{ROLE_SD[r]}</i></span>
                      <small>{ROLE_WHAT[r]}</small>
                      <span className="go">{needsSecret(r) ? (r === 'admin' ? 'KEY' : 'PIN') : '\u2192'}</span>
                    </button>
                  )
                })}
              </div>
              <p className="hint">
                {ROLES.some(r => needsSecret(r))
                  ? 'Set or change these numbers under Setup, Lock.'
                  : 'No PINs are set, so anyone here can pick any of these. Set them under Setup, Lock.'}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
