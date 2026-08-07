import { useState } from 'react'
import { db, patientCode } from '../db'
import { readQrPayload } from '../print/qr'
import { IcPill, IcScan } from '../ui/art'
import { course } from '../course'
import { storeSeesTheDay } from '../store'
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

  /**
   * A SHOP RENTING SPACE IS SHOWN ONE SLIP, NEVER THE DAY. See store.ts.
   *
   * And it is found by the PATIENT NUMBER, which is printed large on the paper
   * and encoded in the square beside it, never by the bare token. Tokens count
   * from one in every room every evening, so "7" is not a way to identify a
   * person; in a shop that serves several doctors it is barely a way to
   * identify a slip.
   */
  const wholeDay = storeSeesTheDay()

  /** Leading zeros are decoration on a printed number, and a scanner is exact.
   *  Everything else must match in full: `includes` let a single digit open
   *  somebody's prescription, because every code contains a 1 somewhere. */
  const sameCode = (a: string, b: string) =>
    !!a && !!b && a.replace(/^0+/, '') === b.replace(/^0+/, '')

  const shown = printed.filter(v => {
    if (!needle) return wholeDay
    const n = names[v.id]
    if (n && sameCode(n.code, needle)) return true
    // The clinic's own counter, already looking at the day, may narrow it with
    // a few digits or a token. A shop renting space is not looking at the day,
    // so for it there is nothing to narrow and only the full number opens one.
    return wholeDay && (String(v.token) === needle || (!!n && n.code.includes(needle)))
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

      <h2 style={{ marginTop: 18 }}><IcPill size={17} />{' '}
        {wholeDay ? 'Printed today' : 'The slip in front of you'}</h2>
      {shown.length === 0 && (
        <p className="hint">
          {!wholeDay && !needle
            ? 'Type the patient number from the paper, or point the scanner at the square on it. This counter opens one slip at a time and is not shown the day\u2019s patients.'
            : printed.length === 0
            ? 'Nothing printed yet. Slips appear here the moment the room prints them.'
            : 'No printed slip matches that number.'}
        </p>
      )}

      {shown.map(v => {
        const n = names[v.id]
        // A shop that scanned a number wants the medicines, not a row to tap.
        // Its screen holds one slip at a time, so there is nothing to collapse.
        const isOpen = open === v.id || (!wholeDay && shown.length === 1)
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
                      <button className={'chip tickbtn ' + (lineDone(l) ? 'on' : '')}
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
