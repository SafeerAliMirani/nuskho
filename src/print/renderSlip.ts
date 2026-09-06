// The printed page. Framework-free on purpose.
//
// This module takes data and returns an HTML string. React never touches it, no
// bundler transform rewrites its CSS, and nothing in the app can change a
// millimetre of it by accident. The markup below matches src/print/slip.css
// exactly — that pair is the only part of this project verified against a ruler
// on real paper, and a bug here means a patient takes the wrong dose.
//
// If you change a class name here, change it in slip.css in the same commit,
// then print the result and measure it.

import { profile, APP } from '../profile'
import { paper, pageVars } from '../paper'
import type { Drug, Visit, RxLine, RxSnap, Form, Route } from '../types'
import { SUNRISE, SUN, SUNSET, MOON, TAB, HALF, CAP, SPOON, PLATE, CAL, DROP,
  INHALER, SUPP, PATCH,
         EYE, EAR, NOSE, TUBE, SACHET, adviceIcon } from './icons'
import { qrSvgSafe } from './qr'
import { course, courseUnitSd } from '../course'
import { SOS_PREFIX, sosMaxLine } from '../data/sos'
import { formSdFor, formEnFor, doseSdFor, doseEnFor1, routeSdFor, routeEnFor, countable,
         swallowed, sideMatters, sideSdFor, sideEnFor, timeSdFor, type TimeKey } from '../data/forms'
import { filled } from '../data/vitals'

// Tolerates undefined on purpose: a medicine the doctor typed himself has no
// generic name and often no strength. Crashing here would mean the PRINT button
// silently does nothing, which is the worst failure this app can have.
const esc = (s: unknown) =>
  (s == null ? '' : String(s))
    .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

const MEAL_SD: Record<RxLine['meal'], string> = {
  after: 'ماني کان پوءِ',
  before: 'ماني کان اڳ',
  any: '',
}

/**
 * The picture for one dose of this form.
 *
 * The rule that built this list: a missing picture is a gap the doctor fills
 * in his own handwriting, and a wrong picture is a patient swallowing the
 * wrong thing. So every form fell through to TAB once, which meant an inhaler,
 * a suppository and a pessary all printed a tablet; then they all fell through
 * to null, which was honest and printed nothing at all.
 *
 * Nothing at all was never meant to be the end of it. An inhaler is the
 * commonest of these in a Pakistani clinic and it is the one medicine on the
 * slip a patient has to be TAUGHT to use, so a blank cell beside it was the
 * worst blank on the page. Three of them have their own picture now.
 *
 * `other` still returns null, and still should. It is the pessary, the
 * nebuliser solution, the mouthwash and the thing nobody here has thought of,
 * and there is no one picture for those.
 */
const formIcon = (f: Form): ((w: string, h: string) => string) | null =>
  f === 'cap' ? CAP
  : f === 'syr' ? SPOON
  : f === 'drop' ? DROP
  : f === 'cream' ? TUBE
  : f === 'sachet' ? SACHET
  // The three that used to fall through to null and print a bare tick. `other`
  // still does, and still should: it is now the pessary and the nebuliser
  // solution, and there is no one picture for those.
  : f === 'inhaler' ? INHALER
  : f === 'supp' ? SUPP
  : f === 'patch' ? PATCH
  : f === 'tab' ? TAB
  : null

/** The picture for the site, where the meal picture would say nothing. */
const siteIcon = (r: Route): ((w: string, h: string) => string) | null =>
  // Nothing for the skin: a cream already carries its tube in all three dose
  // cells, and printing a fourth tube in this one says nothing new. Nothing
  // for `inhale` either, for the same reason: the inhaler is already drawn
  // three times across the row.
  //
  // And nothing for `rectal` or `vaginal`, which is a decision and not a gap.
  // Those two carry their warning in words, in both scripts, and the words say
  // NOT BY MOUTH. See ROUTE_WORD in data/forms.ts.
  r === 'eye' ? EYE : r === 'ear' ? EAR : r === 'nose' ? NOSE : null

/** One dose cell: the pictogram, then the number under it. */
function doseCell(m: RxSnap, n: number, sz: string): string {
  if (!n) return '<td class="tcell off">&mdash;</td>'

  const ic = formIcon(m.form)

  /**
   * A CREAM AND AN "OTHER" ARE NOT COUNTED, AND MUST NOT LOOK COUNTED.
   *
   * "1.5 creams" is not a thing anybody says, and half a circle beside an
   * ointment is a picture of a tablet cut in two. These cells carry the
   * pictogram and nothing that looks like a quantity.
   *
   * WHAT THEY CARRY INSTEAD IS THE INSTRUCTION. A bare tick means "at this
   * time of day", which the column heading already said; لڳايو means APPLY,
   * which is the thing the patient actually has to do and is not a quantity.
   * That word sat approved in data/forms.ts with no route to paper until this
   * was written, which is the same fault as a field printed with nothing
   * setting it, one layer down.
   *
   * An `other` keeps the bare tick, because DOSE_WORD.other is deliberately
   * blank: there is no honest single word for a pessary and a nebuliser
   * solution at once, and inventing one is what the whole gate exists to
   * prevent. The inhaler, the suppository and the patch have left this branch
   * entirely: all three are counted, and all three now say what they are.
   */
  if (!countable(m.form)) {
    const word = doseUnitSd(m)
    const en = word ? '' : doseEnFor1(m.form, n)
    const say = word ? `<span class="sd">${esc(word)}</span>`
      : en ? `<span class="mlen">${esc(en)}</span>`
      : '&#10003;'
    return `<td class="tcell"><div class="dz">${ic ? ic(sz, sz) : ''}<div class="dose">${say}</div></div></td>`
  }

  /**
   * COUNTED IN THE NUMBER, DRAWN ONCE.
   *
   * Syrup counts in spoons and drops count in drops. This cell used to print
   * "1 چمچو" whatever the doctor had chosen, so a child prescribed two spoons
   * at night was sent home with a slip that said one. The dose is the one
   * number on this page that has to be the number he actually tapped.
   *
   * The inhaler joins them, for a reason of its own: two puffs come out of ONE
   * device. Repeating the picture the way tablets repeat would put two inhalers
   * in the cell, which reads as "use two inhalers" to exactly the person who
   * cannot read the word beside it. A drop was already here for the same
   * reason, so only the syrup repeats its picture.
   */
  if (m.form === 'syr' || m.form === 'drop' || m.form === 'inhaler') {
    const many = n === 0.5 ? '½' : String(Math.round(n))
    const reps = m.form === 'syr' ? Math.min(Math.max(Math.round(n), 1), 3) : 1
    const pics = Array.from({ length: reps }, () => (ic ? ic(sz, sz) : '')).join('')
    const word = doseUnitSd(m)
    return `<td class="tcell"><div class="dz">${pics}<div class="dose">`
      + (word ? `<span class="sd">${many} ${esc(word)}</span>`
         : `${many} <span class="mlen">${esc(doseEnFor1(m.form, n))}</span>`)
      + '</div></div></td>'
  }

  if (n === 0.5)
    return `<td class="tcell"><div class="dz">${HALF(sz, sz)}<div class="dose">½</div></div></td>`
  const pics = Array.from({ length: Math.min(Math.round(n), 3) }, () => (ic ? ic(sz, sz) : '')).join('')
  return `<td class="tcell"><div class="dz">${pics}<div class="dose">${Math.round(n)}</div></div></td>`
}

/**
 * Meal timing as one scene, never an arrow sequence the reader must decode.
 *
 * For anything that does not go in the mouth this cell carries the SITE
 * instead. An eye drop taken after food is a sentence with no meaning in it,
 * and a plate beside an eye drop is a picture of the wrong thing entirely.
 */
function mealIcon(meal: RxLine['meal'], compact: boolean, m: RxSnap, side?: 'R' | 'L'): string {
  const offMouth = !!m.route && m.route !== 'mouth'
  const site = offMouth ? siteIcon(m.route!) : null
  // A site with no picture of its own still must not show a plate: "after food"
  // is as meaningless on a cream as it is on an eye drop.
  if (offMouth && !site) return '<span class="mseq">&mdash;</span>'
  /**
   * AND THE FORM ALONE IS ENOUGH TO REFUSE IT.
   *
   * The route was doing this work by itself, so a suppository, a patch or an
   * inhaler with no route on the line printed the plate and pill scene, which
   * says swallow this after eating. Every medicine the doctor types in himself
   * arrives with no route, so this was the common case rather than the rare
   * one, and it was worst on the form that must never be swallowed at all.
   */
  if (!swallowed(m.form)) return '<span class="mseq">&mdash;</span>'
  if (site) {
    /**
     * ONE EYE FOR ONE EYE, TWO FOR BOTH.
     *
     * The half of "which side" a patient who reads nothing can still act on.
     * Left against right needs the word and the doctor's finger, but one
     * against two is a picture, and it is the half that stops a steroid going
     * into a healthy eye for a week. The pair is drawn smaller so the cell
     * does not grow, the same trick the plate and pill scene already uses.
     */
    const both = sideMatters(m.route) && !side
    const k = both ? (compact ? 0.6 : 0.74) : (compact ? 0.72 : 0.92)
    const one = site(`${6.8 * k}mm`, `${6.8 * k}mm`)
    return `<span class="mseq">${both ? one + one : one}</span>`
  }
  if (meal === 'any') return '<span class="mseq">&mdash;</span>'
  const k = compact ? 0.58 : 0.74
  const plate = PLATE(`${6.8 * k}mm`, `${6.8 * k}mm`)
  const pill = TAB(`${5.8 * k}mm`, `${5.8 * k}mm`)
  const seq = meal === 'before' ? [pill, plate] : [plate, pill]
  return `<span class="mseq">${seq.join('')}</span>`
}

/**
 * What to print for this line. Once a prescription has been printed it carries
 * its own copy, and that copy wins for ever: correcting a spelling in the
 * medicine list must never change a slip already in a patient's hand.
 *
 * THE ONE EXCEPTION, AND WHY IT IS NOT A HOLE IN THAT RULE.
 *
 * Every slip frozen before August 2026 carries no `route` and no `mlPerDose`,
 * because the freezing loop forgot to copy them. A missing route there does not
 * mean "the doctor said by mouth". It means nobody wrote the field down. So for
 * those two fields only, and only when the snap is silent, the medicine is
 * asked. Otherwise a reprint of an eye drop from last March comes out with the
 * plate and pill picture that means "after food", which is not what that paper
 * said and not what the patient was told.
 *
 * Everything a person reads on the slip, the brand, the strength, the Sindhi,
 * the unit, still comes from the snap alone and can never be rewritten.
 */
export function printed(line: RxLine, drug?: Drug): RxSnap {
  if (line.snap) {
    if (!drug) return line.snap
    return {
      ...line.snap,
      route: line.snap.route ?? drug.route,
      mlPerDose: line.snap.mlPerDose ?? drug.mlPerDose,
    }
  }
  return {
    brand: drug?.brand ?? '', strength: drug?.strength ?? '', generic: drug?.generic ?? '',
    sd: drug?.sd ?? '', sdReviewed: drug?.sdReviewed, unitSd: drug?.unitSd ?? '',
    form: drug?.form ?? 'tab', route: drug?.route, mlPerDose: drug?.mlPerDose,
  }
}

/**
 * TWO DIFFERENT WORDS, AND THEY WERE THE SAME FIELD.
 *
 * A medicine has a FORM — what is in the bottle or the box — and a DOSE UNIT —
 * what the patient picks up and swallows. For a tablet those are one word:
 * گوري is both the thing and the amount. For a capsule likewise. For a syrup
 * they are not, and the slip was printing the wrong one of the two:
 *
 *     CALPOL syrup            ڪالپول — چمچو      "Calpol — spoon"
 *
 * A bottle of Calpol is not a spoon. It is سيرپ. What you take out of it, once
 * in the morning and once at night, is a چمچو. So the name line takes the form
 * and the dose columns keep the unit, and the two stop being one string.
 *
 * Why it went unnoticed: the field was called unitSd, it was correct for the
 * two forms that make up most of a prescription, and the one form it was wrong
 * for is the one children get.
 */
/** What the bottle or the box is. Printed after the Sindhi brand name, and
 *  only once a person has read the word: see data/forms.ts. */
const formSd = (m: RxSnap) => formSdFor(m.form)

/** The same word in English, for the line that carries no approved Sindhi. */
const formEn = (m: RxSnap) => formEnFor(m.form)

/** What the patient picks up. Printed in the morning, midday and night columns.
 *  Falls back to the form's own word when a drug was saved before this split
 *  existed, and to nothing at all while the Sindhi is unread. */
const doseUnitSd = (m: RxSnap) => (doseSdFor(m.form) ? (m.unitSd || doseSdFor(m.form)) : '')

/**
 * The second line of the name cell: the Sindhi brand, then what is in the box.
 *
 * Both halves are conditional and for the same reason. A Sindhi brand prints
 * only once a person has read it (`sdReviewed`), and the form word prints only
 * once a person has read THAT (data/forms.ts). When the form word has not been
 * read the English one takes its place, in the Latin face, so the line still
 * says what the box is instead of saying nothing.
 */
function nameSdLine(m: RxSnap): string {
  const brand = m.sd && m.sdReviewed === true ? esc(m.sd) : ''
  const sdWord = formSd(m)
  if (sdWord) {
    return `<div class="sd nmsd">${brand ? brand + ' — ' : ''}${esc(sdWord)}</div>`
  }
  const enWord = formEn(m)
  if (!brand && !enWord) return ''
  if (!brand) return `<div class="nmsd nmen-form">${esc(enWord)}</div>`
  return `<div class="sd nmsd">${brand}${enWord ? ` <span class="nmen-form">— ${esc(enWord)}</span>` : ''}</div>`
}

/**
 * WHAT GOES UNDER THAT CELL, and it has to obey the same rule as the picture.
 *
 * The picture and the words were decided separately, so a suppository with no
 * route on the line drew no plate and then wrote "ماني کان پوءِ" underneath it
 * anyway. The words are the half a compounder reads aloud, so that was the
 * more dangerous half to get wrong.
 */
function mealLabel(m: RxSnap, meal: RxLine['meal'], side?: 'R' | 'L'): string {
  const site = siteLabel(m, side)
  if (site) return site
  if (!swallowed(m.form)) return ''
  return MEAL_SD[meal]
}

/**
 * The words under the site picture, in whichever script has been approved.
 *
 * `side` overrides the route's own word entirely rather than sitting beside
 * it, because "in both eyes, in the right eye" on one line is worse than
 * either sentence on its own.
 */
function siteLabel(m: RxSnap, side?: 'R' | 'L'): string | null {
  if (!m.route || m.route === 'mouth') return null
  if (side && sideMatters(m.route)) {
    const s = sideSdFor(m.route, side)
    return s ? esc(s) : `<span class="mlen">${esc(sideEnFor(m.route, side))}</span>`
  }
  const sd = routeSdFor(m.route)
  return sd ? esc(sd) : `<span class="mlen">${esc(routeEnFor(m.route))}</span>`
}

/**
  * `evening` is decided ONCE for the whole prescription, not per sheet and not
  * per row. A slip whose first sheet has three dose columns and whose second
  * has four is a slip that looks broken, and a row that quietly drops a column
  * the heading promised is worse than that.
  */
function row(i: number, line: RxLine, m: RxSnap, compact: boolean, evening: boolean): string {
  // A4 has the room, and a bigger pictogram is the whole slip for a patient who
  // reads neither language.
  const big = paper().size === 'A4'
  const sz = compact ? (big ? '7mm' : '5.6mm') : (big ? '9mm' : '7mm')

  /**
   * THE TOTAL, FOR THE MAN WHO WILL COUNT THEM OUT.
   *
   * Most of these slips are taken to a shop that has never heard of Nuskho and
   * never will. The chemist there gets one thing from this project: this piece
   * of paper. Until now it told him one in the morning, one at night, for five
   * days, and left him to arrive at ten. He does that arithmetic all day and
   * he is usually right, which is exactly what makes the occasional slip a
   * problem nobody catches.
   *
   * So the number he actually needs is printed. Same function the pharmacy
   * counter ticks against, so the paper and the screen cannot drift apart.
   * Blank for a syrup, on purpose: see course.ts.
   *
   * WHERE IT GOES WAS MEASURED, NOT CHOSEN, AND THIS NOTE WAS OUT OF DATE.
   * It said the box sits on the line carrying the Sindhi medicine name. It does
   * not, and has not since the row of empty tick boxes that shared the day
   * column was deleted: it is the second line of the DAY COUNT cell, which is
   * what the markup below builds and what slip.css has always described.
   * That cell is the right home for it because the column already answers "how
   * much altogether", and it costs no row height, because the dose pictogram
   * beside it is taller than a day count and a total put together. Re-measured
   * after the row was rebuilt, on A5 with twelve medicines: the cell holds
   * 7.8mm of type with the total and 4.9mm without, and the row is 9.1mm
   * either way. The total is still free.
   */
  const c = course(line, m)
  const unit = courseUnitSd(line, m)
  const total = c.n > 0
    ? `<div class="tot"><b>${c.n}</b>`
      + (unit === 'ml' ? '<span class="mlu">ml</span>'
         : unit ? `<span class="sd">${esc(unit)}</span>`
         : `<span class="mlu">${esc(c.unit)}</span>`)
      + '</div>'
    : ''

  /**
   * THE EMPTY BOXES ARE GONE, AND THIS IS WHY.
   *
   * A row of small unlabelled squares used to print under the day count on any
   * line with no total. Safeer looked at a rendered sheet and asked what they
   * meant, and then answered it himself: to my eye they mean nothing. He is
   * the person who commissioned this design and he reads both scripts. A
   * patient holding it in a bazaar had no chance.
   *
   * They were presumably a tick-one-box-a-day idea, and if so they were fitted
   * exactly backwards. They appeared only where `course()` gives NO total,
   * which is drops, creams and inhalers, the medicines where counting the days
   * off matters least. They never appeared on the antibiotics, where finishing
   * the course is the whole message, because those have a total. And they were
   * suppressed entirely in dense spacing, so the same medicine looked
   * different on two sheets of the same paper.
   *
   * Every other mark on this sheet carries a written argument for being there.
   * This one carried none, in a stylesheet where nothing else is unexplained,
   * which was the tell. On a printed medical document an element nobody can
   * read is not neutral: it teaches the reader that some of the marks on this
   * page can be ignored, and the next mark he ignores may be the dose.
   *
   * If a course tracker is ever wanted it belongs on the rows that HAVE a
   * total, with a word above it saying what to do, and it has to be measured
   * for the height it costs first.
   */
  // SOS / "when needed": no schedule cells and no day count. The reason spans the
  // dose and food columns (colspan keeps the fixed table grid intact), and the
  // count cell carries the supply the pharmacy hands over.
  /**
   * THE DOCTOR'S OWN LINE UNDER A MEDICINE.
   *
   * The phone offered a per-line note for months and the printer never drew
   * it: a doctor typed "dissolve in half a glass of water" and the patient
   * got a row with nothing under the name. It is his own words in his own
   * script, so it prints as he typed it, under the generic, in the name cell,
   * where the fitter measures it like any other line.
   */
  const noteLine = line.note ? `<div class="rxnote">${esc(line.note)}</div>` : ''
  if (line.sos) {
    const cols = evening ? 5 : 4
    const r = line.sosReason
    const reason = r ? (r.sd || r.en) : ''
    const maxLine = line.sosMax ? `<div class="sd sosmax">${esc(sosMaxLine(line.sosMax))}</div>` : ''
    return `<tr>
      <td class="noc">${i}</td>
      <td class="nmcell"><div class="nmg">
        <div class="brand">${esc(m.brand)} ${esc(m.strength)}</div>
        <div class="gen">${esc(m.generic)}</div>
        ${nameSdLine(m)}${noteLine}
      </div></td>
      <td class="soscell" colspan="${cols}"><div class="sosw sd" dir="rtl">${esc(SOS_PREFIX)}، <bdi>${esc(reason)}</bdi></div>${maxLine}</td>
      <td class="dycell">${total}</td>
    </tr>`
  }

  const ticks = ''

  /**
   * IN DENSE SPACING THE WORD "DAYS" GIVES UP ITS LINE TO THE COUNT.
   *
   * ڏينهن is printed in this column's heading already, so repeating it on
   * every row of a twelve medicine slip buys nothing and costs a line in the
   * one layout that has no lines to spare. Measured: without this, twelve
   * medicines on A4 went from one sheet to two the moment the count appeared.
   * Comfortable spacing keeps the word, because there it is free.
   */
  /**
   * THE WORD "DAYS" GIVES ITS LINE TO THE COUNT, ON EVERY ROW THAT HAS ONE.
   *
   * ڏينهن is printed in this column's heading, beside a calendar, so repeating
   * it under every single row buys nothing and costs the one line this cell
   * does not have to spare. Measured: keeping both pushed six medicines on A5
   * from one sheet onto two.
   *
   * A row with no countable total — a cream, an inhaler — keeps the word, so
   * the cell is never just a bare number with nothing to say what it is.
   */
  const dysd = c.n > 0 ? '' : '<div class="sd dysd">ڏينهن</div>'
  return `<tr>
      <td class="noc">${i}</td>
      <td class="nmcell"><div class="nmg">
        <div class="brand">${esc(m.brand)} ${esc(m.strength)}</div>
        <div class="gen">${esc(m.generic)}</div>
        ${nameSdLine(m)}${noteLine}
      </div></td>
      ${doseCell(m, line.dose.m, sz)}${doseCell(m, line.dose.d, sz)}${
        evening ? doseCell(m, line.dose.e ?? 0, sz) : ''}${doseCell(m, line.dose.n, sz)}
      <td class="mlcell">${mealIcon(line.meal, compact, m, line.side)}<div class="sd mlsd">${mealLabel(m, line.meal, line.side)}</div></td>
      <td class="dycell"><div class="dyn">${line.days}</div>
        ${dysd}${ticks}${total}</td>
    </tr>`
}

/**
 * A heading keeps its second line even when the word on it is not ready.
 *
 * The Sindhi for a time of day only prints once a person has read it, so an
 * unreviewed one leaves the span empty, the cell loses a line, and its
 * pictogram floats a millimetre higher than the three beside it. On a green
 * heading bar that reads as a mistake rather than as a word still being
 * checked. A non-breaking space holds the line, so the row is the same shape
 * before and after the word is ticked, and the English is in the legend where
 * it always was.
 */
const timeHead = (t: TimeKey): string =>
  `<span class="sd">${timeSdFor(t) || '&nbsp;'}</span>`

/**
  * The legend never explains a column that is not on the sheet. A picture of a
  * setting sun under a table with no evening in it is a reader being told to
  * look for something that is not there.
  */
const legendFor = (evening: boolean): [(w: string, h: string) => string, string, string][] => [
  [SUNRISE, 'MORNING', timeSdFor('m')],
  [SUN, 'MIDDAY', timeSdFor('d')],
  ...(evening ? [[SUNSET, 'EVENING', timeSdFor('e')] as [(w: string, h: string) => string, string, string]] : []),
  [MOON, 'NIGHT', timeSdFor('n')],
  [TAB, '1 TABLET', 'هڪ گوري'],
  [HALF, 'HALF', 'اڌ گوري'],
  [SPOON, '1 SPOON', 'هڪ چمچو'],
]

export interface SlipData {
  visit: Visit
  patientName: string
  patientAge?: string
  patientSex?: string
  /** printed large — the slip is the patient's card, so this is how we know them next time */
  patientCode: string
  drugs: Record<string, Drug>
  rxId: string
  /**
   * Whose name heads this prescription, in a building with several doctors.
   * The visit knows its room, so the caller passes that room's doctor and the
   * heading stops assuming the profile. Absent = solo, profile as always.
   * The address, timing and logo stay the building's.
   */
  doctor?: { nameEn: string; nameSd: string; degreesEn: string; degreesSd: string; reg: string }
  /**
   * Where the doctor is sending this patient on, already resolved to words.
   *
   * Resolved by the CALLER, exactly like `doctor` above, so this module keeps
   * needing nothing but the data it is handed — no doctor list, no database.
   * See refer.ts: `destinationEn` and `destinationSd`.
   */
  sentTo?: { en: string; sd: string }
}

/** How the medicines are laid out across sheets. Produced by planSheets() in
 *  paginate.ts, which measures the real layout instead of guessing a row count.
 *  The fallback below is only used if someone renders without a plan. */
/** groups[i] = how many medicines are on sheet i. Sheets are NOT equal:
 *  a continuation sheet carries one thin bar, the last sheet carries the
 *  legend, tests, advice and the handwriting area. */
export type SheetPlan = { groups: number[]; compact: boolean }

export const FALLBACK_PLAN = (n: number): SheetPlan => {
  if (n <= 5) return { groups: [Math.max(1, n)], compact: false }
  const groups: number[] = []
  for (let i = 0; i < n; i += 6) groups.push(Math.min(6, n - i))
  return { groups, compact: true }
}

export function renderSlip(d: SlipData, plan?: SheetPlan): string {
  const { groups, compact } = plan ?? FALLBACK_PLAN(d.visit.lines.length)
  let off = 0
  return groups.map((count, i) => {
    const html = renderSheet(d, d.visit.lines.slice(off, off + count),
                             compact, i, groups.length, off)
    off += count
    return html
  }).join('')
}

/** One sheet in isolation, for the fitting pass in paginate.ts.
 *  `isLast` decides whether the trailing blocks are on it, which changes the
 *  vertical budget completely — that is the whole reason a fixed row cap fails. */
export function renderOneSheet(d: SlipData, from: number, count: number,
                               compact: boolean, isLast: boolean, sheetNo: number): string {
  return renderSheet(d, d.visit.lines.slice(from, from + count), compact,
                     sheetNo, isLast ? sheetNo + 1 : sheetNo + 2, from)
}

function renderSheet(d: SlipData, lines: RxLine[], compact: boolean,
                     sheet: number, sheets: number, offset: number): string {
  const { visit } = d
  const last = sheet === sheets - 1
  const date = new Date(visit.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')

  const dr = profile()
  const pp = paper()
  const lhd = pp.kind === 'letterhead'

  // The visit's own doctor when the building has several rooms; the profile,
  // exactly as always, when it does not.
  const who = d.doctor ?? {
    nameEn: dr.doctorEn, nameSd: dr.doctorSd,
    degreesEn: dr.degreesEn, degreesSd: dr.degreesSd, reg: dr.reg,
  }

  /**
   * HOW BIG THE PATIENT-CODE SQUARE PRINTS, IN MILLIMETRES ON THE PAPER.
   *
   * The doctor asked for a bigger one and he is right: the code is 21 modules
   * across, so 9.4mm was .45mm a module, which is about as fine as a cheap USB
   * scanner will read off laser toner in a shop with one bulb. 16mm on A5 is
   * .76mm a module and 20mm on A4 is .95mm. Same code, nearly three times the
   * area, and the scanner stops being the weak part.
   *
   * The size lives here, on the svg itself, rather than in slip.css, so there
   * is one number in one place and it prints correctly even if the stylesheet
   * never arrives. See the .idcode block in slip.css, which sets everything
   * around it and nothing about its size.
   *
   * LETTERHEAD IS SMALLER FOR A REASON THAT IS NOT OURS. There is no heading
   * on his own pad, because the top 55mm of it is his own printing and we put
   * nothing there. So on letterhead the square stays in the patient bar and the
   * bar grows with it. 14mm on A4 letterhead is what that bar carries with a
   * quiet zone around the code and eleven medicines still on the sheet, which
   * is what that paper holds. An A5 letterhead has the least room of any paper
   * we print, so its square is left exactly where it was.
   */
  /**
   * A5 IS 18mm, AND THE NUMBER IS THE WRAP MARGIN RATHER THAN TASTE.
   *
   * Safeer asked for a little larger and left the size to us. Measured on a
   * full sheet, twelve medicines with a real letterhead: 16mm leaves 7.6mm over
   * the footer, 18mm leaves 5.6mm, 20mm leaves 3.6mm, and 22mm pushes the
   * twelfth medicine onto a second sheet.
   *
   * The thing that eats that clearance is a medicine whose GENERIC NAME WRAPS
   * to a second line, which costs 1.6mm. A real prescription already has one:
   * AUGMENTIN's formula is amoxicillin plus clavulanic acid. So 20mm would
   * leave room for exactly one long name, and the evening a doctor writes two
   * of them the twelfth medicine goes to page two, which is the failure this
   * whole layout exists to prevent. 18mm leaves room for two and is still
   * nearly four times the area the square had this morning.
   */
  const qrMm = lhd ? (pp.size === 'A4' ? 15 : 9.4) : (pp.size === 'A4' ? 24 : 18)

  /**
   * Suppressed on continuation sheets: one scannable code per visit, never two
   * pieces of paper that both claim to be the patient's card.
   *
   * The prescription id under the square is not decoration and is not a
   * caption. It is the fallback for the evening the scanner will not read, so
   * it travels wherever the square travels and it is set to be read across a
   * counter, not squinted at.
   */
  const qr = dr.showQr !== false && sheet === 0 ? qrSvgSafe(d.patientCode, qrMm) : ''
  const idcode = qr ? `<div class="idcode">${qr}<b class="rxid">${esc(d.rxId)}</b></div>` : ''

  // On his own pad we print nothing in the two bands his design already
  // occupies. The heights come from Setup, measured on one of his real sheets.
  //
  // The doctor's own lines are wrapped in .hin so the square can sit beside
  // them at the right end of the heading. On A5 that stack is 16mm tall in a
  // heading that was already 20.9mm, so the square rides there for almost
  // nothing, and the patient bar below is 4.3mm shorter for losing it.
  const hdr = lhd
    ? '<div class="lh"><div class="note">YOUR LETTERHEAD — LEFT BLANK</div></div>'
    : `<div class="hdr">
    <div class="hin">
      <div class="row">
        <div class="idl">
          ${dr.logo ? `<img class="logo" src="${dr.logo}" alt="" style="height:${dr.logoMm}mm">` : ''}
          <div>
            <div class="docname">${esc(who.nameEn)}</div>
            <div class="docqual">${esc(who.degreesEn)}${who.reg ? '<br>' + esc(who.reg) : ''}</div>
          </div>
        </div>
        <div class="sd docsd">${esc(who.nameSd)}<small>${esc(who.degreesSd)}</small></div>
      </div>
      <div class="clinicline"><span>${esc(dr.addressEn)}</span><span>${sheets > 1 ? `Sheet ${sheet + 1} of ${sheets}` : esc(dr.timing)}</span></div>
    </div>
    ${idcode}
  </div>`

  const pt = `<div class="pt">
  <div style="flex:2.2"><b>Patient / <span class="sd">مريض جو نالو</span></b><div class="v">${esc(d.patientName)}</div></div>
  <div style="flex:.8"><b>Age / <span class="sd">عمر</span></b><div class="v">${esc(d.patientAge || '—')}${d.patientSex ? ` <span style="font-size:6.6pt;font-weight:400">/ ${esc(d.patientSex)}</span>` : ''}</div></div>
  <div style="flex:1.2"><b>Patient no. / <span class="sd">مريض نمبر</span></b><div class="v" style="letter-spacing:1.2px">${esc(d.patientCode)}</div></div>
  <div style="flex:1.1"><b>Date / <span class="sd">تاريخ</span></b><div class="v">${date}</div></div>
  ${lhd ? idcode : ''}
</div>`

  /**
   * The numbers the compounder and the doctor took, printed with their proper
   * names and units instead of whatever key happened to be in the object.
   *
   * This strip has been rendered by this file since the beginning and has always
   * been empty, because nothing in the app ever wrote to `vitals`. It now
   * carries a blood pressure taken at the door and a sugar done on a strip
   * machine in the room, which is what a doctor here writes in the margin by
   * hand today.
   */
  const vitalCells = filled(visit.vitals)
    .map(([d, val]) => `<div class="v-${esc(d.key)}"><b>${esc(d.short)} <span class="sd">${esc(d.sd)}</span></b>`
      + `<div class="v">${esc(val)}${d.unit ? `<span class="vu"> ${esc(d.unit)}</span>` : ''}</div></div>`)
    .join('')
  const vt = (visit.diagnosis || vitalCells)
    ? `<div class="vt">
  ${visit.diagnosis ? `<div class="dx"><b>Diagnosis <span class="sd">تشخيص</span></b><div class="v">${esc(visit.diagnosis)}</div></div>` : ''}
  ${vitalCells}
</div>` : ''

  /**
   * EVERY LINE PRINTS, ALWAYS.
   *
   * This used to render '' when a line's drug was missing from `d.drugs`, and
   * `doctorDrugs()` excludes archived medicines. So retiring a medicine in Setup
   * — a housekeeping action, described in the UI as harmless — silently deleted
   * that row from every open and amended visit holding it. The slip came out
   * with a medicine missing and the numbering jumping from 2 to 4, and nothing
   * on screen said anything had gone.
   *
   * `printed()` already falls back to the frozen snapshot the line carries,
   * which is the whole reason snapshots exist. Using it here means a slip can
   * be reprinted correctly years after a medicine left the catalogue.
   */
  /**
   * FOUR TIMES A DAY COSTS WIDTH, SO IT IS ONLY PAID WHEN IT IS USED.
   *
   * Morning, midday and night cover almost every prescription a general
   * practice writes. An eye drop, amoxicillin and most six-hourly antibiotics
   * need a fourth, and until it existed the doctor had to put it in the free
   * note, where no pictogram reaches it and the patient who cannot read gets
   * nothing at all.
   *
   * A fourth column on every slip would take 14.5 mm off the medicine name on
   * A5 for the ninety-odd per cent that never use it. So the column appears
   * only when a line on THIS PRESCRIPTION has an evening dose, and when it
   * does, `.q4` narrows all four dose columns rather than robbing the name of
   * a whole column's worth. Decided from the visit, so every sheet of one
   * prescription has the same columns.
   */
  const evening = d.visit.lines.some(l => (l.dose.e || 0) > 0)

  const rows = lines
    .map((l, i) => row(offset + i + 1, l, printed(l, d.drugs[l.drugId]), compact, evening))
    .join('')

  const table = `<table class="rx${compact ? ' cmp' : ''}${evening ? ' q4' : ''}">
    <colgroup><col class="c-no"><col class="c-nm"><col class="c-t"><col class="c-t">${
      evening ? '<col class="c-t">' : ''}<col class="c-t"><col class="c-ml"><col class="c-dy"></colgroup>
    <thead><tr>
      <th></th><th style="text-align:left;padding-left:2.4mm">MEDICINE <span class="sd">دوا</span></th>
      <th>${SUNRISE('4.2mm', '4.2mm')}${timeHead('m')}</th>
      <th>${SUN('4.2mm', '4.2mm')}${timeHead('d')}</th>
      ${evening ? `<th>${SUNSET('4.2mm', '4.2mm')}${timeHead('e')}</th>` : ''}
      <th>${MOON('4.2mm', '4.2mm')}${timeHead('n')}</th>
      <th>${PLATE('4.2mm', '4.2mm')}<span class="sd">ماني</span></th>
      <th>${CAL('4.2mm', '4.2mm')}<span class="sd">ڏينهن</span></th>
    </tr></thead><tbody>${rows}</tbody></table>`

  const legend = '<div class="legend">' + legendFor(evening)
    .map(([ic, en, sd]) => `<div class="lg">${ic('4.6mm', '4.6mm')}<span>${en}<span class="sd">${sd}</span></span></div>`)
    .join('') + '</div>'

  const tests = visit.tests.length
    ? `<div class="bx"><h4><span>TESTS TO GET DONE</span><span class="sd">ڪرائڻ واريون ٽيسٽون</span></h4><div class="in">`
      + visit.tests.map(t => {
          const [en, sd] = t.split('|')
          // The Sindhi and the English of one test sit on one line, not two.
          // Stacked they were 6.4mm each and three of them set the height of the
          // whole tests-and-advice row; side by side a test costs 3.8mm. The
          // wrapper is what lets them share a line and, when a long test name
          // will not allow it, wrap instead of overflowing the box.
          return `<div class="tst"><div class="bxk"></div><div class="tstw">${sd ? `<div class="sd">${esc(sd)}</div>` : ''}<div class="en">${esc(en)}</div></div></div>`
        }).join('')
      + '</div></div>'
    : ''

  const advice = visit.advice.length
    ? `<div class="bx"><h4><span>ADVICE</span><span class="sd">هدايتون</span></h4><div class="in"><div class="advgrid">`
      + visit.advice.map(a => {
          const [sd, en, ic] = a.split('|')
          // 8.4mm, and it was the tallest thing on the bottom of the sheet: two
          // advice lines set the height of the whole tests-and-advice row at
          // 21.2mm, taller than two medicines. At 5.6mm the picture is still
          // 40 per cent over the 4mm floor these pictograms were drawn to
          // survive, and it is the same size as the dose pictogram beside it in
          // a dense table, which is a size we have already put on paper.
          // The DOSE pictograms are untouched: those are the marks a patient
          // who reads nothing takes his medicine by.
          const icon = adviceIcon[ic] ? adviceIcon[ic]('5.6mm', '5.6mm') : ''
          return `<div class="adv">${icon}<div><div class="sd">${esc(sd)}</div><div class="aen">${esc(en)}</div></div></div>`
        }).join('')
      + '</div></div></div>'
    : ''

  /**
   * SENT ON — and this is the only channel that cannot fail.
   *
   * A token in the other room's queue works inside this building. A note on
   * screen works while the app is open. The paper in the patient's hand works
   * in a hospital in Karachi at two in the morning, and it is the one the
   * patient will not forget to deliver, because it is his.
   *
   * The heading is the Sindhi already in the app for this outcome. Everything
   * else on this band is a name or a line the doctor typed himself, which is
   * the same rule the diagnosis and the next-visit date already follow.
   */
  const sent = visit.sentOn
    ? `<div class="bx sent"><h4><span>SENT ON TO</span><span class="sd">اڳتي موڪليو</span></h4>
      <div class="in">
        <div class="sto"><b>${esc(d.sentTo?.en ?? '')}</b>${d.sentTo?.sd ? `<span class="sd">${esc(d.sentTo.sd)}</span>` : ''}</div>
        <div class="swhy">${esc(visit.sentOn.note)}</div>
      </div></div>`
    : ''

  // .credit, not .brand. The medicine name in the table has been .brand since
  // the first sheet, and while this block shared that class the stylesheet
  // painted every medicine name in the foot's 5.1pt grey. See slip.css.
  const credit = (dr.showCredit && !lhd)
    ? `<div class="credit">
      <span class="bn"><span class="sd">${esc(APP.sd)}</span> <b>${esc(APP.en)}</b></span>
      ${APP.web ? `<span class="ct">${esc(APP.web)}</span>` : ''}
    </div>` : ''

  return `<div class="page${pp.size === 'A4' ? ' a4' : ''}${lhd ? ' lhd' : ''}" style="${pageVars(pp)}">
  ${hdr}
  <div class="pad">
    ${pt}
    ${vt}
    ${table}
    ${last ? legend : ''}
    ${sheets > 1 && !last ? `<div class="contbar"><span>${visit.lines.length} medicines in total — continued on sheet ${sheet + 2}</span><span class="sd">ٻي پني تي جاري</span></div>` : ''}
    ${last ? `<div class="boxes">${tests}${advice}</div>` : ''}
    ${last ? sent : ''}
    ${last ? `<div class="note2">
      <div class="nh"><span class="pen">DOCTOR'S NOTE / REFERRAL / DIET — handwritten</span>
        <span class="sd">ڊاڪٽر جي صلاح ۽ پرهيز</span></div>
      <div class="lines"><i></i></div>
    </div>` : ''}
  </div>
  <div class="foot">
    <div class="fbar" dir="ltr">
      <div class="keep">
        <span class="sd">هي پرچو ساڻ کڻي اچو.</span>
        <span class="en">Bring this slip next time.</span>
        ${dr.phone ? `<span class="appt">Appointments <span class="sd">وقت وٺڻ لاءِ</span> <bdi>${esc(dr.phone)}</bdi></span>` : ''}
      </div>
      ${visit.nextVisit ? `<span class="nextv">Next visit <span class="sd">ايندڙ ملاقات</span>: <bdi><b>${esc(visit.nextVisit)}</b></bdi></span>` : ''}
      ${dr.showSign ? `<div class="sign">
        <span class="rule"></span>
        <span class="lbl">Signature &amp; stamp <span class="sd">صحيح ۽ مُهر</span></span>
      </div>` : ''}
    </div>
    <div class="fine" dir="ltr">
      <div class="sd">سڀ دوائون پوريون ڪريو.</div>
      <div>Finish the full course.</div>
    </div>
    ${credit}
  </div>
  ${lhd && pp.bottom > 0 ? '<div class="lhfoot"><div class="note">YOUR LETTERHEAD FOOTER — LEFT BLANK</div></div>' : ''}
</div>`
}
