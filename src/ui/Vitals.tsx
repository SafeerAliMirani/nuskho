import { useRef, useState } from 'react'
import { VITALS, INSTANT, flag, type VitalDef } from '../data/vitals'
import { IcCheck } from './art'

/**
 * The pad the compounder writes on, and the one the doctor writes on.
 *
 * Same component, two sets of fields, because the interaction is identical: a
 * few numbers, typed fast, by someone standing up, often on a tablet held in
 * one hand. So: big targets, numeric keypads, no dropdowns, nothing that needs
 * a second tap to commit, and it saves as he leaves each box rather than making
 * him find a Save button.
 *
 * The amber mark on an out-of-range number is arithmetic and nothing more. It
 * is there so that 1210 typed for a pulse is seen by the person who typed it,
 * before the paper comes out. It never says what a reading means.
 */
/**
 * HOW LONG THE PERSON TYPING OWNS THE BOX.
 *
 * Long enough to cover a write going out to the database and the parent coming
 * back with it on a slow clinic machine, and short enough that a reading typed
 * on the OTHER screen still appears here while the patient is in the room.
 */
const MINE_FOR = 1500

export default function Vitals({ which, value, onChange, title }: {
  which: 'vital' | 'test'
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
  title?: string
}) {
  const defs = which === 'vital' ? VITALS : INSTANT

  /**
   * THE PERSON TYPING OWNS THE BOX, AND THIS IS WHY.
   *
   * `value` comes from the parent, and the parent's copy is refreshed FROM THE
   * DATABASE after each write. So between a keystroke and that write coming
   * back, any unrelated re-render — the day's totals ticking over, a chime, the
   * seven second refresh — hands this component the value as it was BEFORE the
   * keystroke.
   *
   * Every box then composed its next value from that. A compounder who typed
   * 180, moved to the second box and typed 110 faster than the round trip sent
   * `"" + "/110"`, and the systolic was gone. The screen showed `/110`, which
   * reads like a half-typed number rather than a lost one, and it printed. A
   * weight typed straight after a temperature lost the temperature the same
   * way, and nothing about that was specific to the pair.
   *
   * `vitcheck.mjs` reported exactly this, one run in three, and the note in the
   * session log called it a flake "under load". It was not a flake. It was the
   * drive being right, and it had been right for weeks. A check that keeps
   * failing is a check to read, not a check to re-run.
   *
   * So the draft below wins for a moment and a half after a keystroke and the
   * parent wins after that. A reading typed on the other screen still arrives
   * while the patient is in the room; a reading typed HERE is never overwritten
   * by an echo of the moment before it was typed.
   */
  const [draft, setDraft] = useState(value)
  const typedAt = useRef(0)
  if (Date.now() - typedAt.current > MINE_FOR && draft !== value) setDraft(value)

  const set = (key: string, s: string) => {
    typedAt.current = Date.now()
    const next = { ...draft, [key]: s }
    setDraft(next)
    onChange(next)
  }

  const any = defs.filter(d => (draft[d.key] ?? '').trim()).length

  /**
   * A BOX THAT HOLDS A READING IS NEVER COLLAPSED.
   *
   * This was `useState(() => something is filled)`, a lazy initialiser, so the
   * answer was decided once at mount and never revisited. The doctor opens a
   * patient, the compounder takes a blood pressure at the door thirty seconds
   * later, it arrives on the doctor's screen and he is looking at a button that
   * says "+ Add blood pressure, weight, temperature" over a blood pressure that
   * already exists. It was on the paper and nowhere he could see it.
   *
   * Open by hand OR because there is something in it, checked every render.
   */
  const [opened, setOpened] = useState(false)
  const open = opened || any > 0

  if (!open) {
    return (
      <button className="vopen" onClick={() => setOpened(true)}>
        <span>+ {title ?? (which === 'vital' ? 'Add blood pressure, weight, temperature'
                                              : 'Add a test done here in the room')}</span>
      </button>
    )
  }

  return (
    <div className="vitals">
      <div className="vhead">
        <b>{title ?? (which === 'vital' ? 'Checked before the doctor' : 'Done here, in the room')}</b>
        {any > 0 && <span className="badge k"><IcCheck size={12} /> {any} on the slip</span>}
      </div>
      <div className="vgrid">
        {defs.map(d => (
          <Field key={d.key} def={d} raw={draft[d.key] ?? ''}
                 onSet={s => set(d.key, s)} />
        ))}
      </div>
      <p className="hint">
        Only the boxes you fill are printed. Anything left blank never appears on the slip.
      </p>
    </div>
  )
}

/**
 * THE TWO BOXES OF A BLOOD PRESSURE, AND THE READING THEY USED TO LOSE.
 *
 * This was one function with two `onChange` handlers, each composing the whole
 * "180/110" string from the OTHER box's value as it stood in the last render:
 *
 *     onChange={e => set(clean(e.target.value), b)}     // b from that render
 *     onChange={e => set(a, clean(e.target.value))}     // a from that render
 *
 * That render came from the parent, and the parent's copy only refreshes after
 * a round trip through the database. So a compounder who typed 180, moved to
 * the second box and typed 110 before the write came back sent `"" + "/110"`,
 * and the systolic was gone. The screen then showed `/110`, which reads like a
 * half-typed number rather than a lost one, and the slip printed it.
 *
 * `vitcheck.mjs` has been reporting exactly this, one run in three, for weeks.
 * It was written off in the notes as a flake "under load". It was not a flake.
 * It was the drive being right, and the note was the thing that was wrong.
 *
 * The two halves are local state now. A keystroke composes from the box beside
 * it as THIS component last drew it, which updates immediately and never waits
 * for Dexie. The parent still owns the value: when it arrives changed from
 * somewhere else (the desk typing while the room has the visit open), it is
 * taken, and `sent` is what tells the two apart.
 */
function Pair({ def, raw, onSet, flag: f }: {
  def: VitalDef; raw: string; onSet: (s: string) => void; flag: string | null
}) {
  const split = (s: string): [string, string] => {
    const [x = '', y = ''] = s.split('/')
    return [x, y]
  }
  /**
   * NO LOCAL COPY HERE. The draft one level up already holds what was typed,
   * and a second copy in this component was the thing that broke it: its "the
   * value changed somewhere else" branch could not tell a real edit from the
   * parent echoing back the moment BEFORE the keystroke, so it wiped the box
   * it was meant to protect. One owner, one rule.
   */
  const [a, b] = split(raw)
  const put = (x: string, y: string) => onSet(x || y ? `${x}/${y}` : '')
  const clean = (v: string) => v.replace(/\D/g, '')

  return (
    <div className={'vfld pair' + (f ? ' f-' + f : '')}>
      <label>{def.en} <i className="sd">{def.sd}</i></label>
      <div className="vpair">
        <input inputMode="numeric" maxLength={def.max} value={a} placeholder="120"
               onChange={e => put(clean(e.target.value), b)} />
        <span>/</span>
        <input inputMode="numeric" maxLength={def.max} value={b} placeholder="80"
               onChange={e => put(a, clean(e.target.value))} />
        <em>{def.unit}</em>
      </div>
      {f && <span className="vmark">{f === 'high' ? 'higher than usual' : 'lower than usual'}</span>}
    </div>
  )
}

function Field({ def, raw, onSet }: { def: VitalDef; raw: string; onSet: (s: string) => void }) {
  const f = flag(def, raw)

  // A blood pressure is one reading written as two numbers, and it is typed as
  // two numbers. Two boxes with a slash between them beats one box that has to
  // be taught what a slash is.
  if (def.pair) return <Pair def={def} raw={raw} onSet={onSet} flag={f} />

  const numeric = def.key !== 'urine'
  return (
    <div className={'vfld' + (f ? ' f-' + f : '')}>
      <label>{def.en} <i className="sd">{def.sd}</i></label>
      <div className="vone">
        <input inputMode={numeric ? 'decimal' : 'text'} maxLength={def.max} value={raw}
               onChange={e => onSet(numeric ? e.target.value.replace(/[^0-9.]/g, '') : e.target.value)} />
        {def.unit && <em>{def.unit}</em>}
      </div>
      {f && <span className="vmark">{f === 'high' ? 'higher than usual' : 'lower than usual'}</span>}
    </div>
  )
}
