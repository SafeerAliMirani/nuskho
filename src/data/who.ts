/**
 * The WHO Model List of Essential Medicines, 24th list (2025), as a spine.
 *
 * WHY THIS FILE EXISTS AND WHAT IT IS NOT
 *
 * It is NOT a medicine catalogue and it can never become one. There is not a
 * single brand name in it, because WHO does not name brands. No doctor in
 * Larkana writes "amoxicillin + clavulanic acid" on a slip; he writes AUGMENTIN
 * 625. So nothing here is prescribable and nothing here appears in the doctor's
 * picker. Adding it to the picker would be the same mistake as importing a
 * national register: rows nobody checked, one tap from a printed slip.
 *
 * What it IS, is the FORMULA COLUMN. Every brand on earth is one of these few
 * hundred molecules wearing a different name. That gives us four things a brand
 * list cannot:
 *
 *  1. The generic field stops being free text. The doctor picks the formula
 *     from a closed list instead of typing "amoxicillin+clav" one night and
 *     "Co-amoxiclav" the next, and the two never merge.
 *
 *  2. Sindhi becomes FINITE. Brands are endless; formulas are not. Pirah
 *     reviews one Sindhi name for paracetamol, and PANADOL, CALPOL, FEVRIL and
 *     every future brand of it inherit a checked word. This is the whole
 *     argument for the file. Six hundred rows, reviewed once, forever.
 *
 *  3. Duplicate detection gets a second axis. PANADOL 500 and CALPOL syrup look
 *     nothing alike as strings and are the same molecule. Only the formula
 *     column can warn a doctor he has written paracetamol twice.
 *
 *  4. Antibiotics carry their WHO AWaRe group. That is published stewardship
 *     guidance, it is free, and it is the one thing in this file that is
 *     clinical rather than clerical.
 *
 * PROVENANCE. Transcribed from the published 24th list. WHO publishes the EML
 * to be copied and adapted by national programmes; that is its stated purpose.
 * The `sd` column is OURS and starts empty — WHO has no Sindhi, and the rule
 * that no unreviewed Sindhi is ever printed applies here exactly as everywhere
 * else.
 *
 * INCOMPLETE, ON PURPOSE AND ADMITTED. The sections below are the ones an
 * outpatient clinic in Larkana reaches for. Roughly a third of the full list is
 * oncology, anaesthesia, dialysis and ward medicine that no GP prescribes, and
 * a handful of sections have not been transcribed yet. A missing formula is
 * never a blocker: the doctor types his own and it goes to the review queue,
 * the same path everything else takes.
 */

export type Aware = 'Access' | 'Watch' | 'Reserve'

export interface WhoGeneric {
  /** the INN exactly as WHO prints it. This string is the join key. */
  name: string
  /** plain-English class, for grouping the picker and reading the worksheet */
  cls: string
  /** oral strengths only — what a clinic actually writes. '' = injection/topical only */
  oral: string
  /** WHO AWaRe stewardship group. Antibacterials only. */
  aware?: Aware
  /** Sindhi. OURS, not WHO's. Blank until a person who reads Sindhi has read it. */
  sd: string
}

export const WHO_EDITION = '24th list, 2025'

export const who: WhoGeneric[] = [
  /* ---------------------------------------------------- pain, fever, headache */
  { name: 'Paracetamol', cls: 'Pain and fever', oral: '250 mg; 325 mg; 500 mg; 120 mg/5 mL; 250 mg/5 mL', sd: '' },
  { name: 'Ibuprofen', cls: 'Pain and fever', oral: '200 mg; 400 mg; 600 mg; 100 mg/5 mL; 200 mg/5 mL', sd: '' },
  { name: 'Acetylsalicylic acid', cls: 'Pain and fever', oral: '100 mg to 500 mg', sd: '' },
  { name: 'Codeine', cls: 'Pain and fever', oral: '30 mg', sd: '' },
  { name: 'Morphine', cls: 'Pain and fever', oral: '10 mg; 5 mg/5 mL; 10 mg/5 mL', sd: '' },
  { name: 'Sumatriptan', cls: 'Headache', oral: '50 mg', sd: '' },

  /* ------------------------------------------- allergy, steroids, anaphylaxis */
  { name: 'Loratadine', cls: 'Allergy', oral: '10 mg; 1 mg/mL', sd: '' },
  { name: 'Prednisolone', cls: 'Steroid', oral: '1 mg; 5 mg; 10 mg; 25 mg; 5 mg/mL', sd: '' },
  { name: 'Dexamethasone', cls: 'Steroid', oral: '0.5 mg; 0.75 mg; 1.5 mg; 2 mg; 4 mg', sd: '' },
  { name: 'Hydrocortisone', cls: 'Steroid', oral: '', sd: '' },
  { name: 'Epinephrine (adrenaline)', cls: 'Anaphylaxis', oral: '', sd: '' },

  /* ------------------------------------------------ antibacterials — Access */
  { name: 'Amoxicillin', cls: 'Antibiotic', oral: '250 mg; 500 mg; 1 g; 125 mg/5 mL; 250 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Amoxicillin + clavulanic acid', cls: 'Antibiotic', oral: '500 mg + 125 mg; 875 mg + 125 mg; 125 mg + 31.25 mg/5 mL; 250 mg + 62.5 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Ampicillin', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },
  { name: 'Benzathine benzylpenicillin', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },
  { name: 'Benzylpenicillin', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },
  { name: 'Phenoxymethylpenicillin', cls: 'Antibiotic', oral: '250 mg; 500 mg; 250 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Procaine benzylpenicillin', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },
  { name: 'Cloxacillin', cls: 'Antibiotic', oral: '250 mg; 500 mg; 1 g; 125 mg/5 mL; 250 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Cefalexin', cls: 'Antibiotic', oral: '250 mg; 500 mg; 125 mg/5 mL; 250 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Cefazolin', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },
  { name: 'Doxycycline', cls: 'Antibiotic', oral: '50 mg; 100 mg; 25 mg/5 mL; 50 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Metronidazole', cls: 'Antibiotic', oral: '200 mg; 250 mg; 400 mg; 500 mg; 200 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Nitrofurantoin', cls: 'Antibiotic', oral: '50 mg; 100 mg; 25 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Sulfamethoxazole + trimethoprim', cls: 'Antibiotic', oral: '400 mg + 80 mg; 800 mg + 160 mg; 200 mg + 40 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Trimethoprim', cls: 'Antibiotic', oral: '100 mg; 200 mg; 50 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Clindamycin', cls: 'Antibiotic', oral: '150 mg; 75 mg/5 mL', aware: 'Access', sd: '' },
  { name: 'Chloramphenicol', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },
  { name: 'Gentamicin', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },
  { name: 'Amikacin', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },
  { name: 'Spectinomycin', cls: 'Antibiotic', oral: '', aware: 'Access', sd: '' },

  /* ------------------------------------------------- antibacterials — Watch */
  { name: 'Azithromycin', cls: 'Antibiotic', oral: '250 mg; 500 mg; 200 mg/5 mL', aware: 'Watch', sd: '' },
  { name: 'Clarithromycin', cls: 'Antibiotic', oral: '250 mg; 500 mg; 125 mg/5 mL; 250 mg/5 mL', aware: 'Watch', sd: '' },
  { name: 'Cefixime', cls: 'Antibiotic', oral: '200 mg; 400 mg; 100 mg/5 mL', aware: 'Watch', sd: '' },
  { name: 'Ciprofloxacin', cls: 'Antibiotic', oral: '100 mg; 250 mg; 500 mg; 250 mg/5 mL', aware: 'Watch', sd: '' },
  { name: 'Cefotaxime', cls: 'Antibiotic', oral: '', aware: 'Watch', sd: '' },
  { name: 'Ceftriaxone', cls: 'Antibiotic', oral: '', aware: 'Watch', sd: '' },
  { name: 'Cefuroxime', cls: 'Antibiotic', oral: '', aware: 'Watch', sd: '' },
  { name: 'Ceftazidime', cls: 'Antibiotic', oral: '', aware: 'Watch', sd: '' },
  { name: 'Meropenem', cls: 'Antibiotic', oral: '', aware: 'Watch', sd: '' },
  { name: 'Piperacillin + tazobactam', cls: 'Antibiotic', oral: '', aware: 'Watch', sd: '' },
  { name: 'Vancomycin', cls: 'Antibiotic', oral: '125 mg; 250 mg', aware: 'Watch', sd: '' },

  /* ----------------------------------------------- antibacterials — Reserve */
  { name: 'Linezolid', cls: 'Antibiotic', oral: '600 mg; 150 mg; 100 mg/5 mL', aware: 'Reserve', sd: '' },
  { name: 'Colistin', cls: 'Antibiotic', oral: '', aware: 'Reserve', sd: '' },
  { name: 'Polymyxin B', cls: 'Antibiotic', oral: '', aware: 'Reserve', sd: '' },
  { name: 'Cefiderocol', cls: 'Antibiotic', oral: '', aware: 'Reserve', sd: '' },
  { name: 'Ceftazidime + avibactam', cls: 'Antibiotic', oral: '', aware: 'Reserve', sd: '' },
  { name: 'Ceftolozane + tazobactam', cls: 'Antibiotic', oral: '', aware: 'Reserve', sd: '' },
  { name: 'Meropenem + vaborbactam', cls: 'Antibiotic', oral: '', aware: 'Reserve', sd: '' },
  { name: 'Fosfomycin', cls: 'Antibiotic', oral: '', aware: 'Reserve', sd: '' },
  { name: 'Plazomicin', cls: 'Antibiotic', oral: '', aware: 'Reserve', sd: '' },

  /* ---------------------------------------------------------------- worms */
  { name: 'Albendazole', cls: 'Worms', oral: '200 mg; 400 mg', sd: '' },
  { name: 'Mebendazole', cls: 'Worms', oral: '100 mg; 500 mg', sd: '' },
  { name: 'Ivermectin', cls: 'Worms', oral: '3 mg', sd: '' },
  { name: 'Levamisole', cls: 'Worms', oral: '50 mg; 150 mg', sd: '' },
  { name: 'Niclosamide', cls: 'Worms', oral: '500 mg', sd: '' },
  { name: 'Praziquantel', cls: 'Worms', oral: '150 mg; 500 mg; 600 mg', sd: '' },
  { name: 'Pyrantel', cls: 'Worms', oral: '250 mg', sd: '' },
  { name: 'Diethylcarbamazine', cls: 'Worms', oral: '50 mg; 100 mg', sd: '' },
  { name: 'Triclabendazole', cls: 'Worms', oral: '250 mg', sd: '' },

  /* ------------------------------------------------------------- fungal */
  { name: 'Fluconazole', cls: 'Fungal', oral: '50 mg; 50 mg/5 mL', sd: '' },
  { name: 'Itraconazole', cls: 'Fungal', oral: '100 mg; 10 mg/mL', sd: '' },
  { name: 'Griseofulvin', cls: 'Fungal', oral: '125 mg; 250 mg; 125 mg/5 mL', sd: '' },
  { name: 'Nystatin', cls: 'Fungal', oral: '500 000 IU; 100 000 IU/mL', sd: '' },
  { name: 'Voriconazole', cls: 'Fungal', oral: '50 mg; 200 mg; 40 mg/mL', sd: '' },
  { name: 'Flucytosine', cls: 'Fungal', oral: '250 mg', sd: '' },
  { name: 'Clotrimazole', cls: 'Fungal', oral: '', sd: '' },
  { name: 'Amphotericin B', cls: 'Fungal', oral: '', sd: '' },
  { name: 'Terbinafine', cls: 'Skin', oral: '', sd: '' },
  { name: 'Miconazole', cls: 'Skin', oral: '', sd: '' },

  /* -------------------------------------------------------------- viral */
  { name: 'Aciclovir', cls: 'Viral', oral: '200 mg; 200 mg/5 mL', sd: '' },
  { name: 'Oseltamivir', cls: 'Viral', oral: '30 mg; 45 mg; 75 mg; 6 mg/mL', sd: '' },
  { name: 'Lamivudine', cls: 'HIV', oral: '150 mg; 50 mg/5 mL', sd: '' },
  { name: 'Zidovudine', cls: 'HIV', oral: '250 mg; 300 mg; 50 mg/5 mL', sd: '' },
  { name: 'Abacavir', cls: 'HIV', oral: '300 mg', sd: '' },
  { name: 'Tenofovir disoproxil fumarate', cls: 'HIV', oral: '300 mg', sd: '' },
  { name: 'Efavirenz', cls: 'HIV', oral: '600 mg', sd: '' },
  { name: 'Nevirapine', cls: 'HIV', oral: '50 mg; 200 mg; 50 mg/5 mL', sd: '' },
  { name: 'Dolutegravir', cls: 'HIV', oral: '10 mg; 50 mg', sd: '' },
  { name: 'Ritonavir', cls: 'HIV', oral: '25 mg; 100 mg', sd: '' },
  { name: 'Lopinavir + ritonavir', cls: 'HIV', oral: '100 mg + 25 mg; 200 mg + 50 mg', sd: '' },
  { name: 'Entecavir', cls: 'Hepatitis', oral: '0.5 mg; 1 mg; 0.05 mg/mL', sd: '' },
  { name: 'Sofosbuvir', cls: 'Hepatitis', oral: '200 mg; 400 mg', sd: '' },
  { name: 'Sofosbuvir + velpatasvir', cls: 'Hepatitis', oral: '200 mg + 50 mg; 400 mg + 100 mg', sd: '' },
  { name: 'Daclatasvir', cls: 'Hepatitis', oral: '30 mg; 60 mg', sd: '' },
  { name: 'Ledipasvir + sofosbuvir', cls: 'Hepatitis', oral: '90 mg + 400 mg', sd: '' },
  { name: 'Ribavirin', cls: 'Hepatitis', oral: '200 mg; 400 mg; 600 mg', sd: '' },

  /* -------------------------------------------------- malaria, amoeba, giardia */
  { name: 'Artemether + lumefantrine', cls: 'Malaria', oral: '20 mg + 120 mg', sd: '' },
  { name: 'Artesunate + amodiaquine', cls: 'Malaria', oral: '25 mg + 67.5 mg; 50 mg + 135 mg; 100 mg + 270 mg', sd: '' },
  { name: 'Artesunate + mefloquine', cls: 'Malaria', oral: '25 mg + 50 mg; 100 mg + 200 mg', sd: '' },
  { name: 'Dihydroartemisinin + piperaquine', cls: 'Malaria', oral: '20 mg + 160 mg; 40 mg + 320 mg; 60 mg + 480 mg; 80 mg + 640 mg', sd: '' },
  { name: 'Chloroquine', cls: 'Malaria', oral: '150 mg; 50 mg/5 mL', sd: '' },
  { name: 'Primaquine', cls: 'Malaria', oral: '7.5 mg; 15 mg', sd: '' },
  { name: 'Mefloquine', cls: 'Malaria', oral: '250 mg', sd: '' },
  { name: 'Sulfadoxine + pyrimethamine', cls: 'Malaria', oral: '250 mg + 12.5 mg; 500 mg + 25 mg', sd: '' },
  { name: 'Pyrimethamine', cls: 'Parasites', oral: '25 mg', sd: '' },
  { name: 'Sulfadiazine', cls: 'Parasites', oral: '500 mg', sd: '' },
  { name: 'Diloxanide', cls: 'Parasites', oral: '500 mg', sd: '' },

  /* ------------------------------------------------------------ fits, nerves */
  { name: 'Carbamazepine', cls: 'Fits', oral: '100 mg; 200 mg; 400 mg; 100 mg/5 mL', sd: '' },
  { name: 'Phenytoin', cls: 'Fits', oral: '25 mg; 50 mg; 100 mg; 30 mg/5 mL', sd: '' },
  { name: 'Phenobarbital', cls: 'Fits', oral: '15 mg; 30 mg; 60 mg; 100 mg; 15 mg/5 mL', sd: '' },
  { name: 'Valproic acid (sodium valproate)', cls: 'Fits', oral: '100 mg; 200 mg; 500 mg; 200 mg/5 mL', sd: '' },
  { name: 'Lamotrigine', cls: 'Fits', oral: '25 mg; 50 mg; 100 mg; 200 mg', sd: '' },
  { name: 'Levetiracetam', cls: 'Fits', oral: '250 mg; 500 mg; 750 mg; 1000 mg; 100 mg/mL', sd: '' },
  { name: 'Ethosuximide', cls: 'Fits', oral: '250 mg; 250 mg/5 mL', sd: '' },
  { name: 'Diazepam', cls: 'Fits', oral: '', sd: '' },
  { name: 'Lorazepam', cls: 'Fits', oral: '', sd: '' },
  { name: 'Midazolam', cls: 'Fits', oral: '', sd: '' },
  { name: 'Magnesium sulfate', cls: 'Fits', oral: '', sd: '' },
  { name: 'Levodopa + carbidopa', cls: 'Parkinson', oral: '100 mg + 10 mg; 100 mg + 25 mg; 250 mg + 25 mg', sd: '' },
  { name: 'Biperiden', cls: 'Parkinson', oral: '2 mg', sd: '' },

  /* ------------------------------------------------------------------ heart */
  { name: 'Amlodipine', cls: 'Blood pressure', oral: '5 mg', sd: '' },
  { name: 'Bisoprolol', cls: 'Heart', oral: '1.25 mg; 5 mg', sd: '' },
  { name: 'Propranolol', cls: 'Heart', oral: '10 mg; 40 mg', sd: '' },
  { name: 'Enalapril', cls: 'Blood pressure', oral: '2.5 mg; 5 mg; 10 mg; 1 mg/mL', sd: '' },
  { name: 'Losartan', cls: 'Blood pressure', oral: '25 mg; 50 mg; 100 mg', sd: '' },
  { name: 'Hydrochlorothiazide', cls: 'Blood pressure', oral: '12.5 mg; 25 mg; 50 mg/5 mL', sd: '' },
  { name: 'Methyldopa', cls: 'Blood pressure', oral: '250 mg', sd: '' },
  { name: 'Hydralazine', cls: 'Blood pressure', oral: '25 mg; 50 mg', sd: '' },
  { name: 'Furosemide', cls: 'Heart', oral: '20 mg; 40 mg; 20 mg/5 mL; 50 mg/5 mL', sd: '' },
  { name: 'Spironolactone', cls: 'Heart', oral: '25 mg', sd: '' },
  { name: 'Digoxin', cls: 'Heart', oral: '62.5 micrograms; 125 micrograms; 250 micrograms; 50 micrograms/mL', sd: '' },
  { name: 'Verapamil', cls: 'Heart', oral: '40 mg; 80 mg; 120 mg; 180 mg; 240 mg', sd: '' },
  { name: 'Amiodarone', cls: 'Heart', oral: '100 mg; 200 mg; 400 mg', sd: '' },
  { name: 'Glyceryl trinitrate', cls: 'Heart', oral: '500 micrograms sublingual', sd: '' },
  { name: 'Isosorbide dinitrate', cls: 'Heart', oral: '5 mg sublingual', sd: '' },
  { name: 'Clopidogrel', cls: 'Blood', oral: '75 mg; 300 mg', sd: '' },
  { name: 'Simvastatin', cls: 'Cholesterol', oral: '5 mg; 10 mg; 20 mg; 40 mg', sd: '' },
  { name: 'Atorvastatin', cls: 'Cholesterol', oral: '20 mg; 40 mg', sd: '' },
  { name: 'Warfarin', cls: 'Blood', oral: '0.5 mg; 1 mg; 2 mg; 3 mg; 5 mg', sd: '' },
  { name: 'Dabigatran', cls: 'Blood', oral: '110 mg; 150 mg', sd: '' },

  /* ------------------------------------------------------------------ blood */
  { name: 'Ferrous salt', cls: 'Blood', oral: '60–65 mg elemental iron; 9 mg/mL; 25 mg/mL', sd: '' },
  { name: 'Ferrous salt + folic acid', cls: 'Blood', oral: '60 mg iron + 400 micrograms; 60 mg iron + 2.8 mg', sd: '' },
  { name: 'Folic acid', cls: 'Blood', oral: '400 micrograms; 1 mg; 5 mg; 1 mg/mL', sd: '' },
  { name: 'Hydroxyurea (hydroxycarbamide)', cls: 'Blood', oral: '100 mg; 200 mg; 500 mg; 1 g', sd: '' },
  { name: 'Deferasirox', cls: 'Blood', oral: '90 mg; 100 mg; 125 mg; 180 mg; 250 mg; 360 mg; 400 mg; 500 mg', sd: '' },

  /* ------------------------------------------------------- stomach and gut */
  { name: 'Omeprazole', cls: 'Stomach', oral: '10 mg; 20 mg; 40 mg', sd: '' },
  { name: 'Ranitidine', cls: 'Stomach', oral: '150 mg; 300 mg; 75 mg/5 mL', sd: '' },
  { name: 'Magnesium hydroxide', cls: 'Stomach', oral: 'oral liquid', sd: '' },
  { name: 'Bismuth subsalicylate', cls: 'Stomach', oral: 'oral liquid; tablet', sd: '' },
  { name: 'Mesalazine', cls: 'Gut', oral: 'tablet; suppository', sd: '' },
  { name: 'Docusate', cls: 'Gut', oral: 'capsule; oral liquid', sd: '' },
  { name: 'Oral rehydration salts', cls: 'Gut', oral: 'powder for solution', sd: '' },
  { name: 'Zinc sulfate', cls: 'Gut', oral: '20 mg', sd: '' },

  /* ------------------------------------------------------------- breathing */
  { name: 'Salbutamol', cls: 'Breathing', oral: 'inhaler 100 micrograms/dose; nebuliser 5 mg/mL', sd: '' },
  { name: 'Beclometasone', cls: 'Breathing', oral: 'inhaler 50–400 micrograms/dose', sd: '' },
  { name: 'Ipratropium bromide', cls: 'Breathing', oral: 'inhaler 20 micrograms/dose', sd: '' },
  { name: 'Budesonide + formoterol', cls: 'Breathing', oral: 'inhaler', sd: '' },

  /* --------------------------------------------------------------- sugar */
  { name: 'Metformin', cls: 'Diabetes', oral: '500 mg; 850 mg; 1 g', sd: '' },
  { name: 'Gliclazide', cls: 'Diabetes', oral: '80 mg; 30 mg and 60 mg modified release', sd: '' },
  { name: 'Glibenclamide', cls: 'Diabetes', oral: '2.5 mg; 5 mg', sd: '' },
  { name: 'Empagliflozin', cls: 'Diabetes', oral: '10 mg; 25 mg', sd: '' },
  { name: 'Insulin human', cls: 'Diabetes', oral: '', sd: '' },
  { name: 'Insulin glargine', cls: 'Diabetes', oral: '', sd: '' },
  { name: 'Insulin aspart', cls: 'Diabetes', oral: '', sd: '' },
  { name: 'Insulin lispro', cls: 'Diabetes', oral: '', sd: '' },
  { name: 'Insulin detemir', cls: 'Diabetes', oral: '', sd: '' },
  { name: 'Insulin degludec', cls: 'Diabetes', oral: '', sd: '' },
  { name: 'Levothyroxine', cls: 'Thyroid', oral: '25 micrograms; 50 micrograms; 100 micrograms', sd: '' },
  { name: 'Propylthiouracil', cls: 'Thyroid', oral: '50 mg', sd: '' },
  { name: 'Methimazole', cls: 'Thyroid', oral: '5 mg; 10 mg; 20 mg', sd: '' },

  /* ----------------------------------------------------- vitamins, minerals */
  { name: 'Ascorbic acid (vitamin C)', cls: 'Vitamin', oral: '50 mg', sd: '' },
  { name: 'Thiamine (vitamin B1)', cls: 'Vitamin', oral: '50 mg', sd: '' },
  { name: 'Riboflavin (vitamin B2)', cls: 'Vitamin', oral: '5 mg', sd: '' },
  { name: 'Nicotinamide (vitamin B3)', cls: 'Vitamin', oral: '50 mg', sd: '' },
  { name: 'Pyridoxine (vitamin B6)', cls: 'Vitamin', oral: '25 mg', sd: '' },
  { name: 'Retinol (vitamin A)', cls: 'Vitamin', oral: '10 000 IU; 100 000 IU; 200 000 IU', sd: '' },
  { name: 'Cholecalciferol (vitamin D3)', cls: 'Vitamin', oral: '400 IU; 1000 IU', sd: '' },
  { name: 'Ergocalciferol (vitamin D2)', cls: 'Vitamin', oral: '1.25 mg (50 000 IU)', sd: '' },
  { name: 'Calcium', cls: 'Mineral', oral: '500 mg', sd: '' },
  { name: 'Iodine', cls: 'Mineral', oral: 'capsule 190 mg; iodized oil', sd: '' },
  { name: 'Multiple micronutrient powder', cls: 'Mineral', oral: 'sachet', sd: '' },

  /* ------------------------------------------------------------------ skin */
  { name: 'Betamethasone', cls: 'Skin', oral: '', sd: '' },
  { name: 'Mupirocin', cls: 'Skin', oral: '', sd: '' },
  { name: 'Permethrin', cls: 'Skin', oral: '', sd: '' },
  { name: 'Benzyl benzoate', cls: 'Skin', oral: '', sd: '' },
  { name: 'Benzoyl peroxide', cls: 'Skin', oral: '', sd: '' },
  { name: 'Silver sulfadiazine', cls: 'Skin', oral: '', sd: '' },
  { name: 'Selenium sulfide', cls: 'Skin', oral: '', sd: '' },
  { name: 'Calamine', cls: 'Skin', oral: '', sd: '' },
  { name: 'Salicylic acid', cls: 'Skin', oral: '', sd: '' },
  { name: 'Urea', cls: 'Skin', oral: '', sd: '' },
  { name: 'Potassium permanganate', cls: 'Skin', oral: '', sd: '' },
  { name: 'Coal tar', cls: 'Skin', oral: '', sd: '' },
  { name: 'Methotrexate', cls: 'Skin', oral: '2.5 mg; 10 mg', sd: '' },

  /* --------------------------------------------------------------- poisons */
  { name: 'Acetylcysteine', cls: 'Poisoning', oral: '', sd: '' },
  { name: 'Atropine', cls: 'Poisoning', oral: '', sd: '' },
  { name: 'Naloxone', cls: 'Poisoning', oral: '', sd: '' },
  { name: 'Calcium gluconate', cls: 'Poisoning', oral: '', sd: '' },
  { name: 'Penicillamine', cls: 'Poisoning', oral: '250 mg', sd: '' },
  { name: 'Deferoxamine', cls: 'Poisoning', oral: '', sd: '' },
]

/* --------------------------------------------------------------- matching */

/**
 * Normalisation for the join, tuned to how generics are actually mistyped:
 * "Amoxicillin+Clavulanic Acid", "amoxicillin + clavulanic acid" and
 * "AMOXICILLIN / CLAVULANIC ACID" all have to land on one row. The parenthetical
 * gloss WHO prints ("(acetaminophen)", "(vitamin C)") is dropped, so a doctor who
 * types either half still matches.
 */
export const normGeneric = (s: string) =>
  s.toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[/&]/g, '+')
    .replace(/[^a-z0-9+]/g, '')

const byKey = new Map<string, WhoGeneric>()
const alias = new Map<string, string>()
for (const g of who) {
  byKey.set(normGeneric(g.name), g)
  // the gloss WHO prints in brackets is what half the world calls the molecule
  const m = g.name.match(/\((.+?)\)/)
  if (m) alias.set(normGeneric(m[1]), g.name)
}
// what people in Pakistan write, mapped to what WHO calls it
for (const [from, to] of [
  ['acetaminophen', 'Paracetamol'],
  ['coamoxiclav', 'Amoxicillin + clavulanic acid'],
  ['amoxycillin', 'Amoxicillin'],
  ['amoxycillin+clavulanicacid', 'Amoxicillin + clavulanic acid'],
  ['cotrimoxazole', 'Sulfamethoxazole + trimethoprim'],
  ['trimethoprim+sulfamethoxazole', 'Sulfamethoxazole + trimethoprim'],
  ['aspirin', 'Acetylsalicylic acid'],
  ['sodiumvalproate', 'Valproic acid (sodium valproate)'],
  ['vitaminc', 'Ascorbic acid (vitamin C)'],
  ['vitamind', 'Cholecalciferol (vitamin D3)'],
  ['vitamina', 'Retinol (vitamin A)'],
  ['albuterol', 'Salbutamol'],
  ['frusemide', 'Furosemide'],
  ['cephalexin', 'Cefalexin'],
  ['ironfolicacid', 'Ferrous salt + folic acid'],
]) alias.set(from, to)

/** The WHO row for a generic string a doctor typed, or undefined. */
export function whoGeneric(generic: string): WhoGeneric | undefined {
  const k = normGeneric(generic)
  if (!k) return undefined
  const direct = byKey.get(k)
  if (direct) return direct
  const a = alias.get(k)
  return a ? byKey.get(normGeneric(a)) : undefined
}

/** AWaRe group, when the medicine is an antibacterial WHO lists. */
export const awareOf = (generic: string): Aware | undefined => whoGeneric(generic)?.aware

/**
 * Type-ahead over the formula column. Prefix first, then contains, so typing
 * "amox" offers Amoxicillin before Amoxicillin + clavulanic acid, and typing
 * "clav" still finds the combination.
 */
export function searchGenerics(q: string, limit = 8): WhoGeneric[] {
  const k = normGeneric(q)
  if (k.length < 2) return []
  const starts = who.filter(g => normGeneric(g.name).startsWith(k))
  const has = who.filter(g => !normGeneric(g.name).startsWith(k) && normGeneric(g.name).includes(k))
  // a doctor typing a name we know by another word should still find the row
  const viaAlias = [...alias.entries()]
    .filter(([from]) => from.startsWith(k))
    .map(([, to]) => byKey.get(normGeneric(to)))
    .filter((g): g is WhoGeneric => !!g)
  const out: WhoGeneric[] = []
  for (const g of [...starts, ...viaAlias, ...has]) if (!out.includes(g)) out.push(g)
  return out.slice(0, limit)
}

/** How much of the formula column has a Sindhi word a person has read. */
export function sindhiProgress() {
  const done = who.filter(g => g.sd).length
  return { done, total: who.length }
}
