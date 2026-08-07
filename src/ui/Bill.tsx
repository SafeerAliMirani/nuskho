import { useState } from 'react'
import { nag, snooze } from '../service'
import { can, role } from '../roles'

/**
 * The payment reminder, on screen.
 *
 * It sits under the header and above the work, so it is read and then stepped
 * over. It never covers a control, never blocks a click, and never appears on
 * a screen belonging to somebody who cannot pay it. Push it away and it is gone
 * for the evening; it is back tomorrow, and it will keep coming back, which is
 * the entire mechanism. Nothing else in Nuskho behaves differently because of
 * it: the queue, the printing and the records do not know it exists.
 */
export default function Bill() {
  const [, redraw] = useState(0)

  // Only the people who actually pay, or who we are: the doctor, the clinic
  // admin who watches the building's money, and the Nuskho role at install.
  const mine = role() === 'doctor' || can('ops') || role() === 'admin'
  if (!mine) return null

  const n = nag()
  if (!n) return null

  const money = n.amount > 0 ? `Rs ${n.amount.toLocaleString('en-PK')}` : ''

  return (
    <div className={'billbar ' + n.tone} role="status">
      <span className="bb-t">
        {n.tone === 'soon'
          ? <>Nuskho service is due in <b>{n.days === 0 ? 'today' : `${n.days} day${n.days === 1 ? '' : 's'}`}</b>{money ? <>, <b>{money}</b></> : null}.</>
          : n.days === 0
          ? <>Nuskho service is due <b>today</b>{money ? <>, <b>{money}</b></> : null}.</>
          : <>Nuskho service was due <b>{n.days} day{n.days === 1 ? '' : 's'} ago</b>, on {n.on}{money ? <>, <b>{money}</b></> : null}.</>}
        {' '}
        <span className="bb-s">Support, updates and the medicine list stay stopped until it is paid. Nothing else changes.</span>
      </span>
      <span className="bb-a">
        <a className="lnk" href={`https://wa.me/${n.contact.replace(/\D/g, '').replace(/^0/, '92')}`}
           target="_blank" rel="noreferrer">WhatsApp {n.contact}</a>
        <button className="lnk" onClick={() => { snooze(); redraw(x => x + 1) }}>not now</button>
      </span>
    </div>
  )
}
