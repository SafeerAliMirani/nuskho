# The store catalogue

A design note, not code. It exists so the two catalogues stay separate because of
their shape, not because someone remembers to keep them apart.

---

## Why two

| | Prescribing dictionary | Store catalogue |
|---|---|---|
| Answers | what may be written on a slip | what is on the shelf |
| Size | a few hundred, hand-verified | as large as the invoices make it |
| A wrong row costs | a patient | a stock discrepancy |
| Sindhi | required before it prints | not needed at all |
| Prices | never | the whole point |
| Pack sizes | never | the whole point |
| Grows from | doctors prescribing, then a person checking | the shop's own purchase invoices |

One medicine is **one** prescribing entry and **several** store products.
`AUGMENTIN 625mg` is what the doctor writes. The shop stocks a strip of six, a
strip of ten, and a bottle of syrup, each with its own price, batch and expiry.
Collapse those into one table and either the doctor's picker fills with pack
variants he must now choose between, or the shop cannot tell its own stock apart.

---

## The store catalogue

```ts
interface StoreProduct {
  id: string
  /** printed on the box. The join to the prescribing side lives here. */
  brand: string          // AUGMENTIN
  strength: string       // 625 mg
  form: Form             // tab | cap | syr | other
  generic: string        // Amoxicillin + Clavulanic acid

  /** what makes this a product rather than a medicine */
  pack: string           // "strip of 6", "60 ml bottle"
  packUnits: number      // 6  — how many doses in one pack, for counting down
  distributor?: string
  tradePrice?: number    // what the shop paid
  retailPrice?: number   // what the shop charges

  /** stock, which is the only part that moves */
  onHand: number         // in packs
  reorderAt?: number     // tell me when it drops below this

  addedAt: number
  source: 'invoice' | 'typed'   // never 'imported'
}

interface StoreBatch {
  id: string
  productId: string
  batchNo?: string
  expiry: string         // YYYY-MM
  qty: number            // packs in this batch
  receivedAt: number
}
```

Batches are separate from products on purpose. A shop holds the same product in
two batches with different expiries, and the one that matters is the earliest.
Without this table an inventory system can tell you that you have eleven strips
and not that four of them expire next month.

---

## The join

```ts
const key = (brand: string, strength: string) =>
  `${brand} ${strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')
```

The same normalisation the prescribing side already uses, so `AUGMENTIN 625 mg`,
`Augmentin 625mg` and `AUGMENTIN  625MG` are one key.

When a slip reaches the counter, the terminal matches each printed line to the
store's products by that key and shows what the shop holds. Three outcomes, and
all three must be ordinary:

- **one match** — show pack options, dispense, count down
- **several matches** — different packs of the same medicine; the dispenser picks
- **no match** — the shop does not stock it, or spells it differently. Show the
  printed line as it stands and let him dispense from paper. **A miss is not an
  error and must never block the counter.**

A no-match is also a work item: it means either the shop should add that product,
or the prescribing dictionary has a spelling the local market does not use.
Either way a person looks at it later, not the patient standing there.

---

## Rules that keep them apart

These are structural. If they hold, the merge cannot happen by accident.

1. **Separate tables, separate files, separate stores.** The store catalogue does
   not live in the doctor's database and is never loaded by the prescribing app.
2. **The join is one-way at read time.** The counter reads a printed slip and
   looks up products. Nothing on the store side can write into a prescription,
   and no store product can ever appear in the doctor's medicine picker.
3. **No field crosses.** Prices and pack sizes exist only on the store side.
   Reviewed Sindhi exists only on the prescribing side. If a field is ever needed
   on both, copy it at the boundary rather than sharing a table.
4. **`source` may never be `imported`.** Rows come from an invoice someone
   entered or a product someone typed. The moment a bulk file can land here, the
   argument for landing it on the prescribing side starts again.
5. **The store terminal keeps no prescription history.** It reads one slip, by a
   code presented at the counter, marks it dispensed, and purges. No browsing, no
   search across slips, no record of what any doctor prescribes. That restriction
   is what stops the shop becoming the prescribing-data aggregator the design
   refused everywhere else.

---

## Filling it

From the shop's **own purchase invoices from its distributors**, not from a
website. Those invoices are current, they are exactly what this shop stocks in
this town, they carry real trade prices and pack sizes, and they belong to the
owner — no scraping question, no Karachi-centric product mix, no staleness that
nobody owns.

One month of invoices is a working catalogue. Two months is a good one.

The entry screen should therefore look like an invoice, not like a search: date,
distributor, then rows of brand / pack / quantity / trade price / batch / expiry.
The person typing it is doing what they already do with the paper file.

---

## What this buys the shop, in order

1. **Expiry.** What is expiring in sixty days, worth how much. This is the single
   most valuable thing an inventory system does for a small pharmacy, it needs no
   prescription data at all, and it is a patient-safety win as well as a money one.
2. **Reorder.** What has dropped below its level, ready to go on the order sheet
   that already exists.
3. **Dispensed against a slip.** Count down on dispense, and record when the
   dispenser substituted or gave a partial quantity — which is the one fact the
   doctor genuinely wants back.
4. **Slow movers.** What has sat untouched for ninety days. Every small pharmacy
   has money dead on a shelf and no way to see it.

Note that items 1, 2 and 4 need no connection to the doctor at all. If the
pharmacy module ever has to be justified on its own, that is the case: it is
worth installing in a shop that has never seen a Nuskho prescription.

---

## Sequencing

Building this catalogue costs nothing now and can start whenever a shop will hand
over a month of invoices. Building the **module** before the doctor's pilot is
the part to hold back — the store piece is phase five, and it is the phase most
likely to drift into the thing that was refused: a counter terminal accumulating
brand, dose and doctor name on the hospital's own hardware.

Design it so that when it arrives, that drift is prevented by rule 5 rather than
by good intentions.
