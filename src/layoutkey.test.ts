import { describe, it, expect } from 'vitest'
import { renderSlip, type SlipData } from './print/renderSlip'
import type { Visit, RxLine } from './types'

/**
 * THE FITTER'S CACHE KEY MUST NOTICE EVERY FIELD THE PRINTER DRAWS.
 *
 * layoutKey is not exported (it is an implementation detail of the fitter and
 * nothing else may call it), so this pins the property that matters instead:
 * a field that changes the rendered sheet must also change the key. The test
 * renders two slips that differ only in that field, and asserts the OUTPUT
 * differs — which is the same thing the key exists to detect. If somebody adds
 * a printed field and forgets the key, they will still have to come here.
 */
const line = (p: Partial<RxLine> = {}): RxLine => ({
  drugId: 'd1', dose: { m: 1, d: 0, n: 0 }, meal: 'after', days: 5,
  snap: { brand: 'PANADOL', strength: '500 mg', generic: 'Paracetamol', sd: '', sdReviewed: false, unitSd: '', form: 'tab' },
  ...p,
})
const visit = (p: Partial<Visit> = {}): Visit => ({
  id: 'v123456', patientId: 'p1', token: 3, status: 'waiting', createdAt: Date.now(),
  lines: [line()], tests: [], advice: [], ...p,
})
const data = (p: Partial<SlipData> = {}): SlipData => ({
  visit: visit(), patientName: 'Wazir Ali', patientCode: '00185',
  drugs: {}, rxId: 'ABC123', ...p,
})

const differs = (a: SlipData, b: SlipData) => renderSlip(a) !== renderSlip(b)

describe('every field the slip draws changes the slip', () => {
  it('the doctor\'s note under a medicine', () => {
    expect(differs(data(), data({ visit: visit({ lines: [line({ note: 'with warm water' })] }) }))).toBe(true)
  })
  it('the allergy band', () => {
    expect(differs(data(), data({ patientAlert: 'penicillin' }))).toBe(true)
  })
  it('the pregnancy band', () => {
    expect(differs(data(), data({ visit: visit({ pregnant: true }) }))).toBe(true)
  })
  it('an SOS line and its reason and its cap', () => {
    const sos = (p: Partial<RxLine>) => data({ visit: visit({ lines: [line({ sos: true, supply: 10, sosReason: { en: 'for pain', sd: 'سور لاءِ' }, ...p })] }) })
    expect(differs(data(), sos({}))).toBe(true)
    expect(differs(sos({}), sos({ sosMax: 3 }))).toBe(true)
    expect(differs(sos({}), sos({ sosReason: { en: 'for fever', sd: 'تپ لاءِ' } }))).toBe(true)
  })
  it('which eye', () => {
    const eye = { brand: 'TOBREX', strength: '', generic: 'Tobramycin', sd: '', sdReviewed: false, unitSd: '', form: 'drop' as const, route: 'eye' as const }
    expect(differs(
      data({ visit: visit({ lines: [line({ snap: eye })] }) }),
      data({ visit: visit({ lines: [line({ snap: eye, side: 'L' })] }) }),
    )).toBe(true)
  })
  it('where the patient is being sent on, and why', () => {
    const on = { toPlace: 'Civil Hospital, Larkana', note: 'needs admission', at: Date.now() }
    const ref = data({ visit: visit({ sentOn: on }), sentTo: { en: 'Civil Hospital', sd: 'سول اسپتال' } })
    expect(differs(data(), ref)).toBe(true)
    expect(differs(ref, data({ visit: visit({ sentOn: { ...on, note: 'for an ultrasound' } }), sentTo: ref.sentTo }))).toBe(true)
  })
})

describe('the care band decides at the last moment, where both facts are together', () => {
  it('never prints PREGNANT on a man\'s slip, whatever the visit says', () => {
    const preg = visit({ pregnant: true })
    expect(renderSlip(data({ visit: preg, patientSex: 'F' }))).toContain('PREGNANT')
    expect(renderSlip(data({ visit: preg }))).toContain('PREGNANT')          // sex not recorded
    expect(renderSlip(data({ visit: preg, patientSex: 'M' }))).not.toContain('PREGNANT')
  })
  it('still prints the allergy for a man', () => {
    const out = renderSlip(data({ visit: visit({ pregnant: true }), patientSex: 'M', patientAlert: 'penicillin' }))
    expect(out).toContain('penicillin')
    expect(out).not.toContain('PREGNANT')
  })
  it('draws no band at all when there is nothing to say', () => {
    expect(renderSlip(data())).not.toContain('class="care"')
  })
})
