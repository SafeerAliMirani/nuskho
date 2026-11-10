import { describe, it, expect } from 'vitest'
import { renderSlip, type SlipData } from './print/renderSlip'
import { layoutKey } from './print/paginate'
import type { Visit, RxLine } from './types'

/**
 * THE FITTER'S CACHE KEY MUST NOTICE EVERY FIELD THE PRINTER DRAWS.
 *
 * AND THIS FILE SPENT MONTHS NOT CHECKING THAT. Its header used to say
 * layoutKey was unexported and that comparing rendered output was "the same
 * thing the key exists to detect". Both were wrong. layoutKey IS exported —
 * dx.test.ts already imported it — and renderSlip does not import the fitter
 * at all, so nothing here could observe the key. `layoutKey` could have been
 * `return JSON.stringify([])` and every test below would still have passed,
 * while the cache handed a stale sheet plan to a slip that had grown a line:
 * `.page` is overflow:hidden, so the bottom of it simply would not be on the
 * paper. The file named after the key never called it. (Found 10 Nov.)
 *
 * `differs` now requires BOTH: the field must change the rendered sheet AND
 * the key. A printed field left out of the key fails here, which is what the
 * header always claimed.
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

const differs = (a: SlipData, b: SlipData) =>
  renderSlip(a) !== renderSlip(b) && layoutKey(a) !== layoutKey(b)

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
  /**
   * A1 of the Gemini audit, and the only string from it that reaches paper.
   * Approved by Safeer on 29 October, so it prints bilingually: the English
   * for the chemist and whoever reads it in the corridor, the Sindhi for the
   * family holding the sheet. The English stays first and stays in the
   * heaviest type on the page; the Sindhi is beside it, not instead of it.
   */
  it('prints PREGNANT with its approved Sindhi beside it', () => {
    const out = renderSlip(data({ visit: visit({ pregnant: true }), patientSex: 'F' }))
    expect(out).toContain('PREGNANT')
    expect(out).toContain('حمل')
    // and never the Sindhi alone, on the one band a man in a hurry reads first
    expect(out).toMatch(/PREGNANT[^<]*<span class="sd">\(حمل\)<\/span>/)
  })
  it('keeps the Sindhi off a man\'s slip too, since the whole band is withheld', () => {
    expect(renderSlip(data({ visit: visit({ pregnant: true }), patientSex: 'M' }))).not.toContain('حمل')
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
