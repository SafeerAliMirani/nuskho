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

/* ------------------------------------------------- forms that are not pills */

import { course } from './course'
import { FORM_WORD, DOSE_WORD, ROUTE_WORD, TIME_WORD, pendingWords } from './data/forms'
import { sameMolecule, awareOf } from './data/who'
import type { RxLine, RxSnap, Form, Route } from './types'

const line = (form: Form, over: Partial<RxLine> = {}, route?: Route): RxLine => ({
  drugId: 'x', dose: { m: 1, d: 0, n: 1 }, meal: 'after', days: 5,
  snap: { brand: 'X', strength: '', generic: '', sd: '', sdReviewed: false,
          unitSd: '', form, route },
  ...over,
})

/**
 * The arithmetic the chemist reads. Getting a form wrong here is a patient
 * handed the wrong number of anything, so each shape is pinned separately
 * rather than trusting one branch to stand for the rest.
 */
describe('what the chemist is told to count out', () => {
  it('counts tablets and capsules', () => {
    expect(course(line('tab'))).toEqual({ n: 10, unit: 'tablets' })
    expect(course(line('cap'))).toEqual({ n: 10, unit: 'capsules' })
  })

  it('counts a syrup in millilitres, at 5 ml a spoon', () => {
    // one spoon morning and night, five days: 2 x 5 ml x 5
    expect(course(line('syr'))).toEqual({ n: 50, unit: 'ml' })
  })

  it('uses THIS medicine\'s spoon when it is not 5 ml', () => {
    const l = line('syr')
    l.snap!.mlPerDose = 2.5
    expect(course(l)).toEqual({ n: 25, unit: 'ml' })
  })

  it('counts sachets', () => {
    expect(course(line('sachet'))).toEqual({ n: 10, unit: 'sachets' })
  })

  /**
   * A dropper bottle holds hundreds of drops and a tube lasts as long as it
   * lasts. A number here would be a guess dressed as a fact.
   */
  it('gives no total for drops, creams or anything it does not know', () => {
    expect(course(line('drop')).n).toBe(0)
    expect(course(line('cream')).n).toBe(0)
    expect(course(line('other')).n).toBe(0)
  })

  it('never counts a half tablet as a whole one', () => {
    expect(course(line('tab', { dose: { m: 0.5, d: 0, n: 0.5 } }))).toEqual({ n: 5, unit: 'tablets' })
  })
})

describe('a slip for something that is not a pill', () => {
  const slipFor = (form: Form, route?: Route) => renderSlip(slip({
    visit: visit({ lines: [line(form, {}, route)] }),
  }))

  it('shows the site where a tablet shows the plate, and never both', () => {
    const html = slipFor('drop', 'eye')
    expect(html).toContain('mseq')
    // the plate is a fork and a plate and a spoon: none of it belongs beside an
    // eye drop, and neither does the Sindhi for "after food"
    expect(html).not.toContain('ماني کان پوءِ')
  })

  it('keeps the meal picture for a drop taken by mouth', () => {
    expect(slipFor('drop', 'mouth')).toContain('ماني کان پوءِ')
  })

  /**
   * The one that matters most. `other` used to fall through to a tablet, so an
   * inhaler printed a circle with a line through it and a patient who reads
   * only the pictures was told to swallow it.
   */
  it('prints NO pictogram and NO invented word for a form it does not know', () => {
    const html = slipFor('other')
    // دوا appears in the column heading, which is correct: the column IS
    // medicines. What must not appear is دوا as this row's FORM, standing in
    // for a word nobody has for an inhaler.
    const nameCell = html.match(/<td class="nmcell">[\s\S]*?<\/td>/)?.[0] ?? ''
    expect(nameCell).not.toContain('دوا')
    const doses = html.match(/<td class="tcell">[\s\S]*?<\/td>/g) ?? []
    expect(doses.length).toBeGreaterThan(0)
    for (const cell of doses) expect(cell).not.toContain('<svg')
  })

  /** Nothing on a medical document in a language nobody here has read. */
  it('prints the English word while the Sindhi is still unread', () => {
    const html = slipFor('drop', 'eye')
    expect(html).not.toContain(DOSE_WORD.drop.sd)
    expect(html).not.toContain(ROUTE_WORD.eye.sd)
    expect(html).toContain('drop')
    expect(html).toContain('in both eyes')
  })

  it('still prints the four words that were checked long ago', () => {
    expect(FORM_WORD.tab.ok).toBe(true)
    expect(FORM_WORD.cap.ok).toBe(true)
    expect(FORM_WORD.syr.ok).toBe(true)
    expect(DOSE_WORD.syr.ok).toBe(true)
    expect(slipFor('tab')).toContain('گوري')
  })

  it('offers every unread word for a person to read, once each', () => {
    const words = pendingWords()
    const sds = words.map(w => w.sd)
    expect(new Set(sds).size).toBe(sds.length)
    expect(sds).toContain(DOSE_WORD.drop.sd)
    expect(sds).toContain(ROUTE_WORD.eye.sd)
    // the evening is the newest word in the app and must be in the queue too,
    // or it prints without anybody having read it
    expect(sds).toContain(TIME_WORD.e.sd)
    // and nothing already checked is in the queue
    expect(sds).not.toContain(FORM_WORD.tab.sd)
    expect(sds).not.toContain(TIME_WORD.m.sd)
  })
})

/**
 * FOUR TIMES A DAY.
 *
 * The evening was the largest hole in what a Nuskho prescription could say: an
 * eye drop and most six-hourly antibiotics are QID, and until this existed the
 * doctor had to put the fourth dose in the free note, where no pictogram
 * reaches it and the patient who cannot read gets nothing at all.
 */
describe('the evening dose', () => {
  const withE = (e?: number): RxLine => ({
    drugId: 'x', dose: { m: 1, d: 1, e, n: 1 }, meal: 'after', days: 5,
  })

  it('counts toward the course, so the chemist hands over enough', () => {
    const snap = { brand: 'B', strength: '', generic: '', sd: '', form: 'tab' } as RxSnap
    // three a day for five days is fifteen; four a day is twenty
    expect(course(withE(undefined), snap).n).toBe(15)
    expect(course(withE(1), snap).n).toBe(20)
  })

  it('treats a missing evening and a zero evening as the same thing', () => {
    const snap = { brand: 'B', strength: '', generic: '', sd: '', form: 'tab' } as RxSnap
    expect(course(withE(undefined), snap).n).toBe(course(withE(0), snap).n)
  })
})

/**
 * THE SAME MOLECULE UNDER TWO BRANDS.
 *
 * PANADOL 500 and CALPOL syrup share no letters and are the same paracetamol.
 * A patient handed both takes a double dose of the commonest drug in Pakistan,
 * and the doctor who wrote them ten seconds apart under two brand names has no
 * way of seeing it. Only the formula column can catch this.
 */
describe('two brands of one molecule', () => {
  it('finds them however each was spelled', () => {
    const t = sameMolecule(['Paracetamol', 'Amoxicillin', 'paracetamol (acetaminophen)'])
    expect(t.get(0)).toEqual([2])
    expect(t.get(2)).toEqual([0])
    expect(t.has(1)).toBe(false)
  })

  it('says nothing about a prescription with no repeats', () => {
    expect(sameMolecule(['Paracetamol', 'Amoxicillin', 'Cetirizine']).size).toBe(0)
  })

  it('ignores a line with no formula rather than matching all of them together', () => {
    // three medicines nobody has typed a formula for are not "the same molecule"
    const t = sameMolecule([undefined, '', null])
    expect(t.size).toBe(0)
  })

  it('handles three of the same, naming the other two on each', () => {
    const t = sameMolecule(['Paracetamol', 'Paracetamol', 'Paracetamol'])
    expect(t.get(1)).toEqual([0, 2])
  })

  it('is the AWaRe group that stays quiet for Access, which is nearly everything', () => {
    expect(awareOf('Amoxicillin')).toBe('Access')
    expect(awareOf('Paracetamol')).toBeUndefined()
  })
})

/**
 * THE THREE FIELDS THAT PRINTED WITH NOTHING BEHIND THEM.
 *
 * These check the RENDERER rather than the screen, because the print holder is
 * emptied as soon as the browser's print dialog closes: a browser drive that
 * looks for the sheet afterwards is racing an empty node. The renderer is a
 * pure function of the visit, so it can simply be asked.
 */
describe('what the slip prints once somebody can set it', () => {
  const base = (over: Partial<Visit> = {}): SlipData => ({
    visit: { id: 'v', patientId: 'p', createdAt: 0, lines: [], tests: [], advice: [],
             ...over } as Visit,
    patientName: 'Test Case', patientAge: '42', patientCode: '00026',
    drugs: {}, rxId: 'AAAAAA',
  } as SlipData)

  it('prints when to come back, and nothing at all when there is no answer', () => {
    expect(renderSlip(base({ nextVisit: 'in 5 days' }))).toContain('in 5 days')
    expect(renderSlip(base({ nextVisit: 'in 5 days' }))).toContain('Next visit')
    // an empty line must print NOTHING, not an empty heading with a colon
    expect(renderSlip(base())).not.toContain('Next visit')
  })

  it('prints man or woman beside the age, and only when it was asked', () => {
    // read the AGE CELL out of the sheet rather than searching the whole
    // document: a slash and an F occur all over an HTML page, and a check that
    // passes on those is a check that passes on nothing
    const ageCell = (html: string) => html.match(/<div class="v">42([\s\S]{0,140}?)<\/div>/)?.[1] ?? ''
    expect(ageCell(renderSlip({ ...base(), patientSex: 'F' } as SlipData))).toContain('F')
    expect(ageCell(renderSlip(base()))).not.toContain('F')
    // and the cell really was found, or both assertions above are vacuous
    expect(renderSlip(base())).toContain('<div class="v">42')
  })

  /**
   * A closing note is the desk's own record and must never be on the patient's
   * paper. "Left without being seen, drunk" is a thing somebody might type at
   * eleven at night, and the slip is a document the patient carries and shows
   * to other doctors.
   */
  it('never prints the note somebody typed when closing the token', () => {
    const html = renderSlip(base({ closeNote: 'sent to Chandka, chest pain', status: 'referred' }))
    expect(html).not.toContain('Chandka')
  })
})
