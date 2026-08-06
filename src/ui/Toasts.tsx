import { useEffect, useState } from 'react'
import { onSignal, signal, type Signal } from './bus'
import { IcUser, IcWarn, IcMoney, IcPrint, IcCheck, IcQueue } from './art'

/**
 * WHAT ARRIVES ON SCREEN WHEN SOMETHING HAPPENS SOMEWHERE ELSE.
 *
 * Rules this obeys, all of them learned from things that go wrong in a busy
 * room rather than from a style guide:
 *
 *   1. NEVER over the print button. The stack sits top-right on a laptop and
 *      top-centre on a phone, because bottom-right on a phone is the thumb, and
 *      the thumb is holding the PRINT button.
 *   2. NEVER blocking. No toast takes a click to dismiss. They leave on their
 *      own, they do not steal focus, and the screen behind them stays live.
 *   3. THE URGENT ONE DOES NOT LEAVE. Everything else fades after a few
 *      seconds. A patient who cannot wait stays until somebody touches it,
 *      because the entire point is that it was not seen yet.
 *   4. AT MOST FOUR. A stack taller than that is a wall, and a wall is scenery.
 *      Older ones drop off the bottom.
 *   5. NOTHING CLINICAL. A toast may say a name and a number. It may never name
 *      a medicine, and the bus it listens to cannot carry one.
 */

type Toast = { id: number; kind: Signal['kind']; text: string; sub?: string; sticky?: boolean }

const ICON = {
  bell: IcQueue, patient: IcUser, urgent: IcWarn, refund: IcMoney,
  printed: IcPrint, seen: IcCheck, coming: IcCheck,
}

const LIFE: Partial<Record<Signal['kind'], number>> = {
  patient: 4200, printed: 3000, seen: 3000, coming: 3600, refund: 9000, bell: 12000,
}

function describe(s: Signal): { text: string; sub?: string } | null {
  switch (s.kind) {
    case 'bell':    return { text: 'The doctor is calling', sub: 'Please come to the room' }
    case 'coming':  return { text: 'The counter is coming' }
    case 'patient': return { text: `Number ${s.token} added`, sub: s.name }
    case 'urgent':  return { text: `Number ${s.token} cannot wait`, sub: `${s.name} — see them next` }
    case 'refund':  return { text: `Give back Rs ${s.amount}`, sub: `${s.name}, number ${s.token}` }
    case 'printed': return { text: `Number ${s.token} printed` }
    case 'seen':    return null      // too quiet to be worth a card
  }
}

let seq = 0

export default function Toasts() {
  const [list, setList] = useState<Toast[]>([])

  useEffect(() => onSignal(s => {
    const d = describe(s)
    if (!d) return
    const t: Toast = { id: ++seq, kind: s.kind, ...d, sticky: s.kind === 'urgent' }
    setList(l => [t, ...l].slice(0, 4))
    const life = LIFE[s.kind]
    if (life) setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), life)
  }), [])

  if (!list.length) return null

  return (
    <div className="toasts" aria-live="polite">
      {list.map(t => {
        const I = ICON[t.kind]
        return (
          <div key={t.id} className={'toast t-' + t.kind}
               onClick={() => setList(l => l.filter(x => x.id !== t.id))}>
            <span className="ti"><I size={18} /></span>
            <div className="tt">
              <b>{t.text}</b>
              {t.sub && <small>{t.sub}</small>}
            </div>
            {t.kind === 'bell' && (
              <button className="tbtn" onClick={e => {
                e.stopPropagation()
                signal({ kind: 'coming' })
                setList(l => l.filter(x => x.id !== t.id))
              }}>Coming</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
