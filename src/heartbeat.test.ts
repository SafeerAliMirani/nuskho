import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { heartbeatPayload } from './heartbeat'

/**
 * THE HEARTBEAT MAY SAY TWO THINGS, AND THIS FILE IS WHAT HOLDS IT TO THAT.
 *
 * The Service Agreement and the website promise that nothing about a
 * clinic's work leaves its machine. The heartbeat is the one deliberate,
 * opt-in exception: the clinic code and the app version. A third field added
 * in a hurry two years from now would break a signed promise silently, so
 * the payload's exact shape is pinned here, and the sender module is grepped
 * for the ways a field could sneak in.
 */
describe('the heartbeat', () => {
  it('says exactly c and v, and nothing else', () => {
    const body = heartbeatPayload('clinic', true, 'LRK-014', '1.0.0+abc1234')
    expect(body).toBeTruthy()
    const p = new URLSearchParams(body!)
    expect([...p.keys()].sort()).toEqual(['c', 'v'])
    expect(p.get('c')).toBe('LRK-014')
    expect(p.get('v')).toBe('1.0.0+abc1234')
  })

  it('says nothing without the opt-in, whatever else is true', () => {
    expect(heartbeatPayload('clinic', false, 'LRK-014', '1.0.0')).toBeNull()
  })

  it('says nothing on the demo channel: a thousand strangers are not a clinic', () => {
    expect(heartbeatPayload('demo', true, 'LRK-014', '1.0.0')).toBeNull()
  })

  it('says nothing when no clinic code has been written', () => {
    expect(heartbeatPayload('clinic', true, '', '1.0.0')).toBeNull()
    expect(heartbeatPayload('clinic', true, '   ', '1.0.0')).toBeNull()
  })

  it('cannot be used to smuggle structure: separators die in the clip', () => {
    const body = heartbeatPayload('clinic', true, 'LRK-014&x=1', 'v&y=1&z=2')
    const p = new URLSearchParams(body!)
    // still exactly two keys: the injected & and = did not create parameters
    expect([...p.keys()].sort()).toEqual(['c', 'v'])
    expect(p.get('c')).toBe('LRK-014X1')
    expect(p.get('v')).toBe('vy1z2')
  })

  it('the sender module never imports the database and never fetches', () => {
    // The strongest promise is structural: heartbeat.ts cannot say what it
    // cannot see. It reads the licence's clinic code and the version stamps,
    // and it has no route to a patient, a visit, or a fetch fallback.
    const src = readFileSync(new URL('./heartbeat.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(/from '\.\/db'/)
    expect(src).not.toMatch(/\bfetch\s*\(/)
    expect(src).not.toMatch(/XMLHttpRequest/)
    const beacons = src.match(/sendBeacon/g) ?? []
    expect(beacons.length).toBeGreaterThan(0)
  })
})
