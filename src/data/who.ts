/**
 * A TABLE OF MOLECULE NAMES. NOT A MEDICINE LIST, AND NOT ON ANY SCREEN.
 *
 * WHAT THIS FILE USED TO BE, AND WHY IT STOPPED.
 *
 * It was the WHO Model List of Essential Medicines, 24th list, and it was the
 * formula column the doctor was shown: he picked a molecule from it, a medicine
 * whose molecule was not in it was labelled "not on the WHO list, check it",
 * and the stronger antibiotics carried WHO's own AWaRe group on the
 * prescription screen.
 *
 * Every part of that was a mistake in a clinic in Larkana, and the owner said
 * so in one sentence: we do not need WHO, we need the Pakistani medicines list
 * so the doctor can choose a medicine and put it on the prescription.
 *
 * He is right, and the reason is worth writing down so nobody argues it back in.
 * WHO does not name brands, on purpose, because its list exists to tell a
 * national programme what it must be able to buy. A doctor does not prescribe
 * from it. He writes AUGMENTIN 625, and the chemist across the road reads
 * AUGMENTIN 625 off a box. So the app was offering him a column he does not
 * think in, scolding him about perfectly ordinary Pakistani formulas that WHO
 * had no reason to name, and printing a stewardship label from Geneva beside
 * medicines he had already decided on. The shelf is pk.ts now. The setup
 * screens and the prescription screen do not import this file at all.
 *
 * WHAT IT STILL DOES, WHICH IS ONE SMALL THING AND A REAL ONE.
 *
 * `sameMolecule` catches a doctor writing the same medicine twice under two
 * brand names on one prescription, which no spelling check can find, and which
 * is a real way a patient gets a double dose of paracetamol. Two brands agree
 * only if their formulas agree, and a formula typed by hand agrees with itself
 * spelled four ways: "Co-amoxiclav", "amoxicillin+clav", "Amoxicillin +
 * Clavulanic acid". The rows below are what lets those three land on one key.
 *
 * It degrades honestly without a match: an unknown formula falls back to its
 * own normalised spelling, so two brands of it are still caught. That is why
 * this file being incomplete has never been a blocker and is not one now.
 *
 * NOTHING HERE IS SHOWN TO ANYBODY, NOTHING HERE IS PRESCRIBABLE, AND THE `sd`
 * COLUMN IS DEAD. Sindhi for medicines is settled in pk.ts: no brand name
 * claims one, and the Sindhi that reaches paper is the form and timing
 * vocabulary in forms.ts, which is a closed set that has been read.
 *
 * PROVENANCE, unchanged. Transcribed from the published 24th list, which WHO
 * publishes to be copied and adapted by national programmes.
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
 * THE SAME MOLECULE UNDER TWO BRANDS, ON ONE PRESCRIPTION.
 *
 * Reason 3 at the top of this file, finally used. PANADOL 500 and CALPOL syrup
 * look nothing alike as strings and are the same paracetamol; a patient handed
 * both takes a double dose of the commonest drug in Pakistan and the doctor,
 * who wrote them ten seconds apart under two brand names, has no way of seeing
 * it on his own screen.
 *
 * The screen already catches the same DRUG twice, by id. It could not catch
 * this, because only the formula column can.
 *
 * Two decisions worth stating.
 *
 * IT MATCHES ON THE WHO ROW, NOT THE TYPED STRING, when there is one. So
 * "Paracetamol" and "paracetamol (acetaminophen)" are the same molecule, and a
 * doctor who typed his own formula in his own spelling is compared on the
 * normalised string, which is the best that can be done and is still right far
 * more often than nothing.
 *
 * IT WARNS AND DOES NOT REFUSE. Co-prescribing one molecule in two forms is
 * occasionally deliberate: a tablet by day and a syrup a child will actually
 * swallow at night. A refusal would be this file overruling a doctor about his
 * own patient on the strength of a lookup table, which is not what it is for.
 */
export function sameMolecule(generics: (string | null | undefined)[]): Map<number, number[]> {
  const keyOf = (g: string | null | undefined): string => {
    if (!g || !g.trim()) return ''
    // resolve through the WHO row first, so two spellings of one molecule and
    // a brand's gloss all land on the same key
    const row = whoGeneric(g)
    return normGeneric(row ? row.name : g)
  }
  const byMolecule = new Map<string, number[]>()
  generics.forEach((g, i) => {
    const k = keyOf(g)
    if (!k) return
    const at = byMolecule.get(k)
    at ? at.push(i) : byMolecule.set(k, [i])
  })
  const out = new Map<number, number[]>()
  for (const idxs of byMolecule.values()) {
    if (idxs.length < 2) continue
    for (const i of idxs) out.set(i, idxs.filter(x => x !== i))
  }
  return out
}

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
