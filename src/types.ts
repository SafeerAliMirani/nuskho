// Data model. Two entities only.
// The token is a plain integer field on a Visit — never an entity, never a key.
// It resets each session and is a display label, not identity.

/**
 * WHAT IS IN THE BOX, AND IT IS NOT ALWAYS A PILL.
 *
 * This was tab, cap, syr and other, and `other` printed a tablet pictogram
 * with the word دوا beside it. So an eye drop imported from a market list came
 * out of the printer as a spoonful of syrup — `clean.ts` mapped the word
 * "drops" straight onto `syr` — and an inhaler came out as a tablet. The
 * patient who most needs the pictures is the one who cannot read the line
 * above them, so a wrong picture is not a cosmetic fault.
 *
 * `other` still exists and is now HONEST: no pictogram, no invented unit, and
 * the doctor's own written note carries it. Safeer, asked which forms Larkana
 * writes: drops by mouth, eye and ear and nose drops, cream, sachet, "also
 * other medicines i dont know". That last one is why `other` has to degrade
 * into silence rather than into a tablet.
 */
export type Form = 'tab' | 'cap' | 'syr' | 'drop' | 'cream' | 'sachet' | 'other'

/**
 * WHERE IT GOES. Only asked about the forms where it can differ.
 *
 * A drop by mouth for a baby and a drop into an eye are the same bottle shape
 * and completely different instructions, and "after food" is meaningless on an
 * eye drop. So a non-mouth route replaces the meal picture with the site: an
 * eye, an ear, a nose. Absent means by mouth, which is every tablet, capsule,
 * syrup and sachet ever written and so costs those nothing.
 */
export type Route = 'mouth' | 'eye' | 'ear' | 'nose' | 'skin'

export interface Drug {
  id: string
  /** checked by us and promoted into the shared catalogue. Screen only —
   *  this NEVER appears on a printed prescription. */
  verified?: boolean
  /** retired from the picker. The record stays: old prescriptions refer to it. */
  archived?: boolean
  addedAt?: number
  /** typed by the doctor mid-consultation; reusable by HIM immediately,
   *  but not a catalogue record until a human promotes it */
  pending?: boolean
  /** the Sindhi name has been checked by a person. Until then it is not printed. */
  sdReviewed?: boolean
  brand: string          // exactly as printed on the box — what the chemist reads
  generic: string
  sd: string             // Sindhi name, printed small under the brand
  form: Form
  /** where it goes. Absent means by mouth, which is nearly every medicine. */
  route?: Route
  strength: string
  unitSd: string         // گوري / ڪيپسول / چمچو / قطرا
  /**
   * How many millilitres one dose is, for a syrup.
   *
   * A spoon in a Pakistani clinic is the 5 ml cap that comes with the bottle,
   * and that is the default. It is here rather than assumed in the arithmetic
   * because it is a fact about THIS medicine: a few come with a 2.5 ml or a
   * 10 ml measure, and the chemist choosing between a 60 ml and a 120 ml bottle
   * is entitled to the right number. It never changes the DOSE, which is still
   * whatever the doctor tapped. It only chooses the bottle.
   */
  mlPerDose?: number
  /** his standing order for this drug — a default is not an error, it is how doctors work */
  defaultDays?: number
}

/** Doses on the grid. 0 = none, 1 = one, 0.5 = half. */
export interface Dose { m: number; d: number; n: number }

/**
 * What was actually printed for one medicine, copied onto the prescription at
 * the moment of printing.
 *
 * The medicine list is editable — spellings get corrected, duplicates merged,
 * entries retired. None of that may change what a patient is already holding,
 * and "what exactly did you prescribe in March" must be answerable years later
 * with the exact printed text. So a printed line stops depending on the drug
 * record and carries its own copy.
 */
export interface RxSnap {
  brand: string
  strength: string
  generic: string
  sd: string
  sdReviewed?: boolean
  unitSd: string
  form: Form
  route?: Route
  mlPerDose?: number
}

export interface RxLine {
  drugId: string
  dose: Dose
  meal: 'after' | 'before' | 'any'
  days: number
  note?: string          // free line for forms that do not fit the grid
  /** written at print time; from then on this, not drugId, is what was prescribed */
  snap?: RxSnap
  /** how many units the pharmacy counter actually handed over. Absent means
   *  not yet; smaller than the printed course means a short, on purpose. */
  given?: number
}

export interface Patient {
  id: string             // ULID — never the phone number
  /** 1..9999, printed on the slip with a check digit. The slip IS the patient card. */
  num: number
  name: string
  phone?: string         // optional. One phone serves a household here.
  age?: string
  sex?: 'M' | 'F'
  /** city or village. Patients travel in from all around Larkana, and where
   *  they came from is one of the few things worth counting. */
  city?: string
  createdAt: number
}

/**
 * How a visit ended.
 *
 * Not every token becomes a prescription. Someone gives up waiting, someone is
 * called away, someone arrives too sick for this room and is sent straight to
 * hospital. Those are outcomes, not failures, and a token left "waiting"
 * forever is a lie in the day's figures.
 */
export type VisitStatus =
  | 'waiting'      // in the queue
  | 'done'         // prescription printed
  | 'seen'         // seen, no prescription needed
  | 'left'         // gave up waiting / went away
  | 'cancelled'    // called off before being seen
  | 'referred'     // sent on — emergency or another doctor

export type FeeState = 'paid' | 'waived' | 'due'

/**
 * Money in a Larkana clinic moves before the consultation, not after.
 *
 * The counter takes the fee and issues the token; the compounder calls patients
 * in by number; and only then does the doctor sometimes decide this one pays
 * less, or nothing. So the amount here is what was actually taken at the door,
 * and `refund` is what the doctor decided the patient should get back — which
 * he collects on his way out, at the same counter.
 */
export interface Fee {
  /** what the counter actually took, in rupees */
  amount: number
  state: FeeState
  at: number
  /** set by the doctor when he reduces or waives a fee already collected */
  refund?: number
  /** why he reduced it, in his own words. Never printed. */
  refundNote?: string
  /** when the counter handed the money back */
  refundedAt?: number
}

export interface Visit {
  id: string
  patientId: string
  token: number          // display label only
  status: VisitStatus
  createdAt: number
  diagnosis?: string
  vitals?: Record<string, string>
  lines: RxLine[]
  tests: string[]
  advice: string[]
  /**
   * When the compounder took the money for the tests done in the room.
   *
   * The charges themselves are DERIVED from the readings (see testfees.ts), so
   * there is no separate list here to fall out of step with what was recorded.
   * This is only the moment the cash changed hands, outside the room, after the
   * patient stood up. Absent means still owed, and the day's figures say so.
   */
  testsPaidAt?: number
  printedAt?: number     // set on every successful print — this is the audit trail
  /** when the visit stopped being open, whatever the outcome */
  closedAt?: number
  /** why, in the doctor's or compounder's words, for anything but 'done' */
  closeNote?: string
  /**
   * Cannot wait. Set at the counter, by a person, looking at the patient.
   *
   * It changes nothing about the prescription and everything about the order of
   * the room: the row goes red and to the top, and the doctor's screen is told.
   * It is deliberately NOT a triage score or a severity scale — a compounder in
   * a corridor is not doing triage, he is saying "this one now", and a field
   * that pretends to be more than that invites it to be trusted more than it
   * should be.
   */
  urgent?: boolean
  /** the consultation fee. Absent means nobody recorded one, which is not the
   *  same as zero — the panel must be able to tell those apart. */
  fee?: Fee
  /** set when this prescription replaces an earlier printed one */
  amendsId?: string
  nextVisit?: string
  /** when the pharmacy counter finished handing this prescription over */
  dispensedAt?: number
  /**
   * Whose room this token belongs to, in a building with several doctors.
   * Absent means the first doctor — every visit from the solo era is his, and
   * a solo clinic keeps writing nothing here. See doctors.ts.
   */
  doctorId?: string
  /**
   * The doctor sent this patient on. Written on the SENDING consultation, and
   * only there — see refer.ts for why this fact is not stored twice.
   */
  sentOn?: SentOn
  /**
   * This token exists because another doctor sent the patient here. It holds
   * the id of HIS consultation, not a copy of it: the receiving doctor reads
   * the real record, and if the sender corrects something before the patient
   * has walked down the corridor, the correction is what is read.
   */
  fromVisitId?: string
}

/**
 * A patient sent on, in the sending doctor's own words.
 *
 * Either to a room in this building — `toDoctorId`, and a token appears in
 * that room's queue — or out of it entirely, to a hospital or a specialist in
 * another city, which is `toPlace` and a line on the printed slip.
 */
export interface SentOn {
  /** a room in this building */
  toDoctorId?: string
  /** somewhere else: "CMC Hospital, Larkana", "cardiologist, Karachi" */
  toPlace?: string
  /** why he is being sent. The doctor's own line, and it is PRINTED. */
  note: string
  at: number
  /** the token raised in the other room, when there was one */
  toVisitId?: string
}

/**
 * A set of medicines the doctor named and saved himself.
 *
 * Deliberately not learned. The machine never infers a set from a pattern and
 * never offers one because of a diagnosis, a patient or anything else: the
 * moment software proposes a drug the doctor did not choose, it stops being a
 * typewriter and starts being advice, and advice is a different product with a
 * different liability. A set is a thing he built, sitting where he left it.
 */
export interface RxSet {
  id: string
  name: string
  createdAt: number
  lines: RxLine[]
}
