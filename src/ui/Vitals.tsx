import { useState } from 'react'
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
export default function Vitals({ which, value, onChange, title }: {
  which: 'vital' | 'test'
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
  title?: string
}) {
  const defs = which === 'vital' ? VITALS : INSTANT
  const [open, setOpen] = useState(() => defs.some(d => (value[d.key] ?? '').trim()))
  const any = defs.filter(d => (value[d.key] ?? '').trim()).length

  if (!open) {
    return (
      <button className="vopen" onClick={() => setOpen(true)}>
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
          <Field key={d.key} def={d} raw={value[d.key] ?? ''}
                 onSet={s => onChange({ ...value, [d.key]: s })} />
        ))}
      </div>
      <p className="hint">
        Only the boxes you fill are printed. Anything left blank never appears on the slip.
      </p>
    </div>
  )
}

function Field({ def, raw, onSet }: { def: VitalDef; raw: string; onSet: (s: string) => void }) {
  const f = flag(def, raw)

  // A blood pressure is one reading written as two numbers, and it is typed as
  // two numbers. Two boxes with a slash between them beats one box that has to
  // be taught what a slash is.
  if (def.pair) {
    const [a = '', b = ''] = raw.split('/')
    const set = (x: string, y: string) => onSet(x || y ? `${x}/${y}` : '')
    return (
      <div className={'vfld pair' + (f ? ' f-' + f : '')}>
        <label>{def.en} <i className="sd">{def.sd}</i></label>
        <div className="vpair">
          <input inputMode="numeric" maxLength={def.max} value={a} placeholder="120"
                 onChange={e => set(e.target.value.replace(/\D/g, ''), b)} />
          <span>/</span>
          <input inputMode="numeric" maxLength={def.max} value={b} placeholder="80"
                 onChange={e => set(a, e.target.value.replace(/\D/g, ''))} />
          <em>{def.unit}</em>
        </div>
        {f && <span className="vmark">{f === 'high' ? 'higher than usual' : 'lower than usual'}</span>}
      </div>
    )
  }

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
