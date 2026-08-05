import { describe, it, expect } from 'vitest'
import { renderToken } from './print/token'
import { renderSlip, type SlipData } from './print/renderSlip'
import { visitDoctorId, FIRST_DOCTOR } from './doctors'
import type { Visit } from './types'

/**
 * Whose name is on the paper.
 *
 * In a building with several rooms, the heading of a prescription and the top
 * of a token receipt come from the VISIT's doctor, not from whichever profile
 * happens to be on the machine. A slip that silently printed Room 1's name over
 * Room 2's medicines would be the worst kind of wrong: legally another
 * doctor's prescription, and nothing on screen would have said so. These tests
 * pin the override, and pin the fallback that keeps every solo clinic printing
 * exactly what it always printed.
 */

const baseToken = {
  token: 7,
  patientName: 'Test Family',
  patientCode: '00421',
  fee: 800,
  feeState: 'paid' as const,
  at: 1754820000000,
}

describe('the token receipt in a building with rooms', () => {
  it('carries the room and that room\'s doctor when told them', () => {
    const html = renderToken({
      ...baseToken,
      doctorEn: 'Dr S. Soomro', doctorSd: 'ڊاڪٽر سومرو', degreesEn: 'MBBS, DCH', room: '2',
    })
    expect(html).toContain('Dr S. Soomro')
    expect(html).toContain('ڊاڪٽر سومرو')
    expect(html).toContain('MBBS, DCH')
    expect(html).toContain('ROOM 2')
    expect(html).toContain('ڪمرو 2')
  })

  it('prints no room band at all for a solo clinic', () => {
    const html = renderToken(baseToken)
    expect(html).not.toContain('tk-room')
    expect(html).not.toContain('ROOM')
  })

  it('escapes a doctor name rather than trusting it', () => {
    const html = renderToken({ ...baseToken, doctorEn: 'Dr <b>X</b> & Co', room: '2' })
    expect(html).not.toContain('<b>X</b>')
    expect(html).toContain('Dr &lt;b&gt;X&lt;/b&gt; &amp; Co')
  })
})

const visit = (over: Partial<Visit> = {}): Visit => ({
  id: 'V1', patientId: 'P1', token: 3, status: 'waiting', createdAt: 1754820000000,
  lines: [], tests: [], advice: [], ...over,
})

const slip = (doctor?: SlipData['doctor']): SlipData => ({
  visit: visit(), patientName: 'Test Family', patientCode: '00421',
  drugs: {}, rxId: 'ABC123', doctor,
})

describe('the prescription heading in a building with rooms', () => {
  it('names the visit\'s own doctor when one is passed', () => {
    const html = renderSlip(slip({
      nameEn: 'Dr S. Soomro', nameSd: 'ڊاڪٽر سومرو',
      degreesEn: 'MBBS, DCH', degreesSd: '', reg: 'PMC-1234',
    }))
    expect(html).toContain('Dr S. Soomro')
    expect(html).toContain('PMC-1234')
  })

  it('falls back to the profile for a solo clinic, as it always has', () => {
    // in this test environment the profile is blank, so the heading must be
    // blank too — never a leftover name from some other source
    const html = renderSlip(slip())
    expect(html).not.toContain('Dr S. Soomro')
    expect(html).toContain('docname')
  })
})

describe('which doctor a visit belongs to', () => {
  it('gives every visit from the solo era to the first doctor', () => {
    expect(visitDoctorId(undefined)).toBe(FIRST_DOCTOR)
  })
  it('leaves a tagged visit with its own room', () => {
    expect(visitDoctorId('DABCDEF')).toBe('DABCDEF')
  })
})
