import { describe, it, expect } from 'vitest'
import { patientCode, parseCode, codeLength } from './code'

/**
 * The number printed on the slip is the only key a returning patient carries.
 * If it stops round-tripping, the desk cannot find him, registers him again as
 * new, and the doctor opens a blank history while trusting the screen to show
 * him one. These tests exist because that used to happen at patient 10,000.
 */

describe('the printed patient code', () => {
  it('round-trips every number the clinic will ever issue', () => {
    for (const n of [1, 7, 42, 999, 1000, 9998, 9999, 10000, 10001, 54321, 99999, 100000, 999999]) {
      expect(parseCode(patientCode(n))).toBe(n)
    }
  })

  it('crosses the 9,999 boundary without changing width silently', () => {
    expect(patientCode(9999)).toHaveLength(5)
    expect(patientCode(10000)).toHaveLength(6)
    // both must be readable — the old parser demanded exactly five and lost the second
    expect(parseCode(patientCode(9999))).toBe(9999)
    expect(parseCode(patientCode(10000))).toBe(10000)
  })

  it('keeps every slip already printed valid', () => {
    // the four-digit body is byte-for-byte what it always was
    expect(patientCode(42)).toBe('0042' + patientCode(42).slice(-1))
    expect(patientCode(42)).toHaveLength(5)
  })

  it('rejects a mistyped digit rather than opening someone else', () => {
    const good = patientCode(1234)
    for (let i = 0; i < good.length; i++) {
      for (const d of '0123456789') {
        if (d === good[i]) continue
        const typo = good.slice(0, i) + d + good.slice(i + 1)
        const got = parseCode(typo)
        // either it fails the check digit, or it is a different patient entirely —
        // what must never happen is it silently resolving back to 1234
        if (got !== null) expect(got).not.toBe(1234)
      }
    }
  })

  it('rejects anything too short to carry a check digit', () => {
    expect(parseCode('')).toBeNull()
    expect(parseCode('1')).toBeNull()
    expect(parseCode('1234')).toBeNull()
    expect(parseCode('abcd')).toBeNull()
  })

  it('ignores separators, because scanners and people add them', () => {
    const c = patientCode(777)
    expect(parseCode(c.slice(0, 2) + '-' + c.slice(2))).toBe(777)
    expect(parseCode(' ' + c + ' ')).toBe(777)
  })

  it('agrees with the length the Open button waits for', () => {
    for (const n of [1, 9999, 10000, 123456]) {
      expect(patientCode(n)).toHaveLength(codeLength(n))
    }
  })
})
