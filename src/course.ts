import { doseSdFor } from './data/forms'
import type { RxLine, RxSnap } from './types'

/**
 * HOW MANY UNITS THE PRINTED COURSE COMES TO.
 *
 * This lived inside the pharmacy screen, which was fine while the only place
 * that needed it was the pharmacy screen. It is now needed in three:
 *
 *   the pharmacy counter        to tick a line off as handed over
 *   the building's wire         so a pharmacy phone shows the same number
 *   THE PRINTED SLIP            so a chemist in the bazaar reads the total
 *                               instead of working it out
 *
 * The third one is why it moved to its own file. `src/print/` is deliberately
 * framework free: it is handed data and returns an HTML string, no React and
 * no database anywhere near it. Importing this arithmetic out of a screen
 * component would have dragged both into the one module in this project that
 * is verified against a ruler.
 *
 * Two copies of this sum would one day disagree, and the day they disagreed a
 * patient would be handed a different number of tablets from the number on his
 * paper.
 */
export function course(l: RxLine, snap?: RxSnap): { n: number; unit: string } {
  const perDay = (l.dose.m || 0) + (l.dose.d || 0) + (l.dose.n || 0)
  /**
   * THE FORM COMES FROM THE RESOLVED SNAPSHOT WHEN THE CALLER HAS ONE.
   *
   * `l.snap` is only written at print time, by freeze(). Every reader that
   * runs before that — the layout fitting pass, a warm-up, a screen showing an
   * open visit — fell back to 'tab' and therefore printed a tablet count for a
   * bottle of syrup. The print row already resolves the snapshot through
   * printed(), so it passes it in and this stops guessing.
   */
  const m = snap ?? l.snap
  const form = m?.form ?? 'tab'

  /**
   * A SYRUP IS COUNTED IN MILLILITRES, BECAUSE THAT IS HOW BOTTLES ARE SOLD.
   *
   * Safeer chose this over the number of spoons: one spoon twice a day for five
   * days is 50 ml, and a chemist reading 50 ml reaches for a 60 ml bottle
   * without doing any arithmetic at all. Ten spoons would leave him to do it.
   *
   * A spoon is the 5 ml cap that comes with the bottle unless this medicine
   * says otherwise, and `mlPerDose` says otherwise for the few that do. It
   * NEVER changes the printed dose, which is still exactly what the doctor
   * tapped. It chooses a bottle, and being one bottle out is a walk back to the
   * counter, not a wrong dose.
   */
  if (form === 'syr') {
    const ml = (m?.mlPerDose && m.mlPerDose > 0 ? m.mlPerDose : 5) * perDay * l.days
    const n = Math.ceil(ml)
    return n > 0 ? { n, unit: 'ml' } : { n: 0, unit: `${l.days} days` }
  }

  /**
   * DROPS AND CREAMS GET NO TOTAL, ON PURPOSE.
   *
   * A 15 ml dropper bottle holds roughly three hundred drops, and a tube of
   * cream lasts as long as it lasts. Every short course fits one of either, so
   * a number here would be arithmetic nobody uses, and a bottle count would be
   * a guess dressed up as a fact. The chemist sells one and always has.
   */
  if (form === 'drop' || form === 'cream' || form === 'other') {
    return { n: 0, unit: `${l.days} days` }
  }

  const n = Math.ceil(perDay * l.days)
  return { n, unit: form === 'cap' ? 'capsules' : form === 'sachet' ? 'sachets' : 'tablets' }
}

/**
 * The Sindhi word for what is being counted, so the box can read 10 گوري.
 *
 * Only the noun. The number is rendered beside it, and a helper that returned
 * "10 گوري" put the ten on the slip twice inside one box.
 *
 * The word is the one already frozen onto this line and already printed in the
 * dose columns, so nothing new reaches the paper. The fallback is used only for
 * a line saved before that field existed.
 */
export const courseUnitSd = (l: RxLine, snap?: RxSnap): string => {
  const m = snap ?? l.snap
  const form = m?.form ?? 'tab'
  // A volume needs no noun: "50 ml" is complete in every language on this page,
  // and it is what the box itself says.
  if (form === 'syr') return 'ml'
  const sd = doseSdFor(form)
  if (!sd) return ''
  return m?.unitSd || sd
}
