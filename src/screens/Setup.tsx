import { useEffect, useRef, useState } from 'react'
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
import {
  allDoctors, addDoctor, updateDoctor, setDoctorArchived, FIRST_DOCTOR, type Doctor,
} from '../doctors'
import { buildingMode, hostHere, setHostHere, sittingsList } from '../building'
import { qrSvgRaw } from '../print/qr'

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
type Tab = 'Fee' | 'Paper' | 'Medicines' | 'Diagnoses' | 'Lock' | 'Wifi' | 'Backup' | 'You' | 'Doctors' | 'Heading' | 'Review' | 'Market'

/** Each tab names the ONE permission that opens it. Nothing decides twice. */
const NEEDS: Record<Tab, Parameters<typeof can>[0]> = {
  Fee: 'rate', Paper: 'paper', Medicines: 'medicines', Diagnoses: 'medicines',
  Lock: 'lock', Wifi: 'paper', Backup: 'backup',
  You: 'identity', Doctors: 'identity', Heading: 'identity', Market: 'review', Review: 'review',
}
/**
 * BACKUP IS THE DOCTOR'S, AND IT WAS SITTING BEHIND OUR LOCK.
 *
 * roles.ts gives `backup` to the doctor and deliberately withholds it from the
 * Nuskho role, because an export is a complete copy of every prescription in
 * the building. This list said otherwise: Backup lived in the admin group, so
 * a doctor could not take his own records out without our passphrase, while
 * anyone holding that passphrase could. The agreement tells the clinic that
 * backups are their duty; the app was making them impossible, and it was
 * quietly reopening the vendor key the roles were written to close.
 *
 * It is a clinic tab now, filtered by `can('backup')` like every other one, so
 * the doctor reaches it and the Nuskho role does not see it at all.
 */
const CLINIC: Tab[] = ['Fee', 'Paper', 'Medicines', 'Diagnoses', 'Lock', 'Wifi', 'Backup']
const ADMIN: Tab[] = ['You', 'Doctors', 'Heading', 'Market', 'Review']

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

  // On a phone the tab row scrolls sideways with the scrollbar hidden, so the
  // active tab could sit entirely off-screen and nothing said more existed.
  // The chosen tab now pulls itself into view.
  useEffect(() => {
    document.querySelector('.tabs .tab.on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [tab])

  return (
    <div className="pane setup">
      <button className="btn ghost" onClick={onBack}>&larr; Queue</button>

      {/* Whoever is at the keyboard should never have to guess what they are
          allowed to change. The role is stated, and so is how to change it. */}
      <div className={'rolebar r-' + role()}>
        <span className="who">{ROLE_NAME[role()]} <span className="sd">{ROLE_SD[role()]}</span></span>
        <span className="can">
          {role() === 'admin'
            ? 'The doctor\u2019s name, logo and the medicine review. Not his records, and not his backups.'
            : role() === 'doctor'
            ? 'The fee, paper and page size, the medicine list, the PINs, and your own backups.'
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
            {tab === 'Wifi' && <WifiTab />}
            {tab === 'Doctors' && <DoctorsTab />}
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
              && tab !== 'Lock' && tab !== 'Diagnoses' && tab !== 'Doctors' && tab !== 'Wifi' && (
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
  const [pin, setPin] = useState<Record<Role, string>>({ counter: '', compounder: '', doctor: '', pharmacy: '', clinicadmin: '', admin: '' })
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
        <b>There is no way to recover a forgotten PIN.</b> If the doctor's PIN is lost, his
        screen on this machine is lost with it, and the records go with the machine. Write
        them down somewhere only you can reach.
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

/* ------------------------------------------------------------------- wifi */

/**
 * The building's own wire, explained where the person who runs it stands.
 *
 * Three states, told apart honestly: not on the wire at all (a solo folder or
 * the public copy — the common case, and nothing here applies), a MIRROR (a
 * phone that joined and should never be marked as the record holder), and
 * the RECORD HOLDER, which is the one machine whose browser keeps the
 * database, marked here by a human, once, during the install.
 */
function WifiTab() {
  const mode = buildingMode()
  const [, redraw] = useState(0)

  if (mode === 'off') {
    return (
      <>
        <h3>Phones and tablets in the building</h3>
        <p className="hint">
          This copy is not on a building wire right now, which is normal for a solo
          clinic. To put the building on its own wifi: on the one machine that will
          hold the records, run <code>node tools\nuskho-wifi.cjs</code> in the clinic
          folder. It prints an address; open the app AT that address on this machine,
          mark it as the record holder under this same tab, and every phone on the
          clinic wifi joins by scanning the square that appears here. No internet is
          involved at any point, and the phones hold no records, ever.
        </p>
        <Note tone="safe" title="What a phone can never do">
          A phone is a door and a screen. It signs in with a role PIN checked by the
          record holder, shows the queue, and asks the record holder to make changes.
          Steal the phone and you have stolen a mirror: there is nothing inside it.
        </Note>
      </>
    )
  }

  const host = hostHere()
  const joined = sittingsList()

  return (
    <>
      <h3>This machine on the building's wire</h3>
      <label className="check">
        <input type="checkbox" checked={host}
               onChange={e => {
                 setHostHere(e.target.checked)
                 redraw(n => n + 1)
               }} />
        <span><b>This machine holds the records</b>
          <small>Exactly one machine in the building should have this ticked: the one whose
            browser keeps the database. Phones must leave it off. Reload after changing it.</small></span>
      </label>

      {mode === 'host' && (
        <>
          <div className="lhbox">
            <h3>Phones join by scanning this</h3>
            <p>
              On the clinic wifi, point the phone's camera here. The address opens in the
              browser; add it to the home screen once and it is an app icon from then on.
            </p>
            <div dangerouslySetInnerHTML={{ __html: qrSvgRaw(location.origin, 190) }} />
            <p className="hint"><code>{location.origin}</code></p>
          </div>
          <div className="lhbox">
            <h3>Signed in on the wire now — {joined.length}</h3>
            {joined.length
              ? <p>{joined.map((j, i) => <span key={i} className="chip" style={{ marginRight: 6 }}>{ROLE_NAME[j.role]}</span>)}</p>
              : <p className="hint">No phone has signed in yet this sitting.</p>}
          </div>
          <Note tone="safe" title="What crosses the wire">
            Names, numbers and money state go to signed-in desk phones, the same facts the
            paper register at the gate already shows. Medicine lines go only to a phone
            signed in as Pharmacy, only for printed slips. Diagnoses, histories and the
            records themselves never leave this machine, and nothing here touches the
            internet. The wifi password is the building's front gate: give it only as you
            would give a key to the building.
          </Note>
        </>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- doctors */

/**
 * The building's rooms.
 *
 * One doctor here means the shipped solo product, untouched. The moment a
 * second is added, the whole app becomes a corridor: the desk grows the
 * Tonight strip, tokens count per room, the front door asks which doctor,
 * and every slip and receipt carries its own room's name.
 *
 * The first doctor is deliberately NOT edited here — he IS the profile from
 * the first-run wizard, and two screens editing one name is how a
 * prescription ends up with two spellings of it. The You tab stays his.
 */
const BLANK = { nameEn: '', nameSd: '', degreesEn: '', degreesSd: '', reg: '', fee: '', room: '' }

/**
 * THE APP'S OWN HINT MUST NEVER BECOME A DOCTOR'S NAME.
 *
 * This field's label used to read "Name, Sindhi — سنڌي ۾ نالو", which is the
 * Sindhi for "name in Sindhi". Safeer added a second doctor and that exact
 * phrase ended up saved as her name, so the front door read "Pirah, name in
 * Sindhi" and it would have printed in the letterhead of every slip out of
 * Room 2. Nobody who cannot read Sindhi would ever have caught it, which is
 * the whole reason the rule about unreviewed Sindhi exists.
 *
 * The label no longer offers a Sindhi phrase to copy. This is the second line:
 * whatever the route, typed, pasted or predicted by a phone keyboard, the app
 * refuses to accept a word it wrote itself as somebody's name.
 */
const OUR_OWN_WORDS = [
  'سنڌي ۾ نالو',      // name in Sindhi
  'نالو',              // name
  'ڊاڪٽر جو نالو',     // the doctor's name
  'سنڌي',              // Sindhi
  'name in sindhi', 'name, sindhi', 'sindhi',
]
const isOurHint = (s: string) => {
  const t = s.trim().toLowerCase().replace(/\s+/g, ' ')
  return t.length > 0 && OUR_OWN_WORDS.some(w => t === w.toLowerCase())
}

function DoctorsTab() {
  const [, redraw] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)   // doctor id, or 'new'
  const [f, setF] = useState(BLANK)
  const [msg, setMsg] = useState('')

  const list = allDoctors()
  const bump = () => redraw(n => n + 1)

  function openNew() {
    const rooms = list.map(d => +d.room).filter(n => !isNaN(n))
    setF({ ...BLANK, room: String(Math.max(1, ...rooms) + 1) })
    setEditing('new'); setMsg('')
  }

  function openEdit(d: Doctor) {
    setF({ nameEn: d.nameEn, nameSd: d.nameSd, degreesEn: d.degreesEn,
           degreesSd: d.degreesSd, reg: d.reg, fee: String(d.fee || ''), room: d.room })
    setEditing(d.id); setMsg('')
  }

  function saveDoc() {
    if (!f.nameEn.trim() || !f.room.trim()) return
    // Refused, not silently cleaned: a name that vanishes on save is its own
    // small mystery, and the person needs to know WHY so he types a real one.
    if (isOurHint(f.nameSd) || isOurHint(f.degreesSd)) {
      setMsg('That Sindhi box still holds the hint text, not a name. It would print on ' +
             'every slip from this room. Type the doctor’s real Sindhi name, or leave it empty.')
      return
    }
    const rec = {
      nameEn: f.nameEn.trim(), nameSd: f.nameSd.trim(),
      degreesEn: f.degreesEn.trim(), degreesSd: f.degreesSd.trim(),
      reg: f.reg.trim(), fee: +f.fee || 0, room: f.room.trim(),
    }
    if (editing === 'new') { addDoctor(rec); setMsg(`${rec.nameEn} added. His room is live at the desk and the front door.`) }
    else if (editing) { updateDoctor(editing, rec); setMsg('Saved.') }
    setEditing(null); setF(BLANK); bump()
  }

  const fld = (k: keyof typeof BLANK, label: string, props: Record<string, unknown> = {}) => (
    <div className="fld"><label>{label}</label>
      <input value={f[k]} {...props}
             onChange={e => setF(p => ({ ...p, [k]: (e.target as HTMLInputElement).value }))} /></div>
  )

  return (
    <>
      <p className="hint">
        One doctor here is the solo clinic, exactly as shipped. Add a second and the desk
        grows the Tonight strip, each room counts its own tokens, the front door asks which
        doctor is signing in, and every slip and receipt prints its own room's name.
      </p>

      {list.map(d => (
        <div className="line" key={d.id}>
          <div className="hd">
            <div>
              <b>Room {d.room} · {d.nameEn} {d.nameSd && <span className="sd">{d.nameSd}</span>}
                {d.archived ? ' · retired' : ''}</b>
              <small>
                {d.degreesEn || 'no degrees entered'} · Rs {d.fee || 0}
                {d.id === FIRST_DOCTOR ? ' · from the first-run setup: name and fee are edited under You and Fee' : ''}
              </small>
            </div>
            {d.id !== FIRST_DOCTOR && (
              <span>
                <button className="lnk" onClick={() => openEdit(d)}>edit</button>
                &nbsp;&nbsp;
                <button className="lnk" onClick={() => { setDoctorArchived(d.id, !d.archived); bump() }}>
                  {d.archived ? 'bring back' : 'retire'}
                </button>
              </span>
            )}
          </div>
        </div>
      ))}

      {editing ? (
        <div className="lhbox">
          <h3>{editing === 'new' ? 'Add a doctor' : 'Edit doctor'}</h3>
          <div className="row">
            {fld('nameEn', 'Name, English — printed on his slips')}
            {/* No Sindhi phrase in this label. It sat next to a right-to-left
                box and read like an example to copy, and once it did exactly
                that it went onto a letterhead. */}
            {fld('nameSd', 'Name in Sindhi — printed on his slips', { dir: 'rtl', lang: 'sd' })}
          </div>
          <div className="row">
            {fld('degreesEn', 'Degrees, English — optional')}
            {fld('degreesSd', 'Degrees, Sindhi — optional', { dir: 'rtl', lang: 'sd' })}
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            {fld('reg', 'PMC registration — optional, prints only if entered')}
            {fld('fee', 'His fee, Rs', { inputMode: 'numeric', maxLength: 6 })}
            {fld('room', 'Room', { maxLength: 4 })}
          </div>
          <div className="row">
            <button className="btn" disabled={!f.nameEn.trim() || !f.room.trim()} onClick={saveDoc}>
              {editing === 'new' ? 'Add doctor' : 'Save'}
            </button>
            <button className="btn ghost" onClick={() => { setEditing(null); setF(BLANK) }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn wide" onClick={openNew}>Add a doctor · another room</button>
      )}
      {msg && <p className="usable">{msg}</p>}

      <Note tone="safe" title="Retiring keeps every record">
        A retired doctor leaves the desk, the door and the pickers. His printed
        prescriptions and his figures stay exactly where they are, under his name,
        because paper in a drawer somewhere still says he wrote it.
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

/**
 * CHANGING THE LOCK REQUIRES THE LOCK.
 *
 * This box lives on the clinic-side Lock tab, so anyone who can reach Setup
 * could reach it. It used to overwrite the Nuskho passphrase without asking
 * for the old one — which unlocked admin in the same breath, so whoever was
 * at the keyboard could change the doctor's name, degrees and registration
 * number on every future printed prescription. The exact bypass the restore()
 * path had already closed, still open here. Now: if a passphrase exists and
 * is not currently unlocked, the current one must be typed first.
 */
function AdminKeyBox() {
  const [cur, setCur] = useState('')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [m, setM] = useState('')
  const needsCurrent = adminIsSet() && !adminUnlocked()
  async function go() {
    if (a !== b) { setM('The two entries do not match.'); return }
    if (needsCurrent) {
      if (!await unlockAdmin(cur)) { setM('The current passphrase is not right.'); setCur(''); return }
    }
    await setAdminKey(a)
    setM(a ? 'Nuskho passphrase set.' : 'Nuskho passphrase removed. Nothing is locked.')
    setA(''); setB(''); setCur('')
  }
  return (
    <div className="lhbox">
      <h3>Nuskho passphrase</h3>
      <p>
        Ours, not the clinic's. It locks the doctor's identity and logo so they cannot be
        changed at the keyboard. Set it before handing the machine over.
        {adminIsSet() ? ' One is set.' : ' None is set, so nothing is locked yet.'}
      </p>
      {needsCurrent && (
        <div className="fld"><label>Current passphrase, first</label>
          <input type="password" value={cur} onChange={e => { setCur(e.target.value); setM('') }} /></div>
      )}
      <div className="row">
        <div className="fld"><label>New passphrase</label>
          <input type="password" value={a} onChange={e => { setA(e.target.value); setM('') }} /></div>
        <div className="fld"><label>Type it again</label>
          <input type="password" value={b} onChange={e => { setB(e.target.value); setM('') }} /></div>
      </div>
      {m && <p className="usable">{m}</p>}
      <button className="btn" disabled={needsCurrent && !cur} onClick={go}>Set passphrase</button>
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
          The same, plus every patient and every prescription. <b>This is medical records.</b>{' '}
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

      {/* Same rule: roles.ts gives `erase` to the doctor and not to us. It used
          to hang off the admin passphrase, so on a machine with no passphrase
          set every role could reach it and the Nuskho role could reach it
          always. */}
      {can('erase') && <DangerZone />}
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
