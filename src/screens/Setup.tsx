import { useRef, useState } from 'react'
import { adminIsSet, adminUnlocked, unlockAdmin, lockAdmin, setAdminKey } from '../profile'
import { role, can, ROLE_NAME, ROLE_SD, ROLES, pinSet, setRolePin, type Role } from '../roles'
import { downloadBackup, readBackup, readFile, restore, type RestoreReport } from '../backup'
import { clearRecords, factoryReset, type ResetReport } from '../reset'
import { IdentityFields, PaperFields, TokenFields, LogoFields, FeeFields, useDraftProfile, useDraftPaper } from './setup/fields'
import DrugsStep from './setup/DrugsStep'
import ReviewQueue from './setup/ReviewQueue'
import MarketPaste from './setup/MarketPaste'
import { Note } from '../ui/Note'
import { soundOn, setSound, play } from '../ui/sound'
import { SPECIALTIES, seedDiagnoses, diagnosisSd } from '../data/specialty'
import { profile, saveProfile } from '../profile'

/**
 * Who may change what.
 *
 *   The clinic     — paper, his own medicine list, his own PIN, and taking a
 *                    backup. Everything he needs to run tonight.
 *   The company    — his name, degrees, registration number, logo, the credit
 *                    line, and reviewing medicines into the shared catalogue.
 *
 * The split is not about trust. Identity fields constitute a legal identity on
 * a medical document, they change roughly never, and we install in person. The
 * medicine list is the opposite on every count, so it stays with the doctor.
 */
type Tab = 'Fee' | 'Paper' | 'Medicines' | 'Diagnoses' | 'Lock' | 'Backup' | 'You' | 'Heading' | 'Review' | 'Market'

/** Each tab names the ONE permission that opens it. Nothing decides twice. */
const NEEDS: Record<Tab, Parameters<typeof can>[0]> = {
  Fee: 'rate', Paper: 'paper', Medicines: 'medicines', Diagnoses: 'medicines',
  Lock: 'lock', Backup: 'backup',
  You: 'identity', Heading: 'identity', Market: 'review', Review: 'review',
}
const CLINIC: Tab[] = ['Fee', 'Paper', 'Medicines', 'Diagnoses', 'Lock']
const ADMIN: Tab[] = ['You', 'Heading', 'Market', 'Review', 'Backup']

export default function Setup({ onBack }: { onBack: () => void }) {
  const mine = CLINIC.filter(t => can(NEEDS[t]))
  const [tab, setTab] = useState<Tab>(mine[0] ?? 'Fee')
  const [, redraw] = useState(0)
  const dr = useDraftProfile()
  const pp = useDraftPaper()
  const [saved, setSaved] = useState(false)

  const open = adminUnlocked()
  const on = <T,>(f: (p: T) => void) => (p: T) => { f(p); setSaved(false) }

  /** PINs save themselves, per role, inside PinTab. Everything else here is a
   *  draft the person edits and then commits with one button. */
  function save() {
    dr.commit(); pp.commit(); setSaved(true)
  }

  return (
    <div className="pane setup">
      <button className="btn ghost" onClick={onBack}>&larr; Queue</button>

      {/* Whoever is at the keyboard should never have to guess what they are
          allowed to change. The role is stated, and so is how to change it. */}
      <div className={'rolebar r-' + role()}>
        <span className="who">{ROLE_NAME[role()]} <span className="sd">{ROLE_SD[role()]}</span></span>
        <span className="can">
          {role() === 'admin'
            ? 'Everything, including the doctor\u2019s name, logo, the medicine review and backups.'
            : role() === 'doctor'
            ? 'The fee, paper and page size, the medicine list, and the PINs.'
            : 'The fee the counter charges. Nothing else on this machine.'}
        </span>
        {open && adminIsSet()
          ? <button className="lnk" onClick={() => { lockAdmin(); redraw(n => n + 1) }}>sign out of admin</button>
          : !open && <button className="lnk" onClick={() => setTab('You')}>sign in as Nuskho admin</button>}
      </div>

      {/* With no passphrase set, nothing is locked and whoever is at the keyboard
          is admin. That is correct for a machine we have not handed over — and a
          quiet disaster on one we have. Say so rather than let it pass. */}
      {!adminIsSet() && (
        <Note tone="stop" title="Nothing is locked on this computer">
          No Nuskho passphrase is set, so the doctor's name, registration number and logo
          can be changed by anyone who opens Setup. Set one under <b>Lock</b> before this
          machine is handed over.
        </Note>
      )}

      <div className="tabs">
        {mine.map(t => (
          <button key={t} className={'tab' + (tab === t ? ' on' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
        <span className="tabsep" />
        {ADMIN.filter(t => role() === 'admin' || adminIsSet()).map(t => (
          <button key={t} className={'tab adm' + (tab === t ? ' on' : '')} onClick={() => setTab(t)}>
            {open ? '' : '🔒 '}{t}
          </button>
        ))}
        {open && adminIsSet() && (
          <button className="lnk" onClick={() => { lockAdmin(); redraw(n => n + 1) }}>lock</button>
        )}
      </div>

      {ADMIN.includes(tab) && !open
        ? <AdminGate onOpen={() => redraw(n => n + 1)} />
        : <>
            {tab === 'Fee' && <FeeFields v={dr.v} on={on(dr.on)} />}
            {tab === 'Paper' && <><PaperFields v={pp.v} on={on(pp.on)} /><TokenFields v={pp.v} on={on(pp.on)} /></>}
            {tab === 'Medicines' && <DrugsStep />}
            {tab === 'Diagnoses' && <DxTab />}
            {tab === 'Backup' && <BackupTab />}
            {tab === 'You' && <IdentityFields v={dr.v} on={on(dr.on)} />}
            {tab === 'Review' && <ReviewQueue />}
            {tab === 'Market' && <MarketPaste />}
            {tab === 'You' && (
              <div className="lhbox" style={{ marginTop: 18 }}>
                <h3>Set this machine up again from the start</h3>
                <p>
                  Walks through the whole first-run sequence again: who is prescribing,
                  paper and page size, heading, medicines, PIN, with everything already
                  filled in as it is now. Nothing is erased: patients, prescriptions and the
                  medicine list all stay exactly where they are.
                </p>
                <button className="btn wide" onClick={() => {
                  onBack()
                  setTimeout(() => window.dispatchEvent(new CustomEvent('nuskho:wizard')), 0)
                }}>Run setup again</button>
              </div>
            )}
            {tab === 'Heading' && (
              pp.v.kind === 'letterhead'
                ? <p className="hint">This clinic prints on its own letterhead, so the app prints
                    no heading at all. Switch to plain paper under <b>Paper</b> to use one.</p>
                : <LogoFields v={dr.v} on={on(dr.on)} />
            )}
            {tab === 'Lock' && <PinTab />}

            {tab !== 'Medicines' && tab !== 'Backup' && tab !== 'Review' && tab !== 'Market'
              && tab !== 'Lock' && tab !== 'Diagnoses' && (
              <button className="btn wide save" onClick={save}>{saved ? 'Saved ✓' : 'Save'}</button>
            )}
          </>}
    </div>
  )
}

/* ------------------------------------------------------------------- gate */

function AdminGate({ onOpen }: { onOpen: () => void }) {
  const [pass, setPass] = useState('')
  const [bad, setBad] = useState(false)

  async function go() {
    if (await unlockAdmin(pass)) { onOpen() } else { setBad(true); setPass('') }
  }
  return (
    <div className="gate">
      <h3>Held by Nuskho</h3>
      <p className="hint">
        The doctor's name, degrees and registration number are what identify a prescription
        as his. They are set when we install and changed by us, so that nothing on a
        printed medical document can be altered by whoever happens to be at the keyboard.
        If any of it is wrong, call us and we will change it.
      </p>
      <div className="fld"><label>Nuskho passphrase</label>
        <input type="password" value={pass} autoFocus
               onChange={e => { setPass(e.target.value); setBad(false) }}
               onKeyDown={e => { if (e.key === 'Enter') go() }} /></div>
      {bad && <p className="usable bad">Wrong passphrase.</p>}
      <button className="btn wide" disabled={!pass} onClick={go}>Unlock</button>
    </div>
  )
}

/**
 * One PIN per role, all optional.
 *
 * The old screen had a single PIN for the whole machine, which separated
 * outsiders from the clinic and nothing else. It could not stop the counter
 * opening the doctor's screen, because there was no such thing as the doctor's
 * screen. Now there is, so the lock has somewhere to bite.
 *
 * Setting none is a legitimate, supported choice. A one-room clinic where the
 * doctor is also the counter should not have to type anything.
 */
function PinTab() {
  const [pin, setPin] = useState<Record<Role, string>>({ counter: '', doctor: '', admin: '' })
  const [msg, setMsg] = useState('')
  const [, redraw] = useState(0)

  async function save(r: Role) {
    const v = pin[r]
    if (v && v.length < 4) { setMsg('Use at least 4 digits.'); return }
    await setRolePin(r, v)
    setPin(p => ({ ...p, [r]: '' }))
    setMsg(v ? `${ROLE_NAME[r]} PIN saved.` : `${ROLE_NAME[r]} PIN removed.`)
    redraw(n => n + 1)
  }

  return (
    <>
      <p className="hint">
        A number the person types when they pick their role at the front door. Held on this
        computer only. Nobody, including us, can look one up or reset it. Leave a box blank
        and save to remove that PIN.
      </p>

      {ROLES.map(r => (
        <div className="pinrow" key={r}>
          <div className="pw">
            <b>{ROLE_NAME[r]} <span className="sd">{ROLE_SD[r]}</span></b>
            <small>{pinSet(r) ? 'A PIN is set' : 'No PIN, opens with one tap'}</small>
          </div>
          <input type="password" inputMode="numeric" maxLength={8} placeholder="4+ digits"
                 value={pin[r]}
                 onChange={e => { setPin(p => ({ ...p, [r]: e.target.value.replace(/\D/g, '') })); setMsg('') }} />
          <button className="btn ghost" onClick={() => save(r)}>Save</button>
        </div>
      ))}
      {msg && <p className="usable">{msg}</p>}

      <p className="hint">
        <b>There is no way to recover a forgotten PIN.</b> If the doctor\'s is lost, his screen
        on this machine is lost with it, and the records go with the machine. Write them down
        somewhere only you can reach.
      </p>

      <SoundBox />
      <AdminKeyBox />
    </>
  )
}

/**
 * Sound is a clinic-wide switch, not a per-role one.
 *
 * It sits with the locks because both answer the same question: what does this
 * machine do when nobody is looking at it. And it is stated honestly — turning
 * it off does not weaken anything, because every cue in this app is a chime on
 * top of something that is also written on the screen.
 */
/**
 * The doctor's own diagnoses.
 *
 * He picks his field once, which fills the list with things he recognises, and
 * then it is his: delete what he never writes, add what he writes daily. From
 * that moment nothing we ship changes it, because a list that quietly rewrites
 * itself when the app updates is a list he stops trusting.
 */
function DxTab() {
  const p = profile()
  const [spec, setSpec] = useState(p.specialty || 'gp')
  const [list, setList] = useState<string[]>(p.dx.length ? p.dx : seedDiagnoses(p.specialty || 'gp'))
  const [add, setAdd] = useState('')
  const [msg, setMsg] = useState('')

  const save = (next: string[], nextSpec = spec) => {
    setList(next); setSpec(nextSpec)
    saveProfile({ dx: next, specialty: nextSpec })
    setMsg('Saved.')
  }

  function useSeed(id: string) {
    // Merge rather than replace: a doctor who changes his mind about the label
    // should not lose the twelve he already added.
    const seed = seedDiagnoses(id)
    const merged = [...seed, ...list.filter(d => !seed.includes(d))]
    save(merged, id)
  }

  return (
    <>
      <div className="fld">
        <label>What kind of doctor is he?</label>
        <div className="chips">
          {SPECIALTIES.map(s => (
            <button key={s.id} className={'chip' + (spec === s.id ? ' on' : '')}
                    onClick={() => useSeed(s.id)}>
              {s.name} <small className="sd">{s.sd}</small>
            </button>
          ))}
        </div>
        <span className="unit">
          This only decides what the list below starts as. Everything after that is his.
        </span>
      </div>

      <h3>On his screen — {list.length}</h3>
      <div className="dxlist">
        {list.map(d => (
          <span className="dxchip" key={d}>
            {d}
            {diagnosisSd(d) && <i className="sd">{diagnosisSd(d)}</i>}
            <button onClick={() => save(list.filter(x => x !== d))} title="remove">×</button>
          </span>
        ))}
        {!list.length && <p className="hint">Nothing on the list. He will be typing every diagnosis.</p>}
      </div>

      <div className="saveset">
        <input value={add} placeholder="add one he writes often"
               onChange={e => { setAdd(e.target.value); setMsg('') }}
               onKeyDown={e => {
                 if (e.key === 'Enter' && add.trim() && !list.includes(add.trim())) {
                   save([...list, add.trim()]); setAdd('')
                 }
               }} />
        <button className="btn" disabled={!add.trim() || list.includes(add.trim())}
                onClick={() => { save([...list, add.trim()]); setAdd('') }}>Add</button>
      </div>
      {msg && <p className="usable">{msg}</p>}

      <Note tone="safe" title="The app never suggests a diagnosis">
        These are shortcuts for writing down what the doctor has already decided. Nothing here
        reads symptoms, ranks anything, or offers an opinion about what is wrong with a patient,
        and it never will.
      </Note>
    </>
  )
}

function SoundBox() {
  const [on, setOn] = useState(soundOn())
  return (
    <div className="lhbox">
      <h3>Sounds</h3>
      <label className="check">
        <input type="checkbox" checked={on}
               onChange={e => { setSound(e.target.checked); setOn(e.target.checked); if (e.target.checked) play('patient') }} />
        <span>Chime when something happens.
          <small>A new patient, one who cannot wait, money to hand back, the doctor's bell.
            Every one of them also appears on screen, so turning this off loses nothing but
            the noise.</small></span>
      </label>
      {on && (
        <div className="chips" style={{ marginTop: 12 }}>
          {(['patient', 'urgent', 'money', 'bell', 'done', 'oops'] as const).map(c => (
            <button key={c} className="chip" onClick={() => play(c)}>hear “{c}”</button>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminKeyBox() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [m, setM] = useState('')
  async function go() {
    if (a !== b) { setM('The two entries do not match.'); return }
    await setAdminKey(a)
    setM(a ? 'Nuskho passphrase set.' : 'Nuskho passphrase removed. Nothing is locked.')
    setA(''); setB('')
  }
  return (
    <div className="lhbox">
      <h3>Nuskho passphrase</h3>
      <p>
        Ours, not the clinic's. It locks the doctor's identity and logo so they cannot be
        changed at the keyboard. Set it before handing the machine over.
        {adminIsSet() ? ' One is set.' : ' None is set, so nothing is locked yet.'}
      </p>
      <div className="row">
        <div className="fld"><label>Passphrase</label>
          <input type="password" value={a} onChange={e => { setA(e.target.value); setM('') }} /></div>
        <div className="fld"><label>Type it again</label>
          <input type="password" value={b} onChange={e => { setB(e.target.value); setM('') }} /></div>
      </div>
      {m && <p className="usable">{m}</p>}
      <button className="btn" onClick={go}>Set passphrase</button>
    </div>
  )
}

/* ----------------------------------------------------------------- backup */

function BackupTab() {
  const file = useRef<HTMLInputElement>(null)
  const [rep, setRep] = useState<RestoreReport | null>(null)
  const [err, setErr] = useState('')

  async function take(f: File) {
    setErr(''); setRep(null)
    try {
      setRep(await restore(readBackup(await readFile(f))))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'That file could not be read.')
    }
  }

  return (
    <>
      <p className="hint">
        Everything this app knows is on this one machine. That is what lets it work with the
        internet down, and it means a lost laptop loses the lot unless you take these.
      </p>

      <div className="lhbox">
        <h3>Clinic setup, no patient data</h3>
        <p>
          Who the doctor is, what he prints on, and his medicine list. Take this to a new PC,
          a tablet or a phone and it is set up in one step. No patient data, so it is safe to
          email or keep on a pen drive. It also carries the Nuskho lock, so the new machine is
          locked the same way, which is why the passphrase should not be a short word.
        </p>
        <button className="btn wide" onClick={() => downloadBackup('setup')}>
          Save the setup file
        </button>
      </div>

      <div className="lhbox">
        <h3>Everything, including patients</h3>
        <p>
          The same, plus every patient and every prescription. <b>This is medical records.</b>
          Keep it in the clinic, on a drive that does not leave the room. Do not email it,
          and do not send it to us.
        </p>
        <button className="btn wide" onClick={() => downloadBackup('full')}>
          Save the full backup
        </button>
      </div>

      <h3>Restore onto this machine</h3>
      <p className="hint">
        Adds what is missing and leaves what is already here alone. Restoring the same file
        twice will not duplicate anything, and will not overwrite a correction made since.
      </p>
      <button className="btn wide" onClick={() => file.current?.click()}>Choose a Nuskho file</button>
      <input ref={file} type="file" accept="application/json,.json" hidden
             onChange={e => { const f = e.target.files?.[0]; if (f) take(f); e.target.value = '' }} />
      {err && <p className="usable bad">{err}</p>}
      {rep && (
        <div className="sumbox">
          <div><span>Medicines added</span><b>{rep.drugs}</b></div>
          {rep.kind === 'full' && <div><span>Patients added</span><b>{rep.patients}</b></div>}
          {rep.kind === 'full' && <div><span>Prescriptions added</span><b>{rep.visits}</b></div>}
          <div><span>Already here, left alone</span><b>{rep.skipped}</b></div>
        </div>
      )}

      {adminUnlocked() && <DangerZone />}
    </>
  )
}

/* ------------------------------------------------------------------ erase */

function DangerZone() {
  const [mode, setMode] = useState<'records' | 'factory' | null>(null)
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState<ResetReport | null>(null)

  const WORD = mode === 'factory' ? 'ERASE EVERYTHING' : 'CLEAR RECORDS'

  async function go() {
    if (typed.trim().toUpperCase() !== WORD) return
    const r = mode === 'factory' ? await factoryReset() : await clearRecords()
    setDone(r); setMode(null); setTyped('')
    setTimeout(() => location.reload(), 1600)
  }

  if (done) {
    return (
      <div className="danger done">
        <b>Erased {done.patients} patients and {done.visits} prescriptions
          {done.drugs ? ` and ${done.drugs} medicines` : ''}.</b>
        <span>Reloading…</span>
      </div>
    )
  }

  return (
    <div className="danger">
      <h3>Start fresh</h3>
      <p className="hint">
        There is no server holding a copy of any of this. Once it is gone it is gone.
        Take a backup above first if there is the slightest doubt.
      </p>

      <div className="drow2">
        <div>
          <b>Clear patients and prescriptions</b>
          <span>Throws away every patient and every slip. Keeps the
            doctor, his paper settings and his medicine list exactly as they are.</span>
        </div>
        <button className="btn warn" onClick={() => { setMode('records'); setTyped('') }}>Clear records</button>
      </div>

      <div className="drow2">
        <div>
          <b>Erase everything on this machine</b>
          <span>Patients, prescriptions, medicines, the doctor's details, the paper
            settings, both passphrases. The next launch starts at the welcome screen.
            Only for a machine going to a different clinic.</span>
        </div>
        <button className="btn warn" onClick={() => { setMode('factory'); setTyped('') }}>Erase everything</button>
      </div>

      {mode && (
        <div className="confirm">
          <p><b>This cannot be undone.</b> Type <code>{WORD}</code> to go ahead.</p>
          <div className="row">
            <div className="fld"><input value={typed} autoFocus
                   onChange={e => setTyped(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter') go() }} /></div>
            <button className="btn warn" disabled={typed.trim().toUpperCase() !== WORD} onClick={go}>
              {mode === 'factory' ? 'Erase everything' : 'Clear records'}
            </button>
            <button className="btn ghost" onClick={() => { setMode(null); setTyped('') }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
