/**
 * SOUND, MADE RATHER THAN PLAYED.
 *
 * Every tone in this app is synthesised by the browser from a few numbers.
 * There are no audio files, which matters for three reasons: the bundle stays
 * small enough to send over a Larkana connection, nothing has to load before a
 * sound can play, and it works from a folder with the network unplugged.
 *
 * WHY THESE SOUNDS AND NOT OTHERS
 *
 * A clinic at eight in the evening is already loud. A sound that competes with
 * the room is a sound that gets muted on day two, and a muted alert is worse
 * than none because everyone believes it is still working. So:
 *
 *   - Short. Nothing here runs past about 700ms.
 *   - Soft attack, long release. A click or a beep cuts through conversation as
 *     an interruption; a struck tone reads as information.
 *   - Pitched, not buzzing. Two or three notes of a real chord, so the ear
 *     files it as a signal rather than as a machine fault.
 *   - DIFFERENT SHAPES, not just different pitches. The bell RISES, money FALLS,
 *     the emergency REPEATS. Someone across a room learns those apart in a day
 *     without being taught, and a compounder half deaf in one ear still gets it.
 *
 * NOTHING HERE MAY EVER BLOCK ANYTHING. Audio is a courtesy on top of a message
 * that is always also on the screen. Every call is wrapped so that a browser
 * with no audio, a muted machine, or a policy that refuses to start a context
 * simply produces silence and no error.
 */

export type Cue =
  | 'patient'    // one more in the queue
  | 'urgent'     // someone who cannot wait
  | 'money'      // hand this back
  | 'bell'       // the doctor is calling the compounder
  | 'done'       // a slip came out of the printer
  | 'oops'       // that did not work

const KEY = 'nuskho.sound'

/** Muted is remembered. A clinic that turns sound off means it. */
export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}
export function setSound(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* ignore */ }
}

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    // Browsers suspend the context until a gesture. Signing in is a gesture, so
    // by the time anything here plays it has almost always resumed already.
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

/** One struck note: soft in, long out. The building block for everything below. */
function note(c: AudioContext, freq: number, at: number, len: number, gain: number, type: OscillatorType = 'sine') {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, c.currentTime + at)
  // an attack of a few milliseconds instead of zero is the whole difference
  // between a musical tone and a click
  g.gain.setValueAtTime(0.0001, c.currentTime + at)
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + len)
  o.connect(g).connect(c.destination)
  o.start(c.currentTime + at)
  o.stop(c.currentTime + at + len + 0.02)
}

/** A note that slides, for the two cues that need to feel like movement. */
function glide(c: AudioContext, from: number, to: number, at: number, len: number, gain: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(from, c.currentTime + at)
  o.frequency.exponentialRampToValueAtTime(to, c.currentTime + at + len * 0.8)
  g.gain.setValueAtTime(0.0001, c.currentTime + at)
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + at + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + len)
  o.connect(g).connect(c.destination)
  o.start(c.currentTime + at)
  o.stop(c.currentTime + at + len + 0.02)
}

/* The pitches are a C major triad and its neighbours: C5 523, E5 659, G5 784,
   A5 880, C6 1047. Chosen because they are consonant with each other, so two
   cues landing at once are a chord and not a clash. */
const C5 = 523.25, E5 = 659.25, G5 = 784, A5 = 880, C6 = 1046.5, G4 = 392, C4 = 261.6

export function play(cue: Cue): void {
  if (!soundOn()) return
  const c = audio()
  if (!c) return
  try {
    switch (cue) {
      // one more waiting. Two notes up, quiet — this fires all evening.
      case 'patient':
        note(c, G5, 0, 0.16, 0.055); note(c, C6, 0.07, 0.24, 0.045)
        break

      // cannot wait. Three insistent pairs, louder, and the only cue that
      // repeats. Repetition is what the ear reads as urgency, not volume.
      case 'urgent':
        for (let i = 0; i < 3; i++) {
          note(c, A5, i * 0.2, 0.1, 0.13, 'triangle')
          note(c, E5, i * 0.2 + 0.07, 0.13, 0.1, 'triangle')
        }
        break

      // money going back. Falling, because it is a reversal.
      case 'money':
        note(c, C6, 0, 0.14, 0.075); note(c, G5, 0.09, 0.16, 0.07); note(c, E5, 0.18, 0.34, 0.065)
        break

      // the doctor calling. A rising strike with a second voice a fifth above,
      // which is as close to a real bell as two oscillators get.
      case 'bell':
        glide(c, C5, G5, 0, 0.5, 0.11)
        note(c, C6, 0.02, 0.62, 0.075)
        note(c, E5, 0.03, 0.5, 0.05, 'triangle')
        break

      // paper came out. Quiet, satisfied, and over before he looks up.
      case 'done':
        note(c, E5, 0, 0.1, 0.045); note(c, G5, 0.06, 0.18, 0.04)
        break

      // that did not work. Low and falling: the only cue below middle C.
      case 'oops':
        note(c, G4, 0, 0.16, 0.08, 'triangle'); note(c, C4, 0.11, 0.3, 0.07, 'triangle')
        break
    }
  } catch { /* silence is an acceptable failure for every one of these */ }
}

/** Called once from a real click so the browser lets us make noise later. */
export function primeSound(): void { audio() }
