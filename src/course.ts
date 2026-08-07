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
  const form = (snap ?? l.snap)?.form ?? 'tab'
  /**
   * A SYRUP HAS NO COUNTABLE TOTAL, AND SAYING ONE WOULD BE A GUESS.
   *
   * Two spoons a day for five days is ten spoons, which tells a chemist
   * nothing: he sells a bottle, and how many bottles depends on whether it is
   * 60 ml or 120 ml and how big the spoon is. So this returns zero and the
   * callers print the days instead. An invented bottle count on a child's
   * prescription is exactly the sort of confident wrong number this app must
   * never produce.
   */
  if (form === 'syr' || form === 'other') return { n: 0, unit: `${l.days} days` }
  const n = Math.ceil(perDay * l.days)
  return { n, unit: form === 'cap' ? 'capsules' : 'tablets' }
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
  return m?.unitSd || (m?.form === 'cap' ? 'ڪيپسول' : 'گوري')
}
