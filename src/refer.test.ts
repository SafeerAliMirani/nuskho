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
import { FORM_WORD, DOSE_WORD, ROUTE_WORD, TIME_WORD, pendingWords, wordOk } from './data/forms'
import { sameMolecule } from './data/who'
import type { RxLine, RxSnap, Form, Route, Drug } from './types'

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

  /**
   * Safeer read all nine on 7 Aug 2026 and confirmed them, so they print.
   *
   * This test used to assert the opposite — that the slip showed the English
   * because nobody had read the Sindhi — and it was RIGHT to, right up until a
   * person read them. Flipping the assertion is the point of the gate working,
   * not the gate being weakened: the rule below is what actually holds the
   * line, and it is unchanged.
   */
  it('prints the Sindhi for a drop now that a person has read it', () => {
    const html = slipFor('drop', 'eye')
    expect(html).toContain(DOSE_WORD.drop.sd)      // قطرا
    expect(html).toContain(ROUTE_WORD.eye.sd)      // ٻنهي اکين ۾
  })

  /**
   * THE RULE ITSELF, which no longer has a real unread word to be shown on.
   *
   * Every place that prints one of these words asks `wordOk` first, so the rule
   * is pinned where it is decided rather than through whichever word happens to
   * be unchecked this month. The day somebody adds a tenth word it takes this
   * path, and it will print its English until a person has read it.
   */
  it('says nothing in Sindhi for a word nobody has read', () => {
    expect(wordOk('form:notyet', { en: 'inhaler', sd: 'سانس', ok: false })).toBe(false)
    expect(wordOk('form:tab', { en: 'tablet', sd: 'گوري', ok: true })).toBe(true)
  })

  it('still prints the four words that were checked long ago', () => {
    expect(FORM_WORD.tab.ok).toBe(true)
    expect(FORM_WORD.cap.ok).toBe(true)
    expect(FORM_WORD.syr.ok).toBe(true)
    expect(DOSE_WORD.syr.ok).toBe(true)
    expect(slipFor('tab')).toContain('گوري')
  })

  /**
   * THE TRIPWIRE.
   *
   * As of 7 Aug 2026 every word this app can print has been read by a person
   * who speaks Sindhi, so this queue is empty and the failure message names
   * anything that has crept in since.
   *
   * A new word added to `data/forms.ts` ships `ok: false` and lands here, and
   * this test fails until somebody has read it. That failure is the feature:
   * the word still prints its English in the meantime, so nothing is broken on
   * paper, but nobody gets to forget that a suggested spelling is sitting in
   * the source waiting to be checked.
   */
  it('has no word left that a person has not read', () => {
    const waiting = pendingWords().filter(w => !w.ok)
    expect(waiting.map(w => `${w.sd} = ${w.en}`)).toEqual([])
  })

  it('shows each waiting word once, not once per place it is used', () => {
    // قطرا is both the form and the dose word for a drop. The queue asks about
    // a WORD, not about every cell that prints it.
    const sds = pendingWords().map(w => w.sd)
    expect(new Set(sds).size).toBe(sds.length)
    // and a word already read is never put back in front of anybody
    expect(sds).not.toContain(FORM_WORD.tab.sd)
    expect(sds).not.toContain(TIME_WORD.m.sd)
    expect(sds).not.toContain(DOSE_WORD.drop.sd)
    expect(sds).not.toContain(ROUTE_WORD.eye.sd)
    expect(sds).not.toContain(TIME_WORD.e.sd)
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

  /**
   * The check has to survive a formula the molecule table has never heard of,
   * because the shelf is Pakistani and the table is not. Two brands of the same
   * thing must still be caught on their spelling alone.
   */
  it('catches two brands of a formula no table knows, on the spelling alone', () => {
    const t = sameMolecule(['Acefylline + Diphenhydramine', 'acefylline+diphenhydramine'])
    expect(t.get(0)).toEqual([1])
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

/**
 * A WORD THAT IS APPROVED AND REACHES NO PAPER IS THE SAME FAULT AS A FIELD
 * PRINTED WITH NOTHING SETTING IT, ONE LAYER DOWN.
 *
 * Safeer read لڳايو (apply) on 7 Aug and it printed nowhere: a cream's dose
 * cells carried a bare tick, because `countable` is false for a cream and that
 * branch never asked for a word. The tick said "at this time of day", which
 * the column heading had already said. The word says what to DO.
 */
describe('a form that is not counted still says what to do', () => {
  const cell = (form: Form) => {
    const html = renderSlip(slip({ visit: visit({ lines: [line(form)] }) }))
    return (html.match(/<td class="tcell">(?!.*off)[\s\S]*?<\/td>/)?.[0] ?? '')
  }

  it('a cream says apply, and never a number', () => {
    const c = cell('cream')
    expect(c).toContain(DOSE_WORD.cream.sd)      // لڳايو
    expect(c).not.toMatch(/>\s*1\s*</)           // "1.5 creams" is not a thing
    expect(c).not.toContain('½')
  })

  /**
   * An inhaler, a suppository and a patch share no honest single word, so
   * DOSE_WORD.other is blank on purpose and the tick stays. Inventing a word
   * here is exactly what the gate exists to prevent.
   */
  it('an inhaler keeps the tick, because there is no honest word for it', () => {
    const c = cell('other')
    expect(c).toContain('&#10003;')
    expect(c).not.toContain('دوا')
  })
})

/**
 * THE PATH EVERY PRINTED SLIP ACTUALLY TAKES, WHICH NOTHING WAS TESTING.
 *
 * A line is frozen at print time: `freeze()` copies the medicine onto the
 * prescription so that correcting a spelling next month cannot change a paper
 * already in a patient's hand. From that moment `printed()` returns the frozen
 * copy and never looks at the medicine list again.
 *
 * `freeze()` was not copying `route` or `mlPerDose`. `printed()`'s other
 * branch, the one for a line with NO snap, supplied both. Every check in this
 * file and the whole `?forms` screenshot harness built lines with no snap, so
 * they all measured the branch nobody prints on, and they all passed.
 *
 * What was really coming out of the printer: an eye drop with the plate and
 * pill picture that means "after food", and a syrup that comes with a 2.5 ml
 * measure costed as a 5 ml one, so the chemist was sent for the wrong bottle.
 *
 * So these ask about a FROZEN line, and the last one asks the source itself,
 * because the next field added to RxSnap will be forgotten in exactly the same
 * place unless something notices.
 */
describe('a line that has already been frozen onto the paper', () => {
  const frozen = (snap: Partial<RxSnap>, drug?: Partial<Drug>): string => renderSlip(slip({
    visit: visit({ lines: [{
      drugId: 'd1', dose: { m: 1, d: 0, n: 1 }, meal: 'after', days: 5,
      snap: { brand: 'TOBREX', strength: '', generic: 'Tobramycin', sd: '',
              sdReviewed: false, unitSd: '', form: 'drop', ...snap },
    }] }),
    drugs: drug ? { d1: { id: 'd1', brand: 'TOBREX', generic: 'Tobramycin', sd: '',
                          form: 'drop', strength: '', unitSd: '', ...drug } as Drug } : {},
  }))

  it('sends a frozen eye drop to the eye, not to a plate of food', () => {
    const html = frozen({ route: 'eye' })
    expect(html).not.toContain('ماني کان پوءِ')
  })

  it('still says after food for a frozen drop that is swallowed', () => {
    expect(frozen({ route: 'mouth' })).toContain('ماني کان پوءِ')
  })

  /**
   * Every slip printed before this was fixed carries a snap with no route in
   * it. That silence is not the doctor saying "by mouth", it is a field nobody
   * wrote down, so a reprint asks the medicine. The brand, the strength and the
   * Sindhi still come from the snap alone and can never be rewritten.
   */
  it('heals an old slip that was frozen before the route was ever recorded', () => {
    const html = frozen({}, { route: 'eye' })
    expect(html).not.toContain('ماني کان پوءِ')
  })

  it('does not let the medicine list rewrite a word on an old slip', () => {
    const html = frozen({ brand: 'TOBREX', sd: '' },
                        { brand: 'RENAMED LATER', sd: 'ٽوبريڪس', sdReviewed: true })
    expect(html).toContain('TOBREX')
    expect(html).not.toContain('RENAMED LATER')
    expect(html).not.toContain('ٽوبريڪس')
  })

  it('counts a frozen syrup by ITS spoon, not by a five millilitre one', () => {
    const html = renderSlip(slip({ visit: visit({ lines: [{
      drugId: 'd1', dose: { m: 1, d: 0, n: 1 }, meal: 'after', days: 5,
      snap: { brand: 'CALPOL', strength: '', generic: 'Paracetamol', sd: '',
              sdReviewed: false, unitSd: '', form: 'syr', mlPerDose: 2.5 },
    }] }) }))
    expect(html).toContain('<b>25</b><span class="mlu">ml</span>')
    expect(html).not.toContain('<b>50</b>')
  })

  /**
   * THE ONE THAT STOPS IT HAPPENING AGAIN.
   *
   * Two places build an RxSnap: the freezing loop in Compose, and the fallback
   * inside printed() for a line that has not been frozen yet. They must build
   * the same shape. When they drift, the fallback is the one every test and
   * every screenshot exercises, so the drift is invisible until a patient is
   * holding the wrong picture. This reads both literals and compares them.
   */
  it('freezes every field that the unfrozen path supplies', async () => {
    const fs = await import('node:fs/promises')
    const keysIn = (src: string, after: string): string[] => {
      const at = src.indexOf(after)
      expect(at, `could not find ${after}`).toBeGreaterThan(-1)
      const open = src.indexOf('{', src.indexOf('snap', at) >= 0 ? src.indexOf('{', at) : at)
      let depth = 0, end = open
      for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++
        else if (src[i] === '}' && --depth === 0) { end = i; break }
      }
      return [...src.slice(open, end).matchAll(/(\w+)\s*:/g)].map(m => m[1]).sort()
    }
    const compose = await fs.readFile(new URL('./screens/Compose.tsx', import.meta.url), 'utf8')
    const render = await fs.readFile(new URL('./print/renderSlip.ts', import.meta.url), 'utf8')

    const frozenKeys = keysIn(compose, 'return l.snap ? l : {')
    const fallbackKeys = keysIn(render, 'export function printed(')

    for (const k of fallbackKeys) {
      expect(frozenKeys, `freeze() in Compose.tsx does not copy "${k}", so it never reaches paper`)
        .toContain(k)
    }
  })
})
