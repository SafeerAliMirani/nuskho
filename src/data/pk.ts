import type { Form, Route } from '../types'

/**
 * THE PAKISTANI SHELF.
 *
 * What a doctor in Larkana actually writes: AUGMENTIN 625, PANADOL, RISEK,
 * VENTOLIN, BETNOVATE. Brands, on boxes, in the chemist's shop across the road.
 *
 * WHY THIS REPLACED THE OTHER THING. There used to be a WHO essential medicines
 * list in the doctor's face, and a starter dictionary of eight brands. The WHO
 * list has not got a single brand name in it, because WHO does not name brands.
 * Nobody here writes "amoxicillin + clavulanic acid" on a slip. So the doctor
 * was shown a column of molecules he does not prescribe by, and a search box
 * that knew eight medicines. He typed the other ninety percent by hand, every
 * evening, and a medicine typed by hand at nine at night is where the spelling
 * mistakes come from.
 *
 * WHAT A ROW IS ALLOWED TO CLAIM. Four things, and they are the four a chemist
 * reads off the box: the brand, the strength, the shape it comes in, and the
 * formula inside it. Not a price, which changes. Not a dose, which is the
 * doctor's decision about a particular patient and never ours. Not a warning,
 * because a warning nobody at this end can keep current is worse than none.
 *
 * NOT ONE SINDHI WORD IS CLAIMED HERE, AND THAT IS THE POINT.
 *
 * Every `sd` this file produces is empty. Reviewing 249 brand names in Sindhi
 * before a doctor could use any of them would have delayed the whole thing by
 * months, and the rule that nothing prints unreviewed Sindhi does not bend.
 *
 * It does not have to bend, because the Sindhi on a slip is not the brand. It
 * is the form and the timing: گوري, ڪيپسول, چمچو, قطرا, ڪريم, ساشي, صبح, منجهند,
 * شام, رات, and the four sites. Those are a closed set, they were read and
 * confirmed on 7 August 2026, and they carry every one of these 249 rows. The
 * brand prints in the Latin letters that are on the box, which is what the
 * chemist matches against anyway. A patient who cannot read English still gets
 * the picture, the count and the times, and those are the parts he acts on.
 *
 * So a brand here is safe on paper on the day it lands, and a Sindhi name can
 * be added to any row later, one at a time, through the same review gate as
 * everything else. Nothing is waiting on anything.
 *
 * WHERE IT CAME FROM. Manufacturer catalogues with strength, form and formula
 * printed together (druginfosys.com company product lists for Searle, Getz,
 * Abbott Pakistan, Sami, Hilton, Highnoon and PharmEvo; GSK Pakistan's and
 * Haleon Pakistan's own product pages; martindowmarker.com, barretthodgson.com,
 * bosch-pharma.com, getzpharma.com), cross-checked against what Pakistani
 * retail pharmacies list as actually on sale (dvago.pk, dawaai.pk,
 * healthwire.pk, naheed.pk).
 *
 * `check: true` marks a row where the pack strength was not found in a form
 * worth putting on paper. Those rows carry no strength rather than a guessed
 * one, and the Medicines tab in Setup shows them together so a doctor can settle
 * them against the boxes on his own shelf in ten minutes.
 *
 * AND NOTHING HERE IS ON ANY DOCTOR'S LIST. This is a shelf he reaches into.
 * A row becomes his the moment he taps it and not before, as a copy, so a later
 * change to this file can never rewrite a medicine he has already prescribed.
 * That was the rule when this shelf had eight brands on it and it is why 249 is
 * not a different kind of thing, only a longer one.
 */
export interface PkMed {
  brand: string
  /** what is printed on the box. Empty when we did not find one we trusted. */
  strength: string
  form: Form
  generic: string
  /**
   * What it is for, in the words a doctor scans a list with rather than the
   * words a pharmacologist would use. Never printed and not clinical: it is
   * here so that typing "cough" finds the cough medicines, and so the shelf can
   * be read in groups instead of as 249 rows in one column.
   */
  cls: string
  /** who makes it. Never printed: it is here so two similar rows can be told
   *  apart on screen, and so a wrong row can be traced to a catalogue. */
  maker: string
  /** only where it can differ. Absent means by mouth. */
  route?: Route
  /** a doctor should check this one against the box before he relies on it */
  check?: boolean
}

export const PK_MEDS: PkMed[] = [

  /* Antibiotic (48) */
  { brand: "AMOXIL"                      , strength: "250 mg"                 , form: "cap",   generic: "Amoxicillin"                                      , cls: "Antibiotic", maker: "GSK" },
  { brand: "AMOXIL"                      , strength: "500 mg"                 , form: "cap",   generic: "Amoxicillin"                                      , cls: "Antibiotic", maker: "GSK" },
  { brand: "AMOXIL"                      , strength: "125 mg/5 ml"            , form: "syr",   generic: "Amoxicillin"                                      , cls: "Antibiotic", maker: "GSK" },
  { brand: "AMOXIL DROPS"                , strength: "125 mg/1.25 ml"         , form: "drop",  generic: "Amoxicillin"                                      , cls: "Antibiotic", maker: "GSK", route: "mouth" },
  { brand: "ZEEMOX"                      , strength: "500 mg"                 , form: "cap",   generic: "Amoxicillin"                                      , cls: "Antibiotic", maker: "Searle" },
  { brand: "ZEEMOX"                      , strength: "125 mg/5 ml"            , form: "syr",   generic: "Amoxicillin"                                      , cls: "Antibiotic", maker: "Searle" },
  { brand: "AUGMENTIN"                   , strength: "625 mg"                 , form: "tab",   generic: "Amoxicillin + Clavulanic acid"                    , cls: "Antibiotic", maker: "GSK" },
  { brand: "AUGMENTIN"                   , strength: "1 g"                    , form: "tab",   generic: "Amoxicillin + Clavulanic acid"                    , cls: "Antibiotic", maker: "GSK" },
  { brand: "AUGMENTIN"                   , strength: "156.25 mg/5 ml"         , form: "syr",   generic: "Amoxicillin + Clavulanic acid"                    , cls: "Antibiotic", maker: "GSK" },
  { brand: "AUGMENTIN"                   , strength: "457 mg/5 ml"            , form: "syr",   generic: "Amoxicillin + Clavulanic acid"                    , cls: "Antibiotic", maker: "GSK" },
  { brand: "CALAMOX"                     , strength: "625 mg"                 , form: "tab",   generic: "Amoxicillin + Clavulanic acid"                    , cls: "Antibiotic", maker: "Bosch" },
  { brand: "AMCLAV"                      , strength: "625 mg"                 , form: "tab",   generic: "Amoxicillin + Clavulanic acid"                    , cls: "Antibiotic", maker: "Getz" },
  { brand: "AMCLAV"                      , strength: "156.25 mg/5 ml"         , form: "syr",   generic: "Amoxicillin + Clavulanic acid"                    , cls: "Antibiotic", maker: "Getz" },
  { brand: "AMPICLOX"                    , strength: "500 mg"                 , form: "cap",   generic: "Ampicillin + Cloxacillin"                         , cls: "Antibiotic", maker: "GSK" },
  { brand: "ZETRO"                       , strength: "250 mg"                 , form: "cap",   generic: "Azithromycin"                                     , cls: "Antibiotic", maker: "Getz" },
  { brand: "ZETRO"                       , strength: "500 mg"                 , form: "tab",   generic: "Azithromycin"                                     , cls: "Antibiotic", maker: "Getz" },
  { brand: "ZETRO"                       , strength: "200 mg/5 ml"            , form: "syr",   generic: "Azithromycin"                                     , cls: "Antibiotic", maker: "Getz" },
  { brand: "AZOMAX"                      , strength: "250 mg"                 , form: "cap",   generic: "Azithromycin"                                     , cls: "Antibiotic", maker: "AGP" },
  { brand: "AZOMAX"                      , strength: "500 mg"                 , form: "cap",   generic: "Azithromycin"                                     , cls: "Antibiotic", maker: "AGP" },
  { brand: "CEFSPAN"                     , strength: "400 mg"                 , form: "cap",   generic: "Cefixime"                                         , cls: "Antibiotic", maker: "Barrett Hodgson" },
  { brand: "CEFSPAN"                     , strength: "100 mg/5 ml"            , form: "syr",   generic: "Cefixime"                                         , cls: "Antibiotic", maker: "Barrett Hodgson" },
  { brand: "CEFIGET"                     , strength: "400 mg"                 , form: "cap",   generic: "Cefixime"                                         , cls: "Antibiotic", maker: "Getz" },
  { brand: "CEFIGET"                     , strength: "100 mg/5 ml"            , form: "syr",   generic: "Cefixime"                                         , cls: "Antibiotic", maker: "Getz" },
  { brand: "CEFIM"                       , strength: "400 mg"                 , form: "cap",   generic: "Cefixime"                                         , cls: "Antibiotic", maker: "Hilton" },
  { brand: "CEFIM"                       , strength: "100 mg/5 ml"            , form: "syr",   generic: "Cefixime"                                         , cls: "Antibiotic", maker: "Hilton" },
  { brand: "VELOSEF"                     , strength: "500 mg"                 , form: "cap",   generic: "Cephradine"                                       , cls: "Antibiotic", maker: "GSK" },
  { brand: "VELOSEF"                     , strength: "125 mg/5 ml"            , form: "syr",   generic: "Cephradine"                                       , cls: "Antibiotic", maker: "GSK" },
  { brand: "VELOSEF"                     , strength: "250 mg/5 ml"            , form: "syr",   generic: "Cephradine"                                       , cls: "Antibiotic", maker: "GSK" },
  { brand: "BIOCEF"                      , strength: "500 mg"                 , form: "cap",   generic: "Cephradine"                                       , cls: "Antibiotic", maker: "Searle" },
  { brand: "CEPOREX"                     , strength: "500 mg"                 , form: "cap",   generic: "Cephalexin"                                       , cls: "Antibiotic", maker: "GSK" },
  { brand: "CEPOREX"                     , strength: "125 mg/5 ml"            , form: "syr",   generic: "Cephalexin"                                       , cls: "Antibiotic", maker: "GSK" },
  { brand: "EVACEF"                      , strength: "500 mg"                 , form: "cap",   generic: "Cefadroxil"                                       , cls: "Antibiotic", maker: "Highnoon" },
  { brand: "NOVIDAT"                     , strength: "500 mg"                 , form: "tab",   generic: "Ciprofloxacin"                                    , cls: "Antibiotic", maker: "Sami" },
  { brand: "NOVIDAT"                     , strength: "250 mg/5 ml"            , form: "syr",   generic: "Ciprofloxacin"                                    , cls: "Antibiotic", maker: "Sami" },
  { brand: "CIPROXIN"                    , strength: "500 mg"                 , form: "tab",   generic: "Ciprofloxacin"                                    , cls: "Antibiotic", maker: "Bayer" },
  { brand: "ORPIC"                       , strength: "125 mg/5 ml"            , form: "syr",   generic: "Ciprofloxacin"                                    , cls: "Antibiotic", maker: "Getz" },
  { brand: "LEFLOX"                      , strength: "500 mg"                 , form: "tab",   generic: "Levofloxacin"                                     , cls: "Antibiotic", maker: "Getz" },
  { brand: "CRAVIT"                      , strength: "500 mg"                 , form: "tab",   generic: "Levofloxacin"                                     , cls: "Antibiotic", maker: "Hilton" },
  { brand: "FLAGYL"                      , strength: "400 mg"                 , form: "tab",   generic: "Metronidazole"                                    , cls: "Antibiotic", maker: "Sanofi" },
  { brand: "FLAGYL"                      , strength: "200 mg/5 ml"            , form: "syr",   generic: "Metronidazole"                                    , cls: "Antibiotic", maker: "Sanofi" },
  { brand: "METROZINE"                   , strength: "400 mg"                 , form: "tab",   generic: "Metronidazole"                                    , cls: "Antibiotic", maker: "Searle" },
  { brand: "KLARICID"                    , strength: "500 mg"                 , form: "tab",   generic: "Clarithromycin"                                   , cls: "Antibiotic", maker: "Abbott" },
  { brand: "KLARICID"                    , strength: "125 mg/5 ml"            , form: "syr",   generic: "Clarithromycin"                                   , cls: "Antibiotic", maker: "Abbott" },
  { brand: "SEPTRAN"                     , strength: "400 mg + 80 mg"         , form: "tab",   generic: "Sulfamethoxazole + Trimethoprim"                  , cls: "Antibiotic", maker: "GSK" },
  { brand: "SEPTRAN DS"                  , strength: "800 mg + 160 mg"        , form: "tab",   generic: "Sulfamethoxazole + Trimethoprim"                  , cls: "Antibiotic", maker: "GSK" },
  { brand: "SEPTRAN"                     , strength: "200 mg + 40 mg/5 ml"    , form: "syr",   generic: "Sulfamethoxazole + Trimethoprim"                  , cls: "Antibiotic", maker: "GSK" },
  { brand: "MEGADOX"                     , strength: "100 mg"                 , form: "cap",   generic: "Doxycycline"                                      , cls: "Antibiotic", maker: "Hilton" },
  { brand: "OFLOBID"                     , strength: "200 mg"                 , form: "tab",   generic: "Ofloxacin"                                        , cls: "Antibiotic", maker: "Hilton" },

  /* Painkiller and fever (25) */
  { brand: "PANADOL"                     , strength: "500 mg"                 , form: "tab",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "GSK" },
  { brand: "PANADOL EXTRA"               , strength: "500 mg + 65 mg"         , form: "tab",   generic: "Paracetamol + Caffeine"                           , cls: "Painkiller and fever", maker: "GSK" },
  { brand: "PANADOL"                     , strength: "120 mg/5 ml"            , form: "syr",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "GSK" },
  { brand: "CALPOL"                      , strength: "500 mg"                 , form: "tab",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "GSK" },
  { brand: "CALPOL"                      , strength: "120 mg/5 ml"            , form: "syr",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "GSK" },
  { brand: "CALPOL 6 PLUS"               , strength: "250 mg/5 ml"            , form: "syr",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "GSK" },
  { brand: "PARATOL"                     , strength: "500 mg"                 , form: "tab",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "Highnoon" },
  { brand: "PARATOL"                     , strength: "120 mg/5 ml"            , form: "syr",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "Highnoon" },
  { brand: "SERMOL"                      , strength: "500 mg"                 , form: "tab",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "Searle" },
  { brand: "SERMOL"                      , strength: "120 mg/5 ml"            , form: "syr",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "Searle" },
  { brand: "FEBROL"                      , strength: "120 mg/5 ml"            , form: "syr",   generic: "Paracetamol"                                      , cls: "Painkiller and fever", maker: "Barrett Hodgson" },
  { brand: "BRUFEN"                      , strength: "400 mg"                 , form: "tab",   generic: "Ibuprofen"                                        , cls: "Painkiller and fever", maker: "Abbott" },
  { brand: "BRUFEN"                      , strength: "200 mg"                 , form: "tab",   generic: "Ibuprofen"                                        , cls: "Painkiller and fever", maker: "Abbott" },
  { brand: "BRUFEN"                      , strength: "100 mg/5 ml"            , form: "syr",   generic: "Ibuprofen"                                        , cls: "Painkiller and fever", maker: "Abbott" },
  { brand: "BRUFEN DS"                   , strength: "200 mg/5 ml"            , form: "syr",   generic: "Ibuprofen"                                        , cls: "Painkiller and fever", maker: "Abbott" },
  { brand: "CAFLAM"                      , strength: "50 mg"                  , form: "tab",   generic: "Diclofenac potassium"                             , cls: "Painkiller and fever", maker: "Novartis" },
  { brand: "DICLORAN"                    , strength: "50 mg"                  , form: "tab",   generic: "Diclofenac sodium"                                , cls: "Painkiller and fever", maker: "Sami" },
  { brand: "DEFNAC"                      , strength: "50 mg"                  , form: "tab",   generic: "Diclofenac sodium"                                , cls: "Painkiller and fever", maker: "Searle" },
  { brand: "VOLTRAL EMULGEL"             , strength: "1%"                     , form: "cream", generic: "Diclofenac sodium"                                , cls: "Painkiller and fever", maker: "GSK", route: "skin" },
  { brand: "PONSTAN FORTE"               , strength: "500 mg"                 , form: "tab",   generic: "Mefenamic acid"                                   , cls: "Painkiller and fever", maker: "Pfizer" },
  { brand: "NUBEROL"                     , strength: "35 mg + 450 mg"         , form: "tab",   generic: "Orphenadrine + Paracetamol"                       , cls: "Painkiller and fever", maker: "Searle" },
  { brand: "NUBEROL FORTE"               , strength: "50 mg + 650 mg"         , form: "tab",   generic: "Orphenadrine + Paracetamol"                       , cls: "Painkiller and fever", maker: "Searle" },
  { brand: "TRAMAL"                      , strength: "50 mg"                  , form: "cap",   generic: "Tramadol"                                         , cls: "Painkiller and fever", maker: "Searle" },
  { brand: "TONOFLEX-P"                  , strength: "325 mg + 37.5 mg"       , form: "tab",   generic: "Paracetamol + Tramadol"                           , cls: "Painkiller and fever", maker: "Sami" },
  { brand: "XOBIX"                       , strength: "7.5 mg"                 , form: "tab",   generic: "Meloxicam"                                        , cls: "Painkiller and fever", maker: "Hilton" },

  /* Stomach and acid (21) */
  { brand: "RISEK"                       , strength: "20 mg"                  , form: "cap",   generic: "Omeprazole"                                       , cls: "Stomach and acid", maker: "Getz" },
  { brand: "RISEK"                       , strength: "40 mg"                  , form: "cap",   generic: "Omeprazole"                                       , cls: "Stomach and acid", maker: "Getz" },
  { brand: "RISEK INSTA"                 , strength: "20 mg"                  , form: "sachet",generic: "Omeprazole + Sodium bicarbonate"                  , cls: "Stomach and acid", maker: "Getz" },
  { brand: "ZOLTAR"                      , strength: "20 mg"                  , form: "cap",   generic: "Omeprazole"                                       , cls: "Stomach and acid", maker: "PharmEvo" },
  { brand: "NEXUM"                       , strength: "20 mg"                  , form: "cap",   generic: "Esomeprazole"                                     , cls: "Stomach and acid", maker: "Getz" },
  { brand: "NEXUM"                       , strength: "40 mg"                  , form: "cap",   generic: "Esomeprazole"                                     , cls: "Stomach and acid", maker: "Getz" },
  { brand: "ZOPENT"                      , strength: "40 mg"                  , form: "tab",   generic: "Pantoprazole"                                     , cls: "Stomach and acid", maker: "Hilton" },
  { brand: "ULFAM"                       , strength: "20 mg"                  , form: "tab",   generic: "Famotidine"                                       , cls: "Stomach and acid", maker: "Highnoon" },
  { brand: "MOTILIUM"                    , strength: "10 mg"                  , form: "tab",   generic: "Domperidone"                                      , cls: "Stomach and acid", maker: "Aspin" },
  { brand: "PERIDONE"                    , strength: "10 mg"                  , form: "tab",   generic: "Domperidone"                                      , cls: "Stomach and acid", maker: "Sami" },
  { brand: "PERIDONE"                    , strength: "1 mg/ml"                , form: "syr",   generic: "Domperidone"                                      , cls: "Stomach and acid", maker: "Sami" },
  { brand: "GRAVINATE"                   , strength: "50 mg"                  , form: "tab",   generic: "Dimenhydrinate"                                   , cls: "Stomach and acid", maker: "Searle" },
  { brand: "GRAVINATE"                   , strength: "12.5 mg/4 ml"           , form: "syr",   generic: "Dimenhydrinate"                                   , cls: "Stomach and acid", maker: "Searle" },
  { brand: "BUSCOPAN PLUS"               , strength: "10 mg + 500 mg"         , form: "tab",   generic: "Hyoscine butylbromide + Paracetamol"              , cls: "Stomach and acid", maker: "Martin Dow" },
  { brand: "NO-SPA"                      , strength: "40 mg"                  , form: "tab",   generic: "Drotaverine"                                      , cls: "Stomach and acid", maker: "Sanofi" },
  { brand: "COLOFAC"                     , strength: "135 mg"                 , form: "tab",   generic: "Mebeverine"                                       , cls: "Stomach and acid", maker: "Abbott" },
  { brand: "ULSANIC"                     , strength: "1 g"                    , form: "tab",   generic: "Sucralfate"                                       , cls: "Stomach and acid", maker: "Highnoon" },
  { brand: "LILAC"                       , strength: "3.35 g/5 ml"            , form: "syr",   generic: "Lactulose"                                        , cls: "Stomach and acid", maker: "Getz" },
  { brand: "ENTEROGERMINA"               , strength: "2 billion/5 ml"         , form: "other", generic: "Bacillus clausii"                                 , cls: "Stomach and acid", maker: "Sanofi" },
  { brand: "ENFLOR"                      , strength: "250 mg"                 , form: "sachet",generic: "Saccharomyces boulardii"                          , cls: "Stomach and acid", maker: "Hilton" },
  { brand: "ENO"                         , strength: "5 g"                    , form: "sachet",generic: "Sodium bicarbonate + Citric acid"                 , cls: "Stomach and acid", maker: "GSK" },

  /* Allergy (20) */
  { brand: "RIGIX"                       , strength: "10 mg"                  , form: "tab",   generic: "Cetirizine"                                       , cls: "Allergy", maker: "AGP" },
  { brand: "RIGIX"                       , strength: "5 mg/5 ml"              , form: "syr",   generic: "Cetirizine"                                       , cls: "Allergy", maker: "AGP" },
  { brand: "ZYRTEC"                      , strength: "10 mg"                  , form: "tab",   generic: "Cetirizine"                                       , cls: "Allergy", maker: "GSK" },
  { brand: "ZYRTEC"                      , strength: "5 mg/5 ml"              , form: "syr",   generic: "Cetirizine"                                       , cls: "Allergy", maker: "GSK" },
  { brand: "SEDIL"                       , strength: "10 mg"                  , form: "tab",   generic: "Cetirizine"                                       , cls: "Allergy", maker: "Sami" },
  { brand: "SEDIL"                       , strength: "5 mg/5 ml"              , form: "syr",   generic: "Cetirizine"                                       , cls: "Allergy", maker: "Sami" },
  { brand: "CERIZINE"                    , strength: "10 mg"                  , form: "tab",   generic: "Cetirizine"                                       , cls: "Allergy", maker: "PharmEvo" },
  { brand: "RONEX"                       , strength: "10 mg"                  , form: "tab",   generic: "Cetirizine"                                       , cls: "Allergy", maker: "Hilton" },
  { brand: "T-DAY"                       , strength: "5 mg"                   , form: "tab",   generic: "Levocetirizine"                                   , cls: "Allergy", maker: "GSK" },
  { brand: "XYZAL"                       , strength: "5 mg"                   , form: "tab",   generic: "Levocetirizine"                                   , cls: "Allergy", maker: "GSK" },
  { brand: "NEO-SEDIL"                   , strength: "5 mg"                   , form: "tab",   generic: "Levocetirizine"                                   , cls: "Allergy", maker: "Sami" },
  { brand: "NEO-SEDIL"                   , strength: "2.5 mg/5 ml"            , form: "syr",   generic: "Levocetirizine"                                   , cls: "Allergy", maker: "Sami" },
  { brand: "OCITRA"                      , strength: "5 mg"                   , form: "tab",   generic: "Levocetirizine"                                   , cls: "Allergy", maker: "Searle" },
  { brand: "OCITRA"                      , strength: "2.5 mg/5 ml"            , form: "syr",   generic: "Levocetirizine"                                   , cls: "Allergy", maker: "Searle" },
  { brand: "AVIL"                        , strength: "25 mg"                  , form: "tab",   generic: "Pheniramine"                                      , cls: "Allergy", maker: "Sanofi" },
  { brand: "FEXET"                       , strength: "120 mg"                 , form: "tab",   generic: "Fexofenadine"                                     , cls: "Allergy", maker: "Getz" },
  { brand: "ANTIAL"                      , strength: "10 mg"                  , form: "tab",   generic: "Loratadine"                                       , cls: "Allergy", maker: "Sami" },
  { brand: "ANTIAL"                      , strength: "5 mg/5 ml"              , form: "syr",   generic: "Loratadine"                                       , cls: "Allergy", maker: "Sami" },
  { brand: "ARIA"                        , strength: "1 mg"                   , form: "tab",   generic: "Ketotifen"                                        , cls: "Allergy", maker: "Highnoon" },
  { brand: "ARIA"                        , strength: "1 mg/5 ml"              , form: "syr",   generic: "Ketotifen"                                        , cls: "Allergy", maker: "Highnoon" },

  /* Blood pressure and heart (20) */
  { brand: "NORVASC"                     , strength: "5 mg"                   , form: "tab",   generic: "Amlodipine"                                       , cls: "Blood pressure and heart", maker: "Pfizer" },
  { brand: "ONATO"                       , strength: "5 mg"                   , form: "tab",   generic: "Amlodipine"                                       , cls: "Blood pressure and heart", maker: "Sami" },
  { brand: "BLOKIUM"                     , strength: "50 mg"                  , form: "tab",   generic: "Atenolol"                                         , cls: "Blood pressure and heart", maker: "Highnoon" },
  { brand: "CONCOR"                      , strength: "5 mg"                   , form: "tab",   generic: "Bisoprolol"                                       , cls: "Blood pressure and heart", maker: "Martin Dow" },
  { brand: "TANSIN"                      , strength: "50 mg"                  , form: "tab",   generic: "Losartan"                                         , cls: "Blood pressure and heart", maker: "PharmEvo" },
  { brand: "TANSIN DS"                   , strength: "100 mg"                 , form: "tab",   generic: "Losartan"                                         , cls: "Blood pressure and heart", maker: "PharmEvo" },
  { brand: "DIU-TANSIN"                  , strength: "50 mg + 12.5 mg"        , form: "tab",   generic: "Losartan + Hydrochlorothiazide"                   , cls: "Blood pressure and heart", maker: "PharmEvo" },
  { brand: "TASMI"                       , strength: "40 mg"                  , form: "tab",   generic: "Telmisartan"                                      , cls: "Blood pressure and heart", maker: "Getz" },
  { brand: "MISAR"                       , strength: "40 mg"                  , form: "tab",   generic: "Telmisartan"                                      , cls: "Blood pressure and heart", maker: "Highnoon" },
  { brand: "ACELAR"                      , strength: "5 mg"                   , form: "tab",   generic: "Enalapril"                                        , cls: "Blood pressure and heart", maker: "PharmEvo" },
  { brand: "RAMY"                        , strength: "5 mg"                   , form: "tab",   generic: "Ramipril"                                         , cls: "Blood pressure and heart", maker: "Getz" },
  { brand: "LASIX"                       , strength: "40 mg"                  , form: "tab",   generic: "Furosemide"                                       , cls: "Blood pressure and heart", maker: "Sanofi" },
  { brand: "SPIROMIDE"                   , strength: "20 mg + 50 mg"          , form: "tab",   generic: "Furosemide + Spironolactone"                      , cls: "Blood pressure and heart", maker: "Searle" },
  { brand: "ALDACTONE-A"                 , strength: "25 mg"                  , form: "tab",   generic: "Spironolactone"                                   , cls: "Blood pressure and heart", maker: "Searle" },
  { brand: "LOPRIN"                      , strength: "75 mg"                  , form: "tab",   generic: "Aspirin"                                          , cls: "Blood pressure and heart", maker: "Highnoon" },
  { brand: "ASCARD"                      , strength: "75 mg"                  , form: "tab",   generic: "Aspirin"                                          , cls: "Blood pressure and heart", maker: "Atco" },
  { brand: "LIPIGET"                     , strength: "20 mg"                  , form: "tab",   generic: "Atorvastatin"                                     , cls: "Blood pressure and heart", maker: "Getz" },
  { brand: "ROVISTA"                     , strength: "10 mg"                  , form: "tab",   generic: "Rosuvastatin"                                     , cls: "Blood pressure and heart", maker: "Getz" },
  { brand: "PLAVIX"                      , strength: "75 mg"                  , form: "tab",   generic: "Clopidogrel"                                      , cls: "Blood pressure and heart", maker: "Sanofi" },
  { brand: "NEBIL"                       , strength: "5 mg"                   , form: "tab",   generic: "Nebivolol"                                        , cls: "Blood pressure and heart", maker: "Getz" },

  /* Vitamins and minerals (18) */
  { brand: "SURBEX-Z"                    , strength: ""                       , form: "tab",   generic: "Multivitamin + Zinc"                              , cls: "Vitamins and minerals", maker: "Abbott" },
  { brand: "SURBEX-T"                    , strength: ""                       , form: "tab",   generic: "Vitamin B complex + Vitamin C"                    , cls: "Vitamins and minerals", maker: "Abbott" },
  { brand: "BECEFOL"                     , strength: ""                       , form: "tab",   generic: "Vitamin B complex + Folic acid"                   , cls: "Vitamins and minerals", maker: "Abbott" },
  { brand: "NEUROBION"                   , strength: ""                       , form: "tab",   generic: "Vitamin B1 + B6 + B12"                            , cls: "Vitamins and minerals", maker: "Martin Dow" },
  { brand: "CAC 1000 PLUS"               , strength: "1000 mg"                , form: "tab",   generic: "Calcium + Vitamin C"                              , cls: "Vitamins and minerals", maker: "GSK" },
  { brand: "QALSIUM D"                   , strength: ""                       , form: "tab",   generic: "Calcium + Vitamin D3"                             , cls: "Vitamins and minerals", maker: "GSK" },
  { brand: "FEROSOFT"                    , strength: "100 mg"                 , form: "tab",   generic: "Iron polymaltose"                                 , cls: "Vitamins and minerals", maker: "Hilton" },
  { brand: "FEROSOFT"                    , strength: "50 mg/5 ml"             , form: "syr",   generic: "Iron polymaltose"                                 , cls: "Vitamins and minerals", maker: "Hilton" },
  { brand: "FEROSOFT"                    , strength: "50 mg/ml"               , form: "drop",  generic: "Iron polymaltose"                                 , cls: "Vitamins and minerals", maker: "Hilton", route: "mouth" },
  { brand: "FEROSOFT FA"                 , strength: "0.35 mg + 100 mg"       , form: "tab",   generic: "Folic acid + Iron polymaltose"                    , cls: "Vitamins and minerals", maker: "Hilton" },
  { brand: "MALT"                        , strength: "0.35 mg + 50 mg"        , form: "tab",   generic: "Folic acid + Iron polymaltose"                    , cls: "Vitamins and minerals", maker: "Highnoon" },
  { brand: "FEFOL"                       , strength: ""                       , form: "cap",   generic: "Ferrous sulphate + Folic acid"                    , cls: "Vitamins and minerals", maker: "GSK" },
  { brand: "FOLIC ACID"                  , strength: "5 mg"                   , form: "tab",   generic: "Folic acid"                                       , cls: "Vitamins and minerals", maker: "Zafa" },
  { brand: "EVION"                       , strength: "400 mg"                 , form: "cap",   generic: "Vitamin E"                                        , cls: "Vitamins and minerals", maker: "Martin Dow" },
  { brand: "VI-DAYLIN DROPS"             , strength: ""                       , form: "drop",  generic: "Multivitamin"                                     , cls: "Vitamins and minerals", maker: "Abbott", route: "mouth" },
  { brand: "VI-DAYLIN"                   , strength: ""                       , form: "syr",   generic: "Multivitamin"                                     , cls: "Vitamins and minerals", maker: "Abbott" },
  { brand: "TRES-ORIX FORTE"             , strength: ""                       , form: "syr",   generic: "Multivitamin + Carnitine"                         , cls: "Vitamins and minerals", maker: "Highnoon" },
  { brand: "ZINKLET"                     , strength: "20 mg/5 ml"             , form: "syr",   generic: "Zinc sulphate"                                    , cls: "Vitamins and minerals", maker: "Hilton" },

  /* Skin (15) */
  { brand: "BETNOVATE"                   , strength: "0.1%"                   , form: "cream", generic: "Betamethasone"                                    , cls: "Skin", maker: "GSK", route: "skin" },
  { brand: "BETNOVATE-N"                 , strength: "0.1%"                   , form: "cream", generic: "Betamethasone + Neomycin"                         , cls: "Skin", maker: "GSK", route: "skin" },
  { brand: "DERMOVATE"                   , strength: "0.05%"                  , form: "cream", generic: "Clobetasol"                                       , cls: "Skin", maker: "GSK", route: "skin" },
  { brand: "CANESTEN"                    , strength: "1%"                     , form: "cream", generic: "Clotrimazole"                                     , cls: "Skin", maker: "Bayer", route: "skin" },
  { brand: "DAKTARIN"                    , strength: "2%"                     , form: "cream", generic: "Miconazole"                                       , cls: "Skin", maker: "Aspin", route: "skin" },
  { brand: "NIZORAL"                     , strength: "2%"                     , form: "cream", generic: "Ketoconazole"                                     , cls: "Skin", maker: "Aspin", route: "skin" },
  { brand: "TERSIL"                      , strength: "1%"                     , form: "cream", generic: "Terbinafine"                                      , cls: "Skin", maker: "Sami", route: "skin" },
  { brand: "POLYFAX"                     , strength: "skin ointment"          , form: "cream", generic: "Polymyxin B + Bacitracin"                         , cls: "Skin", maker: "GSK", route: "skin" },
  { brand: "BACTROBAN"                   , strength: "2%"                     , form: "cream", generic: "Mupirocin"                                        , cls: "Skin", maker: "GSK", route: "skin" },
  { brand: "LOTRIX"                      , strength: "5%"                     , form: "cream", generic: "Permethrin"                                       , cls: "Skin", maker: "GSK", route: "skin" },
  { brand: "KENACOMB"                    , strength: ""                       , form: "cream", generic: "Triamcinolone + Neomycin + Nystatin"              , cls: "Skin", maker: "GSK", route: "skin" },
  { brand: "CALAMINE LOTION"             , strength: ""                       , form: "cream", generic: "Calamine"                                         , cls: "Skin", maker: "", route: "skin" },
  { brand: "CYCLOZ"                      , strength: "5%"                     , form: "cream", generic: "Acyclovir"                                        , cls: "Skin", maker: "Highnoon", route: "skin" },
  { brand: "SUPRAVIRAN"                  , strength: "400 mg"                 , form: "tab",   generic: "Acyclovir"                                        , cls: "Skin", maker: "Searle" },
  { brand: "FUNGONE"                     , strength: "150 mg"                 , form: "cap",   generic: "Fluconazole"                                      , cls: "Skin", maker: "Sami" },

  /* Cough and cold (14) */
  { brand: "ACEFYL"                      , strength: ""                       , form: "syr",   generic: "Acefylline piperazine + Diphenhydramine"          , cls: "Cough and cold", maker: "Nabiqasim", check: true },
  { brand: "HYDRYLLIN"                   , strength: ""                       , form: "syr",   generic: "Aminophylline + Diphenhydramine"                  , cls: "Cough and cold", maker: "Searle", check: true },
  { brand: "HYDRYLLIN-DM"                , strength: ""                       , form: "syr",   generic: "Dextromethorphan + Diphenhydramine"               , cls: "Cough and cold", maker: "Searle", check: true },
  { brand: "PIRITON"                     , strength: "4 mg"                   , form: "tab",   generic: "Chlorpheniramine"                                 , cls: "Cough and cold", maker: "GSK" },
  { brand: "PIRITON EXPECTORANT"         , strength: ""                       , form: "syr",   generic: "Chlorpheniramine"                                 , cls: "Cough and cold", maker: "GSK", check: true },
  { brand: "ARINAC"                      , strength: "200 mg + 30 mg"         , form: "tab",   generic: "Ibuprofen + Pseudoephedrine"                      , cls: "Cough and cold", maker: "Abbott" },
  { brand: "ARINAC FORTE"                , strength: "400 mg + 60 mg"         , form: "tab",   generic: "Ibuprofen + Pseudoephedrine"                      , cls: "Cough and cold", maker: "Abbott" },
  { brand: "ARINAC"                      , strength: "100 mg + 15 mg/5 ml"    , form: "syr",   generic: "Ibuprofen + Pseudoephedrine"                      , cls: "Cough and cold", maker: "Abbott" },
  { brand: "NIGHTCARE"                   , strength: ""                       , form: "syr",   generic: "Dextromethorphan + Paracetamol + Promethazine"    , cls: "Cough and cold", maker: "Highnoon", check: true },
  { brand: "CUFGO DM"                    , strength: "10 mg + 30 mg + 1.25 mg", form: "tab",   generic: "Dextromethorphan + Pseudoephedrine + Triprolidine", cls: "Cough and cold", maker: "Highnoon", check: true },
  { brand: "VENTOLIN"                    , strength: "2 mg/5 ml"              , form: "syr",   generic: "Salbutamol"                                       , cls: "Cough and cold", maker: "GSK" },
  { brand: "VENTOLIN EXPECTORANT"        , strength: ""                       , form: "syr",   generic: "Salbutamol + Guaiphenesin"                        , cls: "Cough and cold", maker: "GSK", check: true },
  { brand: "MUCOLATOR"                   , strength: "200 mg"                 , form: "sachet",generic: "Acetylcysteine"                                   , cls: "Cough and cold", maker: "Abbott" },
  { brand: "FENOX"                       , strength: "0.5%"                   , form: "drop",  generic: "Phenylephrine"                                    , cls: "Cough and cold", maker: "Abbott", route: "nose" },

  /* Worms and parasites (13) */
  { brand: "METODINE DF"                 , strength: "500 mg + 400 mg"        , form: "tab",   generic: "Diloxanide furoate + Metronidazole"               , cls: "Worms and parasites", maker: "Searle" },
  { brand: "METODINE DF"                 , strength: "125 mg + 100 mg/5 ml"   , form: "syr",   generic: "Diloxanide furoate + Metronidazole"               , cls: "Worms and parasites", maker: "Searle" },
  { brand: "ZOLEN"                       , strength: "500 mg + 400 mg"        , form: "tab",   generic: "Diloxanide furoate + Metronidazole"               , cls: "Worms and parasites", maker: "Sami" },
  { brand: "ZENTEL"                      , strength: "200 mg"                 , form: "tab",   generic: "Albendazole"                                      , cls: "Worms and parasites", maker: "GSK" },
  { brand: "ZENTEL"                      , strength: "200 mg/5 ml"            , form: "syr",   generic: "Albendazole"                                      , cls: "Worms and parasites", maker: "GSK" },
  { brand: "VERMOX"                      , strength: "100 mg"                 , form: "tab",   generic: "Mebendazole"                                      , cls: "Worms and parasites", maker: "Aspin" },
  { brand: "VERMOX"                      , strength: "100 mg/5 ml"            , form: "syr",   generic: "Mebendazole"                                      , cls: "Worms and parasites", maker: "Aspin" },
  { brand: "MECTIN"                      , strength: "3 mg"                   , form: "tab",   generic: "Ivermectin"                                       , cls: "Worms and parasites", maker: "Highnoon" },
  { brand: "GETNIZOLE"                   , strength: "1 g"                    , form: "tab",   generic: "Secnidazole"                                      , cls: "Worms and parasites", maker: "Getz" },
  { brand: "IZATO"                       , strength: "500 mg"                 , form: "tab",   generic: "Nitazoxanide"                                     , cls: "Worms and parasites", maker: "Sami" },
  { brand: "IZATO"                       , strength: "100 mg/5 ml"            , form: "syr",   generic: "Nitazoxanide"                                     , cls: "Worms and parasites", maker: "Sami" },
  { brand: "ARTEM PLUS"                  , strength: "20 mg + 120 mg"         , form: "tab",   generic: "Artemether + Lumefantrine"                        , cls: "Worms and parasites", maker: "Hilton" },
  { brand: "ARTHEGET JUNIOR"             , strength: "15 mg + 90 mg/5 ml"     , form: "syr",   generic: "Artemether + Lumefantrine"                        , cls: "Worms and parasites", maker: "Getz" },

  /* Diabetes (12) */
  { brand: "GLUCOPHAGE"                  , strength: "500 mg"                 , form: "tab",   generic: "Metformin"                                        , cls: "Diabetes", maker: "Martin Dow" },
  { brand: "GLUCOPHAGE"                  , strength: "850 mg"                 , form: "tab",   generic: "Metformin"                                        , cls: "Diabetes", maker: "Martin Dow" },
  { brand: "NEODIPAR"                    , strength: "500 mg"                 , form: "tab",   generic: "Metformin"                                        , cls: "Diabetes", maker: "Sanofi" },
  { brand: "NEOPHAGE"                    , strength: "500 mg"                 , form: "tab",   generic: "Metformin"                                        , cls: "Diabetes", maker: "Abbott" },
  { brand: "AMARYL"                      , strength: "2 mg"                   , form: "tab",   generic: "Glimepiride"                                      , cls: "Diabetes", maker: "Sanofi" },
  { brand: "GETRYL"                      , strength: "2 mg"                   , form: "tab",   generic: "Glimepiride"                                      , cls: "Diabetes", maker: "Getz" },
  { brand: "GPRIDE"                      , strength: "2 mg"                   , form: "tab",   generic: "Glimepiride"                                      , cls: "Diabetes", maker: "Sami" },
  { brand: "GETFORMIN"                   , strength: "2 mg + 500 mg"          , form: "tab",   generic: "Glimepiride + Metformin"                          , cls: "Diabetes", maker: "Getz" },
  { brand: "DIAMICRON MR"                , strength: "60 mg"                  , form: "tab",   generic: "Gliclazide"                                       , cls: "Diabetes", maker: "Servier" },
  { brand: "GETZID MR"                   , strength: "60 mg"                  , form: "tab",   generic: "Gliclazide"                                       , cls: "Diabetes", maker: "Getz" },
  { brand: "ZOLID"                       , strength: "30 mg"                  , form: "tab",   generic: "Pioglitazone"                                     , cls: "Diabetes", maker: "Getz" },
  { brand: "TREVIA"                      , strength: "50 mg"                  , form: "tab",   generic: "Sitagliptin"                                      , cls: "Diabetes", maker: "Getz" },

  /* Eye and ear (10) */
  { brand: "TOBREX"                      , strength: ""                       , form: "drop",  generic: "Tobramycin"                                       , cls: "Eye and ear", maker: "Novartis", route: "eye" },
  { brand: "TOBRADEX"                    , strength: ""                       , form: "drop",  generic: "Tobramycin + Dexamethasone"                       , cls: "Eye and ear", maker: "Novartis", route: "eye" },
  { brand: "POLYFAX"                     , strength: "eye ointment"           , form: "cream", generic: "Polymyxin B + Bacitracin"                         , cls: "Eye and ear", maker: "GSK", route: "eye" },
  { brand: "GENTICYN"                    , strength: ""                       , form: "drop",  generic: "Gentamicin"                                       , cls: "Eye and ear", maker: "Ray Pharma", route: "eye" },
  { brand: "GENTICYN HC"                 , strength: ""                       , form: "drop",  generic: "Gentamicin + Hydrocortisone"                      , cls: "Eye and ear", maker: "Ray Pharma", route: "eye" },
  { brand: "OTOSPORIN"                   , strength: ""                       , form: "drop",  generic: "Polymyxin B + Neomycin + Hydrocortisone"          , cls: "Eye and ear", maker: "GSK", route: "ear" },
  { brand: "LIDOSPORIN"                  , strength: ""                       , form: "drop",  generic: "Polymyxin B + Lignocaine"                         , cls: "Eye and ear", maker: "GSK", route: "ear" },
  { brand: "BETNESOL-N"                  , strength: ""                       , form: "drop",  generic: "Betamethasone + Neomycin"                         , cls: "Eye and ear", maker: "GSK", route: "eye" },
  { brand: "ABBOWAX"                     , strength: "6.5%"                   , form: "drop",  generic: "Carbamide peroxide"                               , cls: "Eye and ear", maker: "Abbott", route: "ear" },
  { brand: "HITOGEN"                     , strength: ""                       , form: "drop",  generic: "Benzocaine + Phenazone"                           , cls: "Eye and ear", maker: "Highnoon", route: "ear" },

  /* Nerves and sleep (10) */
  { brand: "LEXOTANIL"                   , strength: "3 mg"                   , form: "tab",   generic: "Bromazepam"                                       , cls: "Nerves and sleep", maker: "Roche" },
  { brand: "LEXILIUM"                    , strength: "3 mg"                   , form: "tab",   generic: "Bromazepam"                                       , cls: "Nerves and sleep", maker: "Sami" },
  { brand: "ALP"                         , strength: "0.5 mg"                 , form: "tab",   generic: "Alprazolam"                                       , cls: "Nerves and sleep", maker: "Hilton" },
  { brand: "PRAZ"                        , strength: "0.5 mg"                 , form: "tab",   generic: "Alprazolam"                                       , cls: "Nerves and sleep", maker: "Getz" },
  { brand: "MAGURA"                      , strength: "0.5 mg"                 , form: "tab",   generic: "Clonazepam"                                       , cls: "Nerves and sleep", maker: "Sami" },
  { brand: "XOLNOX"                      , strength: "10 mg"                  , form: "tab",   generic: "Zolpidem"                                         , cls: "Nerves and sleep", maker: "Highnoon" },
  { brand: "MORCET"                      , strength: "10 mg"                  , form: "tab",   generic: "Escitalopram"                                     , cls: "Nerves and sleep", maker: "Searle" },
  { brand: "SERONIL"                     , strength: "20 mg"                  , form: "cap",   generic: "Fluoxetine"                                       , cls: "Nerves and sleep", maker: "Searle" },
  { brand: "GABICA"                      , strength: "75 mg"                  , form: "cap",   generic: "Pregabalin"                                       , cls: "Nerves and sleep", maker: "Getz" },
  { brand: "NEUPENTIN"                   , strength: "300 mg"                 , form: "cap",   generic: "Gabapentin"                                       , cls: "Nerves and sleep", maker: "Highnoon" },

  /* Asthma and chest (9) */
  { brand: "VENTOLIN EVOHALER"           , strength: "100 mcg"                , form: "other", generic: "Salbutamol"                                       , cls: "Asthma and chest", maker: "GSK" },
  { brand: "VENTOLIN RESPIRATOR SOLUTION", strength: "5 mg/ml"                , form: "other", generic: "Salbutamol"                                       , cls: "Asthma and chest", maker: "GSK" },
  { brand: "SALBO"                       , strength: "100 mcg"                , form: "other", generic: "Salbutamol"                                       , cls: "Asthma and chest", maker: "Getz" },
  { brand: "BEKSON"                      , strength: "50 mcg"                 , form: "other", generic: "Beclomethasone"                                   , cls: "Asthma and chest", maker: "Getz" },
  { brand: "MONTIGET"                    , strength: "10 mg"                  , form: "tab",   generic: "Montelukast"                                      , cls: "Asthma and chest", maker: "Getz" },
  { brand: "MONTIGET"                    , strength: "4 mg"                   , form: "sachet",generic: "Montelukast"                                      , cls: "Asthma and chest", maker: "Getz" },
  { brand: "MYTEKA"                      , strength: "10 mg"                  , form: "tab",   generic: "Montelukast"                                      , cls: "Asthma and chest", maker: "Hilton" },
  { brand: "AEROKAST"                    , strength: "4 mg"                   , form: "sachet",generic: "Montelukast"                                      , cls: "Asthma and chest", maker: "Barrett Hodgson" },
  { brand: "XANTHIUM"                    , strength: "200 mg"                 , form: "cap",   generic: "Theophylline"                                     , cls: "Asthma and chest", maker: "Searle" },

  /* Other (5) */
  { brand: "SERC"                        , strength: "16 mg"                  , form: "tab",   generic: "Betahistine"                                      , cls: "Other", maker: "Abbott" },
  { brand: "BETNESOL"                    , strength: "0.5 mg"                 , form: "tab",   generic: "Betamethasone"                                    , cls: "Other", maker: "GSK" },
  { brand: "CITRO SODA"                  , strength: ""                       , form: "sachet",generic: "Sodium citrate + Citric acid"                     , cls: "Other", maker: "Abbott" },
  { brand: "ZYLORIC"                     , strength: "100 mg"                 , form: "tab",   generic: "Allopurinol"                                      , cls: "Other", maker: "GSK" },
  { brand: "T-LEX"                       , strength: "2 mg"                   , form: "tab",   generic: "Tizanidine"                                       , cls: "Other", maker: "Getz" },

  /* Womens health (5) */
  { brand: "DUPHASTON"                   , strength: "10 mg"                  , form: "tab",   generic: "Dydrogesterone"                                   , cls: "Womens health", maker: "Highnoon" },
  { brand: "TRANSAMIN"                   , strength: "500 mg"                 , form: "cap",   generic: "Tranexamic acid"                                  , cls: "Womens health", maker: "Hilton" },
  { brand: "DRAVIX"                      , strength: "500 mg"                 , form: "cap",   generic: "Tranexamic acid"                                  , cls: "Womens health", maker: "Getz" },
  { brand: "CEROPHENE"                   , strength: "50 mg"                  , form: "tab",   generic: "Clomiphene"                                       , cls: "Womens health", maker: "Hilton" },
  { brand: "CLOTEEN V"                   , strength: "2%"                     , form: "other", generic: "Clotrimazole"                                     , cls: "Womens health", maker: "Highnoon" },

  /* Rehydration and salts (4) */
  { brand: "PEDITRAL"                    , strength: ""                       , form: "sachet",generic: "Oral rehydration salts"                           , cls: "Rehydration and salts", maker: "Searle" },
  { brand: "HILYTER-R"                   , strength: ""                       , form: "sachet",generic: "Oral rehydration salts"                           , cls: "Rehydration and salts", maker: "Hilton" },
  { brand: "INFALYTE"                    , strength: ""                       , form: "sachet",generic: "Oral rehydration salts"                           , cls: "Rehydration and salts", maker: "Searle" },
  { brand: "PEDIALYTE"                   , strength: ""                       , form: "other", generic: "Oral rehydration salts"                           , cls: "Rehydration and salts", maker: "Abbott" },
]

/**
 * THE FORMULA COLUMN, TAKEN FROM THE SHELF INSTEAD OF FROM GENEVA.
 *
 * The generic field used to be checked against the WHO essential medicines
 * list, and a medicine whose formula was not on it was labelled "not on the WHO
 * list, check it". That reads as a scolding, and on a Pakistani shelf it is
 * simply wrong: plenty of what a Larkana GP writes every evening has a perfectly
 * ordinary formula that WHO, whose list is about what a national programme must
 * stock, never had a reason to name.
 *
 * So the formulas he is offered are the formulas on the shelf in front of him.
 * These 140-odd are what these 249 brands are made of, which is the population
 * he will actually be typing from. Anything else he types is still accepted, as
 * it always was: this is a list of suggestions, never a gate.
 */
export const PK_GENERICS: string[] =
  [...new Set(PK_MEDS.map(m => m.generic).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const gk = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Which classes a formula turns up in, so a search for "cough" reaches it. */
const CLS_OF = new Map<string, string>()
for (const m of PK_MEDS) if (!CLS_OF.has(m.generic)) CLS_OF.set(m.generic, m.cls)
export const pkClassOf = (generic: string): string | undefined => CLS_OF.get(generic)

/** Prefix first, then anywhere. Not fuzzy, for the same reason the brand search
 *  is not: a near miss between two molecule names is not a typing convenience,
 *  it is a different medicine. */
export function searchPkGenerics(q: string, limit = 8): string[] {
  const k = gk(q)
  if (k.length < 2) return []
  const starts = PK_GENERICS.filter(g => gk(g).startsWith(k))
  const has = PK_GENERICS.filter(g => !gk(g).startsWith(k) && gk(g).includes(k))
  return [...starts, ...has].slice(0, limit)
}

/** Every brand on the shelf made of this formula, for the "two brands, one
 *  molecule" check and for showing a doctor what else would do the same job. */
export const pkBrandsOf = (generic: string): PkMed[] =>
  PK_MEDS.filter(m => gk(m.generic) === gk(generic))
