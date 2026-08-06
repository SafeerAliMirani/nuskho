/**
 * WHAT THIS DOCTOR ACTUALLY DIAGNOSES.
 *
 * There were eight diagnoses hard-coded in the app: Fever, Chest infection,
 * Gastritis, Hypertension, Diabetes, Diarrhoea, Body ache, URTI. That is a
 * general physician's list, and a reasonable one, and it is useless to a skin
 * specialist, an eye surgeon or a child specialist — who are most of the private
 * doctors in Larkana with a queue outside the door.
 *
 * A specialist who opens the app and sees somebody else's diagnoses learns two
 * things in the first ten seconds: that this was not built for him, and that he
 * will be typing all evening. Both are enough to lose him.
 *
 * SO THE LIST IS HIS, AND THESE ARE ONLY A STARTING POINT.
 *
 * He picks his field once during setup, gets a list he recognises, and then
 * edits it: delete what he never writes, add what he writes daily. What he ends
 * up with is stored with his profile and is the only list he ever sees.
 *
 * WHAT THESE LISTS ARE AND ARE NOT
 *
 *   - They are the COMMON, OBVIOUS conditions of each field, the ones a doctor
 *     writes many times a week. They are not a classification, not ICD, and not
 *     an attempt at completeness. A list of 400 diagnoses is a list nobody
 *     scrolls, and scrolling is the thing this feature exists to remove.
 *   - Nothing here is diagnostic help. Tapping a chip records what the doctor
 *     already decided. The app has no opinion about what is wrong with anybody,
 *     it never suggests a diagnosis from symptoms, and it must never start.
 *   - The Sindhi is what a patient is actually told in the room, which is often
 *     not a translation of the English. "URTI" is not a thing anyone says out
 *     loud; "ٿڌ ۽ کنگهه" is.
 *
 * The Sindhi below still needs a second reader before a pilot, exactly like the
 * medicine names, and for the same reason.
 */

export interface Specialty {
  id: string
  /** what the doctor calls himself, in the words used on a signboard here */
  name: string
  sd: string
  dx: [en: string, sd: string][]
}

export const SPECIALTIES: Specialty[] = [
  {
    id: 'gp', name: 'General physician', sd: 'جنرل فزيشن',
    dx: [
      ['Fever', 'بخار'],
      ['Cold and cough', 'ٿڌ ۽ کنگهه'],
      ['Chest infection', 'ڇاتيءَ جي انفيڪشن'],
      ['Throat infection', 'نڙيءَ جي سوز'],
      ['Gastritis', 'معدي جي سوز'],
      ['Diarrhoea', 'دست'],
      ['Body ache', 'بدن ۾ سور'],
      ['Headache', 'مٿي جو سور'],
      ['High blood pressure', 'بلڊ پريشر'],
      ['Diabetes', 'شگر'],
      ['Weakness', 'ڪمزوري'],
      ['Urine infection', 'پيشاب جي انفيڪشن'],
      ['Worms', 'پيٽ جا ڪينئان'],
      ['Anaemia', 'رت جي گھٽتائي'],
      ['Malaria', 'مليريا'],
      ['Typhoid', 'ٽائيفائيڊ'],
    ],
  },
  {
    id: 'child', name: 'Child specialist', sd: 'ٻارن جو ڊاڪٽر',
    dx: [
      ['Fever', 'بخار'],
      ['Cold and cough', 'ٿڌ ۽ کنگهه'],
      ['Chest infection', 'ڇاتيءَ جي انفيڪشن'],
      ['Diarrhoea', 'دست'],
      ['Vomiting', 'الٽي'],
      ['Dehydration', 'پاڻيءَ جي گھٽتائي'],
      ['Worms', 'پيٽ جا ڪينئان'],
      ['Ear infection', 'ڪن جي انفيڪشن'],
      ['Skin rash', 'چمڙيءَ تي ڦڦڙي'],
      ['Malnutrition', 'غذائي گھٽتائي'],
      ['Anaemia', 'رت جي گھٽتائي'],
      ['Asthma', 'دم'],
      ['Teething', 'ڏند نڪرڻ'],
      ['Routine check', 'عام معائنو'],
    ],
  },
  {
    id: 'skin', name: 'Skin specialist', sd: 'چمڙيءَ جو ڊاڪٽر',
    dx: [
      ['Eczema', 'ايگزيما'],
      ['Fungal infection', 'ڦڦوندي جي انفيڪشن'],
      ['Scabies', 'کجلي'],
      ['Acne', 'ڦِڪا'],
      ['Psoriasis', 'سوريائسس'],
      ['Allergy', 'الرجي'],
      ['Hair fall', 'وارن جو ڪرڻ'],
      ['Vitiligo', 'ڦُلبهري'],
      ['Boils', 'ڦرڙيون'],
      ['Warts', 'مَسا'],
      ['Dandruff', 'سِڪَر'],
      ['Melasma', 'منهن جا داغ'],
    ],
  },
  {
    id: 'heart', name: 'Heart specialist', sd: 'دل جو ڊاڪٽر',
    dx: [
      ['High blood pressure', 'بلڊ پريشر'],
      ['Ischaemic heart disease', 'دل جي رڳن جي بيماري'],
      ['Heart failure', 'دل جي ڪمزوري'],
      ['Chest pain', 'ڇاتيءَ جو سور'],
      ['Irregular heartbeat', 'دل جي ڌڙڪڻ ۾ بي ترتيبي'],
      ['High cholesterol', 'ڪوليسٽرول جي واڌ'],
      ['After heart attack', 'دل جي دوري کان پوءِ'],
      ['Rheumatic heart disease', 'ريوميٽڪ دل جي بيماري'],
      ['Routine check', 'عام معائنو'],
    ],
  },
  {
    id: 'chest', name: 'Chest specialist', sd: 'ڇاتيءَ جو ڊاڪٽر',
    dx: [
      ['Asthma', 'دم'],
      ['Chest infection', 'ڇاتيءَ جي انفيڪشن'],
      ['Pneumonia', 'نمونيا'],
      ['COPD', 'ڦڦڙن جي پراڻي بيماري'],
      ['Tuberculosis', 'ٽي بي'],
      ['Allergic cough', 'الرجي واري کنگهه'],
      ['Pleural effusion', 'ڦڦڙن ۾ پاڻي'],
      ['Smoking related', 'سگريٽ سبب'],
    ],
  },
  {
    id: 'gastro', name: 'Stomach and liver', sd: 'معدي ۽ جگر جو ڊاڪٽر',
    dx: [
      ['Gastritis', 'معدي جي سوز'],
      ['Acid reflux', 'تيزابيت'],
      ['Peptic ulcer', 'معدي جو زخم'],
      ['Hepatitis B', 'يرقان بي'],
      ['Hepatitis C', 'يرقان سي'],
      ['Fatty liver', 'جگر تي چرٻي'],
      ['Irritable bowel', 'آنڊن جي خرابي'],
      ['Constipation', 'قبضو'],
      ['Piles', 'بواسير'],
      ['Diarrhoea', 'دست'],
      ['Worms', 'پيٽ جا ڪينئان'],
    ],
  },
  {
    id: 'gynae', name: 'Gynaecologist', sd: 'زنانين بيمارين جي ڊاڪٽر',
    dx: [
      ['Pregnancy check', 'حمل جو معائنو'],
      ['Anaemia in pregnancy', 'حمل ۾ رت جي گھٽتائي'],
      ['Irregular periods', 'ماهواري ۾ بي ترتيبي'],
      ['Heavy bleeding', 'وڌيڪ رتوجهو'],
      ['Urine infection', 'پيشاب جي انفيڪشن'],
      ['Vaginal infection', 'اندروني انفيڪشن'],
      ['PCOS', 'پي سي او ايس'],
      ['Infertility', 'اولاد نه ٿيڻ'],
      ['Menopause', 'ماهواري بند ٿيڻ'],
      ['Family planning', 'خاندانی منصوبابندي'],
    ],
  },
  {
    id: 'ortho', name: 'Bone specialist', sd: 'هڏن جو ڊاڪٽر',
    dx: [
      ['Back pain', 'ڪمر جو سور'],
      ['Knee pain', 'گوڏي جو سور'],
      ['Arthritis', 'جوڙن جو سور'],
      ['Fracture', 'هڏي ڀڄڻ'],
      ['Sprain', 'موچ'],
      ['Frozen shoulder', 'ڪلهي جي جڪڙ'],
      ['Slipped disc', 'مُهري جو سرڻ'],
      ['Gout', 'گَٺيا'],
      ['Neck pain', 'ڳچيءَ جو سور'],
      ['Calcium deficiency', 'ڪلشيم جي گھٽتائي'],
    ],
  },
  {
    id: 'eye', name: 'Eye specialist', sd: 'اکين جو ڊاڪٽر',
    dx: [
      ['Conjunctivitis', 'اکين جي سوز'],
      ['Cataract', 'اڇو موتيو'],
      ['Glaucoma', 'ڪارو موتيو'],
      ['Refractive error', 'نظر جي ڪمزوري'],
      ['Dry eye', 'اکين جي سُڪَ'],
      ['Diabetic retinopathy', 'شگر سبب اکين جو اثر'],
      ['Stye', 'ڦَرُڙي'],
      ['Allergy', 'الرجي'],
    ],
  },
  {
    id: 'ent', name: 'Ear, nose and throat', sd: 'ڪن نڪ نڙي جو ڊاڪٽر',
    dx: [
      ['Throat infection', 'نڙيءَ جي سوز'],
      ['Ear infection', 'ڪن جي انفيڪشن'],
      ['Sinusitis', 'نڪ جي سوز'],
      ['Tonsillitis', 'ٽانسل'],
      ['Allergic rhinitis', 'نڪ جي الرجي'],
      ['Hearing loss', 'ٻڌڻ ۾ ڏکيائي'],
      ['Nose bleed', 'نڪ مان رت'],
      ['Vertigo', 'چڪر'],
    ],
  },
  {
    id: 'diabetes', name: 'Diabetes and hormones', sd: 'شگر ۽ هارمون جو ڊاڪٽر',
    dx: [
      ['Type 2 diabetes', 'ٽائيپ ٻه شگر'],
      ['Type 1 diabetes', 'ٽائيپ هڪ شگر'],
      ['Diabetes in pregnancy', 'حمل ۾ شگر'],
      ['Thyroid — low', 'ٿائرائيڊ گھٽ'],
      ['Thyroid — high', 'ٿائرائيڊ وڌيڪ'],
      ['Obesity', 'ٿولهه'],
      ['High cholesterol', 'ڪوليسٽرول جي واڌ'],
      ['Diabetic foot', 'شگر سبب پيرن جو زخم'],
      ['Vitamin D deficiency', 'وٽامن ڊي جي گھٽتائي'],
    ],
  },
  {
    id: 'neuro', name: 'Brain and nerves', sd: 'دماغ ۽ نسن جو ڊاڪٽر',
    dx: [
      ['Headache', 'مٿي جو سور'],
      ['Migraine', 'اڌ مٿي جو سور'],
      ['Epilepsy', 'مرگهي'],
      ['Stroke', 'فالج'],
      ['Facial palsy', 'منهن جو فالج'],
      ['Neuropathy', 'نسن جي ڪمزوري'],
      ['Vertigo', 'چڪر'],
      ['Parkinson', 'ڪنبڻي جي بيماري'],
    ],
  },
  {
    id: 'urology', name: 'Kidney and urine', sd: 'گردي ۽ پيشاب جو ڊاڪٽر',
    dx: [
      ['Urine infection', 'پيشاب جي انفيڪشن'],
      ['Kidney stone', 'گردي جي پٿري'],
      ['Prostate enlargement', 'پروسٽيٽ جي واڌ'],
      ['Chronic kidney disease', 'گردي جي پراڻي بيماري'],
      ['Blood in urine', 'پيشاب ۾ رت'],
      ['Bladder stone', 'مثاني جي پٿري'],
    ],
  },
  {
    id: 'psych', name: 'Mental health', sd: 'ذهني صحت جو ڊاڪٽر',
    dx: [
      ['Anxiety', 'پريشاني'],
      ['Depression', 'ڊپريشن'],
      ['Sleep problem', 'ننڊ جي تڪليف'],
      ['Panic attacks', 'گھٻراهٽ جو دورو'],
      ['Substance use', 'نشي جو استعمال'],
      ['Stress related', 'ذهني دٻاءُ'],
    ],
  },
]

export const specialtyById = (id: string) => SPECIALTIES.find(s => s.id === id)

/** What a new clinic starts with, before the doctor edits it. */
export function seedDiagnoses(id: string): string[] {
  return (specialtyById(id) ?? SPECIALTIES[0]).dx.map(([en]) => en)
}

/** The Sindhi we know for a diagnosis, from any list. Blank when we do not.
 *  Never guessed: an invented Sindhi diagnosis on a printed slip is worse than
 *  no Sindhi at all, and unlike a medicine name nobody can check it at a counter. */
const SD = new Map<string, string>()
for (const s of SPECIALTIES) for (const [en, sd] of s.dx) if (!SD.has(en)) SD.set(en, sd)
export const diagnosisSd = (en: string): string => SD.get(en.trim()) ?? ''
