import { useEffect, useRef, useState } from 'react'

/**
 * A NUMBER THAT COUNTS UP TO ITSELF, ONCE.
 *
 * On the figures page. Three numbers carry that screen — people served, people
 * who came back, evenings worked — and they appeared fully formed, so the eye
 * had no reason to land on them before the paragraph underneath.
 *
 * Two rules make this honest rather than decorative:
 *
 *   IT NEVER SHOWS A NUMBER THAT IS NOT ON ITS WAY TO THE TRUE ONE. It starts
 *   at zero and rises; it does not overshoot and settle back, which would mean
 *   a doctor could read a figure off this screen that was never true.
 *
 *   IT IS SHORT, AND IT IS ONCE. 520ms on mount. Re-rendering for any other
 *   reason shows the number, because a figure that re-animates every time the
 *   month filter changes is a figure nobody can read.
 *
 * With prefers-reduced-motion the whole thing is skipped and the number is
 * simply there, which is also what happens if the browser has no rAF.
 */
export default function CountUp({ to, ms = 520 }: { to: number; ms?: number }) {
  const quiet = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [n, setN] = useState(quiet ? to : 0)
  const done = useRef(false)

  useEffect(() => {
    if (quiet || done.current || !to || typeof requestAnimationFrame !== 'function') { setN(to); return }
    done.current = true
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      // ease out: fast at the start, so the number is readable for most of it
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to])

  return <>{n.toLocaleString('en-GB')}</>
}
