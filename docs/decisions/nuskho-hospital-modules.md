I've read both plan documents in full and the shipped code (`roles.ts`, `types.ts`, `db.ts`, plus `safety.ts`, `profile.ts`, `backup.ts`, `data/vitals.ts`, `platform-architecture.md`). Here is the design.

---

# Nuskho as a hospital system: the module map and the secrecy boundary

Design document v1. Written against `nuskho-plan-v4.md`, `nuskho-open-a-clinic.md`, and the code as shipped 4 August 2026.

## The three invariants this document may not break

1. **The doctor taps PRINT and paper comes out.** Nothing here sits between those two events.
2. **Print first, seal after, coordinate later.** Encryption wraps, signatures, LAN push and hospital coordination all happen *after* the paper is in the patient's hand.
3. **Nuskho cannot read clinical content.** Not degraded, not "with permission", not for support.

## The correction that makes the rest of this possible

The brief frames the split as *room-encrypted* versus *hospital-readable*. That framing is one word too coarse and the word will cost you the company.

**There is no such thing as "encrypted to the hospital."** A hospital is not an audience; it is a building containing seven or eight audiences who need entirely different things. The ward sister needs to know who is in bed 12. She does not need the theatre list. The cashier needs the bill total. He does not need the ward census. The storekeeper needs to know six vials left the fridge. He does not need to know whose arm they went into.

So the operational tier is **encrypted to a function, not to a hospital**. Seven function keys, using exactly the same wrap machinery the plan already specifies for rooms — so it costs almost nothing to build, and it is the entire difference between an honest claim and a false one.

| Function key | Held by | Reads |
|---|---|---|
| `fn-frontdesk` | registration, enquiry, token desk | who is here, where they were sent, appointment slots |
| `fn-bedboard` | ward nursing stations, admissions office | who is in which bed, ward, sex, age, attendant, diet code, precaution code |
| `fn-theatre` | the theatre team rostered today | today's list for *that* theatre, tray codes, anaesthesia class |
| `fn-pharmacy` | pharmacy counter and store | stock, batches, expiry, indents, issue quantities |
| `fn-lab` | lab reception, benches, radiology desk | accessions, sample state, turnaround, bench workload |
| `fn-billing` | cashiers, accounts | charge stubs, totals, payments, panel claims, CNIC |
| `fn-office` | the ops admin, the IT man | staff, rosters, devices, resource utilisation, tariffs, backups |

Nuskho holds none of them, ever. And critically: `fn-office` — the key the hospital's IT man actually holds — is the *narrowest* one, not the widest. This is the plan's operations/clinical-reach split, expressed in cryptography instead of in an `if` statement.

---

# 1. The module map

Thirty-one modules. Grouped by build tier, not by importance. "Room" below always means a bounded clinical team that must read the same clinical content — a consulting room, a theatre, a ward nursing station, the pharmacy counter, a lab bench. Every room gets an X25519 keypair derived from the hospital seed, exactly as `nuskho-open-a-clinic.md` §1.3 already specifies for consulting rooms.

## Tier 0 — Foundations (not sellable, everything depends on them)

**1. Identity & patient registry.** Mints and holds the stable ULID, the MR number, and the printed patient number. Owns the lease machinery from `open-a-clinic` §3.5 that stops two devices minting `00043`. Used by every desk in the building. Holds: name, MR number, sex, age, phone, town, CNIC (adults only, optional except for panel patients), next-of-kin name and phone, date of first registration. Holds no clinical content of any kind. This is the module that turns `nextPatientNum()` in `db.ts` from a one-machine function into a hospital one.

**2. Keyring & device management.** Mints the hospital seed, derives room keys, function keys, recovery and break-glass keys; pairs devices by QR + six-digit SAS; revokes lost ones; runs the recovery drill. Used by the doctor (his own room) and the ops admin (device inventory only). Holds key material, device identities, pairing records, drill dates. Never leaves the building.

**3. Staff registry & roles.** Who works here, what hat they may wear, which rooms they belong to, which function keys their device carries. Used by the ops admin. Holds: name, designation, PMC/PMDC number for doctors, contact, employment dates, role grants, PIN hashes. No clinical content. This is `roles.ts` grown up: `counter | doctor | nurse | pharmacist | technician | office | nuskho`.

**4. Coordination service (the on-prem box).** A ₨40,000 mini-PC with a UPS sitting in the hospital, which arbitrates scarce resources — beds, theatre slots, MR numbers, scanner slots. It is not a database of patients. It holds an **anonymous allocation ledger**: resource id, state, lease holder, version, timestamp. Nothing else. Used by nothing directly; every coordinating module talks to it. Nuskho's cloud is never in this path and neither is the internet. See §4.

## Tier 1 — Outpatient (this is the shipped product, plus money)

**5. Registration / OPD.** The front desk. Finds a returning patient by 5-digit code, QR or phone; registers a new one; takes the fee; issues the token; routes to a consulting room. Used by the counter clerk. Holds: the registration event, the room the patient was sent to, token, fee taken, arrival and call times. It does not hold why the patient came — the counter clerk already cannot read a prescription in the shipped code and that does not change.

**6. Appointments.** Slot booking for clinics that run them (Indus does; Latif does not). Used by the front desk and telephone booking. Holds: patient, doctor, slot, status, contact attempts. The reason for the appointment is not a field, deliberately.

**7. Consultation & prescribing.** The existing `Compose.tsx`. The doctor writes, the machine prints bilingual with pictograms. Used by the doctor alone in his room. Holds: complaint, examination, diagnosis, `RxLine[]` with `RxSnap`, tests requested, advice, follow-up date. Entirely clinical. This module must not gain a single new external dependency; it is the invariant.

**8. Vitals & instant tests.** The compounder's cuff at the door and the doctor's strip machine in the room, already modelled in `data/vitals.ts`. Used by the compounder (writes only, cannot read back beyond his own day — the write-without-read property of the room public key) and the doctor. Holds: BP, pulse, temperature, weight, SpO₂, RBS, HbA1c.

**9. Queue & token display.** The waiting-room board and the doctor's list. Used by everyone with eyes. Holds: token number, room, called/waiting/done, urgency flag. This is `Visit.urgent` and `VisitStatus` promoted to a building.

## Tier 2 — Money and materials (the modules a hospital owner buys)

**10. Charge capture.** Not a screen — a mechanism. Every module that consumes something billable emits a **charge stub**: patient, charge code, quantity, amount, department, timestamp, and an opaque pointer to the clinical record that caused it. This is the linchpin of the whole design and it is invisible to users. Without it, billing has to read the clinical record, and the moment billing reads the clinical record the promise is over.

**11. Billing & invoicing.** Assembles stubs into a bill, prints it, applies package rates, discounts, Zakat/welfare waivers and panel rates. Used by the cashier. Holds: bill header, line stubs, totals, payer, discount authoriser. The *human-readable itemisation* is assembled at print time inside the billing room, from a wrap the billing room holds — see §2.

**12. Payments, receipts & cash closing.** Takes cash/card/mobile wallet, prints receipts, handles refunds (the shipped `grantDiscount` / `markRefunded` flow), reconciles the drawer at shift end. Used by cashiers and the ops admin. Holds: payment events, denominations, shift totals, variances.

**13. Panels, corporate & state schemes.** Sehat Sahulat / corporate panels / Zakat committee / hospital welfare fund. Used by the billing office. Holds: scheme membership, entitlement, claim id, claim amount, status, and — only at the moment of submission — a sealed coded claim document. See the discharge-code argument in §2.

**14. Pharmacy — dispensing.** Outpatient counter and inpatient issue. The pharmacist reads the prescription — that is the job. Used by pharmacists. Holds: the dispensing event, substitutions made, quantity supplied, counselling given, and (in the clinical half) the link to what was dispensed to whom.

**15. Pharmacy — stock, batches & expiry.** Goods receipt, batch numbers, expiry, ward imprest, indents, reorder levels, physical stock takes, returns, wastage. Used by the storekeeper and pharmacist. Holds quantities and batches with **no patient identity attached**. This separation is the load-bearing one.

**16. Narcotics register.** Legally mandated, patient-named, drug-named, signed. Used by the pharmacist and inspectors. Holds: drug, quantity, patient, prescriber, date, balance. This is a statutory exception to the whole design and is treated as one, loudly.

**17. General inventory & consumables.** Surgical disposables, IV sets, gloves, oxygen cylinders, linen. Same shape as pharmacy stock, no patient link at all. Used by store and ward in-charges.

## Tier 3 — Diagnostics

**18. Lab orders & specimen tracking (LIS).** Order placed in a room → accession number generated → sample collected, labelled, transported, received, run, verified, reported. Used by the ordering doctor, phlebotomist, lab reception, technologist, pathologist. Splits harder than any other module: the *workflow state* is operational, the *test identity and the result* are not.

**19. Radiology orders, scheduling & reporting (RIS).** Same as lab plus a scarce machine that must be scheduled, which makes it a coordination problem. Used by the ordering doctor, radiographer, radiologist. Images themselves (PACS) are explicitly out of v1 scope — a DICOM store is a separate product.

**20. Blood bank.** Donor registration and screening, grouping and cross-match, unit inventory, issue, transfusion reaction reporting. Enormous in Sindh (thalassaemia, dengue, obstetric haemorrhage) and heavily regulated. Used by blood bank staff, wards, theatre. Holds: donor identity, mandatory screening results (HIV/HBsAg/HCV/syphilis/malaria), blood group, unit numbers, cross-match records, recipient link. Screening results are the most stigma-bearing data in the building.

## Tier 4 — Inpatient (the coordination problem proper)

**21. Ward & bed management.** The bed board. Which beds exist, which are free, which are blocked for cleaning, which ward, male/female/paediatric, and who is in each. Used by the admissions office, ward sisters, ER, theatre. This is the canonical coordination module and the one that cannot be room-encrypted.

**22. Private & semi-private room allocation.** A bed class with a tariff, an attendant policy and a waiting list, plus the politics of who gets the good room. Used by admissions and the ops admin. Holds: room class, daily tariff, occupancy, attendant passes issued, requested-by.

**23. Admissions, transfers & discharge (ADT).** The state machine: admit → transfer → discharge/LAMA/refer-out/death. Drives the bed board, billing and the census. Used by admissions, wards, billing. Holds: admission number, admitting doctor, ward and bed, dates, disposition. The *reason* for admission is not an ADT field.

**24. Nursing station — charts, MAR, notes.** Vitals rounds, intake/output, nursing notes, and the **medication administration record** — the nurse ticking off each dose given. This module is routinely forgotten and it is where inpatient safety actually lives. Used by ward nurses across three shifts, which is precisely why a ward is a room and not a person. Holds: everything clinical about the stay.

**25. Doctor's rounds, progress notes & orders.** Ward round entries, order entry (drugs, tests, diet, precautions, mobility). Used by consultants, registrars, house officers. Fully clinical. This is where the *cause* lives, and where the operational **consequence** codes are minted (see Corollary A in §2).

**26. Operation theatre scheduling.** Booking a slot in a specific theatre, with a surgeon, an anaesthetist, a scrub team, a tray, a duration. Used by surgical secretaries, the OT in-charge, anaesthesia, CSSD, the wards. Coordination-critical and specialty-leaking.

**27. Operative record & anaesthesia record.** The pre-anaesthesia assessment, consent, the operative note, the anaesthesia chart, specimens sent, implants used, the count. Used by the theatre team. Entirely clinical.

**28. CSSD / sterilisation.** Tray composition, sterilisation cycles, load numbers, tray tracking to a case. Used by CSSD and theatre. Holds tray and cycle data; its link to a case is a tray code, not a procedure name.

**29. Diet & kitchen.** Meal counts by ward and diet code. Used by the kitchen. Holds: bed, diet code, allergies-as-avoidances. The purest example of substituting consequence for cause.

## Tier 5 — Emergency, records and the outside world

**30. Casualty / ER.** Triage, unidentified patients ("unknown male, ~40, brought by Edhi"), resuscitation, disposition within minutes, and the medico-legal case (MLC) register where police are involved. Used by ER doctors, nurses, front desk. Deceptively the hardest module: it needs registration-without-identity, instant bed access, instant OT access, and a legal disclosure channel.

**31. Ambulance & dispatch.** Calls, vehicle status, crew, pickup, destination, response times. Used by the dispatcher and drivers. Holds: call, address, vehicle, times, crew, patient identity if known.

**32. Medical records department (MRD).** Custody, not content. File location, borrowing, retention, statutory registers (birth, death, MLC), and issuing copies to patients on request. Used by MRD clerks. Holds: MR number, file movement, dates, retention flags. Deliberately no clinical content — this is the biggest reduction available in the whole design and it matches what an MRD clerk actually does.

**33. Discharge summaries & death certificates.** The dense clinical document handed to the patient, the referring doctor, and sometimes a panel. Used by the treating team. Fully clinical, with a printed copy that leaves the model entirely.

**34. Referrals in and out.** Sending a patient to another doctor or hospital with a note. Used by doctors. Uses the existing `reads: 'referred'` mechanism — a wrap added to the receiving room's key at the moment of referral.

**35. Duty rosters & attendance.** Who is on which shift, on-call lists, leave. Used by the ops admin and every in-charge. Holds staff and times, no patients. The plan's warnings about attendance-as-a-labour-relations-product apply and are unchanged.

**36. Infection control & notifiable disease reporting.** Hospital-acquired infection surveillance and the legally required outward report to the district health office. Used by the infection control nurse and the medical superintendent. This is a designed, doctor-initiated, logged export out of the clinical half — never an automatic feed.

**37. Housekeeping, laundry, biomedical maintenance, mortuary.** Bed turnaround requests, equipment service history, body register. Used by support staff. Trivially operational except the mortuary register, which is a statutory named record.

---

# 2. The boundary

## 2.1 The rule

Everything below is decided by one rule. It exists so that the module nobody has thought of yet — dialysis, labour room, physiotherapy, whatever a hospital asks for in 2028 — gets classified the same way by a developer who was not in this conversation.

> ## The Larkana Rule
>
> A datum may enter the **hospital-operational** tier only if all four hold:
>
> **(1) Coordination necessity.** Two or more rooms must act on the same value at the same moment, and the building physically cannot function if they disagree. *Convenience is not necessity. A report is not necessity.*
>
> **(2) Irreducibility.** There is no coarser form of the datum that still lets the building function. If `airborne precautions` works, `pulmonary TB` is forbidden.
>
> **(3) Non-implication.** After coarsening, it does not name, imply, or narrow to a small set a diagnosis, a treatment, a body part, or a behaviour.
>
> **(4) Minimum audience.** It is encrypted to the narrowest function key that satisfies (1) — never to "the hospital."
>
> **If (1) and (2) hold but (3) fails, the item is SPLIT**, not promoted: an *operational stub* (who / where / when / how many / what state) plus a *clinical body* (what and why) in a separate ciphertext, joined by an opaque id. The stub goes operational. The body stays clinical.
>
> **If (1) fails, the item is clinical-secret** no matter how convenient reading it would be.
>
> **Tie-break, stated once and never re-litigated:** when in doubt, clinical. Wrongly-clinical costs a phone call. Wrongly-operational is irreversible, and in Larkana it has driven families out of villages.

### The four corollaries a developer will actually use

**A — Substitution.** The operational tier takes the *consequence*, never the *cause*.

| Cause (clinical) | Consequence (operational) | Who needs it |
|---|---|---|
| Pulmonary TB, smear positive | `PRECAUTION: AIRBORNE` | ward nursing, porters, housekeeping |
| CKD stage 4 + diabetes | `DIET: LOW-SALT, DIABETIC` | kitchen |
| Post-CVA left hemiplegia | `MOBILITY: TROLLEY, 2 PERSONS` | porters |
| Radical nephrectomy for RCC | `TRAY 14 + LAP STACK, 150 min, GA, lateral` | CSSD, anaesthesia, theatre scheduling |
| Suicide attempt, on observation | `OBSERVATION: CONSTANT, NO SHARPS` | ward nursing |
| Neutropenic post-chemo | `PRECAUTION: PROTECTIVE` | ward nursing |

Every consequence code is minted **by the doctor or nurse inside the room**, deliberately, from a fixed vocabulary. The system never derives a consequence code from a diagnosis automatically — that would be a decryption key made of inference.

**B — The join rule.** *Quantity without identity* is operational. *Identity without quantity* is operational. **Their join is clinical.** Six vials of ceftriaxone left the store at 14:00 — operational. Ghulam Rasool was in room 4 at 14:00 — operational. Ghulam Rasool received six vials of ceftriaxone — clinical.

**C — Rooms, not tiers.** Anyone who must read clinical content is a **room** and gets a *wrap*, not a promotion. The pharmacy counter is a room. The lab bench is a room. The theatre team is a room. The ward nursing station is a room. This is the mechanism that makes a hospital work without moving a single byte across the boundary.

**D — Reduce the audience before you reduce the content.** Scoping Theatre 2's list to people rostered to Theatre 2 today is worth more than any amount of clever field-hiding, and it is what a paper theatre book already does.

### The test a developer runs at 9pm on a Tuesday

Write the shortest sentence the person **outside the room** must act on. Read it aloud in a corridor with the patient's neighbour standing there. If that would embarrass or endanger the patient, it is still too specific — go coarser or split it.

## 2.2 The hard cases, resolved

### The isolation ward admission

**Verdict: the bed placement is operational and it leaks. The leak is disclosed, not fixed. The reason for isolation is clinical.**

The bed board must know IW-3 is occupied or two patients get sent to it. It must know *by whom* or the ward sister cannot nurse him, the kitchen cannot feed him and the attendant cannot be told where to sit. There is no coarser form: "a bed in the isolation ward is taken" without a name does not let a hospital run.

What is achievable:

- **The ward's clinical meaning is a fact about the building, not about the patient.** You cannot rename the isolation ward. So accept it and reduce the audience: the identified census is encrypted to `fn-bedboard`, whose private half sits on ward nursing devices and the admissions desk — **not** on the cashier's terminal, not on the front-desk enquiry screen, not on `fn-office`. The ops admin and the IT man see `IW: 4 of 6 occupied`. They do not see names.
- **The front-desk enquiry screen shows `ADMITTED` and a ward-group label, not the ward.** Family and casual enquirers get "admitted, first floor." That single choice removes the largest audience.
- **The reason is a precaution code, not a diagnosis** (Corollary A). `AIRBORNE` covers TB, measles and COVID alike; `PROTECTIVE` covers neutropenia; `CONTACT` covers MDR organisms and much else. Four codes, all ambiguous by design, all sufficient for nursing.

**Honest residual:** anyone with `fn-bedboard` learns that this named patient is under airborne precautions. That is ward staff. In a paper hospital the same fact is written on a card clipped to the bed. This is not a regression and it must be stated in exactly those words.

### The bill that says "Inj. Ceftriaxone x6"

**Verdict: split. The charge stub is operational; the itemisation is clinical, wrapped to the billing room; the stock decrement is operational and patient-free.**

Three different records that the industry collapses into one:

| Record | Contents | Tier | Key |
|---|---|---|---|
| Charge stub | patient, `PHARM-INJ-3`, qty 6, Rs 1,800, department, time, opaque pointer | operational | `fn-billing` |
| Itemisation | `Inj. Ceftriaxone 1g, 6 vials, batch B4471` ← this patient | **clinical** | prescribing room + pharmacy room + `fn-billing`* |
| Stock movement | 6 × ceftriaxone 1g, batch B4471, store → OPD counter, 14:00–15:00 | operational | `fn-pharmacy` |

\* The billing room gets a wrap **only for items it must print on a bill**, added at the moment the charge is raised. That is the same mechanism as a referral. The cashier can render the patient's itemised bill. The cashier cannot browse the pharmacy's history, cannot query "who else got ceftriaxone", and cannot read anything from before the charge existed.

Charge codes are deliberately **coarse and category-level in the stub** (`PHARM-INJ-3` = injectable, price band 3), so the operational ledger supports revenue accounting without naming molecules. The fine-grained code lives in the itemisation.

**Honest residual:** the cashier who prints your bill reads your bill. This has always been true and is not fixable. What is fixable, and is done: he reads *yours, once, now* — not the hospital's.

### "Mr X, 2pm, Dr Y" on the OT list

**Verdict: the slot is operational and anonymous on the coordination box; the identified list is scoped to the theatre team; the operation is clinical. The surgeon-implies-specialty leak is real, unfixable, and disclosed.**

Applying Corollary D before anything else collapses this problem:

| Layer | Contents | Audience |
|---|---|---|
| Allocation ledger (the box) | `THEATRE-2, 14:00–15:30, TAKEN, lease=OT2-device, v37` | the box; nobody reads it as a human |
| Identified list | patient, surgeon, anaesthetist, `TRAY 14 + LAP`, GA, lateral, 150 min | `fn-theatre`, **scoped to that theatre, that day** |
| Ward-facing view | `Bed 12 → theatre, expected back ~16:30, NBM from 22:00` | `fn-bedboard` |
| Front-desk view | `IN PROCEDURE` | `fn-frontdesk` |
| Ops view | `THEATRE-2: 6 of 8 slots used, 82% utilisation` | `fn-office` — no names at all |
| The operation itself | indication, findings, operative note, specimens, implants, consent | **clinical** — theatre room + surgeon + recovery + break-glass |

CSSD gets `TRAY 14`, which is what CSSD actually needs and which does not name an operation. Anaesthesia gets duration, position and technique class, which is what anaesthesia actually needs.

**Honest residual:** if Dr Y is the hospital's only urologist, anyone who sees his name next to a patient's has learned something. There is no cryptographic answer to a rota pinned on a wall. Reduce the audience to the theatre team, then say so plainly.

### The pharmacy dispensing record

**Verdict: the pharmacy is a room. It receives a wrap. Nothing about the promise changes, and the promise's wording must change.**

A prescription that has been dispensed is a prescription that was read — by a pharmacist, on purpose, because that is how medicine gets into a patient. The founding promise was never "no human reads this." It was **"Nuskho cannot, and the hospital cannot routinely."**

Mechanically, and it costs nothing new:

- When the doctor sends a prescription to the hospital pharmacy, the data key gets a fourth wrap to the pharmacy room's public key. Prescriptions the patient takes to an outside chemist get no such wrap. **This is the `reads: 'referred'` mechanism from `open-a-clinic` §2.2 applied to a different room.**
- The **dispensing event** — patient, time, dispensed/partial/refused, amount charged — is operational under `fn-billing` and `fn-frontdesk`.
- The **stock movement** is operational under `fn-pharmacy`, patient-free, and **time-coarsened to the hour** (see the timing-correlation leak in §3).
- The **link** — this patient, this drug, this batch — is clinical, held by the pharmacy room and the prescribing room.

**Batch recall works and does not require promotion.** When a batch is recalled, the *pharmacy* runs the query against its own decrypted data and produces a list of patients to call. The medical superintendent asks; the pharmacist answers. The hospital does not need a readable link; it needs a person with a key and a telephone. That is also how it works on paper.

**The narcotics register is a statutory exception.** Pakistani law requires a named, signed register. It is patient-named, drug-named, held under `fn-pharmacy`, and it is disclosed as an exception in the terms. Do not pretend it away.

### The HIV / hepatitis serology order

**Verdict: the strictest tier in the entire system, with three extra measures no other data gets. Ratodero is why.**

In 2019 an outbreak centred on Ratodero, ~25 km from Larkana, infected roughly a thousand children with HIV, largely through unsafe injections. Families were ostracised; children were refused school; marriages broke. Any of these tests appearing on a screen a clerk can see is not a privacy incident in Larkana — it is a family's life.

So a named **sequestered test set** — HIV, HBsAg, HCV, VDRL/TPHA, β-hCG, drug screen, sputum AFB/GeneXpert, CD4/viral load, psychiatric assays, and blood-bank donor screening — gets:

| Item | Tier | Note |
|---|---|---|
| Test name | **clinical** | never on the operational tier, not even hashed |
| Result | **clinical** | not even an abnormal flag; a flag on an HIV test *is* the disclosure |
| Accession number | operational (`fn-lab`) | opaque; carries no test identity |
| Sample state (collected/received/reported) | operational (`fn-lab`) | needed to run the lab |
| Bench routing | **clinical** | the routing *is* the test — the bench label goes on an encrypted worklist |
| Priority | operational | routine/urgent only |
| Charge | operational (`fn-billing`), **price-blinded** | billed as `LAB — SPECIAL INVESTIGATION`, flat band |
| Result to whom | **clinical** | ordering room only; never auto-pushed to ward or front desk |

Three measures unique to this set:

1. **Price blinding.** Serology is billed under a coarse category at a band price, so a Rs 1,200 line cannot be read backwards. The hospital loses some revenue granularity on one category. Accept the loss.
2. **No operational result event.** For all other tests the operational tier records "reported at 15:40" so wards can chase results. For this set it records nothing — the ordering doctor is notified inside the clinical channel and the ward's screen says only `investigations pending: 1`.
3. **Sample labels carry the accession number and nothing else.** No patient name, no test name on the tube, on the request slip, or on the transport list. The name resolves only inside the ordering room and the lab.

And the honest addition: **a doctor who wants absolute certainty sends the patient to an outside lab on a paper slip.** The system must not fight that, must not require the order to exist, and must accept a result typed in by hand later. Some doctors will do this and they are right to.

### Discharge summaries and diagnosis codes for billing

**Verdict: the discharge summary is clinical. Coding for billing does not launder a diagnosis into an operational field. The claim is a sealed, signed, logged export — never a resident row.**

The summary is the densest clinical document in the building: presenting complaint, findings, investigations, procedures, course in hospital, complications, discharge medications, follow-up. Wrapped to the treating room, the recovery key, break-glass, and the doctor's own mirrors. **The printed copy handed to the patient leaves the model entirely** — paper is the patient's key and the patient may do anything with it.

On coding, the rule is one sentence: **a diagnosis code entered for billing is a diagnosis.** Calling a field "billing" does not change what it contains, and this is the exact place where a well-meaning developer will breach the boundary in 2028 while adding a panel integration.

So:

- **Default to package and procedure billing, not diagnosis billing.** Most Pakistani private hospitals already bill by package (`NORMAL DELIVERY PKG`, `LAP CHOLE PKG`, `WARD DAY — GENERAL`). Package codes satisfy (2) and mostly satisfy (3). Build this and never touch ICD.
- **When a panel demands ICD codes**, the coded claim is assembled *inside the clinical half* by a coder who holds a room key, sealed into a document addressed to that panel, signed, logged as a disclosure event, and shown to the treating doctor. The operational tier holds the claim id, panel, amount, dates and status — the envelope, not the letter.
- **The MRD holds no summaries.** It holds MR numbers, file locations and retention flags. An MRD clerk's job is custodial, and this is the single largest reduction available anywhere in this design.

## 2.3 The classification table

Every item, by module. `CS` = clinical-secret (room-wrapped). `OP:key` = hospital-operational under the named function key. `NV` = Nuskho-visible.

### Identity, staff, devices
| Item | Tier |
|---|---|
| ULID, MR number, printed patient number | `OP:frontdesk` |
| Name, sex, age, phone, town | `OP:frontdesk`, `OP:bedboard` |
| CNIC | `OP:billing` (panel/MLC only; blank otherwise) |
| Next-of-kin name & phone | `OP:frontdesk`, `OP:bedboard` |
| Religion, caste/biradari, occupation | **not collected at all** |
| Staff name, designation, PMC no., contact | `OP:office` |
| Roster, shifts, on-call, leave | `OP:office` |
| Device inventory, versions, pairing dates | `OP:office`, `NV` (counts only) |
| Key material, seeds, wraps | never leaves the machine |

### OPD
| Item | Tier |
|---|---|
| Registration event, arrival time, token | `OP:frontdesk` |
| Which room the patient was sent to | `OP:frontdesk` — **implies specialty; see §3** |
| Consultation fee, refund, waiver | `OP:billing` |
| Appointment slot, status | `OP:frontdesk` |
| Reason for visit / complaint | **CS** |
| Examination, diagnosis, `RxLine[]`, `RxSnap` | **CS** |
| Vitals & instant tests | **CS** |
| Tests requested, advice, follow-up date | **CS** |
| Visit outcome (`done`/`seen`/`left`/`referred`) | `OP:frontdesk` |
| `closeNote` (why, in the doctor's words) | **CS** |
| `urgent` flag | `OP:frontdesk` |

### Pharmacy
| Item | Tier |
|---|---|
| Drug master: brand, generic, form, strength, pack | `OP:pharmacy` |
| Stock on hand, batch, expiry, location | `OP:pharmacy` |
| GRN, supplier, purchase price, indent, transfer | `OP:pharmacy` |
| Stock decrement (drug, qty, hour, dispensing point) | `OP:pharmacy` — **hour-coarsened** |
| Dispensing event (patient, time, state, amount) | `OP:billing` |
| **Patient ↔ drug ↔ batch link** | **CS** (prescribing room + pharmacy room) |
| Substitution made, counselling given | **CS** |
| Narcotics register | `OP:pharmacy` — **statutory exception, patient-named** |

### Lab & radiology
| Item | Tier |
|---|---|
| Accession number, sample state, transport | `OP:lab` |
| Priority (routine/urgent) | `OP:lab` |
| Bench/modality workload counts | `OP:lab`, `OP:office` |
| Radiology machine slot | `OP:lab` + allocation ledger |
| **Test name** | **CS** |
| **Result, units, reference range, flags** | **CS** |
| Reported-at timestamp | `OP:lab` — **suppressed for the sequestered set** |
| Radiology report text | **CS** |
| Charge | `OP:billing`, price-blinded for the sequestered set |

### Blood bank
| Item | Tier |
|---|---|
| Donor identity, donation date, deferral status | `OP:office` (deferral **reason** is CS) |
| Unit number, group, component, expiry, location | `OP:pharmacy`-class stock key |
| **Donor screening results** | **CS** — sequestered set |
| Cross-match, issue to patient, transfusion record | **CS** (blood bank room + ward room) |
| Units issued count | `OP:office` |

### Ward, beds, IPD
| Item | Tier |
|---|---|
| Bed exists, class, sex-designation, free/blocked | allocation ledger (anonymous) |
| **Who is in which bed** | `OP:bedboard` |
| Ward name shown to nursing | `OP:bedboard` |
| Ward-group shown to enquiry desk | `OP:frontdesk` |
| Admission no., admitting doctor, dates, disposition | `OP:bedboard`, `OP:billing` |
| Precaution / diet / mobility / observation codes | `OP:bedboard` |
| **Reason for admission, diagnosis** | **CS** |
| Nursing notes, MAR, intake/output, charts | **CS** (ward room) |
| Rounds, progress notes, orders | **CS** |
| Attendant passes issued | `OP:frontdesk` |
| Private room tariff, waiting list | `OP:billing`, `OP:office` |
| Length of stay | `OP:billing` — **see §3, this leaks** |

### Theatre
| Item | Tier |
|---|---|
| Theatre slot taken/free, duration, version | allocation ledger (anonymous) |
| Patient, surgeon, anaesthetist on the list | `OP:theatre`, **scoped to theatre + day** |
| Tray code, anaesthesia class, position, laterality | `OP:theatre` |
| Theatre utilisation %, turnaround minutes | `OP:office` — no names |
| **Procedure name, indication** | **CS** |
| **Operative note, findings, specimens, implants, counts** | **CS** |
| Anaesthesia chart, pre-anaesthesia assessment | **CS** |
| Consent form (scanned or typed) | **CS** |
| CSSD tray composition, cycle, load number | `OP:pharmacy`-class stock key |

### Money
| Item | Tier |
|---|---|
| Charge stub (patient, coarse code, qty, amount, dept) | `OP:billing` |
| **Itemisation (fine code, drug/test name)** | **CS** + billing-room wrap at charge time |
| Bill total, payer, discount, authoriser | `OP:billing` |
| Payments, receipts, refunds, shift closing | `OP:billing` |
| Panel membership, claim id, amount, status | `OP:billing` |
| **Coded claim document (ICD/procedure)** | **CS**, sealed export only, logged |
| Tariff master, package definitions | `OP:office` |
| Revenue by department | `OP:office` — **department implies specialty; see §3** |

### ER, ambulance, records, statutory
| Item | Tier |
|---|---|
| Triage category, arrival, mode of arrival | `OP:frontdesk` |
| Unidentified-patient placeholder record | `OP:frontdesk` |
| **Presenting complaint, resuscitation record** | **CS** |
| MLC register (police-facing) | `OP:office` — **statutory exception** |
| Ambulance call, address, vehicle, crew, times | `OP:frontdesk` |
| Ambulance destination department | `OP:frontdesk` — **assign on arrival, not on dispatch** |
| MR number, file location, borrowing, retention | `OP:office` |
| Birth register, death register, mortuary register | `OP:office` — **statutory** |
| Cause of death | **CS**; the certificate is a sealed signed export |
| **Discharge summary** | **CS** |
| Notifiable disease report | **CS**, sealed doctor-initiated export, logged |
| Diet counts by ward, laundry, housekeeping requests | `OP:bedboard`, `OP:office` |

### Nuskho-visible — the whole list
| Item |
|---|
| Hospital name, town, contact person, licence state, paid-until |
| Which modules are enabled |
| App version per device; device count; platform |
| Last-seen timestamp per device |
| Key made: yes/no · Recovery sheet confirmed: yes/no · Last restore drill: date |
| Crash reports and error traces **with all record content stripped and a test that fails the build if any field of `Patient` or `Visit` can reach the reporter** |
| Support tickets the hospital writes, in their own words |

Nothing else. Not bed counts. Not patient counts. Not slips printed. Not revenue. Not doctor lists. Not utilisation. The plan already caught itself contradicting its own minimisation rule over attendance; the cheapest way to avoid that argument a third time is not to have the column.

---

# 3. What breaks the promise

The sentence *"Nuskho cannot read your consultations, but runs your hospital's operations"* is defensible. The sentence *"nobody can see anything"* is not, and a doctor in Larkana will find that out on his own within a month. Every leak, whether it is fixable, and what to say.

| # | Leak | What is actually learned | Fixable? | What is done |
|---|---|---|---|---|
| 1 | **Room routing at registration** | The clerk sends you to Room 7. Room 7 is psychiatry. | No | Disclose. Rooms are numbered, not labelled, on the desk screen — cosmetic at best. |
| 2 | **Ward census** | `fn-bedboard` holders see you are in the isolation ward under airborne precautions. | Partly | Audience cut to ward nursing + admissions. Enquiry desk sees a ward-*group*. Precaution codes replace diagnoses. Residual disclosed. |
| 3 | **OT list** | The theatre team sees the surgeon, and the surgeon implies the specialty. | Partly | Scoped to theatre + day. Ops sees utilisation only. Wards see "in theatre". Residual disclosed. |
| 4 | **Length of stay + ward + bill size** | 22 days in ICU with a Rs 900,000 bill is a serious illness. | No | Structural. Disclose. |
| 5 | **Revenue by department** | Rs 84,000 billed by oncology. | Partly | Roll up to a department *group* on any screen wider than the accounts office. Residual disclosed. |
| 6 | **Bill itemisation at the cash counter** | The cashier reads your bill. | No | It is the job. Wraps are per-charge and forward-only, so he cannot browse history. Disclose. |
| 7 | **Pharmacy timing correlation** | One vial of an unusual drug leaves the store at 14:03; one patient was in Room 4 at 14:00. | **Yes** | Stock decrements are **coarsened to the hour**, batched, and **not attributed to a room** — only to a dispensing point. This is a real fix and it costs nothing. |
| 8 | **Lab accession timing correlation** | Same attack via `fn-lab` sample timestamps. | **Yes** | Same fix: accession times rounded to the hour on the operational record; the precise time lives in the clinical half where the lab needs it. |
| 9 | **Lab bench routing** | "Sample went to serology" ≈ "HIV test". | **Yes** | Bench routing is on an encrypted worklist, not on the operational accession. |
| 10 | **On-call callbacks** | "Psychiatry consultant called to Ward 3, 02:10." | **Yes** | A consult *request* is clinical (ward room → consultant's room). Only the on-call *duty* is operational. Never log which specialist attended which bed in the operational tier. |
| 11 | **Referral routing** | "Referred to Dr Y, oncology." | No | Same class as #3. Disclose. |
| 12 | **Ambulance destination** | Dispatched to "obstetrics" or "psychiatry" before arrival. | **Yes** | Dispatch holds address, vehicle, crew, times. Destination department is assigned by ER on arrival, not by the dispatcher. |
| 13 | **Narcotics register** | Patient-named, drug-named, by law. | No | Statutory. Disclose as a named exception. |
| 14 | **MLC register** | Patient-named, police-facing, by law. | No | Statutory. Disclose. Log every police access. |
| 15 | **Birth / death / mortuary registers** | Named and statutory. | No | Disclose. |
| 16 | **Notifiable disease reporting** | A named diagnosis leaves the building to the district health office. | No | Statutory, but made a **deliberate, doctor-initiated, logged, shown-to-the-doctor** export rather than an automatic feed. Never a background sync. |
| 17 | **Panel/insurance claims** | Coded diagnoses leave to a third party. | Partly | Package billing by default. ICD only on demand, sealed, signed, logged, and shown to the treating doctor. |
| 18 | **Break-glass** | A 2-of-3 doctor quorum can open a colleague's record. | By design | Loud: logged unerasably, shown to the owning doctor in plain words *before anything else on his screen* the next time he opens the app. |
| 19 | **Backups carried by operations** | The ops admin holds the file. | **Yes** | Already solved in `open-a-clinic` §2.5: `backup-run` produces sealed ciphertext, `backup-open` is the doctor's alone. Enforce in code. |
| 20 | **Recovery shares** | Ops holding 2 of 3 envelopes decrypts every archive. | **Yes** | Already caught in the plan: in a non-sharing hospital, clinical shares are held by *doctors*. The hospital's own share set covers operational data only. |
| 21 | **A staff member with a logged-in device** | The operational tier is not encrypted *against staff* — that is what the function key is for. | Not by crypto | Role model, PINs, device scoping, and audit. **State plainly that operational encryption defends against Nuskho, the server, the network and a stolen disk — not against the ward clerk at her own terminal.** This is the sentence most likely to be omitted and it is the one that would make everything else a lie. |
| 22 | **Paper** | Files on trolleys, slips on desks, a bed card clipped to a rail. | No | The largest leak in any hospital and none of it is software. Name it, so the promise is not oversold. |
| 23 | **The pharmacist reads prescriptions** | By design. | Not a leak | But it *sounds* like one if the promise says "room-encrypted". Must be in the doctor-facing copy. |
| 24 | **Nuskho's own console** | Version, last seen, device count, drill status. | Already minimal | Keep it minimal. Resist every future request to add a count. |

## 3.1 The exact wording

### What the hospital signs — put this in the contract, not just the marketing

> **What Nuskho can and cannot see in your hospital**
>
> Nuskho — the company — can see that your hospital is running: which version each computer has, when each was last switched on, how many devices you have, and whether your recovery sheet has been printed. That is the whole list.
>
> Nuskho cannot see any patient's name, any diagnosis, any prescription, any test result, any bill, any bed, any operation, or how many patients you saw. Not because we choose not to look. Because we hold no key that opens any of it, and there is no way for us to obtain one. If a court orders us to produce your records, we can hand over unreadable bytes and nothing else.
>
> **What your own hospital can see is a separate question, and the answer is different.**
>
> To run a hospital, your staff must share information across rooms. Your ward staff can see which patient is in which bed and what precautions apply. Your theatre team can see today's list for their theatre. Your pharmacy can see what was prescribed to the patient standing in front of them. Your cashier can see the bill they are printing. Your accounts office can see totals by department.
>
> **This coordination information is encrypted, but it is encrypted so that your hospital can read it — not so that your staff cannot.** A member of staff signed in at their own terminal sees what their job requires. Encryption protects you against us, against theft of a computer, against interception on your network, and against a stolen backup. It does not protect you against your own staff, and no system that lets a nurse find a patient's bed could.
>
> **What your management cannot see, in any mode, with no override:** consultations, diagnoses, prescriptions, test results, nursing notes, operative notes and discharge summaries. Your operations administrator — in practice, your IT person — holds a key that opens rosters, stock, devices, tariffs and totals. It opens no clinical record. There is no setting that changes this and no support call that can change it either.
>
> **Where the line is crossed by law, and we say so rather than hide it:** the narcotics register names patients by law. Medico-legal cases are shared with police by law. Births, deaths and certain notifiable diseases are reported to the health authorities by law. These are legal obligations that your hospital carries and this software does not remove them. Each of these is logged, and the doctor concerned is shown that it happened.

### What every doctor sees on his own screen — permanently, in plain words, in Sindhi and English

Not in a settings page. On the screen he opens every evening.

> **Who can read what you write**
>
> - **Nuskho cannot.** Not your prescriptions, not your diagnoses, not your notes. We have never held a key to them and cannot be given one.
> - **Hospital management cannot.** Not the owner, not the administrator, not the IT department.
> - **The pharmacy can read a prescription you send to it** — that is how the medicine reaches the patient. Only that prescription, only from the moment you send it.
> - **The lab can read a test you order from it.** Only that order.
> - **The ward nurses looking after your admitted patient can read your ward orders and notes.** That is nursing.
> - **In an emergency, two other doctors together can open your record.** If they ever do, this screen tells you the next time you open it, before anything else, with their names and the reason. Nobody reads your records without you finding out.
>
> **What the hospital sees without opening anything:** that your patient exists, which bed he is in, that he had an operation in Theatre 2 at 2pm, what his bill was, and what medicines and tests were charged for. **A bill and a bed reveal something about a patient even when the record stays shut.** We cannot change that and we will not pretend otherwise.
>
> Your current setting: **only your own room reads your prescriptions.** [always shown, never buried]

### What the patient sees, on the slip

One line, in Sindhi and English, at the foot beside the existing Nuskho mark:

> *Your prescription is stored locked. The company that makes this software cannot read it.*

Not a claim about the hospital. Not a claim about doctors. Only the claim that is unconditionally true.

---

# 4. Architecture consequences

## 4.1 Keys

One seed per hospital, HKDF-derived, all of it minted on the hospital's own machine and never transmitted — unchanged from `open-a-clinic` §1.3.

```
seed (128 bits, OS CSPRNG, on the hospital's own machine)
 ├── root-sign        Ed25519   signs records, chains them, signs device identities
 ├── room[i]          X25519    consulting rooms, theatres, ward stations,
 │                              pharmacy counter, lab benches, radiology reporting
 ├── fn-frontdesk     X25519  ┐
 ├── fn-bedboard      X25519  │
 ├── fn-theatre       X25519  │ the operational tier — seven keys, not one
 ├── fn-pharmacy      X25519  │
 ├── fn-lab           X25519  │
 ├── fn-billing       X25519  │
 ├── fn-office        X25519  ┘
 ├── recovery         X25519    private half on paper only
 ├── breakglass       X25519    2-of-3 among DOCTORS, never administration
 ├── directory        AES       the counter's patient index
 └── device[n]        X25519    per paired device, for read-only mirrors
```

**Distribution.** A room's private half goes only to devices in that room. A function's private half goes only to devices holding that function. A ward tablet carries `room[ward-B]`, `fn-bedboard`, `fn-frontdesk`. It does not carry `fn-billing`. The cashier's terminal carries `fn-billing` and `fn-frontdesk` and no room key at all. Distribution happens at pairing, by the existing QR + six-digit SAS ceremony, in the room, with no network.

**Wrap sets, decided once:**

| Record | Wraps |
|---|---|
| Prescription (own room) | room + recovery + breakglass + doctor's mirrors |
| Prescription sent to hospital pharmacy | + pharmacy room, added at send |
| Lab order | + lab bench room, added at order |
| Charge itemisation | + `fn-billing`, added at charge |
| Ward nursing note / MAR | ward room + recovery + breakglass |
| Operative note | theatre room + surgeon's room + recovery + breakglass |
| Discharge summary | treating room + recovery + breakglass + doctor's mirrors |
| Identified census entry | `fn-bedboard` + recovery |
| Identified theatre list entry | `fn-theatre` + recovery |
| Charge stub, payment, claim envelope | `fn-billing` + recovery |
| Stock movement, indent, GRN | `fn-pharmacy` + recovery |

**The rules that do not move, from the plan:** data keys are single-use, any edit mints a new one; no data key ever has exactly one wrap; the data key is never derived from any password, and this is a test that fails the build. **No re-wrap engine in v1** — everything is decided at seal time. The "bring my old records onto this device" batch job stays the escape hatch, and it now applies to function keys too: a pharmacy paired in November cannot read October's dispensing history without one deliberate batch run.

## 4.2 The coordination service, and what it is not

Buy a ₨40,000 mini-PC. Put it on a UPS in the server cupboard. It runs on the hospital's LAN. **It is never in the cloud and Nuskho never hosts it.**

**It arbitrates anonymous resources and nothing else.** Its entire schema is:

```
resource_id      BED-B-12  |  THEATRE-2@2026-08-11T14:00  |  MRNUM-BLOCK-441
state            FREE | TAKEN | BLOCKED
lease_holder     device id
version          monotonic
at               timestamp
```

There is no patient in it. No name, no age, no ward-clinical meaning, no charge, no diagnosis. **It holds no function private key**, so if the box is stolen the thief gets a list of which bed numbers were occupied last Tuesday.

The *identified* views — who is in bed 12, whose name is at 2pm in Theatre 2 — are opaque blobs replicated through the box and decrypted on the ward tablet or the theatre tablet with the function key. The box relays ciphertext it cannot open.

This one decision does most of the work: it means a hospital-wide coordination problem is solved without any hospital-wide readable database existing anywhere.

## 4.3 The three sync planes

| Plane | Carries | Topology | Internet? |
|---|---|---|---|
| **1 — inside a room** | clinical | room host device is authoritative; counter/mirror clients over LAN, TLS pinned at pairing | never |
| **2 — across the hospital** | operational + anonymous allocation | the on-prem box, LAN, TLS pinned | never |
| **3 — outside the hospital** | one-way, read-only, to a doctor's own devices; heartbeat to Nuskho | encrypted push | yes, and its failure is silent |

**Two-way multi-writer sync is still not built.** Plane 1 is one writer by topology. Plane 2 is one writer per resource by lease. Plane 3 is one writer by definition. This is the plan's single largest saving and this design does not spend it.

## 4.4 Coordination offline: the custody rule

This is the answer to the brief's central problem, and it is not a cryptographic answer. It is an operational one.

> **You may allocate offline exactly what you physically hold.**

Coordination is partitioned by physical custody, which is how a paper hospital already works: the ward sister owns her beds, the OT list is on the theatre notice board, the counter clerk owns his receipt book, the pharmacy owns what is on its shelf.

| Resource | Lease unit | Works with the box down? |
|---|---|---|
| MR / patient numbers | a contiguous block per issuing device | **Yes**, indefinitely, per `open-a-clinic` §3.5 |
| Tokens | the counter device owns today's tokens | **Yes** |
| Beds | each ward holds a lease on **its own** beds | **Yes** within the ward. Cross-ward transfer: no. |
| Theatre slots | each theatre holds a lease on **its own** day's list | **Yes** — reorder, cancel, add within its own list. Bumping a case into another theatre: no. |
| Radiology slots | the modality holds its own day | **Yes** |
| Pharmacy stock | each dispensing point holds a lease on the **imprest it physically has** | **Yes** — dispense from the shelf. Drawing from the main store: no. |
| Blood units | the blood bank holds its own fridge | **Yes** |
| Bills | each department bills its own charges | **Yes**, per department. The consolidated total at discharge: provisional. |

**What genuinely cannot work with the box down**, stated so nobody promises otherwise:

- A truthful hospital-wide free-bed count. You get "at least N free as of 18:40" plus per-ward truth.
- Moving a patient between wards without a telephone call. (The telephone call already happens. Record it when the box returns.)
- An emergency case bumped into another surgeon's theatre.
- A final consolidated bill across departments.
- Panel claim submission (needs internet regardless).

**Staleness is shown, never hidden.** Every screen displaying a coordination value carries `as of 18:40` and greys past ten minutes. A number that pretends to be live when it is not is worse than no number — a bed shown free that is occupied sends a trolley into a room with someone in it.

**Reconnect: the custodian wins, and nothing merges.** The ward's own bed states overwrite the box. The theatre's own list overwrites the box. This is the same "take, don't merge" discipline already shipped for the counter's `fee` versus the room's `lines`. Conflicts that survive — two wards both claiming the same patient, two theatres both claiming an emergency case — become a **work item for a human**, on a list, with both versions shown. Never auto-resolved.

## 4.5 Load-shedding: the actual sequence

Power goes at 19:40. This is not an edge case in Larkana; it is Tuesday.

| Time | What happens |
|---|---|
| 19:40 | Power cuts. The box (on a UPS) stays up 20 minutes. The doctor's desktop dies unless it has a UPS. Ward tablets, the counter phone and the theatre tablet run on their own batteries. |
| 19:40 | **The half-written consultation survives.** `db.ts` writes on every change and that property must survive the move to a real file on disk. It is the single most important line of defence in the whole product. |
| 19:41 | The counter keeps registering, taking money, printing tokens from its lease. The ward keeps admitting into its own beds. The theatre keeps working its own list. The pharmacy keeps dispensing from its imprest. |
| 20:00 | The box dies. Every device now shows `as of 19:59` on coordination values. Cross-ward transfer is blocked with an explicit message, not a spinner. |
| 20:05 | A doctor with a UPS keeps prescribing and printing. A doctor without one cannot — **because his printer has no power either.** This is a purchasing problem, and it belongs in the install guide, not in the architecture. |
| 20:20 | Power returns. Devices reconnect over LAN. Each pushes what it holds. The box takes, does not merge. Anything genuinely contradictory lands on a human's work list. |
| 20:21 | No re-authentication, no cloud round trip, no key server, no lease check against the internet. The 30-day device authorisation and the day-open PIN are already on the machine. |

**Two purchasing requirements that must be in the install guide** and are not engineering problems: a UPS on the coordination box, and a UPS on any machine that prints. **A printer without power does not print regardless of how good the software is**, and this fact should be told to a hospital before it is discovered.

**Do not ship the "session not closed properly" flag.** The plan already established that load-shedding makes it meaningless in Larkana. It is even more meaningless across forty devices.

## 4.6 What each module can do with everything down

| Module | One device alone | LAN, box down | Fully offline hospital |
|---|---|---|---|
| Prescribe & print | **Yes** | Yes | Yes |
| Vitals | Yes | Yes | Yes |
| Registration, token, fee | **Yes** (lease) | Yes | Yes |
| Patient lookup | Local directory only | Yes | Yes |
| Pharmacy dispensing | From imprest | Yes | Yes |
| Lab: collect & run | Yes | Yes | Yes |
| Lab: result to doctor | No — needs the room link | Yes | Yes |
| Ward nursing notes, MAR | Yes (ward device) | Yes | Yes |
| Admit to own ward | Yes (ward lease) | Yes | Yes |
| Transfer between wards | No | No | No — telephone, record after |
| Theatre: work own list | Yes | Yes | Yes |
| Theatre: bump to another theatre | No | No | No |
| Departmental bill | Yes | Yes | Yes |
| Consolidated discharge bill | No | Yes | Provisional |
| Panel claim | No | No | No — needs internet |
| Discharge summary | Yes | Yes | Yes |
| Nuskho heartbeat | No | No | Irrelevant |

**Every clinically urgent action is in the "one device alone" column.** Every action that cannot work offline is one where a human would have picked up a telephone anyway.

## 4.7 Four code-level consequences

1. `connect-src 'none'` comes out of the headers. Planned, visible, screenshot-able. Say it before someone greps for it.
2. **A build-failing test** that no code path can produce a data key from a password, and no code path can move a `Patient` or `Visit` field into the crash reporter or the heartbeat.
3. **The classification is a type, not a comment.** Every persisted field carries a tier annotation and the storage layer refuses to write an unannotated one. This is the only mechanism that will still be enforcing the boundary in 2029 when someone else is writing the code.
4. `roles.ts` grows from three roles to seven and `Can` grows accordingly — but the invariant in its header comment stands unchanged and should be quoted in the new file: *a role is a floor, never a ceiling on speed.*

---

# 5. Dependencies and order

## 5.1 The graph

```
                    ┌──────────────────────────────────────────┐
   TIER 0           │ Desktop app · real file on disk · print  │  ← exists, must be ported
   FOUNDATIONS      │ Keyring · recovery sheet · restore       │
                    │ Roles v2 · device pairing                │
                    │ Patient registry · LEASES                │
                    └───────────────┬──────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
      ┌───────────────┐   ┌──────────────────┐   ┌────────────────┐
      │ REGISTRATION  │   │ CONSULTATION &   │   │ STAFF REGISTRY │
      │ /OPD · queue  │──▶│ PRESCRIBING      │   │                │
      │ token · fee   │   │ (shipped)        │   │                │
      └───────┬───────┘   └────────┬─────────┘   └───────┬────────┘
              │                    │                     │
              ▼                    ▼                     ▼
      ┌───────────────────────────────────┐      ┌──────────────┐
      │ CHARGE CAPTURE  ◀── the linchpin  │      │ DUTY ROSTERS │
      └───────┬───────────────────────────┘      └───────┬──────┘
              │                                          │
   ┌──────────┼──────────┬──────────────┐                │
   ▼          ▼          ▼              ▼                │
┌────────┐ ┌──────┐ ┌─────────┐ ┌──────────────┐         │
│PHARMACY│ │ LAB  │ │RADIOLOGY│ │BILLING &     │         │
│dispense│ │orders│ │  RIS    │ │PAYMENTS      │         │
│+ STOCK │ │+ LIS │ │         │ │              │         │
└───┬────┘ └──┬───┘ └────┬────┘ └──────┬───────┘         │
    │         │          │             │                 │
    │         │          │             ▼                 │
    │         │          │      ┌─────────────┐          │
    │         │          │      │PANELS/ZAKAT │          │
    │         │          │      └─────────────┘          │
    │         │          │                               │
    └─────────┴──────┬───┴───────────────────────────────┘
                     ▼
        ┌────────────────────────────────┐
        │ COORDINATION SERVICE (the box) │  ← the gate to everything inpatient
        │ anonymous allocation ledger    │
        └──────────────┬─────────────────┘
                       ▼
        ┌──────────────────────────────┐
        │ WARD & BED MANAGEMENT        │
        └──────┬───────────────┬───────┘
               ▼               ▼
      ┌────────────────┐  ┌─────────────────┐
      │ PRIVATE ROOMS  │  │ ADT (admissions,│
      │ (bed class +   │  │ transfer,       │
      │  tariff)       │  │ discharge)      │
      └────────────────┘  └────┬────────────┘
                               │
        ┌──────────────────────┼──────────────────┐
        ▼                      ▼                  ▼
┌───────────────┐   ┌──────────────────┐  ┌───────────────┐
│NURSING: charts│   │ DISCHARGE        │  │ DIET/KITCHEN  │
│ MAR, notes    │   │ SUMMARIES        │  │ HOUSEKEEPING  │
└───────┬───────┘   └──────────────────┘  └───────────────┘
        │
        ▼
┌──────────────────┐         ┌─────────────┐
│ ROUNDS & ORDERS  │────────▶│ BLOOD BANK  │◀── needs LAB + STOCK + ADT
└────────┬─────────┘         └─────────────┘
         │
         ▼
┌────────────────────┐
│ OT SCHEDULING      │  ← needs box + ADT + rosters + rooms
└─────────┬──────────┘
          ▼
┌──────────────────────┐   ┌──────────┐
│ OPERATIVE RECORD     │──▶│ CSSD     │
│ ANAESTHESIA RECORD   │   └──────────┘
└──────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ CASUALTY / ER   needs: registration-without-identity,     │
│                 triage, instant beds (ADT), instant OT,   │
│                 MLC register.  DEPENDS ON NEARLY ALL.     │
└──────────┬───────────────────────────────────────────────┘
           ▼
   ┌──────────────┐
   │ AMBULANCE    │  (dispatch is nearly standalone; useless without ER)
   └──────────────┘

┌────────────────────────────────────────────────┐
│ MEDICAL RECORDS DEPT · statutory registers      │  ← custodial layer over everything
│ REFERRALS (uses the existing wrap mechanism)    │  ← can ship any time after Tier 1
└────────────────────────────────────────────────┘
```

## 5.2 Hard prerequisites, stated as rules

| Module | Cannot be built before | Why |
|---|---|---|
| Anything | desktop app + keyring | browser storage eviction; no room keys, no boundary |
| Anything multi-device | leases | `nextPatientNum()` collides; two patients, one number, on paper |
| Billing | **charge capture** | otherwise billing reads the clinical record and the promise dies on day one |
| Pharmacy dispensing | prescriptions + pharmacy-as-a-room wrap | there is nothing to dispense and nobody who can read it |
| Pharmacy stock | drug master with packs and batches | `types.ts` `Drug` has no pack size, no batch, no expiry — schema work first |
| Lab results | lab-as-a-room wrap + accession identity | results must land somewhere only the ordering room can read |
| **Anything inpatient** | **the coordination box** | this is the hard gate; do not attempt beds without it |
| Private rooms | ward & bed management | a private room is a bed class with a tariff, nothing more |
| ADT | ward & bed management | you cannot admit into beds that do not exist |
| Nursing/MAR | ADT + ward-as-a-room | a ward must exist and must have a key |
| Discharge summary | ADT + nursing + rounds | it summarises a stay |
| OT scheduling | box + ADT + rosters | pre-op bed, post-op bed, an anaesthetist who is on duty |
| Operative record | theatre-as-a-room | someone must be able to read it afterwards |
| Blood bank | lab + stock + ADT | screening is lab, units are stock, issue is to a bed |
| ER | registration-without-identity + triage + ADT + OT | ER is a fast path *through* everything, so it comes after everything |
| Panels/claims | billing + internet + a lawyer | a coded claim leaving the building is a legal act |
| MRD | most modules | it is custody of what the others produced |
| Referrals | the wrap mechanism only | **can ship early** — cheap, and it is `reads: 'referred'` already designed |

## 5.3 The order, and the honest arithmetic

`nuskho-open-a-clinic.md` §6 already concludes that Phase 1 alone — a desktop app, a key, a recovery sheet, a counter phone, thermal printing — **is closer to two years than sixteen weeks at ten hours a week**, and recommends cutting to a desktop app plus a key plus a recovery sheet as an eight-week ship.

Everything in this document sits **on top of that conclusion**, not instead of it. A hospital management system, honestly scoped, is:

| Stage | Contents | Realistic effort |
|---|---|---|
| **A** | Desktop app, file on disk, keyring, recovery, USB backup, Safeer's console | 8–10 weeks (already scoped) |
| **B** | Leases, roles v2, LAN, counter device, function-key machinery | 10–14 weeks |
| **C** | Charge capture + billing + payments + drug master with batches + pharmacy stock & dispensing | 16–20 weeks |
| **D** | Lab orders & results, the sequestered-test machinery, radiology orders | 12–16 weeks |
| **E** | The coordination box, ward & bed management, private rooms, ADT | 20–26 weeks |
| **F** | Nursing charts, MAR, rounds, orders, discharge summaries | 20–26 weeks |
| **G** | OT scheduling, operative record, CSSD, anaesthesia | 16–20 weeks |
| **H** | ER, ambulance, blood bank, MRD, statutory registers, panels | 26+ weeks |

**That is five to seven years for one part-time person, and it is not a plan, it is an obituary.** Say it now, while it is cheap to agree with, exactly as the plan's budget section says about a smaller scope.

### The sequence I would actually build

**Stop after Stage C and sell that.** A hospital in Larkana that gets OPD registration, prescribing that prints, a pharmacy that knows its stock and its expiry dates, and a billing counter that reconciles at shift end has bought most of what a hospital management system is worth to it. Pharmacy stock alone — expiry, batch, reorder — is a module hospitals pay for on its own, and it is the module in this whole document with the **least** boundary risk, because it holds no patients.

**Stage D next**, because lab is the second-biggest revenue centre and because the sequestered-test machinery is the thing this company should be known for in Ratodero's district.

**Stage E is the gate.** The coordination box is a genuinely different product with a genuinely different failure mode: a bed board that is wrong sends a trolley into an occupied room. Do not cross into E without a second developer and a hospital that has signed something. The founder's own plan already put "built when Indus signs something, not before" in writing for a smaller feature.

**Ship referrals whenever there is a free week.** It is nearly free and it is the only module here that makes the encryption *visible* to a doctor as a feature rather than as an obstacle.

---

# 6. What I am unsure about

Listed rather than papered over.

1. **Whether "encrypted to a function, not to a hospital" survives contact with a real hospital's staffing.** In Larkana one person is often the cashier, the storekeeper and the receptionist at eight in the evening. If that person's device ends up holding five function keys, the audience reduction is theatre. The design's answer is that keys are per-device-per-role and a role change requires a re-pair — but I have not tested whether a hospital will tolerate that friction, and if it will not, the honest response is to say the audience is wider rather than to pretend.

2. **The precaution-code vocabulary.** `AIRBORNE / CONTACT / DROPLET / PROTECTIVE` is a clean four-way split on paper. Whether a ward sister in Larkana will use it correctly, or will write the diagnosis into the free-text field beside it within a week, is untested. If she writes the diagnosis in, the operational tier has silently swallowed clinical content and nobody will notice. **The free-text field beside a precaution code should probably not exist.** I have not decided this and it matters.

3. **Price-blinding serology.** I am confident it is right and unsure whether a hospital accountant will accept losing per-test revenue granularity on a profitable category. If he refuses, the fallback is that the sequestered tests are billed as cash-outside-the-system, which is worse in every way except the one that matters.

4. **The exact statutory position** on the narcotics register, the MLC register, notifiable disease reporting under Sindh's arrangements, blood bank record-keeping under the Sindh Blood Transfusion Authority, and Sindh Healthcare Commission inspection requirements. I have described these as they generally work. **Every one of them needs an hour with a Pakistani lawyer before it is built**, and the plan's own advice to get that hour before the first clinic uploads anything applies with much more force to a hospital.

5. **Whether the coordination box is one box or two.** One box is a single point of failure for the whole building's coordination. Two boxes in a leader/follower pair is not much more code and is much more expensive to operate correctly. I have specified one, on a UPS, with per-resource leases that make its absence survivable — but I have not modelled what happens when its disk dies at 11pm and the hospital has no bed board at all until morning. The lease design means each ward still knows its own beds, which I believe is enough. I am not certain.

6. **Whether package billing really removes the need for ICD.** It does for cash and most corporate panels. It probably does not for Sehat Sahulat or any future state scheme, and Sindh's participation in those schemes is something I do not know the current state of. If a state scheme is a required payer, coded diagnoses leaving the building become routine rather than exceptional, and that is a materially weaker promise than the one written above.

7. **The ER module.** I have placed it last on dependency grounds and I think that is correct engineering and possibly wrong commercially — ER is where a hospital feels chaos most acutely and would pay most readily. If a hospital asks for ER first, the answer is that ER without beds and without theatre is a triage notebook, and a triage notebook is worth building as a triage notebook rather than as a wedge into a system that does not exist yet.

8. **Whether the founder should build this at all.** The plan's own closing argument stands and grows stronger with every module added here: the ranked real harms are a misread pictogram first, lost records second, and a curious employee at a cloud provider third. A hospital management system moves a one-person company into a market where the competitors have twenty engineers and the failure modes include a trolley arriving at an occupied bed. **The pharmacy-and-stock module is the one place where that risk is low, the money is real, and the boundary is nearly free to hold.** If only one thing from this document gets built, it should be Stage C.