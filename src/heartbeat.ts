/**
 * THE HEARTBEAT. Approved by Safeer as the middle path, and this file is the
 * whole of what it may ever say: THE CLINIC CODE AND THE APP VERSION. Nothing
 * else. Not a patient count, not a slip count, not a name, not an error log.
 * The website and the signed Service Agreement both promise that nothing
 * about a clinic's work leaves the machine, and a heartbeat that grew a
 * field would break that promise in the dark. heartbeat.test.ts pins the
 * payload to exactly two keys and fails the build if a third ever appears.
 *
 * OPT-IN, DEFAULT OFF, SHOWN TO THE CLINIC. The switch lives on the Service
 * tab where the licence already lives, worded in full. A clinic that never
 * touches it sends nothing, forever.
 *
 * FIRE AND FORGET, AND IT CAN NEVER BLOCK AN EVENING. sendBeacon hands the
 * bytes to the browser and returns immediately; there is no await, no retry,
 * no error path that reaches a screen. A clinic that is offline all its life
 * simply never delivers one, and nothing anywhere notices or cares. The
 * receiver (worker/site.mjs) stores last-seen per clinic for the super admin
 * panel and answers nothing of substance.
 *
 * ONLY THE CLINIC CHANNEL SENDS. The public demo would be a thousand
 * strangers' browsers reporting a clinic code they do not have; it is built
 * out at the channel check, not at a setting.
 */
import { CHANNEL, VERSION, BUILD } from './version'
import { service } from './service'

const KEY = 'nuskho.heartbeat'
const HB_URL = 'https://nuskho.safeer-ali-mirani.workers.dev/hb'

export function heartbeatOn(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function setHeartbeatOn(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch { /* private mode: stays off, which is the safe direction */ }
}

/**
 * The exact bytes that leave, or null when nothing may. Pure so the test can
 * hold it still: channel, switch, and clinic code are handed in rather than
 * read, and the wrapper below supplies the real ones.
 */
export function heartbeatPayload(
  channel: string, on: boolean, clinic: string, version: string,
): string | null {
  if (channel !== 'clinic') return null
  if (!on) return null
  const c = clinic.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)
  if (!c) return null
  const v = version.replace(/[^A-Za-z0-9. +-]/g, '').slice(0, 40)
  return `c=${encodeURIComponent(c)}&v=${encodeURIComponent(v)}`
}

/** Once, at open, after the screen is up. Never awaited, never repeated. */
export function sendHeartbeat(): void {
  try {
    const body = heartbeatPayload(CHANNEL, heartbeatOn(), service().clinic, `${VERSION}+${BUILD}`)
    if (!body) return
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(HB_URL, body)
    }
    // No fetch fallback on purpose: a browser without sendBeacon is old
    // enough that adding a network call at startup is the wrong trade.
  } catch { /* a heartbeat is the one thing allowed to die silently */ }
}
