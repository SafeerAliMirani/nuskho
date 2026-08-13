/**
 * THE PRESCRIPTION'S LOAD-BEARING PIECES, IN ONE FILE, BECAUSE TWO SCREENS
 * NOW PRESCRIBE.
 *
 * Until 11 Aug 2026 only Compose built a frozen snapshot, only Compose decided
 * whether a prescription was fit to print, and only Compose assembled the
 * SlipData the printer is handed. Then the second doctor got his own screen
 * (see building.ts), and the record holder started doing all three on behalf
 * of a mirror device.
 *
 * The rule that moved this code here rather than copying it: WHEN TWO
 * FUNCTIONS BUILD THE SAME SHAPE, SOMETHING MUST COMPARE THEM. The freeze()
 * loop and renderSlip's printed() fallback drifted apart exactly once, two
 * fields went missing from every printed eye drop for weeks, and the test at
 * the bottom of refer.test.ts now reads both literals from disk to stop a
 * recurrence. Copying this logic into building.ts would have created a third
 * literal that that test does not read. So there is one snapshot builder, one
 * readiness check and one SlipData builder, and both prescribing paths call
 * these.
 *
 * Nothing in this file touches the database. Everything is handed in, so it
 * can serve the solo screen, the wire path, and a unit test identically.
 */
import type { Visit, Patient, Drug, RxLine, RxSnap } from './types'
import type { SlipData } from './print/renderSlip'
import type { DictEntry } from './data/dictionary'
import { doseSdFor, defaultRoute } from './data/forms'
import { doctorById } from './doctors'
import { patientCode } from './code'
import { destinationEn, destinationSd } from './refer'

/** A line with no dose at all. The screen bumps it; the printer refuses it. */
export const lineIsEmpty = (l: RxLine): boolean =>
  !l.dose.m && !l.dose.d && !l.dose.e && !l.dose.n

/**
 * Is this prescription fit for paper? Returns the index of the first offending
 * line, or -1 twice. Both prescribing paths ask THIS, so the mirror cannot
 * print a line the host screen would have refused.
 *
 * A line whose medicine cannot be named must not reach paper: either it
 * carries a printed snapshot with a name in it, or its drug is on the list
 * right now. Anything else prints a row with a dose and no medicine, which is
 * worse than not printing at all.
 */
export function linesReady(lines: RxLine[], drugs: Record<string, Drug>): {
  bad: number; nameless: number
} {
  return {
    bad: lines.findIndex(lineIsEmpty),
    nameless: lines.findIndex(l => !(l.snap?.brand || drugs[l.drugId]?.brand)),
  }
}

/**
 * Freeze one line's medicine onto the prescription itself.
 *
 * From this moment the slip no longer depends on the medicine list. Correct a
 * spelling, merge a duplicate or retire a medicine later and the paper in the
 * patient's hand still says exactly what it said, which is the only honest
 * answer to "what did you prescribe this patient in March".
 *
 * IT MUST COPY EVERY FIELD THE PRINTER READS. `route` and `mlPerDose` were
 * once missing here while printed(), the fallback for a line with no snap,
 * supplied both; every printed eye drop lost its route and printed the
 * plate-and-pill picture that means "after food". A field this literal forgets
 * is a field the patient never gets back, because from here the medicine list
 * is not consulted again. When a field is added to RxSnap it belongs here the
 * same day, and the literal-comparison test in refer.test.ts reads this exact
 * function to enforce that.
 */
export function snapFor(g: Drug | undefined): RxSnap {
  return {
    brand: g?.brand ?? '', strength: g?.strength ?? '', generic: g?.generic ?? '',
    sd: g?.sd ?? '', sdReviewed: g?.sdReviewed === true, unitSd: g?.unitSd ?? '',
    form: g?.form ?? 'tab', route: g?.route, mlPerDose: g?.mlPerDose,
  }
}

/** Freeze every unfrozen line. A line already frozen keeps its snapshot: the
 *  paper in the patient's hand must never quietly change meaning. */
export const freezeLines = (lines: RxLine[], drugs: Record<string, Drug>): RxLine[] =>
  lines.map(l => l.snap ? l : { ...l, snap: snapFor(drugs[l.drugId]) })

/**
 * A shelf entry becoming the doctor's own medicine, the same way on both
 * screens. The id is handed in so this file stays free of storage concerns.
 *
 * `sdReviewed: false` is the load-bearing line: a dictionary entry's Sindhi is
 * a candidate, not a verdict, and the person in this clinic still has to read
 * the word before it can print. And the route comes from the ROW first: the
 * shelf knows an eye drop from an ear drop and from the amoxicillin drops a
 * baby swallows, while `defaultRoute` answers "by mouth" for every drop there
 * is, and a mouth on an eye drop prints the plate-and-pill picture that means
 * after food.
 */
export function drugFromShelf(e: DictEntry, id: string): Drug {
  return {
    id, brand: e.brand, strength: e.strength, generic: e.generic,
    sd: e.sd, sdReviewed: false, form: e.form, addedAt: Date.now(),
    unitSd: doseSdFor(e.form), route: e.route ?? defaultRoute(e.form),
  }
}

/**
 * Exactly what printSlip is given, assembled the same way for the doctor at
 * the record holder's keyboard and the doctor at his own screen. In a building
 * with several rooms the heading names the visit's own doctor; a solo visit
 * carries no doctorId and the profile prints, as always. sentTo is resolved
 * here rather than in the print module, which is handed data and never looks
 * anything up.
 */
export function slipDataFor(v: Visit, pt: Patient, drugs: Record<string, Drug>): SlipData {
  const room = doctorById(v.doctorId)
  return {
    visit: v, patientName: pt.name, patientAge: pt.age, patientSex: pt.sex,
    patientCode: patientCode(pt.num), drugs, rxId: v.id.slice(-6),
    doctor: room ? {
      nameEn: room.nameEn, nameSd: room.nameSd,
      degreesEn: room.degreesEn, degreesSd: room.degreesSd, reg: room.reg,
    } : undefined,
    sentTo: v.sentOn
      ? { en: destinationEn(v.sentOn), sd: destinationSd(v.sentOn) }
      : undefined,
  }
}
