import { useEffect, useState } from 'react'
import { signal, onSignal, peerCount, startPresence } from './bus'

/**
 * THE BELL ON THE DOCTOR'S DESK.
 *
 * Every clinic in Larkana already has one, made of brass, and the compounder
 * knows exactly what it means. This is the same object: the doctor presses it,
 * it rings where the compounder is sitting, and that is the whole feature.
 *
 * Two decisions worth stating.
 *
 * IT TELLS THE TRUTH ABOUT WHETHER ANYONE CAN HEAR IT. If no other window of
 * this app is open, the button says so instead of pretending. A bell that rings
 * only in the room it was pressed in is worse than no bell, because the doctor
 * presses it three times and concludes the compounder is ignoring him.
 *
 * IT ANSWERS BACK. The compounder taps "Coming" on his toast and the doctor's
 * button says so for a few seconds. Without that the doctor presses it again,
 * and then again, which is precisely the noise the brass bell already makes and
 * the reason nobody loves it.
 */
export default function Bell() {
  const [rang, setRang] = useState(false)
  const [coming, setComing] = useState(false)
  const [, redraw] = useState(0)

  useEffect(() => {
    const stop = startPresence()
    const t = setInterval(() => redraw(n => n + 1), 4000)
    const off = onSignal(s => {
      if (s.kind === 'coming') { setComing(true); setTimeout(() => setComing(false), 5000) }
    })
    return () => { stop(); clearInterval(t); off() }
  }, [])

  const heard = peerCount() > 0

  function ring() {
    if (rang) return
    signal({ kind: 'bell', from: 'doctor' })
    setRang(true)
    setTimeout(() => setRang(false), 4000)
  }

  return (
    <div className="bellwrap">
      <button className={'bell' + (rang ? ' ringing' : '') + (coming ? ' answered' : '')}
              onClick={ring} disabled={rang}
              title={heard ? 'Ring the counter' : 'No other screen of this app is open'}>
        <span className="bellcup">
          {/* the clapper is a separate element so it can swing on its own */}
          <svg viewBox="0 0 32 32" fill="none" aria-hidden>
            <path d="M16 4.6c-4.4 0-7.4 3.2-7.4 7.6 0 6-2.6 7.2-2.6 9.2h20c0-2-2.6-3.2-2.6-9.2 0-4.4-3-7.6-7.4-7.6z"
                  stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M16 4.6V2.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <i className="clap" />
        </span>
        <span className="belltx">
          <b>{coming ? 'Coming' : rang ? 'Ringing…' : 'Call the counter'}</b>
          <small>{heard ? 'گھنٽي وڄايو' : 'nobody is listening yet'}</small>
        </span>
      </button>
      {!heard && (
        <p className="hint">
          Open the counter's screen in a second window of this browser and the bell will
          reach it. It does not yet travel to the phones on the clinic's wifi.
        </p>
      )}
    </div>
  )
}
