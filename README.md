# Nuskho نسخو

The first Sindhi clinic and hospital system. English for the chemist, Sindhi
for the family, pictograms for whoever reads neither. Offline first: the
paper comes out with the router unplugged, and that rule outranks everything
else in this repository.

## What is built

All four planned phases are working software, verified end to end:

- **The solo clinic** — queue, fee-first tokens, the doctor's two-pane
  prescription desk, printed bilingual slips with dose pictograms, history by
  slip number, backups, and the doctor's private figures page.
- **Six real roles** behind one front door — Doctor, Compounder, Token
  counter, Pharmacy, Clinic admin, Nuskho — each with an optional PIN, each
  enforced in the router and the data layer, never just the menu.
- **Several doctors' rooms on one machine** — the Tonight strip at the desk,
  per-room tokens and fees, each slip and receipt carrying its own room's
  doctor, per-doctor figures.
- **The building on its own wifi** — `tools/nuskho-wifi.cjs` (a relay that
  stores nothing) serves phones as mirrors that hold no records: the counter
  issues tokens, the compounder runs the queue, the pharmacy marks medicines
  given, all against the one record-holding machine. No internet involved.

React + TypeScript + Vite, Dexie / IndexedDB. Records live on the clinic's
machine; there is no server, no account, no upload, and no kill switch.

## What this deliberately is NOT

Not built, on purpose, until a real clinic pulls for it:

standalone medical-store app with stock and billing · QR patient record
wallet · internet accounts or cloud sync · WhatsApp or SMS · analytics
beyond the doctor's own figures · a national drug database · anything that
suggests a medicine the doctor did not choose.

Queue management is the specific trap: no reordering UI, no priority tiers,
no wait-time estimates, no "now serving" display. The one flag is "cannot
wait", set by a human looking at the patient.

## Run it

    npm install
    npm run dev          # development
    npm test             # vitest
    npm run build        # tests, typecheck, clinic dist/ AND web dist-web/
    npm run pilot        # tests, build, and seal a release folder for a clinic

On the clinic machine, launch Chrome like this so there is **no print dialog**:

    chrome --kiosk-printing --allow-file-access-from-files "dist\index.html"

At 140 patients an evening, one dialog per patient is on its own enough to
sink the pilot. Set the A5 printer as the Windows default first. Inside a
sealed release, `Start Nuskho.bat` does all of this — never open `index.html`
by hand.

For a building with phones, run the wire on the one record-holding machine:

    node tools\nuskho-wifi.cjs dist

It prints the address; phones on the clinic wifi scan the join square shown
under Setup, Wifi. The relay stores nothing, and the phones store nothing.

## Before a pilot evening

1. Set the doctor's name, degrees and paper under Setup (the first-run wizard
   walks through it).
2. Replace `src/data/formulary.ts` with **that doctor's own** 30–50 drugs.
   Photograph 20 of his handwritten prescriptions and transcribe them.
   If the compounder has to search, entry is already too slow.
3. Dress rehearsal in the empty clinic an hour before: print ten slips in a
   row, time them, check the tray and the default printer.
4. Agree the fallback out loud with the doctor: *if anything fails, you
   handwrite that patient, no drama, we continue.*

## The print layer

`src/print/` is plain TypeScript and hand-written CSS, and React never touches
it. `renderSlip.ts` takes data and returns an HTML string; `slip.css` is the
A5 layout already verified against a ruler on real paper.

Keep it that way. No CSS-in-JS, no component library, no bundler transform.
It is the only part of this project where a bug means a patient takes the
wrong dose, and every future rewrite should inherit it untouched.

## Data model

Two entities. `Patient` (ULID id — **never** the phone number; one phone serves
a household here and many patients have none) and `Visit`. The token is a plain
integer field on a Visit, resets each session, and is a display label — never an
identity and never a key.

`printedAt` is set on every successful print. That is the audit trail: compare
slips printed against patients seen for the evening.

## Known open items

- `nuskho.pk` is not registered yet, and it prints on every slip.
- The QR must encode a redirect you control (`qr.nuskho.pk/...`), never a
  backend URL directly. Once slips circulate the encoded URL is unfixable.
- Letterhead margins are still guessed at 44 mm top / 17 mm bottom.

## Checking that a slip actually fits the paper

`.page` is `overflow:hidden`, so a slip whose rows run under the signature box
looks perfect on screen and only fails on paper. There is no fixed
medicines-per-sheet number — the budget changes with the diagnosis row, the
vitals, the tests, the advice, how the Sindhi name wraps, and whether the sheet
is the last one. `src/print/paginate.ts` therefore renders each candidate sheet
off-screen at 148×210mm and measures it.

    npm run dev
    open http://localhost:5173/dev-fit.html     # capacity + clearance table
    open http://localhost:5173/dev-shot.html    # renders a slip for eyeballing

`dev-fit.html` prints, for a set of prescriptions, the sheet layout chosen and
the clearance in px between the last block and the footer on every sheet. Any
negative number is a slip that would have printed over its own footer. Run it
after touching `slip.css`, `renderSlip.ts` or `paginate.ts`.

## Paper: A5, A4, plain or the doctor's own letterhead

Set in the app under **Paper** (top right of the queue). Four combinations, all
covered by `dev-fit.html`:

| | plain | letterhead |
|---|---|---|
| **A5** 148×210 | we print his heading | we keep his bands clear |
| **A4** 210×297 | we print his heading | we keep his bands clear |

A4 is not a stretched A5. `slip.css` has a `.page.a4` block that spends the extra
width on legibility: the Sindhi name sits *beside* the English one instead of
wrapping under it, columns and pictograms grow. A4 fits roughly 8 medicines on
one sheet where A5 fits 6.

### Letterhead bands

`top` and `bottom` (mm) are the parts of his sheet that are already printed.
Nothing the app prints may enter them — `dev-fit.html` asserts this, not just
that the slip fits the page.

Do **not** ask a doctor to measure his pad with a ruler. Setup prints a
calibration sheet: a millimetre scale down both edges, printed onto one of his
own letterheads. He reads two numbers off his own paper, so the numbers include
his printer's feed offset, which a ruler cannot know. Then add 3–4mm each.

Page geometry travels as inline custom properties (`--pw/--ph/--lht/--lhb`, see
`paper.ts`) rather than a stylesheet rule. An inline style beats any rule, so no
injection order can leave an A4 slip being laid out at A5 — which is exactly the
bug that made A4 report 3 medicines per sheet the first time.

## First run

`Welcome.tsx` runs once on a fresh machine: intro → doctor identity → paper →
heading/logo → his medicine list → PIN → test print. Everything it collects used
to be hard-coded in `clinic.ts`, which only worked while we were the ones
installing it.

Both the wizard and Setup use the *same* controls, defined once in
`screens/setup/fields.tsx`. Two copies would drift, and the way they drift is a
doctor changing something in Setup that the wizard set differently.

### The lock is not an account

`profile.ts` holds a salted SHA-256 of a PIN in localStorage. No server, no
network, no lockout after wrong attempts. It defends against one thing: a laptop
left open on a desk in a room full of strangers with every patient's history one
tap away. It must never be able to stop a doctor prescribing — an evening with
no internet is a normal evening in Larkana, and locking him out while twenty
people wait would be a far worse failure than the one it prevents.

There is no PIN recovery, deliberately, and the wizard says so in plain words.

### The sample formulary is a starter, not a library

Once `profile.ready` is set, `doctorDrugs()` returns only what is in the
database. Merging our 8 samples in forever meant "AUGMENTIN 625 mg" (ours) and
"AUGMENTIN 625mg" (his) appeared as two chips, the duplicate guard could not see
they were the same medicine, and both could land on one prescription. Entries
are also deduplicated on a normalised brand+strength key, with his spelling
winning over ours.

## Who may change what

| | the clinic | Nuskho (us) |
|---|---|---|
| Paper, letterhead bands, A4/A5 | ✓ | ✓ |
| His medicine list | ✓ | ✓ |
| His screen PIN | ✓ | ✓ |
| Backup and restore | ✓ | ✓ |
| Name, degrees, PMC number | | ✓ |
| Logo and the Nuskho credit line | | ✓ |
| Reviewing medicines into the catalogue | | ✓ |

The admin passphrase (`profile.ts`) is separate from the doctor's PIN and is set
by whoever installs. Identity fields constitute a legal identity on a printed
medical document, they change roughly never, and we install in person — a cheap
lock with no workflow cost.

**Medicines are deliberately NOT locked.** In an offline app "admin only" means
"phone the founder and wait" while forty patients queue. The first time that
happens the doctor picks up his pen, and once one prescription a night is
handwritten again the product's whole promise is gone. A two-person company
cannot be a synchronous dependency for every prescribing decision in every
clinic. What replaces the lock: a similar-medicine prompt before a new entry is
created, an unverified marker **on screen only**, and a review queue we work
through on visits. Visibility, not prevention.

Nothing about verification is ever printed. Marking a drug "unverified" on paper
invites the chemist to refuse or substitute and undermines the doctor in front of
his patient. His signature is the verification that matters. The one place
unverified data is genuinely dangerous is Sindhi, and that rule is unchanged:
an unreviewed Sindhi name simply does not print.

## Prescriptions carry their own copy

`RxLine.snap` is written at the moment of printing. From then on the slip does
not depend on the medicine list at all, so spellings can be corrected, duplicates
merged and entries retired without any of it reaching back and changing a paper
already in a patient's hand. "What exactly did you prescribe in March" has to be
answerable years later with the exact printed text. Medicines are therefore
*retired*, never deleted.

## Moving to another machine

Setup → **Backup**. Two files, deliberately different:

- **Clinic setup** — profile, paper, medicine list, and the admin lock. No patient
  data. This is the one to carry to a tablet, a phone or a new PC; on first run
  choose "I already have a setup file". It carries the lock too, otherwise
  export-and-import would strip it and the lock would be theatre — which is why
  the passphrase should not be a short word.
- **Everything** — the same plus patients and prescriptions. This is medical
  records. It stays in the clinic and is not emailed to anyone, including us.

Restore adds and never replaces, so importing the same file twice changes nothing.

## The day, as it will be counted

Not every token becomes a prescription. `VisitStatus` records `seen`, `left`,
`cancelled` and `referred` alongside `done`; a token left "waiting" for ever
makes the evening's figures a lie. The fee (`Visit.fee`) is asked for *after*
printing, never before — money must not stand between a patient and his
prescription — and an absent fee is not the same as zero, which the panel will
need to tell apart.

## The doctor's figures

Two artifacts, and the wall between them is the whole privacy design.

**The Mirror** (`screens/Stats.tsx`) — private, in-app, operational. Money lives
here and only here. Medicines appear by **generic name** only, behind a tap, and
are excluded from every print and export path: brand-level prescribing data is
exactly what pharmaceutical companies buy, so this app does not produce it.

**The Card** (`print/card.ts`) — the thing meant to leave the clinic. Drawn from
a whitelist (`cardData()`), not from the dashboard with the private parts hidden,
so it is *structurally* incapable of carrying a rupee figure, a medicine, a
village name or a patient. Canvas-rendered, so one implementation serves the
preview, the WhatsApp-sized PNG and the printed copy, with no network and no
libraries.

### Rules in `stats.ts`

- **Never cross a diagnosis with a village, an age or a sex** — not even
  privately, because a private screen gets photographed too. That one rule
  removes almost the whole re-identification surface.
- Any breakdown cell below `MIN_CELL` (5) merges into "Other (n kinds)".
- A diagnosis is named on the Card only at **n ≥ 25**. Below that, a "case" in a
  town this size is a person.
- Every percentage carries its count. "Not recorded" is always its own visible
  category, never quietly dropped from the denominator.
- No projections, no smoothing, no trend arrows below `MIN_TREND` (30) visits.
- Place names are canonicalised (`canonPlace`) or "Larkana", "larkana " and
  "Larkana City" become three bars for one town.
- Arrival-by-hour is suppressed entirely when tokens look batch-issued — that
  chart would show when the compounder was typing, not when patients arrived.
- A clock check: visits dated in the future mean the laptop's clock is wrong, and
  the page says so instead of charting nonsense.

### What is deliberately absent

Patients per hour, average consultation time, revenue per patient, streaks,
records, personal bests, projections, comparisons with other doctors. A page
that celebrates patients-per-evening is a page that quietly argues for shorter
consultations. The headline pair is **people served** and **people who came
back** — volume plus the closest thing this data has to evidence of care.

Money never reaches an exportable surface. A picture of a doctor's monthly
earnings circulating in a small town is a robbery risk, a jealousy engine, and a
way to look mercenary to every patient who sees it forwarded.

No receipts. The real reason small-town practices avoid them is documentation
anxiety, and an app that starts printing a paper trail per visit is an app that
gets uninstalled. The useful 90% is the fees-due list on the Mirror.

## Four things that can lose a clinic its records

`safety.ts`. None of them are exotic — they are the failure modes of a browser
app on a Windows machine in a clinic.

1. **Eviction.** `keepStorage()` calls `navigator.storage.persist()` at startup.
   Without it Chrome treats the whole practice as cache, and "Clear browsing
   data" takes it instantly.
2. **The patient number after a restore.** The number printed on a slip IS the
   patient's card. Restoring last night's backup rewinds the table while today's
   families are still holding their numbers on paper. So the high-water mark
   lives *outside* the restorable set, only ever rises, and a restore jumps it
   clear of everything it brought back. A gap in the numbering costs nothing; a
   collision costs two people one identity.
3. **Nightly snapshot.** A browser cannot silently write to a second drive, so
   the honest version is three rolling full snapshots inside the database. That
   survives a crash or a bad restore. It does **not** survive the disk dying —
   only an exported file does, which is why the queue screen nudges when nothing
   has left the machine in a week.
4. **Cold printer.** The first print after an idle hour is the slow one, and it
   happens at nine in the evening in front of a full room.

## Why there is no medicine catalogue, and no suggestions

Two proposals were considered and both rejected on advice.

**A national or retailer catalogue.** A retailer's list is SKUs filtered by one
chain's stock and priced weekly; DRAP's public index carries a disclaimer that it
may not be used as a reference for any purpose. Beyond provenance, fifty items is
a *safety* feature: the doctor navigates by muscle memory and a mis-tap is nearly
impossible, where a typeahead over thirty thousand Pakistani brand names — which
differ by a suffix or one letter — makes mis-selection routine. And "never print
an unreviewed Sindhi name" is only satisfiable at formulary scale; nobody reviews
thirty thousand transliterations.

**Learned suggestion over that catalogue.** Ranking answers navigability and
nothing else. The cold start lands on the pilot evening; a list that re-sorts as
it learns breaks the spatial memory the fixed grid deliberately protects; and
after three months the ranker converges on the doctor's own 30-50 — which is
where the product already starts.

### The line: arrange and echo, never propose

- **Safe** — ranking his own list by his own usage; recalling a prescription he
  wrote; applying a set he named himself. The machine arranges what he authored.
- **Not built** — "you usually prescribe X with Y", and anything driven by a
  diagnosis. The moment software proposes a drug the doctor did not choose it
  stops being a typewriter and becomes clinical decision support, which in
  Pakistan is arguably a registrable medical device and is certainly a liability
  a two-person company cannot carry.

There is a second argument that settles it independently: a suggestion engine
would reinforce existing habits at machine speed, antibiotic over-prescribing
included — and Nuskho **could not detect the harm**, because detecting it needs
longitudinal cross-doctor prescribing data, which is exactly the dataset the
server is built to be incapable of holding.

### Doctor-authored sets

`RxSet` in `types.ts`. He types a name and saves the prescription in front of
him. Sets are never inferred from a pattern, never offered because of a patient
or a diagnosis, contain only his own formulary entries, live on the clinic
machine, and leave no trace on the printed slip. That delivers most of the speed
of co-prescription suggestion with none of the liability, because every set is a
thing he named and built.

## The dictionary: a quarry, not a shelf

`data/dictionary.ts`. Type two letters in the medicine box and matching entries
appear under it, each row reading **brand · strength · form · generic** plus the
Sindhi. Picking one copies it into the doctor's own list and straight onto the
dose grid. From that moment it is his: a **copy, not a live reference**, so a
later dictionary update can never silently rewrite a list he has already
reviewed and prescribed from.

The rules that make this safe, in order of how much they matter:

1. **It lives behind the search box, never in the picker.** The chip grid is his
   own formulary only, sorted once on open. The dictionary is a place to pull
   entries *from*, not a shelf to prescribe *off*.
2. **An entry may only be added after a person here has checked it by hand** —
   the brand exists, the strength is real, the form is right, and someone who
   reads Sindhi has read the Sindhi. That bounds the file to what two people can
   verify, which is exactly the point. It EARNS entries; it never downloads them.
3. **Text is the disambiguator, not pictures.** The dangerous confusion is inside
   a brand family — the 625 against the 1g, the plain against the -DS — and
   manufacturers deliberately give those identical trade dress. At the moment a
   picture is needed most, the two candidate pictures look the same, so the image
   raises confidence without raising accuracy, which is the worst property a
   safety feature can have. Brand · strength · form · generic always differs
   visibly, is authoritative, and never goes stale.
4. **Free text always survives.** The last row is always "add it in your own
   words". A catalogue that can dead-end is a catalogue that sends a doctor back
   to his pen.
5. **A dictionary pick prints bilingually from day one** because its Sindhi was
   reviewed. A free-text entry prints English-only until someone reviews it.
   Nothing prints unreviewed Sindhi; nothing blocks the doctor from prescribing.

Before the pilot, replace the seed list with the doctor's real 30-50, verified
against his own old prescriptions. Do not pad it to make the search feel fuller:
an unchecked row is a wrong medicine on a printed slip, and he will not know it
came from us.
