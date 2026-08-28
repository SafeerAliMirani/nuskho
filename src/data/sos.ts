/**
 * SOS — "when needed" medicines, taken when a symptom appears rather than on the
 * morning/afternoon/night grid. Reviewed Sindhi, approved by Safeer 20 Aug 2026.
 *
 * The reason a doctor picks is FROZEN onto the RxLine as { en, sd }, so a printed
 * line never depends on this list staying the same, exactly like the drug
 * snapshot. This list is only what the picker offers.
 */

/** Printed before the reason: "جڏهن ضرورت هجي، سور لاءِ". */
export const SOS_PREFIX = 'جڏهن ضرورت هجي'

export type SosReason = { key: string; en: string; sd: string }

export const sosReasons: SosReason[] = [
  { key: 'pain', en: 'for pain', sd: 'سور لاءِ' },
  { key: 'fever', en: 'for fever', sd: 'تپ لاءِ' },
  { key: 'vomiting', en: 'for vomiting', sd: 'الٽيءَ لاءِ' },
  { key: 'cough', en: 'for cough', sd: 'کنگهه لاءِ' },
  { key: 'acidity', en: 'for acidity / heartburn', sd: 'تيزابيت يا سيني جي سڙڻ لاءِ' },
  { key: 'loose_motions', en: 'for loose motions', sd: 'دستن لاءِ' },
  { key: 'breath', en: 'for shortness of breath', sd: 'ساهه جي تڪليف لاءِ' },
  { key: 'itching', en: 'for itching / allergy', sd: 'خارش يا الرجيءَ لاءِ' },
  { key: 'headache', en: 'for headache', sd: 'مٿي جي سور لاءِ' },
  { key: 'nausea', en: 'for nausea', sd: 'دل ڪچي ٿيڻ لاءِ' },
  { key: 'burning_urination', en: 'for burning urination', sd: 'پيشاب جي سڙڻ لاءِ' },
  { key: 'cramps', en: 'for abdominal cramps', sd: 'پيٽ جي پچيڪن / مروڙ لاءِ' },
  { key: 'dizziness', en: 'for dizziness', sd: 'چڪر اچڻ جي صورت ۾' },
  { key: 'gas', en: 'for gas / flatulence', sd: 'گئس يا پيٽ ڦرجڻ لاءِ' },
]

/** "Do not take more than N in a day", printed only when the doctor sets a cap. */
export const sosMaxLine = (n: number): string =>
  `هڪ ڏينهن ۾ ${n} کان وڌيڪ استعمال نه ڪريو`
