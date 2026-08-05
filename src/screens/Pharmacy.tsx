import { useState } from 'react'
import { db, patientCode } from '../db'
import { readQrPayload } from '../print/qr'
import { IcPill, IcScan } from '../ui/art'
import type { Visit, RxLine } from '../types'

/**
 * The pharmacy counter, single-machine version.
 *
 * This screen reads only what was PRINTED — the same lines the patient is
 * already carrying on paper — and records what was actually handed over. That
 * boundary is the whole design (see docs/decisions/nuskho-pharmacy.md): no
 * queue, no fees, no history, no diagnosis, and no patient screen. You can
 * open a slip; you cannot open a person.
 *
 * On one machine "arriving at the counter" simply means printedAt is set. The
 * multi-device handoff, stock, and billing come later and slot in behind this
 * same screen; nothing here will need to be unlearned.
 */

/** How many units the printed course amounts to. Same arithmetic as the slip.
 *  Exported because the building host sends these same counts to a pharmacy
 *  phone, and two copies of this arithmetic would one day disagree. */
export function course(l: RxLine): { n: number; unit: string } {
  const perDay = (l.dose.m || 0) + (l.dose.d || 0) + (l.dose.n || 0)
  const form = l.snap?.form ?? 'tab'
  if (form === 'syr' || form === 'other') return { n: 0, unit: `${l.days} days` }
  const n = Math.ceil(perDay * l.days)
  return { n, unit: form === 'cap' ? 'capsules' : 'tablets' }
}

const lineDone = (l: RxLine) => l.given !== undefined

export default function Pharmacy({ visits, onChange }: {
  visits: Visit[]
  onChange: () => void
}) {
  const [q, setQ] = useState('')
  const [names, setNames] = useState<Record<string, { name: string; code: string }>>({})
  const [open, setOpen] = useState<string | null>(null)

  // Printed today, newest first: the short list a counter actually works from.
  const printed = visits
    .filter(v => v.printedAt && v.lines.length > 0)
    .sort((a, b) => (b.printedAt ?? 0) - (a.printedAt ?? 0))

  if (printed.length && Object.keys(names).length !== printed.length) {
    db.patients.bulkGet(printed.map(v => v.patientId)).then(ps => {
      const m: Record<string, { name: string; code: string }> = {}
      printed.forEach((v, i) => {
        m[v.id] = ps[i]
          ? { name: ps[i]!.name, code: patientCode(ps[i]!.num) }
          : { name: '—', code: '' }
      })
      setNames(m)
    })
  }

  /** The scan box accepts what a wedge scanner types or what a thumb types. */
  const scanned = (v: string) => readQrPayload(v) ?? v.replace(/[^0-9]/g, '')
  const needle = scanned(q)
  const shown = printed.filter(v => {
    if (!needle) return true
    const n = names[v.id]
    return String(v.token) === needle || (n && n.code.includes(needle))
  })

  async function setGiven(v: Visit, i: number, given: number | undefined) {
    const lines = v.lines.map((l, k) => {
      if (k !== i) return l
      const { given: _g, ...rest } = l
      return given === undefined ? rest : { ...rest, given }
    })
    const all = lines.every(lineDone)
    await db.visits.update(v.id, {
      lines,
      dispensedAt: all ? (v.dispensedAt ?? Date.now()) : undefined,
    })
    onChange()
  }

  async function giveAll(v: Visit) {
    const lines = v.lines.map(l => lineDone(l) ? l : { ...l, given: course(l).n })
    await db.visits.update(v.id, { lines, dispensedAt: Date.now() })
    onChange()
  }

  const at = (t?: number) =>
    t ? new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div className="pane">
      <h2><IcScan size={17} /> The slip's number, typed or scanned</h2>
      <div className="fld">
        <input value={q} inputMode="numeric"
               placeholder="patient number or token from the slip"
               style={{ fontSize: 22, letterSpacing: 4, fontWeight: 700 }}
               onChange={e => setQ(e.target.value)} />
      </div>
      <p className="hint">
        This desk sees printed prescriptions only: the lines, the counts, nothing else.
        There is no patient search here, on purpose.
      </p>

      <h2 style={{ marginTop: 18 }}><IcPill size={17} /> Printed today</h2>
      {shown.length === 0 && (
        <p className="hint">
          {printed.length === 0
            ? 'Nothing printed yet. Slips appear here the moment the room prints them.'
            : 'No printed slip matches that number.'}
        </p>
      )}

      {shown.map(v => {
        const n = names[v.id]
        const isOpen = open === v.id
        const done = !!v.dispensedAt
        const shorts = v.lines.filter(l => lineDone(l) && (l.given ?? 0) < course(l).n).length
        return (
          <div className={'line' + (done ? '' : '')} key={v.id} style={done ? { opacity: .62 } : undefined}>
            <div className="hd" style={{ cursor: 'pointer' }}
                 onClick={() => setOpen(isOpen ? null : v.id)}>
              <div>
                <b>Token {v.token} · {n?.name ?? '—'}</b>
                <small>
                  No. {n?.code} · printed {at(v.printedAt)}
                  {done ? ` · given ${at(v.dispensedAt)}` : ''}
                  {shorts > 0 ? ` · ${shorts} line${shorts > 1 ? 's' : ''} short` : ''}
                </small>
              </div>
              <span className="lnk">{isOpen ? 'close' : done ? 'given ✓' : `${v.lines.length} medicines`}</span>
            </div>

            {isOpen && (
              <>
                {v.lines.map((l, i) => {
                  const c = course(l)
                  const g = l.given
                  return (
                    <div className="row" key={i}
                         style={{ alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: '1px solid #eef2f0' }}>
                      <button className={'chip ' + (lineDone(l) ? 'on' : '')}
                              onClick={() => setGiven(v, i, lineDone(l) ? undefined : c.n)}>
                        {lineDone(l) ? '✓' : '+'}
                      </button>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 14 }}>
                          {l.snap?.brand ?? '?'} {l.snap?.strength ?? ''}
                        </b>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>
                          {c.n > 0 ? `${c.n} ${c.unit} · ${l.days} days` : c.unit}
                          {lineDone(l) && g !== undefined && c.n > 0 && g < c.n
                            ? ` · gave ${g}, short ${c.n - g}` : ''}
                        </small>
                      </div>
                      {c.n > 0 && !done && lineDone(l) && (
                        <button className="lnk" onClick={() => {
                          const raw = prompt(`How many actually given? Course is ${c.n}.`, String(g ?? c.n))
                          if (raw === null) return
                          const k = Math.max(0, Math.min(c.n, +raw.replace(/[^0-9]/g, '') || 0))
                          setGiven(v, i, k)
                        }}>gave {g}</button>
                      )}
                    </div>
                  )
                })}
                <div className="row" style={{ marginTop: 10 }}>
                  {!done && <button className="btn" onClick={() => giveAll(v)}>All given · handed over</button>}
                  {done && <button className="lnk" onClick={async () => {
                    await db.visits.update(v.id, { dispensedAt: undefined }); onChange()
                  }}>reopen</button>}
                </div>
              </>
            )}
          </div>
        )
      })}

      <p className="hint">
        A slip scanned twice says when it was given rather than raising an alarm: the person
        asking usually lost a box, not their honesty. Paper taken to another shop is that
        shop's sale.
      </p>
    </div>
  )
}
