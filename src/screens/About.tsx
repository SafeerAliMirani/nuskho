import { useEffect, useState } from 'react'
import { db } from '../db'
import { profile, APP } from '../profile'
import { paper } from '../paper'
import { role, ROLE_NAME } from '../roles'
import { daysSinceExport, storageReport } from '../safety'
import { Mark, IcShield, IcInfo, IcCheck, IcPrint } from '../ui/art'
import { Note } from '../ui/Note'
import { VERSION, BUILT, BUILD, CHANNEL, isDemo } from '../version'

/**
 * WHO MADE THIS, AND HOW TO GET HELP WHEN IT BREAKS AT EIGHT IN THE EVENING.
 *
 * THE TICKET IS OFFLINE, BECAUSE EVERYTHING HERE IS.
 *
 * A support system normally means a server: the app posts a form, a queue picks
 * it up, somebody replies. This app has no server, is often used with the router
 * unplugged, and holds the one category of data that must never be posted
 * anywhere. So the ticket is inverted.
 *
 * The clinic gets a REFERENCE and a REPORT. The reference is six characters,
 * generated on the machine, and it is what somebody reads down a phone. The
 * report is a block of text describing the machine — version, paper, printer
 * settings, counts, what failed — which the clinic can copy into WhatsApp or
 * read aloud. Nothing is sent by the app, ever, and the clinic can see every
 * character before it goes.
 *
 * WHAT THE REPORT MAY CONTAIN, AND THE RULE THAT BOUNDS IT
 *
 * Counts and settings. Never a patient name, never a code, never a medicine,
 * never a diagnosis, never a fee. Somebody debugging a printer does not need to
 * know who was in the room, and a support channel is exactly the sort of
 * back door through which clinical data leaves a building "just this once".
 */

const CHARS = 'ACDEFGHJKLMNPQRTUVWXY349'   // no O/0, no I/1, no S/5, no B/8

function reference(): string {
  const a = new Uint8Array(6)
  crypto.getRandomValues(a)
  return [...a].map(n => CHARS[n % CHARS.length]).join('')
}

export default function About({ onBack }: { onBack: () => void }) {
  const [ref] = useState(reference)
  const [what, setWhat] = useState('')
  const [report, setReport] = useState('')
  const [copied, setCopied] = useState(false)
  const [counts, setCounts] = useState({ patients: 0, visits: 0, drugs: 0, unchecked: 0 })
  const [store, setStore] = useState<{ persisted: boolean; usedMb: number } | null>(null)

  useEffect(() => {
    (async () => {
      const drugs = await db.drugs.toArray()
      setCounts({
        patients: await db.patients.count(),
        visits: await db.visits.count(),
        drugs: drugs.filter(d => !d.archived).length,
        unchecked: drugs.filter(d => !d.archived && d.sdReviewed !== true).length,
      })
      // The app asks for persistent storage at startup and the browser may say
      // no. That refusal used to be swallowed, which meant a clinic could be one
      // low-disk evening away from losing a month of records with nothing on any
      // screen to warn it. Losing records this way is more likely than any
      // attacker, so it is said out loud.
      const s = await storageReport()
      setStore({ persisted: s.persisted, usedMb: s.usedMb })
    })()
  }, [])

  function build() {
    const p = profile()
    const pp = paper()
    const days = daysSinceExport()
    /* eslint-disable no-irregular-whitespace */
    const lines = [
      `NUSKHO SUPPORT — ${ref}`,
      // The commit, not just the version: two builds numbered 1.0.0 are not the
      // same software, and "which copy is on that machine" is the first
      // question about every bug.
      `App        ${VERSION}  ${BUILD}  (${CHANNEL}, built ${BUILT})`,
      `Date here  ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      `Signed in  ${ROLE_NAME[role()]}`,
      '',
      `Paper      ${pp.size} ${pp.kind}${pp.kind === 'letterhead' ? ` ${pp.top}/${pp.bottom}mm` : ''}`,
      `Token slip ${pp.token ? `${pp.tokenWidth}mm` : 'off'}`,
      `QR square  ${p.showQr === false ? 'off' : 'on'}`,
      `Field      ${p.specialty}`,
      '',
      `Medicines  ${counts.drugs} on the list, ${counts.unchecked} with Sindhi not yet ticked`,
      `Records    ${counts.patients} patients, ${counts.visits} visits`,
      `Backup     ${days === null ? 'never saved' : `${days} days ago`}`,
      '',
      `Browser    ${navigator.userAgent}`,
      `Screen     ${window.innerWidth}x${window.innerHeight}`,
      '',
      'WHAT WENT WRONG',
      what.trim() || '(not described)',
      '',
      'No patient name, number, medicine, diagnosis or fee is in this report.',
    ]
    setReport(lines.join('\n'))
    setCopied(false)
  }

  async function copy() {
    try { await navigator.clipboard.writeText(report); setCopied(true) }
    catch { setCopied(false) }
  }

  const dev = profile()

  return (
    <div className="pane about">
      <button className="btn ghost" onClick={onBack}>&larr; Queue</button>

      <div className="abhead">
        <Mark size={52} />
        <div>
          <h1>{APP.en} <span className="sd">{APP.sd}</span></h1>
          <p>The prescription, printed. English for the chemist, Sindhi for the family,
             pictures for whoever reads neither.</p>
          <p className="ver">
            Version {VERSION} · {BUILD} · built {BUILT}
            {isDemo && <> · <b>practice copy</b></>}
          </p>
        </div>
      </div>

      <h2><IcInfo size={17} /> Made by</h2>
      <div className="sumbox">
        <div><span>Built for</span><b>{dev.doctorEn || 'this clinic'}</b></div>
        <div><span>Installed on</span><b>{pretty(BUILT)}</b></div>
        <div><span>Runs</span><b>on this computer only, with or without internet</b></div>
      </div>
      <p className="hint">
        Nuskho is made in Larkana. It is not a hospital system, an insurance product or a
        data business: it prints one piece of paper as clearly as it can, and everything it
        knows stays on the machine it is installed on.
      </p>

      {store && !store.persisted && (
        <Note tone="warn" title="This computer has not promised to keep your records">
          Chrome is storing the clinic's records as if they were a web page it may throw
          away when the disk gets tight, and "Clear browsing data" would take them
          instantly. Nothing is lost yet ({store.usedMb} MB stored). <b>Export a backup
          today</b>, and keep exporting weekly until this line disappears.
        </Note>
      )}

      <h2><IcShield size={17} /> What this software promises</h2>
      <ul className="promises">
        <li><b>Nothing about a patient leaves this computer.</b> There is no account, no
          server and no upload. <b>If that ever changes, this screen will say so first,
          and you will have to agree before anything is sent.</b></li>
        <li><b>Nobody at Nuskho can read your prescriptions,</b> including on this machine.
          The setup passphrase we hold opens your letterhead and the medicine review —
          not a consultation, not a history, and not an export.</li>
        <li><b>Prescribing is never sold.</b> What a doctor writes is not a product. No drug
          company sees it, in aggregate or otherwise.</li>
        <li><b>A Sindhi medicine name is never printed until a person has read it.</b> A
          machine guess stays off the paper.</li>
        <li><b>A printed slip never changes.</b> Correcting the medicine list tomorrow cannot
          alter a prescription already in someone's hand.</li>
        <li><b>The small mark at the foot of the slip can be turned off,</b> free, now and
          always.</li>
      </ul>

      <h2><IcPrint size={17} /> Something is wrong</h2>
      <p className="hint">
        This makes a reference number and a description of the machine. <b>Nothing is sent
        from here.</b> Copy it into a message, or read the reference down the phone.
      </p>

      <div className="ticket">
        <div className="tref">
          <span>Reference</span>
          <b>{ref}</b>
        </div>
        <div className="fld">
          <label>What happened, in your own words</label>
          <input value={what} onChange={e => { setWhat(e.target.value); setReport('') }}
                 placeholder="the printer made two pages, the Sindhi looked wrong…" />
        </div>
        <button className="btn" onClick={build}>Make the report</button>
      </div>

      {report && (
        <>
          <textarea className="bulk" rows={16} readOnly value={report}
                    onFocus={e => e.currentTarget.select()} />
          <div className="bulkbar">
            <button className="btn ghost" onClick={copy}>
              {copied ? <><IcCheck size={16} /> Copied</> : 'Copy it'}
            </button>
            <button className="lnk" onClick={() => {
              const b = new Blob([report], { type: 'text/plain' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(b)
              a.download = `nuskho-support-${ref}.txt`
              a.click()
              setTimeout(() => URL.revokeObjectURL(a.href), 1000)
            }}>save it as a file</button>
          </div>
          <Note tone="safe" title="Read it before you send it">
            Everything above is on your screen because you should be able to see exactly what
            leaves the clinic. There is no patient name, number, medicine, diagnosis or fee in
            it, and if you find one, that is a bug and we want to hear about it.
          </Note>
        </>
      )}
    </div>
  )
}

const pretty = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
