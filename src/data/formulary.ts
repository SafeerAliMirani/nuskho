import type { Drug } from '../types'

/**
 * THE SINDHI IN THIS FILE WAS CHECKED ON 8 AUG 2026.
 *
 * Every Sindhi string that Nuskho prints was pulled out into one worksheet and
 * read by a Sindhi speaker on Safeer's side. Most of it came back fine. What
 * was wrong is corrected here, and the corrections are worth knowing because
 * they are all the same kind of mistake and the next person will make it too:
 *
 *   URDU WEARING SINDHI CLOTHES. خون for blood where a Sindhi speaker says رت.
 *   ڪمر for the back where he says پٺي. Both were perfectly correct words that
 *   nobody in Larkana would have used, which on this document is the same as
 *   being wrong.
 *
 *   GENDER. A ٽيسٽ is feminine in Sindhi, so it takes جي and not جو. Three of
 *   the six lab tests had it the other way round.
 *
 *   AND ONE THAT WAS NOT A NUANCE AT ALL. Constipation was listed as قبضو,
 *   which is not constipation. It means an illegal occupation of land. It is
 *   corrected to قبضي. It was on the doctor's screen and never on paper, which
 *   is the only reason it was not worse.
 *
 * The rule this file now inherits: a Sindhi string added here is a claim in a
 * language, and it does not become true by being typed carefully. It needs a
 * speaker.
 */

// THE MOST IMPORTANT FILE IN THE PILOT.
// This is not a national drug database and must never become one.
// Before the pilot evening: photograph 20 of THAT doctor's own handwritten
// prescriptions, transcribe what he actually prescribes, and replace this list.
// 30–50 entries. If the compounder has to search, entry is already too slow.

export const formulary: Drug[] = [
  { id: 'augmentin625', brand: 'AUGMENTIN', strength: '625 mg', generic: 'Amoxicillin + Clavulanic acid', sd: 'اوگمينتن', sdReviewed: false, form: 'tab', unitSd: 'گوري' },
  { id: 'panadol500',   brand: 'PANADOL',   strength: '500 mg', generic: 'Paracetamol',                   sd: 'پينادول', sdReviewed: false, form: 'tab', unitSd: 'گوري' },
  { id: 'risek20',      brand: 'RISEK',     strength: '20 mg',  generic: 'Omeprazole',                    sd: 'رائسيڪ', sdReviewed: false, form: 'cap', unitSd: 'ڪيپسول' },
  { id: 'brofex',       brand: 'BROFEX',    strength: 'syrup',  generic: 'Guaifenesin',                   sd: 'بروفيڪس', sdReviewed: false, form: 'syr', unitSd: 'چمچو' },
  { id: 'flagyl400',    brand: 'FLAGYL',    strength: '400 mg', generic: 'Metronidazole',                 sd: 'فليجل', sdReviewed: false,   form: 'tab', unitSd: 'گوري' },
  { id: 'motilium10',   brand: 'MOTILIUM',  strength: '10 mg',  generic: 'Domperidone',                   sd: 'موٽيليم', sdReviewed: false, form: 'tab', unitSd: 'گوري' },
  { id: 'ciproxin500',  brand: 'CIPROXIN',  strength: '500 mg', generic: 'Ciprofloxacin',                 sd: 'سپروڪسن', sdReviewed: false, form: 'tab', unitSd: 'گوري' },
  { id: 'calpol',       brand: 'CALPOL',    strength: 'syrup',  generic: 'Paracetamol',                   sd: 'ڪالپول', sdReviewed: false,  form: 'syr', unitSd: 'چمچو' },
  // The starter list now carries one of each shape that is not a pill, so a
  // doctor meets them on his first evening instead of discovering that the app
  // has no idea what an eye drop is.
  { id: 'ors',          brand: 'ORS',       strength: 'sachet', generic: 'Oral rehydration salts',         sd: '', sdReviewed: false, form: 'sachet', unitSd: '' },
  { id: 'tobrexdrops',  brand: 'TOBREX',    strength: 'eye drops', generic: 'Tobramycin',                  sd: '', sdReviewed: false, form: 'drop', route: 'eye', unitSd: '' },
  { id: 'polyfax',      brand: 'POLYFAX',   strength: 'ointment', generic: 'Polymyxin B + Bacitracin',     sd: '', sdReviewed: false, form: 'cream', route: 'skin', unitSd: '' },
]

/**
 * REMOVED, ON PURPOSE.
 *
 * There used to be two of these here, "Chest infection" and "Gastritis", each a
 * fixed set of medicines behind the name of a condition. They were ours, not any
 * doctor's, and they were wrong in a way that was easy to miss: a diagnosis is
 * not a prescription. Two patients with the same chest infection differ by age,
 * by weight, by what they are already taking and by what they reacted to last
 * year. A one-tap button that fills all three lines makes the difference
 * invisible at exactly the moment it matters.
 *
 * The doctor's OWN saved sets stay, and they are a different thing entirely: he
 * built them, from his own prescribing, and he knows what is in them. Nothing
 * we wrote goes into a prescription without him choosing every line of it.
 */
// The `packages` export (our pre-written prescription bundles) was removed on
// 12 Aug 2026: it had been an empty array with a type for months, promising a
// feature deliberately not built. The doctor's own saved sets are the real
// version of this idea and they live in db.ts.

/** stored on the visit as 'en|sd' */
export const labTests = [
  { en: 'CBC', sd: 'رت جي مڪمل ٽيسٽ' },
  { en: 'Blood sugar F/R', sd: 'بلڊ شگر' },
  { en: 'Urine R/E', sd: 'پيشاب جي ٽيسٽ' },
  { en: 'LFT', sd: 'جگر جي ٽيسٽ' },
  { en: 'RFT', sd: 'بڪين جي ٽيسٽ' },
  { en: 'Chest X-ray', sd: 'ڇاتيءَ جو ايڪسري' },
]

export const adviceList = [
  { en: 'Drink plenty of water', sd: 'گهڻو پاڻي پيئو', icon: 'water' },
  { en: "Keep medicine high up, out of children's reach", sd: 'دوا مٿي رکو — ٻارن جي پهچ کان پري', icon: 'reach' },
]

export const diagnoses = [
  'Fever', 'Chest infection', 'Gastritis', 'Hypertension',
  'Diabetes', 'Diarrhoea', 'Body ache', 'URTI',
]
