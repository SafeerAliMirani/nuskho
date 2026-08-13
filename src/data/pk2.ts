import type { Form } from '../types'
import type { PkMed } from './pk'

// THE SECOND SHELF. GENERATED FILE, DO NOT EDIT BY HAND.
//
// 5363 packs, 3102 brands, 37 makers, harvested from
// druginfosys.com manufacturer catalogue pages on 11 Aug 2026 and machine
// audited (schema, vocabulary, duplicates, injectables, withdrawn molecules,
// collision with pk.ts). A 44-row random sample was re-verified against the
// source pages by independent agents: 0 invented rows. The harvest method,
// its known gaps and every judgement call live in research/pk2-source.json
// and the project log.
//
// THE SAME RULE AS pk.ts, RESTATED: a row claims only what the source page
// printed. 282 rows carry an empty strength because the page printed none
// we trusted, and an empty strength beats a remembered one. Rows with
// check:true carry a printed-but-not-credible number and stay marked until a
// person reads the real box.
//
// Rows are pipe-packed and parsed once at load: brand|strength|form#|generic#|
// cls#|maker#|source#|check|sd. Tables below de-duplicate the repeated
// strings. To change anything, edit research/pk2-source.json and re-run
// scripts/pk2gen.mjs. Sindhi suggestions (0 of 5363 rows carry one) come
// from research/pk2-sindhi.json through the same generator, and stay
// suggestions: nothing prints until a person in the clinic ticks it.

const F: Form[] = ["tab","cap","syr","drop","cream","sachet","inhaler","supp","patch","other"] as Form[]
const C = ["Antibiotic","Painkiller and fever","Stomach and acid","Blood pressure and heart","Allergy","Vitamins and minerals","Skin","Cough and cold","Worms and parasites","Diabetes","Nerves and sleep","Eye and ear","Asthma and chest","Womens health","Rehydration and salts","Other"]
const M = ["AGP","Abbott","Amson","Atco","Barrett Hodgson","Bayer","Bosch","CCL","Continental","Efroze","Ferozsons","GSK","Genix","Getz","Global","Helix","Highnoon","Hilton","Hiranis","Indus","Macter","Martin Dow","Nabiqasim","Novartis","OBS","Pfizer","PharmEvo","Platinum","Sami","Sanofi","Searle","Servier","Standpharm","Vision","Werrick","Wilshire","Zafa"]
const S = ["abbott-gsk","atco-agp-barrett","bosch-wilshire-werrick","getz-searle","global-efroze-macter-ccl","gsk-tail","highnoon-hilton","indus-zafa-amson","martindow-ferozsons","multinationals","sami-pharmevo"]
const G = ["Acarbose","Aceclofenac","Acefyllin Piperazine + Dimenhydrinate","Acefyllin Piperazine + Diphenhydramine","Acefylline","Acetazolamide (Na)","Acyclovir","Adaplene","Albendazole","Albuterol","Albuterol + Beclomethasone (Dipropionate)","Albuterol + Ipratropium (Br)","Alcohol + Cyanocobalamin + Ferric Pyrophosphate + Lysine + Pyridoxine + Sorbitol + Thiamine HCl (Vitamin B1)","Alcohol + Eucalyptol + Lignocaine + Menthol","Alcohol + Guaifenesin + Oxtriphylline (Choline Theophyllinate)","Alcohol + Pholcodine + Promethazine (HCl)","Alendronate (Na)","Alendronate (Na) + Cholecalciferol","Alfacalcidol","Alfuzosin","Aliskiren","Aliskiren + Hydrochlorothiazide","Aliskiren + Valsartan","Allantoin + Ephedrine + Lignocaine","Almitrine + Raubasine","Alprazolam","Aluminium Chloride Hexahydrate","Aluminium Hydroxide And Oxide","Aluminium Hydroxide And Oxide + Magnesium Oxides And Hydroxides","Aluminium Hydroxide and Oxide + Kaolin","Aluminium Hydroxide and Oxide + Magnesium Oxides and Hydroxides","Aluminium Hydroxide and Oxide + Magnesium Oxides and Hydroxides + Oxethazaine","Aluminium Hydroxide and Oxide + Magnesium Oxides and Hydroxides + Simethicone","Aluminium Hydroxide and Oxide + Magnesium Trisilicate","Ambroxol (HCl)","Amcinonide","Amiloride (HCl) + Frusemide","Amiloride (HCl) + Frusemide or Furosemide","Amiloride (HCl) + Hydrochlorothiazide","Aminophylline","Aminophylline + Ammonium Chloride + Diphenhydramine","Aminophylline + Ammonium Chloride + Diphenhydramine + Menthol","Aminoprofen","Amiodarone (HCl)","Amisulpride","Amitriptyline (HCl)","Amlodipine (Besylate)","Amlodipine (Besylate) + Atorvastatin","Amlodipine (Besylate) + Benazepril (HCl)","Amlodipine (Besylate) + Hydrochlorothiazide","Amlodipine (Besylate) + Hydrochlorothiazide + Valsartan","Amlodipine (Besylate) + Olmesartan Medoxomil","Amlodipine (Besylate) + Perindopril","Amlodipine (Besylate) + Telmisartan","Amlodipine (Besylate) + Valsartan","Ammonium Chloride","Ammonium Chloride + Chlorpheniramine (Maleate)","Ammonium Chloride + Chlorpheniramine (Maleate) + Dextromethorphan + Ephedrine + Potassium Guaiacolsulphonate + Sodium Acid Citrate + Terpin Hydrate","Ammonium Chloride + Chlorpheniramine (Maleate) + Ephedrine + Menthol + Potassium Bicarbonate + Potassium Guaiacolsulphonate + Senega + Terpin Hydrate","Ammonium Chloride + Chlorpheniramine (Maleate) + Sodium Citrate","Ammonium Chloride + Chlorpheniramine + Dextromethorphan","Ammonium Chloride + Dextromethorphan + Guaifenesin + Phenylephrine (HCl) + Pyrilamine (Maleate)","Amodiaquine","Amodiaquine + Artesunate","Amoxicillin","Amoxicillin + Clavulanic Acid","Amoxicillin + Floxacillin (Na)","Ampicillin","Ampicillin + Cloxacillin","Ampicillin + Sulbactam","Antazoline","Antazoline + Naphazoline","Aripiprazole","Artemether","Artemether + Lumefantrine","Artemisinin","Artesunate + Pyrimethamine + Sulfadoxine","Artesunate + Sulfadoxine","Ascorbic Acid","Ascorbic Acid + Betacarotene + Optazine + Selenium (Sulphide) + Tocopherol (Vitamin E)","Ascorbic Acid + Biotin + Calcifediol + Calcium + Calcium Pantothenate + Copper + Cyanocobalamin + Folic Acid + Iodine + Iron Salts + Magnesium Oxides and Hydroxides + Manganese + Nicotinamide + Phosphorus + Potassium Iodide + Potassium Salts + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Oxide","Ascorbic Acid + Biotin + Calcifediol + Calcium + Calcium Pantothenate + Copper + Cyanocobalamin + Folic Acid + Iron Salts + Magnesium Oxides and Hydroxides + Manganese + Molybdenum + Nicotinamide + Phosphorus + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Oxide","Ascorbic Acid + Biotin + Calciferol + Calcium + Chloride + Chromium + Copper + Cyanocobalamin + Folic Acid + Iodine + Iron Salts + Magnesium Oxides and Hydroxides + Manganese + Molybdenum + Nicotinic Acid + Pantothenic Acid + Phosphorus + Potassium Salts + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Selenium (Sulphide) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Oxide","Ascorbic Acid + Biotin + Calciferol + Calcium + Chromium + Cyanocobalamin + Folic Acid + Iodine + Iron Salts + Magnesium Oxides and Hydroxides + Manganese + Molybdenum + Nicotinic Acid + Pantothenic Acid + Pyridoxine + Riboflavin (Vitamin B2) + Selenium (Sulphide) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Oxide","Ascorbic Acid + Biotin + Calcium + Cyanocobalamin + Magnesium Oxides and Hydroxides + Nicotinamide + Pantothenic Acid + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Biotin + Calcium Pantothenate + Copper + Cyanocobalamin + Folic Acid + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Sulphate","Ascorbic Acid + Calciferol + Calcium + Calcium Carbonate","Ascorbic Acid + Calciferol + Calcium + Calcium Pantothenate + Copper + Cyanocobalamin + Folic Acid + Iodine + Iron Salts + Magnesium Oxides and Hydroxides + Manganese + Nicotinamide + Potassium Salts + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Oxide","Ascorbic Acid + Calciferol + Calcium + Calcium Pantothenate + Copper + Cyanocobalamin + Iodine + Iron Salts + Magnesium Oxides and Hydroxides + Manganese + Nicotinamide + Potassium Salts + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Calciferol + Calcium Carbonate + Cyanocobalamin + Ferrous Sulphate + Folic Acid + Iodine + Magnesium Oxides and Hydroxides + Nicotinamide + Pyridostigmine (Br) + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Oxide","Ascorbic Acid + Calciferol + Calcium Carbonate + Pyridoxine","Ascorbic Acid + Calciferol + Cyanocobalamin + Folic Acid + Iron Salts + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Calciferol + Nicotinamide + Pantothenic Acid + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Calciferol + Nicotinamide + Retinol + Riboflavin + Thiamine (HCl)","Ascorbic Acid + Calcitriol + Calcium + Calcium Pantothenate + Copper + Cyanocobalamin + Folic Acid + Iodine + Iron Salts + Magnesium Oxides and Hydroxides + Manganese + Nicotinamide + Potassium Salts + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Oxide","Ascorbic Acid + Calcitriol + Calcium Pantothenate + Cyanocobalamin + Folic Acid + Nicotinamide + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E)","Ascorbic Acid + Calcitriol + Cyanocobalamin + D-Pantothenol + Nicotinamide + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Calcitriol + Cyanocobalamin + Nicotinamide + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Calcium + Calcium Carbonate","Ascorbic Acid + Calcium Carbonate + Calcium Gluconate + Calcium Lactate","Ascorbic Acid + Calcium Carbonate + Calcium Glycerophosphate + Calcium Pantothenate + Nicotinamide + Pyridoxine + Riboflavin + Thiamine (HCl)","Ascorbic Acid + Calcium Carbonate + Calcium Glycerophosphate + Calcium Pantothenate + Nicotinamide + Pyridoxine + Riboflavin + Thiamine HCl","Ascorbic Acid + Calcium Carbonate + Calcium Lactate","Ascorbic Acid + Calcium Pantothenate + Cyanocobalamin + Inositol + Lysine + Nicotinamide + Pyridoxine + Riboflavin + Thiamine (HCl)","Ascorbic Acid + Calcium Pantothenate + Cyanocobalamin + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Calcium Pantothenate + Nicotinic Acid + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Chlorpheniramine (Maleate) + Dextromethorphan + Paracetamol + Pseudoephedrine (HCl)","Ascorbic Acid + Copper + Manganese + Retinol (Vitamin A) + Selenium (Sulphide) + Tocopherol (Vitamin E) + Zinc Oxide","Ascorbic Acid + Cyanocobalamin + D-Pantothenol + Inositol + Lysine + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Cyanocobalamin + D-Pantothenol + Nicotinic Acid + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Cyanocobalamin + Ferrous Fumarate + Folic Acid + Tocopherol (Vitamin E)","Ascorbic Acid + Cyanocobalamin + Inositol + Lysine + Nicotinamide","Ascorbic Acid + Cyanocobalamin + Inositol + Lysine + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Sodium Pantothenate + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Cyanocobalamin + Iron Salts + Pyridoxine + Riboflavin + Thiamine HCl","Ascorbic Acid + Cyanocobalamin + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Ascorbic Acid + Ferrous Sulphate + Folic Acid + Mucoprotease","Ascorbic Acid + Ferrous Sulphate + Folic Acid + Nicotinamide + Pyridoxine + Riboflavin + Thiamine HCl","Ascorbic Acid + Paracetamol","Ascorbic Acid + Sodium Ascorbate","Ascorbic Acid + Vitamin B Complex","Aspirin","Aspirin + Caffeine + Paracetamol","Aspirin + Clopidogrel","Aspirin + Paracetamol","Atenolol","Atenolol + Chlorthalidone","Atomoxetine (HCl)","Atorvastatin","Atorvastatin + Ezetimibe","Atovaquone + Proguanil (HCl)","Atropine (Sulphate)","Atropine (Sulphate) + Diphenoxylate (HCl)","Attapulgite","Azelaic Acid","Azithromycin","Bacampicillin","Bacitracin + Hydrocortisone + Neomycin + Polymyxin B (Sulphate)","Bacitracin + Lignocaine + Neomycin + Polymyxin B","Bacitracin + Lignocaine + Neomycin + Polymyxin B (Sulphate)","Bacitracin + Lignocaine + Polymyxin B (Sulphate)","Bacitracin + Neomycin","Bacitracin + Polymyxin B (Sulphate)","Baclofen","Bambuterol","Beclomethasone (Dipropionate)","Benzalkonium (Cl) + Zinc Oxide","Benzhexol (HCl)","Benzoyl Peroxide","Benzoyl Peroxide + Clindamycin","Benzoyl Peroxide + Glycolic Acid","Benzoyl Peroxide + Hydroxyquinolone Sulphate","Benzydamine","Benzydamine + Cetylpyridinium Chloride","Benzyl Benzoate","Beraprost","Betahistine (HCl)","Betamethasone","Betamethasone + Calcipotriol","Betamethasone + Clotrimazole","Betamethasone + Fusidic Acid","Betamethasone + Gentamicin","Betamethasone + Miconazole (Nitrate) + Neomycin","Betamethasone + Neomycin","Betamethasone + Salicylic Acid","Betaxolol (HCl)","Bezafibrate","Bifonazole","Bimatoprost","Biotin + Calcitriol + Calcium + Calcium Pantothenate + Copper + Cyanocobalamin + Folic Acid + Iron Salts + Magnesium Oxides and Hydroxides + Manganese + Molybdenum + Nicotinamide + Phosphorus + Pyridoxine + Retinol (Vitamin A) + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E) + Zinc Oxide","Biotin + Calcium Pantothenate + Cyanocobalamin + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Biotin + Choline Bitartrate + Cyanocobalamin + D-Pantothenol + Folic Acid + Methionine + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1) + Tocopherol (Vitamin E)","Biotin + Cyanocobalamin + Folic Acid + Inositol + Nicotinic Acid + Pantothenic Acid + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Biotin + D-Pantothenol + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Bisacodyl","Bismuth Salts + Castor Oil","Bismuth Subsalicylates","Bisoprolol (Fumarate)","Bisoprolol (Fumarate) + Hydrochlorothiazide","Bovine Collagen + Calciferol + Calcium + Phosphorus","Brimonidine (Tartrate)","Brinzolamide","Bromazepam","Bromelains + Trypsin (Protease)","Bromohexine","Bromohexine + Erythromycin","Buclizine (HCl)","Budesonide","Budesonide + Formoterol (Fumarate)","Buprenorphine (HCl)","Bupropion (HCl)","Buspirone (HCl)","Buzepide Methiodide + Clocinizine (HCl) + Pholcodine","Caffeine + Codeine + Paracetamol","Caffeine + Cyclizine + Ergotamine (Tartrate)","Caffeine + Diazepam + Paracetamol","Caffeine + Dihydroergocryptine","Caffeine + Ergotamine (Tartrate)","Caffeine + Mepyramine + Paracetamol","Caffeine + Orphenadrine + Paracetamol","Caffeine + Paracetamol","Caffeine + Propyphenazone","Calamine + Camphor + Diphenhydramine","Calcifediol + Retinol (Vitamin A) + Tocopherol (Vitamin E)","Calcifediol + Retinol + Riboflavin + Thiamine","Calciferol + Calcium","Calciferol + Calcium + Ossein + Phosphorus","Calciferol + Calcium Carbonate","Calcipotriol","Calcium","Calcium + Calcium Carbonate","Calcium + Phosphorus","Calcium + Sucrose","Calcium Carbonate","Calcium Carbonate + Calcium Lactate","Calcium Carbonate + Cholecalciferol","Calcium Dobesilate","Calcium Gluconoglucoheptonate + Dimethyl Amino Ethanol Pyroglutamate + Lysine + Phosphoric Acid","Calcium Gluconoglucoheptonate + Dimethyl Amino Ethanol Pyroglutamate + Lysine + Phosphoric Acid + Sorbitol","Calcium Pantothenate + Choline Magnesium Trisalicylate + Cyanocobalamin + Inositol + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Calcium Pantothenate + Cyanocobalamin + Nicotinamide + Papain + Pepsin + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Calcium Pantothenate + Cyanocobalamin + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Camphor + Eucalyptol + Menthol + Thymol","Camphor + Menthol + Methyl Salicylate","Candesartan","Candesartan + Hydrochlorothiazide","Captodiamine (HCl)","Captopril","Captopril + Hydrochlorothiazide","Carbamazepine","Carbidopa + Entacapone + Levodopa","Carbidopa + Levodopa","Carbimazole","Carbinoxamine (Maleate) + Ephedrine + Pholcodine","Carbinoxamine (Maleate) + Pseudoephedrine (HCl)","Carbocisteine","Carbocisteine + Promethazine (HCl)","Carbocysteine","Carbocysteine + Promethazine (HCl)","Carnitine","Carnitine + Lysine + Metopine + Thiamine HCl (Vitamin B1)","Carvedilol","Cefaclor (Monohydrate)","Cefadroxil","Cefatrizine","Cefdinir","Cefixime","Cefpodoxime","Cefprozil (Monohydrate)","Cefuroxime","Celecoxib","Cephalexin (Monohydrate)","Cephradine","Cetirizine","Chloramphenicol","Chloramphenicol + Hydrocortisone","Chloramphenicol + Hydroxypropyl Methylcellulose","Chlorbutol","Chlorhexidine + D-Pantothenol","Chloroquine","Chlorpheniramine (Maleate)","Chlorpheniramine (Maleate) + Dextromethorphan + Ephedrine + Sodium Citrate","Chlorpheniramine (Maleate) + Dextromethorphan + Paracetamol","Chlorpheniramine (Maleate) + Dextromethorphan + Paracetamol + Pseudoephedrine (HCl)","Chlorpheniramine (Maleate) + Dextromethorphan + Pseudoephedrine (HCl)","Chlorpheniramine (Maleate) + Paracetamol + Pseudoephedrine (HCl)","Chlorpheniramine (Maleate) + Pholcodine + Pseudoephedrine (HCl)","Chlorpheniramine + Dextromethorphan + Pseudoephedrine","Chlorpromazine (HCl)","Chlorpropamide","Chlorquinaldol + Diflucortolone (Valerate)","Cholecalciferol","Cholecalciferol + Retinol (Vitamin A)","Chondroitin Sulphate + Glucosamine","Chondroitin Sulphate + Glucosamine (Sulphate)","Chymotrypsin + Trypsin (Protease)","Ciclonium (Br)","Cilostazole","Cimetidine (HCl)","Cinitapride","Cinnarizine + Domperidone","Ciprofloxacin","Ciprofloxacin + Dexamethasone","Ciprofloxacin + Lignocaine","Citalopram (HBr)","Citicoline","Citric Acid + Sodium Bicarbonate + Sodium Citrate + Tartaric Acid","Citric Acid + Sodium Bicarbonate + Sodium Tartrate + Tartaric Acid","Citrulline","Clarithromycin","Clarithromycin + Metronidazole + Omeprazole","Clemastine","Clindamycin","Clobazam","Clobetasol (Propionate)","Clobetasol (Propionate) + Neomycin + Nystatin","Clobetasol (Propionate) + Salicylic Acid","Clobetasol + Neomycin + Nystatin","Clomipramine (HCl)","Clonazepam","Clopidogrel","Clorazepate (K)","Clotrimazole","Clotrimazole + Dexamethasone","Clotrimazole + Hydrocortisone","Cloxacillin","Clozapine","Co-Dergocrine Mesylate","Coal Tar + Resorcinol + Salicylic Acid + Sulphur","Codeine + Ibuprofen","Codeine + Paracetamol","Croconazole (HCl)","Crotamiton","Crotamiton + Sulphur","Cyanocobalamin","Cyanocobalamin + Folic Acid + Nicotinamide + Papain + Pepsin + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Cyanocobalamin + Folic Acid + Orotic Acid","Cyanocobalamin + L-Ornithine L-Aspartate + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Cyanocobalamin + Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Cyanocobalamin + Nicotinamide + Pyridoxine + Riboflavin + Thiamine HCl + Tocopherol","Cyanocobalamin + Pyridoxine + Thiamine (HCl)","Cyanocobalamin + Pyridoxine + Thiamine HCl (Vitamin B1)","Cyclizine","Cyclobenzaprine Hydrochloride","Cyclopentolate (HCl)","Cyproheptadine (HCl)","Cyproterone (Acetate) + Estradiol","Cyproterone (Acetate) + Ethinyloestradiol","D-Pantothenol","Danazol","Desloratadine","Desloratadine + Pseudoephedrine (HCl)","Desmopressin (Acetate)","Desogestrel + Ethinyloestradiol","Desvenlafaxine","Dexamethasone","Dexamethasone + Framycetin + Gramicidin","Dexamethasone + Hydroxypropyl Methylcellulose","Dexamethasone + Hydroxypropyl Methylcellulose + Neomycin + Polymyxin B (Sulphate)","Dexamethasone + Moxifloxacin","Dexamethasone + Neomycin","Dexamethasone + Neomycin + Polymyxin B","Dexamethasone + Tobramycin","Dexibuprofen","Dextromethorphan","Dextromethorphan + Diphenhydramine","Dextromethorphan + Diphenhydramine + Menthol + Pseudoephedrine (HCl)","Dextromethorphan + Guaifenesin + Pseudoephedrine (HCl)","Dextromethorphan + Paracetamol + Pseudoephedrine (HCl)","Dextromethorphan + Pseudoephedrine (HCl)","Dextromethorphan + Pseudoephedrine (HCl) + Triprolidine (HCl)","Di-Hydroxydibutylether","Di-Iodohydroxyquinoline + Metronidazole","Diacerein","Diazepam","Dibromopropamidine (Isethionate)","Diclofenac (K)","Diclofenac (Na)","Diclofenac (Na) + Misoprostol","Diclofenac Diethylammonium","Diclofenac Free Acid","Diflucortolone (Valerate)","Diflucortolone (Valerate) + Isoconazole (Nitrate)","Digestive Enzyme Complex","Digoxin","Dihydroartemisinin + Piperaquine Phosphate","Diloxanide (Furoate) + Metronidazole","Diltiazem (HCl)","Dimecrotic Acid","Dimemorfan Phosphate","Dimenhydrinate","Diosmin + Hesperidin","Diphenhydramine + Paracetamol + Pholcodine + Pseudoephedrine (HCl)","Diphenhydramine + Piperaquine Phosphate","Dipivefrine","Dipyridamole","Disopyramide","Domperidone","Donepezil (HCl)","Dorzolamide","Dorzolamide + Timolol","Dorzolamide + Timolol (Maleate)","Dothiepin (HCl)","Doxazosin (Mesylate)","Doxofylline","Doxycycline","Doxylamine Succinate + Pyridoxine","Drotaverine","Duloxetine (HCl)","Duloxetine Hydrochloride","Dutasteride","Dutasteride + Tamsulosin Hydrochloride","Dydrogesterone","Dydrogesterone + Estradiol","Ebastine","Eflornithine","Eletriptan","Emedastine","Enalapril (Maleate)","Enalapril (Maleate) + Hydrochlorothiazide","Enoxacin","Eperisone (HCl)","Ephedrine","Ephedrine + Hydroxyzine + Theophylline","Ephedrine + Pholcodine + Promethazine (HCl)","Eplerenone","Eprosartan","Erdosteine","Erythromycin","Erythromycin + Glycolic Acid","Erythromycin + Isotretinoin","Erythromycin + Sulfisoxazole","Escitalopram","Esomeprazole","Estazolam","Estradiol (Valerate)","Estradiol (Valerate) + Estradiol + Norgestrel","Estriol","Estrogens Conjugated","Eszopiclone","Ethinyloestradiol + Gestodene","Ethinyloestradiol + Levonorgestrel","Ethinyloestradiol + Norethisterone","Etidronate (Disodium)","Etifoxine (HCl)","Etoricoxib","Eucalyptol + Menthol","Eucalyptol + Menthol + Methyl Salicylate + Thymol","Euflavine + Thymol","Ezetimibe","Ezetimibe + Simvastatin","Famciclovir","Famotidine","Febuxostat","Felodipine","Fenofibrate","Fenticonazole","Ferric Ammonium Citrate + Folic Acid + Glucose + Nicotinamide + Pyridoxine + Thiamine (HCl)","Ferric Ammonium Citrate + Folic Acid + Nicotinamide + Pyridoxine + Thiamine HCl","Ferrous Fumarate","Ferrous Fumarate + Folic Acid","Ferrous Gluconate + Folic Acid + Cyanocobalamin + Ascorbic Acid + Copper + Manganese + Sorbitol","Ferrous Sulphate","Ferrous Sulphate + Folic Acid","Fexofenadine","Fexofenadine + Pseudoephedrine (HCl)","Finasteride","Flavoxate (HCl)","Flecainide (Acetate)","Floctafenine","Fluclorolone Acetonide + Hydroquinone + Tretinoin","Fluconazole","Fludiazepam","Fluocinolone (Acetonide) + Hydroquinone + Tretinoin","Fluocortolone","Fluorometholone","Fluorometholone + Gentamicin","Fluorometholone + Naphazoline","Fluorometholone + Neomycin","Fluorometholone + Polyvinyl Alcohol","Fluorometholone + Tetrahydrozoline","Fluorometholone + Tetrahydrozoline (HCl)","Fluoxetine (HCl)","Fluoxetine (HCl) + Olanzapine","Fluphenazine + Nortriptyline (HCl)","Flurbiprofen","Fluticasone Propionate","Fluticasone Propionate + Salmeterol","Fluvastatin","Fluvoxamine (Maleate)","Folic Acid","Folic Acid + Iron Hydroxide Poly Maltose Complex","Folic Acid + Iron Protein Succinylate","Folic Acid + Iron Salts","Folinic Acid + Iron Hydroxide Poly Maltose Complex","Formoterol (Fumarate)","Formoterol (Fumarate) + Tiotropium","Fosfomycin","Fosinopril (Na)","Frusemide","Frusemide + Spironolactone","Frusemide or Furosemide","Furazolidone","Furazolidone + Metronidazole","Fusidic Acid","Gabapentin","Galactose Microparticles + Lactulose","Gatifloxacin","Gemfibrozil","Gemifloxacin","Gentamicin","Gentian Violet","Glibenclamide","Glibenclamide + Metformin (HCl)","Gliclazide","Glimepiride","Glimepiride + Metformin (HCl)","Glimepiride + Pioglitazone","Glipizide","Glipizide + Metformin (HCl)","Glucosamine (Sulphate)","Glucosamine (Sulphate) + Chondroitin Sulphate","Glucose + Potassium Chloride + Silicon Dioxide + Sodium Acid Citrate + Sodium Chloride","Glucose + Potassium Chloride + Sodium Chloride + Sodium Citrate","Glycerin + Sodium Acid Citrate + Sodium Lauryl Sulphate","Glyceryl Trinitrate","Glycolic Acid + Hydrocortisone","Glycolic Acid + Hydroquinone","Gramicidin + Lignocaine + Polymyxin B (Sulphate)","Granisetron (HCl)","Griseofulvin","Guaifenesin + Oxtriphylline (Choline Theophyllinate)","Guaifenesin + Terbutaline","Haloperidol","Hydralazine (HCl)","Hydrochlorothiazide","Hydrochlorothiazide + Irbesartan","Hydrochlorothiazide + Lisinopril","Hydrochlorothiazide + Losartan","Hydrochlorothiazide + Losartan (K)","Hydrochlorothiazide + Olmesartan Medoxomil","Hydrochlorothiazide + Ramipril","Hydrochlorothiazide + Spironolactone","Hydrochlorothiazide + Telmisartan","Hydrochlorothiazide + Triamterene","Hydrochlorothiazide + Valsartan","Hydrocortisone","Hydrocortisone + Lactic Acid","Hydrocortisone + Neomycin","Hydrocortisone + Phenol","Hydrogen Peroxide","Hydroquinone","Hydroxychloroquine (Sulphate)","Hydroxypropyl Methylcellulose","Hydroxyzine","Hyoscine (Butylbromide)","Hyoscine (Butylbromide) + Paracetamol","Hyoscyamine","Ibandronic Acid","Ibuprofen","Ibuprofen + Menthol + Methyl Salicylate","Ibuprofen + Pseudoephedrine (HCl)","Iloperidone","Imidapril","Imipramine (HCl)","Indapamide","Indapamide + Perindopril","Indomethacin","Iodine + Methyl Salicylate","Ipratropium (Br)","Ipriflavone","Irbesartan","Iron Complex + Folic Acid","Iron Hydroxide Poly Maltose Complex","Iron Hydroxide Poly Maltose Complex + Folic Acid","Iron Protein Succinylate","Iron Salts","Isoconazole (Nitrate)","Isosorbide (Dinitrate)","Isosorbide 5-Mononitrate","Isotretinoin","Isradipine","Itopride (HCl)","Itraconazole","Ivermectin","Kaolin + Pectin","Ketoconazole","Ketoprofen","Ketotifen (Fumarate)","L-Ornithine L-Aspartate","L-Ornithine L-Aspartate + Nicotinamide + Riboflavin (Vitamin B2)","L-Ornithine L-Aspartate + Nicotinamide + Riboflavin + Sodium Phosphate","Labetalol","Lacosamide","Lactic Acid","Lactic Acid + Salicylic Acid","Lactitol Monohydrate","Lactulose","Lamotrigine","Lansoprazole","Latanoprost","Leflunomide","Levamisole","Levetiracetam","Levobunolol (HCl)","Levocetirizine","Levofloxacin","Levonorgestrel","Levosulpiride","Lignocaine","Lignocaine + Triamcinolone","Lignocaine + Tyrothricin","Lincomycin (HCl)","Linezolid","Lisinopril","Lithium","Lodoxamide Tromethamine","Lomefloxacin (HCl)","Loperamide (HCl)","Loratadine","Lorazepam","Lormetazepam","Lornoxicam","Lornoxicam + Loxoprofen (Sodium)","Losartan (K)","Losartan (K) + Hydrochlorothiazide","Lovastatin","Loxoprofen (Sodium)","Lumefantrine","Lymecycline","Lynoestrenol","Lysine + Vitamin B Complex","Magaldrate + Simethicone","Magnesium Oxides and Hydroxides + Paraffin","Magnesium Oxides and Hydroxides + Simethicone","Maprotiline (HCl)","Mebendazole","Mebeverine","Mebeverine + Psyllium Husk","Mebhydrolin","Meclizine + Pyridoxine","Meclofenamic Acid","Mecobalamin","Medazepam","Mefenamic Acid","Mefloquine (HCl)","Meloxicam","Memantine","Mesalazine","Metformin (HCl)","Metformin (HCl) + Pioglitazone","Metformin (HCl) + Rosiglitazone (Maleate)","Metformin (HCl) + Sitagliptin","Metformin (HCl) + Vildagliptin","Methoxsalen","Methyldopa","Methylestradiol + Methyloestrenolone","Methylphenidate (HCl)","Methylprednisolone","Metoclopramide (HCl)","Metoprolol (Tartrate)","Metronidazole","Mianserin","Miconazole (Nitrate)","Midazolam","Midecamycin (Acetate)","Minocycline (HCl)","Mirtazapine","Misoprostol","Mometasone (Furoate)","Montelukast","Morphine","Moxifloxacin","Mucopolysaccharide Poly Sulphate","Multi-Vitamin and Mineral","Multiple Vitamins","Mupirocin","Nabumetone","Nadolol","Naftifine (HCl)","Nalidixic Acid","Naphazoline","Naphazoline + Pheniramine (Maleate)","Naphazoline + Zinc Sulphate","Naproxen","Nateglinide","Nebivolol (HCl)","Nefopam (HCl)","Neomycin + Nystatin + Polymyxin B (Sulphate)","Nepafenac","Netilmicin (Sulphate)","Nicardipine","Niclosamide","Nicorandil","Nicotinamide + Pizotifen (Hydrogen Maleate) + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Nicotinamide + Pyridoxine + Riboflavin (Vitamin B2) + Thiamine HCl (Vitamin B1)","Nicotinic Acid","Nifedipine","Nilvadipine","Nimesulide","Nimetazepam","Nimodipine","Nitazoxanide","Nitrofurantoin","Norethisterone","Norfloxacin","Nystatin","Ofloxacin","Ofloxacin + Prednisolone","Olanzapine","Olmesartan Medoxomil","Olopatadine","Omeprazole","Omeprazole + Sodium Bicarbonate","Ondansetron (HCl)","Oral Rehydration Salts","Orlistat","Orphenadrine","Orphenadrine + Paracetamol","Oseltamivir","Ossein Mineral Complex","Oxaprozin","Oxcarbazepine","Oxymetazoline (HCl)","Oxytetracycline (Dihydrate)","Pamabrom + Paracetamol","Pancreatin","Pantoprazole","Paracetamol","Paracetamol + Pentazocine","Paracetamol + Pholcodine + Pseudoephedrine (HCl)","Paracetamol + Pseudoephedrine (HCl) + Triprolidine (HCl)","Paracetamol + Pseudoephedrine + Triprolidine","Paracetamol + Tramadol (HCl)","Paraffin","Paramoxine","Paroxetine","Pefloxacin","Pentazocine","Pepenzolate","Perindopril","Permethrin","Pheniramine (Maleate) + Pseudoephedrine (HCl)","Phenobarbitone","Phenol","Phenylephrine + Prednisolone + Sulphacetamide","Phenylephrine + Pyrilamine","Phenytoin (Na)","Phloroglucinol","Phloroglucinol + Trimethylphloroglucinol","Pholcodine + Promethazine (HCl)","Pilocarpine (HCl, Nitrate)","Pioglitazone","Pipemidic Acid","Pirenoxine","Piribedil","Piroxicam","Piroxicam-Beta-Cyclodextrin","Pitavastatin","Pizotifen (Hydrogen Maleate)","Polyvinyl Alcohol","Polyvinyl Alcohol + Povidone-Iodine","Potassium Chloride","Potassium Chloride + Silicon Dioxide + Sodium Acid Citrate + Sodium Chloride","Potassium Chloride + Sodium Bicarbonate + Sodium Chloride","Potassium Chloride + Sodium Chloride + Sodium Citrate","Povidone-Iodine","Pramiverine (HCl)","Prasugrel (HCl)","Prasugrel HCl","Pravastatin (Na)","Prazosin","Prednisolone","Prednisolone + Prednisone + Sulphacetamide","Prednisolone + Sulphacetamide","Prednisolone Tebutate","Prednisolone and Prednisone","Pregabalin","Prochlorperazine","Procyclidine (HCl)","Progesterone","Promethazine (HCl)","Propantheline (Br)","Propranolol (HCl)","Pseudoephedrine (HCl) + Triprolidine (HCl)","Psyllium Husk","Pyrantel Pamoate","Pyridoxine","Pyrimethamine","Pyrimethamine + Sulfadoxine","Pyritinol (HCl)","Quetiapine","Quinapril","Rabeprazole","Raloxifene (HCl)","Ramipril","Ranitidine","Ranolazine","Repaglinide","Resorcinol + Sulphur","Retinol (Vitamin A) + Tocopherol (Vitamin E)","Riboflavin + Thiamine HCl","Rifaximin","Risedronate (Na)","Risperidone","Rivaroxaban","Rivastigmine","Ropinirole (HCl)","Rosiglitazone (Maleate)","Rosuvastatin","Roxatidine","Roxithromycin","Ruscogenin","Ruscogenin + Trimebutine (Maleate)","Saccharomyces","Salicylic Acid","Salmeterol","Secnidazole","Selegiline (HCl)","Serrapeptase","Serratiopeptidase","Sertraline (HCl)","Silver Sulphadiazine","Silymarin","Simethicone","Simvastatin","Sitagliptin","Sodium Acid Citrate","Sodium Chloride","Sodium Cromoglycate","Sodium Cromoglycate + Tetrahydrozoline","Sodium Cromoglycate + Tetrahydrozoline (HCl)","Sodium Hyaluronate","Sodium Ironedetate","Sodium Picosulphate","Sodium Valproate","Solifenacin Succinate","Sparfloxacin","Spiramycin","Spironolactone","Sucralfate","Sulbutiamine","Sulfanilamide","Sulphacetamide","Sulphadiazine + Trimethoprim","Sulphamethoxazole + Trimethoprim","Sulphasalazine","Sumatriptan","Tacalcitol","Tamsulosin Hydrochloride","Tazarotene","Telmisartan","Telmisartan + Hydrochlorothiazide","Temazepam","Tenoxicam","Terazosin","Terbinafine (HCl)","Terbutaline","Theophylline","Thiamine HCl (Vitamin B1)","Thiocolchicoside","Thyroxine (Na)","Tianeptine","Tiaprofenic Acid","Tibolone","Ticlopidine (HCl)","Timolol (Maleate)","Tinidazole","Tioconazole","Tiotropium","Tizanidine","Tobramycin","Tocopherol (Vitamin E)","Tolterodine (Tartrate)","Topiramate","Tramadol (HCl)","Trandolapril","Trandolapril + Verapamil (HCl)","Tranexamic Acid","Travoprost","Tretinoin","Triamcinolone","Triazolam","Trifluoperazine (HCl)","Triflusal","Trimebutine (Maleate)","Trimetazidine (Di HCl)","Trimethoprim","Triprolidine (HCl)","Tropicamide","Tulobuterol (HCl)","Ubidecarenone","Ursodeoxycholic Acid","Valaciclovir (HCl)","Valsartan","Varenicline","Venlafaxine (HCl)","Verapamil (HCl)","Vigabatrin","Vildagliptin","Vitamin B Complex","Warfarin (Na)","Xylometazoline (HCl)","Zafirlukast","Zinc","Zinc Oxide","Zinc Sulphate","Ziprasidone","Zolmitriptan","Zolpidem (Tartrate)"]

const ROWS = `ABOCAL||5|90|5|1|0|0|
ABODINE|10% w/v|4|745|6|1|0|0|
ABOMOX|400 mg|0|651|0|1|0|0|
ABOZOLE|400 mg|0|640|0|1|0|0|
ARTIFEN|25 mg|0|356|1|1|0|0|
ARTIFEN|50 mg|0|356|1|1|0|0|
ARTIFEN TOPICAL|1% w/w|4|356|1|1|0|0|
BANACID-S|540 mg/5ml / 20 mg/5ml|2|611|2|1|0|0|
BANACID-S|480 mg / 20 mg|0|611|2|1|0|0|
BEVIDOX||0|320|5|1|0|0|
BREMAX|1 mg/5ml|2|869|12|1|0|0|
BREMAX|1 mg|0|869|12|1|0|0|
BREMAX|2 mg|0|869|12|1|0|0|
BRUFEN PLUS|20 mg / 200 mg|0|308|1|1|0|0|
BRUFEN RETARD|800 mg|0|538|1|1|0|0|
BURNOL|0.1% w/w / 0.05% w/w|4|427|6|1|0|0|
CALCARD|60 mg|0|366|3|1|0|0|
CECON|100 mg/ml|3|78|5|1|0|0|
CECON|500 mg|0|78|5|1|0|0|
CEFANOL|250 mg|1|241|0|1|0|0|
CEFANOL|500 mg|1|241|0|1|0|0|
CEFANOL|50 mg/ml|3|241|0|1|0|0|
CEFANOL|125 mg/5ml|2|241|0|1|0|0|
CEFANOL|250 mg/5ml|2|241|0|1|0|0|
CREMAFFIN|3.5 ml/5ml / 1.25 ml/5ml|2|612|2|1|0|0|
CREMAFFIN|11.25 ml/15ml / 3.75 ml/15ml|2|612|2|1|0|0|
DAYCOR||2|709|7|1|0|0|
DIJEX MP CARMINATIVE||2|32|2|1|0|0|
DIJEX MP MIXED FRUIT||2|32|2|1|0|0|
DUPHALAC|3.35 g/5ml|2|576|2|1|0|0|
ENOXABID|400 mg|0|399|0|1|0|0|
ENTAMIZOLE|125 mg/5ml / 100 mg/5ml|2|365|8|1|0|0|
ENTAMIZOLE|500 mg / 400 mg|0|365|8|1|0|0|
ENTAMIZOLE|250 mg / 200 mg|0|365|8|1|0|0|
EPIVAL|250 mg/5ml|2|814|10|1|0|0|
EPIVAL|250 mg|0|814|10|1|0|0|
EPIVAL|500 mg|0|814|10|1|0|0|
EPIVAL-CR|500 mg|0|814|10|1|0|0|
FAVERIN|50 mg|0|468|10|1|0|0|
FAVERIN|100 mg|0|468|10|1|0|0|
FEMOSTON|10 mg / 2 mg|0|392|13|1|0|0|
FLEXIN|250 mg|0|663|1|1|0|0|
FLEXIN|500 mg|0|663|1|1|0|0|
FROBEN|5% w/w|4|464|1|1|0|0|
FROBEN|200 mg|1|464|1|1|0|0|
FROBEN|50 mg|0|464|1|1|0|0|
FROBEN|100 mg|0|464|1|1|0|0|
FRUSINOX|40 mg|0|480|3|1|0|0|
GANATON|50 mg|0|561|2|1|0|0|
GANATON XR|150 mg|0|561|2|1|0|0|
GOPTEN|0.5 mg|0|855|3|1|0|0|
GOPTEN|2 mg|0|855|3|1|0|0|
HYTRIN|1 mg|0|834|3|1|0|0|
HYTRIN|2 mg|0|834|3|1|0|0|
HYTRIN|5 mg|0|834|3|1|0|0|
IBERET|125 mg/ml|3|441|5|1|0|0|
ISOPTIN|40 mg|0|876|3|1|0|0|
ISOPTIN|80 mg|0|876|3|1|0|0|
ISOPTIN|240 mg|0|876|3|1|0|0|
KALTIN|5.832 g/30ml / 0.13 g/30ml|2|564|2|1|0|0|
KLARICID-XL|500 mg|0|288|0|1|0|0|
LIGNOCAINE COMPOUND||4|23|6|1|0|0|
MAMMOL|40% w/w / 30% w/w|4|174|6|1|0|0|
MOKSI|400 mg|0|651|0|1|0|0|
NICOR||2|371|7|1|0|0|
OPRINOL|10 mg|0|762|3|1|0|0|
OPRINOL|40 mg|0|762|3|1|0|0|
PEDIAZOLE|200 mg/5ml / 600 mg/5ml|2|410|0|1|0|0|
PEFREE|100 mg|0|1|1|1|0|0|
PROTHIADEN|25 mg|0|381|10|1|0|0|
PROTHIADEN|75 mg|0|381|10|1|0|0|
PROTIUM|40 mg|0|706|2|1|0|0|
RASHNIL|0.1% w/w / 8.5% w/w|4|145|6|1|0|0|
RIBUFEN||4|539|1|1|0|0|
RONDEC C||2|343|7|1|0|0|
RONDEC-D|1 mg/ml / 30 mg/ml|3|233|7|1|0|0|
RONDEC-TR|8 mg / 120 mg|0|233|7|1|0|0|
SILLIVER|105 mg/5ml|2|802|15|1|0|0|
SILLIVER|200 mg|0|802|15|1|0|0|
SOMOGEL||4|13|15|1|0|0|
SPARAXIN|100 mg|0|816|0|1|0|0|
TARKA|2 mg / 180 mg|0|856|3|1|0|0|
TEVETEN|600 mg|0|405|3|1|0|0|
THEOGRAD GRADUMET|350 mg|0|837|12|1|0|0|
TRONOLANE|1% w/w|4|714|6|1|0|0|
URIXIN|400 mg|0|732|0|1|0|0|
ACTIDIL|2.5 mg|0|867|4|11|0|0|
ACTIDIL|1.25 mg/5ml|2|867|4|11|0|0|
ACTIFED-DM||2|349|7|11|0|0|
ACTIFED-DM||0|349|7|11|0|0|
ACTIFED-P||2|710|7|11|0|0|
ACTIFED-P||0|710|7|11|0|0|
ACTIFEN|100 mg/5ml|2|538|1|11|0|0|
ACTIFEN|200 mg|0|538|1|11|0|0|
ACTIFEN|400 mg|0|538|1|11|0|0|
ACTIFEN|600 mg|0|538|1|11|0|0|
ACTILIX-CTZ|10 mg|0|252|4|11|0|0|
ACUGESIC|50 mg|1|854|1|11|0|0|
AEROLIN EVOHALER|100 mcg/actu|6|9|12|11|0|0|
AMPHYLL|100 mg|0|39|12|11|0|0|
ANGISED|0.5 mg|0|504|3|11|0|0|
ATARAX|10 mg|0|533|4|11|0|0|
ATARAX|25 mg|0|533|4|11|0|0|
AUGMENTIN BD|400 mg/5ml / 57 mg/5ml|2|65|0|11|0|0|
AVODART|0.5 mg|1|389|15|11|0|0|
BACTODERM|2% w/w|4|655|6|11|0|0|
BECLOFORTE|250 mcg/actu|6|144|12|11|0|0|
BECONASE|50 mcg/actu|9|144|4|11|0|0|
BECOTIDE|50 mcg/actu|6|144|12|11|0|0|
BETNELAN|0.5 mg|0|156|15|11|0|0|
BETONIL|0.1% w/v|4|156|6|11|0|0|
BETONIL-N|0.1% w/w / 0.5% w/w|4|162|6|11|0|0|
BREVOXYL|4% w/w|4|147|6|11|0|0|
BUSPAR|5 mg|0|190|10|11|0|0|
CALPOL PAEDIATRIC|120 mg/5ml|2|707|1|11|0|0|
CALPOL PLUS|65 mg / 500 mg|0|199|1|11|0|0|
CAPOTEN|25 mg|0|226|3|11|0|0|
CAPOTEN|50 mg|0|226|3|11|0|0|
CAPOZIDE|50 mg / 25 mg|0|227|3|11|0|0|
CEFZIL|125 mg/5ml|2|247|0|11|0|0|
CEFZIL|250 mg/5ml|2|247|0|11|0|0|
CEPOREX PAED|100 mg/ml|3|250|0|11|0|0|
CHEWCAL|100 IU / 400 mg|0|204|5|11|0|0|
CIPVAL|250 mg|0|280|0|11|0|0|
CIPVAL|500 mg|0|280|0|11|0|0|
CLARIDERM|2% w/w|4|530|6|11|0|0|
CLARIDERM|4% w/w|4|530|6|11|0|0|
CLARIDERM PLUS|8% w/w / 4% w/w|4|505|6|11|0|0|
CLINAGEL|1% w/w|4|291|6|11|0|0|
CLOBEVATE|0.05% w/w|4|293|6|11|0|0|
CORGARD|80 mg|0|657|3|11|0|0|
CORTISPORIN||4|136|11|11|0|0|
CUTIVATE|0.05% w/w|4|465|6|11|0|0|
CYTACON|35 mcg/5ml|2|313|5|11|0|0|
CYTEXIN||2|674|5|11|0|0|
DEPENDAL-M|25 mg/5ml / 75 mg/5ml|2|482|8|11|0|0|
DEPENDAL-M|100 mg / 300 mg|0|482|8|11|0|0|
DERMOVATE-NN||4|294|6|11|0|0|
DICOFEN|50 mg|0|356|1|11|0|0|
DICOFEN EMULGEL|1.16% w/w|4|358|1|11|0|0|
DRICLOR|20% w/v|4|26|6|11|0|0|
DUAC|5% w/w / 1% w/w|4|148|6|11|0|0|
DUCID|20 mg|0|431|2|11|0|0|
DUCID|40 mg|0|431|2|11|0|0|
DUODART|500 mcg / 400 mcg|1|390|15|11|0|0|
DUOFILM|16.7% w/w / 16.7% w/w|4|574|6|11|0|0|
DURICEF|1 g|1|242|0|11|0|0|
DURICEF|500 mg|1|242|0|11|0|0|
DURICEF|125 mg/5ml|2|242|0|11|0|0|
DURICEF|250 mg/5ml|2|242|0|11|0|0|
DURICEF|100 mg/ml|3|242|0|11|0|0|
DYAZIDE|25 mg / 50 mg|0|523|3|11|0|0|
DYSPAMET|100 mg/10ml|2|277|2|11|0|0|
EFFERALGAN|0.2 g / 0.33 g|5|117|1|11|0|0|
EMPIRIN COMP||0|121|1|11|0|0|
FIXVAL|400 mg|1|245|0|11|0|0|
FIXVAL|100 mg/5ml|2|245|0|11|0|0|
FIXVAL|200 mg/5ml|2|245|0|11|0|0|
FLIXONASE|0.05% w/w|9|465|4|11|0|0|
FLIXOTIDE|50 mcg/actu|6|465|12|11|0|0|
FLIXOTIDE|125 mcg/actu|6|465|12|11|0|0|
FLIXOTIDE|250 mcg/actu|6|465|12|11|0|0|
FLOXY|0.3% w/v|3|686|11|11|0|0|
FURADANTIN|100 mg|0|682|0|11|0|0|
FUROXONE|25 mg/5ml|2|481|0|11|0|0|
FUROXONE|100 mg|0|481|0|11|0|0|
GRIVIN|125 mg/5ml|2|509|6|11|0|0|
GW FLOXY|0.3% w/v|3|686|11|11|0|0|
HYDROZOLE|1% w/w / 1% w/w|4|303|6|11|0|0|
IMIGRAN|50 mg|0|826|1|11|0|0|
IMIGRAN|100 mg|0|826|1|11|0|0|
IODEX|4% w/w / 5% w/w|4|547|1|11|0|0|
ISOTREX|0.05% w/w|4|559|6|11|0|0|
ISOTREXIN|2% w/w / 0.05% w/w|4|409|6|11|0|0|
KEMADRIN|5 mg|0|758|10|11|0|0|
KENACORT|4 mg|0|860|15|11|0|0|
KENALOG IN ORABASE|0.1% w/w|4|860|6|11|0|0|
KENOIDAL|5% w/w / 0.1% w/w|4|589|6|11|0|0|
KEPPRA|250 mg|0|582|10|11|0|0|
KEPPRA|500 mg|0|582|10|11|0|0|
LACTICARE|5% w/v|4|573|6|11|0|0|
LACTICARE-HC|1% w/v / 5% w/v|4|526|6|11|0|0|
LACTICARE-HC|2.5% w/v / 5% w/v|4|526|6|11|0|0|
LAMICTAL|2 mg|0|577|10|11|0|0|
LAMICTAL|5 mg|0|577|10|11|0|0|
LAMICTAL|25 mg|0|577|10|11|0|0|
LAMICTAL|50 mg|0|577|10|11|0|0|
LAMICTAL|100 mg|0|577|10|11|0|0|
LANOXIN|250 mcg|0|363|3|11|0|0|
LISOPRIL|5 mg|0|593|3|11|0|0|
LISOPRIL|10 mg|0|593|3|11|0|0|
MARZINE|12.5 mg/5ml|2|321|2|11|0|0|
MARZINE|50 mg|0|321|2|11|0|0|
MAXOLON|5 mg/5ml|2|638|2|11|0|0|
MAXOLON|10 mg|0|638|2|11|0|0|
MIGRIL||0|193|1|11|0|0|
MINODERM|100 mg|0|645|0|11|0|0|
MONOPRIL|10 mg|0|477|3|11|0|0|
MOTIVAL|0.5 mg / 10 mg|0|463|10|11|0|0|
MULTILIND|20% w/w|4|884|6|11|0|0|
NAVIDOXINE|25 mg / 50 mg|0|619|2|11|0|0|
A-FANTRINE|20 mg / 120 mg|0|74|8|3|1|0|
A-FANTRINE|40 mg / 240 mg|0|74|8|3|1|0|
A-FANTRINE|80 mg / 480 mg|0|74|8|3|1|0|
A-FANTRINE||2|74|8|3|1|0|
A-MOX|0.5% w/v|3|651|11|3|1|0|
ACCTANE|408 mg|1|608|0|3|1|0|
ACSOLVE|10 mg/ml|4|291|6|3|1|0|
ADAPCO|0.1% w/w|4|7|6|3|1|0|
ADDFER-F|0.35 mg / 100 mg|0|472|5|3|1|0|
ALEVIA|150 mg|0|20|3|3|1|0|
ALEVIA|300 mg|0|20|3|3|1|0|
ALEVIA-V|150 mg / 160 mg|0|22|3|3|1|0|
ALEVIA-V|300 mg / 320 mg|0|22|3|3|1|0|
AMLOD|5 mg|0|46|3|3|1|0|
ANXIT|3 mg|0|181|10|3|1|0|
ASCARD PLUS|75 mg / 75 mg|0|122|3|3|1|0|
ATCINE|408 mg|1|608|0|3|1|0|
ATCOCEE-500|500 mg|0|78|5|3|1|0|
ATCOFLOX|250 mg|0|585|0|3|1|0|
ATCOFLOX|500 mg|0|585|0|3|1|0|
ATCOGEN 0.1%|0.1% w/w|4|489|6|3|1|0|
ATCOGREL|5 mg|0|748|3|3|1|0|
ATCOGREL|10 mg|0|748|3|3|1|0|
ATCOL|10 mg|0|804|3|3|1|0|
ATCOL|20 mg|0|804|3|3|1|0|
ATCONATE|35 mg|0|782|15|3|1|0|
ATCONATE|150 mg|0|782|15|3|1|0|
ATCOPLEX -C||2|111|5|3|1|0|
ATCOPRAM|10 mg|0|411|10|3|1|0|
ATCOPRAM|20 mg|0|411|10|3|1|0|
ATCOSEF|250 mg|1|251|0|3|1|0|
ATCOSEF|500 mg|1|251|0|3|1|0|
ATCOSEF|125 mg/5ml|2|251|0|3|1|0|
ATCOSEF|250 mg/5ml|2|251|0|3|1|0|
AZIDE|80 mg|0|493|9|3|1|0|
BETADERM|0.05% w/w|4|156|6|3|1|0|
BETADERM|0.1% w/w|4|156|6|3|1|0|
BETADERM-N|0.1% w/w / 0.5% w/w|4|162|6|3|1|0|
BETADERM-NM||4|161|6|3|1|0|
BETAGENIC|0.1% w/w / 0.1% w/w|4|160|6|3|1|0|
BETASALIC|0.1% w/w / 3% w/w|4|163|6|3|1|0|
BETAXOL|0.5% w/v|3|164|11|3|1|0|
BRACIN|0.3% w/v|3|850|11|3|1|0|
BRACIN|0.3% w/w|4|850|11|3|1|0|
BRACIN-D|0.1% w/v / 0.3% w/v|3|341|11|3|1|0|
BRIMO-T|0.2%|3|179|11|3|1|0|
BRONKAL|2 mg/5ml|2|9|12|3|1|0|
BRONKAL|2 mg|0|9|12|3|1|0|
BRONKAL|4 mg|0|9|12|3|1|0|
BRONKAL RESPIRATOR|5 mg/ml|6|9|12|3|1|0|
CAPACE|12.5 mg|0|226|3|3|1|0|
CAPACE|25 mg|0|226|3|3|1|0|
CARDNIT|2.6 mg|0|504|3|3|1|0|
CARDNIT|6.4 mg|0|504|3|3|1|0|
CASAN|177.6 mg / 82.2 mg|0|210|5|3|1|0|
CATEN|25 mg|0|124|3|3|1|0|
CATEN|50 mg|0|124|3|3|1|0|
CATEN|100 mg|0|124|3|3|1|0|
CAZILA||0|224|3|3|1|0|
CHEWFAM|10 mg|0|431|2|3|1|0|
CHLORMAX||3|255|11|3|1|0|
CHOLESCOR|20 mg|0|605|3|3|1|0|
CLOBEDERM|0.05% w/w|4|293|6|3|1|0|
CLOBEDERM EMOLLIENT|0.05% w/w|4|293|6|3|1|0|
CLOBEDERM-NN||4|296|6|3|1|0|
CLOBEDERM-S||4|295|6|3|1|0|
CLONEXA|1 mg|0|418|10|3|1|0|
CLONEXA|2 mg|0|418|10|3|1|0|
CLONEXA|3 mg|0|418|10|3|1|0|
COAGURIN|1 mg|0|880|3|3|1|0|
COAGURIN|2.5 mg|0|880|3|3|1|0|
COAGURIN|5 mg|0|880|3|3|1|0|
COMBINOL DM COUGH||2|266|7|3|1|0|
COMBINOL JUNIOR||2|729|7|3|1|0|
COMBINOL-D||2|60|7|3|1|0|
COMBINOL-E||2|40|7|3|1|0|
CONAZ|2% w/v|4|565|6|3|1|0|
CONAZ|200 mg|0|565|6|3|1|0|
DEGOURIC|40 mg|0|432|15|3|1|0|
DEGOURIC|120 mg|0|432|15|3|1|0|
DEPILUS|11.5% w/w|4|394|6|3|1|0|
DEPLUG|75 mg|0|299|3|3|1|0|
DEPONIT|5 mg|8|504|3|3|1|0|
DEPONIT|10 mg|8|504|3|3|1|0|
DEPRAPRAM|20 mg|0|283|10|3|1|0|
DESRHIN|2.5 mg / 120 mg|0|330|4|3|1|0|
DESRHIN|5 mg / 240 mg|0|330|4|3|1|0|
DIAZOL|200 mg/5ml|2|640|0|3|1|0|
DIAZOL|400 mg|0|640|0|3|1|0|
DICLON|0.1% w/v|3|356|11|3|1|0|
DIOPLUS|5 mg / 80 mg|0|54|3|3|1|0|
DIOPLUS|5 mg / 160 mg|0|54|3|3|1|0|
DIOPLUS|10 mg / 160 mg|0|54|3|3|1|0|
DIPROGENTA|0.05% w/w / 0.1% w/w|4|160|6|3|1|0|
DONECEPT|5 mg|0|377|10|3|1|0|
DONECEPT|10 mg|0|377|10|3|1|0|
DOXYN|100 mg|1|384|0|3|1|0|
DOXYN|50 mg|0|384|0|3|1|0|
ECOROX|20 mg|1|412|2|3|1|0|
ECOROX|40 mg|1|412|2|3|1|0|
EFIGREL|5 mg|0|748|3|3|1|0|
EFIGREL|10 mg|0|748|3|3|1|0|
ELANTAN|20 mg|0|558|3|3|1|0|
ELANTAN|40 mg|0|558|3|3|1|0|
ELANTAN LONG|50 mg|1|558|3|3|1|0|
ELMETACIN|1% w/v|4|546|1|3|1|0|
ENACE|5 mg|0|397|3|3|1|0|
ENACE|10 mg|0|397|3|3|1|0|
EUMYTIC|5 mg|0|322|1|3|1|0|
EUMYTIC|10 mg|0|322|1|3|1|0|
EYECROM|4% w/v / 0.05% w/v|3|810|11|3|1|0|
EYEFOREX|0.3% w/v|3|686|11|3|1|0|
FLOUROZINE|0.1% w/v / 0.25% w/v|3|460|11|3|1|0|
GEMPID|600 mg|1|487|3|3|1|0|
GEMPRIDE|1 mg|0|494|9|3|1|0|
GEMPRIDE|2 mg|0|494|9|3|1|0|
GEMPRIDE|3 mg|0|494|9|3|1|0|
GEMPRIDE|4 mg|0|494|9|3|1|0|
GLANTRIM||3|380|11|3|1|0|
GLAVIL|50 mg|0|878|9|3|1|0|
HEALIT||4|137|6|3|1|0|
HIRUDOID|0.3% w/w|4|652|6|3|1|0|
HYDERQUIN|2% w/w|4|530|6|3|1|0|
HYDERQUIN|4% w/w|4|530|6|3|1|0|
HYDERQUIN PLUS||4|452|6|3|1|0|
HYDROCORT 1.0%|1% w/w|4|525|6|3|1|0|
HYDROCORT 2.5%|2.5% w/w|4|525|6|3|1|0|
HYDROQUIN PLUS||4|449|6|3|1|0|
IPNEB||6|548|12|3|1|0|
ISOKET|10 mg|0|557|3|3|1|0|
IVERMITE|6 mg|0|563|8|3|1|0|
LACEROL|120 mg|0|366|3|3|1|0|
LAME|5 mg|0|593|3|3|1|0|
LAME|10 mg|0|593|3|3|1|0|
LAMORETIC|25 mg / 20 mg|0|516|3|3|1|0|
LOPLUS||0|518|3|3|1|0|
LOSTRESS|25 mg|0|603|3|3|1|0|
LOSTRESS|50 mg|0|603|3|3|1|0|
LYZAPAM|1000 mcg|0|600|10|3|1|0|
MELAS|2% w/w|4|483|6|3|1|0|
MERIZOLE|0.75% w/w|4|640|6|3|1|0|
MEROL|25 mg|0|639|3|3|1|0|
MEROL|50 mg|0|639|3|3|1|0|
MEROL|100 mg|0|639|3|3|1|0|
MEROL-XL|95 mg|0|639|3|3|1|0|
MEROL-XL|200 mg|0|639|3|3|1|0|
MESULID|100 mg|0|678|1|3|1|0|
MICRONEMA||7|503|2|3|1|0|
MINIRIN|0.1 mg|0|331|15|3|1|0|
MINIRIN|0.2 mg|0|331|15|3|1|0|
MOVELAT|2% w/w|4|794|1|3|1|0|
N-CRON|0.3% w/v|3|669|11|3|1|0|
NAPADOC|30 mg / 15 mg / 500 mg|0|192|1|3|1|0|
NILEM|7.5 mg|0|625|1|3|1|0|
NILEM|15 mg|0|625|1|3|1|0|
NORSALINE-P||3|807|7|3|1|0|
OSMOLAR BANANA||5|694|14|3|1|0|
OSMOLAR ORANGE||5|694|14|3|1|0|
OXCIN|0.5% w/v|3|651|11|3|1|0|
OXCIN-D|0.1% w/v / 0.5% w/v|3|338|11|3|1|0|
OXCYM DR|30 mg|1|388|10|3|1|0|
OXCYM DR|60 mg|1|388|10|3|1|0|
PANTROLOC|40 mg|0|706|2|3|1|0|
PECTAZONE M|100 mg / 300 mg|0|482|0|3|1|0|
PENFEN|50 mg|0|356|1|3|1|0|
PENTASA|500 mg|0|627|2|3|1|0|
PESTELIN|5% w/v|4|720|6|3|1|0|
PIOTONE|15 mg|0|731|9|3|1|0|
PIOTONE|30 mg|0|731|9|3|1|0|
PIOTONE|45 mg|0|731|9|3|1|0|
PIOTONE GEM|2 mg / 30 mg|0|496|9|3|1|0|
PIOTONE GEM|4 mg / 30 mg|0|496|9|3|1|0|
PIOTONE PLUS|500 mg / 15 mg|0|629|9|3|1|0|
PIOTONE PLUS|850 mg / 15 mg|0|629|9|3|1|0|
PLEXID|60 mg|1|443|4|3|1|0|
PLEXID|120 mg|0|443|4|3|1|0|
PLEXID|180 mg|0|443|4|3|1|0|
POLYGYNAX||7|667|13|3|1|0|
POLYTRACIN||4|507|6|3|1|0|
POLYTROL||3|340|11|3|1|0|
PRIMOX|400 mg / 80 mg|0|824|0|3|1|0|
PRIMOX|800 mg / 160 mg|0|824|0|3|1|0|
PRIMOX|200 mg/5ml / 40 mg/5ml|2|824|0|3|1|0|
PRIMOX|400 mg/5ml / 80 mg/5ml|2|824|0|3|1|0|
PROBETA|0.1% w/v|3|156|11|3|1|0|
PROBETA-N|0.1% w/v / 0.5% w/v|3|162|11|3|1|0|
PROBETA-N|0.1% w/w / 0.5% w/w|4|162|11|3|1|0|
PROLOX|0.3% w/v|3|280|11|3|1|0|
PROSOTEC|100 mcg|0|647|13|3|1|0|
PROSOTEC|200 mcg|0|647|13|3|1|0|
RHINOFF|200 mg / 30 mg|0|540|7|3|1|0|
RHINOFF FORTE|400 mg / 60 mg|0|540|7|3|1|0|
ROVATOR|5 mg|0|788|3|3|1|0|
ROVATOR|10 mg|0|788|3|3|1|0|
ROVATOR|20 mg|0|788|3|3|1|0|
RUMAFEN|10% w/w|4|538|1|3|1|0|
RUMAFEN|100 mg/5ml|2|538|1|3|1|0|
SCABFREE|1% w/w|4|720|6|3|1|0|
SCABFREE|5% w/w|4|720|6|3|1|0|
SCABION||4|312|6|3|1|0|
SCABION FORTE|10% w/v / 5% w/v|4|312|6|3|1|0|
SEFLOR|250 mg|1|251|0|3|1|0|
SEFLOR|500 mg|1|251|0|3|1|0|
SEFLOR|125 mg/5ml|2|251|0|3|1|0|
SEFLOR|250 mg/5ml|2|251|0|3|1|0|
SKIN A|0.05% w/w|4|859|6|3|1|0|
ABNIL|120 mg|1|695|15|0|1|0|
ACTI-5||2|217|5|0|1|0|
ADAMON|10 mg|0|275|2|0|1|0|
AFDOL|5 mg|0|626|10|0|1|0|
AFDOL|10 mg|0|626|10|0|1|0|
AFOXIN|250 mg|0|288|0|0|1|0|
AFOXIN|500 mg|0|288|0|0|1|0|
AGPRIDE|1 mg|0|494|9|0|1|0|
AGPRIDE|2 mg|0|494|9|0|1|0|
AGPRIDE|3 mg|0|494|9|0|1|0|
AGPRIDE|4 mg|0|494|9|0|1|0|
ALGOCIN|250 mg|0|280|0|0|1|0|
ALGOCIN|500 mg|0|280|0|0|1|0|
ANAFORTAN PLUS|80 mg / 80 mg|0|728|2|0|1|0|
ANALAR|2 mg|0|849|1|0|1|0|
AXID NEO|20 mg|1|412|2|0|1|0|
AXID NEO|40 mg|1|412|2|0|1|0|
BENEFIX PLUS|400 mg / 500 mg|5|273|15|0|1|0|
CALNATE-D||0|178|5|0|1|0|
CECLOR|250 mg|1|241|0|0|1|0|
CECLOR|500 mg|1|241|0|0|1|0|
CECLOR|125 mg/5ml|2|241|0|0|1|0|
CECLOR|187 mg/5ml|2|241|0|0|1|0|
CECLOR|250 mg/5ml|2|241|0|0|1|0|
CECLOR|50 mg/ml|3|241|0|0|1|0|
CECLOR MR|375 mg|0|241|0|0|1|0|
CHYMORAL|6 mg / 1 mg|0|274|1|0|1|0|
CHYMORAL FORTE||0|274|1|0|1|0|
CO-MALEDOX|20 mg / 120 mg|0|74|8|0|1|0|
CO-MALEDOX|40 mg / 240 mg|0|74|8|0|1|0|
CO-MALEDOX QS|80 mg / 480 mg|0|74|8|0|1|0|
CONTROLOC|40 mg|0|706|2|0|1|0|
CROMETIN-A|0.05% w/w|4|859|6|0|1|0|
CROZYL|5% w/w|4|147|6|0|1|0|
CROZYL|10% w/w|4|147|6|0|1|0|
DOLOFEN|400 mg|0|538|1|0|1|0|
DOXIUM|500 mg|1|215|15|0|1|0|
ECONOCHLOR|0.5% w/v|3|253|11|0|1|0|
EKSALB|25 mg|4|525|6|0|1|0|
ESI DEP|10 mg|0|411|10|0|1|0|
FLOXIGEM|320 mg|0|488|0|0|1|0|
GLUCONORM|1 mg|0|494|9|0|1|0|
GLUCONORM|2 mg|0|494|9|0|1|0|
GLUCONORM|3 mg|0|494|9|0|1|0|
GLUCONORM|4 mg|0|494|9|0|1|0|
GLUCONORMET|1 mg / 500 mg|0|495|9|0|1|0|
GLUCONORMET|2 mg / 500 mg|0|495|9|0|1|0|
GROFENAC|50 mg|0|356|1|0|1|0|
GROFENAC|100 mg|0|356|1|0|1|0|
HAPRO|3 mg|0|181|10|0|1|0|
KEFLEX|250 mg|1|250|0|0|1|0|
KEFLEX|500 mg|1|250|0|0|1|0|
KEFLEX|125 mg/5ml|2|250|0|0|1|0|
KEFLEX|250 mg/5ml|2|250|0|0|1|0|
KEFLEX|100 mg/ml|3|250|0|0|1|0|
LONGIFENE|25 mg|0|185|4|0|1|0|
LONGIFENE|50 mg/5ml|2|185|4|0|1|0|
LUCAST|4 mg|0|649|12|0|1|0|
LUCAST|5 mg|0|649|12|0|1|0|
LUCAST|10 mg|0|649|12|0|1|0|
MAGNOFENAC|50 mg|0|356|1|0|1|0|
MAXNA|250 mg|1|857|15|0|1|0|
MAXNA|500 mg|1|857|15|0|1|0|
MELFAX|7.5 mg|0|625|1|0|1|0|
MELFAX|15 mg|0|625|1|0|1|0|
MERLON|50 mg|1|854|1|0|1|0|
MERLON|100 mg|0|854|1|0|1|0|
MYSODERM|0.05% w/w / 0.1% w/w|4|160|6|0|1|0|
NEOPHYLLINE|100 mg|0|837|12|0|1|0|
NEOPHYLLINE|300 mg|0|837|12|0|1|0|
ORLEAN|120 mg|1|695|15|0|1|0|
OSNATE|250 mg/5ml|2|699|5|0|1|0|
OSNATE D||2|208|5|0|1|0|
OSNATE D||0|208|5|0|1|0|
OSNATE-800|830 mg|0|699|5|0|1|0|
PHYLLOCONTIN|225 mg|0|39|12|0|1|0|
POSTERISAN|3 mg|4|723|6|0|1|0|
POSTERISAN FORTE|0.25% w/w / 0.3% w/w|4|528|6|0|1|0|
POZE|15 mg|0|731|9|0|1|0|
POZE|30 mg|0|731|9|0|1|0|
POZE|45 mg|0|731|9|0|1|0|
POZE-G|2 mg / 30 mg|0|496|9|0|1|0|
POZE-G|4 mg / 30 mg|0|496|9|0|1|0|
POZEMET|500 mg / 15 mg|0|629|9|0|1|0|
POZEMET|850 mg / 15 mg|0|629|9|0|1|0|
PROCLOR|250 mg|1|241|0|0|1|0|
PROCLOR|500 mg|1|241|0|0|1|0|
PROCLOR|125 mg/5ml|2|241|0|0|1|0|
PROCLOR|250 mg/5ml|2|241|0|0|1|0|
RUBIFER|100 mg|0|552|5|0|1|0|
RUBIFER|50 mg/5ml|2|552|5|0|1|0|
RUBIFER|50 mg/ml|3|552|5|0|1|0|
RUBIFER-F|0.35 mg / 100 mg|0|470|5|0|1|0|
SALODERM|0.05% w/w / 3% w/w|4|163|6|0|1|0|
SINAXAMOL|35 mg / 450 mg|0|697|1|0|1|0|
SINAXAMOL EXTRA|35 mg / 450 mg|0|697|1|0|1|0|
SPASLER-NEO|135 mg|0|616|2|0|1|0|
SPASLER-P|5 mg/5ml|2|534|2|0|1|0|
TARDYFERON-F||0|115|5|0|1|0|
THEOPLUS|100 mg|0|837|12|0|1|0|
THEOPLUS|300 mg|0|837|12|0|1|0|
TOJINA|3 mg|0|181|10|0|1|0|
TONI-5||2|216|5|0|1|0|
URSO|250 mg|1|871|2|0|1|0|
URSO|500 mg|1|871|2|0|1|0|
URSO||2|871|2|0|1|0|
URSOFALK|250 mg|1|871|2|0|1|0|
ACICON|20 mg|0|431|2|4|1|0|
ACICON|40 mg|0|431|2|4|1|0|
ACICON|10 mg/5ml|2|431|2|4|1|0|
ACIREG|20 mg|1|412|2|4|1|0|
ACIREG|40 mg|1|412|2|4|1|0|
ALPHAGAN|2 mg/ml|3|179|11|4|1|0|
AMPRESS|5 mg|0|46|3|4|1|0|
AMPRESS|10 mg|0|46|3|4|1|0|
APTADINE|2 mg/ml|3|690|11|4|1|0|
ARTIMOV-K|50 mg|0|355|1|4|1|0|
ARTIMOV-K|75 mg|0|355|1|4|1|0|
ARTIMOV-K|100 mg|0|355|1|4|1|0|
BAMBEC|10 mg|0|143|12|4|1|0|
BAMBEC|20 mg|0|143|12|4|1|0|
BARILOL|2.5 mg|0|176|3|4|1|0|
BARILOL|5 mg|0|176|3|4|1|0|
BARILOL|10 mg|0|176|3|4|1|0|
BARIMOX|400 mg|0|651|0|4|1|0|
BARINEP|0.1% w/v|3|668|11|4|1|0|
BARITEC|20 mg|0|689|3|4|1|0|
BARITEC|40 mg|0|689|3|4|1|0|
BETAGAN|0.5% w/v|3|583|11|4|1|0|
BETALOC-ZOK|100 mg|0|639|3|4|1|0|
BINADEX|0.1% w/v|3|334|11|4|1|0|
BLEPHAMIDE||3|724|11|4|1|0|
BLEPHAMIDE SOP||4|724|11|4|1|0|
BONPART|10 mg|0|16|15|4|1|0|
BONPART|70 mg|0|16|15|4|1|0|
BOONEST|150 mg|0|537|15|4|1|0|
BRICANYL|2.5 mg|0|836|12|4|1|0|
BRICANYL|0.3 mg/5ml|2|836|12|4|1|0|
BRICANYL|0.25 mg/actu|6|836|12|4|1|0|
BRITANYL|2.5 mg|0|836|12|4|1|0|
BRITANYL|0.3 mg/ml|2|836|12|4|1|0|
CAVALOR|250 mg|1|241|0|4|1|0|
CAVALOR|500 mg|1|241|0|4|1|0|
CAVALOR|250 mg/5ml|2|241|0|4|1|0|
CAVALOR|50 mg/ml|3|241|0|4|1|0|
CEFNIR|100 mg|1|244|0|4|1|0|
CEFNIR|50 mg/5ml|2|244|0|4|1|0|
CHLOROPTIC|0.5% w/v|3|253|11|4|1|0|
CIPOCAINE||3|282|11|4|1|0|
CIPOTIC|0.3% w/v|3|280|11|4|1|0|
CIPOTIC-D|0.3% w/v / 0.1% w/v|3|281|11|4|1|0|
CLOTNIL|75 mg|0|299|3|4|1|0|
CLOTNIL|75 mg / 75 mg|0|122|3|4|1|0|
CLOTNIL|150 mg / 75 mg|0|122|3|4|1|0|
CO-BARITEC|12.5 mg / 20 mg|0|519|3|4|1|0|
CO-BARITEC|12.5 mg / 40 mg|0|519|3|4|1|0|
CO-BARITEC|25 mg / 40 mg|0|519|3|4|1|0|
COMBIGAN|0.2% v/v|3|179|11|4|1|0|
DEXIMOX|0.1% w/v / 0.5% w/v|3|338|11|4|1|0|
DIABOLD|1 mg|0|494|9|4|1|0|
DIABOLD|2 mg|0|494|9|4|1|0|
DIABOLD|3 mg|0|494|9|4|1|0|
DIABOLD|4 mg|0|494|9|4|1|0|
DICTRIN|5 mg|0|329|4|4|1|0|
DIMARA|20 mg|0|580|15|4|1|0|
DOMEL|10 mg|0|376|2|4|1|0|
DOMEL|5 mg/5ml|2|376|2|4|1|0|
DYNAQUIN|250 mg|0|585|0|4|1|0|
DYNAQUIN|500 mg|0|585|0|4|1|0|
ERADEP|20 mg|0|283|10|4|1|0|
ESEGROW|830 mg|0|699|5|4|1|0|
ESEGROW|250 mg/5ml|2|699|5|4|1|0|
ESEGROW D||0|205|5|4|1|0|
ESEGROW FORTE|584.18 mg/5ml|2|699|5|4|1|0|
ESEGROW PLUS|400 mg/5ml|2|699|5|4|1|0|
EXOCIN|0.3% w/v|3|686|11|4|1|0|
EXOCIN|0.3% w/w|4|686|11|4|1|0|
EYEBRADEX|0.1% w/v / 0.3% w/v|3|341|11|4|1|0|
EYEBREX|0.3% w/v|3|850|11|4|1|0|
EYEBREX|0.3% w/w|4|850|11|4|1|0|
FEBROL XTRA|65 mg / 500 mg|0|199|1|4|1|0|
FLUCOL|300 mg / 36 mg / 1.5 mg|0|711|7|4|1|0|
FLUCOL|80 mg/5ml / 30 mg/5ml / 1.25 mg/5ml|2|711|7|4|1|0|
FML|0.1% w/v|3|454|11|4|1|0|
FML FORTE|0.25% w/v|3|454|11|4|1|0|
FML-NEO|0.1% w/v / 0.5% w/v|3|457|11|4|1|0|
GEN CART PLUS|400 mg / 500 mg|0|272|15|4|1|0|
GENCART|500 mg|1|499|15|4|1|0|
GENCART PLUS||0|272|15|4|1|0|
GIXER|10 mg|0|252|4|4|1|0|
GIXER|5 mg/5ml|2|252|4|4|1|0|
HAPIBAR|20 mg|1|388|10|4|1|0|
HAPIBAR|30 mg|1|388|10|4|1|0|
HAPIBAR|60 mg|1|388|10|4|1|0|
IMDUR|60 mg|0|558|3|4|1|0|
INOQUIN|250 mg|0|280|0|4|1|0|
INOQUIN|500 mg|0|280|0|4|1|0|
IRECON|75 mg|0|550|3|4|1|0|
IRECON|150 mg|0|550|3|4|1|0|
IRECON|300 mg|0|550|3|4|1|0|
IRECON-H|12.5 mg / 150 mg|0|515|3|4|1|0|
IRECON-H|12.5 mg / 300 mg|0|515|3|4|1|0|
IRECON-H|25 mg / 300 mg|0|515|3|4|1|0|
LACRILUBE|0.5% w/w|4|256|11|4|1|0|
LEVAQUIN|250 mg|0|585|0|4|1|0|
LEVAQUIN|500 mg|0|585|0|4|1|0|
LIXER|5 mg|0|584|4|4|1|0|
LIXER|2.5 mg/5ml|2|584|4|4|1|0|
LOSEC|20 mg|1|691|2|4|1|0|
LUMIGAN|0.03% w/v|3|167|11|4|1|0|
MALERA|20 mg / 120 mg|0|74|8|4|1|0|
MALERA|40 mg / 240 mg|0|74|8|4|1|0|
MALERA|15 mg/5ml / 90 mg/5ml|2|74|8|4|1|0|
MEGAKLAR|250 mg|0|288|0|4|1|0|
MEGAKLAR|500 mg|0|288|0|4|1|0|
MEGAKLAR|125 mg/5ml|2|288|0|4|1|0|
MOBIKARE|50 mg|1|356|1|4|1|0|
MOBIKARE|100 mg|1|356|1|4|1|0|
MOBIKARE|1% w/w|4|356|1|4|1|0|
MOBIKARE DR|75 mg|1|356|1|4|1|0|
MOXIGAN|0.5% w/v|3|651|11|4|1|0|
MUCONYL EXPECTORANT|66.5 mg/5ml / 1.5 mg/5ml|2|511|7|4|1|0|
MYLAXON|500 mcg|0|621|5|4|1|0|
NIVADIL|8 mg|1|677|3|4|1|0|
OCLONAC|0.1% w/v|3|356|11|4|1|0|
OCUFEN|0.03% w/v|3|464|11|4|1|0|
OFLOPRED||3|687|11|4|1|0|
OXYLIN EYE DROPS|0.025% w/v|3|702|11|4|1|0|
PERSCH|1 mg|0|783|10|4|1|0|
PERSCH|2 mg|0|783|10|4|1|0|
PERSCH|3 mg|0|783|10|4|1|0|
PERSCH|4 mg|0|783|10|4|1|0|
PERSCH||2|783|10|4|1|0|
PLENDIL|5 mg|0|433|3|4|1|0|
PLENDIL|10 mg|0|433|3|4|1|0|
POLYFER|100 mg|0|555|5|4|1|0|
POLYFER|50 mg/5ml|2|555|5|4|1|0|
POLYFER FA|0.35 mg / 100 mg|0|472|5|4|1|0|
POLYFER FA|0.35 mg/5ml / 50 mg/5ml|2|472|5|4|1|0|
PRED FORTE|1% w/v|3|751|11|4|1|0|
PREFRIN-A|0.12% w/v / 0.1% w/v|3|725|11|4|1|0|
PROGLOBE|400 mg|0|135|0|4|1|0|
PROGLOBE|800 mg|0|135|0|4|1|0|
PROPINE|0.1% w/v|3|373|11|4|1|0|
PULMICORT|50 mcg/actu|6|186|12|4|1|0|
PULMICORT|200 mcg/actu|6|186|12|4|1|0|
QUINTEC|200 mg|0|486|0|4|1|0|
QUINTEC|400 mg|0|486|0|4|1|0|
RECOL|10 mg|0|804|3|4|1|0|
RECOL|20 mg|0|804|3|4|1|0|
REPAR|10 mg|0|772|2|4|1|0|
REPAR|20 mg|0|772|2|4|1|0|
ROSUBAR|5 mg|0|788|3|4|1|0|
ROSUBAR|20 mg|0|788|3|4|1|0|
SARTAN-H|12.5 mg / 50 mg|0|517|3|4|1|0|
SENSICON|10 mg|0|127|3|4|1|0|
SENSICON|20 mg|0|127|3|4|1|0|
SENSICON|40 mg|0|127|3|4|1|0|
SERADEP|5 mg|0|411|10|4|1|0|
SERADEP|10 mg|0|411|10|4|1|0|
SERT|50 mg|0|800|10|4|1|0|
SERT|100 mg|0|800|10|4|1|0|
SMUR|50 mg|0|400|1|4|1|0|
SPASRID|40 mg / 0.04 mg|0|728|2|4|1|0|
SYNIGAN|2% w/v / 0.5% w/v|3|379|11|4|1|0|
SYNIMAX|10 mg / 10 mg|0|429|3|4|1|0|
SYNIMAX|10 mg / 20 mg|0|429|3|4|1|0|
TERLAX|2 mg|0|849|1|4|1|0|
TERLAX|4 mg|0|849|1|4|1|0|
VEDICAR|6.25 mg|0|240|3|4|1|0|
VEDICAR|12.5 mg|0|240|3|4|1|0|
VEDICAR|25 mg|0|240|3|4|1|0|
VICTRIN|10 mg|0|598|4|4|1|0|
VICTRIN|5 mg/5ml|2|598|4|4|1|0|
XYLOAID||4|137|6|4|1|0|
XYLOCAINE|2% w/w|4|588|6|4|1|0|
XYLOCAINE|5% w/w|4|588|6|4|1|0|
ACELISH|100 mg|0|1|1|27|1|0|
ACNIL|0.1% w/w|4|7|6|27|1|0|
ACORT||4|361|6|27|1|0|
ALFA-D|0.25 mcg|0|18|5|27|1|0|
ALFA-D|0.5 mcg|0|18|5|27|1|0|
ALFA-D|1 mcg|0|18|5|27|1|0|
ALFA-D|0.5 mcg/5ml|2|18|5|27|1|0|
ALFA-D|0.2 mcg/ml|3|18|5|27|1|0|
ALFAMAX|0.4 mg|1|828|15|27|1|0|
ALZEX|5 mg|0|377|10|27|1|0|
ALZEX|10 mg|0|377|10|27|1|0|
APOFER|100 mg|0|552|5|27|1|0|
APOFER|50 mg/5ml|2|552|5|27|1|0|
APOFER-F|0.35 mg / 100 mg|0|470|5|27|1|0|
ARIPA|10 mg|0|72|10|27|1|0|
ARIPA|15 mg|0|72|10|27|1|0|
ARTEQUINE|15 mg / 120 mg|5|364|8|27|1|0|
ARTEQUINE|40 mg / 320 mg|1|364|8|27|1|0|
AVEC|10 mg|0|252|4|27|1|0|
AVEC|5 mg/5ml|2|252|4|27|1|0|
BRETHIN|2.5 mg|0|836|12|27|1|0|
BRETHIN|0.3 mg/5ml|2|836|12|27|1|0|
CABOK|5 mg|0|46|3|27|1|0|
CABOK|10 mg|0|46|3|27|1|0|
CARBEX|100 mg/5ml|2|234|7|27|1|0|
CARBEX|250 mg/5ml|2|234|7|27|1|0|
CARBEX PLUS|100 mg/5ml / 2.5 mg/5ml|2|235|7|27|1|0|
CARDAXEN|25 mg|0|124|3|27|1|0|
CARDAXEN|50 mg|0|124|3|27|1|0|
CARDAXEN|100 mg|0|124|3|27|1|0|
CEDROX|500 mg|1|242|0|27|1|0|
CEDROX|1 g|0|242|0|27|1|0|
CEDROX|125 mg/5ml|2|242|0|27|1|0|
CEDROX|250 mg/5ml|2|242|0|27|1|0|
CEFTAS|100 mg/5ml|2|245|0|27|1|0|
CEREGIN|1.5 mg|0|306|10|27|1|0|
CEREGIN|4.5 mg|0|306|10|27|1|0|
CITALO|20 mg|0|283|10|27|1|0|
CLOBETA SOLUTION|0.05% w/w|4|293|6|27|1|0|
CLOPIDO|75 mg|0|299|3|27|1|0|
CLOPIDO PLUS|75 mg / 75 mg|0|122|3|27|1|0|
CLOPIDO PLUS|150 mg / 75 mg|0|122|3|27|1|0|
COLOSPA|80 mg|0|727|2|27|1|0|
CYCLODEX|20 mg|0|735|1|27|1|0|
DANZOL|100 mg|1|328|13|27|1|0|
DANZOL|200 mg|1|328|13|27|1|0|
DAPAKAN|250 mg|0|814|10|27|1|0|
DAPAKAN|500 mg|0|814|10|27|1|0|
DAPAKAN|250 mg/5ml|2|814|10|27|1|0|
DIGOX|250 mcg|0|363|3|27|1|0|
DOLONAP|250 mg|0|663|1|27|1|0|
DOLONAP|500 mg|0|663|1|27|1|0|
DOLONAP EC|500 mg|0|663|1|27|1|0|
EASAIR|1 mcg/actu|6|474|12|27|1|0|
EMISET|10 mg|0|376|2|27|1|0|
EMISET|5 mg/5ml|2|376|2|27|1|0|
EPLER|50 mg|0|404|3|27|1|0|
ESCADEP|10 mg|0|411|10|27|1|0|
FASTAID|50 mg|0|356|1|27|1|0|
FASTAID|75 mg|0|356|1|27|1|0|
FASTAID|100 mg|0|356|1|27|1|0|
FASTAID|1.16% w/w|4|358|1|27|1|0|
FASTAID PLUS|50 mg|0|355|1|27|1|0|
FASTAID-R|50 mg|0|356|1|27|1|0|
FEXOFAST|60 mg|0|443|4|27|1|0|
FEXOFAST|120 mg|0|443|4|27|1|0|
FEXOFAST|180 mg|0|443|4|27|1|0|
FEXOFAST|30 mg/5ml|2|443|4|27|1|0|
FLORALAC|3.35 g/5ml|2|576|2|27|1|0|
FLOXOLEV|250 mg|0|585|0|27|1|0|
FLOXOLEV|500 mg|0|585|0|27|1|0|
FUNGIX|150 mg|1|450|6|27|1|0|
GABAPLUS|100 mg|1|484|10|27|1|0|
GABAPLUS|300 mg|1|484|10|27|1|0|
GABAPLUS|400 mg|1|484|10|27|1|0|
GEMIFLOX|320 mg|0|488|0|27|1|0|
GERDPILL|20 mg|1|412|2|27|1|0|
GERDPILL|40 mg|1|412|2|27|1|0|
GRAMEX|400 mg|0|640|0|27|1|0|
GRYSO|500 mg|0|509|6|27|1|0|
GYREX|200 mg|0|686|0|27|1|0|
HI SERVIN|20 mg / 120 mg|0|74|8|27|1|0|
HI SERVIN|40 mg / 240 mg|0|74|8|27|1|0|
HI SERVIN||2|74|8|27|1|0|
HI-SERVIN-BD|80 mg / 480 mg|0|74|8|27|1|0|
INFACID|2% w/w|4|483|6|27|1|0|
INROX|150 mg|0|790|0|27|1|0|
LAMONIL|25 mg|0|577|10|27|1|0|
LAMONIL|50 mg|0|577|10|27|1|0|
LAMONIL|100 mg|0|577|10|27|1|0|
LEVOTAM|250 mg|0|582|10|27|1|0|
LEVOTAM|500 mg|0|582|10|27|1|0|
LEVOTAM|750 mg|0|582|10|27|1|0|
LEVOTAM|1 g|0|582|10|27|1|0|
LEVOTAM|100 mg/ml|2|582|10|27|1|0|
LIPIX|10 mg|0|804|3|27|1|0|
LIPIX|20 mg|0|804|3|27|1|0|
LOBION-HRT|2.5 mg|0|843|13|27|1|0|
LOSAR PLUS|12.5 mg / 50 mg|0|518|3|27|1|0|
LOSAR-K|50 mg|0|603|3|27|1|0|
LUKOMON|4 mg|5|649|12|27|1|0|
LUKOMON|5 mg|5|649|12|27|1|0|
LUKOMON|10 mg|5|649|12|27|1|0|
MODACT-IR|100 mg|0|678|1|27|1|0|
NEUDOPA|25 mg / 250 mg|0|230|10|27|1|0|
NIMIGRAN|50 mg|0|826|1|27|1|0|
NORDOX|100 mg|1|384|0|27|1|0|
NOVELINK|500 mg|1|591|0|27|1|0|
NOVICLAR|250 mg|0|288|0|27|1|0|
NOVICLAR|500 mg|0|288|0|27|1|0|
NOVICLAR|125 mg/5ml|2|288|0|27|1|0|
NOXALAM|0.5 mg|0|25|10|27|1|0|
NUMELOX|7.5 mg|0|625|1|27|1|0|
NUMELOX|15 mg|0|625|1|27|1|0|
OLIGYN|2% w/w|4|301|6|27|1|0|
OMCAP|20 mg|1|691|2|27|1|0|
OSSOBON D||0|208|5|27|1|0|
OSSOBON D||2|208|5|27|1|0|
OSSOGIN|177.6 mg / 82.2 mg|0|210|5|27|1|0|
OSSOGIN|53.5 mg/5ml / 24.8 mg/5ml|2|210|5|27|1|0|
PERISPA||0|400|1|27|1|0|
PIOGET|15 mg|0|731|9|27|1|0|
PIOGET|30 mg|0|731|9|27|1|0|
PIOGET|45 mg|0|731|9|27|1|0|
PIOGET-M|850 mg / 15 mg|0|629|9|27|1|0|
PLAZO|250 mg|0|134|0|27|1|0|
PLAZO|200 mg/5ml|2|134|0|27|1|0|
PREVENT|1 g|0|846|0|27|1|0|
PREVID|15 mg|1|578|2|27|1|0|
PREVID|30 mg|1|578|2|27|1|0|
PROASMA|1 mg|0|567|12|27|1|0|
PROASMA|1 mg/5ml|2|567|12|27|1|0|
PROTECT|80 mg|0|493|9|27|1|0|
PROTONEX|15 mg|1|578|2|27|1|0|
PROTONEX|30 mg|1|578|2|27|1|0|
PROZYN|20 mg|1|461|10|27|1|0|
PULMITAC|10 mg|0|143|12|27|1|0|
PULMITAC|20 mg|0|143|12|27|1|0|
QUEPIN|25 mg|0|770|10|27|1|0|
QUEPIN|100 mg|0|770|10|27|1|0|
REDUCID|10 mg|0|431|2|27|1|0|
REDUCID|20 mg|0|431|2|27|1|0|
REDUCID|40 mg|0|431|2|27|1|0|
REDUCID|10 mg/5ml|2|431|2|27|1|0|
RENATA|75 mg|0|775|2|27|1|0|
RENATA|150 mg|0|775|2|27|1|0|
REVOC|1 mg|0|783|10|27|1|0|
REVOC|2 mg|0|783|10|27|1|0|
REVOC|3 mg|0|783|10|27|1|0|
ROSTAT|5 mg|0|788|3|27|1|0|
ROSTAT|10 mg|0|788|3|27|1|0|
ROSTAT|20 mg|0|788|3|27|1|0|
SALBEST CFC|12.05 mcg/actu|6|9|12|27|1|0|
SEIZUNIL|200 mg|0|228|10|27|1|0|
SEIZUNIL|400 mg|0|228|10|27|1|0|
SEIZUNIL|100 mg/5ml|2|228|10|27|1|0|
SOLVOCEF|500 mg|1|250|0|27|1|0|
SUCCIRON|2.5 mg / 400 mg|0|471|5|27|1|0|
SUCCIRON||2|554|5|27|1|0|
SUMATEC|50 mg|0|826|1|27|1|0|
SUPROX|250 mg|0|280|0|27|1|0|
SUPROX|500 mg|0|280|0|27|1|0|
SYNALGO|100 mg|0|464|1|27|1|0|
TELOX|150 mg|0|701|10|27|1|0|
TELOX|300 mg|0|701|10|27|1|0|
TELOX|600 mg|0|701|10|27|1|0|
TELOX||2|701|10|27|1|0|
THYRO|50 mcg|0|840|15|27|1|0|
TOPIRAMA|25 mg|0|853|10|27|1|0|
TOPIRAMA|50 mg|0|853|10|27|1|0|
TOPIRAMA|100 mg|0|853|10|27|1|0|
TOREX IR|500 mg|0|663|1|27|1|0|
TORMAX|500 mg|0|663|1|27|1|0|
TORMAX|10% w/w|4|663|1|27|1|0|
UNIFYLINE|400 mg|0|383|12|27|1|0|
UNIFYLINE||2|383|12|27|1|0|
UROQUIN|400 mg|0|684|0|27|1|0|
VELORA|250 mg|1|251|0|27|1|0|
VELORA|500 mg|1|251|0|27|1|0|
VELORA|125 mg/5ml|2|251|0|27|1|0|
VELORA|250 mg/5ml|2|251|0|27|1|0|
VOLTAFLAM|50 mg|0|355|1|27|1|0|
VOLTAFLAM|100 mg|0|355|1|27|1|0|
XYTINIL|3 mg|0|181|10|27|1|0|
ZANIFLEX|2 mg|0|849|1|27|1|0|
AGOPTON|15 mg|1|578|2|15|1|0|
AGOPTON|30 mg|1|578|2|15|1|0|
ALINAMIN-F|5 mg / 100 mg|0|780|5|15|1|0|
ALLEGRA|120 mg|0|443|4|15|1|0|
ALTORON|25 mg|0|356|1|15|1|0|
ALTORON|50 mg|0|356|1|15|1|0|
ALTORON EYE DROPS|0.1% w/v|3|356|11|15|1|0|
ARTEPIP|40 mg / 320 mg|1|364|8|15|1|0|
ARTIPRO|7.5 mg|0|625|1|15|1|0|
ARTIPRO|15 mg|0|625|1|15|1|0|
ARYSA|20 mg|1|412|2|15|1|0|
ARYSA|40 mg|1|412|2|15|1|0|
BRIMOGAN|2 mg/5ml|3|167|11|15|1|0|
CATALIN|0.75 mg|3|733|11|15|1|0|
CERELIUM|5 mg|0|353|10|15|1|0|
CHLOROQUINE PHOSPHATE|250 mg|0|258|8|15|1|0|
CO METHER|20 mg / 120 mg|1|74|8|15|1|0|
CO METHER|15 mg/5ml / 90 mg/5ml|2|74|8|15|1|0|
COCARD|75 mg|0|299|3|15|1|0|
DANZEN|5 mg|0|799|1|15|1|0|
DANZEN|10 mg|0|799|1|15|1|0|
DIASUL|20 mg/5ml|2|885|5|15|1|0|
DIAXIN|125 mg/5ml|2|288|0|15|1|0|
DILAIR|5 mg|0|649|12|15|1|0|
DILAIR|10 mg|0|649|12|15|1|0|
DOXYMYCIN|100 mg|1|384|0|15|1|0|
ESILGAN|1 mg|0|413|10|15|1|0|
ESILGAN|2 mg|0|413|10|15|1|0|
FENOPTIC|0.5% w/v|3|253|11|15|1|0|
FEROLIC|150 mg / 0.5 mg|1|442|5|15|1|0|
FLORAL||3|458|11|15|1|0|
FLORAL FORTE||3|458|11|15|1|0|
FOTIFLOX|400 mg|0|651|0|15|1|0|
FOTIFLOX|0.5% w/v|3|651|11|15|1|0|
FRADEX||3|335|11|15|1|0|
FUGIX|50 mg|1|450|6|15|1|0|
FUGIX|150 mg|1|450|6|15|1|0|
FUGIX||2|450|6|15|1|0|
G-HELIX|1 mg|0|494|9|15|1|0|
G-HELIX|2 mg|0|494|9|15|1|0|
G-HELIX|3 mg|0|494|9|15|1|0|
G-HELIX|4 mg|0|494|9|15|1|0|
GLIDEN|15 mg|0|731|9|15|1|0|
GLIDEN|30 mg|0|731|9|15|1|0|
GLIDEN|45 mg|0|731|9|15|1|0|
GLITOP|1 mg|0|494|9|15|1|0|
GLITOP|2 mg|0|494|9|15|1|0|
GLITOP|3 mg|0|494|9|15|1|0|
GLITOP|4 mg|0|494|9|15|1|0|
HELICEF|500 mg|1|242|0|15|1|0|
HELICEF|125 mg/5ml|2|242|0|15|1|0|
HELICEF|250 mg/5ml|2|242|0|15|1|0|
HELICEF PAEDIATRIC|125 mg/5ml|2|242|0|15|1|0|
HELIGAB|100 mg|1|484|10|15|1|0|
HELIPRED|0.25% w/v / 10% w/v|3|753|11|15|1|0|
HELISPA PLUS||0|728|2|15|1|0|
HELIXA|10 mg|0|411|10|15|1|0|
HELIXA|20 mg|0|411|10|15|1|0|
HI-SPA|40 mg|0|386|2|15|1|0|
HI-SPA|80 mg|0|386|2|15|1|0|
HIDILOL|6.25 mg|0|240|3|15|1|0|
HIDILOL|12.5 mg|0|240|3|15|1|0|
HIDILOL|25 mg|0|240|3|15|1|0|
HIFEN|200 mg|0|538|1|15|1|0|
HIFEN|400 mg|0|538|1|15|1|0|
HIFEN-X|300 mg|0|342|1|15|1|0|
HIFEN-X|400 mg|0|342|1|15|1|0|
HIFEN-X|100 mg/5ml|2|342|1|15|1|0|
HIFLONE|0.1% w/v / 0.25% w/v|3|459|11|15|1|0|
HIMETIDIN|400 mg|0|277|2|15|1|0|
HIPRO|250 mg|0|280|0|15|1|0|
HIPRO|500 mg|0|280|0|15|1|0|
HIPRO|0.3% w/v|3|280|11|15|1|0|
HISOPT|2% w/v / 0.5% w/v|3|379|11|15|1|0|
HITAC|150 mg|0|775|2|15|1|0|
HYLO EYE DROPS|0.2% w/v|3|811|11|15|1|0|
IRONAL|100 mg|0|552|5|15|1|0|
IRONAL|50 mg/5ml|2|552|5|15|1|0|
IRONAL-F|100 mg / 0.35 mg|0|551|5|15|1|0|
JUVIA-M PLUS|1 g / 50 mg|0|631|9|15|1|0|
LEPRIDE|25 mg|0|587|2|15|1|0|
LEPRIDE|50 mg|0|587|2|15|1|0|
LEPRIDE|100 mg|0|587|2|15|1|0|
LIMERA|500 mg|1|591|0|15|1|0|
LOSTER|5 mg|0|788|3|15|1|0|
LOSTER|10 mg|0|788|3|15|1|0|
LOSTER|20 mg|0|788|3|15|1|0|
METHER|40 mg|1|73|8|15|1|0|
METHER|15 mg/5ml|2|73|8|15|1|0|
METHER|40 mg/5ml|2|73|8|15|1|0|
METHER PLUS|20 mg / 120 mg|0|74|8|15|1|0|
MEVLON|1.25 mg|0|774|3|15|1|0|
MEVLON|2.5 mg|0|774|3|15|1|0|
MEVLON|5 mg|0|774|3|15|1|0|
MITRA|20 mg|0|283|10|15|1|0|
NAFEN|0.1% w/v|3|668|11|15|1|0|
NEVRAMIN|100 mg|0|838|5|15|1|0|
NITAZIDE|500 mg|0|681|8|15|1|0|
NITAZIDE|100 mg/5ml|2|681|8|15|1|0|
NOGERD|50 mg|0|561|2|15|1|0|
NOGERD SR|150 mg|1|561|2|15|1|0|
NUGESIC|100 mg|0|678|1|15|1|0|
NUGESIC|200 mg|0|678|1|15|1|0|
NUGESIC|50 mg/5ml|2|678|1|15|1|0|
OFLOCIN|0.3% w/v|3|686|11|15|1|0|
OFLOCIN|0.6% w/v|3|686|11|15|1|0|
OFLOCIN-D|0.3% w/v|3|686|11|15|1|0|
OGATE|0.1% w/v|3|690|11|15|1|0|
OSPLEX|830 mg|0|699|5|15|1|0|
OXYTETRACYCLINE|250 mg|1|703|0|15|1|0|
PEOFAX|37.5 mg|0|875|10|15|1|0|
PEOFAX|50 mg|0|875|10|15|1|0|
PEOFAX|75 mg|0|875|10|15|1|0|
PEPRID|20 mg|0|431|2|15|1|0|
PEPRID|40 mg|0|431|2|15|1|0|
PEXOT|20 mg|0|715|10|15|1|0|
PRASPER|5 mg|0|748|3|15|1|0|
PRELOFT|50 mg|0|800|10|15|1|0|
PRELOFT|100 mg|0|800|10|15|1|0|
PROGILE|50 mg|0|356|1|15|1|0|
PROGILE|75 mg|0|356|1|15|1|0|
PROSARTAN|4 mg|0|223|3|15|1|0|
PROSARTAN|8 mg|0|223|3|15|1|0|
PROSARTAN|16 mg|0|223|3|15|1|0|
PROSARTAN-DU|16 mg / 12.5 mg|0|224|3|15|1|0|
PROTORIB|10 mg|0|772|2|15|1|0|
PROTORIB|20 mg|0|772|2|15|1|0|
Q-PAR|25 mg|0|770|10|15|1|0|
Q-PAR|100 mg|0|770|10|15|1|0|
Q-PAR|200 mg|0|770|10|15|1|0|
RECEPT|1 mg|0|783|10|15|1|0|
RECEPT|2 mg|0|783|10|15|1|0|
RECEPT|3 mg|0|783|10|15|1|0|
RECEPT|4 mg|0|783|10|15|1|0|
RELE|400 mg|0|486|0|15|1|0|
REXANT|2 mg|0|849|1|15|1|0|
SEGATE|4% w/v / 0.05% w/v|3|809|11|15|1|0|
SOLCINA|5 mg|0|815|15|15|1|0|
SPALIN COMPOUND|10 mg|0|534|2|15|1|0|
TAVELOR|10 mg|0|598|4|15|1|0|
TAVELOR|5 mg/5ml|2|598|4|15|1|0|
TIMOPTIC|0.5% w/v|3|845|11|15|1|0|
TOBRACIN|0.3% w/v|3|850|11|15|1|0|
TOBRACIN-D|0.1% w/v / 0.3% w/v|3|341|11|15|1|0|
TRIMOXIN|400 mg / 80 mg|0|824|0|15|1|0|
TRIMOXIN-DS|800 mg / 160 mg|0|824|0|15|1|0|
TUSCOLIN-D||2|344|7|15|1|0|
TYCEF|400 mg|1|245|0|15|1|0|
TYCEF|100 mg/5ml|2|245|0|15|1|0|
ULCERATE|500 mg|0|819|2|15|1|0|
ULCERATE|1 g|0|819|2|15|1|0|
ULCERATE|1 g/5ml|2|819|2|15|1|0|
ULORA|40 mg|0|432|15|15|1|0|
ULORA|80 mg|0|432|15|15|1|0|
VALSAR-M|5 mg / 80 mg|0|54|3|15|1|0|
VALSAR-M|5 mg / 160 mg|0|54|3|15|1|0|
VALSAR-M|10 mg / 160 mg|0|54|3|15|1|0|
VIT B COMP||0|879|5|15|1|0|
VIT C|100 mg|0|78|5|15|1|0|
WINY|100 mg|2|592|0|15|1|0|
XEFLOX|250 mg|0|585|0|15|1|0|
XEFLOX|500 mg|0|585|0|15|1|0|
XEFLOX||3|585|11|15|1|0|
ZOMAX|250 mg|1|134|0|15|1|0|
ZOMAX|500 mg|0|134|0|15|1|0|
ZOMAX|200 mg/5ml|2|134|0|15|1|0|
ZYMOPLEX||1|362|2|15|1|0|
ZYMOPLEX||2|362|2|15|1|0|
ABAPEN|100 mg|1|484|10|6|2|0|
ABAPEN|300 mg|1|484|10|6|2|0|
ABAPEN|400 mg|1|484|10|6|2|0|
ALOC|120 mg|0|443|4|6|2|0|
ALOC|180 mg|0|443|4|6|2|0|
ALOC|60 mg|1|443|4|6|2|0|
ALOC D|60 mg / 120 mg|0|444|4|6|2|0|
AMBAC||1|69|0|6|2|0|
ARIVA|10 mg|0|580|15|6|2|0|
ARIVA|20 mg|0|580|15|6|2|0|
ATLIN|25 mg|0|124|3|6|2|0|
ATLIN|50 mg|0|124|3|6|2|0|
ATLIN|100 mg|0|124|3|6|2|0|
ATLIN PLUS|50 mg / 12.5 mg|0|125|3|6|2|0|
BASTROL|10 mg|0|143|12|6|2|0|
BASTROL|20 mg|0|143|12|6|2|0|
BEASY|4 mg|5|649|12|6|2|0|
BEASY|4 mg|0|649|12|6|2|0|
BEASY|5 mg|0|649|12|6|2|0|
BEASY|10 mg|0|649|12|6|2|0|
BOSCHOFEN|200 mg|0|538|1|6|2|0|
BOSCHOFEN|400 mg|0|538|1|6|2|0|
BOSCHTAMOL|500 mg|0|707|1|6|2|0|
BOSCHTAN|250 mg|0|623|1|6|2|0|
BOSCHTRIM|400 mg / 80 mg|0|824|0|6|2|0|
BOSCHTRIM|800 mg / 160 mg|0|824|0|6|2|0|
BOSHCAM-B|20 mg|0|736|1|6|2|0|
BRASO|5 mg|0|747|3|6|2|0|
BRASO|10 mg|0|747|3|6|2|0|
BRIZOPT DROPS|10 mg|3|180|11|6|2|0|
BTROL|250 mg|1|857|15|6|2|0|
BTROL|500 mg|1|857|15|6|2|0|
CALAMOX DUO|400 mg/5ml / 57 mg/5ml|2|65|0|6|2|0|
CALOC|5 mg|0|46|3|6|2|0|
CALOC|10 mg|0|46|3|6|2|0|
CEBOSH|200 mg|0|245|0|6|2|0|
CEBOSH|400 mg|0|245|0|6|2|0|
CEBOSH|400 mg|1|245|0|6|2|0|
CEBOSH|100 mg/5ml|2|245|0|6|2|0|
CEBOSH|200 mg/5ml|2|245|0|6|2|0|
CEFALOR|50 mg/ml|3|241|0|6|2|0|
CEFALOR|250 mg|1|241|0|6|2|0|
CEFALOR|500 mg|1|241|0|6|2|0|
CEFALOR|125 mg/5ml|2|241|0|6|2|0|
CEFALOR|250 mg/5ml|2|241|0|6|2|0|
CEFRINEX|250 mg|1|251|0|6|2|0|
CEFRINEX|500 mg|1|251|0|6|2|0|
CEFRINEX|125 mg/5ml|2|251|0|6|2|0|
CEFRINEX|250 mg/5ml|2|251|0|6|2|0|
CIPLINZ|250 mg|0|280|0|6|2|0|
CIPLINZ|500 mg|0|280|0|6|2|0|
CORACE|5 mg|0|593|3|6|2|0|
CORACE|10 mg|0|593|3|6|2|0|
CORACE|20 mg|0|593|3|6|2|0|
CORACE PLUS|12.5 mg / 10 mg|0|516|3|6|2|0|
CORACE PLUS|12.5 mg / 20 mg|0|516|3|6|2|0|
DEXAMEX|0.1 %w/v|3|334|11|6|2|0|
DOLO-K|50 mg|0|355|1|6|2|0|
DROMAX|100 mg/ml|3|242|0|6|2|0|
DROMAX|1 g|0|242|0|6|2|0|
DROMAX|500 mg|1|242|0|6|2|0|
DROMAX|125 mg/5ml|2|242|0|6|2|0|
DROMAX|250 mg/5ml|2|242|0|6|2|0|
DURIDE|5 mg / 40 mg|0|36|3|6|2|0|
ETIDRON|200 mg|0|422|15|6|2|0|
FELIP|67 mg|1|434|3|6|2|0|
FELIP|200 mg|1|434|3|6|2|0|
GEMIXA|320 mg|0|488|0|6|2|0|
GLAX|200 mg|0|486|0|6|2|0|
GLAX|400 mg|0|486|0|6|2|0|
IZILON|400 mg|0|651|0|6|2|0|
LINTIZ|2 mg|0|849|15|6|2|0|
LINTIZ|4 mg|0|849|15|6|2|0|
LINZIM|100 mg/5ml|2|245|0|6|2|0|
LINZIM|400 mg|1|245|0|6|2|0|
LIZOBAL|500 mcg|0|621|5|6|2|0|
LOREFECT|10 mg|0|598|4|6|2|0|
LOTOROS DROPS|50 mcg|3|579|11|6|2|0|
MACLACIN|250 mg|0|288|0|6|2|0|
MACLACIN|500 mg|0|288|0|6|2|0|
MACLACIN|125 mg/5ml|2|288|0|6|2|0|
MACLACIN|250 mg/5ml|2|288|0|6|2|0|
MALADRIN|25 mg / 500 mg|0|768|8|6|2|0|
MICAM|7.5 mg|0|625|1|6|2|0|
MICAM|15 mg|0|625|1|6|2|0|
MICTEL|40 mg|0|830|3|6|2|0|
MICTEL|80 mg|0|830|3|6|2|0|
NOROCIN|400 mg|0|684|0|6|2|0|
NUISTA|10 mg|0|804|3|6|2|0|
NUISTA|20 mg|0|804|3|6|2|0|
NUISTA|40 mg|0|804|3|6|2|0|
NUISTA PLUS|10 mg / 20 mg|0|429|3|6|2|0|
NULCER|150 mg|0|775|2|6|2|0|
NUZIB|100 mg|1|249|1|6|2|0|
NUZIB|200 mg|1|249|1|6|2|0|
OCTORIN|0.1 mg|0|331|15|6|2|0|
OCTORIN|0.2 mg|0|331|15|6|2|0|
ODENIL|40 mg|0|478|3|6|2|0|
OGREL|75 mg|0|299|3|6|2|0|
OGREL PLUS 162|150 mg / 75 mg|0|122|3|6|2|0|
OGREL PLUS 81|75 mg / 75 mg|0|122|3|6|2|0|
OLINC|500 mg|1|591|0|6|2|0|
OMEZOL|10 mg|1|691|2|6|2|0|
OMEZOL|20 mg|1|691|2|6|2|0|
OMEZOL|40 mg|1|691|2|6|2|0|
ONIDIN|2 mg|3|179|11|6|2|0|
ORTHOFENAC|0.1 %w/v|3|356|11|6|2|0|
ORTHOFENAC|50 mg|0|356|1|6|2|0|
ORTHOFENAC|100 mg|0|356|1|6|2|0|
ORVA|10 mg|0|127|3|6|2|0|
ORVA|20 mg|0|127|3|6|2|0|
ORVA|40 mg|0|127|3|6|2|0|
OSTEON|200 mg|0|549|15|6|2|0|
PEPTILOC|20 mg|0|431|2|6|2|0|
PEPTILOC|40 mg|0|431|2|6|2|0|
PIORYL G|2 mg / 15 mg|0|496|9|6|2|0|
PIORYL G|4 mg / 30 mg|0|496|9|6|2|0|
PIORYL-M|500 mg / 15 mg|0|629|9|6|2|0|
PIORYL-M|850 mg / 15 mg|0|629|9|6|2|0|
PRELOX|40 mg/5ml|2|246|0|6|2|0|
PRELOX|100 mg|0|246|0|6|2|0|
PROART|50 mg / 200 mcg|0|357|1|6|2|0|
PROTOZOL|15 mg|1|578|2|6|2|0|
PROTOZOL|30 mg|1|578|2|6|2|0|
QBAL|500 mcg|0|621|5|6|2|0|
QLENA|250 mg|0|585|0|6|2|0|
QLENA|500 mg|0|585|0|6|2|0|
QMETEM|20 mg / 120 mg|0|74|8|6|2|0|
QMETEM|40 mg / 240 mg|0|74|8|6|2|0|
QMETEM|480 mg|0|607|8|6|2|0|
QMETEM PLUS|80 mg / 480 mg|0|74|8|6|2|0|
QMETEM PLUS|15 mg/5ml / 90 mg/5ml|2|74|8|6|2|0|
QPRO|15 mg|1|578|2|6|2|0|
QPRO|30 mg|1|578|2|6|2|0|
QUESTA|10 mg|0|411|10|6|2|0|
QUINOFLOX|100 mg|0|280|0|6|2|0|
QUINOFLOX|250 mg|0|280|0|6|2|0|
QUINOFLOX|500 mg|0|280|0|6|2|0|
QUINOFLOX|750 mg|0|280|0|6|2|0|
QUINOFLOX|0.3 %w/v|3|280|11|6|2|0|
QUMIC|250 mg|0|585|0|6|2|0|
QUMIC|500 mg|0|585|0|6|2|0|
QUMIC|0.5 %w/v|3|585|11|6|2|0|
RABOSH|10 mg|0|772|2|6|2|0|
RABOSH|20 mg|0|772|2|6|2|0|
RAVAT|40 ug|3|858|11|6|2|0|
REDRONA|5 mg|0|782|15|6|2|0|
REDRONA|35 mg|0|782|15|6|2|0|
ROUGE|100 mg|0|555|5|6|2|0|
ROVA|5 mg|0|788|3|6|2|0|
ROVA|10 mg|0|788|3|6|2|0|
ROVA|20 mg|0|788|3|6|2|0|
SAISTA|10 mg|0|804|3|6|2|0|
SAISTA|20 mg|0|804|3|6|2|0|
SAISTA|40 mg|0|804|3|6|2|0|
SOMEZOL|20 mg|1|412|2|6|2|0|
SOMEZOL|40 mg|1|412|2|6|2|0|
SUPRAMOX|250 mg|1|64|0|6|2|0|
SUPRAMOX|500 mg|1|64|0|6|2|0|
SUPRAMOX|125 mg/5ml|2|64|0|6|2|0|
SUPRAMOX|250 mg/5ml|2|64|0|6|2|0|
SYMBAL|20 mg|1|387|10|6|2|0|
SYMBAL|30 mg|1|387|10|6|2|0|
SYMBAL|60 mg|1|387|10|6|2|0|
TARIFLOX|200 mg|0|686|0|6|2|0|
TARIFLOX|0.3 %w/v|3|686|11|6|2|0|
TARIFLOX FORTE|400 mg|0|686|0|6|2|0|
ULCELOC|200 mg|0|277|2|6|2|0|
ULCELOC|400 mg|0|277|2|6|2|0|
ZECEF|125 mg|0|248|0|6|2|0|
ZECEF|250 mg|0|248|0|6|2|0|
ZECEF|125 mg/5ml|2|248|0|6|2|0|
ZENTRO|20 mg|0|706|2|6|2|0|
ZENTRO|40 mg|0|706|2|6|2|0|
ZEZOT|500 mg|0|134|0|6|2|0|
ZEZOT|250 mg|1|134|0|6|2|0|
ZEZOT|200 mg/5ml|2|134|0|6|2|0|
ZION|150 mg|0|189|10|6|2|0|
ZOLREST|600 mg|0|592|0|6|2|0|
ACNEDERM|2 %w/w / 4 %w/w|4|778|6|35|2|0|
ADIOS|200 mg|0|686|0|35|2|0|
ADIOS|400 mg|0|686|0|35|2|0|
ADIRA|10 mg|0|580|15|35|2|0|
AIDRA|10 mg|0|580|15|35|2|0|
ADIRA|20 mg|0|580|15|35|2|0|
AIDRA|20 mg|0|580|15|35|2|0|
ADIRA|100 mg|0|580|15|35|2|0|
AIDRA|100 mg|0|580|15|35|2|0|
ADS|40 mg|1|126|10|35|2|0|
AGILE|2 mg|0|849|15|35|2|0|
AGILE FORTE|4 mg|0|849|15|35|2|0|
AGILE SR|6 mg|1|849|15|35|2|0|
AKNE BAN-G||4|408|6|35|2|0|
AKNE BAN-T|1.5 %w/v|4|407|6|35|2|0|
AKNE IMAGE|1.5 %w/v / 0.5 %w/v|4|149|6|35|2|0|
AKNONIL|2 %w/v|4|794|6|35|2|0|
ALFUMET|150 mg|1|450|6|35|2|0|
AMONI|100 mg/5ml / 2 mg/5ml / 58 mg/5ml|2|59|7|35|2|0|
AMPIWIL|250 mg|1|67|0|35|2|0|
AMPIWIL|500 mg|1|67|0|35|2|0|
AMSPOR|250 mg|1|251|0|35|2|0|
AMSPOR|500 mg|1|251|0|35|2|0|
AMSPOR|125 mg/5ml|2|251|0|35|2|0|
AMSPOR FORTE|250 mg/5ml|2|251|0|35|2|0|
ANTIFLAM|50 mg|0|355|1|35|2|0|
ANTIFLAM|75 mg|0|355|1|35|2|0|
ANTIWORM|40 mg|0|581|8|35|2|0|
ASPIRIN|300 mg|0|120|1|35|2|0|
BARBIDOL|25 mg / 1 mg / 500 mg|0|194|1|35|2|0|
BENZIM|20 mg|1|691|2|35|2|0|
BENZIM|40 mg|1|691|2|35|2|0|
BENZIM|40 mg|0|691|2|35|2|0|
BETWELVE|500 mcg|0|621|5|35|2|0|
BONATE|10 mg|0|16|15|35|2|0|
BONATE|40 mg|0|16|15|35|2|0|
BONATE OW|70 mg|0|16|15|35|2|0|
BRIGIDA|120 mg / 2.5 mg|0|763|7|35|2|0|
BRONCHOTAB|2 mg|0|9|12|35|2|0|
BRONCHOTAB|4 mg|0|9|12|35|2|0|
CALM|20 mg|1|832|10|35|2|0|
CALM|30 mg|1|832|10|35|2|0|
CAPRINZA||0|46|3|35|2|0|
CAPRISK|20 mg / 5 mg|0|47|3|35|2|0|
CET|10 mg|0|252|4|35|2|0|
CHARMFIL|45 mg|0|646|10|35|2|0|
CHEER|20 mg|0|283|10|35|2|0|
CHEER|40 mg|0|283|10|35|2|0|
CHEER UP|10 mg|0|283|10|35|2|0|
CHEER UP|20 mg|0|283|10|35|2|0|
CHEW-C|220 mg / 375 mg|0|118|5|35|2|0|
CHLORPHENIRAMINE|4 mg|0|259|4|35|2|0|
CHLORTAB|4 mg|0|259|4|35|2|0|
CO-FLUX|250 mg / 250 mg|1|66|0|35|2|0|
CO-FLUX|125 mg/5ml / 125 mg/5ml|2|66|0|35|2|0|
CURO|1 mg|0|298|10|35|2|0|
CURO|2 mg|0|298|10|35|2|0|
DERMAAN|30 mg / 500 mg|0|309|1|35|2|0|
DICLOTAB|25 mg|0|356|1|35|2|0|
DICLOTAB|50 mg|0|356|1|35|2|0|
DOL|100 mg|0|464|1|35|2|0|
DOZAX|2 mg|0|382|3|35|2|0|
DOZAX|4 mg|0|382|3|35|2|0|
ECOTRIN|75 mg|0|120|3|35|2|0|
EFED|30 mg|0|401|7|35|2|0|
ELLE|20 mg|0|395|1|35|2|0|
ELLE|40 mg|0|395|1|35|2|0|
ELLETTRA|50 mg|0|800|10|35|2|0|
ELLETTRA|100 mg|0|800|10|35|2|0|
ESOPROTO|20 mg|0|412|2|35|2|0|
ESOPROTO|40 mg|0|412|2|35|2|0|
EXEN-D|1000 mg / 2.5 mcg|0|214|5|35|2|0|
FACTIVE|250 mg|1|243|0|35|2|0|
FACTIVE|500 mg|1|243|0|35|2|0|
FACTIVE|250 mg/5ml|2|243|0|35|2|0|
FACTIVE|500 mg/5ml|2|243|0|35|2|0|
FALCINIL|20 mg / 120 mg|0|74|8|35|2|0|
FALCINIL|40 mg / 240 mg|0|74|8|35|2|0|
FALCINIL|15 mg/5ml / 90 mg/5ml|2|74|8|35|2|0|
FALCINIL QS|80 mg / 480 mg|0|74|8|35|2|0|
FAMID|20 mg|0|431|2|35|2|0|
FAMID|40 mg|0|431|2|35|2|0|
FANSI PLUS|100 mg / 25 mg / 500 mg|0|76|8|35|2|0|
FANSIWIL|25 mg / 500 mg|0|768|8|35|2|0|
FANTASIA|15 mg|0|731|9|35|2|0|
FANTASIA|30 mg|0|731|9|35|2|0|
FANTASIA|45 mg|0|731|9|35|2|0|
FANTASMIC|1 mg / 15 mg|0|496|9|35|2|0|
FANTASMIC|2 mg / 15 mg|0|496|9|35|2|0|
FANTASMIC PLUS|2 mg / 30 mg|0|496|9|35|2|0|
FANTASMIC PLUS|4 mg / 30 mg|0|496|9|35|2|0|
FELVOT|6 mg|0|563|8|35|2|0|
FEXIBIL|10 mg|0|142|15|35|2|0|
FILBONE|150 mg|0|537|15|35|2|0|
FIORE-F|20 mg/ml|0|555|5|35|2|0|
FLEXI PLUS|75 mg / 75 mg|0|122|3|35|2|0|
FLEXI PLUS|150 mg / 75 mg|0|122|3|35|2|0|
FLEXIFLOW|75 mg|0|299|3|35|2|0|
FLEXIFLOW|300 mg|0|299|3|35|2|0|
FOLFE|150 mg / 0.5 mg|0|439|5|35|2|0|
FUNGE|125 mg|0|835|6|35|2|0|
FUNGE|250 mg|0|835|6|35|2|0|
FUTINE|10 mg|0|461|10|35|2|0|
FUTINE|20 mg|0|461|10|35|2|0|
FUTINE|40 mg|0|461|10|35|2|0|
GC-PLUS|500 mg / 400 mg|0|500|15|35|2|0|
GELITA|10 mg|0|428|3|35|2|0|
GLYFORM|500 mg|0|628|9|35|2|0|
GLYSET|1 mg|0|494|9|35|2|0|
GLYSET|2 mg|0|494|9|35|2|0|
GLYSET|3 mg|0|494|9|35|2|0|
GLYSET|4 mg|0|494|9|35|2|0|
GLYTAN|60 mg|0|664|9|35|2|0|
GLYTAN|120 mg|0|664|9|35|2|0|
HEMOTIN||2|436|5|35|2|0|
HISTANIL|10 mg|0|598|4|35|2|0|
HISTANIL|5 mg/5ml|2|598|4|35|2|0|
HISTANIL D|5 mg|0|329|4|35|2|0|
HISTASET|5 mg|0|584|4|35|2|0|
HYOSCINE COMPOUND|10 mg|0|534|2|35|2|0|
ILARIO|20 mg|1|387|10|35|2|0|
ILARIO|30 mg|1|387|10|35|2|0|
ILARIO|60 mg|1|387|10|35|2|0|
IMPIKA|20 mg|0|715|10|35|2|0|
IPRIDE|50 mg|0|561|2|35|2|0|
IPRIDE SR|150 mg|1|561|2|35|2|0|
JEVITY|20 mg|0|431|2|35|2|0|
JEVITY|40 mg|0|431|2|35|2|0|
JEVITY|10 mg/5ml|2|431|2|35|2|0|
KANDO|4 mg|0|223|3|35|2|0|
KANDO|8 mg|0|223|3|35|2|0|
KANDO|16 mg|0|223|3|35|2|0|
KANDO|32 mg|0|223|3|35|2|0|
KERATO|2% / 2% / 2% / 3%|4|307|6|35|2|0|
KYMYK|200 mg|0|531|8|35|2|0|
LABISTA|50 mg|0|276|3|35|2|0|
LABISTA|100 mg|0|276|3|35|2|0|
LASTOLIP|10 mg|0|127|3|35|2|0|
LASTOLIP|20 mg|0|127|3|35|2|0|
LASTOLIP|40 mg|0|127|3|35|2|0|
LASTOLIP|80 mg|0|127|3|35|2|0|
LASTOLIP EZ|10 mg / 10 mg|0|128|3|35|2|0|
LASTOLIP EZ|20 mg / 10 mg|0|128|3|35|2|0|
LOSAN|50 mg|0|603|3|35|2|0|
LOSAN PLUS|50 mg / 12.5 mg|0|604|3|35|2|0|
LOTTO|50 mg|0|356|1|35|2|0|
LOTTO|75 mg|0|356|1|35|2|0|
LOTTO D|50 mg|0|356|1|35|2|0|
LYDIA|0.25 mg|0|25|10|35|2|0|
LYDIA|0.5 mg|0|25|10|35|2|0|
M. COM|7.5 mg|0|625|1|35|2|0|
M. COM|15 mg|0|625|1|35|2|0|
MACTRIL|10 mg|0|72|10|35|2|0|
MACTRIL|15 mg|0|72|10|35|2|0|
MEDIGESIC|35 mg / 450 mg|0|697|1|35|2|0|
MEDIGESIC C|60 mg / 35 mg / 400 mg|0|198|1|35|2|0|
MEDIGESIC FORTE|30 mg / 50 mg / 450 mg|0|198|1|35|2|0|
MELASMADERM|2 %w/w|4|530|6|35|2|0|
MELBEK D|20 mg|0|885|5|35|2|0|
MERCAZOLE|5 mg|0|231|15|35|2|0|
METOWIL|10 mg|0|638|2|35|2|0|
METRONIDAZOLE|200 mg|0|640|0|35|2|0|
METRONIDAZOLE|400 mg|0|640|0|35|2|0|
MINOWIL|100 mg|0|645|0|35|2|0|
MOBIC|7.5 mg|0|625|1|35|2|0|
MOBIC|15 mg|0|625|1|35|2|0|
MODLIP|10 mg|0|804|3|35|2|0|
MODLIP|20 mg|0|804|3|35|2|0|
MODLIP|40 mg|0|804|3|35|2|0|
MODLIP|80 mg|0|804|3|35|2|0|
MODLIP Z|10 mg / 10 mg|0|429|3|35|2|0|
MODLIP Z|10 mg / 20 mg|0|429|3|35|2|0|
MODLIP Z|10 mg / 40 mg|0|429|3|35|2|0|
MODLIP Z|10 mg / 80 mg|0|429|3|35|2|0|
MOTROL|25 mg|0|587|2|35|2|0|
MOTROL|50 mg|0|587|2|35|2|0|
MOTROL|100 mg|0|587|2|35|2|0|
NANZO|5 mg|0|190|10|35|2|0|
NANZO|10 mg|0|190|10|35|2|0|
NAPOLI|250 mg|0|663|1|35|2|0|
NAPOLI|500 mg|0|663|1|35|2|0|
NATUZZI|5 mg|0|747|3|35|2|0|
NATUZZI|10 mg|0|747|3|35|2|0|
NEUMO|250 mg|0|585|0|35|2|0|
NEUMO|500 mg|0|585|0|35|2|0|
NEUMO|750 mg|0|585|0|35|2|0|
NEUROVIT|200 mcg / 100 mg / 100 mg|0|319|5|35|2|0|
OPRONIEX|0.216 mg|0|188|1|35|2|0|
OPTIK|125 mg/5ml|2|248|0|35|2|0|
OPTIK|250 mg/5ml|2|248|0|35|2|0|
OTELLO|12.5 mg|0|240|3|35|2|0|
OXYWILL|250 mg|1|703|0|35|2|0|
PALZIC|400 mg|0|651|0|35|2|0|
PARACETAMOL|500 mg|0|707|1|35|2|0|
PERLITA|90 mg|0|366|3|35|2|0|
PERLITA|180 mg|1|366|3|35|2|0|
PHENOTAB|30 mg|0|722|10|35|2|0|
PIGMA FREE|2 %w/v / 4 %w/v|4|506|6|35|2|0|
PROCHLOR|5 mg|0|757|2|35|2|0|
PRONTO|75 mg|1|698|7|35|2|0|
PROTONIX|40 mg|0|706|2|35|2|0|
QENTEL|200 mg|0|8|8|35|2|0|
QINK|100 mg|1|246|0|35|2|0|
QINK|40 mg/5ml|2|246|0|35|2|0|
QINK|50 mg/5ml|2|246|0|35|2|0|
QINK|100 mg/5ml|2|246|0|35|2|0|
QIZTA|68.1 mg|0|606|1|35|2|0|
QLUZ|20 mg|0|735|1|35|2|0|
QOBY|75 mg|0|189|10|35|2|0|
QONZA|10 mg|0|650|1|35|2|0|
QOSMET|500 mg / 50 mg|0|631|9|35|2|0|
QOSMET|1 g / 50 mg|0|631|9|35|2|0|
QUARTZ|4 mg|0|223|3|35|2|0|
QUARTZ|8 mg|0|223|3|35|2|0|
QUARTZ|16 mg|0|223|3|35|2|0|
QUARTZ|32 mg|0|223|3|35|2|0|
QUASH|250 mg|0|280|0|35|2|0|
QUASH|500 mg|0|280|0|35|2|0|
QUASH|125 mg/5ml|2|280|0|35|2|0|
QUASH|250 mg/5ml|2|280|0|35|2|0|
QUASH|500 mg/5ml|2|280|0|35|2|0|
QULAX|50 mg|0|400|15|35|2|0|
QUZIQ|200 mg|0|770|10|35|2|0|
RABZ|20 mg|0|772|2|35|2|0|
RAGUS|400 mg|0|135|0|35|2|0|
RANKER|250 mg|0|288|0|35|2|0|
RANKER|500 mg|0|288|0|35|2|0|
RANKER|125 mg/5ml|2|288|0|35|2|0|
RAPTROL|0.5 mg|0|777|9|35|2|0|
RAPTROL|1 mg|0|777|9|35|2|0|
RAPTROL|2 mg|0|777|9|35|2|0|
RELAX|5 mg|0|353|10|35|2|0|
RELAX|10 mg|0|353|10|35|2|0|
RELSPASM|4 mg|0|839|15|35|2|0|
RELYTE INSTANT|0.37 g / 0.875 g / 0.725 g|5|744|14|35|2|0|
ROZI|2 mg|0|787|9|35|2|0|
ROZI|4 mg|0|787|9|35|2|0|
ROZI|8 mg|0|787|9|35|2|0|
ROZIMET|500 mg / 1 mg|0|630|9|35|2|0|
ROZIMET|500 mg / 2 mg|0|630|9|35|2|0|
ROZIMET|500 mg / 4 mg|0|630|9|35|2|0|
ROZIMET PLUS|1 g / 2 mg|0|630|9|35|2|0|
ROZIMET PLUS|1 g / 4 mg|0|630|9|35|2|0|
SARAPYRINE|300 mg / 200 mg|0|123|1|35|2|0|
SECURE CAP & SUSP|200 mg|1|245|0|35|2|0|
SECURE CAP & SUSP|400 mg|1|245|0|35|2|0|
SECURE CAP & SUSP|100 mg/5ml|2|245|0|35|2|0|
SECURE CAP & SUSP|200 mg/5ml|2|245|0|35|2|0|
SELECO|100 mg|0|249|1|35|2|0|
SELECO|200 mg|0|249|1|35|2|0|
SHIRAZOLE|200 mg|0|640|0|35|2|0|
SHIRAZOLE|400 mg|0|640|0|35|2|0|
SHIROCIN|25 mg|1|546|1|35|2|0|
SHIRODEX|0.5 mg|0|334|15|35|2|0|
SIGPA|200 mcg / 100 mg / 100 mg|0|319|5|35|2|0|
SIPROF|250 mg|0|280|0|35|2|0|
SIPROF|500 mg|0|280|0|35|2|0|
AKNEKREAM|5 %w/w|4|147|6|34|2|0|
AKNEKREAM|10 %w/w|4|147|6|34|2|0|
ALLDAY|150 mg|0|20|3|34|2|0|
ALLDAY|300 mg|0|20|3|34|2|0|
ALLDAY-H|150 mg / 12.5 mg|0|21|3|34|2|0|
ALLDAY-H|150 mg / 25 mg|0|21|3|34|2|0|
ALLDAY-H|300 mg / 12.5 mg|0|21|3|34|2|0|
ALLDAY-H|300 mg / 25 mg|0|21|3|34|2|0|
ANGINOR|0.5 mg|0|504|3|34|2|0|
BECLOTAB|10 mg|0|142|15|34|2|0|
BIOS|20 mg / 1100 mg|1|692|2|34|2|0|
BIOS|40 mg / 1100 mg|1|692|2|34|2|0|
BIPONIL|10 mg|0|72|10|34|2|0|
BIPONIL|15 mg|0|72|10|34|2|0|
BIPONIL|20 mg|0|72|10|34|2|0|
BIPONIL|30 mg|0|72|10|34|2|0|
BLUEMET|500 mg / 1 mg|0|630|9|34|2|0|
BLUEMET|500 mg / 2 mg|0|630|9|34|2|0|
BLUEMET|500 mg / 4 mg|0|630|9|34|2|0|
BLUTAB|2 mg|0|787|9|34|2|0|
BLUTAB|4 mg|0|787|9|34|2|0|
BLUTAB|8 mg|0|787|9|34|2|0|
BRODIN|250 mg|0|585|0|34|2|0|
BRODIN|500 mg|0|585|0|34|2|0|
BRONKONORM|125 mg/5ml|2|4|12|34|2|0|
C-1000|1 g/sachet|5|78|5|34|2|0|
CALTAB CHEWABLE|1250 mg|0|212|5|34|2|0|
CAPTIL|25 mg|0|226|3|34|2|0|
CAPTIL|50 mg|0|226|3|34|2|0|
CAPTIL-H|25 mg / 15 mg|0|227|3|34|2|0|
CAPTIL-H|50 mg / 15 mg|0|227|3|34|2|0|
CARDIOVASC|2.5 mg|0|46|3|34|2|0|
CARDIOVASC|5 mg|0|46|3|34|2|0|
CARDIOVASC|10 mg|0|46|3|34|2|0|
CARDIOVASC DUO|10 mg / 20 mg|0|48|3|34|2|0|
CIPRIN|500 mg|0|280|0|34|2|0|
CIPRIN|1 g|0|280|0|34|2|0|
CIPRIN|250 mg|1|280|0|34|2|0|
CIPRIN|500 mg|1|280|0|34|2|0|
CIPRIN|125 mg/5ml|2|280|0|34|2|0|
CIPRIN|250 mg/5ml|2|280|0|34|2|0|
CLACIN|250 mg|0|288|0|34|2|0|
CLACIN|500 mg|0|288|0|34|2|0|
CLACIN|125 mg/5ml|2|288|0|34|2|0|
CLOBI-DERM|0.05 %w/w|4|293|6|34|2|0|
CO-CARDIOVASC|5 mg|0|46|3|34|2|0|
CO-CARDIOVASC|10 mg / 12.5 mg|0|49|3|34|2|0|
CO-EZIDAY|12.5 mg / 50 mg|0|518|3|34|2|0|
CO-EZIDAY|25 mg / 100 mg|0|518|3|34|2|0|
CO-EZITAB|12.5 mg / 40 mg|0|522|3|34|2|0|
CO-EZITAB|12.5 mg / 80 mg|0|522|3|34|2|0|
CO-LISPRIL|12.5 mg / 10 mg|0|516|3|34|2|0|
CO-LISPRIL|12.5 mg / 20 mg|0|516|3|34|2|0|
CO-PULSE|50 mg|0|124|3|34|2|0|
CO-PULSE|25 mg / 12.5 mg|0|125|3|34|2|0|
CO-PULSE|100 mg / 12.5 mg|0|125|3|34|2|0|
CO-SARTAN|12.5 mg / 80 mg|0|524|3|34|2|0|
CO-SARTAN|12.5 mg / 160 mg|0|524|3|34|2|0|
CO-SARTAN|25 mg / 160 mg|0|524|3|34|2|0|
CO-ZEAL|10 mg / 25 mg|0|398|3|34|2|0|
DIASTOLIC|16 mg|0|223|3|34|2|0|
DIASTOLIC H|16 mg / 12.5 mg|0|224|3|34|2|0|
DOLOGESIC||0|708|1|34|2|0|
ENDONIL|400 mg|0|277|2|34|2|0|
ENDONIL|100 mg/10ml|2|277|2|34|2|0|
ENIROBE|500 mg|0|796|8|34|2|0|
ENIROBE|1 g|0|796|8|34|2|0|
EPITAB-XR|200 mg|0|228|10|34|2|0|
EPITAB-XR|400 mg|0|228|10|34|2|0|
ESOPRAZOL|20 mg|1|412|2|34|2|0|
ESOPRAZOL|40 mg|1|412|2|34|2|0|
EZIDAY|25 mg|0|603|3|34|2|0|
EZIDAY|50 mg|0|603|3|34|2|0|
EZIDAY|100 mg|0|603|3|34|2|0|
EZITAB|40 mg|0|830|3|34|2|0|
EZITAB|50 mg|0|830|3|34|2|0|
FENGESIC|250 mg|0|623|1|34|2|0|
FENGESIC|50 mg/5ml|2|623|1|34|2|0|
FERICK|50 mg/ml|3|552|5|34|2|0|
FERICK|50 mg/5ml|2|552|5|34|2|0|
FERICK CHEWABLE|100 mg|0|555|5|34|2|0|
FLAMEX|50 mg|0|356|1|34|2|0|
FLAMEX|100 mg|0|356|1|34|2|0|
FLAMEX|100 mg|1|356|1|34|2|0|
FRECID|200 mg/5ml / 200 mg/5ml|2|28|2|34|2|0|
FRUSERIDE|5 mg / 40 mg|0|36|3|34|2|0|
GEF|0.25 mg|0|786|10|34|2|0|
GEF|1 mg|0|786|10|34|2|0|
GEF|2 mg|0|786|10|34|2|0|
GLIMECIDE|1 mg|0|494|9|34|2|0|
GLIMECIDE|2 mg|0|494|9|34|2|0|
GLIMECIDE|3 mg|0|494|9|34|2|0|
GLIMECIDE|4 mg|0|494|9|34|2|0|
HIGH-C 1000|500 mg / 327 mg / 1 g|5|102|5|34|2|0|
HIGH-C PLUS||5|100|5|34|2|0|
HYPERACE|2.5 mg|0|774|3|34|2|0|
HYPERACE|5 mg|0|774|3|34|2|0|
HYPONORM-H|12.5 mg / 150 mg|0|515|3|34|2|0|
HYPONORM-H|12.5 mg / 300 mg|0|515|3|34|2|0|
IMPRESS|25 mg|0|305|10|34|2|0|
IMPRESS|100 mg|0|305|10|34|2|0|
INHALERIN|2 mg|0|9|12|34|2|0|
INHALERIN|4 mg|0|9|12|34|2|0|
INHALERIN|8 mg|0|9|12|34|2|0|
INHALERIN|2 mg/5ml|2|9|12|34|2|0|
INOVIT|500 mcg|1|621|5|34|2|0|
INOVIT|500 mcg/sachet|5|621|5|34|2|0|
ISPALAX|6 g/sachet|5|764|2|34|2|0|
KEFRIL|250 mg|1|251|0|34|2|0|
KEFRIL|500 mg|1|251|0|34|2|0|
KEFRIL|125 mg/5ml|2|251|0|34|2|0|
KEFRIL|250 mg/5ml|2|251|0|34|2|0|
KEPHALEXIN|250 mg|1|250|0|34|2|0|
KEPHALEXIN|500 mg|1|250|0|34|2|0|
KEPHALEXIN|125 mg/5ml|2|250|0|34|2|0|
KEPHALEXIN|250 mg/5ml|2|250|0|34|2|0|
KIDS||2|203|5|34|2|0|
KUFGO|32 mg/5ml / 30 mg/5ml / 8 mg/5ml|2|40|7|34|2|0|
KURE|250 mg|0|582|10|34|2|0|
KURE|500 mg|0|582|10|34|2|0|
KURE|750 mg|0|582|10|34|2|0|
LISPRIL|5 mg|0|593|3|34|2|0|
LISPRIL|10 mg|0|593|3|34|2|0|
LISPRIL|20 mg|0|593|3|34|2|0|
MANIPRAM|20 mg|0|283|10|34|2|0|
MENIDAZOLE|200 mg|0|640|0|34|2|0|
MENIDAZOLE|200 mg/5ml|2|640|0|34|2|0|
MEPRAZOL|10 mg|1|691|2|34|2|0|
MEPRAZOL|20 mg|1|691|2|34|2|0|
MEPRAZOL|40 mg|1|691|2|34|2|0|
MOMENTIUM|10 mg|0|127|3|34|2|0|
MOMENTIUM|20 mg|0|127|3|34|2|0|
MOMENTIUM|40 mg|0|127|3|34|2|0|
MOMENTIUM-PLUS|10 mg|0|127|3|34|2|0|
MONITOR|2.5 mg|0|176|3|34|2|0|
MONITOR|5 mg|0|176|3|34|2|0|
MONITOR|10 mg|0|176|3|34|2|0|
MONITOR PLUS|5 mg / 6.25 mg|0|177|3|34|2|0|
MONITOR PLUS|10 mg / 6.25 mg|0|177|3|34|2|0|
NERVIN|0.25 mg|0|25|10|34|2|0|
NERVIN|0.5 mg|0|25|10|34|2|0|
NERVIN|1 mg|0|25|10|34|2|0|
NEWDAY|5 mg / 80 mg|0|54|3|34|2|0|
NEWDAY|5 mg / 160 mg|0|54|3|34|2|0|
NEWDAY|10 mg / 160 mg|0|54|3|34|2|0|
NEWDAY|5 mg / 320 mg|0|54|3|34|2|0|
NEWDAY|10 mg / 320 mg|0|54|3|34|2|0|
NIZODERM|2 %w/v|4|565|6|34|2|0|
NUVIA|25 mg|0|805|9|34|2|0|
NUVIA|50 mg|0|805|9|34|2|0|
NUVIA|100 mg|0|805|9|34|2|0|
OFLOXIN|200 mg|0|686|0|34|2|0|
OLANZIA|5 mg|0|688|10|34|2|0|
OLANZIA|7.5 mg|0|688|10|34|2|0|
OLANZIA|10 mg|0|688|10|34|2|0|
OSTEOPOR|10 mg|0|16|15|34|2|0|
OSTEOPOR-D|70 mcg / 70 mcg|0|17|15|34|2|0|
OSTEOPOR-D|70 mcg / 140 mcg|0|17|15|34|2|0|
PAINEZE|15 mg / 500 mg|0|309|1|34|2|0|
PARACETAMOL|120 mg/5ml|2|707|1|34|2|0|
PARACETAMOL|250 mg/5ml|2|707|1|34|2|0|
PASAGE|5 mg|0|788|3|34|2|0|
PASAGE|10 mg|0|788|3|34|2|0|
PASAGE|20 mg|0|788|3|34|2|0|
PASAGE|40 mg|0|788|3|34|2|0|
PEDILIX||2|15|7|34|2|0|
PEPTIBAN|10 mg|0|431|2|34|2|0|
PEPTIBAN|20 mg|0|431|2|34|2|0|
PEPTIBAN|40 mg|0|431|2|34|2|0|
PEPTIBAN|10 mg/5ml|2|431|2|34|2|0|
PEPTIBAN DISPERSIBLE|20 mg|0|431|2|34|2|0|
PEPTIBAN DISPERSIBLE|40 mg|0|431|2|34|2|0|
PEPTIBAN-AC|10 mg|0|431|2|34|2|0|
PINE|100 mg|0|770|10|34|2|0|
PROSYCLIDINE|5 mg|0|758|10|34|2|0|
PULSE|50 mg|0|124|3|34|2|0|
PULSE|100 mg|0|124|3|34|2|0|
QUITIN|25 mg|0|770|10|34|2|0|
QUITIN|100 mg|0|770|10|34|2|0|
QUITIN-FLASH|100 mg|0|770|10|34|2|0|
REGAIN XR|500 mg|0|628|9|34|2|0|
REGAIN XR|850 mg|0|628|9|34|2|0|
REGAIN XR|1 g|0|628|9|34|2|0|
REGULAIR|5 mg|0|649|12|34|2|0|
REGULAIR|10 mg|0|649|12|34|2|0|
RITE|250 mg / 125 mg|0|65|0|34|2|0|
RITE|500 mg / 125 mg|0|65|0|34|2|0|
RITE|875 mg / 125 mg|0|65|0|34|2|0|
RITE|125 mg/5ml / 31.25 mg/5ml|2|65|0|34|2|0|
RITE|250 mg/5ml / 62.5 mg/5ml|2|65|0|34|2|0|
RYDEM|2.5 mg|0|46|3|34|2|0|
RYDEM|5 mg|0|46|3|34|2|0|
RYDEM|10 mg|0|46|3|34|2|0|
SENSIBLE|10 mg|0|411|10|34|2|0|
SEQUENCE|20 mg|0|558|3|34|2|0|
SEQUENCE|60 mg|0|558|3|34|2|0|
SKELGESIC|2 mg|0|849|15|34|2|0|
SMOOTH TABS|20 mg|0|715|10|34|2|0|
SOFTIN|10 mg|0|598|4|34|2|0|
SOFTIN|5 mg/5ml|2|598|4|34|2|0|
SOFTIN-P|5 mg|0|598|4|34|2|0|
STOMACID|150 mg|0|775|2|34|2|0|
STOMACID|300 mg|0|775|2|34|2|0|
STOMACID|75 mg/5ml|2|775|2|34|2|0|
STOMEZE|10 mg|0|376|2|34|2|0|
STOMEZE|1 mg/ml|2|376|2|34|2|0|
SURVIVE|20 mg|0|804|3|34|2|0|
SURVIVE|40 mg|0|804|3|34|2|0|
SURVIVE PLUS|10 mg / 10 mg|0|429|3|34|2|0|
SURVIVE PLUS|10 mg / 20 mg|0|429|3|34|2|0|
SURVIVE PLUS|10 mg / 40 mg|0|429|3|34|2|0|
SURVIVE-AT PLUS|20 mg / 10 mg|0|128|3|34|2|0|
SURVIVE-AT PLUS|40 mg / 10 mg|0|128|3|34|2|0|
TENSIUM|3 mg|0|181|10|34|2|0|
URIFLOX|400 mg|0|684|0|34|2|0|
WALK-AID|50 mg|0|276|3|34|2|0|
WALK-AID|100 mg|0|276|3|34|2|0|
WERICID|215 mg|2|27|2|34|2|0|
WERIFIRIN|5 mg|0|880|3|34|2|0|
WERILAX|3.35 g/5ml|2|576|2|34|2|0|
WERIMOX|250 mg|1|64|0|34|2|0|
WERIMOX|500 mg|1|64|0|34|2|0|
WERIMOX|125 mg/5ml|2|64|0|34|2|0|
WERIMOX|250 mg/5ml|2|64|0|34|2|0|
WERISOL||5|502|14|34|2|0|
WERRICK'S-Q-10|30 mg|1|870|5|34|2|0|
WERRIDAL|100 mg/5ml|2|538|1|34|2|0|
WIZEN|1 mg|0|783|10|34|2|0|
WIZENFLASH|1 mg|0|783|10|34|2|0|
WIZEN|2 mg|0|783|10|34|2|0|
WIZENFLASH|2 mg|0|783|10|34|2|0|
WIZEN|3 mg|0|783|10|34|2|0|
WIZENFLASH|3 mg|0|783|10|34|2|0|
WIZEN|4 mg|0|783|10|34|2|0|
WIZENFLASH|4 mg|0|783|10|34|2|0|
WORTH|30 mg|1|387|10|34|2|0|
WORTH|40 mg|1|387|10|34|2|0|
WORTH|60 mg|1|387|10|34|2|0|
ACEFYL COUGH|45 mg/5ml / 8 mg/5ml|2|3|7|22|2|0|
ACEFYL SUGAR FREE COUGH|45 mg/5ml / 8 mg/5ml|2|2|7|22|2|0|
AFERDOZE|100 mg|0|552|5|22|2|0|
AFERDOZE|50 mg/5ml|2|552|5|22|2|0|
AFERDOZE|50 mg|2|552|5|22|2|0|
ALBACT|200 mg|0|684|0|22|2|0|
ALLERGEX|2 mg/5ml|2|259|4|22|2|0|
AM DESCOL|10 mg / 20 mg|0|47|3|22|2|0|
AMDIPINE|5 mg|0|46|3|22|2|0|
AMDIPINE|10 mg|0|46|3|22|2|0|
ARTHROFEN|100 mg|0|464|1|22|2|0|
ARTICOXIB|100 mg|1|249|1|22|2|0|
ARTICOXIB|200 mg|1|249|1|22|2|0|
AZIC|250 mg|0|134|0|22|2|0|
BENPROST|20 mcg|0|154|3|22|2|0|
BEPSAR|25 mg|0|603|3|22|2|0|
BEPSAR|50 mg|0|603|3|22|2|0|
BEPSAR PLUS|12.5 mg / 50 mg|0|518|3|22|2|0|
BIOLYSINE||2|103|5|22|2|0|
BUZON|1 mg|0|783|10|22|2|0|
BUZON|2 mg|0|783|10|22|2|0|
BUZON|3 mg|0|783|10|22|2|0|
BUZON|4 mg|0|783|10|22|2|0|
BUZON|1 mg/ml|2|783|10|22|2|0|
CARPRO|6.25 mg|0|240|3|22|2|0|
CARPRO|12.5 mg|0|240|3|22|2|0|
CARPRO|25 mg|0|240|3|22|2|0|
CEFABACT|500 mg|1|242|0|22|2|0|
CEFABACT|125 mg/5ml|2|242|0|22|2|0|
CEFABACT|250 mg/5ml|2|242|0|22|2|0|
CEFEXOL|400 mg|1|245|0|22|2|0|
CEFEXOL|100 mg/5ml|2|245|0|22|2|0|
CEFEXOL|200 mg/5ml|2|245|0|22|2|0|
CLARITHRO|250 mg|0|288|0|22|2|0|
CLARITHRO|500 mg|0|288|0|22|2|0|
CLARITHRO|125 mg/5ml|2|288|0|22|2|0|
CLARITHRO||3|288|0|22|2|0|
CLARITHRO XL|500 mg|0|288|0|22|2|0|
CLARITHRO-SR|500 mg|0|288|0|22|2|0|
CO-DEPRICAP|25 mg / 6 mg|1|462|10|22|2|0|
COLOSPAS|135 mg|0|616|2|22|2|0|
COLOSPAS|200 mg|1|616|2|22|2|0|
COMYCETIN|1 %w/v|3|253|11|22|2|0|
COMYCETIN|0.5 %w/v|3|253|11|22|2|0|
CORTEC|5 mg|0|397|3|22|2|0|
CORTEC|10 mg|0|397|3|22|2|0|
CORTEC PLUS|10 mg|0|397|3|22|2|0|
DEPLAT|75 mg|0|299|3|22|2|0|
DEPLAT-AP|75 mg / 75 mg|0|122|3|22|2|0|
DEPLAT-AP|150 mg / 75 mg|0|122|3|22|2|0|
DEPRICAP|20 mg|1|461|10|22|2|0|
DEPRICAP|20 mg/5ml|2|461|10|22|2|0|
DERMOSPORIN|1 %w/w|4|301|6|22|2|0|
DERMOSPORIN|1 %w/v|4|301|6|22|2|0|
DERMOSPORIN|1 %w/w / 1 %w/w|4|303|6|22|2|0|
DERMOSPORIN-B|0.05 %w/w / 1 %w/w|4|158|6|22|2|0|
DERVIT|0.005 %w/w|4|207|6|22|2|0|
DERVIT-B|0.005 %w/w / 0.005 %w/w|4|157|6|22|2|0|
DESCOL|10 mg|0|127|3|22|2|0|
DESCOL|20 mg|0|127|3|22|2|0|
DESCOL|40 mg|0|127|3|22|2|0|
DETOXICOL|3.35 g/5ml|2|576|2|22|2|0|
DIAMET|250 mg|0|628|9|22|2|0|
DIAMET|500 mg|0|628|9|22|2|0|
DIZONE|15 mg|0|731|9|22|2|0|
DIZONE|30 mg|0|731|9|22|2|0|
DIZONE|45 mg|0|731|9|22|2|0|
DYSEN|750 mg/30ml|2|796|8|22|2|0|
DYSEN FORTE|1 g|0|796|8|22|2|0|
EBTIN|20 mg|0|393|4|22|2|0|
EBTIN|5 mg/5ml|2|393|4|22|2|0|
EQULIP|48 mg|0|434|3|22|2|0|
EQULIP|145 mg|0|434|3|22|2|0|
ERABACT|20 mg|0|706|2|22|2|0|
ES-LOPROT|20 mg|1|412|2|22|2|0|
ES-LOPROT|40 mg|1|412|2|22|2|0|
ES-PRAMCIT|5 mg|0|411|10|22|2|0|
ES-PRAMCIT|10 mg|0|411|10|22|2|0|
ES-PRAMCIT|20 mg|0|411|10|22|2|0|
EZIFLO SR|5 mg|0|19|15|22|2|0|
EZIFLO XL|10 mg|0|19|15|22|2|0|
FANART|20 mg / 120 mg|0|74|8|22|2|0|
FANART|40 mg / 240 mg|0|74|8|22|2|0|
FANART JUNIOR|15 mg/5ml / 90 mg/5ml|2|74|8|22|2|0|
FANART PLUS|80 mg / 480 mg|0|74|8|22|2|0|
FANASEL PLUS||0|444|4|22|2|0|
FERSUL|200 mg|0|441|5|22|2|0|
FLOCARD|10 mg|0|672|3|22|2|0|
FLOCARD|20 mg|0|672|3|22|2|0|
FLUDERM|50 mg|1|450|6|22|2|0|
FLUDERM|150 mg|1|450|6|22|2|0|
FOLITAB|5 mg|0|469|5|22|2|0|
GABA|100 mg|1|484|10|22|2|0|
GABA|300 mg|1|484|10|22|2|0|
GENTABACT|0.3 %v/v|3|489|11|22|2|0|
GLANORM|5 mg|0|491|9|22|2|0|
GLICOTRON|80 mg|0|493|9|22|2|0|
GYNOSPORIN|100 mg|7|301|13|22|2|0|
GYNOSPORIN|500 mg|7|301|13|22|2|0|
IRPO-FA|0.35 mg/5ml / 50 mg/5ml|2|470|5|22|2|0|
IRPO-FA|0.35 mg / 100 mg|0|470|5|22|2|0|
KLEENLAC|0.66 g/5ml / 3.35 g/5ml|2|485|2|22|2|0|
KLODIC|50 mg|0|355|1|22|2|0|
LO-LIPID|20 mg|0|605|3|22|2|0|
LOPROT|20 mg|1|691|2|22|2|0|
LUMETHER DS|40 mg / 240 mg|0|74|8|22|2|0|
LUNGAIR|4 mg|0|649|12|22|2|0|
LUNGAIR|5 mg|0|649|12|22|2|0|
LUNGAIR|10 mg|0|649|12|22|2|0|
MECOBAL|500 mcg|0|621|5|22|2|0|
MEFLOX|400 mg|0|651|0|22|2|0|
MYZOVAG|2 %w/w|7|642|13|22|2|0|
NORLIM|1 mg|0|494|9|22|2|0|
NORLIM|2 mg|0|494|9|22|2|0|
NORLIM|3 mg|0|494|9|22|2|0|
NORLIM|4 mg|0|494|9|22|2|0|
NORMALITH SR|400 mg|0|594|10|22|2|0|
NORMIDILOL|6.25 mg|0|240|3|22|2|0|
NORMIDILOL|12.5 mg|0|240|3|22|2|0|
NORMIDILOL|25 mg|0|240|3|22|2|0|
NORMISAR|20 mg|0|830|3|22|2|0|
NORMISAR|40 mg|0|830|3|22|2|0|
NORMISAR|80 mg|0|830|3|22|2|0|
NORMISAR|12.5 mg / 40 mg|0|522|3|22|2|0|
NORMISAR PLUS|12.5 mg / 40 mg|0|522|3|22|2|0|
NORMITAB|25 mg|0|124|3|22|2|0|
NORMITAB|50 mg|0|124|3|22|2|0|
NORMITAB|100 mg|0|124|3|22|2|0|
NORMITAB PLUS|50 mg / 12.5 mg|0|125|3|22|2|0|
OGNIS|177.6 mg / 82.2 mg|0|210|5|22|2|0|
OGNIS D|830 mg|0|699|5|22|2|0|
OSTO|70 mg|0|16|15|22|2|0|
OXZEPIN|150 mg|0|701|10|22|2|0|
OXZEPIN|300 mg|0|701|10|22|2|0|
OXZEPIN|600 mg|0|701|10|22|2|0|
PEPTICURE|150 mg|0|775|2|22|2|0|
PRAMCIT|20 mg|0|283|10|22|2|0|
RELAXITAL|3 mg|0|181|10|22|2|0|
RELIEFAL|125 mg|0|707|1|22|2|0|
RELIEFAL|250 mg|0|707|1|22|2|0|
REXYL||2|41|7|22|2|0|
ROVIROS|5 mg|0|788|3|22|2|0|
ROVIROS|10 mg|0|788|3|22|2|0|
ROVIROS|20 mg|0|788|3|22|2|0|
SIMVA|10 mg|0|804|3|22|2|0|
SIMVA|20 mg|0|804|3|22|2|0|
SIMVA PLUS|10 mg / 10 mg|0|429|3|22|2|0|
SIMVA PLUS|10 mg / 20 mg|0|429|3|22|2|0|
SIMVA PLUS|20 mg / 40 mg|0|429|3|22|2|0|
STIR-UP|10 mg|0|626|10|22|2|0|
STIR-UP|10 mg|2|626|10|22|2|0|
SULPHAKREAM-N|15 %w/w|4|821|6|22|2|0|
VAGIBACT|2 %w/w|7|291|13|22|2|0|
VESELO|1 mg|0|834|3|22|2|0|
VESELO|2 mg|0|834|3|22|2|0|
WARIOR|250 mg|0|585|0|22|2|0|
WARIOR|500 mg|0|585|0|22|2|0|
ZEQUIN|200 mg|0|486|0|22|2|0|
ZEQUIN|400 mg|0|486|0|22|2|0|
ZIPROX|20 mg|1|886|10|22|2|0|
ZIPROX|40 mg|1|886|10|22|2|0|
ZIPROX|60 mg|1|886|10|22|2|0|
ZIPROX|80 mg|1|886|10|22|2|0|
ZUDIC|2 %w/w|4|483|6|22|2|0|
ZUDIC|250 mg|0|483|0|22|2|0|
ZUDIC|250 mg/5ml|2|483|0|22|2|0|
ZUDICORT|0.1 %w/w / 2 %w/w|4|159|6|22|2|0|
ZULOXET|20 mg|1|387|10|22|2|0|
ZULOXET|30 mg|1|387|10|22|2|0|
ZULOXET|60 mg|1|387|10|22|2|0|
ZYNQ|20 mg/5ml|2|885|5|22|2|0|
AFERT|125 mg|0|835|6|12|2|0|
AMOTIDE|20 mg|0|431|2|12|2|0|
AMOTIDE|40 mg|0|431|2|12|2|0|
BAMIFLU|75 mg|1|698|7|12|2|0|
BRITAN|2.5 mg|0|835|6|12|2|0|
BRITAN|1.5 mg/5ml|2|835|6|12|2|0|
BTNO|10 mg|0|143|12|12|2|0|
BTNO|20 mg|0|143|12|12|2|0|
BTNO|5 mg/5ml|2|143|12|12|2|0|
CINRIDE|1 mg|0|278|2|12|2|0|
CNIZ|20 mg|0|885|5|12|2|0|
CNIZ|10 mg/5ml|2|885|5|12|2|0|
D4U|40 IU|3|270|5|12|2|0|
DEPSIT|5 mg|0|411|10|12|2|0|
DEPSIT|10 mg|0|411|10|12|2|0|
DEPSIT|20 mg|0|411|10|12|2|0|
DIMIS||0|357|1|12|2|0|
DIPHOS||0|372|8|12|2|0|
DOLMI|60 mg / 15 mg / 500 mg|0|197|1|12|2|0|
E-ZE|3 mg|0|181|10|12|2|0|
E-ZE|6 mg|0|181|10|12|2|0|
EFECIP|250 mg|0|280|0|12|2|0|
EFECIP|500 mg|0|280|0|12|2|0|
EFECIP|250 mg/5ml|2|280|0|12|2|0|
ELMC|67 mg|1|434|3|12|2|0|
ELMC|200 mg|1|434|3|12|2|0|
ENERVIN||2|570|5|12|2|0|
ERIN|150 mg / 12.5 mg|0|21|3|12|2|0|
ERIN|150 mg / 25 mg|0|21|3|12|2|0|
ERIN|300 mg / 12.5 mg|0|21|3|12|2|0|
ERIN|300 mg / 25 mg|0|21|3|12|2|0|
ETINAT|400 mg|0|422|15|12|2|0|
EXIFIN|100 mg/5ml|2|538|1|12|2|0|
FREAL|150 mg|0|782|15|12|2|0|
GELFER|12.5 mg / 40 mg|0|522|3|12|2|0|
GEN-M|20 mg / 120 mg|0|74|8|12|2|0|
GEN-M|80 mg / 480 mg|0|74|8|12|2|0|
GEN-M|15 mg/5ml / 90 mg/5ml|2|74|8|12|2|0|
GEN-M DS|30 mg/5ml / 180 mg/5ml|2|74|8|12|2|0|
GENART|40 mg|0|73|8|12|2|0|
GENART|80 mg|0|73|8|12|2|0|
GENART-SP||0|76|8|12|2|0|
GENBROL|50 mg / 650 mg|0|697|1|12|2|0|
GENFIX|60 mg|0|443|4|12|2|0|
GENFIX|120 mg|0|443|4|12|2|0|
GENFIX|180 mg|0|443|4|12|2|0|
GENFIX-D|60 mg / 120 mg|0|444|4|12|2|0|
GENLIP|1 mg|0|494|9|12|2|0|
GENLIP|2 mg|0|494|9|12|2|0|
GENLIP|3 mg|0|494|9|12|2|0|
GENLIP|4 mg|0|494|9|12|2|0|
GENMOL|4 mg|0|9|12|12|2|0|
GENMOL|8 mg|0|9|12|12|2|0|
GENMOL|2 mg/5ml|2|9|12|12|2|0|
GENOVAX|10 mg|0|127|3|12|2|0|
GENOVAX|20 mg|0|127|3|12|2|0|
GENOVAX|40 mg|0|127|3|12|2|0|
GENOVAX|80 mg|0|127|3|12|2|0|
GENOXEN|500 mg|0|663|1|12|2|0|
GLIZID-5|5 mg|0|497|9|12|2|0|
GLYNASE|80 mg|0|493|9|12|2|0|
GOODBON|400 mg / 500 mg|5|273|15|12|2|0|
GRAT|320 mg|0|488|0|12|2|0|
HAMIC|250 mg|1|857|15|12|2|0|
HAMIC|500 mg|1|857|15|12|2|0|
HUSK-M|135 mg / 3.5 g|5|617|2|12|2|0|
IBNATE|150 mg|0|537|15|12|2|0|
ILODON|2 mg|0|541|10|12|2|0|
ILODON|4 mg|0|541|10|12|2|0|
ILODON|6 mg|0|541|10|12|2|0|
ILODON|12 mg|0|541|10|12|2|0|
ILR-G|5 mg|0|584|4|12|2|0|
IMETIDE|400 mg|0|277|2|12|2|0|
IRIL|10 mg / 10 mg|0|429|3|12|2|0|
IRIL|10 mg / 20 mg|0|429|3|12|2|0|
IRIL|10 mg / 40 mg|0|429|3|12|2|0|
IRIL|10 mg / 80 mg|0|429|3|12|2|0|
ITRACAP|100 mg|1|562|6|12|2|0|
IVERMEC|3 mg|0|563|8|12|2|0|
JANVIA-M|500 mg / 50 mg|0|631|9|12|2|0|
JANVIA-M|1 g / 50 mg|0|631|9|12|2|0|
KARBUFEN|400 mg|0|538|1|12|2|0|
KARBUFEN|100 mg/5ml|2|538|1|12|2|0|
KARBUFEN|10 %w/w|4|538|1|12|2|0|
KARGIX|10 mg|0|252|4|12|2|0|
KARMAGEN|0.3 %w/w|4|489|6|12|2|0|
KARMAPLEX||2|93|5|12|2|0|
KARMASAF||5|502|14|12|2|0|
KARMOL CF|4 mg / 500 mg / 60 mg|0|264|7|12|2|0|
KARMOL-NEO||0|106|7|12|2|0|
KAROXYN|100 mg|1|384|0|12|2|0|
KLARQUINE|250 mg|0|258|8|12|2|0|
LAFAXINE|50 mg|0|333|10|12|2|0|
LAFAXINE|100 mg|0|333|10|12|2|0|
LALAP|50 mg|0|572|10|12|2|0|
LALAP|100 mg|0|572|10|12|2|0|
LALAP|200 mg|0|572|10|12|2|0|
LAMZO|0.25 mg|0|25|10|12|2|0|
LAMZO|0.5 mg|0|25|10|12|2|0|
LAMZO|1 mg|0|25|10|12|2|0|
LARITH|250 mg|0|288|0|12|2|0|
LARITH|500 mg|0|288|0|12|2|0|
LARITH|125 mg/5ml|2|288|0|12|2|0|
LARITH|125 mg/5ml|3|288|0|12|2|0|
LARITH XL|500 mg|0|288|0|12|2|0|
LENDROL-D||0|17|15|12|2|0|
MAXLAX|2 mg|0|849|15|12|2|0|
MAXLAX|4 mg|0|849|15|12|2|0|
MEP-B|20 mg / 1100 mg|1|692|2|12|2|0|
MEP-B|40 mg / 1100 mg|1|692|2|12|2|0|
METSU XL|100 mg|0|639|3|12|2|0|
MIEK|10 mg|0|428|3|12|2|0|
MIGROT|25 mg|0|826|1|12|2|0|
MIGROT|50 mg|0|826|1|12|2|0|
MIGROT|100 mg|0|826|1|12|2|0|
MITE|25 mcg|0|647|13|12|2|0|
MITE|50 mcg|0|647|13|12|2|0|
MITE|200 mcg|0|647|13|12|2|0|
MITEK|100 mcg|0|647|13|12|2|0|
MOVCOL|46.6 mg / 178.5 mg / 350.7 mg|5|743|2|12|2|0|
MOVELEF|10 mg|0|580|15|12|2|0|
MOVELEF|20 mg|0|580|15|12|2|0|
MOVELEF|100 mg|0|580|15|12|2|0|
NAZOL|2 %w/w|4|435|6|12|2|0|
NERAM|0.5 mg|0|25|10|12|2|0|
NOXFLAM|4 mg|0|601|1|12|2|0|
NOXFLAM|8 mg|0|601|1|12|2|0|
NT-TOX|500 mg|0|681|8|12|2|0|
NT-TOX|100 mg/5ml|2|681|8|12|2|0|
OMC PLUS||0|178|5|12|2|0|
OSKER|60 mg|1|695|15|12|2|0|
OSKER|120 mg|1|695|15|12|2|0|
OSTIBON|0.5 mcg|0|18|5|12|2|0|
OXIFECT|200 mg|0|486|0|12|2|0|
OXIFECT|400 mg|0|486|0|12|2|0|
PERSIVA|5 mg|0|747|3|12|2|0|
PERSIVA|10 mg|0|747|3|12|2|0|
PIOBETIC|15 mg|0|731|9|12|2|0|
PIOBETIC|30 mg|0|731|9|12|2|0|
PIOBETIC|45 mg|0|731|9|12|2|0|
PIOBETIC-G|2 mg / 15 mg|0|496|9|12|2|0|
PIOBETIC-G|2 mg / 30 mg|0|496|9|12|2|0|
PIOBETIC-G|4 mg / 30 mg|0|496|9|12|2|0|
PIROXIM|20 mg|1|735|1|12|2|0|
PIROXIM|0.5 %w/w|4|735|1|12|2|0|
PIROXIM-NEO|20 mg|0|736|1|12|2|0|
PITALO|2 mg|0|737|3|12|2|0|
RBC||2|552|5|12|2|0|
RBC-F|0.35 mg / 100 mg|0|470|5|12|2|0|
RESPICARE|4 mg|0|649|12|12|2|0|
RESPICARE CHEW|4 mg|0|649|12|12|2|0|
RESPICARE|5 mg|0|649|12|12|2|0|
RESPICARE CHEW|5 mg|0|649|12|12|2|0|
RESPICARE|10 mg|0|649|12|12|2|0|
RESPICARE CHEW|10 mg|0|649|12|12|2|0|
RIVEME|2 mg|2|785|10|12|2|0|
S-FLOX|250 mg|0|585|0|12|2|0|
S-FLOX|500 mg|0|585|0|12|2|0|
SKYGEN NEO|16 mg / 12.5 mg|0|224|3|12|2|0|
SKYGEN NEO|32 mg / 12.5 mg|0|224|3|12|2|0|
SKYGEN NEO|32 mg / 25 mg|0|224|3|12|2|0|
TELMIS-A|5 mg / 40 mg|0|53|3|12|2|0|
TELMIS-A|5 mg / 80 mg|0|53|3|12|2|0|
TELMIS-A|10 mg / 40 mg|0|53|3|12|2|0|
TELMIS-A|10 mg / 80 mg|0|53|3|12|2|0|
TELMIS-H|12.5 mg / 40 mg|0|522|3|12|2|0|
TICS|25 mg|0|853|10|12|2|0|
TICS|50 mg|0|853|10|12|2|0|
TICS|100 mg|0|853|10|12|2|0|
TICS|200 mg|0|853|10|12|2|0|
TRAND-V ER|2 mg / 240 mg|0|856|3|12|2|0|
TRAND-V ER|4 mg / 240 mg|0|856|3|12|2|0|
VLEP|500 mg|0|877|10|12|2|0|
VLEP|500 mg|5|877|10|12|2|0|
X-GEN|400 mg|0|651|0|12|2|0|
ZILESTA|10 mg|0|882|12|12|2|0|
ZILESTA|20 mg|0|882|12|12|2|0|
ZOLERIC|20 mg|1|412|2|12|2|0|
ZOLERIC|40 mg|1|412|2|12|2|0|
ZYSPAN|400 mg|0|592|0|12|2|0|
ZYSPAN|600 mg|0|592|0|12|2|0|
ZYSPAN|100 mg|2|592|0|12|2|0|
ADELA|0.25 mcg|0|18|5|13|3|0|
ADELA|0.5 mcg|0|18|5|13|3|0|
ADELA|1 mcg|0|18|5|13|3|0|
ADVANT|8 mg|0|223|3|13|3|0|
ADVANT|16 mg|0|223|3|13|3|0|
ADVANTEC|16 mg / 12.5 mg|0|224|3|13|3|0|
AMSTAN|5 mg / 80 mg|0|54|3|13|3|0|
AMSTAN|5 mg / 160 mg|0|54|3|13|3|0|
AMSTAN|10 mg / 160 mg|0|54|3|13|3|0|
AMTAS|5 mg / 40 mg|0|53|3|13|3|0|
AMTAS|5 mg / 80 mg|0|53|3|13|3|0|
AMTAS|10 mg / 40 mg|0|53|3|13|3|0|
AMTAS|10 mg / 80 mg|0|53|3|13|3|0|
ARTHEGET|20 mg / 120 mg|0|74|8|13|3|0|
ARTHEGET|40 mg / 240 mg|0|74|8|13|3|0|
ARTHEGET EZ|80 mg / 480 mg|0|74|8|13|3|0|
ASACOL|4 g/100ml|7|627|2|13|3|0|
ASACOL|400 mg|0|627|2|13|3|0|
BEKSON FORTE|250 mcg/actu|6|144|12|13|3|0|
BEKSON HFA|50 mcg|6|144|12|13|3|0|
BEKSON HFA|250 mcg|6|144|12|13|3|0|
CADWIN|5 mg / 10 mg|0|47|3|13|3|0|
CADWIN|10 mg / 10 mg|0|47|3|13|3|0|
CARTIGEN|400 mg / 500 mg|0|273|15|13|3|0|
CARTIGEN PLUS|600 mg / 750 mg|0|273|15|13|3|0|
CELBEXX|100 mg|1|249|1|13|3|0|
CELBEXX|200 mg|1|249|1|13|3|0|
CINITA|1 mg|0|278|2|13|3|0|
CIPESTA|250 mg|0|280|0|13|3|0|
CIPESTA|500 mg|0|280|0|13|3|0|
CIPESTA XR|500 mg|0|280|0|13|3|0|
CIPESTA XR|1 g|0|280|0|13|3|0|
CLARITEK|125 mg/5ml|3|288|0|13|3|0|
CLARITEK|125 mg/5ml|2|288|0|13|3|0|
CLARITEK|250 mg/5ml|2|288|0|13|3|0|
CLARITEK|250 mg|0|288|0|13|3|0|
CLARITEK|500 mg|0|288|0|13|3|0|
CLARITEK XL|500 mg|0|288|0|13|3|0|
CO-TASMI|12.5 mg / 40 mg|0|522|3|13|3|0|
CO-TASMI|12.5 mg / 80 mg|0|522|3|13|3|0|
CO-TRUPRIL|12.5 mg / 20 mg|0|516|3|13|3|0|
CYTOPAN|50 mg / 200 mcg|0|357|1|13|3|0|
CYTOPAN|75 mg / 200 mcg|0|357|1|13|3|0|
D-FORMIN MR|500 mg|0|628|9|13|3|0|
D-FORMIN MR|1 g|0|628|9|13|3|0|
DIORA|50 mg|1|352|1|13|3|0|
EMRIX|15 mg|1|322|1|13|3|0|
EMRIX|30 mg|1|322|1|13|3|0|
ETIDOXINE|100 mg|1|384|0|13|3|0|
EZITA|10 mg|0|428|3|13|3|0|
FENOGET|67 mg|1|434|3|13|3|0|
FENOGET|134 mg|1|434|3|13|3|0|
FENOGET|200 mg|1|434|3|13|3|0|
FERFIX|50 mg/5ml|2|552|5|13|3|0|
FERFIX-FA|0.35 mg / 100 mg|0|470|5|13|3|0|
FEXET D|60 mg / 120 mg|0|444|4|13|3|0|
GABIX|100 mg|1|484|10|13|3|0|
GABIX|300 mg|1|484|10|13|3|0|
GABIX|400 mg|1|484|10|13|3|0|
GETIFLOX|200 mg|0|686|0|13|3|0|
GETIFLOX|400 mg|0|686|0|13|3|0|
GETZACIN||0|686|0|13|3|0|
GLYRATE-SR|2.6 mg|0|504|3|13|3|0|
GLYRATE-SR|6.4 mg|0|504|3|13|3|0|
GOTIL||0|131|2|13|3|0|
HCQ 200|200 mg|0|531|8|13|3|0|
LARINEX|5 mg|0|329|4|13|3|0|
LIPIGET EZ|10 mg / 10 mg|0|128|3|13|3|0|
LOTASS|25 mg|0|568|15|13|3|0|
LOTASS|50 mg|0|568|15|13|3|0|
LOTASS|100 mg|0|568|15|13|3|0|
LYTA|20 mg|1|388|10|13|3|0|
LYTA|30 mg|1|388|10|13|3|0|
LYTA|60 mg|1|388|10|13|3|0|
LYZON|400 mg|0|592|0|13|3|0|
LYZON|600 mg|0|592|0|13|3|0|
MASACOL|400 mg|0|627|2|13|3|0|
MASACOL|800 mg|0|627|2|13|3|0|
MEBEVER MR|200 mg|1|616|2|13|3|0|
MOXIGET|400 mg|0|651|0|13|3|0|
NERVON|500 mcg|0|621|5|13|3|0|
NICOGET|10 mg|0|672|3|13|3|0|
NICOGET|20 mg|0|672|3|13|3|0|
NIMIXA|200 mg|0|781|0|13|3|0|
NIMIXA|550 mg|0|781|0|13|3|0|
NORPLAT|150 mg|0|299|3|13|3|0|
NORPLAT|300 mg|0|299|3|13|3|0|
NORPLAT S|75 mg / 75 mg|0|122|3|13|3|0|
NYSA|20 mg|0|736|1|13|3|0|
OPTRA|0.25 mg/ml|6|548|12|13|3|0|
OPTRA HFA|20 mcg|6|548|12|13|3|0|
ORLIFIT|60 mg|1|695|15|13|3|0|
ORLIFIT|120 mg|1|695|15|13|3|0|
PANSLAY|50 mg|0|356|1|13|3|0|
PANSLAY|75 mg|0|356|1|13|3|0|
PRISA|5 mg|0|748|3|13|3|0|
PRISA|10 mg|0|748|3|13|3|0|
PROMTO|10 mg|0|772|2|13|3|0|
PROMTO|20 mg|0|772|2|13|3|0|
RAMY PLUS|12.5 mg / 5 mg|0|520|3|13|3|0|
RAMY PLUS|25 mg / 5 mg|0|520|3|13|3|0|
RAMY PLUS|12.5 mg / 2.5 mg|0|520|3|13|3|0|
RAVAGET|10 mg|0|580|15|13|3|0|
RAVAGET|20 mg|0|580|15|13|3|0|
RAVAGET|100 mg|0|580|15|13|3|0|
RAZIN ER|1 g|0|776|3|13|3|0|
REGASTA|50 mg|0|561|2|13|3|0|
REPAG|0.5 mg|0|777|9|13|3|0|
REPAG|1 mg|0|777|9|13|3|0|
REPAG|2 mg|0|777|9|13|3|0|
REVENTA|10 mg|0|16|15|13|3|0|
REVENTA|70 mg|0|16|15|13|3|0|
RINCIT||0|584|4|13|3|0|
SALBO HFA||6|9|12|13|3|0|
SCIPRIDE|25 mg|0|587|2|13|3|0|
SCIPRIDE|50 mg|0|587|2|13|3|0|
SCIPRIDE|100 mg|0|587|2|13|3|0|
SESO|8 mg|0|155|11|13|3|0|
SESO|16 mg|0|155|11|13|3|0|
SIMVOGET||0|804|3|13|3|0|
SKIREN|150 mg|0|20|3|13|3|0|
SKIREN|300 mg|0|20|3|13|3|0|
SKIREN PLUS|150 mg / 12.5 mg|0|21|3|13|3|0|
SKIREN PLUS|300 mg / 25 mg|0|21|3|13|3|0|
SKIREN PLUS|150 mg / 25 mg|0|21|3|13|3|0|
SKIREN PLUS|300 mg / 12.5 mg|0|21|3|13|3|0|
SOLIFEN|5 mg|0|815|15|13|3|0|
SOLIFEN|10 mg|0|815|15|13|3|0|
STARCOX|60 mg|0|424|1|13|3|0|
TAMSOLIN|0.4 mg|1|828|15|13|3|0|
TREVIAMET|500 mg / 50 mg|0|631|9|13|3|0|
TREVIAMET|1 g / 50 mg|0|631|9|13|3|0|
TRUPRIL|5 mg|0|593|3|13|3|0|
TRUPRIL|10 mg|0|593|3|13|3|0|
VALTA|30 mg|0|646|10|13|3|0|
VANIT|300 mg|0|342|1|13|3|0|
VANIT|400 mg|0|342|1|13|3|0|
XALTIDE|50 mcg/actu / 100 mcg/actu|6|10|12|13|3|0|
XICARD|3.125 mg|0|240|3|13|3|0|
ZAFON FAST|8 mg|0|601|1|13|3|0|
ZAFON RAPID|8 mg|0|601|1|13|3|0|
ZAVGET|10 mg|0|411|10|13|3|0|
ZOLID PLUS|500 mg / 15 mg|0|629|9|13|3|0|
ZOLID PLUS|850 mg / 15 mg|0|629|9|13|3|0|
ZOLIGET|1 mg / 15 mg|0|496|9|13|3|0|
ZOLIGET|2 mg / 15 mg|0|496|9|13|3|0|
ZOLIGET|2 mg / 30 mg|0|496|9|13|3|0|
ZOLIGET|4 mg / 15 mg|0|496|9|13|3|0|
ZOLIGET|4 mg / 30 mg|0|496|9|13|3|0|
ZURIG|40 mg|0|432|15|13|3|0|
ZURIG|80 mg|0|432|15|13|3|0|
ACUPAN|30 mg|0|666|1|30|3|0|
ADRONIL|150 mg|0|537|15|30|3|0|
ALAR|20 mg / 120 mg|0|74|8|30|3|0|
ALAR PLUS|40 mg / 240 mg|0|74|8|30|3|0|
ALDACTAZIDE|50 mg / 50 mg|0|521|3|30|3|0|
ALDACTAZIDE|25 mg / 25 mg|0|521|3|30|3|0|
ALDACTONE|100 mg|0|818|3|30|3|0|
ALPROX|0.5 mg|0|25|10|30|3|0|
AMLODIP|5 mg|0|46|3|30|3|0|
AMLODIP|10 mg|0|46|3|30|3|0|
ANZO|20 mg|1|691|2|30|3|0|
ANZO|40 mg|1|691|2|30|3|0|
AQUIN|200 mg|0|486|0|30|3|0|
AQUIN|400 mg|0|486|0|30|3|0|
ARTHICARE|400 mg / 500 mg|0|273|15|30|3|0|
ASCOREL|5 mg|0|748|3|30|3|0|
ASCOREL|10 mg|0|748|3|30|3|0|
ATHENIL|10 mg|0|804|3|30|3|0|
ATHENIL|20 mg|0|804|3|30|3|0|
ATHENIL|40 mg|0|804|3|30|3|0|
BAKAGESIC|35 mg / 450 mg|0|697|1|30|3|0|
BONFIT|10 mg|0|16|15|30|3|0|
BONFIT|70 mg|0|16|15|30|3|0|
BYSCARD|2.5 mg|0|665|3|30|3|0|
BYSCARD|5 mg|0|665|3|30|3|0|
BYSCARD|10 mg|0|665|3|30|3|0|
CALAN|40 mg|0|876|3|30|3|0|
CALAN|80 mg|0|876|3|30|3|0|
CALAN|240 mg|1|876|3|30|3|0|
CARBASAN|200 mg|0|228|10|30|3|0|
CARBASAN|400 mg|0|228|10|30|3|0|
CLARIZA|250 mg|0|288|0|30|3|0|
CLARIZA|500 mg|0|288|0|30|3|0|
CLARIZA BD|500 mg|0|288|0|30|3|0|
CLARIZA OD XL|500 mg|0|288|0|30|3|0|
CLARIZA XL|500 mg|0|288|0|30|3|0|
CO-EXTOR|5 mg / 12.5 mg / 160 mg|0|50|3|30|3|0|
CO-EXTOR|5 mg / 25 mg / 160 mg|0|50|3|30|3|0|
CO-EXTOR|10 mg / 12.5 mg / 160 mg|0|50|3|30|3|0|
CO-OLESTA|12.5 mg / 20 mg|0|519|3|30|3|0|
CO-OLESTA|12.5 mg / 40 mg|0|519|3|30|3|0|
COLRIL|4 mg|1|849|1|30|3|0|
COXALOL|50 mg|0|124|3|30|3|0|
COXALOL|100 mg|0|124|3|30|3|0|
CYTOTEC|200 mcg|0|647|13|30|3|0|
DANOCRINE|100 mg|1|328|13|30|3|0|
DANOCRINE|200 mg|1|328|13|30|3|0|
DECLAM|50 mg|0|355|1|30|3|0|
DECLAM|75 mg|0|355|1|30|3|0|
DEUCEF|250 mg|1|241|0|30|3|0|
DEUCEF|500 mg|1|241|0|30|3|0|
DEUCEF|125 mg/5ml|2|241|0|30|3|0|
DEUCEF|250 mg/5ml|2|241|0|30|3|0|
DEUCEF|50 mg/ml|3|241|0|30|3|0|
DIAZINC|20 mg/5ml|2|885|5|30|3|0|
DUOGAB|100 mg|1|484|10|30|3|0|
DUOGAB|300 mg|1|484|10|30|3|0|
DUOGAB|400 mg|1|484|10|30|3|0|
EPILIM CHRONO|500 mg|0|814|10|30|3|0|
EXTOR|5 mg / 80 mg|0|54|3|30|3|0|
EXTOR|5 mg / 160 mg|0|54|3|30|3|0|
EXTOR|10 mg / 160 mg|0|54|3|30|3|0|
EZEBRIX|10 mg|0|428|3|30|3|0|
EZIUM|20 mg|1|412|2|30|3|0|
EZIUM|40 mg|1|412|2|30|3|0|
FENOGAL|200 mg|1|434|3|30|3|0|
FILMACID FORTE|300 mg/5ml / 150 mg/5ml / 125 mg/5ml|2|32|2|30|3|0|
FILMACID-M|300 mg/5ml / 150 mg/5ml / 125 mg/5ml|2|32|2|30|3|0|
FORTAGESIC|500 mg / 15 mg|0|708|1|30|3|0|
FORTECIN|125 mg/5ml / 31.25 mg/5ml|2|65|0|30|3|0|
FORTECIN|250 mg/5ml / 62.5 mg/5ml|2|65|0|30|3|0|
FORTECIN|250 mg / 125 mg|0|65|0|30|3|0|
FORTECIN|500 mg / 125 mg|0|65|0|30|3|0|
FORTECIN|875 mg / 125 mg|0|65|0|30|3|0|
GEMGLOW|320 mg|0|488|0|30|3|0|
GLIBOMET|2.5 mg / 400 mg|0|492|9|30|3|0|
GLITOS|15 mg|0|731|9|30|3|0|
GLITOS|30 mg|0|731|9|30|3|0|
GLITOS|45 mg|0|731|9|30|3|0|
GLITOS PLUS|500 mg / 15 mg|0|629|9|30|3|0|
GLITOS PLUS|850 mg / 15 mg|0|629|9|30|3|0|
IPCOM||2|552|5|30|3|0|
IPCOM|100 mg|0|552|5|30|3|0|
JENTIN MET|500 mg / 50 mg|0|631|9|30|3|0|
JENTIN MET|1 g / 50 mg|0|631|9|30|3|0|
LAMNET|5 mg|0|577|10|30|3|0|
LAMNET|25 mg|0|577|10|30|3|0|
LAMNET|50 mg|0|577|10|30|3|0|
LAMNET|100 mg|0|577|10|30|3|0|
LEVOXIN|250 mg|0|585|0|30|3|0|
LEVOXIN|500 mg|0|585|0|30|3|0|
LEVOXIN|750 mg|0|585|0|30|3|0|
LIPILOW|10 mg|0|127|3|30|3|0|
LIPILOW|20 mg|0|127|3|30|3|0|
LIPILOW|40 mg|0|127|3|30|3|0|
LOMOTIL|25 mcg / 2.5 mg|0|131|2|30|3|0|
LUMARK|250 mg|0|582|10|30|3|0|
LUMARK|500 mg|0|582|10|30|3|0|
LUMARK|750 mg|0|582|10|30|3|0|
LUMARK|1 g|0|582|10|30|3|0|
LUMARK|100 mg/ml|2|582|10|30|3|0|
LUXAVE|3.35 g/5ml|2|576|2|30|3|0|
MAXAQUIN|200 mg|0|596|0|30|3|0|
MAXAQUIN|400 mg|0|596|0|30|3|0|
MAXLOX|400 mg|0|651|0|30|3|0|
MEMOMAX|1.5 mg|1|785|10|30|3|0|
MEMOMAX|3 mg|1|785|10|30|3|0|
MEMOMAX|6 mg|1|785|10|30|3|0|
METODINE|200 mg/5ml / 200 mg/5ml|2|351|8|30|3|0|
METODINE|325 mg / 250 mg|0|351|8|30|3|0|
MEXIDON|100 mg|0|678|1|30|3|0|
MICROSER|8 mg|0|155|11|30|3|0|
MOBIFEN|200 mg|1|566|1|30|3|0|
MUSCORIL|4 mg|1|839|1|30|3|0|
NEGRAM|1 g|0|659|0|30|3|0|
NEGRAM|500 mg|0|659|0|30|3|0|
NEGRAM|250 mg/5ml|2|659|0|30|3|0|
NEZOLID|600 mg|0|592|0|30|3|0|
NEZOLID|100 mg|2|592|0|30|3|0|
NORFLEX|100 mg|0|696|1|30|3|0|
NORGESIC|35 mg / 450 mg|0|697|1|30|3|0|
NORPACE|100 mg|1|375|3|30|3|0|
NUBEROL PLUS|60 mg / 35 mg / 450 mg|0|198|1|30|3|0|
NUELIN-SA|300 mg|0|837|12|30|3|0|
OLESTA|20 mg|0|689|3|30|3|0|
OLESTA|40 mg|0|689|3|30|3|0|
OMEPRAZAL|20 mg|1|691|2|30|3|0|
OMEPRAZAL|40 mg|1|691|2|30|3|0|
OMIXIM|400 mg|1|245|0|30|3|0|
OMIXIM|100 mg/5ml|2|245|0|30|3|0|
OMIXIM|200 mg/5ml|2|245|0|30|3|0|
PANZIUM|20 mg|1|706|2|30|3|0|
PANZIUM|40 mg|1|706|2|30|3|0|
PROBANTHINE|15 mg|0|761|2|30|3|0|
RANCARD XR|500 mg|0|776|3|30|3|0|
RANCARD XR|1000 mg|0|776|3|30|3|0|
RELISPA FORTE|80 mg|0|386|2|30|3|0|
RESPRO|200 mg|0|837|12|30|3|0|
RESPRO|300 mg|0|837|12|30|3|0|
RHULEF|10 mg|0|580|15|30|3|0|
RHULEF|20 mg|0|580|15|30|3|0|
RIBOXIN|100 mg|0|790|0|30|3|0|
RIBOXIN|150 mg|0|790|0|30|3|0|
RIBOXIN|300 mg|0|790|0|30|3|0|
ROTEC||0|357|1|30|3|0|
SALBULIN||6|9|12|30|3|0|
SEACLOP|75 mg|0|299|3|30|3|0|
SEACLOP AP|75 mg / 75 mg|0|122|3|30|3|0|
SEACLOP AP|150 mg / 75 mg|0|122|3|30|3|0|
SELANZ|30 mg|1|578|2|30|3|0|
SEREBAL|500 mcg|0|621|5|30|3|0|
SERENACE|2 mg/ml|3|512|10|30|3|0|
SERENACE|0.25 mg|0|512|10|30|3|0|
SERENACE|1.5 mg|0|512|10|30|3|0|
SERENACE|5 mg|0|512|10|30|3|0|
SERENACE|10 mg|0|512|10|30|3|0|
SERL ALPHA|0.25 mcg|0|18|5|30|3|0|
SERL ALPHA|0.5 mcg|0|18|5|30|3|0|
SERL ALPHA|1 mcg|0|18|5|30|3|0|
SERMOL FORTE|250 mg/5ml|2|707|1|30|3|0|
SIMBEX|10 mg / 10 mg|0|429|3|30|3|0|
SIMBEX|10 mg / 20 mg|0|429|3|30|3|0|
SIMBEX|10 mg / 40 mg|0|429|3|30|3|0|
SOLIAN|50 mg|0|44|10|30|3|0|
SOLIAN|200 mg|0|44|10|30|3|0|
SPIROMIDE-40|40 mg / 50 mg|0|479|3|30|3|0|
SUPRACOMBIN|200 mg/5ml / 40 mg/5ml|2|824|0|30|3|0|
SUPRACOMBIN|400 mg / 80 mg|0|824|0|30|3|0|
SUPRACOMBIN FORTE|800 mg / 160 mg|0|824|0|30|3|0|
SURLKA|1 g/5ml|2|819|2|30|3|0|
SUSCARD BUCCAL|2 mg|0|504|3|30|3|0|
SUSCARD BUCCAL|5 mg|0|504|3|30|3|0|
SUSTAC|2.6 mg|0|504|3|30|3|0|
SUSTAC|6.4 mg|0|504|3|30|3|0|
TAMBOCOR|50 mg|0|447|3|30|3|0|
TARCIT|10 mg|0|252|4|30|3|0|
TARCIT|10 mg|1|252|4|30|3|0|
TICLID|250 mg|0|844|3|30|3|0|
TRAMAL PLUS|325 mg / 37.5 mg|0|712|1|30|3|0|
TRANXENE|5 mg|1|300|10|30|3|0|
TRANXENE|10 mg|1|300|10|30|3|0|
TRANXENE|15 mg|1|300|10|30|3|0|
URIPAS|2 mg|0|382|15|30|3|0|
URIPAS|4 mg|0|382|15|30|3|0|
VAPTOR|5 mg|0|788|3|30|3|0|
VAPTOR|10 mg|0|788|3|30|3|0|
VAPTOR|20 mg|0|788|3|30|3|0|
VENTEK|4 mg|0|649|12|30|3|0|
VENTEK|5 mg|0|649|12|30|3|0|
VENTEK|10 mg|0|649|12|30|3|0|
VICKS INHALER|41.54% / 41.54% / 12.27%|6|222|7|30|3|0|
VICKS VAPORUB|5.26% w/w / 1.33% w/w / 2.82% w/w / 0.09% w/w|4|221|7|30|3|0|
VITRUM||0|654|5|30|3|0|
XADINE|60 mg|0|443|4|30|3|0|
XADINE|120 mg|0|443|4|30|3|0|
XADINE|180 mg|0|443|4|30|3|0|
XADINE PLUS||0|444|4|30|3|0|
XAROBAN|10 mg|0|784|3|30|3|0|
ZEEMOX FORTE|250 mg/5ml|2|64|0|30|3|0|
ZENBAR|20 mg|1|388|10|30|3|0|
ZENBAR|30 mg|1|388|10|30|3|0|
ZENBAR|60 mg|1|388|10|30|3|0|
ZYGREL|250 mg|1|134|0|30|3|0|
ZYGREL|500 mg|1|134|0|30|3|0|
ZYGREL|200 mg/5ml|2|134|0|30|3|0|
ACEDONIL|150 mg|0|775|2|14|4|0|
ALENDRATE|10 mg|0|16|15|14|4|0|
ALENDRATE|70 mg|0|16|15|14|4|0|
ALERGOCIT|5 mg|0|584|4|14|4|0|
ALORAM|0.25 mg|0|25|10|14|4|0|
ALORAM|0.5 mg|0|25|10|14|4|0|
ALORAM|1 mg|0|25|10|14|4|0|
ALORAM|2 mg|0|25|10|14|4|0|
ALZIRID|10 mg|0|626|10|14|4|0|
AMTORIN|5 mg / 10 mg|0|47|3|14|4|0|
AMTORIN|5 mg / 20 mg|0|47|3|14|4|0|
AMTORIN PLUS|10 mg / 10 mg|0|47|3|14|4|0|
ANZONIL|3 mg|0|181|10|14|4|0|
APTIZOLE|40 mg|0|706|2|14|4|0|
AROXE|150 mg|0|790|0|14|4|0|
AROZINE||0|252|4|14|4|0|
ARTILIDE|100 mg|0|678|1|14|4|0|
ARTINIL|0.1% w/v|3|356|11|14|4|0|
ARTINIL-K|1% w/w|4|356|1|14|4|0|
ARTINIL-K|50 mg|0|355|1|14|4|0|
ARTINIL-K|75 mg|0|355|1|14|4|0|
ARTINIL-K|100 mg|0|355|1|14|4|0|
ARTINIL-K TOPICAL|1% w/w|4|356|1|14|4|0|
ATRIDOL|25 mcg / 2.5 mg|0|131|2|14|4|0|
BALANTA||2|32|2|14|4|0|
BESALIC|0.64% w/w|4|156|6|14|4|0|
BESTOXIL|500 mg|1|242|0|14|4|0|
BONISH|150 mg|0|537|15|14|4|0|
CALCIFEROL|400 IU|3|270|5|14|4|0|
CAMFLEX|8 mg|0|601|1|14|4|0|
CEFOCURE|250 mg|1|250|0|14|4|0|
CEFOCURE|500 mg|1|250|0|14|4|0|
CEFOCURE|125 mg/5ml|2|250|0|14|4|0|
CEFOCURE|250 mg/5ml|2|250|0|14|4|0|
CEROXIL|125 mg/5ml|2|242|0|14|4|0|
CEROXIL|250 mg/5ml|2|242|0|14|4|0|
CIALOX|500 mg|0|280|0|14|4|0|
CITOLIN|500 mg|0|284|10|14|4|0|
CITOLIN|500 mg/5ml|2|284|10|14|4|0|
CITOPRAM TABLET|10 mg|0|283|10|14|4|0|
CITOPRAM TABLET|20 mg|0|283|10|14|4|0|
CITOPRAM TABLET|40 mg|0|283|10|14|4|0|
CLARABAC|250 mg|0|288|0|14|4|0|
CLARABAC|500 mg|0|288|0|14|4|0|
CLARABAC|125 mg|2|288|0|14|4|0|
CLAVOPIN|125 mg / 31.25 mg|2|65|0|14|4|0|
CLAVOPIN|250 mg / 62.5 mg|2|65|0|14|4|0|
CLAVOPIN|250 mg / 125 mg|0|65|0|14|4|0|
CLAVOPIN|500 mg / 125 mg|0|65|0|14|4|0|
CLINEX|100 mg|7|301|13|14|4|0|
CLOPIRINE|75 mg / 75 mg|0|122|3|14|4|0|
CO TELMAS|12.5 mg / 40 mg|0|522|3|14|4|0|
CO TELMAS|12.5 mg / 80 mg|0|522|3|14|4|0|
COX-2|100 mg|0|678|1|14|4|0|
COXYZIN|10 mg|0|252|4|14|4|0|
CYCOLUNCT-N|5 mg|0|683|13|14|4|0|
CYCONIL|20 mg|1|461|10|14|4|0|
DANVERIN|135 mg|0|616|2|14|4|0|
DELSYM|5 mg/5ml / 15 mg/5ml|2|348|7|14|4|0|
DEROXAT CR|12.5 mg|0|715|10|14|4|0|
DEROXAT CR|25 mg|0|715|10|14|4|0|
DEROXAT CR|37.5 mg|0|715|10|14|4|0|
DICLOVIS K|75 mg|0|355|1|14|4|0|
DICON EYE DROPS|0.1% w/v / 0.3% w/v|3|341|11|14|4|0|
DICON-N|0.1% w/v / 0.35% w/v|3|339|11|14|4|0|
DIGITEK|250 mcg|0|363|3|14|4|0|
DIGOXIN|250 mcg|0|363|3|14|4|0|
DIMETRO|125 mg/5ml / 100 mg/5ml|2|365|8|14|4|0|
DONARIN|20 mg / 15 mg|0|279|2|14|4|0|
DOUDCER-NIL||1|578|2|14|4|0|
DOXICAP|100 mg|1|384|0|14|4|0|
DULPRO|100 mg|0|464|1|14|4|0|
DURON|20 mg|1|388|10|14|4|0|
DURON|30 mg|1|388|10|14|4|0|
DURON|60 mg|1|388|10|14|4|0|
EPPRA|250 mg|0|582|10|14|4|0|
EPPRA|500 mg|0|582|10|14|4|0|
ESMAZOLE|20 mg|0|412|2|14|4|0|
ESMAZOLE|40 mg|0|412|2|14|4|0|
ESOLEX|10 mg|3|411|10|14|4|0|
ESOLEX|5 mg|0|411|10|14|4|0|
ESOLEX|10 mg|0|411|10|14|4|0|
ESOPEP|20 mg|1|412|2|14|4|0|
ESOPEP|40 mg|1|412|2|14|4|0|
ESTROMAIN|0.625 mg|0|417|13|14|4|0|
ESTROMAIN|1.25 mg|0|417|13|14|4|0|
FADIPHINE|10 mg/5ml|2|431|2|14|4|0|
FADIPHINE|20 mg|0|431|2|14|4|0|
FADIPHINE|40 mg|0|431|2|14|4|0|
FALCITRIN|15 mg/5ml / 90 mg/5ml|2|74|8|14|4|0|
FALCITRIN|20 mg / 120 mg|0|74|8|14|4|0|
FALCITRIN OD|80 mg / 480 mg|0|74|8|14|4|0|
FALCITRIN PLUS|40 mg / 240 mg|0|74|8|14|4|0|
FEMOCAL||5|99|5|14|4|0|
FEMOCAL PLUS||5|101|5|14|4|0|
FENADEX|60 mg|0|443|4|14|4|0|
FENADEX|120 mg|0|443|4|14|4|0|
FENADEX|180 mg|0|443|4|14|4|0|
FERICARD|1 mg|0|880|3|14|4|0|
FERICARD|5 mg|0|880|3|14|4|0|
FEROMALT|100 mg|0|555|5|14|4|0|
FEROMALT|50 mg/5ml|2|555|5|14|4|0|
FEROVIS|200 mg|0|438|5|14|4|0|
FLEXERIL|100 mg/5ml|2|245|0|14|4|0|
FLEXERIL|200 mg/5ml|2|245|0|14|4|0|
FLEXERIL|400 mg|1|245|0|14|4|0|
FLOMIN|50 mg|0|468|10|14|4|0|
FLOMIN|100 mg|0|468|10|14|4|0|
FLOXIMED|250 mg|1|585|0|14|4|0|
FLOXIMED|500 mg|1|585|0|14|4|0|
FUNGICURE|150 mg|1|450|6|14|4|0|
G-LAC|3.35 g/5ml|2|576|2|14|4|0|
G-PAN PLUS|10 mg / 500 mg|0|535|1|14|4|0|
G-PLEX|800 mg/15ml|2|554|5|14|4|0|
G-SAC|5 mg|0|46|3|14|4|0|
GERDIN|40 mg|0|431|2|14|4|0|
GL|35 mg|0|696|1|14|4|0|
GL|35 mg / 450 mg|0|697|1|14|4|0|
GLACT|40 mg / 240 mg|0|74|8|14|4|0|
GLACT|80 mg / 480 mg|0|74|8|14|4|0|
GLOBODRIN|30 mg|0|401|7|14|4|0|
GLOCAND|16 mg|0|223|3|14|4|0|
GLOMET|1 mg|0|494|9|14|4|0|
GLOPROFIN||4|538|1|14|4|0|
GLORAL|35 mg / 400 mg|0|697|1|14|4|0|
GLORAL|35 mg / 450 mg|0|697|1|14|4|0|
GLORAL|50 mg / 650 mg|0|697|1|14|4|0|
GLORID|50 mg|0|561|2|14|4|0|
GLORIN|75 mg|0|120|3|14|4|0|
GLORIN|150 mg|0|120|3|14|4|0|
GLOVERINE|135 mg|0|616|2|14|4|0|
GLOXIL|250 mg|1|64|0|14|4|0|
GLOXIL|500 mg|1|64|0|14|4|0|
GLOXIL|125 mg|2|64|0|14|4|0|
GLOXIL|250 mg/5ml|2|64|0|14|4|0|
GLUCOLYTE||5|502|14|14|4|0|
GRANITON|1 mg|0|508|2|14|4|0|
GUTT|1 mg|0|278|2|14|4|0|
GYNONIL|0.3 mg / 5 mg|0|635|13|14|4|0|
INFLANIL FORTE|500 mg|0|623|1|14|4|0|
KALARIDE|40 mEq/5ml|2|741|14|14|4|0|
KETOLERG|0.69 mg/ml|3|567|11|14|4|0|
LAPRAVIS|30 mg|1|578|2|14|4|0|
LEVANIC|250 mg|0|585|0|14|4|0|
LEVANIC|500 mg|0|585|0|14|4|0|
LEVANIC|750 mg|0|585|0|14|4|0|
LEVANIC|125 mg/5ml|2|585|0|14|4|0|
LEVANIC|250 mg/5ml|2|585|0|14|4|0|
LEVAQ|125 mg|2|585|0|14|4|0|
LEVAQ|250 mg|2|585|0|14|4|0|
LEVAQ|250 mg|0|585|0|14|4|0|
LEVAQ|500 mg|0|585|0|14|4|0|
LEVOLOL|0.5% w/v|3|583|11|14|4|0|
LEVOMAY|250 mg|0|585|0|14|4|0|
LEVOMAY|500 mg|0|585|0|14|4|0|
LEVOVIS|250 mg|0|585|0|14|4|0|
LEVOVIS|500 mg|0|585|0|14|4|0|
LEVOZINE|5 mg|0|584|4|14|4|0|
LINZY|600 mg|0|592|0|14|4|0|
LOHIMALT|50 mg/5ml|2|552|5|14|4|0|
LUBRI|1.4% w/v|3|739|11|14|4|0|
LUBRI PLUS|1.4% w/v / 0.6% w/v|3|740|11|14|4|0|
LUMETRIN|20 mg / 120 mg|0|74|8|14|4|0|
LUMITRIN|20 mg / 120 mg|0|74|8|14|4|0|
MACROMYD|250 mg|1|134|0|14|4|0|
MALARIUM|250 mg|0|624|8|14|4|0|
MALAVIS|25 mg / 500 mg|0|768|8|14|4|0|
MALAVIS|25 mg/5ml / 500 mg/5ml|2|768|8|14|4|0|
MAXOPHINE|100 mg/5ml|2|245|0|14|4|0|
MAXOPHINE|200 mg/5ml|2|245|0|14|4|0|
MAXOPHINE|200 mg|1|245|0|14|4|0|
MAXOPHINE|400 mg|1|245|0|14|4|0|
MAZINE||4|801|6|14|4|0|
MECOMAX|500 mcg|1|621|5|14|4|0|
MECOMED|500 mcg|0|621|5|14|4|0|
MECOVIS|500 mcg|0|621|5|14|4|0|
MEDICIP|200 mg|0|280|0|14|4|0|
MEDICIP|500 mg|0|280|0|14|4|0|
MEDICLOP|10 mg|0|638|2|14|4|0|
METHOLON|0.1% w/v|3|454|11|14|4|0|
METHOLON FORTE|0.25% w/v|3|454|11|14|4|0|
METHOLON-N|0.1% w/v / 0.3% w/v|3|457|11|14|4|0|
MEZOLE|250 mg / 200 mg|0|365|8|14|4|0|
MEZOLE DS|500 mg / 400 mg|0|365|8|14|4|0|
MIRPINE|30 mg|0|646|10|14|4|0|
MISO|200 mcg|0|647|13|14|4|0|
MISO PLUS|50 mg / 0.2 mg|0|357|1|14|4|0|
MIZAM|7.5 mg|0|643|10|14|4|0|
MOBBIX|7.5 mg|0|625|1|14|4|0|
MOBBIX|15 mg|0|625|1|14|4|0|
MOBICAM|20 mg|1|735|1|14|4|0|
MOBICAM|0.5% w/w|4|735|1|14|4|0|
MOBICAMT||4|735|1|14|4|0|
MONTELO CHEWABLE|4 mg|0|649|12|14|4|0|
MORAX|400 mg|0|585|0|14|4|0|
MYNO|100 mg|0|645|0|14|4|0|
MYVIT-A|400 IU/ml / 1500 IU/ml|3|271|5|14|4|0|
NAFCIN|125 mg/5ml|2|280|0|14|4|0|
NAFCIN|250 mg/5ml|2|280|0|14|4|0|
NAFCIN|250 mg|0|280|0|14|4|0|
NAFCIN|500 mg|0|280|0|14|4|0|
NAFCIN|750 mg|0|280|0|14|4|0|
NAFCIN|0.3% w/v|3|280|11|14|4|0|
NAPLEX|500 mg|0|663|1|14|4|0|
NASCOL|12.5 mg/5ml / 30 mg/5ml|2|721|7|14|4|0|
ALPAX|0.25 mg|0|25|10|9|4|0|
ALPAX|0.5 mg|0|25|10|9|4|0|
ANGIOTAN|80 mg|0|873|3|9|4|0|
ANGIOTAN|160 mg|0|873|3|9|4|0|
ANGIOTAN H|25 mg / 160 mg|0|524|3|9|4|0|
ARTEDOXIN||0|76|8|9|4|0|
ARTEDOXIN P||0|76|8|9|4|0|
ASILEZ|150 mg|0|20|3|9|4|0|
ASILEZ|300 mg|0|20|3|9|4|0|
BRECARE|5 mg|0|649|12|9|4|0|
BRECARE|10 mg|0|649|12|9|4|0|
CALZEM|30 mg|0|366|3|9|4|0|
CALZEM|60 mg|0|366|3|9|4|0|
CAPRIL|12.5 mg|0|226|3|9|4|0|
CAPRIL|25 mg|0|226|3|9|4|0|
CAPRIL|50 mg|0|226|3|9|4|0|
CORBIS|2.5 mg|0|176|3|9|4|0|
CORBIS|5 mg|0|176|3|9|4|0|
CORBIS|10 mg|0|176|3|9|4|0|
CORBIS-H||0|177|3|9|4|0|
DECLOT|75 mg|0|299|3|9|4|0|
DELAWARE|3.125 mg|0|240|3|9|4|0|
DELAWARE|6.25 mg|0|240|3|9|4|0|
DELAWARE|12.5 mg|0|240|3|9|4|0|
DELAWARE|25 mg|0|240|3|9|4|0|
DESLET|2.5 mg/5ml|2|329|4|9|4|0|
DIAZEPAM|2 mg|0|353|10|9|4|0|
DIAZEPAM|5 mg|0|353|10|9|4|0|
DINEMIC|20 mg|0|865|3|9|4|0|
ECIN|250 mg|0|407|0|9|4|0|
EFOME|20 mg|1|691|2|9|4|0|
EFRODOL||0|197|1|9|4|0|
EFROQUINE|250 mg|0|258|8|9|4|0|
EFROZOLE|20 mg|1|412|2|9|4|0|
EFROZOLE|40 mg|1|412|2|9|4|0|
EFTRAN|400 mg / 80 mg|0|824|0|9|4|0|
EFTRAN DS|800 mg / 160 mg|0|824|0|9|4|0|
EMOD|2 mg|1|597|2|9|4|0|
ERIZOLE|100 mg/5ml|2|615|8|9|4|0|
ERIZOLE|100 mg|0|615|8|9|4|0|
ERIZOLE|500 mg|0|615|8|9|4|0|
EZ-FLOW||2|576|2|9|4|0|
FAMITINE|20 mg|0|431|2|9|4|0|
FAMITINE|40 mg|0|431|2|9|4|0|
FAMTINE|20 mg|0|431|2|9|4|0|
FAMTINE|40 mg|0|431|2|9|4|0|
FEBORIC|40 mg|0|432|15|9|4|0|
FEBORIC|80 mg|0|432|15|9|4|0|
FEMIROZ|10 mg / 10 mg|0|385|13|9|4|0|
FLOXER|250 mg|0|585|0|9|4|0|
FLOXER|500 mg|0|585|0|9|4|0|
FOSFOMYCIN|250 mg|2|476|0|9|4|0|
GASTROLON|10 mg|0|638|2|9|4|0|
GLICON|5 mg|0|491|9|9|4|0|
GLYPER|1 mg|0|494|9|9|4|0|
GLYPER|2 mg|0|494|9|9|4|0|
GLYPER|3 mg|0|494|9|9|4|0|
GLYPER|4 mg|0|494|9|9|4|0|
GYNAECOSID|0.3 mg / 5 mg|0|635|13|9|4|0|
ISDIN|10 mg|0|557|3|9|4|0|
ISOTAB|20 mg|0|558|3|9|4|0|
ISOTAB|40 mg|0|558|3|9|4|0|
ISOTAB-XR|60 mg|0|558|3|9|4|0|
KLABID|125 mg/5ml|2|288|0|9|4|0|
KLABID|250 mg|0|288|0|9|4|0|
KLABID|500 mg|0|288|0|9|4|0|
KONTAB|50 mg / 1 mg|0|182|15|9|4|0|
LIPOCOR|200 mg|0|165|3|9|4|0|
LIPOTRIM|10 mg|0|127|3|9|4|0|
LIPOTRIM|20 mg|0|127|3|9|4|0|
LIPOTRIM|40 mg|0|127|3|9|4|0|
LOSAAN|50 mg|0|603|3|9|4|0|
LOSAAN-H|12.5 mg / 50 mg|0|518|3|9|4|0|
MALADAR|25 mg/5ml / 500 mg/5ml|2|768|8|9|4|0|
MALADAR|25 mg / 500 mg|0|768|8|9|4|0|
MEFNAC|50 mg/5ml|2|623|1|9|4|0|
MEFNAC|250 mg|0|623|1|9|4|0|
MEFNAC|500 mg|0|623|1|9|4|0|
METCON|2.5 mg / 500 mg|0|492|9|9|4|0|
METCON PLUS|5 mg / 500 mg|0|492|9|9|4|0|
METPHAGE|500 mg|0|628|9|9|4|0|
METPHAGE|850 mg|0|628|9|9|4|0|
METZON|500 mg / 15 mg|0|629|9|9|4|0|
MONTEF|4 mg|0|649|12|9|4|0|
MONTEF|5 mg|0|649|12|9|4|0|
MONTEF|10 mg|0|649|12|9|4|0|
MONTEF|4 mg|5|649|12|9|4|0|
NEOLIP|10 mg|0|804|3|9|4|0|
NEOLIP|20 mg|0|804|3|9|4|0|
NOMIN|50 mg|0|124|3|9|4|0|
NOMIN|100 mg|0|124|3|9|4|0|
OMEFAST|20 mg / 1100 mg|1|692|2|9|4|0|
OMEFAST PLUS||0|692|2|9|4|0|
PANARAM|120 mg/5ml|2|707|1|9|4|0|
PANARAM|500 mg|0|707|1|9|4|0|
PANGO|200 mg|0|538|1|9|4|0|
PANGO|400 mg|0|538|1|9|4|0|
REDUCE ACHE|200 mg / 30 mg|0|540|7|9|4|0|
REDUCE ACHE FORTE|400 mg / 60 mg|0|540|7|9|4|0|
ROXIN|250 mg|0|280|0|9|4|0|
ROXIN|500 mg|0|280|0|9|4|0|
SELOXX|100 mg|1|249|1|9|4|0|
SELOXX|200 mg|1|249|1|9|4|0|
SEMI GLICON|2.5 mg|0|491|9|9|4|0|
SEMI METCON|1.25 mg / 250 mg|0|492|9|9|4|0|
SIAM||2|32|2|9|4|0|
SIAM||0|32|2|9|4|0|
SOLICON|5 mg|0|815|15|9|4|0|
SOLICON|10 mg|0|815|15|9|4|0|
TOPMATE|25 mg|0|853|10|9|4|0|
TOPMATE|50 mg|0|853|10|9|4|0|
TRAMAPAR||0|712|1|9|4|0|
TRISIL|250 mg / 500 mg|0|33|2|9|4|0|
TRIZYMAL|150 mg|0|705|2|9|4|0|
ZETRINE|10 mg|0|252|4|9|4|0|
ZETRINE|5 mg/5ml|2|252|4|9|4|0|
ADALIN||2|41|7|20|4|0|
ADYTUM|1.25 mg|0|774|3|20|4|0|
ADYTUM|2.5 mg|0|774|3|20|4|0|
ADYTUM|5 mg|0|774|3|20|4|0|
ADYTUM-H|12.5 mg / 2.5 mg|0|520|3|20|4|0|
ALENOR|2.5 mg/5ml|2|329|4|20|4|0|
ALENOR|5 mg|0|329|4|20|4|0|
ALENOR REDITAB|2.5 mg|0|329|4|20|4|0|
ALENOR REDITAB|5 mg|0|329|4|20|4|0|
ANGIZEM|30 mg|0|366|3|20|4|0|
ANGIZEM|60 mg|0|366|3|20|4|0|
ASCOGIN|300 mg / 200 mg|0|123|1|20|4|0|
ATIZOR|250 mg|0|134|0|20|4|0|
ATIZOR|500 mg|0|134|0|20|4|0|
ATIZOX|100 mg/5ml|2|681|8|20|4|0|
BISMOL|88 mg/5ml|2|175|2|20|4|0|
BISMOL|265 mg|0|175|2|20|4|0|
CADLA|0.5 mcg|0|18|5|20|4|0|
CALNATE|70 mg|0|16|15|20|4|0|
CARAC|8 mg|0|223|3|20|4|0|
CARAC|16 mg|0|223|3|20|4|0|
CARAC|32 mg|0|223|3|20|4|0|
CARAC-H|16 mg / 12.5 mg|0|224|3|20|4|0|
CARMINATIVE MIX (ADULTS)||2|286|2|20|4|0|
CARMINATIVE MIX (INFANT)||2|286|2|20|4|0|
CATRIL|20 mg|0|127|3|20|4|0|
CATRIL|40 mg|0|127|3|20|4|0|
CIPROQUINE|250 mg|0|280|0|20|4|0|
CIPROQUINE|500 mg|0|280|0|20|4|0|
CIPROQUINE|750 mg|0|280|0|20|4|0|
CLODRIL PLUS|75 mg / 75 mg|0|122|3|20|4|0|
CLODRIL PLUS|150 mg / 75 mg|0|122|3|20|4|0|
CO-AMOXI|250 mg / 125 mg|0|65|0|20|4|0|
CO-AMOXI|500 mg / 125 mg|0|65|0|20|4|0|
CO-AMOXI|875 mg / 125 mg|0|65|0|20|4|0|
CO-AMOXI|125 mg/5ml / 31.25 mg/5ml|2|65|0|20|4|0|
CO-AMOXI|250 mg/5ml / 62.5 mg/5ml|2|65|0|20|4|0|
COBOLMIN|500 mcg|0|621|5|20|4|0|
COSTA|100 mg/5ml|2|234|7|20|4|0|
COSTA-PRO|100 mg/5ml / 2.5 mg/5ml|2|235|7|20|4|0|
DAYPRO|600 mg|0|700|1|20|4|0|
DENTIFEN|100 mg|0|464|1|20|4|0|
DEXODINE||2|349|7|20|4|0|
DICAINE||2|31|2|20|4|0|
DIGEL||2|30|2|20|4|0|
DIMECO||2|32|2|20|4|0|
DIMECO||0|32|2|20|4|0|
DRT|40 mg|0|386|2|20|4|0|
DRT FORTE|80 mg|0|386|2|20|4|0|
ELCIT|5 mg|0|411|10|20|4|0|
ELCIT|10 mg|0|411|10|20|4|0|
ELCIT|20 mg|0|411|10|20|4|0|
ENZO|0.25 mg|0|25|10|20|4|0|
ENZO|0.5 mg|0|25|10|20|4|0|
ENZO|1 mg|0|25|10|20|4|0|
EPILEPSIN|100 mg/5ml|2|228|10|20|4|0|
EPILEPSIN|200 mg|0|228|10|20|4|0|
ESANTE|20 mg|1|412|2|20|4|0|
ESANTE|40 mg|1|412|2|20|4|0|
GENSOL|1% w/v|4|490|6|20|4|0|
GLIO|1 mg|0|494|9|20|4|0|
GLIO|2 mg|0|494|9|20|4|0|
GLIO|3 mg|0|494|9|20|4|0|
GLIO|4 mg|0|494|9|20|4|0|
GLIO-P||0|496|9|20|4|0|
HAEMATRIX|250 mg|1|857|15|20|4|0|
HART|6.25 mg|0|240|3|20|4|0|
HART|12.5 mg|0|240|3|20|4|0|
HART|25 mg|0|240|3|20|4|0|
INSPIROL||6|9|12|20|4|0|
ITOGUARD|50 mg|0|561|2|20|4|0|
KAOPECTOL|5.832 g/30ml / 0.13 g/30ml|2|564|2|20|4|0|
LOCOMIN|500 mg|1|591|0|20|4|0|
LOCRIL|75 mg|0|299|3|20|4|0|
MAC-CILLIN|250 mg|1|67|0|20|4|0|
MAC-CILLIN|500 mg|1|67|0|20|4|0|
MAC-CILLIN|125 mg/5ml|2|67|0|20|4|0|
MAC-CILLIN|250 mg/5ml|2|67|0|20|4|0|
MAC-METHER|15 mg/5ml / 90 mg/5ml|2|74|8|20|4|0|
MAC-METHER|20 mg / 120 mg|0|74|8|20|4|0|
MAC-METHER|40 mg / 240 mg|0|74|8|20|4|0|
MAC-METHER|80 mg / 480 mg|0|74|8|20|4|0|
MAC-METHER OD|80 mg / 480 mg|0|74|8|20|4|0|
MACAZID|80 mg|0|493|9|20|4|0|
MACDICOL|100 mg|1|356|1|20|4|0|
MACDICOL|50 mg|0|356|1|20|4|0|
MACLAMIDE|5 mg|0|491|9|20|4|0|
MACPROFEN|100 mg/5ml|2|538|1|20|4|0|
MACPROFEN|200 mg|0|538|1|20|4|0|
MACPROFEN|400 mg|0|538|1|20|4|0|
MACPROFEN|600 mg|0|538|1|20|4|0|
MACRADINE|250 mg|1|251|0|20|4|0|
MACRADINE|500 mg|1|251|0|20|4|0|
MACRADINE|125 mg/5ml|2|251|0|20|4|0|
MACRADINE|250 mg/5ml|2|251|0|20|4|0|
MACRALFATE|500 mg|0|819|2|20|4|0|
MACRENONE|25 mg|0|404|3|20|4|0|
MACRENONE|50 mg|0|404|3|20|4|0|
MACTICORT|250 mcg/actu|6|144|12|20|4|0|
MACTIFEN|1 mg|1|567|4|20|4|0|
MACTIFEN|1 mg/5ml|2|567|4|20|4|0|
MACTONATE|500 mg / 125 mg|0|65|0|20|4|0|
MACTONATE|875 mg / 125 mg|0|65|0|20|4|0|
MACTONATE|250 mg/5ml / 62.5 mg/5ml|2|65|0|20|4|0|
MACTRAN|400 mg / 80 mg|0|824|0|20|4|0|
MACTRAN|800 mg / 160 mg|0|824|0|20|4|0|
MACTRAN|200 mg/5ml / 40 mg/5ml|2|824|0|20|4|0|
MACTRYPSIN||0|274|15|20|4|0|
MACYLINE|408 mg|1|608|0|20|4|0|
MAXICLOX|125 mg / 125 mg|1|68|0|20|4|0|
MAXICLOX|250 mg / 125 mg|1|68|0|20|4|0|
MAXICLOX|250 mg / 250 mg|1|68|0|20|4|0|
MAXICLOX|60 mg/0.6ml / 30 mg/0.6ml|3|68|0|20|4|0|
MAXICLOX|125 mg/5ml / 125 mg/5ml|2|68|0|20|4|0|
MAXIL|250 mg|1|64|0|20|4|0|
MAXIL|500 mg|1|64|0|20|4|0|
MAXIL|125 mg/1.25ml|3|64|0|20|4|0|
MAXIL|125 mg/5ml|2|64|0|20|4|0|
MAXIL FORTE|250 mg/5ml|2|64|0|20|4|0|
MAXIMA|400 mg|1|245|0|20|4|0|
MAXIMA|100 mg/5ml|2|245|0|20|4|0|
MAXIMA|200 mg|0|245|0|20|4|0|
MCLEVO|250 mg|0|585|0|20|4|0|
MCLEVO|500 mg|0|585|0|20|4|0|
MCLEVO|750 mg|0|585|0|20|4|0|
MEADOW|60 mg|0|443|4|20|4|0|
MEADOW|120 mg|0|443|4|20|4|0|
MEADOW|180 mg|0|443|4|20|4|0|
MELAZINE|1 mg|0|862|10|20|4|0|
METHYLDOPA|250 mg|0|634|3|20|4|0|
MNTK|4 mg|0|649|12|20|4|0|
MNTK|5 mg|0|649|12|20|4|0|
MNTK|10 mg|0|649|12|20|4|0|
MOFILOX|400 mg|0|651|0|20|4|0|
NEFES|20 mg|0|882|12|20|4|0|
NEOSONE|0.1% w/w|4|156|6|20|4|0|
NICOGINA|10 mg|0|672|3|20|4|0|
NICOGINA|20 mg|0|672|3|20|4|0|
OFLAMAC|200 mg|0|686|0|20|4|0|
OMNITOR|5 mg|0|788|3|20|4|0|
OMNITOR|10 mg|0|788|3|20|4|0|
OMNITOR|20 mg|0|788|3|20|4|0|
ONDEN|4 mg|0|693|2|20|4|0|
ONDEN|8 mg|0|693|2|20|4|0|
OSTEOX|60 mg|0|773|15|20|4|0|
OXEP|150 mg|0|701|10|20|4|0|
OXEP|300 mg|0|701|10|20|4|0|
OXEP|600 mg|0|701|10|20|4|0|
OXEP|300 mg|2|701|10|20|4|0|
PARAMAC|500 mg|0|707|1|20|4|0|
PARAMAC|120 mg/5ml|2|707|1|20|4|0|
PARAMAC|250 mg/5ml|2|707|1|20|4|0|
PITAZ|15 mg|0|731|9|20|4|0|
PITAZ|30 mg|0|731|9|20|4|0|
PITAZ|45 mg|0|731|9|20|4|0|
PLANKA||2|552|5|20|4|0|
PLANKA FA|0.35 mg / 100 mg|0|470|5|20|4|0|
PLAQUIN-H|200 mg|0|531|8|20|4|0|
PLAYQUIN-H|400 mg|0|531|8|20|4|0|
PRESERX|100 mg|0|1|1|20|4|0|
PROPHED|100 mg/5ml / 30 mg/5ml|2|540|7|20|4|0|
PROPHED FORTE|200 mg / 30 mg|0|540|7|20|4|0|
PROPHED FORTE|400 mg / 60 mg|0|540|7|20|4|0|
RAMOL|50 mg|1|854|1|20|4|0|
RANTIN|150 mg|0|775|2|20|4|0|
RANTIN|300 mg|0|775|2|20|4|0|
RELAXIN|3 mg|0|181|10|20|4|0|
RT-METHER|20 mg / 120 mg|0|74|8|20|4|0|
SALMICORT||6|466|12|20|4|0|
SALNON||6|10|12|20|4|0|
SANTE|20 mg|1|691|2|20|4|0|
SANTE|40 mg|1|691|2|20|4|0|
SANTE PLUS|20 mg / 1100 mg|1|692|2|20|4|0|
SANTE PLUS|40 mg / 1100 mg|1|692|2|20|4|0|
SETZINE|2.5 mg/5ml|2|584|4|20|4|0|
SETZINE|5 mg|0|584|4|20|4|0|
SIEZAB|25 mg|0|853|10|20|4|0|
SIEZAB|50 mg|0|853|10|20|4|0|
SIGEL||2|32|2|20|4|0|
SILO|100 mg|0|805|9|20|4|0|
TAVIST|10 mg|0|127|3|20|4|0|
TAVIST|40 mg|0|127|3|20|4|0|
TAVIST PLUS|5 mg / 10 mg|0|47|3|20|4|0|
TAVIST PLUS|5 mg / 20 mg|0|47|3|20|4|0|
TAVIST PLUS|10 mg / 20 mg|0|47|3|20|4|0|
TECTOR|100 mcg|0|647|13|20|4|0|
TECTOR|200 mcg|0|647|13|20|4|0|
TECTOR PLUS|50 mg / 200 mcg|0|357|1|20|4|0|
TELSITAN|20 mg|0|830|3|20|4|0|
TELSITAN|40 mg|0|830|3|20|4|0|
TELSITAN|80 mg|0|830|3|20|4|0|
TELSITAN-H||0|522|3|20|4|0|
TIO-VEEZ|18 mcg|6|848|12|20|4|0|
TRICIN|500 IU/g / 0.5% w/w|4|140|6|20|4|0|
ULTIMA|125 mg/5ml|3|288|0|20|4|0|
ULTIMA|125 mg/5ml|2|288|0|20|4|0|
ULTIMA|250 mg|0|288|0|20|4|0|
ULTIMA|500 mg|0|288|0|20|4|0|
VISDOM||2|376|2|20|4|0|
VISDOM||0|376|2|20|4|0|
WITIN|100 mg|1|484|10|20|4|0|
WITIN|300 mg|1|484|10|20|4|0|
WITIN|400 mg|1|484|10|20|4|0|
XONI-FAST|8 mg / 15 mg|0|602|1|20|4|0|
ZEMI|320 mg|0|488|0|20|4|0|
ZINCASA|10 mg/5ml|2|885|5|20|4|0|
ZINCASA|20 mg|0|885|5|20|4|0|
AKSILEZ-V|150 mg / 160 mg|0|22|3|7|4|0|
AKSILEZ-V PLUS|300 mg / 320 mg|0|22|3|7|4|0|
ALRIN|60 mg|0|443|4|7|4|0|
ALRIN|120 mg|0|443|4|7|4|0|
ALRIN|180 mg|0|443|4|7|4|0|
AMOCILLIN|250 mg|1|64|0|7|4|0|
AMOCILLIN|500 mg|1|64|0|7|4|0|
AMOCILLIN|125 mg/1.25ml|3|64|0|7|4|0|
AMOCILLIN|125 mg/5ml|2|64|0|7|4|0|
AMOCILLIN|250 mg/5ml|2|64|0|7|4|0|
BEPRA|10 mg|0|772|2|7|4|0|
BEPRA|20 mg|0|772|2|7|4|0|
BIOCILLIN|125 mg / 125 mg|1|68|0|7|4|0|
BIOCILLIN|250 mg / 250 mg|1|68|0|7|4|0|
BIOCILLIN|125 mg/5ml / 125 mg/5ml|2|68|0|7|4|0|
CEF-OD|200 mg/5ml|2|245|0|7|4|0|
CEF-OD|200 mg|0|245|0|7|4|0|
CHEMIZOL|400 mg / 80 mg|0|824|0|7|4|0|
CHEMIZOL|800 mg / 160 mg|0|824|0|7|4|0|
CHEMIZOL|200 mg/5ml / 40 mg/5ml|2|824|0|7|4|0|
CIPROMEN|250 mg|0|280|0|7|4|0|
CIPROMEN|500 mg|0|280|0|7|4|0|
CLARIX|5 mg/5ml|2|598|4|7|4|0|
CLARIX|10 mg|0|598|4|7|4|0|
CO-VALSTAR|25 mg / 160 mg|0|524|3|7|4|0|
CRESTAT|5 mg|0|788|3|7|4|0|
CRESTAT|10 mg|0|788|3|7|4|0|
CRESTAT|20 mg|0|788|3|7|4|0|
DEFLAM|50 mg|0|355|1|7|4|0|
DIACTO|15 mg|0|731|9|7|4|0|
DIACTO|30 mg|0|731|9|7|4|0|
DIACTO|45 mg|0|731|9|7|4|0|
DILCONEURINE||0|320|5|7|4|0|
DILCOPLEX||2|109|5|7|4|0|
DILCOPLEX||0|105|5|7|4|0|
DILCOZYME||1|314|5|7|4|0|
DILCOZYME||2|219|5|7|4|0|
DORSIFLEX|200 mg|1|249|1|7|4|0|
DULAC|3.35 g/5ml|2|576|2|7|4|0|
EFICLOT|5 mg|0|748|3|7|4|0|
EFICLOT|10 mg|0|748|3|7|4|0|
EPICETAM|250 mg|0|582|10|7|4|0|
EPICETAM|500 mg|0|582|10|7|4|0|
EPINOL-CF||0|264|7|7|4|0|
EPINOL-CF||2|264|7|7|4|0|
EPINOL-DM||2|263|7|7|4|0|
EPINOL-DM||0|262|7|7|4|0|
EPINOL-E||2|56|7|7|4|0|
ERACIN|200 mg|0|686|0|7|4|0|
ESPRA|20 mg|1|412|2|7|4|0|
ESPRA|40 mg|1|412|2|7|4|0|
EXAPRO|5 mg|0|411|10|7|4|0|
EXAPRO|10 mg|0|411|10|7|4|0|
EXAPRO|20 mg|0|411|10|7|4|0|
EZEMIBE|10 mg|0|428|3|7|4|0|
FAAST|20 mg / 1100 mg|1|692|2|7|4|0|
FAAST|40 mg / 1100 mg|1|692|2|7|4|0|
FEBUXA|40 mg|0|432|15|7|4|0|
FEBUXA|80 mg|0|432|15|7|4|0|
FERROCAP TR|200 mg / 0.5 mg|1|442|5|7|4|0|
FLEXAGIL|5 mg|0|322|1|7|4|0|
FLEXAGIL|10 mg|0|322|1|7|4|0|
FOSOMIN|500 mg|1|476|0|7|4|0|
FOSOMIN|250 mg/5ml|2|476|0|7|4|0|
FURADIL|5.898 g/30ml / 0.13 g/30ml|2|564|2|7|4|0|
FURADIL-F|25 mg/5ml|2|481|0|7|4|0|
GABLIN|75 mg|1|756|10|7|4|0|
GABLIN|150 mg|1|756|10|7|4|0|
GABLIN|300 mg|1|756|10|7|4|0|
GETROLOX|200 mg|0|486|0|7|4|0|
GETROLOX|400 mg|0|486|0|7|4|0|
GLIMET|1.25 mg / 250 mg|0|492|9|7|4|0|
GLIMET|2.5 mg / 250 mg|0|492|9|7|4|0|
GLIMET|5 mg / 250 mg|0|492|9|7|4|0|
GRANISET|1 mg|0|508|2|7|4|0|
HEPALEX||2|316|5|7|4|0|
KARTY|50 mg|1|352|15|7|4|0|
KEFROX|125 mg/5ml|2|248|0|7|4|0|
KEFROX|250 mg|0|248|0|7|4|0|
LEVOCIL|250 mg|0|585|0|7|4|0|
LEVOCIL|500 mg|0|585|0|7|4|0|
MAGLO|15 mg/5ml / 90 mg/5ml|2|74|8|7|4|0|
MALGO|15 mg/5ml / 90 mg/5ml|2|74|8|7|4|0|
MALGO|20 mg / 120 mg|0|74|8|7|4|0|
MALGO|40 mg / 240 mg|0|74|8|7|4|0|
MALGO|80 mg / 480 mg|0|74|8|7|4|0|
MAXFLOW|0.4 mg|1|828|15|7|4|0|
METOCARD|100 mg|0|639|3|7|4|0|
METOMIDE|1 mg/ml|3|638|2|7|4|0|
METOMIDE|5 mg/5ml|2|638|2|7|4|0|
METOMIDE|10 mg|0|638|2|7|4|0|
MOLOX|400 mg|0|651|0|7|4|0|
MONOCEF|250 mg|1|251|0|7|4|0|
MONOCEF|500 mg|1|251|0|7|4|0|
MONOCEF|125 mg/5ml|2|251|0|7|4|0|
MONOCEF|250 mg/5ml|2|251|0|7|4|0|
MONTAIR|4 mg|0|649|12|7|4|0|
MONTAIR|5 mg|0|649|12|7|4|0|
MONTAIR|10 mg|0|649|12|7|4|0|
NEO-KLAR|125 mg/5ml|2|288|0|7|4|0|
NEO-KLAR|250 mg|0|288|0|7|4|0|
NEO-KLAR|500 mg|0|288|0|7|4|0|
NOCLOT|75 mg|0|299|3|7|4|0|
NOCLOT-EA||0|122|3|7|4|0|
NOCLOT-LD|300 mg|0|299|3|7|4|0|
NORMOPRESS|25 mg|0|603|3|7|4|0|
NORMOPRESS|50 mg|0|603|3|7|4|0|
NORMOZIDE|12.5 mg / 50 mg|0|518|3|7|4|0|
ONCE A DAY||0|82|5|7|4|0|
ONCE A DAY AX||0|107|5|7|4|0|
ORINASE|1 mg|0|494|9|7|4|0|
ORINASE|2 mg|0|494|9|7|4|0|
ORINASE|3 mg|0|494|9|7|4|0|
ORINASE|4 mg|0|494|9|7|4|0|
ORINASE MET 1|1 mg / 500 mg|0|495|9|7|4|0|
ORINASE MET 2|2 mg / 500 mg|0|495|9|7|4|0|
ORLOVIT|120 mg|1|695|15|7|4|0|
OSTEORISE|5 mg|0|782|15|7|4|0|
OSTEORISE|35 mg|0|782|15|7|4|0|
OSTEOTEC|50 mg / 200 mcg|0|357|1|7|4|0|
OSTEOTEC|75 mg / 200 mcg|0|357|1|7|4|0|
PARAXYL|20 mg|0|715|10|7|4|0|
PARAXYL CR|12.5 mg|0|715|10|7|4|0|
PENRAL|100 mg|1|484|10|7|4|0|
PENRAL|300 mg|1|484|10|7|4|0|
PENRAL|400 mg|1|484|10|7|4|0|
PIOMET|500 mg / 15 mg|0|629|9|7|4|0|
PIOMET|850 mg / 15 mg|0|629|9|7|4|0|
PRO-STATIN|10 mg|0|127|3|7|4|0|
PRO-STATIN|20 mg|0|127|3|7|4|0|
PRO-STATIN|40 mg|0|127|3|7|4|0|
PROLOC|20 mg|1|691|2|7|4|0|
QUTYL|25 mg|0|770|10|7|4|0|
QUTYL|100 mg|0|770|10|7|4|0|
QUTYL|200 mg|0|770|10|7|4|0|
RELOFIN|60 mg|0|773|15|7|4|0|
SIM-STAT|10 mg|0|804|3|7|4|0|
SIM-STAT|20 mg|0|804|3|7|4|0|
SITA MET|500 mg / 50 mg|0|631|9|7|4|0|
SITA MET|1 g / 50 mg|0|631|9|7|4|0|
STRESAM|50 mg|1|423|10|7|4|0|
TORATE|25 mg|0|853|10|7|4|0|
TORATE|50 mg|0|853|10|7|4|0|
TORIDE|50 mg|0|561|2|7|4|0|
TRIPTOR|250 mg|1|871|2|7|4|0|
TRIPTOR|500 mg|1|871|2|7|4|0|
ULCET|200 mg|0|277|2|7|4|0|
ULCET|400 mg|0|277|2|7|4|0|
VALAM|5 mg / 80 mg|0|54|3|7|4|0|
VALAM|10 mg / 80 mg|0|54|3|7|4|0|
VALAM-H||0|50|3|7|4|0|
VALSTAR|80 mg|0|873|3|7|4|0|
VALSTAR|160 mg|0|873|3|7|4|0|
VITAXON|500 mcg|0|621|5|7|4|0|
ZERUP|20 mg/5ml|2|885|5|7|4|0|
ZIPRA|40 mg|1|886|10|7|4|0|
ZIPRA|60 mg|1|886|10|7|4|0|
ZOTONIX|40 mg|0|706|2|7|4|0|
NEMAZOLE|100 mg/5ml|2|615|8|11|5|0|
NEMAZOLE|100 mg|0|615|8|11|5|0|
NEMAZOLE|500 mg|0|615|8|11|5|0|
ORBENIN|250 mg|1|304|0|11|5|0|
ORBENIN|125 mg/5ml|2|304|0|11|5|0|
PENBRITIN|250 mg|1|67|0|11|5|0|
PENBRITIN|500 mg|1|67|0|11|5|0|
PENBRITIN|125 mg/ml|3|67|0|11|5|0|
PENBRITIN|125 mg/5ml|2|67|0|11|5|0|
PILZCIN|1% w/w|4|310|6|11|5|0|
POLYFAX PLUS|500 IU/g / 4% w/w / 10000 IU/g|4|139|6|11|5|0|
QUIBRON-T/SR|300 mg|0|837|12|11|5|0|
RELIFEX|500 mg|0|656|1|11|5|0|
REVITALE M||0|83|5|11|5|0|
REVITALE-B||0|171|5|11|5|0|
SERETIDE EVOHALER|50 mcg/actu / 25 mcg/actu|6|466|12|11|5|0|
SERETIDE EVOHALER|125 mcg/actu / 25 mcg/actu|6|466|12|11|5|0|
SERETIDE EVOHALER|250 mcg/actu / 25 mcg/actu|6|466|12|11|5|0|
SEREVENT|25 mcg/actu|6|795|12|11|5|0|
SEROXAT|20 mg|0|715|10|11|5|0|
SILVATE|1% w/w|4|801|6|11|5|0|
STARVIT||0|91|5|11|5|0|
STELAZINE|1 mg|0|862|10|11|5|0|
STELAZINE|5 mg|0|862|10|11|5|0|
STIEMAZOL|1% w/w|4|301|6|11|5|0|
STIEMAZOL|1% w/v|4|301|6|11|5|0|
SYRAPRIM|300 mg|0|866|0|11|5|0|
TAGAMET|400 mg|0|277|2|11|5|0|
TAGAMET|200 mg|0|277|2|11|5|0|
UNIPLEX||2|220|5|11|5|0|
VENTIDE|100 mcg/actu / 50 mcg/actu|6|10|12|11|5|0|
WELLCODOX|100 mg|1|384|0|11|5|0|
WELLCOSINE||2|108|5|11|5|0|
ZINACEF|250 mg|0|248|0|11|5|0|
ZINACEF|125 mg|0|248|0|11|5|0|
ZINACEF|125 mg/5ml|2|248|0|11|5|0|
ZINNAT|125 mg/5ml|2|248|0|11|5|0|
ZINNAT|125 mg|0|248|0|11|5|0|
ZINNAT|250 mg|0|248|0|11|5|0|
ZOFRAN|8 mg|0|693|2|11|5|0|
ZOFRAN|4 mg|0|693|2|11|5|0|
ZOLANIX|150 mg|1|450|6|11|5|0|
ZOVIRAX|5% w/w|4|6|6|11|5|0|
ZOVIRAX|200 mg|0|6|6|11|5|0|
ZOVIRAX|3% w/w|4|6|11|11|5|0|
AEROTEC-B|200 mcg / 100 mcg|6|10|12|16|6|0|
AEROTEC-B FORTE|400 mcg / 200 mcg|6|10|12|16|6|0|
AEROTEL|5 mg|0|649|12|16|6|0|
AEROTEL|10 mg|0|649|12|16|6|0|
AEROTEL CHEWABLE|5 mg|0|649|12|16|6|0|
AIRTAL|100 mg|0|1|1|16|6|0|
AIRTAL ER|200 mg|0|1|1|16|6|0|
ALCAL||0|18|5|16|6|0|
ARTECXIN|15 mg/5ml / 90 mg/5ml|2|74|8|16|6|0|
ARTECXIN|20 mg / 120 mg|0|74|8|16|6|0|
ARTECXIN DISPERSIBLE|20 mg / 120 mg|0|74|8|16|6|0|
ARTECXIN FORTE|40 mg / 240 mg|0|74|8|16|6|0|
ARTECXIN FORTE DISPERSIBLE|40 mg / 240 mg|0|74|8|16|6|0|
ARTECXIN PLUS|80 mg / 480 mg|0|74|8|16|6|0|
ARTRODAR|50 mg|1|352|1|16|6|0|
ASPA|200 mg|1|616|2|16|6|0|
ASPA|10 mg/ml|2|616|2|16|6|0|
ASTHAVENT HFA|100 mcg|6|9|12|16|6|0|
AVOTIN|5 mg / 10 mg|0|47|3|16|6|0|
AXESOM|20 mg|1|412|2|16|6|0|
AXESOM|40 mg|1|412|2|16|6|0|
BENZISOX|1 mg|0|783|10|16|6|0|
BENZISOX|2 mg|0|783|10|16|6|0|
BENZISOX|3 mg|0|783|10|16|6|0|
BENZISOX|4 mg|0|783|10|16|6|0|
BETATEC|100 mg|6|144|12|16|6|1|
BLOKIUM-DIU|50 mg / 12.5 mg|0|125|3|16|6|0|
BLOKIUM-DIU|100 mg / 25 mg|0|125|3|16|6|0|
BREAVENT|200 mcg|6|9|12|16|6|0|
BREAVENT-B|200 mcg / 100 mcg|6|10|12|16|6|0|
BREAVENT-B FORTE|400 mcg / 200 mcg|6|10|12|16|6|0|
BUDEFORM HFA|100 mcg|6|186|12|16|6|0|
BUDEFORM HFA|200 mcg|6|186|12|16|6|0|
CEFATIL|500 mg|1|251|0|16|6|0|
CEFATIL|125 mg/5ml|2|251|0|16|6|0|
CEFATIL|250 mg/5ml|2|251|0|16|6|0|
CETACLOR|250 mg|1|241|0|16|6|0|
CETACLOR|500 mg|1|241|0|16|6|0|
CETACLOR|125 mg/5ml|2|241|0|16|6|0|
CETACLOR|250 mg/5ml|2|241|0|16|6|0|
CIDINE|1 mg/5ml|2|278|2|16|6|0|
CIDINE|1 mg|0|278|2|16|6|0|
CLINDA V||7|291|13|16|6|0|
COMBIVAIR|100 mcg / 6 mcg|6|187|12|16|6|0|
COMBIVAIR|200 mcg / 6 mcg|6|187|12|16|6|0|
COMBIVAIR|400 mcg / 6 mcg|6|187|12|16|6|0|
CONSERVE|5 mg / 50 mg|0|38|3|16|6|0|
CYROCIN|250 mg|0|280|0|16|6|0|
CYROCIN|500 mg|0|280|0|16|6|0|
CYROCIN|750 mg|0|280|0|16|6|0|
EFIX|400 mg|1|245|0|16|6|0|
EFIX|100 mg/5ml|2|245|0|16|6|0|
FABECAL|120 mg|1|695|15|16|6|0|
FENASO|5 mg|0|815|15|16|6|0|
FENASO|10 mg|0|815|15|16|6|0|
FENDINA|60 mg|1|443|4|16|6|0|
FENDINA|120 mg|0|443|4|16|6|0|
FENDINA|180 mg|0|443|4|16|6|0|
FENDINA D||0|444|4|16|6|0|
FORACORT HFA|100 mg / 6 mcg|6|187|12|16|6|1|
FORACORT HFA|200 mg / 6 mcg|6|187|12|16|6|1|
HERBESSER|90 mg|1|366|3|16|6|0|
HERBESSER|180 mg|1|366|3|16|6|0|
HERBESSER|30 mg|0|366|3|16|6|0|
HERBESSER|60 mg|0|366|3|16|6|0|
HILIN|50 mg|1|756|10|16|6|0|
HILIN|75 mg|1|756|10|16|6|0|
HILIN|100 mg|1|756|10|16|6|0|
HILIN|150 mg|1|756|10|16|6|0|
HILIN|300 mg|1|756|10|16|6|0|
HITECXIN|60 mg|0|73|8|16|6|0|
INHIBITOL|30 mg|1|578|2|16|6|0|
IPRATEC|40 mcg|6|548|12|16|6|0|
IPRATEC-S|100 mcg / 20 mcg|6|11|12|16|6|0|
KESTINE|5 mg/5ml|2|393|4|16|6|0|
KESTINE|10 mg|0|393|4|16|6|0|
KESTINE|20 mg|0|393|4|16|6|0|
KETOPIKE|2% w/w|4|565|6|16|6|0|
LEXOPINE|200 mg|0|228|10|16|6|0|
LIPIREX|10 mg|0|127|3|16|6|0|
LIPIREX|20 mg|0|127|3|16|6|0|
LIPIREX|40 mg|0|127|3|16|6|0|
LYSICAM||1|238|5|16|6|0|
M-FER||0|552|5|16|6|0|
MINALFENE|300 mg|0|42|1|16|6|0|
MISAR-AM|5 mg / 40 mg|0|53|3|16|6|0|
MISAR-AM|10 mg / 80 mg|0|53|3|16|6|0|
MISAR-H|12.5 mg / 40 mg|0|522|3|16|6|0|
MISAR-H|12.5 mg / 80 mg|0|522|3|16|6|0|
NAPRASH|0.1% w/w / 6% w/w|4|145|6|16|6|0|
NEBIX|2.5 mg|0|665|3|16|6|0|
NEBIX|5 mg|0|665|3|16|6|0|
NEBIX|10 mg|0|665|3|16|6|0|
NORFAX|400 mg|0|684|0|16|6|0|
NURIL|400 mg|0|732|0|16|6|0|
NYLORIDE|1 mg|0|494|9|16|6|0|
NYLORIDE|2 mg|0|494|9|16|6|0|
NYLORIDE|3 mg|0|494|9|16|6|0|
NYLORIDE|4 mg|0|494|9|16|6|0|
OXAQUIN|400 mg|0|651|0|16|6|0|
PARATOL EXTRA|65 mg / 500 mg|0|199|1|16|6|0|
PIDOGREL|75 mg|0|299|3|16|6|0|
PIDOGREL-AP|75 mg / 75 mg|0|122|3|16|6|0|
PIDOGREL-AP|75 mg / 150 mg|0|122|3|16|6|0|
PIROBET|20 mg|1|735|1|16|6|0|
PROSTAM|0.4 mg|1|828|15|16|6|0|
PYCTOMET|500 mg / 15 mg|0|629|9|16|6|0|
PYCTOMET|850 mg / 15 mg|0|629|9|16|6|0|
PYCTOS|15 mg|0|731|9|16|6|0|
PYCTOS|30 mg|0|731|9|16|6|0|
PYCTOS|45 mg|0|731|9|16|6|0|
RABECID|10 mg|0|772|2|16|6|0|
RABECID|20 mg|0|772|2|16|6|0|
RANOLA|500 mg|0|776|3|16|6|0|
RANOLA|1 g|0|776|3|16|6|0|
RHEUOXIB|100 mg|1|249|1|16|6|0|
RHEUOXIB|200 mg|1|249|1|16|6|0|
ROSULIN|5 mg|0|788|3|16|6|0|
ROSULIN|10 mg|0|788|3|16|6|0|
ROSULIN|20 mg|0|788|3|16|6|0|
SENERGY-OD|5 mg/5ml|2|598|4|16|6|0|
SENERGY-OD|10 mg|0|598|4|16|6|0|
SKILAX|7.5 mg/ml|3|813|2|16|6|0|
SKILAX|5 mg|0|813|2|16|6|0|
SPIKE|2% w/w|4|565|6|16|6|0|
SPIKE|2% w/v|4|565|6|16|6|0|
SPIKE|200 mg|0|565|6|16|6|0|
TAGIP|25 mg|0|805|9|16|6|0|
TAGIP|50 mg|0|805|9|16|6|0|
TAGIP|100 mg|0|805|9|16|6|0|
TAGIPMET|500 mg / 25 mg|0|631|9|16|6|0|
TAGIPMET|500 mg / 50 mg|0|631|9|16|6|0|
TAGIPMET|1 g / 50 mg|0|631|9|16|6|0|
TAMADOL|50 mg|1|854|1|16|6|0|
TANATRIL|5 mg|0|542|3|16|6|0|
TANATRIL|10 mg|0|542|3|16|6|0|
TEOLID|250 mg|0|844|3|16|6|0|
TERMIBEX|125 mg/5ml / 31.25 mg/5ml|2|65|0|16|6|0|
TERMIBEX|250 mg/5ml / 62.5 mg/5ml|2|65|0|16|6|0|
TERMIBEX|250 mg / 125 mg|0|65|0|16|6|0|
TERMIBEX|500 mg / 125 mg|0|65|0|16|6|0|
TERMIBEX|875 mg / 125 mg|0|65|0|16|6|0|
TIOVAIR|18 mcg|6|848|12|16|6|0|
TIOVAIR F|12 mcg / 18 mcg|6|475|12|16|6|0|
VENTOMAX|5 mg|0|649|12|16|6|0|
VENTOMAX|10 mg|0|649|12|16|6|0|
VOXIQUIN TABLET|250 mg|0|585|0|16|6|0|
VOXIQUIN TABLET|500 mg|0|585|0|16|6|0|
XAMIG|250 mg|1|857|15|16|6|0|
XAMIG|500 mg|1|857|15|16|6|0|
ZOLEBID|800 mg / 160 mg|0|824|0|16|6|0|
ZOTTER|250 mg|1|134|0|16|6|0|
AM-TELSAN|5 mg / 40 mg|0|53|3|17|6|0|
AM-TELSAN|10 mg / 40 mg|0|53|3|17|6|0|
AM-TELSAN|5 mg / 80 mg|0|53|3|17|6|0|
AM-TELSAN|10 mg / 80 mg|0|53|3|17|6|0|
ANAPAZ|125 mcg/ml|3|536|2|17|6|0|
ANAPAZ|125 mcg|0|536|2|17|6|0|
ANAPAZ|250 mcg|0|536|2|17|6|0|
ARAQAL|67.5 mg / 25 mg|0|63|8|17|6|0|
ARAQAL|135 mg / 50 mg|0|63|8|17|6|0|
ARAQAL|270 mg / 100 mg|0|63|8|17|6|0|
ARIZA|5 mg|0|72|10|17|6|0|
ATOZET|10 mg / 10 mg|0|128|3|17|6|0|
ATROCARD|10 mg|0|804|3|17|6|0|
ATROCARD|20 mg|0|804|3|17|6|0|
ATROCARD|40 mg|0|804|3|17|6|0|
AVCARD|5 mg / 80 mg|0|54|3|17|6|0|
AVCARD|5 mg / 160 mg|0|54|3|17|6|0|
AVCARD|10 mg / 160 mg|0|54|3|17|6|0|
BETAGE|500 mg / 9 mg / 10 mg / 20 mcg / 100 mg|0|79|5|17|6|0|
BLOPRESS|8 mg|0|223|3|17|6|0|
BLOPRESS|16 mg|0|223|3|17|6|0|
CARLOV|6.25 mg|0|240|3|17|6|0|
CARLOV|12.5 mg|0|240|3|17|6|0|
CARLOV|25 mg|0|240|3|17|6|0|
CELART|100 mg|1|249|1|17|6|0|
CELART|200 mg|1|249|1|17|6|0|
CITANEW|5 mg|0|411|10|17|6|0|
CITANEW|10 mg|0|411|10|17|6|0|
CITANEW|20 mg|0|411|10|17|6|0|
CO TELSAN|12.5 mg / 40 mg|0|522|3|17|6|0|
CO TELSAN|12.5 mg / 80 mg|0|522|3|17|6|0|
CO-ATORAP|5 mg / 10 mg|0|47|3|17|6|0|
CO-ATORAP|5 mg / 20 mg|0|47|3|17|6|0|
CO-ATORAP|5 mg / 40 mg|0|47|3|17|6|0|
DESTINA|5 mg|0|329|4|17|6|0|
DINACOR|125 mg/5ml|2|244|0|17|6|0|
DINACOR|300 mg|1|244|0|17|6|0|
DIPIP|40 mg / 320 mg|1|364|8|17|6|0|
DIPIP|15 mg / 120 mg|5|364|8|17|6|0|
DULAN|14 mg|1|388|10|17|6|0|
DULAN|20 mg|1|388|10|17|6|0|
DULAN|30 mg|1|388|10|17|6|0|
DULAN|40 mg|1|388|10|17|6|0|
DULAN|60 mg|1|388|10|17|6|0|
DULAN|90 mg|1|388|10|17|6|0|
EKNIT|750 mg/30ml|2|796|8|17|6|0|
ERZING|150 mg|1|406|7|17|6|0|
ESORID|20 mg|1|412|2|17|6|0|
ESORID|40 mg|1|412|2|17|6|0|
FEXO|60 mg|0|443|4|17|6|0|
FEXO|60 mg|1|443|4|17|6|0|
FEXO|120 mg|0|443|4|17|6|0|
FEXO|180 mg|0|443|4|17|6|0|
FEXO-D|60 mg / 120 mg|0|444|4|17|6|0|
FLOXIN|400 mg|0|684|0|17|6|0|
FLUX|20 mg|1|461|10|17|6|0|
GEVOLOX|500 mg|1|499|15|17|6|0|
GEVOLOX-PLUS|500 mg|0|499|15|17|6|0|
HEPADIAL|50 mg|0|367|2|17|6|0|
HICLOR|250 mg|1|241|0|17|6|0|
HICLOR|500 mg|1|241|0|17|6|0|
HICLOR|50 mg/ml|3|241|0|17|6|0|
HICLOR|125 mg/5ml|2|241|0|17|6|0|
HICLOR|250 mg/5ml|2|241|0|17|6|0|
HIFLOX|250 mg|0|280|0|17|6|0|
HIFLOX|500 mg|0|280|0|17|6|0|
HIFLOX|750 mg|0|280|0|17|6|0|
HIFLOX|125 mg/5ml|2|280|0|17|6|0|
HIFLOX|250 mg/5ml|2|280|0|17|6|0|
HIMET XR|750 mg|0|628|9|17|6|0|
HITOP|25 mg|0|853|10|17|6|0|
HITOP|50 mg|0|853|10|17|6|0|
HITOP|100 mg|0|853|10|17|6|0|
LACOLEP|50 mg|0|572|10|17|6|0|
LACOLEP|100 mg|0|572|10|17|6|0|
LACOLEP|150 mg|0|572|10|17|6|0|
LAEVOLAC|3.35 g/5ml|2|576|2|17|6|0|
LEOZIN|5 mg|0|584|4|17|6|0|
LERACE|250 mg|0|582|10|17|6|0|
LERACE|500 mg|0|582|10|17|6|0|
LERACE|750 mg|0|582|10|17|6|0|
LOJIN|5 mg|0|577|10|17|6|0|
LOJIN|25 mg|0|577|10|17|6|0|
LOJIN|50 mg|0|577|10|17|6|0|
LOJIN|100 mg|0|577|10|17|6|0|
LOXONIN|60 mg|0|606|1|17|6|0|
MAXIT|50 mg|0|355|1|17|6|0|
MAXIT|75 mg|0|355|1|17|6|0|
MEBIPAS|135 mg / 3.5 g|5|617|2|17|6|0|
METHYCOBAL|500 mcg|0|621|5|17|6|0|
MIGZOR|2.5 mg|0|887|10|17|6|0|
MIGZOR|5 mg|0|887|10|17|6|0|
MIOMAX|200 mg/5ml|2|644|0|17|6|0|
MIOMAX|400 mg|0|644|0|17|6|0|
MYONAL|50 mg|0|400|1|17|6|0|
NEOGAB|100 mg|1|484|10|17|6|0|
NEOGAB|300 mg|1|484|10|17|6|0|
NEOGAB|400 mg|1|484|10|17|6|0|
NITAZERT|500 mg|0|681|8|17|6|0|
OMEZAC PLUS|20 mg / 1100 mg|1|692|2|17|6|0|
OMEZAC PLUS|40 mg / 1100 mg|1|692|2|17|6|0|
OMSANA|10 mg|0|689|3|17|6|0|
OMSANA|20 mg|0|689|3|17|6|0|
OMSANA|40 mg|0|689|3|17|6|0|
OMSANA DIU|12.5 mg / 20 mg|0|519|3|17|6|0|
OMSANA DIU|25 mg / 20 mg|0|519|3|17|6|0|
OMSANA DIU|12.5 mg / 40 mg|0|519|3|17|6|0|
OSCORD|5 mg|0|689|3|17|6|0|
OSCORD|10 mg|0|689|3|17|6|0|
OSCORD|20 mg|0|689|3|17|6|0|
OSCORD|40 mg|0|689|3|17|6|0|
OSCORD DIU|12.5 mg / 20 mg|0|519|3|17|6|0|
OSCORD DIU|25 mg / 20 mg|0|519|3|17|6|0|
OSCORD DIU|12.5 mg / 40 mg|0|519|3|17|6|0|
OSCORD DIU|25 mg / 40 mg|0|519|3|17|6|0|
PAM-S|25 mg / 500 mg|0|704|13|17|6|0|
PIOZER|15 mg|0|731|9|17|6|0|
PIOZER|30 mg|0|731|9|17|6|0|
PIOZER|45 mg|0|731|9|17|6|0|
PIOZER G|1 mg / 15 mg|0|496|9|17|6|0|
PIOZER G|2 mg / 15 mg|0|496|9|17|6|0|
PIOZER G|4 mg / 15 mg|0|496|9|17|6|0|
PIOZER G|2 mg / 30 mg|0|496|9|17|6|0|
PIOZER G|4 mg / 30 mg|0|496|9|17|6|0|
PIOZER-PLUS|500 mg / 15 mg|0|629|9|17|6|0|
PIOZER-PLUS|850 mg / 15 mg|0|629|9|17|6|0|
PRALIP|10 mg|0|749|3|17|6|0|
PRALIP|20 mg|0|749|3|17|6|0|
PROQON|62.5 mg / 25 mg|0|129|8|17|6|0|
PROQON|250 mg / 100 mg|0|129|8|17|6|0|
QUSEL|25 mg|0|770|10|17|6|0|
QUSEL|100 mg|0|770|10|17|6|0|
QUSEL|150 mg|0|770|10|17|6|0|
QUSEL|200 mg|0|770|10|17|6|0|
QUSEL XR|200 mg|0|770|10|17|6|0|
ROLIP|5 mg|0|788|3|17|6|0|
ROLIP|10 mg|0|788|3|17|6|0|
ROLIP|20 mg|0|788|3|17|6|0|
RONIROL|0.25 mg|0|786|10|17|6|0|
RONIROL|1 mg|0|786|10|17|6|0|
RONIROL|2 mg|0|786|10|17|6|0|
ROSTEO|150 mg|0|782|15|17|6|0|
SAMEB MR|200 mg|1|616|2|17|6|0|
SIMEZET|10 mg|0|804|3|17|6|0|
SIMEZET|20 mg|0|804|3|17|6|0|
SIMEZET|40 mg|0|804|3|17|6|0|
SINTAM|0.2 mg|1|828|15|17|6|0|
SITAGLU|25 mg|0|805|9|17|6|0|
SITAGLU|50 mg|0|805|9|17|6|0|
SITAGLU|100 mg|0|805|9|17|6|0|
SITAGLU MET|500 mg / 50 mg|0|631|9|17|6|0|
SITAGLU MET|1 g / 50 mg|0|631|9|17|6|0|
STIMOL|50% w/v|2|287|15|17|6|0|
SUMIG|50 mg|0|826|10|17|6|0|
SUMIG PLUS|100 mg|0|826|10|17|6|0|
SUSMET XR|500 mg|0|628|9|17|6|0|
TELSAN|20 mg|0|830|3|17|6|0|
TELSAN|40 mg|0|830|3|17|6|0|
TELSAN|80 mg|0|830|3|17|6|0|
TIAZEM|90 mg|1|366|3|17|6|0|
TIAZEM|30 mg|0|366|3|17|6|0|
TIAZEM|60 mg|0|366|3|17|6|0|
TRI-VALSAN|5 mg / 12.5 mg / 80 mg|0|50|3|17|6|0|
TRI-VALSAN|5 mg / 12.5 mg / 160 mg|0|50|3|17|6|0|
TRI-VALSAN|5 mg / 25 mg / 160 mg|0|50|3|17|6|0|
TRI-VALSAN|10 mg / 12.5 mg / 160 mg|0|50|3|17|6|0|
TRI-VALSAN|10 mg / 25 mg / 160 mg|0|50|3|17|6|0|
TRI-VALSAN|10 mg / 25 mg / 320 mg|0|50|3|17|6|0|
UNIX|100 mg|0|678|1|17|6|0|
VALODIN|250 mg|1|251|0|17|6|0|
VALODIN|500 mg|1|251|0|17|6|0|
VALODIN|125 mg/5ml|2|251|0|17|6|0|
VALODIN|250 mg/5ml|2|251|0|17|6|0|
VALSAN-AM|5 mg / 320 mg|0|54|3|17|6|0|
VALSAN-AM|10 mg / 320 mg|0|54|3|17|6|0|
XEFACTA|400 mg|0|651|0|17|6|0|
XIKA RAPID|8 mg|0|601|1|17|6|0|
ZEEGAP|50 mg|1|756|10|17|6|0|
ZEEGAP|75 mg|1|756|10|17|6|0|
ZEEGAP|100 mg|1|756|10|17|6|0|
ZEEGAP|150 mg|1|756|10|17|6|0|
ANZOL|150 mg|0|775|2|19|7|0|
B.C.PLEX||0|119|5|19|7|0|
BROMALEX|3 mg|0|181|10|19|7|0|
CANTER|250 mg|0|288|0|19|7|0|
CANTER|500 mg|0|288|0|19|7|0|
CANTER|125 mg|2|288|0|19|7|0|
CAVIDOL|12.5 mg|0|240|3|19|7|0|
CAVIDOL|25 mg|0|240|3|19|7|0|
CELETAB|100 mg|1|249|1|19|7|0|
CELETAB|200 mg|1|249|1|19|7|0|
CIDPRO|20 mg|1|691|2|19|7|0|
CIDPRO|40 mg|1|691|2|19|7|0|
CIMETAMAT|100 mg/10ml|2|277|2|19|7|0|
CIMETAMAT|200 mg|0|277|2|19|7|0|
CIMETAMAT|400 mg|0|277|2|19|7|0|
CIPLET|500 mg|0|280|0|19|7|0|
CIPLET|250 mg|0|280|0|19|7|0|
CIPLET|125 mg|2|280|0|19|7|0|
CIPLET|250 mg|2|280|0|19|7|0|
CIPRO|20 mg|1|691|2|19|7|0|
CIPRO|40 mg|1|691|2|19|7|0|
DYCLO|100 mg|0|356|1|19|7|0|
DYCLO|50 mg|0|356|1|19|7|0|
DYCLO|25 mg|0|356|1|19|7|0|
DYCLO GR|50 mg|1|356|1|19|7|0|
DYCLO-ACE|100 mg|0|1|1|19|7|0|
DYCLO-M|75 mg / 200 mcg|0|357|1|19|7|0|
DYCLO-M|50 mg / 200 mcg|0|357|1|19|7|0|
DYCLO-P|50 mg|0|356|1|19|7|0|
E-DYNAPRAM|10 mg|0|411|10|19|7|0|
ERYBRON|4 mg/5ml / 200 mg/5ml|2|184|0|19|7|0|
ERYBRON|8 mg / 500 mg|0|184|0|19|7|0|
ERYDERM|2% w/v|4|407|6|19|7|0|
ERYTHROCIN|100 mg|3|407|0|19|7|0|
ERYTHROCIN|200 mg|2|407|0|19|7|0|
ERYTHROCIN|250 mg|0|407|0|19|7|0|
ERYTHROCIN|500 mg|0|407|0|19|7|0|
EXLOR|125 mg/5ml|2|241|0|19|7|0|
EXLOR|250 mg/5ml|2|241|0|19|7|0|
EXLOR|50 mg/ml|3|241|0|19|7|0|
EXPLAT|75 mg|0|299|3|19|7|0|
FURMIUM|5 mg|0|688|10|19|7|0|
FURMIUM|10 mg|0|688|10|19|7|0|
HEMOTON-S||2|437|5|19|7|0|
HEMOVIT||1|116|5|19|7|0|
INCOBAL|500 mcg|0|621|5|19|7|0|
INDAZOLE|20 mg|1|412|2|19|7|0|
INDAZOLE|40 mg|1|412|2|19|7|0|
INDIGA|100 mg|1|484|10|19|7|0|
INDIGA|300 mg|1|484|10|19|7|0|
INDIGA|400 mg|1|484|10|19|7|0|
INDOFER|100 mg|0|552|5|19|7|0|
INDOFER|50 mg/5ml|2|552|5|19|7|0|
INDOFER PLUS|100 mg / 0.35 mg|0|553|5|19|7|0|
INDOKAST|5 mg|0|649|12|19|7|0|
INDOKAST|10 mg|0|649|12|19|7|0|
INDOKAST|4 mg|5|649|12|19|7|0|
INDOMAL|80 mg / 240 mg|0|74|8|19|7|0|
INDOMAL|20 mg / 120 mg|0|74|8|19|7|0|
INDOMAL|15 mg/5ml / 90 mg/5ml|2|74|8|19|7|0|
INDOMOL HD|80 mg / 480 mg|0|74|8|19|7|0|
INDPRO|30 mg|1|578|2|19|7|0|
INZEE|5 mg/5ml|2|252|4|19|7|0|
INZEE|10 mg|0|252|4|19|7|0|
IRNAZIN|5 mg|0|584|4|19|7|0|
LINTRE|100 mg|0|800|10|19|7|0|
LINTRE|50 mg|0|800|10|19|7|0|
LOTUS||2|41|7|19|7|0|
LUDIOMIL|10 mg|0|614|10|19|7|0|
LUDIOMIL|25 mg|0|614|10|19|7|0|
MAXPAN|200 mg|0|245|0|19|7|0|
MAXPAN|200 mg|1|245|0|19|7|0|
MAXPAN|400 mg|1|245|0|19|7|0|
MAXPAN|100 mg/5ml|2|245|0|19|7|0|
MAXPAN|200 mg/5ml|2|245|0|19|7|0|
METOCLON|1 mg/ml|3|638|2|19|7|0|
METOCLON|5 mg/5ml|2|638|2|19|7|0|
METOCLON|10 mg|0|638|2|19|7|0|
MILAM|7.5 mg|0|643|10|19|7|0|
MISARTAN|20 mg|0|830|3|19|7|0|
MISARTAN|40 mg|0|830|3|19|7|0|
MISARTAN -H|40 mg / 12.5 mg|0|831|3|19|7|0|
MOB|400 mg|0|651|0|19|7|0|
NILCOSYN|7.5 mg|0|688|10|19|7|0|
NIXPRO|40 mg|1|706|2|19|7|0|
OEM||5|502|14|19|7|0|
OEM||2|502|14|19|7|0|
OFLOX|200 mg|0|686|0|19|7|0|
OFLOX|400 mg|0|686|0|19|7|0|
PENTAZOGON|25 mg|0|717|1|19|7|0|
PLUC||5|98|5|19|7|0|
PLUC PLUS||5|86|5|19|7|0|
POVEX|10% w/v|4|745|6|19|7|0|
SNOLIP|10 mg|0|127|3|19|7|0|
SNOLIP|20 mg|0|127|3|19|7|0|
STARLEV|250 mg|0|585|0|19|7|0|
STARLEV|500 mg|0|585|0|19|7|0|
TOFRANIL|25 mg|0|543|10|19|7|0|
VERICEF|250 mg|1|251|0|19|7|0|
VERICEF|500 mg|1|251|0|19|7|0|
VERICEF|125 mg/5ml|2|251|0|19|7|0|
VERICEF|250 mg/5ml|2|251|0|19|7|0|
XED|250 mg|1|857|15|19|7|0|
XED|500 mg|1|857|15|19|7|0|
XIDIC|500 mg|0|659|0|19|7|0|
Z-NEST|0.5 mg|0|25|10|19|7|0|
ZINKUP|10 mg/5ml|2|885|5|19|7|0|
ZINKUP OD|20 mg|2|883|5|19|7|0|
ACETOPRIL|25 mg|0|226|3|36|7|0|
ACNOT|2 mg / 0.035 mg|0|326|6|36|7|0|
ADICOS|32 mg/5ml / 30 mg/5ml / 8 mg/5ml / 0.98 mg/5ml|2|41|7|36|7|0|
ADICOS-M|6.25 mg/5ml / 14 mg/5ml / 175 mg/5ml / 22.5 mg/5ml|2|345|7|36|7|0|
ALMAGEL|200 mg/5ml / 200 mg/5ml / 25 mg/5ml|2|32|2|36|7|0|
AMDAQUIN|150 mg|0|62|8|36|7|0|
AMDAQUIN|150 mg/5ml|2|62|8|36|7|0|
ANGILINGUAL|0.5 mg|0|504|3|36|7|0|
ANTAZOLINE|50 mg|0|70|4|36|7|0|
ARLUFA|20 mg / 120 mg|0|74|8|36|7|0|
ARTESUL||0|77|8|36|7|0|
ASPIDIS|300 mg|0|120|1|36|7|0|
ASPISAFE|150 mg|0|120|3|36|7|0|
ASPISAFE|75 mg|0|120|3|36|7|0|
ASTHOTIFEN|1 mg/5ml|2|567|4|36|7|0|
ASTHOTIFEN|1 mg|0|567|4|36|7|0|
ATENOLOL|100 mg|0|124|3|36|7|0|
BAMBUZAF|5 mg/5ml|2|143|12|36|7|0|
BAMBUZAF|10 mg|0|143|12|36|7|0|
BECLO SAL|100 mcg/actu / 50 mcg/actu|6|10|12|36|7|0|
BETADIP|0.05% w/w|4|156|6|36|7|0|
CARDACE|5 mg|0|397|3|36|7|0|
CARDACE|10 mg|0|397|3|36|7|0|
CARDACE-H||0|398|3|36|7|0|
CEFORAL-3|400 mg|1|245|0|36|7|0|
CEFORAL-3|100 mg/5ml|2|245|0|36|7|0|
CEPHAGEN-1|250 mg|1|251|0|36|7|0|
CEPHAGEN-1|500 mg|1|251|0|36|7|0|
CEPHAGEN-1|125 mg/5ml|2|251|0|36|7|0|
CEPHAGEN-1|250 mg/5ml|2|251|0|36|7|0|
CEPHGEN-1|250 mg|1|251|0|36|7|0|
CEPHGEN-1|500 mg|1|251|0|36|7|0|
CEPHGEN-1|125 mg/5ml|2|251|0|36|7|0|
CLOTRIM|1% w/w|4|301|6|36|7|0|
CLOTRIM|1% w/v|4|301|6|36|7|0|
CLOXAZAN|250 mg|1|304|0|36|7|0|
CLOXAZAN|500 mg|1|304|0|36|7|0|
CLOXAZAN|125 mg/5ml|2|304|0|36|7|0|
CLOXAZAN|250 mg/5ml|2|304|0|36|7|0|
CO-ESTROGEN|0.625 mg|0|417|13|36|7|0|
CODLI AD|60 IU / 600 IU / 0.2 mg|1|202|5|36|7|0|
COLEZAF|10 mg|0|127|3|36|7|0|
COLEZAF|20 mg|0|127|3|36|7|0|
COLOSTIN|20 mg|0|605|3|36|7|0|
CPZAF|250 mg|0|280|0|36|7|0|
CPZAF|500 mg|0|280|0|36|7|0|
CROTAN|10% w/w|4|311|6|36|7|0|
DAMOPRES|25 mg|0|374|3|36|7|0|
DAMOPRES|100 mg|0|374|3|36|7|0|
DEBRIDAT|24 mg/5ml|2|864|2|36|7|0|
DEBRIDAT|100 mg|0|864|2|36|7|0|
DEBRIDAT|200 mg|0|864|2|36|7|0|
DESOFAM||0|332|13|36|7|0|
DIAB-TUS|250 mg|0|268|9|36|7|0|
DICLOKALIUM|50 mg|0|355|1|36|7|0|
DICLOZAF|100 mg|0|356|1|36|7|0|
DICLOZAF|50 mg|0|356|1|36|7|0|
DICLOZAF|25 mg|0|356|1|36|7|0|
DICLOZAF|1% w/w|4|356|1|36|7|0|
DIGLYTA|15 mg|0|731|9|36|7|0|
DIGLYTA|30 mg|0|731|9|36|7|0|
DIGLYTA PLUS|500 mg / 15 mg|0|629|9|36|7|0|
DILTIAZAF|30 mg|0|366|3|36|7|0|
DILTIAZAF|60 mg|0|366|3|36|7|0|
DILTIAZAF|90 mg|0|366|3|36|7|0|
DIROGEST|10 mg|0|391|13|36|7|0|
DIUZA|25 mg|0|514|3|36|7|0|
DOXYCYCLINE|100 mg|1|384|0|36|7|0|
EMKIT|0.75 mg|0|586|13|36|7|0|
EMKIT-DS|1.5 mg|0|586|13|36|7|0|
ENOXAZAN|400 mg|1|399|0|36|7|0|
EPIZEP|0.25% w/v|3|298|10|36|7|0|
EPIZEP|2 mg|0|298|10|36|7|0|
EPIZEP|0.5 mg|0|298|10|36|7|0|
ERGOVAS-3|1 mg/ml|2|306|10|36|7|0|
ERIMIN|3 mg|0|679|10|36|7|0|
ERISPAN|0.25 mg|0|451|10|36|7|0|
FAMILA-28|0.03 mg / 0.15 mg|0|420|13|36|7|0|
FAMILA-28 F|0.03 mg / 0.15 mg|0|420|13|36|7|0|
FAMTAZA|40 mg|0|431|2|36|7|0|
FAMTAZA|20 mg|0|431|2|36|7|0|
FAMTAZA|10 mg/5ml|2|431|2|36|7|0|
FEGURAL||1|440|5|36|7|0|
FIRMOFOS|10 mg|0|16|15|36|7|0|
FIRMOFOS WEEKLY|70 mg|0|16|15|36|7|0|
FLORAMEX|2 mg|1|597|2|36|7|0|
GEL DICLOZAF|1.16% w/w|4|358|1|36|7|0|
GEMZIL|300 mg|1|487|3|36|7|0|
GEMZIL|600 mg|1|487|3|36|7|0|
H2 REC|150 mg|0|775|2|36|7|0|
HEPA-ZAF||1|318|5|36|7|0|
HEXIDYL|2 mg|0|146|10|36|7|0|
HYDRALAZINE|25 mg|0|513|3|36|7|0|
HYDROCORTISONE|1% w/w|4|525|6|36|7|0|
IBUPROFEN|400 mg|0|538|1|36|7|0|
IBUPROFEN|200 mg|0|538|1|36|7|0|
IBUQUIK|200 mg|1|538|1|36|7|0|
IBUQUIK|400 mg|1|538|1|36|7|0|
IBUSOFT|200 mg|1|538|1|36|7|0|
INFECTRAN|400 mg / 80 mg|0|824|0|36|7|0|
KAOLIN PECTIN||2|564|2|36|7|0|
KLEMAT|0.25 mg/5ml|2|290|4|36|7|0|
KLEMAT|1 mg|0|290|4|36|7|0|
KLEMAT|2 mg|0|290|4|36|7|0|
LABETALOL|100 mg|0|571|3|36|7|0|
LACTOZAF SOLUTION|3.35 g/5ml|2|576|2|36|7|0|
LENSOPARF|60% w/w|4|713|6|36|7|0|
LEVOZAF|2.5 mg/5ml|2|584|4|36|7|0|
LISNA|20 mg|0|593|3|36|7|0|
LISNA|5 mg|0|593|3|36|7|0|
LONACORT 0.1%|0.1% w/w|4|860|6|36|7|0|
LOVASTATIN|20 mg|0|605|3|36|7|0|
MACLARA|125 mg/5ml|2|288|0|36|7|0|
MACLARA|250 mg|0|288|0|36|7|0|
MACLARA|500 mg|0|288|0|36|7|0|
MEFACID|250 mg|0|623|1|36|7|0|
MENTONA|0.3 mg / 5 mg|0|635|13|36|7|0|
METRIDA|200 mg/5ml|2|640|0|36|7|0|
METRIDA|200 mg|0|640|0|36|7|0|
METRIDA|400 mg|0|640|0|36|7|0|
MIRTAZEP|15 mg|0|646|10|36|7|0|
MIRTAZEP|30 mg|0|646|10|36|7|0|
MISOCLEAR|200 mcg|0|647|13|36|7|0|
MOLINZA|400 mg|0|651|0|36|7|0|
MONTAZA|5 mg|0|649|12|36|7|0|
MONTAZA|10 mg|0|649|12|36|7|0|
MVEM-21||1|653|5|36|7|0|
NAPTROL|250 mg|0|663|1|36|7|0|
NAPTROL|500 mg|0|663|1|36|7|0|
NARASIS|5 mg|0|622|10|36|7|0|
NEO-K|500 mg|0|741|14|36|7|0|
NEOFE FOLIC|150 mg / 0.5 mg|0|442|5|36|7|0|
NICOSUR|250 mg|0|675|5|36|7|0|
NICOSUR|500 mg|0|675|5|36|7|0|
NIFEDIL|10 mg|1|676|3|36|7|0|
NIFEDIL S.G|10 mg|1|676|3|36|7|0|
NIFEDIL-XL|30 mg|0|676|3|36|7|0|
NIMZA|3 mg|0|679|10|36|7|0|
NITROSUST|2.6 mg|0|504|3|36|7|0|
NITROSUST|6.4 mg|0|504|3|36|7|0|
NOREGYN|5 mg|0|683|13|36|7|0|
OFLOBIOTIC|200 mg|0|686|0|36|7|0|
OFLOBIOTIC|0.3% w/v|3|686|11|36|7|0|
ORAZAF||5|502|14|36|7|0|
ORBACARPINE|2% w/v|3|730|11|36|7|0|
ORBACHLOR|0.5% w/v|3|253|11|36|7|0|
ORBACIN|0.3% w/v|3|850|11|36|7|0|
ORBACLEAR|0.5% w/v / 0.025% w/v|3|71|11|36|7|0|
ORBAFLOUR|0.1% w/v|3|454|11|36|7|0|
ORBALEPH||3|752|11|36|7|0|
ORBAMIDE|10% w/v|3|822|11|36|7|0|
ORBAMIDE|30% w/v|3|822|11|36|7|0|
ORBANAPH|0.025% w/v / 0.3% w/v|3|661|11|36|7|0|
ORBATROL|0.1% w/v / 3500 IU/ml / 6000 IU/ml|3|340|11|36|7|0|
ORBATROL|0.1% w/w / 3500 IU/g / 6000 IU/g|4|340|11|36|7|0|
ORBATROPIN|1% w/v|3|130|11|36|7|0|
ORBETAM|0.1% w/v|3|156|11|36|7|0|
ORBETAM-N|0.1% w/v / 0.5% w/v|3|162|11|36|7|0|
ORBUNOL|0.5% w/v|3|583|11|36|7|0|
OROXIZAF|125 mg/5ml|2|242|0|36|7|0|
OSTAVIR-FLU|75 mg|1|698|7|36|7|0|
PARA 4 KIDZ|120 mg/5ml|2|707|1|36|7|0|
PARA 6+|250 mg/5ml|2|707|1|36|7|0|
PHENIDA|10 mg|0|636|10|36|7|0|
PICOZ|5 mg|0|813|2|36|7|0|
PICOZ|7.5 mg/ml|3|813|2|36|7|0|
PLATAGG-1|75 mg|0|299|3|36|7|0|
POLYZAF|500 IU/g / 10000 IU/g|4|141|6|36|7|0|
PROCHOLIDIN|5 mg|0|758|10|36|7|0|
PROCTOLOG|0.5% w/w / 5.8% w/w|4|792|15|36|7|0|
RUSCORECTAL|0.8% w/w|4|791|15|36|7|0|
S.T MOM|25 mcg|0|647|13|36|7|0|
SERAZYME|5 mg|0|798|1|36|7|0|
SIMVAZAF|10 mg|0|804|3|36|7|0|
SIMVAZAF|20 mg|0|804|3|36|7|0|
SODAZAF||5|285|2|36|7|0|
SORBIMON|20 mg|0|558|3|36|7|0|
STMOM|200 mcg|0|647|13|36|7|0|
STMOM|25 mcg|0|647|13|36|7|0|
TESMIC|0.3 mg/5ml|2|836|12|36|7|0|
TESMIC|2.5 mg|0|836|12|36|7|0|
TIBOPAUSE|2.5 mg|0|843|13|36|7|0|
URIVOX|100 mg|0|446|15|36|7|0|
VADORAL|400 IU / 4000 IU|1|271|5|36|7|0|
VASOLOID|10 mg/ml / 1 mg/ml|2|195|15|36|7|0|
VITALYSINE||2|610|5|36|7|0|
VOFLOZA|250 mg|0|585|0|36|7|0|
VOFLOZA|500 mg|0|585|0|36|7|0|
XYNOSINE|0.1% w/v|9|881|7|36|7|0|
XYNOSINE C.F|0.05% w/v|3|881|7|36|7|0|
YES 2 ZINC||2|885|5|36|7|0|
AIRFLO|10 mg|0|649|12|2|7|0|
AIRFLO|4 mg|0|649|12|2|7|0|
AIRFLO|5 mg|0|649|12|2|7|0|
AMCOBAL|500 mcg|0|621|5|2|7|0|
AMDOXINE|50 mg|0|766|5|2|7|0|
AMFAX|37.5 mg|0|875|10|2|7|0|
AMFAX|50 mg|0|875|10|2|7|0|
AMFAX XR|75 mg|0|875|10|2|7|0|
AMLAT|10 mg / 20 mg|0|47|3|2|7|0|
AMLAT|5 mg / 10 mg|0|47|3|2|7|0|
AMLAT|5 mg / 20 mg|0|47|3|2|7|0|
AMSOLIDE|100 mg|0|678|1|2|7|0|
AMSONEX||2|576|2|2|7|0|
AMSOS|5 mg|0|788|3|2|7|0|
AMSOS|10 mg|0|788|3|2|7|0|
AMSOS|20 mg|0|788|3|2|7|0|
AMSOS|40 mg|0|788|3|2|7|0|
AXAL|0.25 mg|0|25|10|2|7|0|
AXAL|0.5 mg|0|25|10|2|7|0|
AXAL|1 mg|0|25|10|2|7|0|
CARDRIN|75 mg|0|120|3|2|7|0|
CARDRIN|150 mg|0|120|3|2|7|0|
CIPROX|100 mg|0|280|0|2|7|0|
CIPROX|250 mg|0|280|0|2|7|0|
CIPROX|500 mg|0|280|0|2|7|0|
CIPROX|750 mg|0|280|0|2|7|0|
COTECXIN|60 mg|0|75|8|2|7|0|
DISKIN|500 mg|1|350|2|2|7|0|
ESOMEPRAL|20 mg|1|412|2|2|7|0|
ESOMEPRAL|40 mg|1|412|2|2|7|0|
EZETIN|10 mg / 10 mg|0|429|3|2|7|0|
EZETIN|10 mg / 20 mg|0|429|3|2|7|0|
EZETIN|10 mg / 40 mg|0|429|3|2|7|0|
EZETIN|10 mg / 80 mg|0|429|3|2|7|0|
FAMCIVIR|500 mg|0|430|15|2|7|0|
FAMOTID|40 mg|0|431|2|2|7|0|
FEFAN|150 mg / 0.5 mg|0|439|5|2|7|0|
FORO-B12||2|315|5|2|7|0|
GEMAN|320 mg|0|488|0|2|7|0|
GLIMER|1 mg|0|494|9|2|7|0|
GLIMER|2 mg|0|494|9|2|7|0|
GLIMER|3 mg|0|494|9|2|7|0|
GLIMER|4 mg|0|494|9|2|7|0|
INVENTIVE|12.5 mg/5ml|2|368|7|2|7|0|
INVENTIVE|25 mg/5ml|3|368|7|2|7|0|
MAXISES|75 mg|0|299|3|2|7|0|
MYCONIL|100000 IU/ml|3|685|0|2|7|0|
MYCONIL|100000 IU|7|685|13|2|7|0|
NEO-COTECXIN|20 mg / 120 mg|0|74|8|2|7|0|
NEO-COTECXIN|40 mg / 240 mg|0|74|8|2|7|0|
NEO-COTECXIN|80 mg / 480 mg|0|74|8|2|7|0|
NEO-COTECXIN|15 mg/5ml / 90 mg/5ml|2|74|8|2|7|0|
NEO-COTECXIN FORTE|40 mg / 240 mg|0|74|8|2|7|0|
NEWMAC|250 mg|0|288|0|2|7|0|
NEWMAC|500 mg|0|288|0|2|7|0|
NEWMAC|125 mg/5ml|2|288|0|2|7|0|
NICAPRESS-R|40 mg|0|670|3|2|7|0|
OMEPRAL|20 mg|1|691|2|2|7|0|
ORAZINC|10 mg/5ml|2|885|5|2|7|0|
ORAZINC|20 mg/5ml|2|885|5|2|7|0|
ORAZINC|20 mg|0|885|5|2|7|0|
PHENOBAR|30 mg|0|722|10|2|7|0|
PRASU|5 mg|0|748|3|2|7|0|
PRASU|10 mg|0|748|3|2|7|0|
PYRICAM|10 mg|1|735|1|2|7|0|
PYRICAM|20 mg|1|735|1|2|7|0|
RANDRIN|500 mg|0|499|15|2|7|0|
SECNIM|500 mg|0|796|0|2|7|0|
SECNIM|1 g|0|796|0|2|7|0|
SECNIM|500 mg/30ml|2|796|0|2|7|0|
SINDA-MP||0|76|8|2|7|0|
SINDAM|25 mg / 500 mg|0|768|8|2|7|0|
VESPIN|5 mg|0|46|3|2|7|0|
VIDA||0|654|5|2|7|0|
AMLOTIN|10 mg / 10 mg|0|47|3|32|7|0|
AMLOTIN|10 mg / 20 mg|0|47|3|32|7|0|
AMLOTIN|5 mg / 10 mg|0|47|3|32|7|0|
ANEMIX||3|552|5|32|7|0|
ANEMIX||2|552|5|32|7|0|
ANGIPIN|10 mg|0|46|3|32|7|0|
ANGIPIN|5 mg|0|46|3|32|7|0|
ARTICAM|7.5 mg|0|625|1|32|7|0|
ARTICAM|15 mg|0|625|1|32|7|0|
ARTIFLEX|200 mg|1|249|1|32|7|0|
BANISH|100 mg/10ml|2|277|2|32|7|0|
BLUDOL|100 mg/5ml|2|538|1|32|7|0|
BLUDOL|200 mg|0|538|1|32|7|0|
BLUDOL|400 mg|0|538|1|32|7|0|
BROLITE|3 mg|0|181|10|32|7|0|
BRONKEEZ|4 mg|0|649|12|32|7|0|
BRONKEEZ|5 mg|0|649|12|32|7|0|
BRONKEEZ|10 mg|0|649|12|32|7|0|
CARVILOL|62.5 mg|0|240|3|32|7|1|
CARVILOL|25 mg|0|240|3|32|7|0|
CEFGARD|250 mg|1|241|0|32|7|0|
CEFGARD|500 mg|1|241|0|32|7|0|
CEFGARD|50 mg/ml|3|241|0|32|7|0|
CEFGARD|125 mg/5ml|2|241|0|32|7|0|
CEFIDOX|40 mg/5ml|2|246|0|32|7|0|
CEFIDOX|100 mg|0|246|0|32|7|0|
CEFIX|100 mg/5ml|2|245|0|32|7|0|
CEFIX|200 mg/5ml|2|245|0|32|7|0|
CEFIX|200 mg|1|245|0|32|7|0|
CEFIX|400 mg|1|245|0|32|7|0|
CEPHINOL||2|769|10|32|7|0|
CISEC|20 mg|1|691|2|32|7|0|
CISEC|40 mg|1|691|2|32|7|0|
CITROGESIC||0|697|1|32|7|0|
COLDREX|1 mg/5ml / 15 mg/5ml / 325 mg/5ml|2|261|7|32|7|1|
COLDREX|10 mg / 325 mg / 1 mg|0|347|7|32|7|1|
COLDREX-E|32 mg/5ml / 30 mg/5ml / 8 mg/5ml / 0.98 mg/5ml|2|41|7|32|7|0|
CURITOL|200 mg|0|686|0|32|7|0|
CURITOL|400 mg|0|686|0|32|7|0|
D-TONE|2 mg|0|849|1|32|7|0|
DELIP|10 mg|0|127|3|32|7|0|
DELIP|20 mg|0|127|3|32|7|0|
DEPHLOG|275 mg|0|663|1|32|7|0|
DEPHLOG|550 mg|0|663|1|32|7|0|
DISTOL|50 mg / 200 mcg|0|357|1|32|7|0|
DOPNIL|10 mg|0|252|4|32|7|0|
DOPNIL|5 mg/5ml|2|252|4|32|7|0|
DYNAMIN-V||0|653|5|32|7|0|
EEZIT|10 mg|0|428|3|32|7|0|
ELAXINE|15 mg|0|646|10|32|7|0|
ELAXINE|30 mg|0|646|10|32|7|0|
ESCILAM|10 mg|0|411|10|32|7|0|
ESCILAM|20 mg|0|411|10|32|7|0|
FENKIL|20 mg|0|833|1|32|7|0|
HISIS|20 mg|0|431|2|32|7|0|
HISIS|40 mg|0|431|2|32|7|0|
LACTOSOLE||2|576|2|32|7|0|
LAREX|100 mg/5ml|2|8|8|32|7|0|
LAREX|200 mg|0|8|8|32|7|0|
LEVRA|500 mg|0|582|10|32|7|0|
LICET|5 mg|0|584|4|32|7|0|
LICIT|5 mg|0|584|4|32|7|0|
LITH|400 mg|0|594|10|32|7|0|
LOMOGIN|25 mg|0|577|10|32|7|0|
LOMOGIN|50 mg|0|577|10|32|7|0|
LOMOGIN|100 mg|0|577|10|32|7|0|
LOPROS|1 mg|0|834|3|32|7|0|
LOPROS|2 mg|0|834|3|32|7|0|
LOPROS|5 mg|0|834|3|32|7|0|
LOREL|5 mg/5ml|2|598|4|32|7|0|
LOREL|10 mg|0|598|4|32|7|0|
MEFENAMIC ACID|250 mg|0|623|1|32|7|0|
MEPHAGE|500 mg|0|628|9|32|7|0|
MONOCOR|5 mg|0|176|3|32|7|0|
MONOCOR|10 mg|0|176|3|32|7|0|
MOTAAR|100 mg|0|356|1|32|7|0|
MOTAAR|50 mg|0|356|1|32|7|0|
MOTAAR|2% w/w|4|356|1|32|7|0|
MOTAAR DISPERSIBLE|50 mg|0|359|1|32|7|0|
NERVEX|100 mg|0|484|10|32|7|0|
NERVEX|300 mg|0|484|10|32|7|0|
NERVEX|400 mg|0|484|10|32|7|0|
NERVEX|600 mg|0|484|10|32|7|0|
NEUXAM|0.25 mg|0|25|10|32|7|0|
NEUXAM|0.5 mg|0|25|10|32|7|0|
NEUXAM|1 mg|0|25|10|32|7|0|
NIKAL|500 mcg|0|621|5|32|7|0|
NIRVANOL|5 mg|0|688|10|32|7|0|
NIRVANOL|10 mg|0|688|10|32|7|0|
NODIBET|30 mg|0|493|9|32|7|0|
NODIBET|80 mg|0|493|9|32|7|0|
NORMIPIL|1.25 mg|0|774|3|32|7|0|
NORMIPIL|2.5 mg|0|774|3|32|7|0|
NORMIPIL|5 mg|0|774|3|32|7|0|
NORMIPIL|10 mg|0|774|3|32|7|0|
OMEPLUS|20 mg|1|412|2|32|7|0|
OMEPLUS|40 mg|1|412|2|32|7|0|
OPERAZOL|40 mg|0|706|2|32|7|0|
OPHEN|100 mg|0|1|1|32|7|0|
OSTEONIL|60 mg|0|773|13|32|7|0|
PATIN||0|715|10|32|7|0|
PRONIL|500 mg/30ml|2|796|0|32|7|0|
PRONIL|500 mg|0|796|0|32|7|0|
PRONIL|1 g|0|796|0|32|7|0|
PROTOXIL|200 mg/5ml|2|640|0|32|7|0|
PROTOXIL|200 mg|0|640|0|32|7|0|
PROTOXIL|400 mg|0|640|0|32|7|0|
RABOL|20 mg|0|706|2|32|7|0|
RANAX|150 mg|0|775|2|32|7|0|
RANAX|300 mg|0|775|2|32|7|0|
RESQUE|250 mg|1|134|0|32|7|0|
RESQUE|200 mg/5ml|2|134|0|32|7|0|
RIOMED|250 mg|0|288|0|32|7|0|
RIOMED|500 mg|0|288|0|32|7|0|
RIOMED|125 mg/5ml|2|288|0|32|7|0|
ROXICIN|50 mg|0|790|0|32|7|0|
ROXICIN|150 mg|0|790|0|32|7|0|
ROXICIN D|50 mg|0|790|0|32|7|0|
SANJUIS||0|113|5|32|7|0|
SAPRIDE|25 mg|0|587|2|32|7|0|
SAPRIDE|50 mg|0|587|2|32|7|0|
SAPRIDE|100 mg|0|587|2|32|7|0|
SIMB FORTE|10 mg / 20 mg|0|429|3|32|7|0|
SIMIB|10 mg / 10 mg|0|429|3|32|7|0|
SPICAL|327 mg|5|212|5|32|7|0|
SPLASH||5|208|5|32|7|0|
STANFLOX|250 mg|0|585|0|32|7|0|
STANFLOX|500 mg|0|585|0|32|7|0|
STAXIN|400 mg|0|651|0|32|7|0|
SULPHACETAMIDE|20% w/v|3|822|11|32|7|0|
THROMBONIL|75 mg|0|299|3|32|7|0|
THROMBONIL PLUS|75 mg / 75 mg|0|122|3|32|7|0|
UTINOR|400 mg|0|684|0|32|7|0|
VENALAX|37.5 mg|0|875|10|32|7|0|
VENALAX|75 mg|1|875|10|32|7|0|
VETINIL|8 mg|0|155|11|32|7|0|
VETINIL|16 mg|0|155|11|32|7|0|
VEXNIL|50 mg|1|854|1|32|7|0|
VILOC|250 mg|0|280|0|32|7|0|
VILOC|500 mg|0|280|0|32|7|0|
VONDER|20 mg|1|461|10|32|7|0|
XEPAR|20 mg|0|715|10|32|7|0|
ZANAFLEX|2 mg|0|849|1|32|7|0|
AGOLIX|100 mg/5ml|2|383|12|18|7|0|
AGOLIX|400 mg|0|383|12|18|7|0|
BACTICLOR|500 mg|1|250|0|18|7|0|
BROPHYL|125 mg/5ml|2|4|12|18|7|0|
DENTISEPT|0.15% w/v / 0.05% w/v|9|152|15|18|7|0|
DORBID|50 mg|0|355|1|18|7|0|
ETOXIB|60 mg|0|424|1|18|7|0|
LEKRA|250 mg|0|577|10|18|7|0|
LEKRA|500 mg|0|577|10|18|7|0|
LINZAP|5 mg|0|688|10|18|7|0|
LINZAP|10 mg|0|688|10|18|7|0|
LOMAC|20 mg|1|412|2|18|7|0|
LOMAC|40 mg|1|412|2|18|7|0|
NEXBONE|0.25 mcg|0|18|5|18|7|0|
NEXBONE|0.5 mcg|0|18|5|18|7|0|
NIXIN|250 mg|0|280|0|18|7|0|
OLOFT|100 mg|0|800|10|18|7|0|
OSICOM-D|830 mg|2|699|5|18|7|0|
QUTENZA|25 mg|0|770|10|18|7|0|
QUTENZA|100 mg|0|770|10|18|7|0|
QUTENZA|200 mg|0|770|10|18|7|0|
RECITA|10 mg|0|411|10|18|7|0|
SLORIT|2.5 mg/5ml|2|329|4|18|7|0|
SLORIT|5 mg|0|329|4|18|7|0|
VOMIPREG|10 mg / 10 mg|0|385|13|18|7|0|
CARDIOLITE|25 mg|0|124|3|8|7|0|
CARDIOLITE|50 mg|0|124|3|8|7|0|
CARDIOLITE|100 mg|0|124|3|8|7|0|
CONTIMYCIN|100 mg|1|384|0|8|7|0|
INFLAMATIX|100 mg|0|464|1|8|7|0|
LORIN-NSA|5 mg/5ml|2|598|4|8|7|0|
LORIN-NSA|10 mg|0|598|4|8|7|0|
MACROBAC|250 mg|1|134|0|8|7|0|
MACROBAC||0|134|0|8|7|0|
MOXIBACT|400 mg|0|651|0|8|7|0|
VASCLEAR|10 mg|0|127|3|8|7|0|
VASCLEAR|20 mg|0|127|3|8|7|0|
VOREN|50 mg|1|356|1|8|7|0|
VOREN|25 mg|0|356|1|8|7|0|
VOREN|50 mg|0|356|1|8|7|0|
ZEPRES|5 mg|0|397|3|8|7|0|
ZEPRES|10 mg|0|397|3|8|7|0|
ZEPRES|20 mg|0|397|3|8|7|0|
ZEPRES PLUS|10 mg|0|397|3|8|7|0|
ZOLBI|20 mg|1|691|2|8|7|0|
ZOLBI|40 mg|1|691|2|8|7|0|
ALBENDOL||0|8|8|33|7|0|
ALPHACIP|250 mg|0|280|0|33|7|0|
ALPHACIP|500 mg|0|280|0|33|7|0|
CITOPRAM SYRUP|10 mg/5ml|2|283|10|33|7|0|
CITOPRAM SYRUP|40 mg/ml|2|283|10|33|7|0|
FEVONOR|80 mg/0.8ml|3|707|1|33|7|0|
FEVONOR|120 mg/5ml|2|707|1|33|7|0|
FEVONOR PLUS|250 mg/5ml|2|707|1|33|7|0|
HEPACURE||2|552|5|33|7|0|
LODINE|75 mg|0|299|3|33|7|0|
MONOKAST|5 mg|0|649|12|33|7|0|
MONOKAST|10 mg|0|649|12|33|7|0|
OSMOLAX|3.35 g/5ml|2|576|2|33|7|0|
SYFENAC|50 mg|0|355|1|33|7|0|
VEXOR-XR|75 mg|0|875|10|33|7|0|
VISOCEPH|250 mg|1|251|0|33|7|0|
VISOCEPH|500 mg|1|251|0|33|7|0|
VISOCEPH|125 mg/5ml|2|251|0|33|7|0|
VISOCEPH|250 mg/5ml|2|251|0|33|7|0|
VISOFLOX|200 mg|0|686|0|33|7|0|
VISOFLOX|400 mg|0|686|0|33|7|0|
ACTIGEM|320 mg|0|488|0|10|8|0|
ACYLEX|5% w/w|4|6|6|10|8|0|
ACYLEX|200 mg/5ml|2|6|6|10|8|0|
ACYLEX|200 mg|0|6|6|10|8|0|
ACYLEX|400 mg|0|6|6|10|8|0|
ACYLEX|800 mg|0|6|6|10|8|0|
AMEZOLE|200 mg/5ml|2|640|0|10|8|0|
AMEZOLE|200 mg|0|640|0|10|8|0|
AMEZOLE|400 mg|0|640|0|10|8|0|
AMMONIUM CHLORIDE|100 mg/5ml|2|55|7|10|8|0|
ATENORM|50 mg|0|124|3|10|8|0|
ATENORM|100 mg|0|124|3|10|8|0|
AURORA|5 mg|0|788|3|10|8|0|
AURORA|10 mg|0|788|3|10|8|0|
AURORA|20 mg|0|788|3|10|8|0|
AURORA|40 mg|0|788|3|10|8|0|
BECODON-L||2|112|5|10|8|0|
BENZYL BENZOATE|25% w/v|4|153|6|10|8|0|
BISACODYL|5 mg|0|173|2|10|8|0|
BRONOCHOL||2|58|7|10|8|0|
CALIPTROL|10 mg|0|127|3|10|8|0|
CALIPTROL|20 mg|0|127|3|10|8|0|
CALIPTROL|40 mg|0|127|3|10|8|0|
CARMINATIVE MIXTURE||2|286|2|10|8|0|
CARVEDA|6.25 mg|0|240|3|10|8|0|
CARVEDA|12.5 mg|0|240|3|10|8|0|
CARVEDA|25 mg|0|240|3|10|8|0|
CEFAPRO|250 mg|1|251|0|10|8|0|
CEFAPRO|500 mg|1|251|0|10|8|0|
CEFAPRO|125 mg/5ml|2|251|0|10|8|0|
CEFAPRO|250 mg/5ml|2|251|0|10|8|0|
CEFLIN|100 mg/ml|3|250|0|10|8|0|
CEFLIN|125 mg/5ml|2|250|0|10|8|0|
CEFLIN|250 mg/5ml|2|250|0|10|8|0|
CEFLIN|250 mg|0|250|0|10|8|0|
CEFLIN|500 mg|0|250|0|10|8|0|
CELESTA|20 mg|0|283|10|10|8|0|
CIMET|100 mg/10ml|2|277|2|10|8|0|
CIMET|400 mg|0|277|2|10|8|0|
CLARION|125 mg/5ml|2|288|0|10|8|0|
CLARION|250 mg|0|288|0|10|8|0|
CLARION|500 mg|0|288|0|10|8|0|
CLARION XR|500 mg|0|288|0|10|8|0|
CLOPID|75 mg|0|299|3|10|8|0|
CLOPID ASP||0|122|3|10|8|0|
COMBITROL|10 mg / 10 mg|0|47|3|10|8|0|
COMBITROL|10 mg / 20 mg|0|47|3|10|8|0|
DIABETRON|80 mg|0|493|9|10|8|0|
DTZ|30 mg|0|366|3|10|8|0|
DTZ|60 mg|0|366|3|10|8|0|
DYNETIC|50 mg|0|561|2|10|8|0|
ERITHRIN|200 mg/5ml|2|407|0|10|8|0|
ERITHRIN|250 mg|0|407|0|10|8|0|
ERITHRIN|500 mg|0|407|0|10|8|0|
EXEMET|1 mg / 500 mg|0|495|9|10|8|0|
EXEMET|2 mg / 500 mg|0|495|9|10|8|0|
FEROCOL-D||2|57|7|10|8|0|
FEROLYTEL||5|502|14|10|8|0|
FLOSURE|0.4 mg|0|828|15|10|8|0|
FURADIN|50 mg|0|682|0|10|8|0|
FURADIN|100 mg|0|682|0|10|8|0|
GENESIS|1 mg|0|445|6|10|8|0|
GYRASID|200 mg|0|686|0|10|8|0|
H2F|20 mg|0|431|2|10|8|0|
H2F|40 mg|0|431|2|10|8|0|
HELICURE||0|289|2|10|8|0|
HYDROSONE|1% w/w|4|525|6|10|8|0|
HYDROSONE|2% w/w|4|525|6|10|8|0|
ICON|100 mg|1|562|6|10|8|0|
ISOBID|10 mg|0|557|3|10|8|0|
LEVO|250 mg|0|585|0|10|8|0|
LEVO|500 mg|0|585|0|10|8|0|
LORMAX|10 mg|0|598|4|10|8|0|
MALAVAR|20 mg / 120 mg|0|74|8|10|8|0|
MALAVAR|40 mg / 240 mg|0|74|8|10|8|0|
MALAVAR|15 mg/5ml / 90 mg/5ml|2|74|8|10|8|0|
MALAVAR DISPERSIBLE|20 mg / 120 mg|0|74|8|10|8|0|
MAXIFLO|0.2 mg|1|828|15|10|8|0|
MEPON|50 mg/5ml|2|623|1|10|8|0|
MEPON|250 mg|0|623|1|10|8|0|
MOTILEX|25 mcg / 2.5 mg|0|131|2|10|8|0|
NEO CORT|1% w/w / 0.5% w/w|4|527|6|10|8|0|
NEOPAM|2 mg|0|353|10|10|8|0|
NEOPAM|5 mg|0|353|10|10|8|0|
NITROSID|500 mcg|0|504|3|10|8|0|
OCTIL-S|200 mg/5ml / 40 mg/5ml|2|824|0|10|8|0|
OCTIL-S|400 mg/5ml / 80 mg/5ml|2|824|0|10|8|0|
OCTIL-S|400 mg / 80 mg|0|824|0|10|8|0|
OCTIL-S|800 mg / 160 mg|0|824|0|10|8|0|
OMEGA|20 mg|1|691|2|10|8|0|
OMEGA|40 mg|1|691|2|10|8|0|
OMEGA|20 mg / 1100 mg|1|692|2|10|8|0|
OMEGA|40 mg / 1100 mg|1|692|2|10|8|0|
OMEGA RAPID|20 mg/Sachet / 1680 mg/Sachet|5|692|2|10|8|0|
OMEGA RAPID|40 mg/Sachet / 1680 mg/Sachet|5|692|2|10|8|0|
ORION|10 mg|0|689|3|10|8|0|
ORION|20 mg|0|689|3|10|8|0|
ORION|40 mg|0|689|3|10|8|0|
ORION CA|5 mg / 20 mg|0|51|3|10|8|0|
ORION CA|5 mg / 40 mg|0|51|3|10|8|0|
ORION CA|10 mg / 20 mg|0|51|3|10|8|0|
ORION CA|10 mg / 40 mg|0|51|3|10|8|0|
ORION DIU|12.5 mg / 20 mg|0|519|3|10|8|0|
ORLIS|120 mg|1|695|15|10|8|0|
PEDIFEN|100 mg/5ml|2|538|1|10|8|0|
PHENOBARBITONE|30 mg|0|722|10|10|8|0|
PIPENZOLATE||3|718|2|10|8|0|
PLATEX|75 mg|0|299|3|10|8|0|
PREZENT|5 mg|0|748|3|10|8|0|
PREZENT|10 mg|0|748|3|10|8|0|
PROFEN|200 mg|0|538|1|10|8|0|
PROFEN|400 mg|0|538|1|10|8|0|
PROFEN|600 mg|0|538|1|10|8|0|
PROFLOX|250 mg|0|280|0|10|8|0|
PROFLOX|500 mg|0|280|0|10|8|0|
QUENCH|1% w/w|4|801|6|10|8|0|
RANIDIN|150 mg|0|775|2|10|8|0|
RIFAXA|200 mg|0|781|0|10|8|0|
SALAZODINE|500 mg|0|825|2|10|8|0|
SITAGEN|25 mg|0|805|9|10|8|0|
SITAGEN|50 mg|0|805|9|10|8|0|
SITAGEN|100 mg|0|805|9|10|8|0|
SITAGEN-M|500 mg / 50 mg|0|631|9|10|8|0|
STABIL|5 mg|0|757|2|10|8|0|
ULTRAHEAT RUB||4|425|1|10|8|0|
XAVOR|50 mg|0|603|3|10|8|0|
XAVOR-DIU|12.5 mg / 50 mg|0|518|3|10|8|0|
XAVOR-FORTE|25 mg / 100 mg|0|518|3|10|8|0|
ZENITH|0.25 mg|0|25|10|10|8|0|
ZENITH|0.5 mg|0|25|10|10|8|0|
ZENITH|1 mg|0|25|10|10|8|0|
ZINXUS|10 mg/5ml|2|885|5|10|8|0|
ZINXUS|10 mg|0|885|5|10|8|0|
ZINXUS|20 mg|0|885|5|10|8|0|
ARSOFIN||0|357|1|21|8|0|
BIPROFIN|50 mg|0|464|1|21|8|0|
BIPROFIN|100 mg|0|464|1|21|8|0|
BON-ONE|0.5 mcg|0|18|5|21|8|0|
BONALFA|2 mcg/g|4|827|6|21|8|0|
BUTICEF|40 mg/5ml|2|246|0|21|8|0|
BUTICEF|100 mg|0|246|0|21|8|0|
CAL-ONE|177.6 mg / 82.2 mg|0|210|5|21|8|0|
CAL-ONE-D||0|208|5|21|8|0|
CALONED||2|213|5|21|8|0|
CALONED||0|213|5|21|8|0|
CANDITENSIN|4 mg|0|223|3|21|8|0|
CANDITENSIN|8 mg|0|223|3|21|8|0|
CANDITENSIN|32 mg|0|223|3|21|8|0|
COVATINE|50 mg|0|225|10|21|8|0|
DIATROL|1 mg|0|494|9|21|8|0|
DIATROL|2 mg|0|494|9|21|8|0|
DIATROL|3 mg|0|494|9|21|8|0|
DIATROL|4 mg|0|494|9|21|8|0|
DIFLODERM||4|361|6|21|8|0|
DINESTIN||0|329|4|21|8|0|
DOWCEF|125 mg|0|248|0|21|8|0|
DOWCEF|250 mg|0|248|0|21|8|0|
DOWCEF|125 mg/5ml|2|248|0|21|8|0|
DOWFEN|2.5% w/w|4|566|1|21|8|0|
DOWGLIT|15 mg|0|731|9|21|8|0|
DOWGLIT|30 mg|0|731|9|21|8|0|
DOWGLIT|45 mg|0|731|9|21|8|0|
DOWGUT|15 mg|0|731|9|21|8|0|
DOWGUT|30 mg|0|731|9|21|8|0|
DOWGUT|45 mg|0|731|9|21|8|0|
DRONATE|5 mg|0|782|15|21|8|0|
ESOMAX|20 mg|1|412|2|21|8|0|
ESOMAX|40 mg|1|412|2|21|8|0|
FATRID|10 mg|0|804|3|21|8|0|
FATRID|20 mg|0|804|3|21|8|0|
FELBEX|20 mg|0|736|1|21|8|0|
FEXINOL|60 mg|1|443|4|21|8|0|
FEXINOL|120 mg|0|443|4|21|8|0|
FEXINOL|180 mg|0|443|4|21|8|0|
HIOXYL|1.5% w/w|4|529|6|21|8|0|
INSPRA|4 mg|0|649|12|21|8|0|
INSPRA|5 mg|0|649|12|21|8|0|
INSPRA|10 mg|0|649|12|21|8|0|
LOXATEC|7.5 mg|0|625|1|21|8|0|
LOXATEC|15 mg|0|625|1|21|8|0|
MALCIFER||2|552|5|21|8|0|
MALCIFER||0|552|5|21|8|0|
MALCIFER-F|0.35 mg / 100 mg|0|470|5|21|8|0|
MALCIFER-F|0.35 mg/5ml / 50 mg/5ml|2|470|5|21|8|0|
MOKSECURE|400 mg|0|651|0|21|8|0|
MUSIDIN|2 mg|0|849|1|21|8|0|
MUSIDIN|4 mg|0|849|1|21|8|0|
NEO FANSIDAR|40 mg / 320 mg|1|364|8|21|8|0|
NEO FANSIDAR|15 mg / 120 mg|5|364|8|21|8|0|
NEUTANX|500 mcg|0|621|5|21|8|0|
ORPASE|400 mg|1|245|0|21|8|0|
ORPASE|100 mg/5ml|2|245|0|21|8|0|
ORPASE|200 mg/5ml|2|245|0|21|8|0|
PRELIN|50 mg|1|756|10|21|8|0|
PRELIN|75 mg|1|756|10|21|8|0|
PRELIN|100 mg|1|756|10|21|8|0|
PRELIN|150 mg|1|756|10|21|8|0|
PRELIN|300 mg|1|756|10|21|8|0|
QUINODERM|10% w/w / 0.5% w/w|4|150|6|21|8|0|
RIPLAN|75 mg|0|299|3|21|8|0|
RISPRON|1 mg|0|783|10|21|8|0|
RISPRON|2 mg|0|783|10|21|8|0|
RISPRON|3 mg|0|783|10|21|8|0|
RISPRON|4 mg|0|783|10|21|8|0|
ROSWIN|5 mg|0|788|3|21|8|0|
ROSWIN|10 mg|0|788|3|21|8|0|
ROSWIN|20 mg|0|788|3|21|8|0|
ROXACIN|100 mg|0|790|0|21|8|0|
ROXACIN|150 mg|0|790|0|21|8|0|
ROXACIN|300 mg|0|790|0|21|8|0|
SAFEPRAM|10 mg|0|411|10|21|8|0|
SAFEPRAM|20 mg|0|411|10|21|8|0|
SALVAJ|20 mg / 120 mg|0|74|8|21|8|0|
SALVAJ EEZ|80 mg / 480 mg|0|74|8|21|8|0|
SWENTA|30 mg|1|388|10|21|8|0|
SWENTA|60 mg|1|388|10|21|8|0|
TERBIN|125 mg|0|835|6|21|8|0|
TERBIN|250 mg|0|835|6|21|8|0|
TERBIN|1% w/w|4|835|6|21|8|0|
TESPRAL|50 mg|0|561|2|21|8|0|
TESPRAL OD|150 mg|1|561|2|21|8|0|
UNIPRO|40 mg|0|706|2|21|8|0|
VESULPID|25 mg|0|587|2|21|8|0|
VOIZIN|5 mg|0|584|4|21|8|0|
XANBID|275 mg|0|663|1|21|8|0|
XANBID|550 mg|0|663|1|21|8|0|
AZOLAM|0.25 mg|0|25|10|21|8|0|
AZOLAM|0.5 mg|0|25|10|21|8|0|
AZOLAM|1 mg|0|25|10|21|8|0|
BISOLVON|8 mg|0|183|7|21|8|0|
BUSCOPAN|10 mg|0|534|2|21|8|0|
CANREC|8 mg|0|223|3|21|8|0|
CANREC|16 mg|0|223|3|21|8|0|
CANREC PLUS|16 mg / 12.5 mg|0|224|3|21|8|0|
COSOME||2|263|7|21|8|0|
COSOME E||2|41|7|21|8|0|
DELAX|5 mg|0|173|2|21|8|0|
DEPEX|20 mg|1|461|10|21|8|0|
DEWORM|100 mg|1|615|8|21|8|0|
DEWORM|100 mg/5ml|2|615|8|21|8|0|
DEWORM|500 mg|0|615|8|21|8|0|
DOLO-NEUROBION||0|320|5|21|8|0|
DULCOLAX|5 mg|0|173|2|21|8|0|
ENCEPHABOL|80.5 mg/5ml|2|769|10|21|8|0|
ENCEPHABOL|100 mg|0|769|10|21|8|0|
ESVIN|20 mg|1|412|2|21|8|0|
ESVIN|40 mg|1|412|2|21|8|0|
EXIGENTIN|5 mg/5ml|2|598|4|21|8|0|
EXIGENTIN|10 mg|0|598|4|21|8|0|
FOPSEC|10 mg|0|127|3|21|8|0|
FOPSEC|20 mg|0|127|3|21|8|0|
FOPSEC|40 mg|0|127|3|21|8|0|
GLIOPTIM|1 mg|0|494|9|21|8|0|
GLIOPTIM|2 mg|0|494|9|21|8|0|
GLIOPTIM|3 mg|0|494|9|21|8|0|
GLIOPTIM|4 mg|0|494|9|21|8|0|
GLUCOPHAGE XR|750 mg|0|628|9|21|8|0|
GLUCOVANCE|1.25 mg / 250 mg|0|492|9|21|8|0|
GLUCOVANCE|2.5 mg / 500 mg|0|492|9|21|8|0|
GLUCOVANCE|5 mg / 500 mg|0|492|9|21|8|0|
INFEXIN|250 mg|1|251|0|21|8|0|
INFEXIN|500 mg|1|251|0|21|8|0|
INFEXIN|125 mg/5ml|2|251|0|21|8|0|
INFEXIN|250 mg/5ml|2|251|0|21|8|0|
KLARIBACT|250 mg|0|288|0|21|8|0|
KLARIBACT|500 mg|0|288|0|21|8|0|
KLARIBACT|125 mg/5ml|2|288|0|21|8|0|
LAXOBERON|7.5 mg/ml|3|813|2|21|8|0|
LAXOBERON|5 mg|0|813|2|21|8|0|
LEVOMERC|250 mg|0|585|0|21|8|0|
LEVOMERC|500 mg|0|585|0|21|8|0|
LODOPIN|2.5 mg|0|46|3|21|8|0|
LODOPIN|5 mg|0|46|3|21|8|0|
LODOPIN|10 mg|0|46|3|21|8|0|
MERCIP|250 mg|0|280|0|21|8|0|
MERCIP|500 mg|0|280|0|21|8|0|
MUCOSOLVAN|15 mg/5ml|2|34|7|21|8|0|
MUCOSOLVAN|30 mg/5ml|2|34|7|21|8|0|
MUCOSOLVAN|30 mg|0|34|7|21|8|0|
MULTIBIONTA||1|95|5|21|8|0|
MULTIBIONTA||2|97|5|21|8|0|
MULTIBIONTA-M||1|87|5|21|8|0|
MULTIBIONTA-M||2|94|5|21|8|0|
NEOPROX|250 mg|0|663|1|21|8|0|
NEOPROX|500 mg|0|663|1|21|8|0|
NEUPROFENAC|50 mg|1|356|1|21|8|0|
NEUROFENAC|50 mg|1|356|1|21|8|0|
NEUROGABIN-M|100 mg|1|484|10|21|8|0|
NEUROGABIN-M|300 mg|1|484|10|21|8|0|
NEUROGABIN-M|400 mg|1|484|10|21|8|0|
NEUROMET|500 mcg|0|621|5|21|8|0|
NIDONIL|80 mg|0|493|9|21|8|0|
OMELCID|20 mg|1|691|2|21|8|0|
OPTIFAM|20 mg|0|431|2|21|8|0|
OPTIFAM|40 mg|0|431|2|21|8|0|
OSTEOCUR C||5|98|5|21|8|0|
PAILET|75 mg|0|299|3|21|8|0|
PCAM|10 mg|1|735|1|21|8|0|
PCAM|20 mg|1|735|1|21|8|0|
PCAM|10 mg|0|735|1|21|8|0|
PCAM|20 mg|0|735|1|21|8|0|
PCAM|0.5% w/w|4|735|1|21|8|0|
PERSANTIN|25 mg|0|374|3|21|8|0|
PERSANTIN|100 mg|0|374|3|21|8|0|
POLYBION FORTE C||0|114|5|21|8|0|
POLYBION N||3|172|5|21|8|0|
POLYBION STRONG||0|220|5|21|8|0|
POLYBION Z||1|114|5|21|8|0|
PSYPER|1 mg|0|783|10|21|8|0|
PSYPER|2 mg|0|783|10|21|8|0|
PSYPER|3 mg|0|783|10|21|8|0|
PSYPER|4 mg|0|783|10|21|8|0|
RANULCID|150 mg|0|775|2|21|8|0|
RANULCID|300 mg|0|775|2|21|8|0|
SISTALGIN|2 mg|0|746|2|21|8|0|
SUPRAMYCIN|100 mg|1|384|0|21|8|0|
TERIL|200 mg|0|228|10|21|8|0|
TIZOREL|2 mg|0|849|1|21|8|0|
TIZOREL|4 mg|0|849|1|21|8|0|
VICET|250 mg|0|582|10|21|8|0|
VICET|500 mg|0|582|10|21|8|0|
WHIZIX|4 mg|0|649|12|21|8|0|
WHIZIX|5 mg|0|649|12|21|8|0|
WHIZIX|10 mg|0|649|12|21|8|0|
WINTOGENO||4|426|1|21|8|0|
ARCALION|200 mg|0|820|5|31|9|0|
BI PRETERAX|1.25 mg / 4 mg|0|545|3|31|9|0|
COVERSAM|5 mg / 8 mg|0|52|3|31|9|0|
COVERSAM|5 mg / 4 mg|0|52|3|31|9|0|
COVERSAM|10 mg / 4 mg|0|52|3|31|9|0|
COVERSAM|10 mg / 8 mg|0|52|3|31|9|0|
COVERSYL|8 mg|0|719|3|31|9|0|
COVERSYL|2 mg|0|719|3|31|9|0|
COVERSYL|4 mg|0|719|3|31|9|0|
COVERSYL PLUS|1.25 mg / 4 mg|0|545|3|31|9|0|
DAFLON|450 mg / 50 mg|0|370|15|31|9|0|
DAFLON|150 mg / 50 mg|0|370|15|31|9|0|
DIAMICRON|80 mg|0|493|9|31|9|0|
DUXIL|30 mg / 10 mg|0|24|15|31|9|0|
NATRILIX|2.5 mg|0|544|3|31|9|0|
NATRILIX|1.5 mg|0|544|3|31|9|0|
PRETERAX|0.625 mg / 2 mg|0|545|3|31|9|0|
STABLON|12.5 mg|0|841|10|31|9|0|
TRIVASTAL|0.05 g|0|734|10|31|9|0|
VASTAREL|20 mg|0|865|3|31|9|0|
VASTAREL-MR|35 mg|0|865|3|31|9|0|
ADALAT|10 mg|1|676|3|5|9|0|
ADALAT|5 mg|1|676|3|5|9|0|
ADALAT LA|30 mg|0|676|3|5|9|0|
ADALAT LA|60 mg|0|676|3|5|9|0|
ADALAT RETARD|20 mg|0|676|3|5|9|0|
ADALAT-CC|30 mg|0|676|3|5|9|0|
ADALAT-CC|60 mg|0|676|3|5|9|0|
ADVANTAN|0.1% w/w|4|637|6|5|9|0|
ADVANTAN FATTY|0.1% w/w|4|637|6|5|9|0|
AEROBAY|500 mg|0|585|0|5|9|0|
AEROBAY|750 mg|0|585|0|5|9|0|
AVELOX|400 mg|0|651|0|5|9|0|
BAYCUTEN-N|1% w/w / 0.4% w/w|4|302|6|5|9|0|
BAYDAL|10 mg|0|252|4|5|9|0|
BAYDAL|1 mg/5ml|2|252|4|5|9|0|
BAYMET|500 mg|0|628|9|5|9|0|
BECOZYM FORTE||0|169|5|5|9|0|
BELAIR|5 mg|0|584|4|5|9|0|
BENERVA|100 mg|0|838|5|5|9|0|
BEPANTHEN|5% w/w|4|327|6|5|9|0|
BEPANTHEN PLUS|0.5% w/w / 5% w/w|4|257|6|5|9|0|
BEROCCA||0|84|5|5|9|0|
CANESTEN EXTRA|1% w/w|4|166|6|5|9|0|
CANESTEN VAGINAL|10% w/w|7|301|13|5|9|0|
CANESTEN VAGINAL|500 mg|7|301|13|5|9|0|
CANESTEN VAGINAL|100 mg|7|301|13|5|9|0|
CLIMEN|1 mg / 2 mg|0|325|13|5|9|0|
DIANE-35|2 mg / 35 mcg|0|326|13|5|9|0|
EPHYNAL|100 mg|0|851|5|5|9|0|
GLUCOBAY|50 mg|0|0|9|5|9|0|
GLUCOBAY|100 mg|0|0|9|5|9|0|
GYNO TRAVOGEN|1% w/w|7|556|13|5|9|0|
GYNO TRAVOGEN|300 mg|7|556|13|5|9|0|
INCIDAL|50 mg/5ml|2|618|4|5|9|0|
INCIDAL|50 mg|0|618|4|5|9|0|
INCIDAL-NEO|5 mg/5ml|2|252|4|5|9|0|
INCIDAL-NEO|10 mg|0|252|4|5|9|0|
LITRISON||0|170|5|5|9|0|
MELIANE|0.02 mg / 0.075 mg|0|419|13|5|9|0|
MYCOSPOR|0.01% w/w|4|166|6|5|9|0|
NERISONE|0.1% w/w|4|360|6|5|9|0|
NERISONE FATTY|0.3% w/w|4|360|6|5|9|0|
NERISONE FATTY|0.1% w/w|4|360|6|5|9|0|
NERISONE FORTE|0.3% w/w|4|360|6|5|9|0|
NERISONE-C|1% w/w / 0.1% w/w|4|269|6|5|9|0|
NIMOTOP|30 mg|0|680|3|5|9|0|
NOCTAMID|1000 mcg|0|600|10|5|9|0|
PRIMOLUT N|5 mg|0|683|13|5|9|0|
PROGYLUTON|2 mg / 2 mg / 0.5 mg|0|415|13|5|9|0|
PROGYNOVA|2 mg|0|414|13|5|9|0|
REDOXON|500 mg|0|78|5|5|9|0|
REDOXON|1 g|5|78|5|5|9|0|
RESOCHIN|250 mg|0|258|8|5|9|0|
ROVIGON|30000 IU / 70 mg|0|779|5|5|9|0|
SKINOREN|20% w/w|4|133|6|5|9|0|
SUPRADYN||0|168|5|5|9|0|
SUPRADYN-N||0|81|5|5|9|0|
TEKOPIN|250 mg|0|844|3|5|9|0|
TRAVOCORT|0.1% w/w / 1% w/w|4|361|6|5|9|0|
TRAVOGEN|1% w/w|4|556|6|5|9|0|
ULTRALANUM|0.25% w/w|4|453|6|5|9|0|
XARELTO|15 mg|0|784|3|5|9|0|
XARELTO|20 mg|0|784|3|5|9|0|
XARELTO|10 mg|0|784|3|5|9|0|
YOMESAN|500 mg|0|671|8|5|9|0|
ALDOMET|250 mg|0|634|3|24|9|0|
AMOSTATIN|5 mg / 10 mg|0|47|3|24|9|0|
AMOSTATIN|5 mg / 20 mg|0|47|3|24|9|0|
AMSTATIN|5 mg / 10 mg|0|47|3|24|9|0|
AMSTATIN|5 mg / 20 mg|0|47|3|24|9|0|
ARTRINE|40 mg / 240 mg|0|74|8|24|9|0|
ARTRINE|80 mg / 480 mg|0|74|8|24|9|0|
ARTRINE|20 mg / 120 mg|0|74|8|24|9|0|
AZOUR|500 mg|1|134|0|24|9|0|
AZOUR|250 mg|1|134|0|24|9|0|
C-YALTA|90 mg|1|388|10|24|9|0|
C-YALTA|30 mg|1|388|10|24|9|0|
C-YALTA|60 mg|1|388|10|24|9|0|
CO-NOVATEC|12.5 mg / 20 mg|0|516|3|24|9|0|
CO-RENITEC|10 mg / 25 mg|0|398|3|24|9|0|
COSOPT|2% w/v / 0.5% w/v|3|380|11|24|9|0|
COZAAR|50 mg|0|603|3|24|9|0|
COZAAR|100 mg|0|603|3|24|9|0|
ESILOPRAM|5 mg|0|411|10|24|9|0|
ESILOPRAM|10 mg|0|411|10|24|9|0|
ESILOPRAM|20 mg|0|411|10|24|9|0|
EZETROL|10 mg|0|428|3|24|9|0|
FORTZAAR|25 mg / 100 mg|0|518|3|24|9|0|
FOSAMAX|70 mg|0|16|15|24|9|0|
HYZAAR|12.5 mg / 50 mg|0|518|3|24|9|0|
IKODIL|10 mg|0|672|3|24|9|0|
IKODIL|20 mg|0|672|3|24|9|0|
JANUMET|500 mg / 50 mg|0|631|9|24|9|0|
JANUMET|1 g / 50 mg|0|631|9|24|9|0|
JANUVIA|100 mg|0|805|9|24|9|0|
LANTANON|10 mg|0|641|10|24|9|0|
LANTANON|30 mg|0|641|10|24|9|0|
LIVIAL|2.5 mg|0|843|13|24|9|0|
M-SPAN|200 mg/5ml|2|245|0|24|9|0|
M-SPAN|100 mg/5ml|2|245|0|24|9|0|
M-SPAN|400 mg|1|245|0|24|9|0|
MARVELON|150 mcg / 0.03 mg|0|332|13|24|9|0|
MEDIFILIC||2|552|5|24|9|0|
MEDIFILIC||0|552|5|24|9|0|
MEVACOR|20 mg|0|605|3|24|9|0|
MEZERON|30 mg|0|646|10|24|9|0|
MODURETIC|5 mg / 50 mg|0|38|3|24|9|0|
NEXPRAZOLE|20 mg|1|412|2|24|9|0|
NEXPRAZOLE|40 mg|1|412|2|24|9|0|
NODEP|10 mg|0|411|10|24|9|0|
NODEP|20 mg|0|411|10|24|9|0|
NODEP|5 mg|0|411|10|24|9|0|
NOROXIN|400 mg|0|684|0|24|9|0|
NOVATEC|5 mg|0|593|3|24|9|0|
NOVATEC|10 mg|0|593|3|24|9|0|
OBSAGREL|75 mg / 75 mg|0|122|3|24|9|0|
OBSAGREL PLAIN|75 mg|0|299|3|24|9|0|
OBSONERV|31.25 mg / 200 mg / 125 mg|0|229|10|24|9|0|
OBSONERV|18.75 mg / 200 mg / 75 mg|0|229|10|24|9|0|
OBSONERV|50 mg / 200 mg / 200 mg|0|229|10|24|9|0|
OBSONERV|25 mg / 200 mg / 100 mg|0|229|10|24|9|0|
OBSONERV|37.5 mg / 200 mg / 150 mg|0|229|10|24|9|0|
OBSONERV|12.5 mg / 200 mg / 50 mg|0|229|10|24|9|0|
OBSOPREL|5 mg|0|748|3|24|9|0|
OBSOPREL|10 mg|0|748|3|24|9|0|
ORADEXON|0.5 mg|0|334|15|24|9|0|
ORGALOPAM|1 mg|0|599|10|24|9|0|
ORGALOPAM|2 mg|0|599|10|24|9|0|
ORGAMETRIL|5 mg|0|609|13|24|9|0|
ORGASTRAN|400 mg / 80 mg|0|824|0|24|9|0|
ORGASTRAN FORTE|800 mg / 160 mg|0|824|0|24|9|0|
ORLISAT|120 mg|1|695|15|24|9|0|
OVESTIN|2 mg|0|416|13|24|9|0|
PEPCIDINE|40 mg|0|431|2|24|9|0|
PERIACTIN|4 mg|0|324|4|24|9|0|
PREFAIR|850 mg / 15 mg|0|629|9|24|9|0|
PREFAIR|500 mg / 15 mg|0|629|9|24|9|0|
PROSCAR|5 mg|0|445|15|24|9|0|
REMERON|30 mg|0|646|10|24|9|0|
RENITEC|5 mg|0|397|3|24|9|0|
RENITEC|10 mg|0|397|3|24|9|0|
RENITEC|20 mg|0|397|3|24|9|0|
RINELON|50 mcg/actu|3|648|4|24|9|0|
SIM-EZEE|10 mg / 10 mg|0|429|3|24|9|0|
SIM-EZEE|10 mg / 20 mg|0|429|3|24|9|0|
SIM-EZEE|10 mg / 40 mg|0|429|3|24|9|0|
SINEMET|25 mg / 275 mg|0|230|10|24|9|0|
SINEMET EXTRA|25 mg / 100 mg|0|230|10|24|9|0|
SINEMET EXTRA|50 mg / 100 mg|0|230|10|24|9|0|
SINGULAIR|4 mg|0|649|12|24|9|0|
SINGULAIR|5 mg|0|649|12|24|9|0|
SINGULAIR|10 mg|0|649|12|24|9|0|
SINGULAIR|4 mg/Sachet|5|649|12|24|9|0|
TANTUM|50 mg|1|151|1|24|9|0|
TIMOPTOL|0.25% w/v|3|845|11|24|9|0|
TIMOPTOL|0.5% w/v|3|845|11|24|9|0|
TOLVON|10 mg|0|641|10|24|9|0|
TOLVON|30 mg|0|641|10|24|9|0|
TOMIGRAINE|25 mg|0|853|10|24|9|0|
TOMIGRAINE|50 mg|0|853|10|24|9|0|
TOMIGRAINE|100 mg|0|853|10|24|9|0|
TOMIGRAINE|200 mg|0|853|10|24|9|0|
TRAXYL|250 mg|1|857|15|24|9|0|
TRUSOPT|2% w/v|3|378|11|24|9|0|
TRYPTANOL|25 mg|0|45|10|24|9|0|
TRYPTANOL|10 mg|0|45|10|24|9|0|
U-PROGEST|100 mg|1|759|13|24|9|0|
VICOPIN|500 mcg|0|621|5|24|9|0|
XOVAT|5 mg|0|788|3|24|9|0|
XOVAT|10 mg|0|788|3|24|9|0|
XOVAT|20 mg|0|788|3|24|9|0|
ZOCOR|10 mg|0|804|3|24|9|0|
ZOCOR|20 mg|0|804|3|24|9|0|
ZOCOR|40 mg|0|804|3|24|9|0|
AMARYL M|1 mg / 500 mg|0|495|9|29|9|0|
AMARYL M|2 mg / 500 mg|0|495|9|29|9|0|
AMISPED|10 mg|0|649|12|29|9|0|
AMISPED|4 mg|0|649|12|29|9|0|
AMISPED|5 mg|0|649|12|29|9|0|
ANTRIMA|800 mg / 160 mg|0|823|0|29|9|0|
ANTRIMA|400 mg / 80 mg|0|823|0|29|9|0|
ANTRIMA|200 mg/5ml / 40 mg/5ml|2|823|0|29|9|0|
ARPICILLIN|250 mg|1|67|0|29|9|0|
ARPICILLIN|125 mg/5ml|2|67|0|29|9|0|
ARPIMOX|250 mg|1|64|0|29|9|0|
ARPIMOX|500 mg|1|64|0|29|9|0|
ARPIMOX|125 mg/1.25ml|3|64|0|29|9|0|
ARPIMOX|125 mg/5ml|2|64|0|29|9|0|
ARPIMOX|250 mg/5ml|2|64|0|29|9|0|
ASCABIOL|25% w/v|4|153|6|29|9|0|
DAONIL|5 mg|0|491|9|29|9|0|
DAONIL|5 mg / 500 mg|0|492|9|29|9|0|
DENORAL|0.2 mg/5ml / 0.75 mg/5ml / 2 mg/5ml|2|191|7|29|9|0|
DIAROLYTE FRUIT||5|742|14|29|9|0|
DIAROLYTE ORANGE||5|501|14|29|9|0|
DIAROLYTE RICE||5|744|14|29|9|0|
DOLIPRANE|500 mg|0|707|1|29|9|0|
EPILIM|200 mg|0|814|10|29|9|0|
EPILIM|200 mg/5ml|2|814|10|29|9|0|
ESSENTIALE CAP||1|317|5|29|9|0|
FLAGYL PLUS|125 mg / 100 mg|0|365|8|29|9|0|
FLAGYL PLUS|125 mg/5ml / 100 mg/5ml|2|365|8|29|9|0|
FRISIUM|10 mg|0|292|10|29|9|0|
GARDAN|250 mg|0|623|1|29|9|0|
GARDAN|50 mg/5ml|2|623|1|29|9|0|
GARDAN FORTE|500 mg|0|623|1|29|9|0|
GASTROLYTE||5|744|14|29|9|0|
IDARAC|200 mg|0|448|1|29|9|0|
LARGACTIL|25 mg/5ml|2|267|10|29|9|0|
LARGACTIL|25 mg|0|267|10|29|9|0|
LARGACTIL|50 mg|0|267|10|29|9|0|
LARGACTIL|100 mg|0|267|10|29|9|0|
LASORIDE|5 mg / 40 mg|0|37|3|29|9|0|
MELDERE|20 mg|1|412|2|29|9|0|
MELDERE|40 mg|1|412|2|29|9|0|
NIVAQUIN-P|50 mg/5ml|2|258|8|29|9|0|
NIVAQUIN-P|250 mg|0|258|8|29|9|0|
NO-SPA FORTE|80 mg|0|386|2|29|9|0|
ORELOX|40 mg/5ml|2|246|0|29|9|0|
ORELOX|100 mg|0|246|0|29|9|0|
PEFLACINE|400 mg|0|716|0|29|9|0|
PHENERGAN|25 mg/5ml|2|760|4|29|9|0|
PHENERGAN|25 mg|0|760|4|29|9|0|
PHENSEDYL-P|7.2 mg/5ml / 4 mg/5ml / 3.6 mg/5ml|2|403|7|29|9|0|
PROFENID|200 mg|0|566|1|29|9|0|
PROFENID|100 mg|0|566|1|29|9|0|
PROFENID|2.5% w/w|4|566|1|29|9|0|
RHINATHIOL|250 mg/5ml|2|236|7|29|9|0|
RHINATHIOL|100 mg/5ml|2|236|7|29|9|0|
RHINATHIOL|375 mg|1|236|7|29|9|0|
RHINATHIOL PROMETH||2|237|7|29|9|0|
ROVAMYCIN FORTE|1 g|0|817|0|29|9|0|
ROVAMYCINE|500 mg|0|817|0|29|9|0|
ROXANE|150 mg|0|789|2|29|9|0|
ROXANE|75 mg|0|789|2|29|9|0|
RULID|100 mg|0|790|0|29|9|0|
RULID|150 mg|0|790|0|29|9|0|
RULID|300 mg|0|790|0|29|9|0|
RULID D|50 mg|0|790|0|29|9|0|
SECNIDAL|500 mg/30ml|2|796|8|29|9|0|
SECNIDAL|750 mg/30ml|2|796|8|29|9|0|
SECNIDAL|500 mg|0|796|8|29|9|0|
SECNIDAL FORTE|1 g|0|796|8|29|9|0|
STEMETIL|5 mg|0|757|10|29|9|0|
STILNOX|10 mg|0|888|10|29|9|0|
STILNOX CR|12.5 mg|0|888|10|29|9|0|
STILNOX CR|6.25 mg|0|888|10|29|9|0|
SURGAM|300 mg|0|842|1|29|9|0|
TABALON|100 mg/5ml|2|538|1|29|9|0|
TELFAST|60 mg|0|443|4|29|9|0|
TELFAST|120 mg|0|443|4|29|9|0|
TELFAST|180 mg|0|443|4|29|9|0|
TELFAST-D|60 mg / 120 mg|0|444|7|29|9|0|
TIXYLIX|3.8% v/v / 1.5 mg/5ml / 1.5 mg/5ml|2|15|7|29|9|0|
TRIATEC HCT|12.5 mg / 2.5 mg|0|520|3|29|9|0|
TRIATEC HCT|25 mg / 5 mg|0|520|3|29|9|0|
TRITACE|10 mg|0|774|3|29|9|0|
TRITACE|2.5 mg|0|774|3|29|9|0|
TRITACE|5 mg|0|774|3|29|9|0|
WINSTOR|40 mg|0|127|3|29|9|0|
WINSTOR|20 mg|0|127|3|29|9|0|
WINSTOR|10 mg|0|127|3|29|9|0|
XATRAL|5 mg|0|19|15|29|9|0|
XATRAL-LP|10 mg|0|19|15|29|9|0|
XEROSEC|20 mg|1|691|2|29|9|0|
ACTONEL|5 mg|0|782|15|29|9|0|
ACTONEL OAW|35 mg|0|782|15|29|9|0|
APROVEL|150 mg|0|550|3|29|9|0|
AVOMINE|25 mg|0|760|4|29|9|0|
AZMACORT|200 mcg/actu|6|860|12|29|9|0|
BRULIDINE|0.16% w/w|4|354|6|29|9|0|
CIPROZEE|250 mg|0|280|0|29|9|0|
CIPROZEE|500 mg|0|280|0|29|9|0|
CO-APROVEL|12.5 mg / 150 mg|0|515|3|29|9|0|
CO-APROVEL|12.5 mg / 300 mg|0|515|3|29|9|0|
CO-APROVEL|25 mg / 300 mg|0|515|3|29|9|0|
CO-PLAVIX|75 mg / 75 mg|0|122|3|29|9|0|
CO-TRITACE|12.5 mg / 2.5 mg|0|520|3|29|9|0|
CORDARONE|100 mg|0|43|3|29|9|0|
CORDARONE|200 mg|0|43|3|29|9|0|
INTAL SP|1 mg/actu|6|808|12|29|9|0|
JUMEX|5 mg|0|797|10|29|9|0|
NASACORT-AQ|55 mcg/actu|3|860|4|29|9|0|
SOSEGON|25 mg|0|717|1|29|9|0|
TARIVID|200 mg|0|686|0|29|9|0|
TAVANIC|250 mg|0|585|0|29|9|0|
TAVANIC|500 mg|0|585|0|29|9|0|
ABAKTAL|400 mg|0|716|0|23|9|0|
ACEMED|100 mg|0|1|1|23|9|0|
ALOMIDE|0.1% w/v|3|595|11|23|9|0|
ALTRAMET|200 mg|0|277|2|23|9|0|
ALTRAMET|400 mg|0|277|2|23|9|0|
ALTRAMET|800 mg|0|277|2|23|9|0|
AMOXI CLAVE|125 mg/5ml / 31.25 mg/5ml|2|65|0|23|9|0|
AMOXI CLAVE|250 mg/5ml / 62.5 mg/5ml|2|65|0|23|9|0|
AMOXI CLAVE|250 mg / 125 mg|0|65|0|23|9|0|
AMOXI CLAVE|500 mg / 125 mg|0|65|0|23|9|0|
AMOXI CLAVE|875 mg / 125 mg|0|65|0|23|9|0|
ANNUVA|50 mg|0|356|1|23|9|0|
ATORSAN|10 mg|0|127|3|23|9|0|
ATORSAN|20 mg|0|127|3|23|9|0|
ATROPINE|1% w/v|3|130|11|23|9|0|
AXCIN TABLET|250 mg|0|280|0|23|9|0|
AXCIN TABLET|500 mg|0|280|0|23|9|0|
AZOPT|1% w/v|3|180|11|23|9|0|
BETOPTIC|0.25% w/v|3|164|11|23|9|0|
BETOPTIC S|0.25% w/v|3|164|11|23|9|0|
BIODROXIL|500 mg|1|242|0|23|9|0|
BIODROXIL|125 mg/5ml|2|242|0|23|9|0|
BIODROXIL|250 mg/5ml|2|242|0|23|9|0|
BRIMONIDINE TARTRATE|0.2% w/v|3|179|11|23|9|0|
CAFERGOT|100 mg / 1 mg|0|196|1|23|9|0|
CALCIUM FORTE|500 mg / 300 mg|5|209|5|23|9|0|
CALCIUM SANDOZ|110 mg/5ml / 1.512 g/5ml|2|211|5|23|9|0|
CELOFTAL|2% w/v|3|532|11|23|9|0|
CILOXAN|0.3% w/v|3|280|11|23|9|0|
CLARAMED|125 mg/5ml|2|288|0|23|9|0|
CLARAMED|250 mg|0|288|0|23|9|0|
CLARAMED|500 mg|0|288|0|23|9|0|
CLOMFRANIL|10 mg|0|297|10|23|9|0|
CLOMFRANIL|25 mg|0|297|10|23|9|0|
CLOROTIR|500 mg|1|241|0|23|9|0|
CLOROTIR|250 mg|1|241|0|23|9|0|
CLOROTIR|125 mg/5ml|2|241|0|23|9|0|
CLOROTIR|250 mg/5ml|2|241|0|23|9|0|
CO-DIOVAN|12.5 mg / 80 mg|0|524|3|23|9|0|
CO-DIOVAN|25 mg / 160 mg|0|524|3|23|9|0|
CO-DIOVAN|12.5 mg / 160 mg|0|524|3|23|9|0|
CYCLOGYL|1% w/v|3|323|11|23|9|0|
DERMAZIN|1% w/w|4|801|6|23|9|0|
DIOVAN|320 mg|0|873|3|23|9|0|
DIOVAN|80 mg|0|873|3|23|9|0|
DIOVAN|160 mg|0|873|3|23|9|0|
DOTUR|100 mg|1|384|0|23|9|0|
DOVIREL|500 mg|0|872|15|23|9|0|
DYNACIRC|2.5 mg|0|560|3|23|9|0|
EFEMOLINE|0.1% w/v / 0.025% w/v|3|456|11|23|9|0|
ELGIN|500 mcg|0|621|5|23|9|0|
EMADINE|0.05% w/v|3|396|11|23|9|0|
ESOCUE|20 mg|1|412|2|23|9|0|
ESOCUE|40 mg|1|412|2|23|9|0|
EXAFAL|20 mg / 120 mg|0|74|8|23|9|0|
EXELON|1.5 mg|1|785|10|23|9|0|
EXELON|3 mg|1|785|10|23|9|0|
EXELON|4.5 mg|1|785|10|23|9|0|
EXELON|6 mg|1|785|10|23|9|0|
EXELON|4.6 mg|8|785|10|23|9|0|
EXELON|9.5 mg|8|785|10|23|9|0|
EXELON|18 mg|8|785|10|23|9|0|
EXFORGE|10 mg / 160 mg|0|54|3|23|9|0|
EXFORGE|5 mg / 160 mg|0|54|3|23|9|0|
EXFORGE|5 mg / 80 mg|0|54|3|23|9|0|
EXFORGE HCT|10 mg / 25 mg / 160 mg|0|50|3|23|9|0|
EXFORGE HCT|5 mg / 12.5 mg / 160 mg|0|50|3|23|9|0|
EXFORGE HCT|5 mg / 25 mg / 160 mg|0|50|3|23|9|0|
EXFORGE HCT|10 mg / 12.5 mg / 160 mg|0|50|3|23|9|0|
EXFORGE HCT|10 mg / 25 mg / 320 mg|0|50|3|23|9|0|
EXODERIL|1% w/w|4|658|6|23|9|0|
FAMVIR|250 mg|0|430|15|23|9|0|
FE AID|50 mg/5ml|2|555|5|23|9|0|
FE AID|100 mg|0|555|5|23|9|0|
FE AID|50 mg/ml|3|555|5|23|9|0|
FLAREX|0.1% w/v|3|454|11|23|9|0|
GALVUS|50 mg|0|878|9|23|9|0|
GALVUSMET|1 g / 50 mg|0|632|9|23|9|0|
GALVUSMET|850 mg / 50 mg|0|632|9|23|9|0|
GALVUSMET|500 mg / 50 mg|0|632|9|23|9|0|
GENTALEK|0.3% w/v|3|486|11|23|9|0|
GENTEAL|0.3% w/v|3|489|11|23|9|0|
GENTEAL|0.3% w/w|4|489|11|23|9|0|
GLORY|1 mg|0|494|9|23|9|0|
GLORY|2 mg|0|494|9|23|9|0|
GLORY|3 mg|0|494|9|23|9|0|
GLORY|4 mg|0|494|9|23|9|0|
HAPILUX|20 mg|1|461|10|23|9|0|
HYDERGINE|1 mg/ml|2|306|10|23|9|0|
HYDERGINE|4.5 mg|0|306|10|23|9|0|
HYDERGINE|1.5 mg|0|306|10|23|9|0|
INFECTOFLAM|0.1% w/v / 0.3% w/v|3|455|11|23|9|0|
INFECTOFLAM|0.1% w/w / 0.3% w/w|4|455|11|23|9|0|
KOOLOX|25 mg/5ml|2|803|2|23|9|0|
LAMISIL|1% w/w|4|835|6|23|9|0|
LAMISIL|125 mg|0|835|6|23|9|0|
LAMISIL|250 mg|0|835|6|23|9|0|
LESCOL|20 mg|1|467|3|23|9|0|
LESCOL|40 mg|1|467|3|23|9|0|
LESCOL XL|80 mg|0|467|3|23|9|0|
LEVOFIN|250 mg|0|585|0|23|9|0|
LEVOFIN|500 mg|0|585|0|23|9|0|
LOZAL|20 mg|1|691|2|23|9|0|
MAXIDEX|0.1% w/v / 0.5% w/v|3|336|11|23|9|0|
MAXITROL DROPS|0.1% w/v / 0.5% w/v / 0.35% w/v / 6000 IU/ml|3|337|11|23|9|0|
MAXITROL OINTMENT|0.1% w/w / 0.5% w/w / 0.35% w/w / 6000 IU/g|4|337|11|23|9|0|
MEPRESOR|100 mg|0|639|3|23|9|0|
MEPRESOR|200 mg|0|639|3|23|9|0|
MONTELO|5 mg|0|649|12|23|9|0|
MONTELO|10 mg|0|649|12|23|9|0|
MONTELO|4 mg|0|649|12|23|9|0|
MOSEGOR|0.25 mg/5ml|2|738|10|23|9|0|
MOSEGOR|0.5 mg|0|738|10|23|9|0|
MOSEGOR-V||2|673|5|23|9|0|
MYDRIACYL|1% w/v|3|868|11|23|9|0|
MYDRIATICUM|1% w/v|3|868|11|23|9|0|
NACLOF|0.1% w/v|3|356|11|23|9|0|
NAPHCON FORTE|0.025% w/v / 0.3% w/v|3|661|11|23|9|0|
NAPHCON-A|0.025% w/v / 0.3% w/v|3|661|11|23|9|0|
NAPHTEARS|0.012% v/v|3|660|11|23|9|0|
NEO-INTESTOPAN|500 mg/5ml|2|132|2|23|9|0|
NEO-INTESTOPAN|500 mg|0|132|2|23|9|0|
NEVANAC|1% w/v|3|668|11|23|9|0|
NIFECARD RETARD|20 mg|0|676|3|23|9|0|
NIFECARD XL|30 mg|0|676|3|23|9|0|
NIMARAN|100 mg|0|678|1|23|9|0|
NOCID|40 mg|0|431|2|23|9|0|
NOCID|20 mg|0|431|2|23|9|0|
NOKTAN|50 mg|0|603|3|23|9|0|
NOKTAN|25 mg|0|603|3|23|9|0|
NOLICIN|400 mg|0|684|0|23|9|0|
NYOLOL|0.5% w/v|3|845|11|23|9|0|
NYOLOL||4|845|11|23|9|0|
OCULOSAN|0.005% w/v / 0.02% w/v|3|662|11|23|9|0|
OPTALIDON|25 mg / 175 mg|0|200|1|23|9|0|
OSPAMOX|250 mg|1|64|0|23|9|0|
OSPAMOX|125 mg/5ml|2|64|0|23|9|0|
OSPAMOX|250 mg/5ml|2|64|0|23|9|0|
OSPAMOX|500 mg|0|64|0|23|9|0|
OSPAMOX|1 g|0|64|0|23|9|0|
OSPEXIN|250 mg|1|250|0|23|9|0|
OSPEXIN|125 mg/5ml|2|250|0|23|9|0|
OSPEXIN|250 mg/5ml|2|250|0|23|9|0|
OSPEXIN|500 mg|0|250|0|23|9|0|
OSPEXIN|1 g|0|250|0|23|9|0|
PROXIM|20 mg|1|735|1|23|9|0|
PROXIM|20 mg|0|735|1|23|9|0|
PROXIM|0.5% w/w|4|735|1|23|9|0|
PROZIDE|80 mg|0|493|9|23|9|0|
QALSAN D MINT|1250 mg / 125 IU|0|214|5|23|9|0|
QALSAN JUNIOR||0|208|5|23|9|0|
QALSAN MINT||0|208|5|23|9|0|
QALSAN MIXED FRUIT|1250 mg|0|212|5|23|9|0|
QALSAN-D MANGO||0|208|5|23|9|0|
QALSAN-D MIXED FRUIT|500 mg|0|208|5|23|9|0|
QALSAN-D ORANGE|500 mg|0|208|5|23|9|0|
QALSAN-D STRAWBERRY||0|208|5|23|9|0|
QUNOTEN|25 mg|0|124|3|23|9|0|
QUNOTEN|50 mg|0|124|3|23|9|0|
QUNOTEN|100 mg|0|124|3|23|9|0|
QUTRIL|25 mg|0|226|3|23|9|0|
QUTRIL|50 mg|0|226|3|23|9|0|
QUVASC|2.5 mg|0|46|3|23|9|0|
QUVASC|5 mg|0|46|3|23|9|0|
QUVASC|10 mg|0|46|3|23|9|0|
QUZEM|60 mg|0|366|3|23|9|0|
RASILEZ|300 mg|0|20|3|23|9|0|
RASILEZ|150 mg|0|20|3|23|9|0|
RASILEZ HCT|300 mg / 12.5 mg|0|21|3|23|9|0|
RASILEZ HCT|300 mg / 25 mg|0|21|3|23|9|0|
REDOPRIL|10 mg|0|397|3|23|9|0|
REGULAX|40 mg|1|412|2|23|9|0|
REGULAX|20 mg|1|412|2|23|9|0|
RENICIN|150 mg|0|790|0|23|9|0|
RESTORIL|15 mg|1|832|10|23|9|0|
RESTORIL|30 mg|1|832|10|23|9|0|
ROATOS|0.15 mg/5ml / 1.33 mg/5ml|2|590|7|23|9|0|
ROATOS|1 mg / 4 mg|9|590|7|23|9|0|
SANCOS|2 mg/5ml / 5 mg/5ml / 20 mg/5ml|2|265|7|23|9|0|
ABDEC||3|92|5|25|9|0|
ACCUPRIL|5 mg|0|771|3|25|9|0|
ACCUPRIL|10 mg|0|771|3|25|9|0|
ACCUPRIL|20 mg|0|771|3|25|9|0|
ADINE|60 mg|0|443|4|25|9|0|
ADINE|180 mg|0|443|4|25|9|0|
ADINE|120 mg|0|443|4|25|9|0|
ANSAID|100 mg|0|464|1|25|9|0|
ANTAMOL|20 mg / 120 mg|0|74|8|25|9|0|
ANTMAL|20 mg / 120 mg|0|74|8|25|9|0|
ARTHROTEC-50|50 mg / 200 mcg|0|357|1|25|9|0|
ASCORBON|500 mg|0|78|5|25|9|0|
ATIVAN|1 mg|0|599|10|25|9|0|
ATIVAN|2 mg|0|599|10|25|9|0|
BACTIPRONT|400 mg / 80 mg|0|824|0|25|9|0|
BACTIPRONT|200 mg/5ml / 40 mg/5ml|2|824|0|25|9|0|
BACTIPRONT DUPLEX|800 mg / 160 mg|0|824|0|25|9|0|
BASOQUIN|150 mg/5ml|2|62|8|25|9|0|
BASOQUIN|150 mg|0|62|8|25|9|0|
BENYLIN-DM|12.5 mg/5ml / 12.5 mg/5ml|2|344|7|25|9|0|
BENYLIN-E|12.5 mg/5ml / 50 mg/5ml / 30 mg/5ml|2|346|7|25|9|0|
BRONDECON|10% v/v / 25 mg/5ml / 100 mg/5ml|2|14|12|25|9|0|
BRONDECON P|25 mg/5ml / 50 mg/5ml|2|510|12|25|9|0|
BRONSECUR|10 mg|0|649|12|25|9|0|
BRONSECUR|5 mg|0|649|12|25|9|0|
BRONSECUR|4 mg|0|649|12|25|9|0|
CADUET|5 mg / 10 mg|0|47|3|25|9|0|
CADUET|5 mg / 20 mg|0|47|3|25|9|0|
CALADRYL|8% w/v / 0.1% w/v / 1% w/v|4|201|6|25|9|0|
CALTRATE-600|125 IU / 1500 mg|0|206|5|25|9|0|
CANDERA|8 mg|0|223|3|25|9|0|
CANDERA|16 mg|0|223|3|25|9|0|
CARDURA|2 mg|0|382|3|25|9|0|
CARDURA|4 mg|0|382|3|25|9|0|
CENTRUM||0|80|5|25|9|0|
CHANTIX|0.5 mg|0|874|15|25|9|0|
CHANTIX|1 mg|0|874|15|25|9|0|
CHLOROMYCETIN|1% w/w|4|253|11|25|9|0|
CHLOROMYCETIN HC|1% w/w / 0.5% w/w|4|254|11|25|9|0|
CITRALKA|1.315 g/5ml|2|806|15|25|9|0|
COMBANTRIN|250 mg|0|765|8|25|9|0|
COMBANTRIN|250 mg/5ml|2|765|8|25|9|0|
CONTROBEAT|100 mg|0|124|3|25|9|0|
CONTROBEAT|25 mg|0|124|3|25|9|0|
CONTROBEAT|50 mg|0|124|3|25|9|0|
COREX-D|4 mg/5ml / 10 mg/5ml / 5 mg/5ml / 150 mg/5ml|2|260|7|25|9|0|
CYCLOCORT|0.1% w/w|4|35|6|25|9|0|
DALACIN-C|150 mg|1|291|0|25|9|0|
DALACIN-C|300 mg|1|291|0|25|9|0|
DALACIN-T|10 mg/ml|4|291|6|25|9|0|
DALACIN-V|2% w/w|7|291|13|25|9|0|
DAVENOL|2 mg/5ml / 7 mg/5ml / 4 mg/5ml|2|232|7|25|9|0|
DELTACARTIL ENTERIC COATED|5 mg|0|754|15|25|9|0|
DELTACORTRIL|5 mg|0|755|15|25|9|0|
DETRUSITOL|4 mg|0|852|15|25|9|0|
DETRUSITOL|2 mg|0|852|15|25|9|0|
DIABINESE|250 mg|0|268|9|25|9|0|
DIAMOX|250 mg|0|5|11|25|9|0|
DIFLUCAN|150 mg|1|450|6|25|9|0|
DIFLUCAN|200 mg|1|450|6|25|9|0|
DIFLUCAN|50 mg|1|450|6|25|9|0|
DIFLUCAN|50 mg/5ml|2|450|6|25|9|0|
DILANTIN|100 mg|1|726|10|25|9|0|
DILANTIN|30 mg/5ml|2|726|10|25|9|0|
DILZEM|180 mg|0|366|3|25|9|0|
DILZEM|30 mg|0|366|3|25|9|0|
DILZEM|60 mg|0|366|3|25|9|0|
DILZEM RETARD|90 mg|0|366|3|25|9|0|
DRAMAMINE|12.5 mg/4ml|2|369|2|25|9|0|
DRAMAMINE|50 mg|0|369|2|25|9|0|
EFEXOR|150 mg|0|875|10|25|9|0|
EFEXOR|37.5 mg|0|875|10|25|9|0|
EFEXOR|50 mg|0|875|10|25|9|0|
EFEXOR|75 mg|0|875|10|25|9|0|
EFEXOR XR|75 mg|1|875|10|25|9|0|
EFEXOR XR|150 mg|1|875|10|25|9|0|
ENTOX-P|500 mg|0|132|2|25|9|0|
ESMITEC|40 mg|1|412|2|25|9|0|
ESMITEC|20 mg|1|412|2|25|9|0|
FASIGYN|500 mg|0|846|8|25|9|0|
FASIGYN|300 mg|0|846|8|25|9|0|
FELDENE|10 mg|1|735|1|25|9|0|
FELDENE|20 mg|1|735|1|25|9|0|
FELDENE|0.5% w/w|4|735|1|25|9|0|
FELDENE|10 mg|0|735|1|25|9|0|
FELDENE|20 mg|0|735|1|25|9|0|
FELDENE FFD|20 mg|0|735|1|25|9|0|
GELUSIL|200 mg / 200 mg / 25 mg|0|32|2|25|9|0|
GELUSIL MPS|200 mg / 200 mg / 25 mg|0|32|2|25|9|0|
GELUSIL MPS|200 mg/5ml / 200 mg/5ml / 25 mg/5ml|2|32|2|25|9|0|
GELUSIL PLUS|250 mg / 500 mg|0|33|2|25|9|0|
GERIPLEX|500 mg|1|654|5|25|9|0|
GLIBENSE|5 mg|0|497|9|25|9|0|
GLIRIDE|1 mg|0|494|9|25|9|0|
GLIRIDE|2 mg|0|494|9|25|9|0|
GLIRIDE|3 mg|0|494|9|25|9|0|
GLIRIDE|4 mg|0|494|9|25|9|0|
HALCION|250 mcg|0|861|10|25|9|0|
INCREMIN||2|12|5|25|9|0|
ISORDIL|5 mg|0|557|3|25|9|0|
ISORDIL|10 mg|0|557|3|25|9|0|
ISTEBLIX|75 mg|0|299|3|25|9|0|
LEDERPLEX||2|218|5|25|9|0|
LIGAZO|15 mg|0|731|9|25|9|0|
LIGAZO|30 mg|0|731|9|25|9|0|
LIGAZO|45 mg|0|731|9|25|9|0|
LINCOCIN|250 mg/5ml|2|591|0|25|9|0|
LINCOCIN|500 mg|1|591|0|25|9|0|
LINCOCIN HFC|500 mg|1|591|0|25|9|0|
LIPITOR|10 mg|0|127|3|25|9|0|
LIPITOR|20 mg|0|127|3|25|9|0|
LIPITOR|40 mg|0|127|3|25|9|0|
LIPRA|5 mg|0|774|3|25|9|0|
LIPRA|1.25 mg|0|774|3|25|9|0|
LIPRA|2.5 mg|0|774|3|25|9|0|
LIPRA|10 mg|0|774|3|25|9|0|
LOPID|300 mg|1|487|3|25|9|0|
LYRICA|75 mg|1|756|10|25|9|0|
LYRICA|150 mg|1|756|10|25|9|0|
LYRICA|300 mg|1|756|10|25|9|0|
LYSOVIT||2|114|5|25|9|0|
MARAX|25 mg / 10 mg / 130 mg|0|402|12|25|9|0|
MATERNA||0|89|5|25|9|0|
MAYADEC|500 mg|1|654|5|25|9|0|
MECLOMEN|100 mg|1|620|1|25|9|0|
METAKELFIN|10 mg/ml|3|767|8|25|9|0|
METAKELFIN|25 mg|0|767|8|25|9|0|
MINIDIAB|5 mg|0|497|9|25|9|0|
MINIDIAB AF|2.5 mg / 250 mg|0|498|9|25|9|0|
MINIDIAB AF|5 mg / 500 mg|0|498|9|25|9|0|
MINIPRESS|1 mg|0|750|3|25|9|0|
MINIPRESS|2 mg|0|750|3|25|9|0|
MONOTRATE|20 mg|0|558|3|25|9|0|
MONOTRATE|40 mg|0|558|3|25|9|0|
MOTRIN|800 mg|0|538|1|25|9|0|
MUCAINE|291 mg/5ml / 98 mg/5ml / 10 mg/5ml|2|31|2|25|9|0|
MUCAINE||0|31|2|25|9|0|
MYCITRACIN PLUS|500 IU/g / 4% w/w / 3.5 mg/g / 5000 IU/g|4|138|6|25|9|0|
MYLANTA-2|400 mg/5ml / 400 mg/5ml / 30 mg/5ml|2|32|2|25|9|0|
MYLANTA-2|400 mg / 400 mg / 40 mg|0|32|2|25|9|0|
NILSTAT|100000 IU/ml|3|685|6|25|9|0|
NILSTAT|100000 IU/g|4|685|6|25|9|0|
NILSTAT|500000 IU|0|685|6|25|9|0|
NILSTAT|100000 IU|7|685|13|25|9|0|
NORDETTE-28|0.03 mg / 0.15 mg|0|420|13|25|9|0|
OMNIPEN|250 mg|1|67|0|25|9|0|
OMNIPEN|500 mg|1|67|0|25|9|0|
OMNIPEN|125 mg/5ml|2|67|0|25|9|0|
OMNIPEN|250 mg/5ml|2|67|0|25|9|0|
PACITANE|2 mg|0|146|10|25|9|0|
PARKEDOX|100 mg|1|384|0|25|9|0|
PARKETIN (NEURONTIN)|100 mg|0|484|10|25|9|0|
PARKETIN (NEURONTIN)|300 mg|0|484|10|25|9|0|
PARKETIN (NEURONTIN)|400 mg|0|484|10|25|9|0|
PENETRIN|200 mg/5ml / 40 mg/5ml|2|824|0|25|9|0|
PFICID|250 mg|0|288|0|25|9|0|
PFICID|500 mg|0|288|0|25|9|0|
PFIZIFLOX|250 mg|0|585|0|25|9|0|
PFIZIFLOX|500 mg|0|585|0|25|9|0|
PONSTAN|50 mg/5ml|2|623|1|25|9|0|
PONSTAN|250 mg|0|623|1|25|9|0|
PONSTAN FLASH|250 mg|0|623|1|25|9|0|
PRECIPRA|5 mg|0|411|10|25|9|0|
PRECIPRA|10 mg|0|411|10|25|9|0|
PREDNISOLONE|5 mg|0|755|15|25|9|0|
PREMARIN|1.25 mg|0|417|13|25|9|0|
PREMARIN|0.625 mg|0|417|13|25|9|0|
PREMARIN|0.3 mg|0|417|13|25|9|0|
PREMARIN|0.6% w/w|7|417|13|25|9|0|
PRESSUREX|20 mg|0|830|3|25|9|0|
PRESSUREX|40 mg|0|830|3|25|9|0|
RELEVOLE|20 mg|0|691|2|25|9|0|
RELEVOLE|40 mg|0|691|2|25|9|0|
ROERIBEC||1|104|5|25|9|0|
ROSUTROL|20 mg|0|788|3|25|9|0|
ROSUTROL|5 mg|0|788|3|25|9|0|
ROSUTROL|10 mg|0|788|3|25|9|0|
SALAZOPYRIN|500 mg|0|825|15|25|9|0|
SAVOXACIN|250 mg|0|280|0|25|9|0|
SAVOXACIN|500 mg|0|280|0|25|9|0|
SIMECO|215 mg/5ml / 80 mg/5ml / 25 mg/5ml|2|32|2|25|9|0|
SIMECO|85 mg / 25 mg|0|613|2|25|9|0|
STREPTOMAGMA|63.3 mg/5ml / 486.6 mg/5ml|2|29|2|25|9|0|
STRESSTABS||0|85|5|25|9|0|
SYTRON|55 mg/10ml|2|812|5|25|9|0|
TERRAMYCIN|250 mg|1|703|0|25|9|0|
THERACOMBEX||1|119|5|25|9|0|
TRI-HEMIC 600||0|110|5|25|9|0|
TRIVIZOL|200 mg|0|640|8|25|9|0|
TROSYD|1% w/w|4|847|6|25|9|0|
TUSSIVIL|90 mg/5ml / 15 mg/5ml / 100 mg/5ml / 5 mg/5ml / 15 mg/5ml|2|61|7|25|9|0|
UNASYN|200 mg/5ml / 250 mg/5ml|2|69|0|25|9|0|
UNASYN|250 mg / 125 mg|0|69|0|25|9|0|
UNICAP||2|96|5|25|9|0|
UNICAP-M||0|88|5|25|9|0|
ACTIM|2.5 mg|0|176|3|28|10|0|
ACTIM|5 mg|0|176|3|28|10|0|
ACTIM|10 mg|0|176|3|28|10|0|
ALKERIS|200 mg|0|1|1|28|10|0|
ALKERIS|100 mg|0|1|1|28|10|0|
ALKERIS|1.5% w/w|4|1|1|28|10|0|
AMMOIDIN|0.75% w/w|4|633|6|28|10|0|
AMMOIDIN|10 mg|0|633|6|28|10|0|
ARCEVA|20 mg / 120 mg|0|74|8|28|10|0|
ARCEVA|40 mg / 240 mg|0|74|8|28|10|0|
ARCEVA|80 mg / 480 mg|0|74|8|28|10|0|
ARCEVA|15 mg/5ml / 90 mg/5ml|2|74|8|28|10|0|
ARCEVA|30 mg / 180 mg|2|74|8|28|10|0|
BISLERI|50 mg/5ml|2|552|5|28|10|0|
BISLERI||1|470|5|28|10|0|
BISLERI F|0.35 mg / 100 mg|0|472|5|28|10|0|
BISLERI F|0.35 mg / 100 mg|1|472|5|28|10|0|
BREEKY|200 mcg|0|647|13|28|10|0|
BRINO|250 mg|1|857|15|28|10|0|
BRINO|500 mg|1|857|15|28|10|0|
CARICEF|400 mg|1|245|0|28|10|0|
CARICEF|100 mg/5ml|2|245|0|28|10|0|
CARICEF|200 mg/5ml|2|245|0|28|10|0|
CARICEF|200 mg|0|245|0|28|10|0|
CARICEF|400 mg|0|245|0|28|10|0|
CHYMOTRIP FORTE||0|274|15|28|10|0|
CONSPIC|7.5 mg/ml|3|813|2|28|10|0|
CONSPIC|5 mg|0|813|2|28|10|0|
CYNFO|500 mg|1|476|0|28|10|0|
CYNFO|250 mg/5ml|2|476|0|28|10|0|
DANILON|10 mg|0|391|13|28|10|0|
DICLORAN DISPERLET|100 mg|0|359|1|28|10|0|
DICLOREP|50 mg|0|355|1|28|10|0|
DISGREN|300 mg|1|863|3|28|10|0|
ECASIL|600 mg|0|592|0|28|10|0|
ECASIL|400 mg|0|592|0|28|10|0|
EFFIFLOX|250 mg|0|585|0|28|10|0|
EFFIFLOX|500 mg|0|585|0|28|10|0|
ENIER|8 mg|0|155|11|28|10|0|
ENIER|16 mg|0|155|11|28|10|0|
ERWIN|75 mg / 200 mcg|0|357|1|28|10|0|
ERWIN|50 mg / 200 mcg|0|357|1|28|10|0|
EUPHEN|400 mg|0|716|0|28|10|0|
FLAVIN|200 mg|0|549|15|28|10|0|
GPRIDE M|1 mg / 500 mg|0|495|9|28|10|0|
GPRIDE M|2 mg / 500 mg|0|495|9|28|10|0|
INTIG||2|654|5|28|10|0|
INTIG|830 mg|0|654|5|28|10|0|
INTIG D||2|208|5|28|10|0|
INTIG D||0|208|5|28|10|0|
INTIG FORTE|400 mg/5ml|2|654|5|28|10|0|
ITAGLIP|100 mg|0|805|9|28|10|0|
ITAGLIP|50 mg|0|805|9|28|10|0|
ITAGLIP PLUS|500 mg / 50 mg|0|631|9|28|10|0|
ITP|50 mg|0|561|2|28|10|0|
ITP OD|150 mg|0|561|2|28|10|0|
KLINT|200 mg/5ml|2|640|0|28|10|0|
KLINT|400 mg|0|640|0|28|10|0|
LACASIL|3.35 g/5ml|2|575|2|28|10|0|
LEVIJON||2|569|15|28|10|0|
LOSPAN PLUS|480 mg / 20 mg|0|611|2|28|10|0|
MABIL|500 mcg|0|621|5|28|10|0|
MELOR|7.5 mg|0|625|1|28|10|0|
MELOR|15 mg|0|625|1|28|10|0|
MEVULAK||5|616|2|28|10|0|
MOFEST|400 mg|0|651|0|28|10|0|
MONTIKA|5 mg|5|649|12|28|10|0|
MONTIKA|4 mg|0|649|12|28|10|0|
MONTIKA|5 mg|0|649|12|28|10|0|
MONTIKA FILM COATED|10 mg|0|649|12|28|10|0|
MOVAX|4 mg|0|849|1|28|10|0|
MOVAX|2 mg|0|849|1|28|10|0|
MOVERYL|100 mg|1|249|1|28|10|0|
MOVERYL|200 mg|1|249|1|28|10|0|
NEEGE|40 mg|0|706|2|28|10|0|
NEO-ANTIAL|0.5 mg/ml|2|329|4|28|10|0|
NEO-ANTIAL|5 mg|0|329|4|28|10|0|
NEUCEF|500 mg|1|242|0|28|10|0|
NEUCEF|125 mg/5ml|2|242|0|28|10|0|
NEUCEF|250 mg/5ml|2|242|0|28|10|0|
NEUCEF PEDIATRIC|100 mg|3|242|0|28|10|0|
NIMS|100 mg|0|678|1|28|10|0|
NIXAF|200 mg|0|781|0|28|10|0|
NIXAF|550 mg|0|781|0|28|10|0|
NOVOTEPH|20 mg|1|412|2|28|10|0|
NOVOTEPH|40 mg|1|412|2|28|10|0|
OSIRIS|20 mg/5ml|2|885|5|28|10|0|
OTID|250 mg|1|251|0|28|10|0|
OTID|500 mg|1|251|0|28|10|0|
OTID|250 mg/5ml|2|251|0|28|10|0|
OTID|125 mg/5ml|2|251|0|28|10|0|
PENORIT|0.02 mg / 10 mg|0|421|13|28|10|0|
PULSATE|100 mg|0|790|0|28|10|0|
PULSATE|150 mg|0|790|0|28|10|0|
PULSATE|300 mg|0|790|0|28|10|0|
RATISER|10 mg|0|772|2|28|10|0|
RATISER|20 mg|0|772|2|28|10|0|
RECALBON|0.5 mcg|0|18|5|28|10|0|
RENOVA|320 mg|0|488|0|28|10|0|
RITHMO|250 mg|0|288|0|28|10|0|
RITHMO|500 mg|0|288|0|28|10|0|
RITHMO|125 mg/5ml|2|288|0|28|10|0|
RITHMO|125 mg/5ml|3|288|0|28|10|0|
RITHMO|250 mg/5ml|2|288|0|28|10|0|
RITHMO XL|500 mg|0|288|0|28|10|0|
ROLAC|100 mg|1|562|6|28|10|0|
SAMEROL-N|35 mg / 450 mg|0|697|1|28|10|0|
SAMEROL-N FORTE|50 mg / 650 mg|0|697|1|28|10|0|
SILSER|10 mg|0|804|3|28|10|0|
SILSER|20 mg|0|804|3|28|10|0|
SLATE|125 mg/5ml|2|241|0|28|10|0|
SLATE|250 mg/5ml|2|241|0|28|10|0|
SLATE|187 mg/5ml|2|241|0|28|10|0|
SLATE|250 mg|1|241|0|28|10|0|
SLATE|500 mg|1|241|0|28|10|0|
SLATE|50 mg/ml|3|241|0|28|10|0|
TEPH|20 mg|1|691|2|28|10|0|
TEPH|40 mg|1|691|2|28|10|0|
TEPH INSTA|20 mg / 1100 mg|1|692|2|28|10|0|
TEPH INSTA|40 mg / 1100 mg|1|692|2|28|10|0|
TERCICA|200 mg|0|342|1|28|10|0|
TERCICA|300 mg|0|342|1|28|10|0|
TERCICA|400 mg|0|342|1|28|10|0|
TERCICA||2|342|1|28|10|0|
TIMEQUIN|40 mg / 320 mg|1|364|8|28|10|0|
TIMEQUIN|15 mg / 120 mg|5|364|8|28|10|0|
TONOFLEX|50 mg|1|854|1|28|10|0|
TONOFLEX|100 mg|0|854|1|28|10|0|
TRIMETABOL||2|239|5|28|10|0|
ULCEREX|400 mg|0|277|2|28|10|0|
ULCEREX|200 mg/10ml|2|277|2|28|10|0|
ULCEREX|100 mg/10ml|2|277|2|28|10|0|
WINURINA|100 mg|1|484|10|28|10|0|
WINURINA|300 mg|1|484|10|28|10|0|
XYQUIL DR|10 mg / 10 mg|0|385|13|28|10|0|
ACTIFLOR|250 mg/sachet|5|793|2|26|10|0|
AIREEZ|4 mg|0|649|12|26|10|0|
AIREEZ|5 mg|0|649|12|26|10|0|
AIREEZ|10 mg|0|649|12|26|10|0|
ANEX|250 mg|0|663|1|26|10|0|
ANEX|500 mg|0|663|1|26|10|0|
ANTIMAL TABLET|20 mg / 120 mg|0|74|8|26|10|0|
ANTIMAL-RAPID|15 mg / 120 mg|5|364|8|26|10|0|
ANTIMAL-RAPID|40 mg / 320 mg|0|364|8|26|10|0|
ARBI-D|12.5 mg / 150 mg|0|515|3|26|10|0|
ARBI-D|12.5 mg / 300 mg|0|515|3|26|10|0|
ARMIQIN|40 mg / 120 mg|5|364|8|26|10|0|
ARMIQIN|40 mg / 320 mg|0|364|8|26|10|0|
ATEASE|10 mg / 10 mg|0|47|3|26|10|0|
ATEASE|5 mg / 20 mg|0|47|3|26|10|0|
ATEASE|5 mg / 10 mg|0|47|3|26|10|0|
ATEASE|10 mg / 20 mg|0|47|3|26|10|0|
AVSAR|10 mg / 160 mg|0|54|3|26|10|0|
AVSAR|5 mg / 80 mg|0|54|3|26|10|0|
AVSAR|5 mg / 160 mg|0|54|3|26|10|0|
BENSAR|5 mg|0|689|3|26|10|0|
BENSAR|20 mg|0|689|3|26|10|0|
BENSAR|40 mg|0|689|3|26|10|0|
BONEDOL|0.25 mcg|0|18|5|26|10|0|
BONEDOL|0.5 mcg|0|18|5|26|10|0|
BONEDOL|1 mcg|0|18|5|26|10|0|
BONGARD|70 mg|0|16|15|26|10|0|
BONGARD|10 mg|0|16|15|26|10|0|
BONGARD-CAL|70 mg / 0.0712 mg|0|17|15|26|10|0|
DELERGIA|0.5 mg/ml|2|329|4|26|10|0|
DUZALTA|60 mg|1|388|10|26|10|0|
DUZALTA|20 mg|1|388|10|26|10|0|
EPIK|25 mg|0|853|10|26|10|0|
EPIMATE|25 mg|0|853|10|26|10|0|
EQUIT|250 mg|0|582|10|26|10|0|
EQUIT|500 mg|0|582|10|26|10|0|
EQUIT|1 g|0|582|10|26|10|0|
EQUIT|500 mg|2|582|10|26|10|0|
ESMART||0|357|1|26|10|0|
ESTAR|10 mg|0|283|10|26|10|0|
EVOCIN|750 mg|0|280|0|26|10|0|
EVODOXIM|40 mg/5ml|2|246|0|26|10|0|
EVODOXIM|100 mg|0|246|0|26|10|0|
EVOFIX|400 mg|1|245|0|26|10|0|
EVOFIX|100 mg/5ml|2|245|0|26|10|0|
EVOKALM|200 mg|0|770|10|26|10|0|
EVOKALM|100 mg|0|770|10|26|10|0|
EVOKALM|25 mg|0|770|10|26|10|0|
EVOPRIDE|1 mg|0|494|9|26|10|0|
EVOPRIDE|2 mg|0|494|9|26|10|0|
EVOPRIDE|3 mg|0|494|9|26|10|0|
EVOPRIDE|4 mg|0|494|9|26|10|0|
EVOPRIDE PLUS|2 mg / 500 mg|0|495|9|26|10|0|
EVOROX|125 mg|0|248|0|26|10|0|
EVOROX|250 mg|0|248|0|26|10|0|
EVOROX|125 mg/5ml|2|248|0|26|10|0|
FASTESO|20 mg|0|412|2|26|10|0|
FASTESO|40 mg|0|412|2|26|10|0|
FERRUM|100 mg|0|552|5|26|10|0|
FERRUM|100 mg/5ml|2|552|5|26|10|0|
FERRUM FA|0.35 mg / 100 mg|0|473|5|26|10|0|
FLOPLAT|10 mg|0|748|3|26|10|0|
FLOWPLAT|5 mg|0|748|3|26|10|0|
FREEDEP|50 mg|0|800|10|26|10|0|
FREEDEP|100 mg|0|800|10|26|10|0|
GABIN|200 mg|1|484|10|26|10|0|
GABIN|400 mg|1|484|10|26|10|0|
GOU-B|40 mg|0|432|15|26|10|0|
GOU-B|80 mg|0|432|15|26|10|0|
GOURIC|40 mg|0|432|15|26|10|0|
GOURIC|80 mg|0|432|15|26|10|0|
IBANDRO|150 mg|0|537|15|26|10|0|
ISMART|50 mg / 200 mcg|0|357|1|26|10|0|
KALM|25 mg|0|770|10|26|10|0|
KALM|100 mg|0|770|10|26|10|0|
KLEVRA|250 mg|0|582|10|26|10|0|
KLEVRA|500 mg|0|582|10|26|10|0|
LAWPLAT PLUS|150 mg / 75 mg|0|122|3|26|10|0|
LAWPLAT PLUS|75 mg / 75 mg|0|122|3|26|10|0|
LIMITROL|10 mg|0|804|3|26|10|0|
LIMITROL|20 mg|0|804|3|26|10|0|
LIMITROL|40 mg|0|804|3|26|10|0|
LIMITROL EZ|10 mg / 10 mg|0|429|3|26|10|0|
LIMITROL EZ|5 mg / 5 mg|0|429|3|26|10|0|
LOWPLAT|75 mg|0|299|3|26|10|0|
LOWPLAT PLUS|75 mg / 75 mg|0|122|3|26|10|0|
LOWPLAT PLUS|150 mg / 75 mg|0|122|3|26|10|0|
MEMURA|5 mg|0|626|10|26|10|0|
MEMURA|10 mg|0|626|10|26|10|0|
METPI|500 mg / 15 mg|0|629|9|26|10|0|
METPI|850 mg / 15 mg|0|629|9|26|10|0|
MEZREL XR|15 mg|1|322|1|26|10|0|
MEZREL XR|30 mg|1|322|1|26|10|0|
MOVER|400 mg / 500 mg|0|273|15|26|10|0|
NISE|100 mg|0|678|1|26|10|0|
NUVAL|40 mg|0|873|3|26|10|0|
NUVAL|80 mg|0|873|3|26|10|0|
NUVAL|160 mg|0|873|3|26|10|0|
NUVAL -D|12.5 mg / 80 mg|0|524|3|26|10|0|
NUVAL -D|12.5 mg / 160 mg|0|524|3|26|10|0|
NUVAL -D|25 mg / 160 mg|0|524|3|26|10|0|
ORSLIM|120 mg|1|695|15|26|10|0|
OXIROM|100 mg|0|790|0|26|10|0|
OXIROM|150 mg|0|790|0|26|10|0|
OXIROM|300 mg|0|790|0|26|10|0|
PIOPRIDE|2 mg / 30 mg|0|496|9|26|10|0|
PIOPRIDE|4 mg / 30 mg|0|496|9|26|10|0|
PRIZM|250 mg|0|814|10|26|10|0|
PRIZM|500 mg|0|814|10|26|10|0|
PRIZM|250 mg/5ml|2|814|10|26|10|0|
RAMIPACE|1.25 mg|0|774|3|26|10|0|
RAMIPACE|2.5 mg|0|774|3|26|10|0|
RAMIPACE|5 mg|0|774|3|26|10|0|
RAMIPACE|10 mg|0|774|3|26|10|0|
RAMIPACE D|12.5 mg / 10 mg|0|520|3|26|10|0|
RAMIPACE D|12.5 mg / 5 mg|0|520|3|26|10|0|
SAVDIL|20 mg|1|558|3|26|10|0|
SAVDIL|40 mg|1|558|3|26|10|0|
SAVDIL|60 mg|1|558|3|26|10|0|
SEFECOX|100 mg|0|249|1|26|10|0|
SEFECOX|200 mg|0|249|1|26|10|0|
SITA|25 mg|0|805|9|26|10|0|
SITA|50 mg|0|805|9|26|10|0|
SITA|100 mg|0|805|9|26|10|0|
SITA PLUS|500 mg / 50 mg|0|631|9|26|10|0|
SITA PLUS|1 g / 50 mg|0|631|9|26|10|0|
SPECTRIX|250 mg|0|585|0|26|10|0|
SPECTRIX|500 mg|0|585|0|26|10|0|
SPEDICAM|8 mg|0|601|1|26|10|0|
STEPLEX||2|555|5|26|10|0|
TELSARTA|20 mg|0|830|3|26|10|0|
TELSARTA|40 mg|0|830|3|26|10|0|
TELSARTA|80 mg|0|830|3|26|10|0|
TELSARTA-D|12.5 mg / 80 mg|0|522|3|26|10|0|
TELSARTA-D|12.5 mg / 40 mg|0|522|3|26|10|0|
TRAZENE|0.1% w/w|4|829|6|26|10|0|
TRAZENE|0.05% w/w|4|829|6|26|10|0|
TREATAN|4 mg|0|223|3|26|10|0|
TREATAN|8 mg|0|223|3|26|10|0|
TREATAN|16 mg|0|223|3|26|10|0|
TREATAN D||0|224|3|26|10|0|
VOXAMINE|50 mg|0|468|10|26|10|0|
VOXAMINE|100 mg|0|468|10|26|10|0|
WINZITH|250 mg|0|134|0|26|10|0|
WINZITH|500 mg|0|134|0|26|10|0|
X-PLENDED|5 mg|0|788|3|26|10|0|
X-PLENDED|10 mg|0|788|3|26|10|0|
XEFAST|4 mg|0|601|1|26|10|0|
XEFAST|8 mg|0|601|1|26|10|0|
ZEMITRA|10 mg|0|428|3|26|10|0|
ZI-AD|10 mg/5ml|2|883|5|26|10|0|
ZI-AD|20 mg/5ml|2|883|5|26|10|0|
ZOLTAR INSTA|20 mg / 1100 mg|1|692|2|26|10|0|
ZOLTAR INSTA|40 mg / 1100 mg|1|692|2|26|10|0|`

export const PK2_MEDS: PkMed[] = ROWS.split('\n').map(line => {
  const [brand, strength, f, g, c, m, s, chk, sd] = line.split('|')
  const row: PkMed = {
    brand, strength, form: F[+f], generic: G[+g], cls: C[+c], maker: M[+m], sd,
  }
  if (chk === '1') row.check = true
  ;(row as PkMed & { src?: string }).src = S[+s]
  return row
})
