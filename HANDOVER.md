# Nuskho — where things stand

Written 4 August 2026; updated 5 August 2026 after the four build phases.
Read this first; everything else in `docs/decisions/` is detail.

---

## Update, 5 August 2026: the designs became software

Four phases were built, reviewed by independent agents, fixed, and verified
end to end (unit tests plus scripted browser drives). All live, all pushed:

1. **Six real roles** at one front door — Doctor, Compounder, Token counter,
   Pharmacy (printed slips only, marks medicines given, records shorts),
   Clinic admin (drawer and machines, nothing clinical), Nuskho. Optional PIN
   per role; the router is the gate, not the menu.
2. **The Mirror** — the doctor's figures open on people, not money; received
   is stated after refunds; a per-evening rhythm chart; and a box naming what
   the page refuses to show. The prescription screen is a two-pane desk.
3. **Several doctors' rooms on one machine** — doctors.ts (the first doctor
   IS the profile, derived, never copied), per-room tokens with per-room
   restore guards, the Tonight strip, the door asks which doctor, slips and
   receipts carry their room's doctor, per-doctor figures, per-room drawer.
4. **The building on its own wifi** — tools/nuskho-wifi.cjs is a relay that
   stores nothing; one machine marked in Setup holds the records; phones are
   mirrors holding nothing, signing in through host-checked PINs; intents
   apply serially through the same functions the solo product runs. Medicine
   lines cross only to pharmacy sittings, printed slips only. Mirrors pin
   their host and say so plainly when it is off.

Also fixed in the final review pass, worth knowing about: Compose no longer
blanket-writes vitals/status (the desk's BP survives the doctor's dose tap —
verified in a live browser); amend and repeat-last strip pharmacy `given`
marks; discounts on still-due fees no longer fabricate refunds; **the
clinical day now ends at 4 am, not midnight** (dayKey/startOfToday/sitting all
share the shift; day.test.ts pins it); the frozen medicine grid actually
freezes with usage order and appends typed drugs at the end; the Nuskho
passphrase cannot be replaced without typing the current one; factoryReset
sweeps every `nuskho.*` key in both storages; full backups carry the
doctor's sets and bump today's token high-water on restore.

**Known hardening still open for a real multi-device building** (documented,
not blocking the solo/one-machine pilot): the wifi host announces itself
unauthenticated, so a hostile device already inside the clinic wifi could
race a fresh phone's first sign-in. Mirrors now pin the first host heard and
drop everything else, which closes it for any phone that has heard the true
host; the full fix is a host secret carried in the join QR. Do that before
putting phones in a building you do not control.

---

## The product, in three sentences

Nuskho prints prescriptions in Larkana, Sindh. English for the chemist, Sindhi
for the family, dose pictograms for the roughly four adults in ten who cannot
read either. It is offline-first: **the paper comes out with the router
unplugged, every time, and that rule outranks everything else in this
document.**

Built by Safeer Ali Mirani. He codes, works about thirty hours a week alongside
another business, and is not alone — Pirah reviews the Sindhi, a doctor is
helping, and there is family who could answer a phone later.

---

## THE ONE THING THAT MATTERS RIGHT NOW

**The app has never been used with a real patient. Not one evening.**

Everything below — the encryption, the hospital modules, the pharmacy — is
guessing until a six-week pilot has run. Safeer confirmed nothing is blocking
it: print works, Sindhi is ready, the doctor is ready.

So the next thing is not a feature. It is `docs/decisions/nuskho-pilot.md`, and
during those six weeks **build nothing new — fix only what breaks.**

Two measurements have been outstanding for months and are still not done:

1. **Tap to paper**, timed ten times on the clinic's real printer. He writes a
   prescription by hand in about twenty seconds. Over eight seconds and he goes
   back to the pen — not on day one, on the evening the queue is forty deep.
2. **Do the pictograms work.** `docs/decisions/pictogram-test.pdf` is a printed
   sheet for twenty patients. This is the only thing in Nuskho that no
   competitor has, and it has been shown to zero human beings. A picture meaning
   "three times a day" read as "three tablets at once" is the one way this
   software can hurt somebody.

---

## How to work on this repository

**Work directly in `E:\Medical Project Larkana`.** The previous session did the
work in a cloud copy and tried to hand it over afterwards — that caused a zip
that unpacked into the wrong folder, a script the machine did not have, and an
hour lost. Edit here, build here, verify here.

    npm test          the tests
    npm run pilot     tests, build, and seal a copy for a clinic
    npm run dev       ordinary development

`npm run pilot` writes `releases\nuskho-<date>-<commit>\`. That folder is what
goes to a clinic. If the name ends in `-DIRTY`, tracked files were modified and
the release cannot be rebuilt from that commit — commit first.

**Inside a release, `Start Nuskho.bat` is how it is opened. Never
`index.html`.** Chrome refuses to let a page opened from disk keep any records
unless it is *started* with `--allow-file-access-from-files`, and that flag is
ignored if any Chrome window is already open. Double-clicking `index.html` on a
clinic laptop that has Facebook open in another window gives a **white page with
no error** — which would have read as "the software is broken" on the first
evening of the pilot. The `.bat` starts its own Chrome so the flags always
apply, and switches on `--kiosk-printing` so no dialog appears per patient.

---

## Standing rules — do not quietly break these

1. **Prints with the internet down.** Nothing may sit between the doctor tapping
   print and paper appearing. No network call, no licence check, no sync.
2. **Never print an unreviewed Sindhi drug name.** The code requires
   `sdReviewed === true`. A machine guess stays off the paper.
3. **Prescribing data is never sold or aggregated.** Not to a drug company, not
   in aggregate, not later. This is why the independent-pharmacy app was ruled
   out (see below).
4. **Money and medicine never share one printed artifact.** The prescription
   carries no fee; the counter token carries no clinical content.
5. **No kill switch, ever.** The app never contacts a server to decide whether
   it may run. If Safeer disappears, every clinic keeps printing. Put this in
   the terms as well as the code.
6. **A printed slip never changes.** Correcting the medicine list tomorrow
   cannot alter a prescription already in someone's hand.
7. **Nuskho the company cannot read a prescription.** This was *false in the
   shipped code* until this session — see below.
8. **No real patient names in mockups. No unregistered domain printed.**
   `APP.web` stays blank until `nuskho.pk` is registered.

---

## Decisions made this session

The long plan document these came from was deleted once the software
existed and started contradicting it. It is still in the git history if
the reasoning is ever wanted: `git log --diff-filter=D --name-only`. What
survived is below, and the standing rules above.

**The product is a downloaded application that updates itself.** The public web
link becomes a demo. This was the question that gated everything — if a server
serves the code, "we cannot read your prescriptions" is false, because whoever
publishes it can push a build that sends the keys. Two conditions: the demo must
refuse to hold real patients, and updates must be *signed* and *accepted by the
clinic*, never silent.

**Inside a clinic, devices talk over the clinic's own network.** The room
machine holds the records and serves the counter phone and the doctor's tablet.
All writing happens there. *(Built, 5 August: see the update at the top.)*

**Outside the clinic, one-way and read-only.** The doctor's own records to his
own devices. He reads at home; he does not prescribe from a sofa. **Two-way
multi-writer sync is not built at all** — that is the single largest saving in
the plan, and it came from noticing every stated reason for sync was a
same-building problem.

**Sign-in.** There is none at first launch — a server standing between launch
and a working day breaks rule 1. A second machine *joins* an existing clinic by
a code from across the room or a setup file. The thirty-day session authorises
the **device**, never the person; the **working day** opens and closes daily, so
a closed day means a locked machine and the cleaner at eleven at night finds
nothing.

**Roles.** An administrator's clinical reach can never exceed what the doctors
already grant each other. Operations (staff, rooms, devices, money, backups) is
split from clinical reach, and only a doctor may hold the latter — because at a
hospital the admin login goes to the IT man. Changing a sharing mode must never
open the past.

**Attendance** means the clinic knowing its own working day, locally. Reporting
staff hours to a hospital owner is a separate product for another year, and
needs a consent screen and a lawyer.

**The hospital system** is mapped in `nuskho-hospital-modules.md` and
`nuskho-pharmacy.md`, and honestly costed at five to seven years for one
part-time person. The advice in both documents is to stop after OPD +
prescriptions + pharmacy stock + billing and sell that.

**The independent-pharmacy app was ruled out.** A hospital's own pharmacy is
fine — it is a department in the building that wrote the slip. A network of
bazaar medical stores with accounts is not: the danger is joining many shops
under one identifier, and in Larkana a shop's credit comes from its distributor,
so a per-shop account is in practice a distributor-accessible account. This
dataset does not exist in Pakistan today; building it would be creating the
first one. **Instead, print the total tablet count on the slip** — "5 days — 10
tablets" — which captures most of the benefit, costs about a day, and creates no
data. That is not yet built and is the best small job available.

---

## Still open

- **The price.** Safeer plans some doctors free, some at half, some full, monthly
  — but no number is set. It has to be decided *before* the pilot doctor is
  asked, because the first number said out loud becomes the anchor.
- **A doctor leaves a hospital — who owns the records?** No answer. It is mostly
  a contract question, but the key model must be able to express whatever the
  contract says, and today it cannot.
- **One doctor working at two clinics.** Not modelled. Common in Larkana.
- **`nuskho.pk`** not registered.
- **The medicine list** is still sample data. It needs the pilot doctor's real
  thirty to fifty.

---

## What was fixed in the code this session

All committed and pushed.

**The patient code cliff.** `parseCode` demanded exactly five digits while
`patientCode` pads to a floor of four — so patient 10,000 got a six-character
code that the clinic's own desk returned nothing for. No error: the compounder
would register the same person again as new, and the doctor would open an empty
history while trusting the screen. At ~140 patients an evening that arrives
around month seven. Width is now unbounded; every slip already printed still
parses. Seven tests cover it.

**Token collisions.** `nextToken` had no high-water mark, so restoring a backup
reissued numbers families were holding on thermal receipts — two people standing
up when the doctor calls seven. Now guarded per day, outside the restorable set.

**The vendor key.** The `admin` role was named "Nuskho admin", its passphrase is
described in `profile.ts` as *"held by the company, not the clinic"*, and it
granted `prescribe`, `history`, `backup` and `erase`. So while the plan argued
that "I cannot" is the only answer that survives a court order, the code said
otherwise. Clinical rights moved to the doctor, including backup — an export is
a complete copy of every prescription in the building.

**The channel split.** Builds now carry `clinic` or `demo` plus the commit they
came from. The demo prints SPECIMEN over everything (tiled, because a single
centred word missed the medicines entirely), uses its own database, cannot
export, and forgets after twelve hours' silence. This exists so the public copy
cannot quietly become somebody's real clinic — the failure is drift, not misuse:
nobody decides to start, they just never stop.

**Tests and CI.** There were none. Vitest is in, and `npm run build` runs the
tests first.

**The About screen** no longer promises there is no plan for a server, and says
plainly that Nuskho cannot read prescriptions. It also now warns when Chrome has
refused persistent storage — losing a month of records to browser eviction was
ranked a higher real-world harm than any attacker.

---

## The argument against most of this, kept because it is true

An independent review with market research found: Pakistan still has **no
enacted data protection law**, so no buyer has a compliance reason to pay for
the privacy architecture; **oladoc myPractice (~38k installs) and Marham Connect
(50k+) are free** competitors for solo doctors; a complete multi-module hospital
system sells on CodeCanyon for **$59**; and Punjab's government IT board shipped
a five-module system across sixteen hospitals in about two years with a full
team.

Its ranking of how this project actually dies, most likely first:

1. **Never shipping, because planning feels like progress.** There are now
   thousands of lines of design documents and zero clinic-days of use.
2. The pilot happening and quietly failing without anyone learning why.
3. Splitting attention between solo doctors and hospitals.
4. Support load stopping all building at 15–30 clinics.
5. Never setting a price, so it stays free, so it stays a hobby.

And its ranking of real harm: **a misread pictogram, then losing a month of
records to browser eviction, then a curious employee at a hosting company — in
that order, and it is not close.** Encryption is not this product's risk.
Correctness is.

None of that means stop. It means the pilot comes before everything, and the
pictogram sheet is the most important piece of paper in the project.
