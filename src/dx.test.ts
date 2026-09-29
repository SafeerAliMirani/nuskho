import { describe, it, expect } from 'vitest'
import type { Visit } from './types'
import { dxList, dxText, cleanDx, dxPatch, toggleDx, hasDx, dxSd, aliasOf, REVIEWED, MAX_DX } from './dx'
import { diagnosisSd, SPECIALTIES } from './data/specialty'
import { renderSlip } from './print/renderSlip'
import { layoutKey } from './print/paginate'

const v = (over: Partial<Visit> = {}): Visit => ({
  id: 'v1', patientId: 'p1', token: 1, status: 'waiting', createdAt: 1,
  lines: [], tests: [], advice: [], ...over,
})

describe('reading a diagnosis, old visits included', () => {
  it('a visit from before this existed still reads its one diagnosis', () => {
    expect(dxList(v({ diagnosis: 'Fever' }))).toEqual(['Fever'])
    expect(dxText(v({ diagnosis: 'Fever' }))).toBe('Fever')
  })

  it('the new field wins outright when it is there', () => {
    // they can never both be set by this app, but a hand-edited backup could
    expect(dxList(v({ diagnosis: 'Fever', diagnoses: ['Anaemia'] }))).toEqual(['Anaemia'])
  })

  it('no diagnosis at all is an empty list, not a blank string', () => {
    expect(dxList(v())).toEqual([])
    expect(dxList(v({ diagnosis: '   ' }))).toEqual([])
    expect(dxText(v())).toBe('')
  })
})

describe('what may be stored', () => {
  it('trims, collapses space and drops blanks', () => {
    expect(cleanDx(['  Fever ', '', '   ', 'Body   ache'])).toEqual(['Fever', 'Body ache'])
  })

  it('the same diagnosis twice, in any casing, is one', () => {
    expect(cleanDx(['Fever', 'fever', 'FEVER'])).toEqual(['Fever'])
  })

  it('keeps the order the doctor picked: the first is what he is treating', () => {
    expect(cleanDx(['Chest infection', 'Diabetes'])).toEqual(['Chest infection', 'Diabetes'])
  })

  it('caps at four, because a slip is paper and five is a list', () => {
    expect(cleanDx(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual(['a', 'b', 'c', 'd'])
    expect(MAX_DX).toBe(4)
  })

  it('storing a set always clears the old single field', () => {
    expect(dxPatch(['Fever'])).toEqual({ diagnoses: ['Fever'], diagnosis: undefined })
    // and an empty set stores nothing rather than an empty array
    expect(dxPatch([])).toEqual({ diagnoses: undefined, diagnosis: undefined })
  })

  it('toggling adds, toggling again takes off, and the fifth is refused', () => {
    const one = v({ diagnoses: ['Fever'] })
    expect(toggleDx(one, 'Anaemia')).toEqual(['Fever', 'Anaemia'])
    expect(toggleDx(one, 'Fever')).toEqual([])
    expect(toggleDx(one, 'fever')).toEqual([])          // case does not matter
    expect(hasDx(one, 'FEVER')).toBe(true)
    const full = v({ diagnoses: ['a', 'b', 'c', 'd'] })
    expect(toggleDx(full, 'e')).toBe(null)              // said, never swallowed
    expect(toggleDx(full, 'b')).toEqual(['a', 'c', 'd'])  // taking one off still works
  })

  it('an old single-diagnosis visit can be added to without losing it', () => {
    expect(toggleDx(v({ diagnosis: 'Fever' }), 'Anaemia')).toEqual(['Fever', 'Anaemia'])
  })
})

describe('THE SINDHI GATE: only what a person has read reaches paper', () => {
  it('a reviewed diagnosis has Safeer’s own words', () => {
    expect(dxSd('Fever')).toBe('تپ (بخار)')
    expect(dxSd('  Fever  ')).toBe('تپ (بخار)')
  })

  it('an unreviewed one answers nothing, even though the app knows a word for it', () => {
    // specialty.ts carries a Sindhi word for all 114 it seeds. None of them
    // may print on that basis. 'Scabies' is in the file and not in REVIEWED.
    expect(diagnosisSd('Scabies')).not.toBe('')
    expect(dxSd('Scabies')).toBe('')
  })

  it('never falls back to the unreviewed word, and never guesses', () => {
    const seeded = new Set<string>()
    for (const sp of SPECIALTIES) for (const [en] of sp.dx) seeded.add(en)
    // an alias is a reviewed decision about two names for one condition, so
    // it is allowed to print; everything else the file seeds must stay silent
    const unreviewed = [...seeded].filter(en => !(en in REVIEWED) && !aliasOf(en))
    expect(unreviewed.length).toBeGreaterThan(50)        // most of them
    for (const en of unreviewed) expect(dxSd(en)).toBe('')
  })

  it('a confirmed alias prints the reviewed words, not the file\u2019s own', () => {
    // Safeer confirmed on 29 Sep 2026 that these are the same conditions.
    expect(dxSd('Urine infection')).toBe(REVIEWED['Urinary tract infection'])
    expect(dxSd('Worms')).toBe(REVIEWED['Worm infestation'])
    // and NOT the unreviewed word specialty.ts carries for them
    expect(dxSd('Urine infection')).not.toBe(diagnosisSd('Urine infection'))
    expect(dxSd('Worms')).not.toBe(diagnosisSd('Worms'))
  })

  it('every alias points at something actually reviewed', () => {
    // an alias to a key nobody reviewed would print nothing while looking
    // like it had been settled
    const seeded = new Set<string>()
    for (const sp of SPECIALTIES) for (const [en] of sp.dx) seeded.add(en)
    for (const en of seeded) {
      const to = aliasOf(en)
      if (to) expect(REVIEWED[to], `alias ${en} -> ${to}`).toBeTruthy()
    }
  })

  it('a diagnosis the doctor typed himself prints English alone', () => {
    expect(dxSd('Threatened preterm labour')).toBe('')
  })
})

describe('what actually lands on the sheet', () => {
  const slip = (over: Partial<Visit>) => renderSlip({
    visit: v(over), patientName: 'Wazir Ali', patientCode: '00018',
    drugs: {}, rxId: 'abcdef',
  })

  it('prints every diagnosis, not only the first', () => {
    const html = slip({ diagnoses: ['Anaemia', 'Urinary tract infection'] })
    expect(html).toContain('Anaemia')
    expect(html).toContain('Urinary tract infection')
    expect(html).toContain('Diagnoses')        // plural heading
  })

  it('says Diagnosis, singular, when there is one', () => {
    const html = slip({ diagnoses: ['Fever'] })
    expect(html).toContain('>Diagnosis ')
    expect(html).not.toContain('>Diagnoses ')
  })

  it('prints the reviewed Sindhi beside it, and no Sindhi for an unreviewed one', () => {
    expect(slip({ diagnoses: ['Fever'] })).toContain('تپ (بخار)')
    const un = slip({ diagnoses: ['Scabies'] })
    expect(un).toContain('Scabies')
    expect(un).not.toContain(diagnosisSd('Scabies'))
  })

  it('an aliased chip prints its reviewed Sindhi on the paper', () => {
    const html = slip({ diagnoses: ['Urine infection'] })
    expect(html).toContain('Urine infection')                      // his own label
    expect(html).toContain(REVIEWED['Urinary tract infection'])     // his reviewed words
  })

  it('a visit from before this existed still prints its diagnosis', () => {
    expect(slip({ diagnosis: 'Fever' })).toContain('Fever')
  })

  it('no diagnosis prints no diagnosis box', () => {
    expect(slip({})).not.toContain('تشخيص')
  })
})

describe('the fitter watches it, which is the batch 26 rule', () => {
  const d = (over: Partial<Visit>) => ({
    visit: v(over), patientName: 'Wazir Ali', patientCode: '00018',
    drugs: {}, rxId: 'abcdef',
  })

  it('one diagnosis and three are not the same sheet plan', () => {
    // three lines in the box is taller than one, and a stale plan would put
    // the bottom of the slip off the paper with nothing visible on screen
    expect(layoutKey(d({ diagnoses: ['Fever'] })))
      .not.toBe(layoutKey(d({ diagnoses: ['Fever', 'Anaemia', 'Diabetes'] })))
  })

  it('the old field is still watched, for every visit already in a clinic', () => {
    expect(layoutKey(d({ diagnosis: 'Fever' }))).not.toBe(layoutKey(d({ diagnosis: 'Anaemia' })))
  })

  it('a reviewed diagnosis and an unreviewed one of the same length differ', () => {
    // one draws a Sindhi word on the line and the other does not
    expect(layoutKey(d({ diagnoses: ['Fever'] }))).not.toBe(layoutKey(d({ diagnoses: ['Cough'] })))
  })
})
