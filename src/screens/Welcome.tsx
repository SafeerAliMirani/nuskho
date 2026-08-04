import { useRef, useState } from 'react'
import { profile, saveProfile, APP, profileComplete } from '../profile'
import { setRolePin } from '../roles'
import { paper } from '../paper'
import { IdentityFields, PaperFields, TokenFields, LogoFields, FeeFields, useDraftProfile, useDraftPaper } from './setup/fields'
import DrugsStep from './setup/DrugsStep'
import { Mark, ArtSlip } from '../ui/art'
import { readBackup, readFile, restore, type RestoreReport } from '../backup'
import { setAdminKey } from '../profile'
import { isDemo } from '../version'

/**
 * First run.
 *
 * Every clinic is different — a different printer, a different letterhead, a
 * laptop or a tablet, A4 or A5 — so nothing can be assumed and nothing may be
 * silently defaulted onto a doctor. This is walked through once, with us
 * sitting beside him, and then never seen again.
 *
 * It ends on a test print on purpose. A setup that has not put ink on paper is
 * not finished, it is only typed.
 */
const STEPS = ['Welcome', 'You', 'Fee', 'Paper', 'Heading', 'Medicines', 'Lock', 'Test'] as const

export default function Welcome({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const dr = useDraftProfile()
  const pp = useDraftPaper()
  const [pin, setPinText] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinErr, setPinErr] = useState('')
  const [admin, setAdmin] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const [rep, setRep] = useState<RestoreReport | null>(null)
  const [impErr, setImpErr] = useState('')

  const step = STEPS[i]
  const plain = pp.v.kind === 'plain'
  // the heading step is meaningless on his own letterhead — we print nothing there
  const skipHeading = !plain

  function go(d: number) {
    let n = i + d
    if (STEPS[n] === 'Heading' && skipHeading) n += d
    setI(Math.max(0, Math.min(STEPS.length - 1, n)))
  }

  /** Second machine: a setup file carries the whole clinic across in one step. */
  async function importSetup(f: File) {
    setImpErr(''); setRep(null)
    try {
      const r = await restore(readBackup(await readFile(f)), true)
      setRep(r)
      setTimeout(onDone, 1400)
    } catch (e) {
      setImpErr(e instanceof Error ? e.message : 'That file could not be read.')
    }
  }

  async function finish() {
    if (pin) {
      if (pin.length < 4) { setPinErr('Use at least 4 digits.'); setI(STEPS.indexOf('Lock')); return }
      if (pin !== pin2) { setPinErr('The two entries do not match.'); setI(STEPS.indexOf('Lock')); return }
      // The wizard sets the DOCTOR's PIN. The counter is left open on purpose:
      // a locked counter on day one is a clinic that cannot issue a token.
      await setRolePin('doctor', pin)
    }
    // locked from this moment: the machine is about to change hands
    if (admin) await setAdminKey(admin, false)
    dr.commit()
    pp.commit()
    saveProfile({ ready: true })
    onDone()
  }

  const canLeaveYou = profileComplete(dr.v)

  return (
    <div className="pane wiz">
      {step !== 'Welcome' && (
        <div className="wizbar">
          {STEPS.slice(1).map((s, k) => (
            <span key={s} className={'wstep' + (k + 1 === i ? ' on' : k + 1 < i ? ' done' : '')}>{s}</span>
          ))}
        </div>
      )}

      {step === 'Welcome' && (
        <div className="intro">
          <div className="introtop">
            <div>
              <div className="mark"><Mark size={30} /> <span className="sd">{APP.sd}</span> <b>{APP.en}</b></div>
              <h1>The prescription, printed.</h1>
              <p className="lead">
                English for the chemist. Sindhi for the family. Pictures for whoever cannot
                read either. The doctor taps; the paper comes out the same every time.
              </p>
            </div>
            <div className="introart"><ArtSlip /></div>
          </div>
          <ul className="pts">
            <li><b>No handwriting to misread.</b> The chemist reads the brand exactly as it is
              printed on the box, in the order you prescribed it.</li>
            <li><b>The slip is the patient's card.</b> His number is on it, so next time you
              open his whole history by typing five digits.</li>
            <li><b>It works with the internet down.</b> Everything is on this computer. Nothing
              waits for a network, ever.</li>
          </ul>
          <p className="fine">
            Patient records stay on this machine. Nothing is sold, and nothing is shared with
            any drug company, not now and not later.
          </p>
          {/* THE PRACTICE DOOR.
              On the public copy this is the main way in, not an afterthought:
              nobody has installed anything, nobody is committing to anything,
              and the product is one piece of paper that has to be seen. On a
              real clinic build the same button is what it always was — a way
              to look around before setting up. */}
          {isDemo ? (
            <>
              <button className="btn wide" onClick={onDone}>
                Try it now &nbsp; آزمائي ڏسو
              </button>
              <p className="fine">
                A practice copy. Type anything you like — <b>everything printed says
                SPECIMEN across it</b>, nothing is saved to a file, and it clears itself.
                No patient of yours should be entered here.
              </p>
              <button className="lnk mid" onClick={() => setI(1)}>
                Set up a real clinic on this computer
              </button>
            </>
          ) : (
            <button className="btn wide" onClick={() => setI(1)}>Set up the clinic &nbsp; شروع ڪريو</button>
          )}
          {/* "Join a clinic that already exists" is what this actually is, and
              saying so matters: a second machine at the same clinic is the
              common case, and nobody reading "setup file" knows that is them. */}
          <button className="lnk mid" onClick={() => file.current?.click()}>
            Join a clinic that already exists — I have its setup file
          </button>
          <input ref={file} type="file" accept="application/json,.json" hidden
                 onChange={e => { const f = e.target.files?.[0]; if (f) importSetup(f); e.target.value = '' }} />
          {impErr && <p className="usable bad">{impErr}</p>}
          {rep && (
            <div className="sumbox">
              <div><span>Medicines brought over</span><b>{rep.drugs}</b></div>
              {rep.kind === 'full' && <div><span>Patients</span><b>{rep.patients}</b></div>}
              <div><span>Ready</span><b>opening…</b></div>
            </div>
          )}
          {!isDemo && (
            <button className="lnk mid" onClick={onDone}>
              {profile().ready ? 'Leave setup as it is' : 'Skip for now, I am only looking'}
            </button>
          )}
        </div>
      )}

      {step === 'You' && (
        <>
          <h2>Who is prescribing</h2>
          <IdentityFields v={dr.v} on={dr.on} />
          {!canLeaveYou && <p className="usable bad">A name has to print on every slip.</p>}
        </>
      )}

      {step === 'Fee' && (
        <>
          <h2>What the counter charges</h2>
          <FeeFields v={dr.v} on={dr.on} />
        </>
      )}

      {step === 'Paper' && (
        <>
          <h2>What you print on</h2>
          <PaperFields v={pp.v} on={pp.on} />
          <TokenFields v={pp.v} on={pp.on} />
        </>
      )}

      {step === 'Heading' && (
        <>
          <h2>Your heading</h2>
          <LogoFields v={dr.v} on={dr.on} />
        </>
      )}

      {step === 'Medicines' && (
        <>
          <h2>The medicines you actually prescribe</h2>
          <DrugsStep />
        </>
      )}

      {step === 'Lock' && (
        <>
          <h2>Lock this computer</h2>
          <p className="hint">
            At the front door everyone picks who they are: <b>Counter</b>, <b>Doctor</b> or
            Nuskho. The counter sees names, numbers and fees. Only the doctor can open a
            prescription or read what a patient was given before.
            <br /><br />
            This number locks the doctor's side, so the counter cannot open the room's screen.
            It is kept <b>on this computer only</b>. No account, no internet, and it never
            stands between you and a prescription once you are in. Leave it blank if the same
            person does both jobs. You can set one for the counter later under Setup, Lock.
          </p>
          <div className="row">
            <div className="fld"><label>Doctor's PIN — 4 digits or more</label>
              <input type="password" inputMode="numeric" value={pin} maxLength={8}
                     onChange={e => { setPinText(e.target.value.replace(/\D/g, '')); setPinErr('') }} /></div>
            <div className="fld"><label>Type it again</label>
              <input type="password" inputMode="numeric" value={pin2} maxLength={8}
                     onChange={e => { setPin2(e.target.value.replace(/\D/g, '')); setPinErr('') }} /></div>
          </div>
          {pinErr && <p className="usable bad">{pinErr}</p>}
          <p className="hint">
            There is no way to recover a forgotten PIN, and no way for us to unlock it for
            you. If it is lost, the records on this machine are lost with it. Write it down
            somewhere only you can reach.
          </p>

          <div className="lhbox">
            <h3>Nuskho passphrase, for us and not the clinic</h3>
            <p>
              Set by whoever is installing. It locks the doctor's name, degrees, registration
              number and logo so they cannot be changed at the keyboard afterwards. His paper
              settings, his medicine list and his own PIN stay his. Leave it blank and nothing
              is locked.
            </p>
            <div className="fld"><label>Passphrase</label>
              <input type="password" value={admin} onChange={e => setAdmin(e.target.value)} /></div>
          </div>
        </>
      )}

      {step === 'Test' && (
        <>
          <h2>Put ink on paper</h2>
          <p className="hint">
            Setup is not finished until something has actually printed. Save, then issue
            yourself a token, add two medicines and print one slip.
            {pp.v.kind === 'letterhead'
              ? ' Hold it against a blank letterhead and check nothing sits on your heading.'
              : ' Check your name and degrees are right.'}
          </p>
          <div className="sumbox">
            <div><span>Doctor</span><b>{dr.v.doctorEn || '—'}</b></div>
            <div><span>Registration</span><b>{dr.v.reg || 'not printed'}</b></div>
            <div><span>Fee</span><b>{dr.v.fee ? `Rs ${dr.v.fee}` : 'not set'}</b></div>
            <div><span>Paper</span><b>{pp.v.size} — {pp.v.kind === 'plain' ? 'plain' : `your letterhead (${pp.v.top}/${pp.v.bottom}mm)`}</b></div>
            <div><span>Lock</span><b>{pin ? 'PIN set' : 'none'}</b></div>
            <div><span>Nuskho passphrase</span><b>{admin ? 'set' : 'not set, nothing locked'}</b></div>
          </div>
        </>
      )}

      {step !== 'Welcome' && (
        <div className="wiznav">
          <button className="btn ghost" onClick={() => go(-1)}>Back</button>
          {step === 'Test'
            ? <button className="btn wide" onClick={finish}>Save and start &nbsp; محفوظ ڪريو</button>
            : <button className="btn wide" disabled={step === 'You' && !canLeaveYou}
                      onClick={() => go(1)}>Next</button>}
        </div>
      )}
    </div>
  )
}

/** Has this machine been set up? */
export function needsWelcome(): boolean {
  return !profile().ready && !profileComplete() && paper().kind === 'plain'
}
