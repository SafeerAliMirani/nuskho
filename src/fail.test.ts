import { describe, it, expect } from 'vitest'
import { whyItFailed } from './fail'

/**
 * These check the SENTENCE, not the code path, because the sentence is the
 * whole product here. A person at a door with twenty people behind him gets one
 * chance to read it, and the difference between a useful message and a useless
 * one is entirely in the words.
 *
 * Three rules, checked on every branch:
 *   1. it says what did not happen, in the words of the room
 *   2. it says what to do next
 *   3. it never shows a person the browser's own vocabulary
 */

/** The words a person must never be shown. */
const JARGON = [
  'DOMException', 'QuotaExceededError', 'IndexedDB', 'Dexie', 'undefined',
  'null', 'Promise', 'stack', 'Error:',
]

const clean = (s: string) => {
  for (const w of JARGON) expect(s).not.toContain(w)
  // and no em dashes anywhere in what Nuskho says
  expect(s).not.toContain('—')
}

describe('the sentence a person reads when a write refuses', () => {
  it('always opens with the thing that did not happen', () => {
    const s = whyItFailed(new Error('boom'), 'The patient was not added')
    expect(s.startsWith('The patient was not added')).toBe(true)
    clean(s)
  })

  it('a full disk says take a backup and free space, not "quota exceeded"', () => {
    const e = Object.assign(new Error('x'), { name: 'QuotaExceededError' })
    const s = whyItFailed(e, 'The patient was not added')
    expect(s).toMatch(/no room left/)
    expect(s).toMatch(/backup/)
    expect(s).toMatch(/paper pad/)
    clean(s)
  })

  it('reads the INNER error, because Dexie wraps the real one', () => {
    // A quota failure arrives as an OpenFailedError whose inner error is the
    // QuotaExceededError. Reading only the outer one gave every storage problem
    // the same useless sentence, which is how this branch got missed once.
    const e = Object.assign(new Error('Failed to open'), {
      name: 'OpenFailedError',
      inner: Object.assign(new Error('x'), { name: 'QuotaExceededError' }),
    })
    expect(whyItFailed(e)).toMatch(/no room left/)
  })

  it('a second window holding the records says close it and reload', () => {
    const e = Object.assign(new Error('x'), { name: 'VersionError' })
    const s = whyItFailed(e, 'The token was not closed')
    expect(s).toMatch(/Close every other Nuskho tab/)
    expect(s).toMatch(/Nothing has been lost/)
    clean(s)
  })

  it('a private window says open a normal one, and does not say "try again"', () => {
    const e = Object.assign(new Error('x'), { name: 'MissingAPIError' })
    const s = whyItFailed(e)
    expect(s).toMatch(/private or incognito/)
    // there is nothing to retry: it will refuse identically every time, and
    // telling somebody to press it again would have them press it all evening
    expect(s).not.toMatch(/once more/)
    clean(s)
  })

  it('a race for the same number says press it once more', () => {
    const e = Object.assign(new Error('x'), { name: 'ConstraintError' })
    const s = whyItFailed(e)
    expect(s).toMatch(/once more/)
    expect(s).toMatch(/Nothing has been lost/)
    clean(s)
  })

  it('an unknown failure still says nothing was lost, and ends at paper', () => {
    for (const e of [null, undefined, 'a string', {}, new Error('who knows')]) {
      const s = whyItFailed(e)
      expect(s).toMatch(/nothing was lost/)
      expect(s).toMatch(/paper pad/)
      clean(s)
    }
  })
})
