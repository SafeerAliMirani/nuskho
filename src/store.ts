/**
 * WHOSE SHOP THE MEDICAL STORE IS.
 *
 * Safeer, asked whether the store inside a hospital building belongs to the
 * doctors or to somebody renting the space: "both happen, roughly equally."
 *
 * That is one word of configuration and a real difference in what may be shown,
 * because the two are not the same business:
 *
 *   OURS    the clinic's own counter, run by the clinic's own staff. Today's
 *           printed slips are a working list, the same list the compounder
 *           would carry over on paper, and seeing a slip arrive is how the
 *           counter knows to start counting.
 *
 *   RENTED  a separate shop that happens to be in the same building. It serves
 *           this clinic's patients and everybody else's. It has no more claim
 *           on the day's list of who attended than the chemist across the road,
 *           and that list is exactly the thing worth protecting: not any single
 *           prescription, which the patient is carrying past the counter
 *           anyway, but the ROLL of who came to the doctor tonight.
 *
 * So a rented store sees one slip: the one whose paper is in front of it,
 * opened by its number. Nothing before it is scanned, nothing after it is put
 * down. On the building's wire that is enforced where it has to be — the host
 * never sends the day to that phone, so the phone cannot be made to show it.
 *
 * THE DEFAULT IS RENTED. A clinic that has never answered the question gets the
 * narrower shape, for the same reason an unknown person at the front door gets
 * the counter's screen and not the doctor's: when a setting has not been made,
 * be wrong in the direction that shows less.
 */

export type Store = 'ours' | 'rented'

const KEY = 'nuskho.store'

export function storeKind(): Store {
  try { return localStorage.getItem(KEY) === 'ours' ? 'ours' : 'rented' }
  catch { return 'rented' }
}

export function setStoreKind(s: Store): void {
  try { localStorage.setItem(KEY, s) } catch { /* private mode */ }
}

/** May this counter be shown the whole day's printed slips at once? */
export const storeSeesTheDay = (): boolean => storeKind() === 'ours'

export const STORE_WHAT: Record<Store, string> = {
  ours: 'Ours. The clinic runs this counter.',
  rented: 'A shop renting space. It serves other doctors’ patients too.',
}
