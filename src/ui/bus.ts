import { play, type Cue } from './sound'

/**
 * ONE CLINIC, TWO SCREENS, NO SERVER.
 *
 * The doctor is in the room and the compounder is at the desk. They need to
 * reach each other: a bell to call him in, a patient who cannot wait, money to
 * hand back before the patient walks out of the door.
 *
 * WHAT THIS CAN AND CANNOT DO, STATED PLAINLY
 *
 * BroadcastChannel carries a message between every tab and window of the same
 * browser on the same machine. So a clinic running the doctor's screen in one
 * window and the counter in another — which is exactly how a one-computer
 * clinic works, and how the pilot will run — gets all of this today, with no
 * network, no server, and nothing to configure.
 *
 * BroadcastChannel alone does NOT cross to a second machine, and for a long
 * time this file said so and stopped there. It was the honest thing to say and
 * it was also the bug: the doctor pressed a bell that rang only in his own
 * window, the compounder's phone stayed silent, and the doctor concluded the
 * compounder was ignoring him.
 *
 * A building on the wire now carries these across machines too, through the
 * relay further down. The events did not change and no screen changed: this was
 * always the seam the wire would plug into, and it plugged in here.
 *
 * What is still true, and still worth saying plainly: two clinics on two
 * separate wires do not hear each other, and nothing here reaches a machine
 * that is switched off.
 *
 * THE MESSAGE IS NEVER THE RECORD. Every event here is a nudge toward something
 * already written to the database. A dropped message costs a chime, never a
 * fact, so nothing needs delivery guarantees, retries, or an inbox.
 *
 * AND NOTHING CLINICAL TRAVELS. A message may name a patient and a token. It
 * may never carry a medicine, a dose or a diagnosis. The counter has no
 * business seeing those, and a message bus is exactly the sort of convenience
 * through which that rule gets quietly broken.
 */

export type Signal =
  | { kind: 'bell'; from: string }
  | { kind: 'patient'; token: number; name: string }
  | { kind: 'urgent'; token: number; name: string }
  | { kind: 'refund'; token: number; name: string; amount: number }
  | { kind: 'printed'; token: number }
  | { kind: 'seen'; token: number }
  /** the counter has answered the bell, so the doctor's button can stop glowing */
  | { kind: 'coming' }

const CHANNEL = 'nuskho'

type Handler = (s: Signal) => void
const handlers = new Set<Handler>()

let chan: BroadcastChannel | null = null
function channel(): BroadcastChannel | null {
  if (chan) return chan
  try {
    if (typeof BroadcastChannel === 'undefined') return null
    chan = new BroadcastChannel(CHANNEL)
    chan.onmessage = e => deliver(e.data as Signal, false)
  } catch { chan = null }
  return chan
}

function deliver(s: Signal, mine: boolean): void {
  // The sender does not chime at itself. The compounder who just added a
  // patient does not need to be told that a patient was added.
  if (!mine) play(CUE[s.kind])
  for (const h of handlers) { try { h(s) } catch { /* one bad listener must not stop the rest */ } }
}

const CUE: Record<Signal['kind'], Cue> = {
  bell: 'bell', patient: 'patient', urgent: 'urgent', refund: 'money',
  printed: 'done', seen: 'done', coming: 'done',
}

/* ------------------------------------------------- and the other MACHINES
 *
 * BroadcastChannel reaches every tab of this browser. It does not cross to the
 * phone in the compounder's pocket, and the doctor pressing a bell that only
 * rings in his own window is worse than a doctor with no bell: he keeps
 * pressing it and concludes the compounder is ignoring him.
 *
 * The building's wire crosses machines, so a signal goes out on it too. The
 * wire is not imported here. It installs itself, because bus.ts must keep
 * working unchanged in a solo clinic that has no wire at all, and because a
 * cycle between these two files would be a real one: building.ts already
 * listens to this bus.
 *
 * THE MESSAGE IS STILL NEVER THE RECORD. Everything that goes out this way is
 * a nudge toward something already written on the machine that holds the
 * records. A dropped one costs a chime, so this needs no retries, no
 * acknowledgement and no inbox.
 */
type Relay = (s: Signal) => void
let relay: Relay | null = null

/** The wire installs itself here when the building comes up. */
export function setRelay(r: Relay | null): void { relay = r }

/**
 * A signal that arrived from another MACHINE. It chimes and it shows, and it
 * does NOT go back out: the wire that delivered it has already given it to
 * everyone who is allowed to hear it, and a signal that re-broadcasts itself on
 * arrival is a room full of phones ringing each other for ever.
 */
export function deliverFromWire(s: Signal): void { deliver(s, false) }

/** Tell the other windows, and the other machines. Returns quietly if the
 *  browser has no channel and the clinic has no wire. */
export function signal(s: Signal): void {
  try { channel()?.postMessage(s) } catch { /* ignore */ }
  try { relay?.(s) } catch { /* ignore */ }
  deliver(s, true)
}

/** Listen. Returns the unsubscribe, for a React effect. */
export function onSignal(h: Handler): () => void {
  channel()
  handlers.add(h)
  return () => { handlers.delete(h) }
}

/**
 * Is there anywhere for a message to go?
 *
 * A single window talking to itself is a bell that rings only in the room it
 * was pressed in, which is worse than no bell. The count is kept by everyone
 * announcing themselves, so a screen can honestly say "nobody is listening"
 * instead of pretending.
 */
let peers = 0
let lastSeen = 0

export function peerCount(): number {
  // a peer that has not said hello in 12 seconds has gone
  return Date.now() - lastSeen < 12000 ? peers : 0
}

const HELLO = 'nuskho.hello'
let helloChan: BroadcastChannel | null = null

/**
 * Refcounted, because two components want presence and one of them unmounts.
 *
 * App and Bell both called this. Bell's cleanup, which runs every time the
 * doctor leaves a consultation, closed and nulled the channel App was still
 * holding — so from the second patient onward `peerCount()` was stuck at zero,
 * the bell button read "nobody is listening yet" for the rest of the evening,
 * and the hint told the doctor his bell could not reach the counter. It could.
 */
let presence = 0

export function startPresence(): () => void {
  presence++
  if (presence > 1) return release
  try {
    if (typeof BroadcastChannel === 'undefined') { return release }
    helloChan = new BroadcastChannel(HELLO)
    helloChan.onmessage = e => {
      if (e.data === 'ping') helloChan?.postMessage('pong')
      if (e.data === 'pong') { peers = Math.max(peers, 1); lastSeen = Date.now() }
    }
    const beat = () => { peers = 0; helloChan?.postMessage('ping') }
    beat()
    timer = setInterval(beat, 5000)
    return release
  } catch { return release }
}

let timer: ReturnType<typeof setInterval> | null = null

function release(): void {
  presence = Math.max(0, presence - 1)
  if (presence > 0) return
  if (timer) { clearInterval(timer); timer = null }
  try { helloChan?.close() } catch { /* ignore */ }
  helloChan = null
}
