import { useEffect, useState } from 'react'
import { onFailure } from '../fail'
import { IcStop } from './art'

/**
 * THE BAND THAT APPEARS WHEN SOMETHING BROKE AND NOBODY CAUGHT IT.
 *
 * Every screen that writes anything now says so where the button is. This is
 * for everything else: the promise nobody awaited, the render that threw, the
 * failure in a code path written before this rule existed and the one that will
 * be written after it and forget.
 *
 * It is deliberately vague about what happened and precise about what to do,
 * because that is the honest shape of the information. Nobody at this desk can
 * act on a stack trace, and everybody can act on "reload the page".
 *
 * WHY IT IS NOT A TOAST. Toasts leave on their own. A person looking down at a
 * patient's old slip for four seconds would miss it entirely, and the whole
 * point of this band is that it must not be possible to miss the moment the
 * screen stopped being trustworthy. It stays until it is dismissed.
 *
 * WHY IT IS DISMISSIBLE ANYWAY. A band that cannot be closed sits across the
 * top of the screen for the rest of the evening after one hiccup, and by the
 * third patient it is furniture. Worse, if it ever covered a control, it would
 * be the thing standing between the compounder and a waiting patient, which is
 * the one thing nothing in this app is allowed to do.
 */
export default function Broke() {
  const [msg, setMsg] = useState('')

  useEffect(() => onFailure(m => setMsg(m)), [])

  if (!msg) return null
  return (
    <div className="brokebar" role="alert">
      <span className="bb-i"><IcStop size={17} /></span>
      <div className="bb-b">
        <b>Something went wrong</b>
        <p>{msg}</p>
      </div>
      <div className="bb-a">
        <button className="btn" onClick={() => location.reload()}>Reload</button>
        <button className="lnk" onClick={() => setMsg('')}>Hide</button>
      </div>
    </div>
  )
}
