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
export type Form = 'tab' | 'cap' | 'syr' | 'drop' | 'cream' | 'sachet'
  | 'inhaler' | 'supp' | 'patch' | 'other'

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
  | 'inhale' | 'rectal' | 'vaginal'

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

/**
 * Doses on the grid. 0 = none, 1 = one, 0.5 = half.
 *
 * `e` is the EVENING, between midday and night, and it is optional for a
 * reason that outlives this note: every prescription written before it existed
 * has no `e`, and a required field would have made all of them invalid on the
 * day the app updated. Absent and zero mean the same thing everywhere, and
 * `(l.dose.e || 0)` is the only correct way to read it.
 *
 * Three slots covered almost everything a general practice writes. Four is
 * what an eye drop, amoxicillin and most six-hourly antibiotics actually need,
 * and until this existed a doctor writing QID had to put it in the free note,
 * where the pictograms cannot reach it and the patient who cannot read gets
 * nothing.
 */
export interface Dose { m: number; d: number; e?: number; n: number }

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
  /**
   * SOS — "when needed". When true the m/d/e/n grid and `days` are ignored: the
   * slip prints the prefix and reason instead of a schedule, and the total the
   * pharmacy and chemist read is `supply`, not a perDay x days sum. Absent means
   * a normal scheduled line, exactly as every prescription before this existed.
   */
  sos?: boolean
  /**
   * The reason chosen, FROZEN onto the line like the drug snapshot: `en` for the
   * record, `sd` for the slip. A blank `sd` prints the English, same rule as a
   * medicine whose Sindhi is unreviewed. Free text goes in `en` with `sd` empty.
   */
  sosReason?: { en: string; sd: string }
  /** how many units to dispense for an SOS line, since there is no days sum */
  supply?: number
  /** optional cap, printed as "do not take more than N a day" */
  sosMax?: number
  /**
   * WHICH EYE, OR WHICH EAR. Absent means both.
   *
   * On the LINE and not on the medicine, and that distinction is the whole
   * design. TOBREX is not a left-eye drug; this man's left eye is a fact about
   * tonight. Putting it on the Drug would have made the doctor keep two
   * TOBREX rows on his list and pick the right one under pressure.
   *
   * Until this existed the slip had exactly one thing it could say for an eye
   * drop, "in BOTH eyes", so a doctor treating one red eye printed a paper
   * telling the patient to medicate the healthy one too. For a steroid drop
   * that is a week of unnecessary steroid in a good eye.
   */
  side?: 'R' | 'L'
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
  /**
   * ALLERGIES AND STANDING CONDITIONS, IN THE DOCTOR'S OWN WORDS.
   *
   * The app has never known that a patient reacts to penicillin, and it is not
   * going to start deciding that for itself: there is no drug database here
   * worth trusting with that judgement, and a wrong warning is worse than
   * none. So this is a line a person writes and a person reads. It belongs to
   * the PATIENT, not the visit — an allergy does not expire when the token
   * does — it sits at the top of the prescription screen every single time,
   * and it prints on the slip so the chemist sees it too.
   */
  alert?: string
  createdAt: number
  /**
   * EVERY CORRECTION EVER MADE TO THIS RECORD, AND WHO MADE IT.
   *
   * A name typed wrong at the door is the commonest fault in the building and
   * until now it could not be fixed at all: the record was sealed the moment
   * the token printed. But letting a desk overwrite identity silently is the
   * more dangerous of the two mistakes, because the way it goes wrong is not a
   * typo. It is the desk correcting the RIGHT record with the WRONG person's
   * details — a returning patient found by the wrong number — and that quietly
   * rewrites somebody else's whole history under his own number, with nothing
   * anywhere to say it happened.
   *
   * So a correction is never destructive. The new details go on the record and
   * the old ones stay here, dated and attributed, for as long as the patient
   * does. It is bounded (see MAX_CORRECTIONS) so a hundred idle edits cannot
   * grow a record without limit, and it is never printed.
   */
  corrections?: Correction[]
  /**
   * THIS RECORD WAS FOLDED INTO ANOTHER, and this is the one it went into.
   *
   * Nothing in this app deletes a patient, and a merge is no exception: the
   * number was printed on a slip that is still in a drawer somewhere, and
   * five years from now that slip will be handed over at the desk. So the
   * merged-away record stays, with its number, as a signpost: findByCode
   * follows this to the record that lives on. It is not a patient any more.
   * It is left out of every list, every count and every household.
   */
  mergedInto?: string
}

/** One correction: when, by which role, and the fields AS THEY WERE. Only the
 *  fields that actually changed are kept, so an untouched field is absent
 *  rather than repeated. */
export interface Correction {
  at: number
  /** the role that made it, not a person: this app has no user accounts */
  by: string
  /** set when this entry records another record being folded into this one:
   *  the number that record carried, so the trail can be followed both ways */
  merged?: number
  was: {
    name?: string
    age?: string
    sex?: 'M' | 'F'
    phone?: string
    city?: string
  }
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

/**
 * The patient as he was named on a printed slip. Not a copy of the Patient:
 * only the five things the paper actually carries.
 */
export interface WhoSnap {
  name: string
  /** the number printed large on the slip. Frozen with the rest, because the
   *  slip IS the patient's card and the card must keep saying what it says. */
  num: number
  age?: string
  sex?: 'M' | 'F'
  /** the allergy band, exactly as it read when the chemist's copy was printed */
  alert?: string
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
  /**
   * Pregnant, as recorded in this room today.
   *
   * On the VISIT and not on the patient, because it is true for a while and
   * then it is not, and a flag that stays on for ever is a flag nobody reads.
   * The app attaches no rule to it: it prints, so the chemist and the next
   * doctor see it, and it is the doctor who knows what that means for what he
   * is writing. See clinical-decisions-needed.md.
   */
  pregnant?: boolean
  /**
   * This token was issued where nothing is charged.
   *
   * A visit with no fee could mean two opposite things — a charity evening, or
   * a counter that forgot — and the day's figures nag about the second. The
   * clinic's setting answers it today, but a setting is a fact about NOW and
   * the figures are about then: a clinic that ran free for a month and later
   * started charging would have that whole month reappear as missing
   * paperwork. So the answer is written on the token at the moment it is
   * issued, where it stays true for ever.
   */
  noFee?: boolean
  /**
   * WHO THIS SLIP WAS PRINTED FOR, copied onto the visit at the moment of
   * printing — the same act, and for the same reason, as the RxSnap on a line.
   *
   * The patient record can now be corrected (see Correction). Without this,
   * fixing a spelling in October would silently change what the app says it
   * printed in March, and a reprint of that March prescription would no longer
   * match the paper the patient is holding. The medicine list learned this
   * lesson first; identity is the same fact.
   *
   * Absent on every visit printed before this existed, and on every visit not
   * yet printed. Both fall back to the live patient record, which is what the
   * app has always done.
   */
  who?: WhoSnap
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
