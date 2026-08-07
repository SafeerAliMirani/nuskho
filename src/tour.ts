import { multiRoom } from './doctors'
import type { Role } from './roles'

/**
 * THE TOUR, AND THE RULES IT OBEYS.
 *
 * A person is handed a phone or sat in front of a laptop at seven in the
 * evening with twenty people waiting. Nobody reads a manual in that room. So
 * the tour is short, it points at the real control rather than describing it,
 * it opens itself exactly once per role on a machine, and it is one tap to
 * close and always one tap to bring back.
 *
 * THE HARD RULE: IT NEVER BLOCKS THE EVENING. The dimming behind it does not
 * take clicks. A patient walks up mid-tour, the compounder taps straight
 * through it and works. A tour that can stand between a person and a waiting
 * patient is worse than no tour at all.
 *
 * THE SINDHI RULE: every Sindhi word here is one already used elsewhere in
 * this app and already read by a person. Nothing new is written into Sindhi
 * for a tour, for the same reason nothing unreviewed reaches paper.
 */
/**
 * WHICH SCREEN A STEP BELONGS TO.
 *
 * Safeer, having walked the tours: "I found the middle numbers are not
 * working." He was right, and the cause was structural rather than a bug in
 * any one step. The tour opens over the QUEUE, and five of the doctor's eight
 * steps describe the PRESCRIPTION screen, which is not open. So those steps
 * had nothing to ring, the gold ring vanished halfway through, and the middle
 * of the tour read as broken.
 *
 * A step now says which screen it is about. The queue's steps run over the
 * queue; the prescription screen runs its own the first time a doctor opens a
 * patient. Every step then rings a control that is actually in front of him,
 * which was the whole idea.
 */
export type Screen = 'queue' | 'compose'

export type TourStep = {
  /** the screen this step's control lives on. Absent means the queue. */
  on?: Screen
  title: string
  /** a single word, taken from the vocabulary this app already uses */
  sd?: string
  body: string
  /** a CSS selector to ring. If it is not on screen the step still reads. */
  at?: string
  /** steps that only make sense in some clinics */
  when?: () => boolean
}

const multi = () => multiRoom()

const COUNTER: TourStep[] = [
  {
    title: 'This screen is your whole evening',
    sd: 'قطار',
    body: 'The list at the bottom is tonight. Everything above it is the two ways a patient joins that list.',
    at: '.qlist, .blank',
  },
  {
    title: 'Tonight, and which room',
    sd: 'اڄ رات',
    body: 'Tap a room card FIRST. The fee fills with that doctor’s rate, his room counts its own numbers, and his name goes on the receipt.',
    at: '.rooms',
    when: multi,
  },
  {
    title: 'Been here before?',
    sd: 'نمبر',
    body: 'Type the number printed on the old slip, or point the scanner at the square on it. His record and a new number come up together.',
    at: '.codebox',
  },
  {
    title: 'A new patient',
    sd: 'نالو',
    body: 'The name is the only thing you must have. Age and city help later and never block you now.',
    at: '.fld:has(input)',
  },
  {
    title: 'The fee, taken now',
    sd: 'في',
    body: 'Received, not paid yet, or free. If it was promised and paid later, the row keeps saying due until you tap that the money came.',
    at: '.feerow',
  },
  {
    title: 'This one cannot wait',
    body: 'Tick it before adding. The row goes red and to the top and the doctor’s screen is told at once. Use it for the patient in front of you, not as a guess about how ill somebody is.',
    at: '.urgentbox',
  },
  {
    title: 'Money to give back',
    body: 'When the doctor charges less, the row turns and says give back so many rupees. Hand it over and tap it while the patient is still standing there.',
    at: '.refund, .qlist, .blank',
  },
  {
    title: 'What you will never see here',
    body: 'No prescription, no diagnosis, no history. That is by design, not a fault, and it is why the doctor can trust this desk with his patients.',
  },
]

const COMPOUNDER: TourStep[] = [
  {
    title: 'The queue, every room',
    sd: 'قطار',
    body: 'You see the whole evening. Tap any row, in any order. The screen never forces you and it never announces anyone.',
    at: '.qlist, .blank',
  },
  {
    title: 'Ready them before the room',
    body: 'Open a row and take the blood pressure, weight and temperature. What you type is on the doctor’s screen already saved, and it prints on the slip.',
    // the row control first, then the list it will appear in: this tour opens
    // on the first sign-in of the evening, when the queue is usually empty
    at: '.vopen, .qlist, .blank',
  },
  {
    title: 'Call by number',
    sd: 'ٽوڪن ڪائونٽر',
    body: 'The order of the room stays yours. Nothing here shows a waiting list to the room or tells a family they are next.',
    at: '.qrow, .qlist, .blank',
  },
  {
    title: 'Every token must end',
    body: 'Somebody gives up and goes home, somebody is sent straight to hospital. Tap close without a prescription and pick the honest ending. A token left open all night makes the evening’s figures a lie.',
    at: '.qclose, .qlist, .blank',
  },
  {
    title: 'The tests the doctor asks for',
    sd: 'ٽيسٽ',
    body: 'He asks for a sugar or an HbA1c while the patient is still sitting there. Do it on the clinic\u2019s machine, tell him the number, and he writes it on the slip. The charge appears on your queue, and you take it as the patient leaves.',
    at: '.qlist, .blank',
  },
  {
    title: 'Medicines are the doctor\u2019s alone',
    body: 'You cannot open a prescription and you are not meant to. His name is on that paper. Everything else in the evening is yours.',
  },
  {
    title: 'After the print',
    body: 'Hand the slip over, point at the pictures, say the doses once. If the desk owes money back, walk the patient to the counter yourself.',
  },
]

const DOCTOR: TourStep[] = [
  {
    title: 'Your queue',
    sd: 'قطار',
    body: 'Tap any row in any order. The number on the left is his token, the small line under the name says where he is up to.',
    at: '.qlist, .blank',
  },
  {
    title: 'You are in your own room',
    sd: 'ڪمرو',
    body: 'Tokens you issue go to your room at your fee, your queue rows open for you, and another room’s patient will not open on your screen.',
    at: '.rooms',
    when: multi,
  },
  {
    title: 'Your figures are yours',
    sd: 'ماڻهو',
    body: 'People served, who came back, evenings worked, money after refunds. Nobody else in the building can open this page, and the month card you can print carries no money and no medicines.',
    at: '.rolechip',
  },

  /* ---------------------------------------------- the prescription screen
   *
   * These five run when he first opens a patient, not over the queue. Each
   * one now rings something he can actually see, which is the difference
   * between a tour and a leaflet. */
  {
    on: 'compose',
    title: 'Who you have in front of you',
    body: 'His name, his token, his number, and in a building with rooms, which room this slip belongs to. Check it before you write, every time.',
    at: '.pane .who',
  },
  {
    on: 'compose',
    title: 'Doses are taps, not typing',
    sd: 'گوري',
    body: 'Tap a dose to cycle one, two, half, none. Days go up and down with plus and minus. Nothing here will ever suggest a medicine you did not choose.',
    at: '.dosegrid, .composegrid',
  },
  {
    on: 'compose',
    title: 'Charging less',
    sd: 'مفت',
    body: 'Charge less or free, from your chair. The counter is told at once and owes him the difference on his way out.',
    at: '.feebar',
  },
  {
    on: 'compose',
    title: 'Sending him on',
    sd: 'اڳتي موڪليو',
    body: 'To another room here, or to a hospital in another city. Write the one line about why: it prints on his own slip, which is the copy that never fails to arrive, and the doctor you sent him to reads it beside your finding and your medicines. He reads them. He cannot change them.',
    at: '.senton',
  },
  {
    on: 'compose',
    title: 'PRINT, then it locks',
    body: 'Under eight seconds to paper. After that the slip cannot be edited, because the paper in his hand must never quietly stop matching the record. A correction is a new slip with a new number.',
    at: '.sticky, .lockbar',
  },
]

const PHARMACY: TourStep[] = [
  {
    title: 'Printed slips only',
    sd: 'فارميسي',
    body: 'Today’s printed prescriptions, newest first. You can open a slip. You cannot open a person, and there is no patient search here on purpose.',
    at: '.pane h2',
  },
  {
    title: 'Scan it or type it',
    sd: 'نمبر',
    body: 'Point the scanner at the square on the slip, or type the number from the paper. Both land in the same box.',
    at: '.codebox, .fld input',
  },
  {
    title: 'Tick as you hand over',
    sd: 'دوا',
    body: 'Each line shows the exact count the paper says. Tick it when it goes into the bag.',
    at: '.line, .pane h2',
  },
  {
    title: 'Short on the shelf',
    body: 'Tap the count and enter what actually went. The record then says gave four, short six, in plain words, instead of pretending the course was complete.',
  },
  {
    title: 'A slip scanned twice',
    body: 'It tells you when it was given rather than raising an alarm. The person asking has usually lost a box, not their honesty.',
  },
]

const CLINICADMIN: TourStep[] = [
  {
    title: 'The building’s day',
    sd: 'اڊمن',
    body: 'Tokens, printed, waiting, and the money exactly as the desk counted it. Operations always, the clinical record never.',
    at: '.pane h2',
  },
  {
    title: 'By room, tonight',
    sd: 'ڪمرو',
    body: 'What each room’s tokens brought in, for settling with each doctor at closing. It is drawer arithmetic, not a scoreboard.',
    when: multi,
  },
  {
    title: 'Closing the drawer',
    body: 'Count the cash, type what you counted, and the screen says matches exactly, or over, or short, with the sentence worth writing down.',
    at: '.feebar, .fld',
  },
  {
    title: 'Watch two health lines',
    body: 'How old the last backup is, and whether the records are protected from browser cleanup. Nagging the doctor about the pen drive is part of this job.',
    at: '.line',
  },
  {
    title: 'What can never reach this desk',
    body: 'A prescription, a diagnosis, a history, a medicine name. Not by permission, not by asking. There is no route from this role to any of them.',
  },
]

export const TOURS: Partial<Record<Role, TourStep[]>> = {
  counter: COUNTER,
  compounder: COMPOUNDER,
  doctor: DOCTOR,
  pharmacy: PHARMACY,
  clinicadmin: CLINICADMIN,
}

/**
 * The steps this clinic actually needs, on the screen the person is looking at.
 *
 * `screen` defaults to the queue, which is where the tour has always opened.
 * A step with no `on` is a queue step, so every existing role is unchanged.
 */
export const tourFor = (r: Role, screen: Screen = 'queue'): TourStep[] =>
  (TOURS[r] ?? []).filter(s => (s.on ?? 'queue') === screen).filter(s => !s.when || s.when())

/* ------------------------------------------------------- seen, once, per role
 *
 * Per machine and per role, not per person: two compounders sharing one phone
 * are one pair of hands as far as this is concerned. A tour that reappears is
 * a tour people learn to dismiss without reading, so it opens itself exactly
 * once and lives in the menu after that.
 */
/** One mark per role PER SCREEN: seeing the queue's tour must not silently
 *  count as having seen the prescription screen's. */
const key = (r: Role, screen: Screen = 'queue') =>
  screen === 'queue' ? `nuskho.tour.${r}` : `nuskho.tour.${r}.${screen}`

export function tourSeen(r: Role, screen: Screen = 'queue'): boolean {
  try { return localStorage.getItem(key(r, screen)) === '1' } catch { return true }
}

export function noteTourSeen(r: Role, screen: Screen = 'queue'): void {
  try { localStorage.setItem(key(r, screen), '1') } catch { /* private mode: shows again, harmless */ }
}
