# Nuskho as a platform, without becoming a health-data company

Version 1 · decisions, not options. Where something is still open it says so.

---

## The one rule everything else bends around

**A prescription must print with the internet down.** Not "degrade gracefully" —
print, identically, every time, with the router unplugged and the power flickering.

That is the entire reason a doctor in Larkana would put down a pen he has used for
twenty years. Lose it once, at eight in the evening with thirty people outside,
and you lose that doctor permanently and he tells the other doctors.

So this is **local-first**. The clinic keeps its own complete database and works
exactly as it does today. Sync is something that happens afterwards, in the
background, and its failure is invisible. The server is a **copy**, never the
source of truth.

Everything below follows from that sentence. If a decision ever conflicts with
it, the decision loses.

---

## What the server can and cannot see

You chose end-to-end encryption. Concretely, this is what lands in Postgres:

| Column | Example | Encrypted? |
|---|---|---|
| clinic id | `cl_7f3a…` | no |
| doctor account | `dr.ahmed@…` | no |
| device id, app version | `dev_91b2…`, `1.0.0` | no |
| when it last synced | `2026-08-03T19:40Z` | no |
| patients seen today | `47` | no |
| slips printed today | `44` | no |
| days since last backup | `2` | no |
| **the patient** | name, age, phone, town | **yes** |
| **the visit** | medicines, doses, diagnosis, vitals, fee | **yes** |

The encrypted columns are opaque bytes. Postgres cannot index them, search them,
sum them or report on them, and neither can you, and neither can anybody who
subpoenas you, buys you, or breaks in.

**What you give up, permanently, and should decide you are comfortable with:**

- No cross-clinic search. You can never answer "which clinics prescribe the most
  antibiotics", because that is exactly the question this design exists to make
  unanswerable.
- No server-side reports on content. Every figure a doctor sees is computed on
  his own machine, as it is today.
- No "AI insights across the network" pitch, ever. If that is in your deck,
  take it out now rather than in front of an investor.
- No support person looking at a doctor's records to debug something. The
  offline support report in About stays the only channel, and that is a feature.

**What you keep, which is most of what you actually asked for:**

- Accounts. Doctors and compounders sign in.
- A live dashboard of every clinic: who is active, how busy, which version, when
  they last synced, whether they are backing up.
- Restorable backups. You can hand a clinic its own ciphertext back after a dead
  hard disk, and their key decrypts it.
- Remote onboarding. A new doctor installs it himself without you flying to him.

---

## Keys: the part that kills projects like this

Encryption is easy. Key handling is where end-to-end products die, so decide
these four now.

**One key per clinic, not per user.** The doctor and his compounder must read the
same patients. The unit of secrecy is the clinic, not the person.

**The key is generated on the clinic's machine and never transmitted.** Not at
sign-up, not "temporarily", not to a support engineer. The server has no code
path that can receive it.

**Recovery is a printed sheet, not a reset link.** This is the hard truth of E2E:
lose the key and the backups are permanently unreadable, and no "forgot
password" can exist without defeating the whole thing. So at setup the app
prints a **recovery sheet** — the key as words, on paper, which the doctor puts
in the same drawer as his registration certificate. Exactly like a bank locker.
The app must say this in plain language and make him confirm he has printed it.

**A second device joins by showing it the key.** New laptop at the counter: the
first machine displays a QR, the second scans it. The key never touches the
network even to move rooms.

Still open: whether the passphrase that unlocks the key on each machine is the
doctor's PIN or a separate one. My instinct is separate, because a four-digit
PIN is not a key-encryption passphrase and people will pick 1234.

---

## What syncs, and how conflicts resolve

Sync is an **append-only log of changes**, not a database mirror. Each device
writes rows it owns and never edits another device's rows.

- **Patients** are stable. Last write wins on the whole record; conflicts are
  rare and harmless.
- **Visits are the dangerous one**, because the counter and the doctor both
  write to the same visit at the same moment. This is already solved locally:
  the room owns `lines / diagnosis / vitals / tests / advice / printedAt /
  status`, the counter owns `fee`. Sync uses the same split, per field.
  A whole-record merge would recreate the bug where a refund marked handed back
  gets erased and the patient is paid twice.
- **Printed slips never sync as editable.** A printed visit is frozen. It uploads
  once and is never merged again, because paper in a patient's hand cannot be
  amended by a background process.
- **Patient numbers** stay per clinic and keep the local high-water mark. Two
  clinics both having patient 00042 is correct and expected; they are different
  patients in different towns.

---

## Isolation

Row-level security on every table, keyed to the signed-in user's clinic. Not
application code — database policy, so a bug in the app cannot leak across
clinics. This gets tested by trying to read another clinic's rows and confirming
it comes back empty, and that test runs before any clinic is onboarded.

---

## Region

Your existing project is in **Sydney**, roughly 250ms from Larkana. Options:

- **Mumbai** is 40ms and technically ideal. Pakistani medical data on Indian
  infrastructure is a political and reputational problem you do not want to
  explain to a hospital board.
- **Singapore** is about 100ms, neutral, and the sensible answer.

Because sync is background work, latency barely matters for the clinic. It
matters for your dashboard. Pick Singapore and stop thinking about it. Moving
region later means migrating everything, so this is a now decision.

---

## What this costs to run

Supabase free tier covers development and the first clinics. Expect to move to
Pro (about $25/month) when you pass the free row and bandwidth limits, which
will happen sooner than you think because ciphertext is larger than plaintext.

The real cost is not the bill. It is that **you now have uptime**. Today, if
your infrastructure vanished, every clinic would keep printing and nobody would
notice. After accounts, a doctor who cannot sign in must still be able to work,
which means the offline path stays genuinely independent and is tested that way
on purpose, regularly.

---

## Before the first clinic uploads anything

**Get an hour with a lawyer.** Pakistan's Personal Data Protection Bill is not in
force, but that is not the same as no exposure: the doctors carry their own
obligations to their patients, and any hospital client or foreign investor will
ask you GDPR-shaped questions. End-to-end encryption is the strongest possible
answer to most of them — "we hold ciphertext we cannot read" — but you want that
written down by someone qualified, not by me.

**Write the terms before the sign-up form exists,** not after. What you promise
on day one is what you are held to.

---

## Order of work

1. **Schema, RLS and auth.** Nothing in the clinic app changes. Prove isolation
   by attacking it.
2. **The key: generation, the printed recovery sheet, the QR device pairing.**
   Before any data moves. This is the piece that cannot be retrofitted.
3. **Sync, upload only.** The clinic pushes; nothing comes back. Half the risk,
   most of the value, and it makes backups restorable.
4. **The dashboard.** Clinics, doctors, activity, versions, backup health.
5. **Download sync.** A second device in the same clinic. Only now does conflict
   resolution have to be right, which is why it is last.

Phase 1 and 2 are the ones worth doing carefully. Everything after is ordinary
software.
