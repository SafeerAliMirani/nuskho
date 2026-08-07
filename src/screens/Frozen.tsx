import { useState } from 'react'
import { freezeFacts, tryCode, candidateDays } from '../service'
import { downloadBackup } from '../backup'
import { Mark } from '../ui/art'
import { APP } from '../profile'

/**
 * THE SCREEN A CLINIC SEES WHEN THE LICENCE HAS RUN OUT.
 *
 * Everything about this screen is written for the worst version of the moment
 * it appears: a doctor at six in the evening with people already outside. It
 * cannot pretend that is not happening, so it does three things instead of
 * arguing.
 *
 *   IT SAYS WHY, plainly, with the date and the amount. Not "licence error".
 *   A person who understands what has happened can fix it in one phone call.
 *
 *   IT GIVES A WAY OUT IN THIRTY SECONDS. One number, read down the phone,
 *   typed here, and the evening carries on. No internet, no visit, no waiting.
 *
 *   IT NEVER HOLDS THE RECORDS. Save the full backup is right here, working,
 *   on this screen. Every patient and every prescription comes out even while
 *   the app will not run. Withholding software is a commercial act, and it is
 *   Safeer's to make. Withholding a clinic's medical records is a different
 *   thing in law and in every conversation that would follow it.
 */
export default function Frozen({ onOpen }: { onOpen: () => void }) {
  const f = freezeFacts()
  const [code, setCode] = useState('')
  const [bad, setBad] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  function unlock() {
    setBusy(true)
    const day = tryCode(code, candidateDays())
    setBusy(false)
    if (day) { onOpen(); return }
    setBad(true)
  }

  const wa = `https://wa.me/${f.contact.replace(/\D/g, '').replace(/^0/, '92')}`

  return (
    <div className="app frozen">
      <header className="top">
        <div className="brandwrap">
          <Mark size={26} className="mk" />
          <div className="who2"><b>{APP.en}</b><span>service has stopped</span></div>
        </div>
      </header>

      <div className="pane frz">
        <h1>This clinic's Nuskho service has not been paid.</h1>
        <p className="frz-lead">
          The service ended on <b>{f.since}</b>
          {f.days > 0 && <>, {f.days} day{f.days === 1 ? '' : 's'} ago</>}
          {f.amount > 0 && <>, and <b>Rs {f.amount.toLocaleString('en-PK')}</b> is owed</>}.
          Nuskho will start again the moment it is settled, with everything exactly where
          you left it. Nothing has been deleted and nothing has been sent anywhere.
        </p>

        <div className="lhbox frz-key">
          <h3>Open it again now</h3>
          <p>
            Ring or message us, and we will read you a number. Type it here and carry on.
            It works with no internet and takes half a minute.
          </p>
          <div className="row">
            <a className="btn" href={wa} target="_blank" rel="noreferrer">WhatsApp {f.contact}</a>
          </div>
          <div className="fld" style={{ marginTop: 14 }}>
            <label>The number we read you</label>
            <input value={code} inputMode="numeric" autoFocus maxLength={16}
                   placeholder="0000-0000-0000"
                   onChange={e => { setCode(e.target.value); setBad(false) }}
                   onKeyDown={e => { if (e.key === 'Enter' && code) unlock() }} />
          </div>
          {bad && <p className="usable bad">That is not the right number for this clinic. Read it to us again.</p>}
          <button className="btn wide" disabled={!code || busy} onClick={unlock}>
            {busy ? 'Checking…' : 'Open Nuskho'}
          </button>
          {f.clinic && <p className="hint" style={{ marginTop: 10 }}>Tell us this clinic code: <b>{f.clinic}</b></p>}
        </div>

        {/* Rule 2, on screen where anybody can see it is true. */}
        <div className="lhbox frz-out">
          <h3>Your patients are yours, and they are still here</h3>
          <p>
            Every patient and every prescription is still on this computer, untouched. You
            can save all of it to a pen drive right now, whether or not you ever pay us
            another rupee. We have never held a copy of any of it and we cannot.
          </p>
          <button className="btn wide ghost" onClick={async () => {
            await downloadBackup('full'); setSaved(true)
          }}>{saved ? 'Saved ✓  save again' : 'Save everything to a file'}</button>
        </div>

        <p className="hint frz-foot">
          Tonight, the paper pad. It has never let a clinic down and it does not need us.
        </p>
      </div>
    </div>
  )
}
