I've read the plan, the clinic-opening design, and the code. Here is the pharmacy module design.

---

# Nuskho: the hospital pharmacy

Design document v1. Written against `nuskho-plan-v4.md`, `nuskho-open-a-clinic.md`, and the code as shipped on 4 August 2026 (`types.ts`, `db.ts`, `roles.ts`, `safety.ts`, `code.ts`, `data/who.ts`, `data/clean.ts`, `print/token.ts`, `print/qr.ts`, `screens/Intake.tsx`, `screens/setup/MarketPaste.tsx`).

**The invariant, inherited and unchanged:** a patient must be able to receive medicine with the internet down, the router unplugged, the power flickering, and the doctor's laptop asleep. The pharmacy module makes **zero network calls outside the building** — not for prices, not for a drug database, not for a licence check. It never has and never will.

**The second invariant, new here and just as load-bearing:** *the shelf and the drawer are the truth; the ledger catches up.* Software may never refuse to hand a patient his medicine because a number in a database disagrees with a box on a shelf. Every design decision below that looks lax is this rule being obeyed.

**The boundary, restated because this is the module most likely to break it:** this is the hospital's own department, inside the building that wrote the slip. It is not an app for bazaar medical stores, and no prescribing, dispensing, sales or supplier data ever leaves the hospital. Nuskho's console learns exactly three things: the pharmacy module is switched on, its version, and when it last backed up. Not one row, not one count, not one aggregate. There is no drug-company report and there never will be — that is the single most saleable thing this module could produce and it is the thing that must not exist.

---

# 1. What the job actually is

## 1.1 A day at the counter

**7:40am.** The storekeeper unlocks the roller shutter. The fridge has been off since 2am — load-shedding — and came back at 5:10. The min–max thermometer inside reads 14°C peak. There are eleven vials of insulin and two boxes of anti-rabies vaccine in there. Nobody wrote down that the power went, because nobody was there. He looks at the thermometer, shrugs, and starts the day. **This is the single most expensive unrecorded event in a Pakistani hospital pharmacy, and it happens most weeks.**

**8:15am.** A distributor's man arrives on a motorbike with two cartons and an invoice. The invoice is for Rs 41,600, ninety days' credit, and one line says `AUGMENTIN 625MG 6'S — 20 + 2`. The two are free: a scheme. The storekeeper signs the delivery challan, puts the cartons under the counter, and will enter them in the register "later". Later is Thursday. Between now and Thursday the counter sells from those cartons.

**9:00am.** OPD opens. The queue is fourteen deep and none of them have prescriptions yet.

**9:20am.** First customer of the day has no prescription at all. He wants "the tablet for fever, the yellow one", two of them, loose, cut off a strip of ten. Rs 12. Cash into a drawer. **This — a walk-in, no prescription, loose tablets, cash — is somewhere between half and three-quarters of the counter's transactions and most of its cash.** Any design that treats it as an exception has designed the wrong product.

**9:35am.** A slip arrives from Room 2. Three medicines. AUGMENTIN 625 one three times a day for five days; BROFEX syrup one spoon three times a day; PANADOL as needed. The counter has no AUGMENTIN — he has CALAMOX 625, same formula, different company, Rs 90 cheaper. He substitutes without saying anything, because he always does. The patient's slip says AUGMENTIN and the box in her hand says CALAMOX and she cannot read either. **Two days later she buys AUGMENTIN from a bazaar shop because she thinks she is missing a medicine, and takes both.**

**10:30am.** The AUGMENTIN course is fifteen tablets. The strip has six. He gives her two strips and three loose, cut with scissors from a third strip. The remainder of that third strip — three tablets — goes back in the box, and it can never be returned to the distributor, because it is cut.

**11:00am.** A woman has Rs 400 and a prescription that costs Rs 1,340. She buys the antibiotic and two days of the syrup and leaves the rest. She will come back on Friday, maybe. **This is the most common partial dispense and it is about money, not stock.**

**12:00pm.** The doctor's own son comes for cough syrup. Free. Nothing is written down.

**1:30pm.** Somebody from Ward 1 comes for cannulas, an ampoule of Buscopan and a bottle of normal saline. There is no bill, no signature, no record. The stock is simply less.

**2:00pm.** A drug inspector could walk in. There is a narcotics register in a drawer. Its last entry is eleven days old and the balance in it does not match the box.

**3:00pm.** Shift change. The morning salesman counts the drawer, takes out what he thinks the float was, and hands over. Nobody counts anything on a shelf.

**5:00pm.** Power goes. The PC dies mid-sale — three items already handed over the counter, money already taken, nothing saved. The counter keeps working on paper for forty minutes.

**7:30pm.** Evening OPD. Peak. Twenty-two people in a corridor, one salesman, one screen, and the pharmacy is the last stop before everyone goes home. **The queue at the pharmacy is longer than the queue at the doctor, because everyone passes through it and nobody skips it.**

**9:00pm.** He closes. There is Rs 38,000 in the drawer. He does not know what it should be. He never has.

## 1.2 What the software has to survive

Ranked by how often it will hurt, which is not the same as how interesting it is:

1. **A salesman, not a pharmacist.** Matric pass, fast, capable, uninterested in software, and he will click through any dialog. A warning he can dismiss is a warning that does not exist. The only two mechanisms that work on him are a **blocked button with one sentence** and a **second person's PIN**.
2. **Speed under a queue.** If dispensing a three-line prescription takes longer than reading the paper and pulling boxes off a shelf, the software is bypassed within a week and used only for billing. Then the stock figures are fiction and the whole module is worthless. **The counter screen is the product; everything else is bookkeeping.**
3. **Loose units.** Strips are cut. Stock is 9 strips and 6 tablets. Ledger arithmetic must be in single units and display must be in strips, always both, never one.
4. **Sales with no prescription.** Most of the business. Must be first-class, must be as fast as the prescription path, and must not become a place to hide theft.
5. **Load-shedding.** Twice a day. Mid-sale. The transaction boundary has to be exactly right or stock moves that never happened.
6. **Distributor credit and schemes.** Goods arrive before they are entered, free units distort margin, and the supplier balance is currently kept in a copy book.
7. **Batch and expiry.** Two batches of the same brand on the shelf with different expiries and different printed MRPs. Expired stock still physically present. Near-expiry goods returnable to the distributor only if uncut and returned in time.
8. **Cold chain in a town with daily load-shedding.** The excursion is the normal case. Software cannot prevent it; it can make it visible and attributable, and nothing more honest than that is available.
9. **Narcotics.** A legal register with a running balance that must be exact, produced on demand for an inspector, in a hospital where the counter staff will not maintain one voluntarily.
10. **Theft.** Not dramatic theft — a strip a day. The only detector is a physical count, and the only useful count is a **blind, frequent, small one**.
11. **The contractor problem.** In many Pakistani hospitals the pharmacy is leased to an outside operator on a monthly rent. If that is true here, the hospital cannot demand reconciliation reports and half of §3.5 has no customer. **Ask before building.** See §9.

---

# 2. The two halves

## 2.1 The privacy boundary, first, because it constrains everything

The pharmacy is a different room from the consulting room. Under `reads: 'mine'` — which is the default and the thing United Medical Centre would be buying — the pharmacy has **no read access to `Visit` at all**, ever, in any mode.

What crosses is a purpose-built object, the **`RxHandoff`**: the medicine lines and nothing else, sealed in the room at print time and wrapped to the pharmacy device's key as one additional wrap.

The justification, and it has to be stated in one sentence a doctor accepts: **the pharmacy learns nothing it would not learn from the paper in the patient's hand.** The patient is walking to the pharmacy carrying the printed slip. The handoff is that slip, in electrons, arriving thirty seconds earlier.

What is *not* on that paper and therefore is not in the handoff: diagnosis, vitals, tests, advice, the fee, the close note, previous visits, any other patient. **There is no field on `RxHandoff` for any of them.** This is deliberate: it is not a projection function somebody can forget to update, it is a type that has nowhere to put the thing.

Three further rules that make this hold:

- **`sendToPharmacy` is a per-room setting, default on in a hospital, off in a solo clinic, and shown on the doctor's own screen in plain words** — the same rule the sharing mode already follows. A doctor who does not want his lines pushed turns it off and the pharmacy types from the paper, which is what happens today.
- **There is no patient screen in the pharmacy module.** You can look up a bill. You cannot look up a person and see what they have been given. This is the aggregation firewall, and it is a UI and permission rule, not a data-retention one.
- **Handoff lines are purged after 90 days.** What survives is the sale — items, quantities, money, patient number — which is what a tax authority, a dispute and a drug inspector need, and which is not a medication history.

Consequence, stated because someone will hit it: a prescription written in Dr Ahmed's room under `mine`, taken to the pharmacy, works. A prescription written *elsewhere* — another hospital, a bazaar doctor, a slip from Karachi — does not arrive as a handoff at all, and the pharmacy types it. That path is not a degraded mode. **It is the majority path in year one and it must feel like the normal way to work.**

## 2.2 Dispensing

### How the prescription reaches the counter

Four routes, in the order the screen offers them:

**1. Scan the QR on the slip.** The shipped QR carries `NUSKHO:48213` — the *patient* code, not the prescription. That is correct and stays. The pharmacy resolves it to *the open handoffs for that patient number*, of which there is normally exactly one. One scan, one Enter, the lines are on screen. This costs nothing new: `print/qr.ts` and `code.ts` already ship, `readQrPayload` already accepts a keyboard-wedge USB scanner typing into a focused box, and a ₨600 USB scanner on a pharmacy PC is the correct hardware. Sub-second.

**2. Type the five digits.** The Luhn check digit in `code.ts` is what makes this safe. It stays first-class and always visible, because slips get folded through the QR square and thermal tokens fade.

**3. Pick from today's list.** The pharmacy screen holds a short list of handoffs that arrived today and have not been closed. If the patient hands over nothing, the counter finds her by name in a list of eleven, not by searching a database of five thousand.

**4. Type it from the paper.** Always available, never hidden behind a "manual entry" link. This is how every outside prescription is handled and how *every* prescription is handled when the LAN is down.

**The handoff never blocks.** If it has not arrived, route 4 is one tap away and looks identical.

### Double redemption

A handoff carries `expiresAt` (default 7 days) and a per-line `given` running total. Once every line is `full`, the handoff is `closed` and scanning it again shows "already given, on Tuesday at 6:40pm" with the bill number — not an error, information, because the person asking is usually a patient who lost a box.

Paper is paper. Someone can take the same slip to a shop in the bazaar and buy the course again. That is not our problem and pretending to solve it would mean building the aggregator.

### Partial dispensing

First-class, four ways, each one tap on the line row:

| Reason | What the counter does | What is recorded |
|---|---|---|
| Only 4 of 10 in stock | taps the line, types 4, or taps **all I have** | `short: 'stock'`, and a back-order row |
| Patient has Rs 400 | reduces days on the line, or unticks it | `short: 'money'` |
| Patient refuses one | unticks | `short: 'patient-refused'` |
| Doctor said start with this | unticks | `short: 'doctor-said'` |

On finishing, if anything is outstanding, the counter prints a **balance slip**: the same bill format with the undelivered lines and a line in Sindhi saying what is still owed and until when. The patient brings it back; scanning it opens the same handoff with the remainder pre-filled.

**Back-orders.** A stock shortfall optionally captures a phone number **typed by the patient at the counter** — not pulled from the clinic's patient record. The pharmacy is not given the clinic's directory. When the item is received, the receive screen shows "3 people are waiting for this."

## 2.3 Stock

Six movements, and they are the whole of it:

- **In:** receive (against a supplier invoice), opening balance, count-adjust upward, patient return (same-day, unopened, sealed).
- **Out:** dispense, counter sale, ward issue, staff/free, sample, return to supplier, expired, damaged, lost, count-adjust downward.

Two rules govern all of them, and everything in §3.5 depends on both:

**A `Move` is never edited and never deleted.** A mistake is a new, opposite `Move` of kind `void` pointing at the old one. The item card is therefore an append-only tape and no history can be tidied.

**Any movement that reduces stock without producing money requires a second person's PIN.** Expired, damaged, lost, sample, staff, downward count-adjust, and void. Not a warning — a second PIN. This is the classic segregation-of-duties control, it is one screen, and it is where theft goes when the counter is watched.

---

# 3. The hard problems

## 3.1 Units — pack, strip, unit, ml, vial

This is the top dispensing error and the model has to be boring enough to be right.

### The three quantities that get confused

| | What it is | Where it lives |
|---|---|---|
| **Dose points** | what the doctor wrote. `dose.m + dose.d + dose.n`, times `days`. Dimensionless. | the prescription |
| **Content** | the actual medicine: tablets, millilitres, grams, IU | derived |
| **Sale units** | the physical thing that leaves the counter: a tablet, a bottle, a vial, an ampoule, a tube | the ledger |

**The ledger holds sale units and only sale units, as integers.** Not strips, not boxes, not fractions. Strips and boxes are a display; fractions are a bug.

### The conversion, in one line

```
contentNeeded = dosePoints × item.perDose
saleUnits     = ceil(contentNeeded / item.content)
```

`perDose` is the field that does the work and it needs a name people understand: **how much of this medicine one written dose actually is.** For a tablet, 1 tablet. For a syrup taken with the 5 ml spoon in the box, 5 ml. For a paediatric preparation with a 0.6 ml dropper, 0.6 ml.

`content` is **how much is in one sale unit.** A tablet: 1. A 120 ml bottle: 120. A 10 ml vial: 10.

Worked, because this is the part that must be checkable by hand:

| Prescription | Item | Arithmetic | Result |
|---|---|---|---|
| AUGMENTIN 625, 1 TDS × 5 d | tab, content 1, perDose 1, strip of 6 | 15 × 1 ÷ 1 | **15 tablets = 2 strips of 6 + 3 loose** |
| PANADOL 500, 1 BD × 3 d | tab, strip of 10 | 6 | **6 tablets, cut from a strip of 10** |
| CARDACE 5, ½ OD × 5 d | tab | 2.5 → ceil 3 | **3 tablets** (`roundedUp: 0.5`, recorded) |
| BROFEX SYP, 1 spoon TDS × 5 d | bottle, content 120 ml, perDose 5 | 15 × 5 = 75 ml ÷ 120 | **1 bottle of 120 ml** (course needs 75) |
| Paed drops, 1 dropper BD × 7 d | bottle, content 15 ml, perDose 0.6 | 14 × 0.6 = 8.4 ÷ 15 | **1 bottle of 15 ml** |

### The rules that fall out, all of which are load-bearing

- **Never dispense a fraction.** Round up, always, and record `roundedUp` on the line. Half a tablet is something the patient does with a cutter, not something the ledger contains.
- **Never display a bare unit count.** Every quantity on every screen renders through one function, `qtyText(units, item)`, producing `"15 tablets — 2 strips of 6 and 3 loose"`. The salesman thinks in strips; the arithmetic is in tablets; both are on screen, always. Getting this wrong once is the top dispensing error, and the mitigation is that he can never see a number he has to convert in his head.
- **`looseOk` is per item.** Some things are never cut: a sealed bottle, a vial, a course pack of an antibiotic sold as a unit. When `looseOk` is false the quantity snaps up to whole strips and says why.
- **When the line has no grid dose, do not guess.** An `RxLine` with only a `note` — "10 units before breakfast", insulin, an inhaler, a topical — gets a **typed quantity** from the counter and no computed suggestion. Silence is safer than a confident wrong number.
- **Pack size may be overridden per batch.** The same brand arrives in 6s this month and 10s next month. `perStrip` on the `Item` is the default; a `Batch` may carry its own and the receive screen flags it visibly when it differs.
- **Money is integer paisa.** No floats anywhere near a rupee figure. Cash rounding to the nearest 5 rupees is a separate, explicit line on the sale, never a silent adjustment.

## 3.2 Batch and expiry

### Expiry is a month, not a day

Pakistani boxes print `03/2027`. It means end of March. Store both: `expiryText` exactly as printed (so the shelf and the screen can be compared by eye) and `expiry` as the epoch of the last moment of that month. Entering is `MM/YYYY`, two boxes, never a date picker.

### FEFO, with one non-negotiable extra rule

Picking order for a line: earliest `expiry` first, among batches with `onHand > 0`, not quarantined, not expired — **and not expiring before the course ends.**

That last clause is the rule worth the whole section. A 10-day course must not be filled from a batch that expires in 5 days. It is computable from `days` on the handoff line, it is invisible to a human under a queue, and it is exactly the kind of error a busy salesman makes forever. When it bites, the screen says so in one sentence: *"8 in stock, but they expire before her course ends."*

Splitting across batches is shown, never hidden. Need 15, batch A has 8, batch B has 40 → the row visibly splits into two, because he has to physically take from two boxes.

### Expired stock still on the shelf

It will be. Every time. What happens:

- FEFO **excludes** it. It cannot be dispensed. This is a hard block, not a warning, because the counter is a salesman.
- It stays in the ledger at cost, marked `quarantined`, so the money is still visibly sitting there. It does not vanish when it expires — that would hide the loss, which is the number the hospital is paying to see.
- It appears on the **expiry board** every morning until someone writes it off (second PIN) or returns it to the supplier for credit.
- **Money expired this month** is a headline figure on the monthly report. In most Larkana hospital pharmacies this number is currently unknown and is between one and four percent of purchases. Showing it is one of the three reasons a hospital buys this module.

Warning tiers before expiry, on the expiry board and on the batch row:

| Window | Meaning |
|---|---|
| ≤ 180 days | **returnable** — most distributors take back near-expiry goods for credit at 3–6 months. After that window it is a write-off. This is the tier that actually saves money and it is the one nobody tracks. |
| ≤ 90 days | amber |
| ≤ 30 days | red, and dispensing requires an explicit confirm tap even when the course fits |
| past | blocked |

## 3.3 The brand/generic problem

The slip says AUGMENTIN 625. The shelf has CALAMOX 625.

**This is where `data/who.ts` earns its place in the pharmacy.** Every `Item` carries a `generic` matched into the WHO spine by `normGeneric`. Substitution candidates are computed as: same normalised generic, **same strength**, compatible form. Nothing else.

### The rules

- **Never automatic.** The row shows the prescribed brand struck through, the formula in the middle, and the offered brand, and requires one tap. The counter is used to substituting silently; the software's job is to make the tap faster than the silence, not to prevent it.
- **Never across strengths.** Two 250s for a 500 is a prescribing decision, not a counter decision. v1 refuses the arithmetic entirely and says so. If it is genuinely needed, the counter rings the room.
- **Never `syr` for `tab` or the reverse.** Paediatric. `tab ↔ cap` is allowed.
- **No generic, no substitution.** An item that has not been given a WHO formula — which is most of a freshly imported stock register — offers nothing. This is the whole argument for the formula column existing on the pharmacy side too, and it is why the setup work of picking formulas is not optional.
- **Recorded, permanently.** `substitutedFor: { brand, strength, generic }` snapped onto the sale line. The item card and the day's report both show substitutions, so a counter substituting toward one company every time is visible. That pattern is a kickback and it is worth catching.
- **Printed for the patient, in Sindhi and English.** This is the part that is a patient-safety feature rather than a bookkeeping one:

  > **AUGMENTIN → CALAMOX 625** — same medicine, different company
  > ساڳي دوا، ٻي ڪمپني

  Without that line the patient's paper and her box disagree, and the failure mode is a double dose bought from a bazaar shop. The whole product exists to stop that class of error.

- **Exact matches are remembered; substitutions are not.** The first time AUGMENTIN 625 is dispensed, the counter picks the item and the mapping is stored (`DrugMatch`), so every future AUGMENTIN 625 is pre-selected and the row is one Enter. A *substitution* is deliberately never remembered — otherwise the pharmacy quietly always substitutes and nobody ever decides again.

### What is explicitly not built

No interaction checker. No allergy checking. No dose-range validation. Same reasoning as the comment on `RxSet` in `types.ts`: the moment software proposes or vetoes a drug, it stops being a typewriter and becomes advice, and advice handed to an unqualified salesman who will over-trust it is a worse product with a different liability. The only checks are mechanical: expiry, arithmetic, and same-formula-twice **within one prescription** (which the WHO column makes free and which catches a real error).

## 3.4 Stock that leaves without a prescription

Most of the business. Handled by making it a full citizen with a `kind`, not an exception.

```
kind: 'rx' | 'counter' | 'ward' | 'staff' | 'sample'
```

Every one of them: moves stock, has a price (possibly zero), has a `by`, has a `shiftId`, is immutable, and prints.

**The counter sale** is the fastest screen in the module, faster than the prescription path, because it runs more often. Three letters of a brand, tap, quantity defaults to one strip, `−` steps down to loose, Enter, cash, print. No customer record — there is no patient on a counter sale and there must not be one. That is both a simplification and a privacy feature.

**The three kinds that hide theft**, and how each is closed:

*Ward issue.* Currently invisible: someone from Ward 1 takes an ampoule and stock is simply less. Design: a ward issue is a sale at zero price with a **required ward and a required receiving name**, and it prints a two-part slip. The ward's copy is the hospital's problem; the pharmacy's copy is signed. Without this, "ward issue" becomes the drain everything disappears down.

*Staff and free.* Same: named person, required, and it appears on the monthly report as a rupee figure. The doctor's son's cough syrup is fine; Rs 60,000 a year of cough syrup is a conversation.

*Sample and expired-write-off.* Second PIN, always.

**Negative stock is allowed and is never silent.** If the ledger says 3 and he needs 5, he dispenses 5. The patient gets her medicine. The batch goes to −2, and the item lands on tonight's exception report with the words "the shelf and the book disagree — count this." Refusing a patient over a data error is the one thing this module may not do.

## 3.5 Reconciliation — catching the storekeeper

Nothing in software catches theft. Physical counts catch theft; software decides *which* count happens and makes the variance impossible to tidy away.

### The one feature that matters: the blind rolling count

Every morning the software picks **fifteen items** and asks for a physical count. Rules, each of which is the difference between a real control and theatre:

- **Blind.** The expected quantity is not shown until after the count is saved. If he can see the number, he types the number.
- **The software chooses, not the person.** He cannot re-roll the list, and skipping an item is recorded as a skip with his name on it.
- **`expected` is snapshotted when the count line is created**, not read at save time. Otherwise a sale made while counting silently absorbs the variance.
- **Counted in strips and loose**, two boxes, because that is how a shelf looks. Stored as units.
- **Weighted selection**: high value, high movement, narcotics (every day, mandatory, all of them), cold chain, anything with a negative balance, anything not counted in 60 days — **and, deliberately, anything recently adjusted downward.** That last weighting directly targets the fake-wastage route and costs one line of code.

Fifteen items a day is roughly 4,500 counts a year against a range of maybe 900 items. An annual full count catches almost nothing. This catches a strip a day inside a fortnight.

### The four reports, and the three numbers that sell the module

1. **Day close.** Blind cash count first, then expected, then the variance, frozen and uneditable, attributed to the shift and the person. Someone short by Rs 200 every evening is visible in four days.
2. **Movement without money.** Every unit that left as wastage, expiry, damage, loss, return, ward, staff or sample — ranked by value at cost, this month against last. **This is where theft lives and this is the report to read first.**
3. **Item card.** One item, every move, running balance, who, forever. The thing you print when you already suspect somebody.
4. **Purchase price drift.** Same item, same supplier, rate up 40% since March. Catches kickback purchasing, which in a hospital pharmacy is usually larger than counter theft.

Plus the exception page printed and signed at every day close: negative balances, sales below MRP, voids, adjustments, count variances over threshold, cash variance, expired-still-on-shelf, narcotic balance mismatch.

**The three numbers a hospital does not currently have, and would pay for:** money expired, money missing at count, money owed to distributors. Everything above exists to produce those three.

### Who watches the watcher

If the storekeeper both receives and counts, there is no control and the software should say so plainly on the setup screen rather than imply one exists. The witness PIN for a count must belong to somebody who is not the person who last received that item. In a pharmacy with one member of staff this is impossible, and the honest statement is: *"One person receives, sells and counts. This module can show you what happened. It cannot stop it."*

## 3.6 Narcotics

Switch, off by default, because many small hospital pharmacies hold none. When on, it is strict and there are no soft edges:

- **Never a counter sale.** A controlled item requires a prescription reference, always.
- Captures on the sale: patient name, patient number, prescriber name, **prescriber registration number**, and quantity in words on the printout.
- **Balance may never go negative and may never be adjusted without two PINs**, one of which must be a doctor's.
- **Counted at every day close, all of them, mandatory** — not sampled.
- Broken or spoiled ampoules: two signatures, always.
- Prints a **register page** — date, patient, prescriber, in, out, running balance, and a signature column — designed to be pasted into or reconciled against the bound register that the law expects and that software does not replace.

The AWaRe column in `who.ts` is present and is *not* used for enforcement. It is stewardship guidance, it is correct, and turning it into a block at a pharmacy counter would be the module giving clinical advice. It appears on the monthly report as a Watch/Reserve antibiotic consumption figure for the hospital's own eyes, and nowhere else.

## 3.7 Cold chain

Software cannot keep a fridge cold. It can make an excursion visible and attributable, and that is the honest scope.

- **Two typed readings a day**, morning and evening: current, and min/max since last reading from a ₨1,500 min-max thermometer. Two numbers, one screen, big boxes. **No sensors, no IoT, no Bluetooth thermometers in v1.**
- **A power-cut log**: when it went, when it came back. Typed, approximate, and better than nothing. If a gap exceeds the fridge's holdover with no generator, or a max reading breaches the range, an **excursion** opens.
- An open excursion is a banner on the pharmacy home screen until somebody decides **keep** or **discard**, with a name and a time on the decision. Discarding is a wastage move with a witness.
- Dispensing a cold-chain item with an open excursion on its fridge **warns loudly and requires the doctor's PIN** — not a block. A child needs the insulin tonight; a bureaucratic refusal is not a safety feature.

---

# 4. The data model

In the style of `src/types.ts`. New file, `src/pharmacy/types.ts`. It shares `Form`, `Dose` and `RxSnap` with the prescribing side and shares no table with it.

```ts
import type { Form, Dose, RxSnap } from '../types'

/**
 * THE PHARMACY IS A SEPARATE DATABASE, AND THAT IS THE POINT.
 *
 * `Drug` (types.ts) is the doctor's prescribing list. It holds no price, no pack
 * size and no supplier, and `MarketPaste.tsx` actively DESTROYS those columns
 * on the way in. That rule stands and is not being relaxed here.
 *
 * `Item` (this file) is the pharmacy's stock list. It holds price, pack size,
 * supplier and cost — all the commercial data the prescribing side refuses.
 *
 * THEY ARE NEVER JOINED BY FOREIGN KEY. They are joined by a curated match
 * table (`DrugMatch`) built one row at a time by a person at the counter, and
 * they are allowed to disagree: the doctor prescribes things the pharmacy does
 * not stock, and the pharmacy stocks things no doctor here writes. A hard
 * reference would force one list to be a subset of the other, which is false
 * about the world and would drag commercial data across the boundary the moment
 * somebody wrote a convenient join.
 *
 * ONE PARSE, OPPOSITE RETENTION. `data/clean.ts` already extracts price and pack
 * size in order to throw them away — it even reports them in `dropped[]`. The
 * pharmacy importer runs the same `cleanLine` and KEEPS exactly what the
 * prescribing importer discards. Same parser, opposite side of one wall.
 *
 * MONEY IS INTEGER PAISA, EVERYWHERE. Not rupees, not floats. A rupee figure
 * that has been through a float is a rupee figure that will eventually be
 * argued about at a day close.
 */

/* ------------------------------------------------------------------ items */

/** The physical thing that leaves the counter. Never a strip, never a box. */
export type SaleUnit =
  | 'tab' | 'cap' | 'bottle' | 'vial' | 'amp' | 'sachet' | 'tube' | 'piece'

/** What is inside one sale unit. */
export type ContentUnit = 'unit' | 'ml' | 'g' | 'iu'

export type Controlled = 'narcotic' | 'psychotropic'

export interface Item {
  id: string
  brand: string          // exactly as printed on the box
  strength: string
  /**
   * The WHO formula, joined by `normGeneric` from data/who.ts.
   *
   * Blank is allowed and is the normal state of a freshly imported stock
   * register. The cost of blank is exact and worth stating: NO SUBSTITUTION IS
   * EVER OFFERED for an item without a formula, because "same medicine,
   * different company" is a claim only the formula column can make.
   */
  generic: string
  form: Form
  /** printed on the bill under the brand. Not printed until reviewed, same rule
   *  as everywhere else in this app. */
  sd: string
  sdReviewed?: boolean

  /* ---- the unit ladder. Getting this wrong is the top dispensing error. ---- */

  saleUnit: SaleUnit
  /** how much contentUnit is inside ONE sale unit. Tablet: 1. 120ml bottle: 120. */
  content: number
  contentUnit: ContentUnit
  /**
   * HOW MUCH OF `contentUnit` ONE WRITTEN DOSE ACTUALLY IS.
   *
   * The doctor writes "1". This says what 1 means in the real world: 1 tablet,
   * or 5 ml because the box contains a 5 ml spoon, or 0.6 ml because it is a
   * paediatric dropper. Every quantity the counter is shown passes through this
   * number, so a wrong value here is a wrong quantity handed to a patient — it
   * is the single most safety-critical field in this file and it is set by a
   * person at setup, never guessed by a parser.
   */
  perDose: number

  /** display only. The ledger never holds strips. */
  perStrip: number
  /** strips per outer box. Purchasing only; never used in dispensing arithmetic. */
  perPack: number
  /**
   * May a strip be cut? False for sealed bottles, vials, and course packs sold
   * whole. When false, quantities snap up to whole strips and the screen says why.
   */
  looseOk: boolean

  controlled?: Controlled
  coldChain?: boolean
  fridgeId?: string

  /** in sale units. Both are set by a person; nothing here forecasts. */
  reorderAt: number
  reorderTo: number

  /**
   * Learned at the counter by scanning a box while the item is selected — never
   * looked up in a registry, because no usable Pakistani barcode registry exists.
   * A string we were taught, nothing more.
   */
  barcode?: string

  archived?: boolean     // leaves the picker, never the record
  addedAt: number
  addedBy: string
}

/**
 * Joins a prescribed medicine to a stocked item, so the second AUGMENTIN 625 of
 * the week is pre-selected and the row is one Enter.
 *
 * `key` is `normDrug(brand, strength)` — the same normaliser db.ts already uses,
 * so "AUGMENTIN 625MG" and "Augmentin 625 mg" land on one row.
 *
 * ONLY EXACT MATCHES ARE REMEMBERED. A substitution is deliberately never
 * stored here: if it were, the pharmacy would quietly always substitute and
 * nobody would ever decide again.
 */
export interface DrugMatch {
  key: string
  itemId: string
  confirmedBy: string
  confirmedAt: number
}

/* ----------------------------------------------------------------- batches */

export interface Batch {
  id: string
  itemId: string
  batchNo: string
  /**
   * Boxes print MM/YYYY and it means the END of that month. `expiryText` is what
   * is actually printed, kept verbatim so a screen and a shelf can be compared
   * by eye; `expiry` is the last moment of that month for arithmetic.
   */
  expiryText: string
  expiry: number

  /**
   * A CACHE. The `Move` tape is the truth and this is its running sum, kept
   * because a counter under a queue cannot wait for an aggregation. It is
   * rebuilt from Moves at every day open and after every restore, and a
   * disagreement is an exception report line, never a silent correction.
   *
   * MAY GO NEGATIVE. If the book says 3 and the shelf has 5, the patient gets 5
   * and this goes to -2 and lands on tonight's exceptions. Refusing a patient
   * over a data error is the one thing this module may not do.
   */
  onHand: number

  costPerUnit: number    // paisa. Effective, after spreading scheme bonus.
  mrpPerUnit: number     // paisa, as printed on THIS box. Price follows the batch.

  /** overrides Item.perStrip when this consignment came in a different pack.
   *  Flagged visibly at receive, because it is also how a wrong entry looks. */
  perStrip?: number

  receivedAt: number
  purchaseId?: string
  supplierId?: string

  /** expired, recalled, or physically damaged. Excluded from FEFO, still
   *  carrying its cost, so the loss stays visible until somebody writes it off. */
  quarantined?: boolean
  quarantineReason?: string
}

/* ------------------------------------------------------------- the ledger */

export type MoveKind =
  | 'open-balance' | 'receive'
  | 'dispense' | 'counter-sale' | 'ward-issue' | 'staff' | 'sample'
  | 'return-patient' | 'return-supplier'
  | 'expired' | 'damaged' | 'lost'
  | 'count-adjust'
  | 'void'

/**
 * One movement of stock. THE SOURCE OF TRUTH.
 *
 * A Move is never edited and never deleted. A mistake is a NEW Move of kind
 * 'void' pointing at the old one, so the item card is an append-only tape and
 * no history can be tidied. That property is the entire basis of §3.5: a report
 * that can be edited is a report a storekeeper edits.
 */
export interface Move {
  id: string
  at: number
  batchId: string
  /** denormalised on purpose: the item card must survive a corrupt batch row */
  itemId: string
  /** signed, in SALE UNITS, always an integer. Negative leaves the shelf. */
  qty: number
  kind: MoveKind
  by: string
  /**
   * The second PIN. REQUIRED for every kind that reduces stock without
   * producing money — expired, damaged, lost, sample, staff, downward
   * count-adjust, and void. This is the one control in the module that a
   * salesman cannot click through.
   */
  witness?: string
  saleId?: string
  purchaseId?: string
  countId?: string
  note?: string
  /** the Move this one reverses */
  voids?: string
  /** set on the original when a void points at it. Written once. */
  reversedBy?: string
}

/* ------------------------------------------------------------------ sales */

export type SaleKind = 'rx' | 'counter' | 'ward' | 'staff' | 'sample'
export type PayKind = 'cash' | 'credit' | 'free'

/** why less was given than the course needs. 'money' is the commonest and it is
 *  not an error condition — it is how people buy medicine here. */
export type ShortReason = 'stock' | 'money' | 'patient-refused' | 'doctor-said'

export interface SaleLine {
  itemId: string
  batchId: string
  qty: number            // sale units
  unitPrice: number      // paisa. From the BATCH's mrp — the price on the box given.
  /** which printed line of the slip this satisfies. Lets the counter say "line 3". */
  rxLineNo?: number
  /**
   * What the doctor actually wrote, snapped at the moment of substitution.
   * Present ONLY when the brand given differs from the brand prescribed.
   * Printed on the patient's bill in Sindhi and English, because her paper and
   * her box otherwise disagree and she buys the original again from a bazaar.
   */
  substitutedFor?: { brand: string; strength: string; generic: string }
  /** the course needed a fraction of a unit and we rounded up. Recorded, not hidden. */
  roundedUp?: number
  short?: ShortReason
  note?: string
}

export interface Sale {
  id: string
  /** per-device leased block, like patient numbers. Two counters may never
   *  issue one bill number — see §6.3. */
  billNo: number
  kind: SaleKind
  at: number
  by: string
  shiftId: string
  status: 'draft' | 'done' | 'voided'

  lines: SaleLine[]

  handoffId?: string
  /** for 'rx' only, and only these two fields. Not a patient record. */
  patientNum?: number
  patientName?: string

  /** ward issues, staff and free MUST name somebody or they are a hole in the wall */
  toWhom?: string

  total: number          // paisa, sum of lines
  discount: number       // paisa
  discountNote?: string
  /** cash rounding to the nearest 5 rupees, explicit and separate. Never silent. */
  rounding: number
  paid: number
  payKind: PayKind

  /** narcotics only. Captured because a register demands it and an inspector asks. */
  controlledInfo?: {
    prescriber: string
    prescriberReg: string
    guardianName?: string
    guardianCnic?: string
  }

  voidedBy?: string
  voidNote?: string
}

/* ------------------------------------------------------ the prescription */

/**
 * WHAT THE PHARMACY IS ALLOWED TO KNOW.
 *
 * Built in the consulting room at print time and wrapped to the pharmacy
 * device's key as one additional wrap. The pharmacy has NO read access to
 * `Visit`, in any sharing mode, ever.
 *
 * There is no field here for a diagnosis, a vital, a test, an advice line, a
 * fee, a close note, or any previous visit. THAT IS THE MECHANISM, not an
 * oversight: this is a type with nowhere to put those things, rather than a
 * projection function somebody forgets to update in eighteen months.
 *
 * The justification a doctor has to accept, in one sentence: the pharmacy
 * learns nothing here that it would not learn from the paper the patient is
 * carrying to its counter — it just learns it thirty seconds earlier.
 */
export interface RxHandoff {
  id: string
  /** the room's visit id. Stored to stop the same slip being redeemed twice.
   *  NEVER used to fetch anything: there is nothing on the pharmacy side to
   *  fetch it from. */
  visitRef: string
  roomId: string

  patientNum: number
  patientCode: string    // the printed 5-digit code, for scanning and calling
  patientName: string
  age?: string
  sex?: 'M' | 'F'

  prescriber: string     // as printed on the slip
  prescriberReg?: string // needed only for controlled lines

  printedAt: number
  /** default 7 days. After this it must be re-presented to the doctor. */
  expiresAt: number

  lines: HandoffLine[]
  status: 'open' | 'part' | 'closed' | 'expired'
}

export interface HandoffLine {
  /** the line's position on the printed slip, so the counter can say "line 3" */
  n: number
  /** the exact printed text, reusing RxSnap from types.ts. The pharmacy shows
   *  the patient's own paper back to her, character for character. */
  snap: RxSnap
  dose: Dose
  meal: 'after' | 'before' | 'any'
  days: number
  note?: string

  /**
   * dose.m + dose.d + dose.n. Dimensionless, and it stays dimensionless until
   * an Item supplies `perDose` and `content`. THE CONVERSION IS THE PHARMACY'S
   * JOB AND ITS ARITHMETIC IS SHOWN ON SCREEN, because the room does not know
   * what pack the pharmacy holds and must not pretend to.
   */
  dailyPoints: number
  totalPoints: number    // dailyPoints × days

  /** running, in sale units, across however many visits to the counter it takes */
  given: number
  state: 'pending' | 'part' | 'full' | 'none'
}

/* ------------------------------------------------------------- purchasing */

export interface Supplier {
  id: string
  name: string
  phone?: string
  area?: string
  /** days of credit this distributor gives. Drives the due-date column. */
  creditDays?: number
  archived?: boolean
}

export interface PurchaseLine {
  itemId: string
  batchNo: string
  expiryText: string
  expiry: number
  qty: number            // sale units actually paid for
  /**
   * "10 + 1". Free units enter stock at zero invoice cost, which makes the item
   * look 100% profitable unless the cost is spread. Effective cost per unit is
   * therefore (qty × rate × (1 - disc)) / (qty + bonusQty), and that is what
   * lands on the Batch. Recording bonus separately is what makes that possible.
   */
  bonusQty: number
  rate: number           // paisa per sale unit, per the invoice
  discountPct?: number
  mrp: number            // paisa, printed on the box
  perStrip?: number      // when this consignment's pack differs from the item's
}

export interface Purchase {
  id: string
  supplierId: string
  invoiceNo: string
  invoiceDate: number
  receivedAt: number
  by: string
  dueDate?: number
  lines: PurchaseLine[]
  /**
   * TYPED FROM THE PAPER, not computed. If the computed total disagrees, the
   * screen shows both and neither wins silently — a supplier invoice that does
   * not add up is either a data-entry error or a dispute, and both need a human.
   */
  invoiceTotal: number
  status: 'draft' | 'posted'
}

export interface SupplierPayment {
  id: string
  supplierId: string
  at: number
  amount: number         // paisa
  mode: 'cash' | 'cheque' | 'transfer'
  ref?: string
  by: string
  /** invoices this payment is set against. Partial payments are normal. */
  against?: string[]
}

/* ---------------------------------------------------------------- counting */

export interface CountLine {
  itemId: string
  batchId?: string
  /** entered as a shelf looks: strips and loose. Both kept, so a miscount can
   *  be understood later ("he counted strips of 6 as strips of 10"). */
  countedStrips?: number
  countedLoose?: number
  counted: number        // sale units, derived
  /**
   * WRITTEN WHEN THIS LINE IS CREATED AND NEVER RE-READ.
   *
   * If expected were read at save time, a sale made during the count would
   * silently absorb the variance and the whole exercise would report zero
   * forever.
   */
  expected: number
  /** at cost, so the report can rank by money rather than by units */
  varianceValue: number
  note?: string
}

export interface Count {
  id: string
  at: number
  /** 'rolling' is the daily fifteen the software chooses. 'full' is the annual
   *  ritual that catches almost nothing. 'targeted' is when you already suspect. */
  kind: 'rolling' | 'full' | 'targeted'
  by: string
  witness?: string
  lines: CountLine[]
  /** items on the list that were not counted. Recorded, with a name on them. */
  skipped: string[]
  closedAt?: number
}

/* ------------------------------------------------------- the day, the cash */

export interface Shift {
  id: string
  openedAt: number
  openedBy: string
  openingFloat: number   // paisa
  closedAt?: number
  closedBy?: string
  /** TYPED BEFORE THE SCREEN SHOWS WHAT IT EXPECTED. Same blind discipline as
   *  the stock count, for the same reason. */
  countedCash?: number
  expectedCash?: number
  /** frozen at close. Never editable afterwards, by anyone, including office. */
  variance?: number
  note?: string
}

/* ------------------------------------------------------------- cold chain */

export interface Fridge {
  id: string
  name: string
  minC: number           // typically 2
  maxC: number           // typically 8
  /** hours it holds temperature with the door shut and no power. Typed by a
   *  person from experience, not measured. Drives when a cut becomes an excursion. */
  holdoverHours: number
}

export interface FridgeLog {
  id: string
  fridgeId: string
  at: number
  by: string
  tempC: number
  minSince?: number
  maxSince?: number
  note?: string
}

export interface Excursion {
  id: string
  fridgeId: string
  from: number
  to?: number
  peakC?: number
  cause: 'power' | 'door' | 'fault' | 'unknown'
  /** open until a PERSON decides, with a name and a time on the decision */
  decision?: 'keep' | 'discard'
  decidedBy?: string
  decidedAt?: number
  note?: string
}

/* ---------------------------------------------------------- back-orders */

export interface BackOrder {
  id: string
  itemId: string
  at: number
  qty: number
  /**
   * TYPED BY THE PATIENT AT THE COUNTER, never pulled from the clinic's patient
   * record. The pharmacy is not given the clinic's directory, and a convenient
   * auto-fill here would hand it one.
   */
  phone?: string
  who?: string
  handoffId?: string
  filledAt?: number
  filledBy?: string
}
```

### Dexie schema

```ts
// src/pharmacy/db.ts — a SEPARATE Dexie database, deliberately.
// Two databases means no accidental join, no shared migration, and a pharmacy
// that can be backed up, restored, exported and DELETED without touching one
// prescription.
this.version(1).stores({
  items:        'id, brand, generic, barcode, archived, controlled, coldChain',
  drugMatches:  'key, itemId',
  batches:      'id, itemId, expiry, quarantined, [itemId+expiry]',
  moves:        'id, at, batchId, itemId, kind, saleId, by, [itemId+at]',
  sales:        'id, billNo, at, kind, status, shiftId, handoffId, patientNum',
  handoffs:     'id, patientNum, printedAt, status, expiresAt',
  suppliers:    'id, name',
  purchases:    'id, supplierId, invoiceDate, status, dueDate',
  payments:     'id, supplierId, at',
  counts:       'id, at, kind',
  shifts:       'id, openedAt, closedAt',
  fridges:      'id',
  fridgeLogs:   'id, fridgeId, at',
  excursions:   'id, fridgeId, from, decision',
  backOrders:   'id, itemId, filledAt',
})
```

`[itemId+expiry]` is the FEFO index and it is the one query that runs under a queue.

---

# 5. Screens

House rules, from the shipped app: English label with the Sindhi beneath, one primary action per screen, no confirmation dialog on the hot path, and nothing that assumes the reader will squint.

## P1 — Counter: dispense against a prescription

**Who:** the salesman. **The screen the product lives or dies on.**

Layout, top to bottom:

```
┌──────────────────────────────────────────────────────────────┐
│  Scan the slip or type the number   [ 4 8 2 1 3 ]            │
│  اسڪين ڪريو يا نمبر لکو                                       │
│                                    or  [ type it from paper ]│
├──────────────────────────────────────────────────────────────┤
│  MST. ZUBAIDA  ·  48213  ·  42y F      Dr Ahmed, Room 2      │
│  printed today 6:12pm                                        │
├──────────────────────────────────────────────────────────────┤
│ ☑ 1  AUGMENTIN 625            1+1+1 · 5 days · after food    │
│      Amoxicillin + clavulanic acid                           │
│      GIVE  15 tablets  — 2 strips of 6 + 3 loose             │
│      B/No A4471   exp 09/2027   Rs 1,242        [−] [swap]   │
├──────────────────────────────────────────────────────────────┤
│ ☑ 2  BROFEX SYP               1+1+1 · 5 days                 │
│      Ibuprofen                                               │
│      GIVE  1 bottle of 120 ml   (course needs 75 ml)         │
│      B/No 22B    exp 03/2027    Rs 145          [−] [swap]   │
├──────────────────────────────────────────────────────────────┤
│ ☒ 3  PANADOL 500              as needed                      │
│      ✗ not in stock          [ tell her when it comes ]      │
├──────────────────────────────────────────────────────────────┤
│  2 of 3 medicines            TOTAL   Rs 1,387                │
│                                                              │
│              [  G I V E   ·   ڏيو  ]                         │
└──────────────────────────────────────────────────────────────┘
```

**The fast path is: scan, Enter.** Everything is pre-ticked at the full course, every batch is FEFO-picked, every exact-match item is already resolved from `DrugMatch`. A three-line prescription with everything in stock is two keystrokes and prints in under twenty seconds including the printer.

Per-row actions are single taps and never open a dialog:

- `[−]` steps days down: 5 → 3 → 2 → 1, recomputing the quantity live. This is the Rs 400 case and it must be one thumb.
- `[swap]` opens the substitution row inline — same formula, same strength, in stock, sorted cheapest first. One more tap picks it. The prescribed brand stays visible, struck through.
- Unticking a line asks for one of four reasons as four chips, not a text box.
- Long-press a quantity types an exact number. Rare, must exist.

Blocks, which are blocks and not warnings:

- Expired batch: not offered, not selectable, shown in red under the row so he knows why the shelf and the screen disagree.
- Batch expiring before the course ends: not offered, one sentence.
- Controlled item without a handoff: refused.
- No formula on the item: `[swap]` is absent, not greyed, with "no formula — nothing to compare it to."

After GIVE: bill prints, drawer figure updates, back-order captured if anything was short, balance slip offered if anything is outstanding.

## P2 — Counter: sale without a prescription

Same screen, different top. Search box focused on load. Three letters → items with stock, sorted by how often they have actually been sold here (`usageCounts`-style, computed locally, same idea as the prescribing grid). Tap adds a row at one strip; `−` steps to loose. Barcode scan resolves directly when the item has been taught one.

**This must be faster than P1, because it runs more often.** No customer, no name, no phone, no record of who. That is a privacy decision and a speed decision at once.

## P3 — Day close

Who: the salesman closing his shift; countersigned by the storekeeper or office.

1. **Count the drawer. Type the number.** Nothing else on the screen.
2. Then, and only then: expected, variance, frozen.
3. Today's exceptions, one page: negatives, voids, adjustments, sales under MRP, count variances, narcotic balance check.
4. Unfinished drafts from a power cut (§6.2), to complete or discard.
5. Print, sign, put it in the file.

## P4 — Receive stock

Who: the storekeeper, with the invoice in his hand.

Header: supplier, invoice number, invoice date, due date (auto from `creditDays`). Then one row per invoice line in the order the paper reads: item, batch no, expiry `MM/YYYY`, qty, **bonus**, rate, MRP. Running computed total beside the typed invoice total, and they must agree before Post — if they do not, both are shown and neither wins.

New item on an invoice: inline create, which is the moment the pack ladder and the WHO formula are set. This is the only place `perDose` gets typed, and the screen says what it is for in one sentence.

Posting writes batches and `receive` moves in one transaction and offers the labels: if the previous batch of this item had a different MRP, it says so, because two prices on one shelf is how a customer gets overcharged.

## P5 — The shelf

Search plus five filters: **low · expiring · expired · zero · negative**. Row: brand, strength, on hand as `qtyText` (strips + loose), earliest expiry, batches count. This is a lookup screen, not a working screen.

## P6 — Item card

One item, every `Move`, running balance, who, forever. Printable. **The report you print when you already suspect somebody**, and its usefulness is entirely a consequence of Moves being append-only.

## P7 — Count (blind)

Who: whoever is counting; witness PIN at the end.

Item, batch, expiry, and two empty boxes: **strips** and **loose**. Nothing else on screen. Save. Only then does it show expected, variance, and value. Fifteen rows, chosen by the software, not re-rollable, skips recorded.

## P8 — Adjust

Reduce stock without a sale. Reason from a fixed list (expired · damaged · lost · sample · staff · returned to supplier), quantity, note, **second PIN**. The second PIN is the screen; everything else is a form.

## P9 — Expiry & reorder board

The storekeeper's morning screen, three lists:

- **Return while you still can** — 90 to 180 days out, uncut, with a value. This is the list that saves real money and the one nobody currently keeps.
- **Expired, still on the shelf** — with a value, until somebody writes it off.
- **Below reorder** — suggested quantity `reorderTo − onHand`, with back-order counts against it.

## P10 — Fridge

Two big number boxes, twice a day. Open excursions as a red banner with one decision button. Nothing else.

## P11 — Narcotics

Balance per controlled item, today's entries, the mandatory day-close count, and **Print register page**.

## P12 — Reports

The four from §3.5, plus supplier balances and ageing. Office role only; the counter never sees cost prices.

## P13 — Items and setup

The pack-ladder editor, the WHO formula picker (reuse the `Pick` component from `MarketPaste.tsx` verbatim), and the stock-register paste importer — same `cleanLine`, opposite retention, keeping the price and pack that the prescribing importer throws away.

---

# 6. Offline, power cuts, and two counters

## 6.1 What works with no network

Everything. There is no network call to the internet in this module at any point, so "internet down" is not a state it can be in.

Inside the building the pharmacy is its own host: the pharmacy PC holds the stock database. What depends on the clinic LAN is exactly one thing — the `RxHandoff` arriving. When the LAN is down:

| | With the LAN | Without |
|---|---|---|
| Dispense against a slip | scan, 2 keystrokes | type from the paper, ~40 seconds |
| Counter sale | full | full |
| Receive, count, adjust, reports | full | full |
| Narcotics register | full | full |
| Balance slip, back-orders | full | full |

The degraded mode is one screen slower and is the *only* mode for outside prescriptions anyway, which means it is exercised every single day and cannot rot.

Handoffs queue in the room and flush when the LAN returns. A handoff that arrives after the patient has already been served, having been typed manually, is reconciled by patient number and marked `closed` with a note. It does not create a second bill.

## 6.2 When the power dies mid-sale

The transaction boundary is the whole answer, and it is one sentence:

**Nothing moves stock until GIVE, and GIVE writes the sale and all its Moves in one Dexie transaction.**

So a power cut can leave an abandoned draft, and it can never leave a phantom stock movement. Drafts are written on every change — the discipline `db.ts` already keeps, for the same stated reason — so the lines he had typed survive.

On restart, before anything else: *"3 unfinished sales from before the power cut."* Each one resume, or discard. **Discarding is free, because nothing moved.**

The genuinely dangerous case is the power dying *after* the medicine and money crossed the counter and *before* GIVE. That happens, and the honest handling is: the resume screen lets him say "this one was actually given", completes it, and stamps it with the original draft time rather than now — so the shift's cash reconciles and the timestamp is not a lie. It appears on the exception page, because a sale completed after a gap is exactly the shape a fraudulent backdated sale would have.

Cash at day close counts committed sales only; open drafts are listed separately so the drawer reconciles.

## 6.3 Two counters and the last box

Most Larkana hospital pharmacies have one counter. The design supports one properly and handles two honestly rather than elegantly.

- **The pharmacy PC is the stock host. Counters are clients.** A phone is never the stock host, for the reasons already established in the clinic design: OEM ROMs kill background services, wifi power-save drops the radio, and a server that answers only when someone is looking at it is not a server.
- **With the LAN up:** opening a dispense line takes a **90-second soft hold** on the batch. Not a lock — a hold that expires. The other counter sees "3 available, 2 being taken at counter 1". No distributed lock, no lease negotiation, nothing that can deadlock when a device walks away.
- **With the LAN down between counters:** they cannot see each other. The counter keeps dispensing locally and reconciles on reconnect. Two counters may both sell the last three CALPOL, and the batch reconciles to −3. That is correct behaviour: the alternative is refusing a patient because a network is down, which is the one thing forbidden. The negative lands on tonight's exception page with "count this."
- **Bill numbers use the lease discipline already in `safety.ts`.** Each counter holds a disjoint contiguous block; a device prints only from its own block; leases refresh on every contact and at day open; a restore burns every outstanding lease and takes fresh ones above everything seen. Two bills numbered 1041 is the same class of bug as two patients numbered 00043, and it gets the same fix rather than a new one.
- **`onHand` is rebuilt from Moves at every day open and after every restore.** A disagreement between the cache and the tape is an exception line, never a silent correction.

---

# 7. Roles and permissions

`roles.ts` gains two hats and seven grants. The `Can` list stays one list in one file, because a permission decided in two places disagrees with itself.

```ts
export type Role = 'counter' | 'doctor' | 'pharmacy' | 'store' | 'office' | 'nuskho'

// new grants
| 'dispense'      // work the pharmacy counter, sell, take cash
| 'stock-in'      // receive against a supplier invoice
| 'stock-adjust'  // reduce stock without a sale. Always needs a witness too.
| 'stock-count'   // run and close a count
| 'cost'          // SEE PURCHASE PRICES. Separate on purpose.
| 'pharm-report'  // the four reports, supplier balances
| 'narcotics'     // the controlled register
```

| Role | Gets | Deliberately does not get |
|---|---|---|
| `pharmacy` | `dispense` | **`queue`, `prescribe`, `history`, `cost`, `stock-in`, `stock-adjust`, `pharm-report`.** The salesman never sees a diagnosis, never sees a purchase price, and cannot bring stock in or write it off. |
| `store` | `stock-in`, `stock-count`, `stock-adjust`, `cost`, `dispense` | `prescribe`, `history`, `queue`, `pharm-report` |
| `office` | `pharm-report`, `cost`, `figures` | **anything clinical, in any mode, with no override** — as the plan requires |
| `doctor` | `narcotics` witness, break-glass on cold chain | — |
| `nuskho` | nothing new. It gains no pharmacy grant of any kind. | everything |

Two notes. **`cost` is separate from `dispense` because purchase prices are a negotiating leak** — a salesman who knows the margin is a salesman a distributor's man can work on. And **the pharmacy role must never hold `history`**: the moment a pharmacy terminal can read a patient's previous prescriptions, this module has become the prescribing-data aggregator that `roles.ts` was rewritten to prevent, wearing a hospital badge.

---

# 8. What I would not build in version one

The smallest module a hospital in Larkana would actually pay for is: **it knows what is on the shelf, it stops expired medicine going out, it produces three numbers nobody currently has, and it does not slow the counter down.**

**In v1:**

Items with the pack ladder and a WHO formula · batches with expiry · FEFO with the short-dated rule · receive against an invoice with scheme bonus · dispense against a handoff, with substitution and partial · counter sale · ward/staff/free with a name on it · the Move ledger with witness PINs · stock list and item card · expiry and reorder board · blind rolling counts · day close with blind cash · supplier balances (invoice, paid, outstanding — nothing more) · the four reports · the exception page · the fridge log with excursions · the stock-register importer.

Narcotics is a switch, off by default, strict when on.

**Not in v1, and here is what each one costs and why it loses:**

| Cut | Why |
|---|---|
| **Barcode scanning of medicine boxes** | Cheap to build, genuinely fast, but needs disciplined receiving to teach every barcode and there is no Pakistani product registry to seed from. **First thing in v1.1**, not v1. |
| **Purchase orders and auto-reorder** | Ordering happens by WhatsApp to a man on a motorbike. A reorder *list* is useful; a purchase order document nobody sends is not. |
| **Full accounting, GST, FBR integration** | A different product with a different buyer and a compliance surface that would eat the year. The hospital has an accountant with a copy book; give him a printable summary. |
| **Patient medication history in the pharmacy** | Not "later" — **never.** It is the aggregation risk, it is one query away from the thing the company refuses to be, and there is no screen for it by design. |
| **Interaction, allergy and dose checking** | A different product with a different liability, handed to an unqualified salesman who will over-trust it. Same reasoning as the `RxSet` comment already in `types.ts`. |
| **Temperature sensors, IoT, Bluetooth thermometers** | A ₨1,500 min-max thermometer and two typed numbers is 90% of the value at 2% of the work, and the excursion decision is human anyway. |
| **Multi-store, branch transfers, central purchasing** | One pharmacy in one building. Come back when there are two. |
| **Insurance and panel billing** | Real, and it belongs with whoever builds hospital billing. Not here. |
| **Patient returns except same-day, sealed, unopened** | Everything else is a fraud vector and a hygiene problem. Refuse politely; the counter can void the bill within the shift. |
| **Automatic price-list updates from distributors** | There is no feed. There are PDFs and WhatsApp images. The paste importer covers it. |
| **Expiry alerts by SMS, WhatsApp, or anything leaving the building** | Nothing leaves the building. |
| **Any report that leaves the hospital** | Including to Nuskho. Especially to Nuskho. |

**And if the hours do not fit even that** — which, on the arithmetic in the clinic design, they very likely do not — cut in this order and stop when it fits:

1. **Cut the narcotics register.** Ask first whether this pharmacy holds controlled drugs at all. Many do not. If it does, this cannot be cut, because it is a legal obligation and its absence is a reason not to buy.
2. **Cut the supplier ledger and purchase price drift.** Receiving still creates batches; the accountant keeps his copy book one more year. This removes a whole entity, two screens and a report.
3. **Cut the cold-chain module.** A paper log taped to the fridge is what exists now and it is not worse than nothing. Losing it loses one of the module's better stories but none of its arithmetic.

What survives all three cuts is: **items, batches, FEFO, receive, dispense, counter sale, the Move ledger, blind counts, day close, the exception page, and the expiry board.** That is roughly eight weeks of work on top of the desktop shell already scoped in the clinic design, it is a genuinely better position than a copy book, and every one of the three numbers a hospital owner would pay for is still in it.

---

# 9. What I am unsure about

Listed rather than papered over.

1. **Whether the pharmacy is leased to a contractor.** In many Pakistani hospitals it is: an outside operator pays monthly rent and keeps the margin. If that is true here, the hospital cannot compel counts, cannot demand the reconciliation reports, and §3.5 has no customer — the buyer becomes the contractor, who wants stock control and does *not* want a transparent theft report going to the hospital. **This is the single question that most changes the product and it should be asked before a line is written.**
2. **The narcotic register format a Sindh drug inspector actually accepts.** I have specified the columns from the shape of the requirement, not from a document. **Photograph a real register in Larkana before building the printout.** Also confirm whether this pharmacy holds anything controlled at all.
3. **Whether "one spoon = 5 ml" is safe as a default.** It usually is, and paediatric droppers and 2.5 ml caps are where it is not. `perDose` is per item and set by a person, which is the right shape — but somebody has to set roughly 900 of them, and a wrong one is a wrong quantity given to a child. I do not have a good answer for how that data-entry job gets quality-controlled and it is the most safety-critical unglamorous work in the module.
4. **Whether a salesman will tolerate blind counts.** It reads as an accusation, because it is one. In a two-person pharmacy it may be socially impossible. Untested.
5. **Whether the doctor accepts his lines being pushed to the pharmacy under `mine`.** I believe the argument in §2.1 is sound — the patient carries the paper there anyway — but nobody has said it to a doctor. If the answer is no, `sendToPharmacy` defaults off and the pharmacy types every slip, which is slower and still works.
6. **Twenty seconds for a three-line dispense.** That is a target derived from the shape of the screen, not a measurement. **Time it with a stopwatch against a salesman doing it by hand**, in the same way the clinic design insists on timing tap-to-paper. If the paper route is faster, the screen is wrong and no amount of stock accounting will save it.
7. **Pack size varying by batch.** I have allowed `perStrip` on the `Batch` and flagged it at receive. I am not confident that is enough — the same brand arriving in 6s and 10s in alternate months makes `qtyText` shift under the counter's feet, and a "2 strips + 3" that means different things on different days is a new class of error the paper world does not have.
8. **The bill printer.** `token.ts` carries a rule that a medicine may never appear on a token, and it is right. The pharmacy bill is a deliberate exception — it is a bill *for medicines*, so medicines and money are inherently on one artifact — and it needs its own renderer in its own file with its own rule comment, never a modification of `token.ts`. If it prints on the thermal printer, the ESC/POS raster finding applies in full: **Sindhi cannot be printed as ESC/POS text**, so the bill rasterises at 384/576 dots exactly as the token does, and there is no text path.
9. **Negative stock as a design position.** I am confident it is right — refusing a patient over a data error is worse than a wrong number — but a storekeeper who learns that the system tolerates negatives has learned something useful, and I have not thought through whether an exception page is enough friction.