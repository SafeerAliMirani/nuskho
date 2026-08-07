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
import type { Drug, Visit, RxLine, RxSnap, Form } from '../types'
import { SUNRISE, SUN, MOON, TAB, HALF, CAP, SPOON, PLATE, CAL, adviceIcon } from './icons'
import { qrSvgSafe } from './qr'
import { course, courseUnitSd } from '../course'
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

const formIcon = (f: Drug['form']) => (f === 'cap' ? CAP : f === 'syr' ? SPOON : TAB)

/** One dose cell: the pictogram, then the number under it. */
function doseCell(m: RxSnap, n: number, sz: string): string {
  if (!n) return '<td class="tcell off">&mdash;</td>'

  // Syrup counts in spoons, and it counts properly. This cell used to print
  // "1 چمچو" whatever the doctor had chosen, so a child prescribed two spoons
  // at night was sent home with a slip that said one. The dose is the one
  // number on this page that has to be the number he actually tapped.
  if (m.form === 'syr') {
    const spoons = n === 0.5 ? '½' : String(Math.round(n))
    const pics = Array.from({ length: Math.min(Math.max(Math.round(n), 1), 3) }, () => SPOON(sz, sz)).join('')
    return `<td class="tcell">${pics}<div class="dose"><span class="sd">${spoons} ${esc(doseUnitSd(m))}</span></div></td>`
  }

  if (n === 0.5)
    return `<td class="tcell">${HALF(sz, sz)}<div class="dose">½</div></td>`
  const ic = formIcon(m.form)
  const pics = Array.from({ length: Math.min(Math.round(n), 3) }, () => ic(sz, sz)).join('')
  return `<td class="tcell">${pics}<div class="dose">${Math.round(n)}</div></td>`
}

/** Meal timing as one scene, never an arrow sequence the reader must decode. */
function mealIcon(meal: RxLine['meal'], compact: boolean): string {
  if (meal === 'any') return '<span class="mseq">&mdash;</span>'
  const k = compact ? 0.58 : 0.74
  const plate = PLATE(`${6.8 * k}mm`, `${6.8 * k}mm`)
  const pill = TAB(`${5.8 * k}mm`, `${5.8 * k}mm`)
  const seq = meal === 'before' ? [pill, plate] : [plate, pill]
  return `<span class="mseq">${seq.join('')}</span>`
}

/**
 * What to print for this line. Once a prescription has been printed it carries
 * its own copy, and that copy wins for ever — correcting a spelling in the
 * medicine list must never change a slip already in a patient's hand.
 */
export function printed(line: RxLine, drug?: Drug): RxSnap {
  if (line.snap) return line.snap
  return {
    brand: drug?.brand ?? '', strength: drug?.strength ?? '', generic: drug?.generic ?? '',
    sd: drug?.sd ?? '', sdReviewed: drug?.sdReviewed, unitSd: drug?.unitSd ?? '',
    form: drug?.form ?? 'tab',
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
const FORM_SD: Record<Form, string> = {
  tab: 'گوري',
  cap: 'ڪيپسول',
  syr: 'سيرپ',
  other: 'دوا',
}

/** What the bottle or the box is. Printed after the Sindhi brand name. */
const formSd = (m: RxSnap) => FORM_SD[m.form] ?? FORM_SD.other

/** What the patient picks up. Printed in the morning, midday and night columns.
 *  Falls back to the form when a drug was saved before this split existed. */
const doseUnitSd = (m: RxSnap) => m.unitSd || formSd(m)

function row(i: number, line: RxLine, m: RxSnap, compact: boolean): string {
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
   * WHERE IT GOES WAS MEASURED, NOT CHOSEN. Under the day count, which is the
   * obvious place, it added a fourth line to that cell and pushed an eight
   * medicine prescription from one A5 sheet onto two. It sits instead on the
   * line that already carries the Sindhi medicine name, at the empty left end
   * of it, which costs no height at all and puts the count beside the name
   * rather than under a different number.
   */
  const c = course(line, m)
  const total = c.n > 0
    ? `<div class="tot"><b>${c.n}</b><span class="sd">${esc(courseUnitSd(line, m))}</span></div>`
    : ''

  const ticks = compact || c.n > 0
    ? ''
    : `<div class="tick">${Array.from({ length: Math.min(line.days, 7) }, () => '<i></i>').join('')}</div>`

  /**
   * IN DENSE SPACING THE WORD "DAYS" GIVES UP ITS LINE TO THE COUNT.
   *
   * ڏينهن is printed in this column's heading already, so repeating it on
   * every row of a twelve medicine slip buys nothing and costs a line in the
   * one layout that has no lines to spare. Measured: without this, twelve
   * medicines on A4 went from one sheet to two the moment the count appeared.
   * Comfortable spacing keeps the word, because there it is free.
   */
  const dysd = compact && c.n > 0 ? '' : '<div class="sd dysd">ڏينهن</div>'
  return `<tr>
      <td class="noc">${i}</td>
      <td class="nmcell">
        <div class="nmen">
          <div class="brand">${esc(m.brand)} ${esc(m.strength)}</div>
          <div class="gen">${esc(m.generic)}</div>
        </div>
        <div class="sd nmsd">${m.sd && m.sdReviewed === true ? esc(m.sd) + ' — ' : ''}${esc(formSd(m))}</div>
      </td>
      ${doseCell(m, line.dose.m, sz)}${doseCell(m, line.dose.d, sz)}${doseCell(m, line.dose.n, sz)}
      <td class="mlcell">${mealIcon(line.meal, compact)}<div class="sd mlsd">${MEAL_SD[line.meal]}</div></td>
      <td class="dycell"><div class="dyn">${line.days}</div>
        ${dysd}${ticks}${total}</td>
    </tr>`
}

const LEGEND: [(w: string, h: string) => string, string, string][] = [
  [SUNRISE, 'MORNING', 'صبح'],
  [SUN, 'MIDDAY', 'منجهند'],
  [MOON, 'NIGHT', 'رات'],
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

  // On his own pad we print nothing in the two bands his design already
  // occupies. The heights come from Setup, measured on one of his real sheets.
  const hdr = lhd
    ? '<div class="lh"><div class="note">YOUR LETTERHEAD — LEFT BLANK</div></div>'
    : `<div class="hdr">
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
  </div>`

  // The square sits beside the number it encodes, so nobody has to be told what
  // it is for. Suppressed on continuation sheets: one scannable code per visit,
  // never two pieces of paper that both claim to be the patient's card.
  const qr = dr.showQr !== false && sheet === 0 ? qrSvgSafe(d.patientCode, 13) : ''

  const pt = `<div class="pt">
  <div style="flex:2.2"><b>Patient / <span class="sd">مريض جو نالو</span></b><div class="v">${esc(d.patientName)}</div></div>
  <div style="flex:.8"><b>Age / <span class="sd">عمر</span></b><div class="v">${esc(d.patientAge || '—')}${d.patientSex ? ` <span style="font-size:6.6pt;font-weight:400">/ ${esc(d.patientSex)}</span>` : ''}</div></div>
  <div style="flex:1.2"><b>Patient no. / <span class="sd">مريض نمبر</span></b><div class="v" style="letter-spacing:1.2px">${esc(d.patientCode)}</div></div>
  <div style="flex:1.1"><b>Date / <span class="sd">تاريخ</span></b><div class="v">${date}</div></div>
  ${qr ? `<div class="qrcell">${qr}<b>${esc(d.rxId)}</b></div>` : ''}
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
  const rows = lines
    .map((l, i) => row(offset + i + 1, l, printed(l, d.drugs[l.drugId]), compact))
    .join('')

  const table = `<table class="rx${compact ? ' cmp' : ''}">
    <colgroup><col class="c-no"><col class="c-nm"><col class="c-t"><col class="c-t"><col class="c-t"><col class="c-ml"><col class="c-dy"></colgroup>
    <thead><tr>
      <th></th><th style="text-align:left;padding-left:2.4mm">MEDICINE <span class="sd">دوا</span></th>
      <th>${SUNRISE('4.2mm', '4.2mm')}<span class="sd">صبح</span></th>
      <th>${SUN('4.2mm', '4.2mm')}<span class="sd">منجهند</span></th>
      <th>${MOON('4.2mm', '4.2mm')}<span class="sd">رات</span></th>
      <th>${PLATE('4.2mm', '4.2mm')}<span class="sd">ماني</span></th>
      <th>${CAL('4.2mm', '4.2mm')}<span class="sd">ڏينهن</span></th>
    </tr></thead><tbody>${rows}</tbody></table>`

  const legend = '<div class="legend">' + LEGEND
    .map(([ic, en, sd]) => `<div class="lg">${ic('4.6mm', '4.6mm')}<span>${en}<span class="sd">${sd}</span></span></div>`)
    .join('') + '</div>'

  const tests = visit.tests.length
    ? `<div class="bx"><h4><span>TESTS TO GET DONE</span><span class="sd">ڪرائڻ واريون ٽيسٽون</span></h4><div class="in">`
      + visit.tests.map(t => {
          const [en, sd] = t.split('|')
          return `<div class="tst"><div class="bxk"></div><div><div class="sd">${esc(sd || '')}</div><div class="en">${esc(en)}</div></div></div>`
        }).join('')
      + '</div></div>'
    : ''

  const advice = visit.advice.length
    ? `<div class="bx"><h4><span>ADVICE</span><span class="sd">هدايتون</span></h4><div class="in"><div class="advgrid">`
      + visit.advice.map(a => {
          const [sd, en, ic] = a.split('|')
          const icon = adviceIcon[ic] ? adviceIcon[ic]('8.4mm', '8.4mm') : ''
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

  const credit = (dr.showCredit && !lhd)
    ? `<div class="brand">
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
    <div class="fbar">
      <div class="keep">
        <span class="sd">هي پرچو ساڻ کڻي اچو.</span>
        <span class="en">Bring this slip next time.</span>
        ${dr.phone ? `<span class="appt">Appointments <span class="sd">وقت وٺڻ لاءِ</span> ${esc(dr.phone)}</span>` : ''}
      </div>
      ${visit.nextVisit ? `<span class="nextv">Next visit <span class="sd">ايندڙ ملاقات</span>: <b>${esc(visit.nextVisit)}</b></span>` : ''}
      ${dr.showSign ? `<div class="sign">
        <span class="rule"></span>
        <span class="lbl">Signature &amp; stamp <span class="sd">صحيح ۽ مُهر</span></span>
      </div>` : ''}
    </div>
    <div class="fine">
      <div class="sd">سڀ دوائون پوريون ڪريو.</div>
      <div>Finish the full course.</div>
    </div>
    ${credit}
  </div>
  ${lhd && pp.bottom > 0 ? '<div class="lhfoot"><div class="note">YOUR LETTERHEAD FOOTER — LEFT BLANK</div></div>' : ''}
</div>`
}
