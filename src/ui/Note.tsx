import type { ReactNode } from 'react'
import { IcInfo, IcWarn, IcStop, IcCheck, IcShield } from './art'

/**
 * ONE WAY OF SAYING SOMETHING IMPORTANT.
 *
 * Before this there were five: `.hint`, `.usable.bad`, `.note`, `.note.nudge`,
 * `.lockbar`, plus a couple of inline styles. They looked different from each
 * other for no reason a reader could work out, so the difference carried no
 * information. A warning that looks like a tip is a warning nobody reads.
 *
 * Five tones, and the choice between them is a real decision:
 *
 *   info    something worth knowing. Costs nothing to ignore.
 *   good    something went right. Confirmation, not decoration.
 *   warn    something will go wrong later if this is left alone.
 *   stop    something is wrong NOW and the next action will fail.
 *   safe    a promise about privacy or data. Deliberately its own tone,
 *           because "nothing leaves this computer" is the single claim this
 *           whole project stands on and it should never look like a tip.
 *
 * A tone is not a colour. Every one of these carries an icon and a heading as
 * well, because roughly one in twelve men here cannot separate the red from the
 * green, and because a doctor reading his second language at speed is reading
 * shapes and words, not hues.
 */
export type Tone = 'info' | 'good' | 'warn' | 'stop' | 'safe'

const ICON = { info: IcInfo, good: IcCheck, warn: IcWarn, stop: IcStop, safe: IcShield }

export function Note({ tone = 'info', title, children, action }: {
  tone?: Tone
  /** Short. If it needs a comma it is not a title, it is the body. */
  title?: string
  children?: ReactNode
  action?: ReactNode
}) {
  const I = ICON[tone]
  return (
    <div className={'nt nt-' + tone} role={tone === 'stop' ? 'alert' : undefined}>
      <span className="nt-i"><I size={17} /></span>
      <div className="nt-b">
        {title && <b>{title}</b>}
        {children && <p>{children}</p>}
      </div>
      {action && <div className="nt-a">{action}</div>}
    </div>
  )
}

/**
 * The same thing at one line, for a place where a full block would shout.
 * No title, no icon circle, just a coloured rule and the sentence.
 */
export function Tip({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  const I = ICON[tone]
  return (
    <p className={'tip tip-' + tone}><I size={14} /><span>{children}</span></p>
  )
}
