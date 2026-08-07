import { describe, it, expect } from 'vitest'
import { renderSlip, type SlipData } from './print/renderSlip'
import { destinationEn, destinationSd } from './refer'
import type { Visit } from './types'

/**
 * THE REFERRAL ON PAPER.
 *
 * The token in the other room's queue is the convenient channel. The paper is
 * the one that has to work — in a hospital in another city, with no Nuskho, at
 * two in the morning. So what is pinned here is the printed band: that it
 * appears when a patient was sent on, that it carries the reason rather than
 * only the destination, that it stays off every slip that is not a referral,
 * and that a destination or a reason cannot smuggle markup onto a medical
 * document.
 */

const visit = (over: Partial<Visit> = {}): Visit => ({
  id: 'V1', patientId: 'P1', token: 3, status: 'waiting', createdAt: 1754820000000,
  lines: [], tests: [], advice: [], ...over,
})

const slip = (over: Partial<SlipData> = {}): SlipData => ({
  visit: visit(), patientName: 'Test Family', patientCode: '00421',
  drugs: {}, rxId: 'ABC123', ...over,
})

describe('a patient sent on, printed', () => {
  it('prints where he is going and why', () => {
    const html = renderSlip(slip({
      visit: visit({ sentOn: { toPlace: 'CMC Hospital, Larkana', note: 'chest pain, needs an ECG tonight', at: 1 } }),
      sentTo: { en: 'CMC Hospital, Larkana', sd: '' },
    }))
    expect(html).toContain('SENT ON TO')
    expect(html).toContain('CMC Hospital, Larkana')
    expect(html).toContain('chest pain, needs an ECG tonight')
  })

  it('carries the Sindhi heading already used for this outcome in the app', () => {
    const html = renderSlip(slip({
      visit: visit({ sentOn: { toPlace: 'CMC', note: 'why', at: 1 } }),
      sentTo: { en: 'CMC', sd: '' },
    }))
    expect(html).toContain('اڳتي موڪليو')
  })

  it('names the other room in both scripts when he is sent down the corridor', () => {
    const html = renderSlip(slip({
      visit: visit({ sentOn: { toDoctorId: 'D2', note: 'for the child', at: 1 } }),
      sentTo: { en: 'Room 4 · Dr S. Soomro', sd: 'ڊاڪٽر سومرو' },
    }))
    expect(html).toContain('Room 4 · Dr S. Soomro')
    expect(html).toContain('ڊاڪٽر سومرو')
  })

  it('says nothing at all on an ordinary prescription', () => {
    const html = renderSlip(slip())
    expect(html).not.toContain('SENT ON TO')
    expect(html).not.toContain('bx sent')
  })

  it('escapes the destination and the reason rather than trusting them', () => {
    const html = renderSlip(slip({
      visit: visit({ sentOn: { toPlace: 'x', note: '<script>bad()</script>', at: 1 } }),
      sentTo: { en: '<b>Room 4</b>', sd: '' },
    }))
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>Room 4</b>')
    expect(html).toContain('&lt;script&gt;')
  })

  /**
   * A referral is the last thing on the slip and it belongs on the sheet the
   * patient is holding at the end, beside the tests and the advice — not on
   * sheet one of three, above nine more medicines.
   */
  it('appears once, on the last sheet, however many sheets there are', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      drugId: 'd' + i, dose: { m: 1, d: 0, n: 1 }, meal: 'after' as const, days: 5,
      snap: { brand: 'DRUG' + i, strength: '500mg', generic: '', sd: '', sdReviewed: false, unitSd: '', form: 'tab' as const },
    }))
    const html = renderSlip(slip({
      visit: visit({ lines: many, sentOn: { toPlace: 'CMC', note: 'why', at: 1 } }),
      sentTo: { en: 'CMC', sd: '' },
    }), { groups: [5, 4], compact: true })
    expect(html.match(/SENT ON TO/g)?.length).toBe(1)
    // and after the last medicine, not before the first
    expect(html.indexOf('SENT ON TO')).toBeGreaterThan(html.lastIndexOf('DRUG8'))
  })
})

describe('naming the destination', () => {
  it('is empty when nobody was sent anywhere', () => {
    expect(destinationEn(undefined)).toBe('')
    expect(destinationSd(undefined)).toBe('')
  })

  it('uses the doctor\'s own words for a place outside the building', () => {
    const s = { toPlace: 'CMC Hospital, Larkana', note: 'n', at: 1 }
    expect(destinationEn(s)).toBe('CMC Hospital, Larkana')
    // and invents no Sindhi for a place a doctor typed in English
    expect(destinationSd(s)).toBe('')
  })
})
