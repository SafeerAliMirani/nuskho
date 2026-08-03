import { useRef, useState } from 'react'
import { profile, saveProfile, type Profile } from '../../profile'
import { SPECIALTIES, seedDiagnoses } from '../../data/specialty'
import { paper, setPaper, PAGE_MM, usableHeightMm, type Paper } from '../../paper'
import { printCalibration, printToken } from '../../print/print'

/**
 * One definition of every setup control, used by BOTH the first-run wizard and
 * the Setup screen. Two copies would drift, and the way they would drift is a
 * doctor changing something in Setup that the wizard set differently.
 */

/* ---------------------------------------------------------------- identity */

export function IdentityFields({ v, on }: { v: Profile; on: (p: Partial<Profile>) => void }) {
  return (
    <>
      <div className="row">
        <div className="fld"><label>Name — as it should print</label>
          <input value={v.doctorEn} onChange={e => on({ doctorEn: e.target.value })}
                 placeholder="Dr. …" /></div>
        <div className="fld"><label>Name in Sindhi</label>
          <input className="sdin" dir="rtl" value={v.doctorSd}
                 onChange={e => on({ doctorSd: e.target.value })} /></div>
      </div>
      <div className="row">
        <div className="fld"><label>Degrees</label>
          <input value={v.degreesEn} onChange={e => on({ degreesEn: e.target.value })}
                 placeholder="M.B.B.S. — Physician" /></div>
        <div className="fld"><label>Degrees in Sindhi</label>
          <input className="sdin" dir="rtl" value={v.degreesSd}
                 onChange={e => on({ degreesSd: e.target.value })} /></div>
      </div>
      <div className="fld"><label>What kind of doctor</label>
        <div className="chips">
          {SPECIALTIES.map(sp => (
            <button key={sp.id} className={'chip' + (v.specialty === sp.id ? ' on' : '')}
                    onClick={() => {
                      // MERGE, never replace. He may already have curated a list,
                      // and changing the label on his signboard must not delete it.
                      const seed = seedDiagnoses(sp.id)
                      const keep = (v.dx ?? []).filter(d => !seed.includes(d))
                      on({ specialty: sp.id, dx: [...seed, ...keep] })
                    }}>
              {sp.name} <small className="sd">{sp.sd}</small>
            </button>
          ))}
        </div>
        <span className="unit">
          This fills his diagnosis list with conditions he recognises. Every one of them is
          editable afterwards under Setup, Diagnoses, and from then on the list is his.
        </span>
      </div>

      <div className="fld"><label>Registration number &nbsp; optional</label>
        <input value={v.reg} onChange={e => on({ reg: e.target.value })}
               placeholder="leave blank if you do not print one" />
        <span className="unit">
          Most doctors here do not put one on a slip, so this is optional and nothing is
          printed when it is blank. If you do type one, copy it exactly from your certificate.
        </span>
      </div>
      <div className="fld"><label>Clinic address</label>
        <input value={v.addressEn} onChange={e => on({ addressEn: e.target.value })} /></div>

      <div className="fld"><label>Appointments number &nbsp; optional</label>
        <input value={v.phone} onChange={e => on({ phone: e.target.value })}
               placeholder="usually the compounder's number" />
        <span className="unit">
          <b>Not the doctor's own number.</b> This is the number people ring to ask for a time
          or to check the clinic is open, so it is normally the compounder's. It prints small
          at the <b>foot</b> of the slip, never beside the doctor's name, where it would read
          as an invitation to call him. Leave it blank and nothing is printed.
        </span>
      </div>
      <div className="fld"><label>Clinic timing</label>
        <input value={v.timing} onChange={e => on({ timing: e.target.value })}
               placeholder="Timing: 5:00 pm – 10:00 pm" /></div>
      <p className="hint">
        None of this is sent anywhere. It stays on this computer and prints on the slip.
      </p>
    </>
  )
}

/* ------------------------------------------------------------------- paper */

export function PaperFields({ v, on }: { v: Paper; on: (p: Partial<Paper>) => void }) {
  const lhd = v.kind === 'letterhead'
  const sheet = PAGE_MM[v.size]
  const usable = usableHeightMm(v)
  const tight = lhd && usable < 120

  return (
    <>
      <div className="fld">
        <label>Sheet size — your choice</label>
        <div className="chips">
          {(['A5', 'A4'] as const).map(s => (
            <button key={s} className={'chip' + (v.size === s ? ' have' : '')}
                    onClick={() => on({ size: s })}>
              {s} <small>{PAGE_MM[s].w} &times; {PAGE_MM[s].h} mm</small>
            </button>
          ))}
        </div>
        <p className="hint">A5 is half of A4. Both feed from the same tray on most clinic printers.</p>
      </div>

      <div className="fld">
        <label>What goes in the printer</label>
        <div className="chips">
          <button className={'chip' + (!lhd ? ' have' : '')} onClick={() => on({ kind: 'plain' })}>
            Plain paper <small>we print your heading and logo</small>
          </button>
          <button className={'chip' + (lhd ? ' have' : '')} onClick={() => on({ kind: 'letterhead' })}>
            Your own letterhead <small>we leave your heading alone</small>
          </button>
        </div>
      </div>

      {lhd && (
        <>
          <div className="lhbox">
            <h3>Where your letterhead is already printed</h3>
            <p>
              Don't measure with a ruler. Print the sheet below onto <b>one</b> of your own
              letterheads and read the two numbers off it — that way they include how your
              own printer feeds paper.
            </p>
            <button className="btn wide" onClick={() => printCalibration()}>
              Print the measuring sheet &nbsp; ماپ وارو ڪاغذ ڇاپيو
            </button>
          </div>
          <div className="row">
            <div className="fld"><label>Top — your heading ends at</label>
              <MmInput value={v.top} max={sheet.h} onChange={n => on({ top: n })} />
              <span className="unit">mm from the top</span></div>
            <div className="fld"><label>Bottom — your footer starts at</label>
              <MmInput value={v.bottom} max={sheet.h} onChange={n => on({ bottom: n })} />
              <span className="unit">mm up from the bottom</span></div>
          </div>
          <p className={'usable' + (tight ? ' bad' : '')}>
            Leaves <b>{sheet.w} &times; {usable}mm</b> for the prescription.
            {tight && ' That is very little — check the two numbers.'}
          </p>
          <p className="hint">Add 3–4mm to each. Starting 4mm low is better than printing 2mm into your logo.</p>
        </>
      )}
    </>
  )
}

/* --------------------------------------------------- the counter's printer */

/**
 * Separate machine, separate decision.
 *
 * A clinic without a thermal printer must never meet this feature: off by
 * default, and when off nothing at the desk changes. When on, the token slip is
 * still only a courtesy. The number is issued and shown on screen either way.
 */
export function TokenFields({ v, on }: { v: Paper; on: (p: Partial<Paper>) => void }) {
  const [said, setSaid] = useState('')
  return (
    <>
      <div className="fld">
        <label>Receipt printer at the counter</label>
        <div className="chips">
          <button className={'chip' + (!v.token ? ' have' : '')} onClick={() => on({ token: false })}>
            No receipt <small>the number is called out, as now</small>
          </button>
          <button className={'chip' + (v.token ? ' have' : '')} onClick={() => on({ token: true })}>
            Print a token slip <small>on a thermal roll printer</small>
          </button>
        </div>
      </div>

      {v.token && (
        <>
          <div className="fld">
            <label>Roll width</label>
            <div className="chips">
              {([58, 80] as const).map(w => (
                <button key={w} className={'chip' + (v.tokenWidth === w ? ' have' : '')}
                        onClick={() => on({ tokenWidth: w })}>
                  {w}mm <small>{w === 58 ? 'the common small roll' : 'the wider roll'}</small>
                </button>
              ))}
            </div>
            <span className="unit">Measure the roll, not the printer. Getting this wrong cuts the number in half.</span>
          </div>

          <button className="btn wide" onClick={async () => {
            const ok = await printToken({
              token: 7, patientName: 'Test slip', patientCode: '00007',
              fee: profile().fee || 300, feeState: 'paid', at: Date.now(),
            })
            setSaid(ok ? 'Sent. Check the paper that came out.' : 'Turn the receipt printer on above first.')
          }}>
            Print a test token &nbsp; آزمائشي پرچي ڇاپيو
          </button>
          {said && <p className="usable">{said}</p>}

          <p className="hint">
            The token carries the number, the name, the patient number and the fee.
            <b> It never carries a medicine, a diagnosis or a test</b>, and it never will.
            The prescription is the medical record and has no money on it; this is a receipt
            and has no medicine on it. If the printer runs out of paper the evening carries on:
            the number is on screen, and nothing waits for this.
          </p>
        </>
      )}
    </>
  )
}

function MmInput({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <input value={value || ''} inputMode="numeric" maxLength={3}
           onChange={e => {
             const v = e.target.value.replace(/\D/g, '').slice(0, 3)
             if (v === '' || +v < max) onChange(+v || 0)
           }} />
  )
}

/* -------------------------------------------------------------------- logo */

/** Downscaled hard: it has to fit in browser storage, and it prints in black
 *  and white at a few centimetres wide, so a 4MB phone photo buys nothing. */
const LOGO_MAX_PX = 900

export function LogoFields({ v, on }: { v: Profile; on: (p: Partial<Profile>) => void }) {
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function pick(f: File) {
    setErr(''); setBusy(true)
    try {
      const url = await shrink(f)
      on({ logo: url })
    } catch {
      setErr('That image could not be read. A PNG or JPG works best.')
    }
    setBusy(false)
  }

  return (
    <>
      <p className="hint">
        Optional. Printed at the top left of the slip, beside your name.
        <b> Your printer is black and white</b> — a colour logo will come out grey, so a
        plain dark mark reads far better than a photograph.
      </p>

      {v.logo ? (
        <div className="logobox">
          <img src={v.logo} alt="" style={{ height: v.logoMm * 3.78 }} />
          <div className="logoacts">
            <label>Height on paper</label>
            <input type="range" min={8} max={30} value={v.logoMm}
                   onChange={e => on({ logoMm: +e.target.value })} />
            <span className="unit">{v.logoMm}mm tall</span>
            <button className="lnk" onClick={() => on({ logo: undefined })}>Remove logo</button>
          </div>
        </div>
      ) : (
        <button className="btn wide" disabled={busy} onClick={() => file.current?.click()}>
          {busy ? 'Reading…' : 'Choose a logo image'}
        </button>
      )}
      {err && <p className="usable bad">{err}</p>}
      <input ref={file} type="file" accept="image/*" hidden
             onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = '' }} />

      <label className="check">
        <input type="checkbox" checked={v.showQr !== false}
               onChange={e => on({ showQr: e.target.checked })} />
        <span>Print the patient's number as a square you can scan.
          <small>A cheap USB scanner types the number into the box for you when a patient
            comes back. The square holds the number and nothing else: no medicines, no
            address, nothing that leaves this computer.</small></span>
      </label>

      <label className="check">
        <input type="checkbox" checked={v.showSign === true}
               onChange={e => on({ showSign: e.target.checked })} />
        <span>Leave a line at the bottom for a signature and stamp.
          <small>Off by default. The slip prints the same every time and carries your
            registration number, so the line proves nothing — and it costs about two
            medicines' worth of space on an A5 sheet. Turn it on if a hospital or an
            insurer asks you for a signature.</small></span>
      </label>

      <label className="check">
        <input type="checkbox" checked={v.showCredit}
               onChange={e => on({ showCredit: e.target.checked })} />
        <span>Show the small <b>Nuskho</b> mark at the foot of the slip.
          <small>Turning it off is free, now and always.</small></span>
      </label>
    </>
  )
}

function shrink(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onerror = reject
    fr.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const k = Math.min(1, LOGO_MAX_PX / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        const ctx = c.getContext('2d')
        if (!ctx) return reject(new Error('no canvas'))
        ctx.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/png'))
      }
      img.src = String(fr.result)
    }
    fr.readAsDataURL(f)
  })
}

/* ------------------------------------------------------------------ saving */

/**
 * A draft that saves only what was EDITED.
 *
 * It used to snapshot the whole profile at mount and write that object back on
 * Save. Anything saved elsewhere in the meantime — the diagnosis list, which
 * persists as you edit it — was silently reverted to whatever it had been when
 * the Setup screen opened. Now the draft remembers which keys were touched and
 * commits only those.
 */
export function useDraftProfile() {
  const [v, setV] = useState<Profile>(profile())
  const touched = useRef(new Set<keyof Profile>())
  return {
    v,
    on: (p: Partial<Profile>) => {
      for (const k of Object.keys(p) as (keyof Profile)[]) touched.current.add(k)
      setV(c => ({ ...c, ...p }))
    },
    commit: () => {
      const patch: Partial<Profile> = {}
      for (const k of touched.current) (patch as Record<string, unknown>)[k] = v[k]
      saveProfile(patch)
    },
  }
}

export function useDraftPaper() {
  const [v, setV] = useState<Paper>(paper())
  return { v, on: (p: Partial<Paper>) => setV(c => ({ ...c, ...p })), commit: () => setPaper(v) }
}

/* --------------------------------------------------------------------- fee */

export function FeeFields({ v, on }: { v: Profile; on: (p: Partial<Profile>) => void }) {
  return (
    <>
      <div className="fld">
        <label>Consultation fee &nbsp; في</label>
        <div className="chips">
          {[100, 200, 300, 500, 1000].map(n => (
            <button key={n} className={'chip' + (v.fee === n ? ' have' : '')}
                    onClick={() => on({ fee: n })}>Rs {n}</button>
          ))}
        </div>
        <input value={v.fee || ''} inputMode="numeric" placeholder="or type it"
               onChange={e => on({ fee: +e.target.value.replace(/[^0-9]/g, '').slice(0, 6) || 0 })} />
        <span className="unit">Rupees. This is what the counter charges by default.</span>
      </div>
      <p className="hint">
        The counter can charge something different for any patient, and you can reduce or
        waive it in the room afterwards. Change this whenever you like, it only sets what
        the desk sees first.
      </p>
    </>
  )
}
