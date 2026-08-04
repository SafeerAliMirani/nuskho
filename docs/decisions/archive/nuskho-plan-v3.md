# Nuskho: the plan

Version 4. Four questions answered by Safeer directly; see the boxed answers.
Version 3. Written after an advisor drew the plan and two independent reviewers
attacked it — the second one with the shipped code open beside the document, which
is how the contradictions in section "What the code says" were found. Where they disagreed, the disagreement is shown rather than
smoothed over.

Three sections are Safeer's corrections rather than theirs, and they are the
ones that changed the shape of the plan:

- **Who is admin.** Both had left the administrator as a single unexamined blob
  holding every permission.
- **Cloud accounts.** The plan had argued against putting data on a server and
  had accidentally argued against putting *accounts* there too. They are
  separate decisions.
- **Three devices.** A doctor on a laptop, a phone and a tablet cannot have
  local-only history. This is what answered question 3, and it moved encrypted
  sync from optional to required.

Nothing here is built. That is the point of the document.

---

## Three questions before anything

None of these are technical preferences. Each one, answered differently, changes
what gets built for the next six months.

### 1. Who serves the JavaScript?

This is the one that decides whether end-to-end encryption is real or theatre,
and it had not been asked.

> **ANSWERED. The product is a downloaded application that updates itself; the
> web link is a demo that moves to a `.pk` domain.** Once a clinic signs up,
> nothing runs in a browser.
>
> This is the answer this section called the honest one, and it makes the
> encryption defensible. Two conditions come with it, and neither is optional:
>
> **The demo must refuse to store a real patient.** A demo that quietly becomes
> somebody's live clinic is the auto-updating web app this section warns about,
> wearing a different name. It needs a visible banner and a hard block on saving
> records.
>
> **"Updates from the app" must mean signed updates the clinic accepts.** An
> application that silently pulls whatever the server offers has exactly the
> problem a web page has — the publisher can push a build that sends the keys.
> Signed by a key that lives offline, and installed when a person says yes, not
> on launch.
>
> What this also unlocks, free: a real file on disk instead of browser storage
> (which deletes the eviction risk entirely), backup to a USB stick, and the
> ability to serve the clinic's own LAN — see the LAN section below, which is
> now half the answer rather than an alternative to it.

**This section's premise was also wrong, and the second reviewer caught it in
the repository.** The plan said the app runs from a folder on a clinic laptop. It
also runs at a public URL that redeploys on every push to `main`, with a
cache-first service worker that takes the new version on next open, and
`DEPLOY.md` actively encourages a doctor to install it to his phone's home
screen.

So there are two channels, and **the weaker one defines the promise**, because
you cannot tell which one a given clinic is running. By this section's own
logic, the question is already answered against building the encryption — unless
the web channel is shut down, or reduced to a demo that refuses to store real
patients, or replaced by the signed desktop application.

The hash-on-the-recovery-sheet answer below is also unimplementable: no doctor
in Larkana will SHA-256 a folder, and nothing shipped does it for him. That
leaves exactly one honest option, and it is the desktop app.

The rest of this section stands, and is why:

Folder distribution is the one arrangement where browser encryption is honestly
defensible: the code was copied there once, by a person, and it does not change
unless somebody copies a new one.

The moment there is a platform, **something serves the code**. If that is
Cloudflare, or Supabase, or any host, then whoever controls it can serve a
modified bundle that quietly sends the keys, on the next page load, and no
doctor on earth would detect it. At that point "the server cannot read your
prescriptions" is false, and it is false in a way that is worse than never
having claimed it.

There are exactly two honest answers:

- **A signed desktop application** (Tauri or similar) that updates only when a
  person chooses to update it.
- **Folder distribution that never auto-updates**, with the bundle's hash
  printed on the recovery sheet so it can be checked.

"We will serve it over HTTPS" is not an answer. HTTPS protects the code in
transit from strangers; it does nothing about the person who publishes it.

One thing that would force this question, if it ever comes up: a web page can
only reach a fingerprint reader through WebAuthn, and WebAuthn does not work
from a folder on disk. So fingerprint login is not a feature to bolt on later —
it is this decision arriving through a side door. Nobody has asked for it and it
is not planned; it is noted here only so that it is recognised as this question
rather than mistaken for a small addition.

**If the answer is a web app that auto-updates, do not build the encryption.**
Build ordinary server-side encryption, say plainly that Nuskho holds the data
under lock and key, and compete on the printing rather than on the promise.

### 2. Can the dashboard and the encryption coexist?

Not fully, and the collision has to be faced rather than deferred.

The whole reason for the platform is that Safeer cannot visit every doctor and
wants to see his clinics. But an encrypted record tells him nothing. So the
dashboard runs on whatever is left in the clear, and everything left in the
clear is prescribing metadata.

The reviewer's point is sharp: per-row `created_at`, `room_id` and a plaintext
`patient_ref` let anyone with database access reconstruct which patient attended
which doctor how many times, when the clinic is busy, and how long each doctor
works — without decrypting anything. Payload length alone separates a two-drug
acute prescription from an eight-drug chronic one. Sealing the daily counters
while shipping all of that is, in his word, theatre.

So choose deliberately, now, and write it down:

- **What must be readable** so the dashboard is worth having. Suggest: clinic
  name, app version, last seen, and a weekly count of slips printed per clinic.
  Not per room. Not per day. Not per patient.
- **What must be hidden**, and then actually hide it: pad ciphertext to fixed
  size buckets, make `patient_ref` an HMAC under a key the server never holds,
  and round timestamps to the day.

### 3. Does clinical content need to leave the clinic at all?

**Answered: yes. The doctor wants his patients at home, not only in the clinic.**

That settles it — but it settles it in a smaller way than it first looks, and the
shape matters more than the yes:

**Inside the clinic, over the clinic's own network.** Counter to room, laptop to
tablet, the compounder's vitals appearing on the doctor's screen. This is where
writing happens, and it needs no server, no cloud round trip and no conflict
resolution — the room machine holds the data and the others reach it directly.

**Outside the clinic, read-only, one way.** His own records, pushed to his own
devices, append-only. He reads at home; he does not write at home. That is a
fraction of the work of two-way multi-writer sync: no locks, no merges, no
conflict resolution, no policy re-wraps — and it is the entire feature he asked
for.

Nobody asked to prescribe from a sofa, and nothing should let them. **The
prescription is written in the room, on the machine that prints it.**

The original reasoning below still holds and is why this is worth building at
all:

The reviewer's cheapest suggestion was: do not sync prescriptions anywhere. The
clinic writes an encrypted backup file to a USB stick, the server holds accounts
and counts and never one byte of clinical content, and the whole key-management
problem evaporates. It was the right question to force, and the reason for
rejecting it is written down here as it should be.

The reason is Safeer's, and it is not about threat models. **A doctor signs in
on a laptop, a phone and a tablet.** A compounder registers a patient at the
counter on a second machine. If history lives only on the clinic laptop, the
tablet knows nothing and the doctor's screen never learns that a new patient
arrived. That works today only because it is all one computer, and it stops
working the moment there are two.

Multi-device and local-only cannot both be true. Choosing multi-device chooses
sync, and choosing sync while keeping the promise chooses encryption.

So the encryption gets built — but note what changed with it. It is no longer a
cost paid to keep a promise. It is the mechanism behind a feature the doctor
notices on day two, which happens to keep the promise as a side effect. That
version survives a busy evening; the other one gets cut the first time a
deadline bites.

What is still given up, and should stay given up: **Nuskho cannot restore a
clinic's records itself.** The ciphertext can be handed back; only their key
opens it.

---

## The gate, and it is stricter than it was

The advisor said: run the one-clinic pilot before writing any encryption. The
reviewer agreed with the principle and called the test too weak, correctly.

One evening with a stopwatch measures the part nobody doubts. The doubt is
**week six**: does the doctor still use it when the queue is forty deep, does he
turn the laptop on unprompted, does the compounder still take the blood
pressure, and does anybody pay.

**The gate is four to six weeks of daily use**, with at least four visits in five
going through the app in weeks four to six, plus either money or a clear stated
reason for refusing it.

Two things still have to be measured in the first week, because they have been
outstanding for months: tap-to-paper on the real HP LaserJet M28, and a slip
handed to a patient who cannot read, watched rather than described.

---

## Who is admin, and what admin may see

The app has carried three roles since the first week — counter, doctor, admin —
and admin was given every permission there is, because in a one-room clinic that
was obviously correct and nobody looked again. It stops being correct the moment
a second doctor exists.

### The solo clinic: the doctor is the admin

One doctor, one compounder, no hospital. There is no third person and none
should be invented.

**Admin is a hat, not a person.** He wears the doctor hat all evening. He wears
the admin hat perhaps three times a year — changing the letterhead, restoring a
backup, adding a medicine to the list. Separate PIN, so that it is a mode
entered deliberately rather than the mode he happens to be sitting in while
forty people wait outside.

**The compounder never holds it.** Not because he is untrusted — he is trusted
with the patients — but because admin can erase everything, and the person who
is tired at nine in the evening should not be one wrong tap away from that.

The open problem here is the forgotten admin PIN, which is the recovery-sheet
problem again. It is why the sheet has to exist even in a clinic with one room
and no server.

### The rule for hospitals

**An administrator's clinical reach can never exceed what the doctors already
grant each other.**

This is one rule, derived from the sharing mode, not a second setting that can
be configured into contradicting it.

| Hospital mode | What admin may read | Why |
|---|---|---|
| `all` | Prescriptions | The content already circulates among twenty doctors. One more reader in an open room changes nothing. |
| `referral` | Nothing by default | Same standing as any doctor. Access is granted per patient, by the doctor holding the patient. |
| `none` | Nothing routinely. Break-glass only, and loudly | The entire promise of this mode is that content does not circulate. An admin who can read is a secret twenty-first doctor, and it breaks a promise the *hospital* made to its own doctors. |

**`none` cannot mean "nothing, ever", and an earlier draft said it did.** At two
in the morning an unconscious patient arrives whose record was written in Dr
Ahmed's room, and Dr Ahmed's phone is off. In a solo clinic this is not a
problem — there is nobody else. In a twenty-doctor hospital it is a
patient-safety hole that the plan had been selling as a feature.

The mechanism already exists: every key is wrapped twice, so a **break-glass
wrap under dual control** costs nothing new. What matters is that using it is
loud — logged locally, and shown to the owning doctor in plain words the next
time he opens the app. That is the sellable version, and it is true: *nobody
reads your records without you finding out.*

United Medical Centre buys `none` precisely because its doctors do not want to
be read by each other. Selling them a mode whose administrator quietly reads
everything is selling them the opposite of the thing.

### Split the role, because the IT man will hold it

The hospital administrator's actual job is entirely non-clinical: who is
working, which rooms are busy, how many patients each doctor saw, what was
collected and refunded, whether the printer worked, whether the backup is
current, and how to add and remove staff. Not one of those needs a diagnosis.

And in practice the login handed out at a hospital like Indus goes to the IT
man, who is the last person who should be able to read a prescription.

So the single `admin` role splits in two:

- **Operations.** Staff, rooms, devices, paper size, money figures, backups,
  app version. **Never clinical content, in any mode, with no exception and no
  override.** This is the role the hospital hands out.
- **Clinical reach.** Follows the sharing mode above, and **only a doctor may
  hold it.** A medical director reading records is a doctor reading records. An
  administrator reading records is something else.

### Two rules that fall out of this, and both are load-bearing

**Changing the mode must never open the past.** If a hospital switches from
`none` to `all`, every record written under the old rule stays under it. Without
this, an owner flips one toggle and twenty doctors' entire archives open at
once, retroactively, with nobody told. In the key model this is free — policy
lives in the wraps, and old records simply do not get re-wrapped.

**Every doctor must be able to see which mode he is working under,** in plain
words, on his own screen, not buried in a settings page. The day a doctor at
United discovers his owner has been reading and that nobody told him, that is
the rumour that ends the company in Larkana — and it would be a true one.

### The same rule, applied to Nuskho itself

Anyone inside the clinic may see that clinic. Nobody outside it may, and that
includes Safeer.

Not because he would go looking. Because the capability, once it exists, has to
be defended by his personal courage against a court order, a police officer, a
hospital owner asking why a doctor's numbers dropped, a pharmaceutical company
with money, a future employee, an investor calling it a data asset, and whoever
eventually buys the company — on every bad day, forever. *"I cannot"* ends each
of those conversations in one sentence. *"I could, but I would not"* ends none
of them.

The cost is stated plainly elsewhere in this document: no debugging by looking.
The offline support report is the only channel, and it carries machine state
with no patient in it.

---

## Signing in

Two questions get confused here, and separating them is most of the design.

**"May this machine be part of this clinic?"** — asked once, at install, by a
person standing in the room.

**"Which of us is at the keyboard?"** — asked daily, must take under two
seconds, must work with the router unplugged.

Systems fail by making the second do the first one's work, which is how a
compounder ends up typing an email address at eight in the evening.

### Cloud accounts, offline sessions

An earlier draft of this plan proposed device-bound PINs and no accounts at all.
That was over-corrected: **cloud login and cloud data are separate decisions.**
Centralised accounts, email, and sign-in from any device do not require
prescriptions on a server, and arguing against the second had accidentally
argued against the first.

Cloud accounts buy three things worth having. The forgotten-PIN dead end mostly
disappears — a reset email replaces a hunt through a drawer, which was the
ugliest part of the earlier design. A departed doctor is deprovisioned from
Larkana rather than in person. And authentication gets built by people who do
nothing else, which is not where a one-person company should spend its risk.

The constraint that bounds all of it is the rule at the top of this project:

> A prescription must print with the internet down.

So: **sign in online once; the device holds the session for thirty days.** Power
cut, dead router, PTCL down — he is already signed in and the paper comes out.
The network is needed again a month later.

**The thirty days authorises the DEVICE, never the person, and that distinction
is the whole safety of it.** Safeer's objection was exact: if a login lasts a
month, the cleaner or the office boy who has seen the doctor type it can open
the machine at eleven at night and read everything.

Two separate things were being called one:

| | What it proves | How long |
|---|---|---|
| **Device authorisation** | this machine belongs to this clinic and may hold its records | 30 days offline |
| **The working day** | a person is at the keyboard right now | opened and closed daily |

A machine whose day has been closed is locked, whatever its device
authorisation says. The cleaner at eleven at night finds a locked screen and
cannot open a new day without the PIN. The doctor at eight in the morning opens
the day in two taps with no network.

This is also why closing the day matters more than any auto-lock timer: **the
end of the day is the lock.**

Note what that means rather than glossing it. The moment the session lives on
the device, the device holds a credential again. Cloud login is therefore not a
different security model — it is a **much better enrolment and recovery
mechanism for the same one.** That is the honest case for taking it.

The cost, stated: deprovisioning a fired doctor takes up to thirty days to bite
on a machine that never reconnects. Acceptable, and it should be said out loud
to a hospital rather than discovered by one.

### Who gets what

| Who | Sign-in | Reaches |
|---|---|---|
| Safeer | Email, password, **2FA mandatory** | Heartbeat only. No clinical content, by construction. |
| Hospital operations admin | Email, password, 2FA, from anywhere | Figures, staff, devices, money. No clinical content in any mode, so there is nothing here to lose. |
| Doctor | Email and password, 2FA optional and off by default | His own clinic. Thirty-day offline session on the clinic machine. |
| Compounder | Account created by the clinic, never self-registered | The queue and vitals. Many will not have a working email; requiring one would end in a shared login. |

**A PIN gates moving up, never working.** Anyone at the counter machine can add
a patient to the queue and take a blood pressure without typing anything — the
highest-frequency action in the building, carrying no risk. The PIN appears when
becoming the doctor, when touching a refund, or when entering settings. In a
doctor's own room with one user, it disappears entirely.

The real threat here is not an attacker. It is **one PIN that everybody knows**,
which will happen at any busy hospital unless individual sign-in is genuinely
faster than sharing. That is the whole argument for tapping a name over typing
one.

### Three devices at once

Being signed in on a laptop, a phone and a tablet simultaneously is normal and
is not blocked. What must never happen is **two devices writing the same
consultation**, which produces two prints of one prescription with different
medicines on them.

So: signed in everywhere, **one device holds the patient at a time.**

The room machine is the prescribing device: it holds the open consultation and
it prints. Phone and tablet show the queue, the history, the day's figures — and
**that is all they ever do. They are read-only, permanently.**

An earlier draft offered a takeover: open the patient elsewhere and it closes on
the laptop. Delete that. **A takeover cannot close a session on a device it
cannot reach**, and the unreachable device is the whole point of this product —
the tablet on mobile data that has just dropped, still holding the patient. That
lock holds in exactly the conditions where it was not needed and fails in the
one where it was.

Permanent read-only elsewhere also deletes merge and conflict work from Phase 1,
which is most of what makes Phase 1 expensive.

### Login and logout is attendance, not security

Safeer's framing, and it is better than the one it replaces.

The daily open and close of a session is not a security gate — it is an
**attendance record**, and a hospital owner will pay for it. Did Dr Ahmed arrive
at five. How long was the clinic open. Who was on the counter when that refund
was given.

It also supplies a clean daily boundary: closing the day runs the backup and
freezes the figures, which is tidier than a session that simply drifts.

So the machine does not lock *during* the session — a doctor locked out
mid-consultation in front of a patient goes back to his pen, and it only has to
happen twice. But the session is opened and closed deliberately, once a day, by
a person.

The model is the office check-in board, not a security product. Two things
follow from that, and both are the parts office systems get wrong.

**Attendance belongs to the room machine, not to the account.** If checking in
can be done from a phone, attendance is fiction — a doctor marks himself present
from home and the record is worthless to the hospital that is paying for it. So
presence is recorded by the machine in the room. The phone and the tablet stay
signed in and stay useful; they simply do not count as being at work.

**Everybody forgets to check out.** He closes the door and walks to his car. The
app must not then report a seventy-two hour day. So a session that is never
closed auto-closes overnight and is recorded as *not closed properly* rather
than silently rounded — an honest gap in the record is fine, an invented figure
is not, and a hospital owner who catches one invented figure stops trusting all
of them.

Doing this with a PIN needs no hardware and works from a folder on disk today.
A fingerprint would only stop one person checking in for a colleague; if a
hospital ever asks for that, see question 1 before agreeing.

### What the second reviewer said about attendance, and he is right

**It contradicts question 2.** That section says the server may hold clinic
name, version, last seen and a weekly count — *"not per room, not per day"* —
and the phases cut per-room per-day counters. Attendance is per-person,
per-room, per-day, timestamped, and readable by an owner who is not in the
building. It is strictly more identifying about the doctor than the counters
that were cut. **Ship one or the other, and delete the other paragraph.**

**Load-shedding makes the honest-gap flag meaningless.** The machine dies
mid-session and Chrome closes with no event, so it records "not closed
properly". In Larkana that is the normal case, the owner learns to ignore the
flag within a week, and it achieves nothing. Nothing on screen distinguishes a
power cut from a doctor walking out. Say that, or do not ship the flag.

**"Auto-close overnight" has no defensible hour.** A clinic running six in the
evening to one in the morning, or a Ramzan schedule, gets closed mid-shift and
marked absent for the hours actually worked.

**It makes the shared-login problem worse.** The stated real threat is one PIN
everybody knows. Tying presence to sign-in gives a doctor stuck in traffic a
reason to phone the compounder and say *sign me in* — a financial incentive to
lend a credential, shipped immediately, with the fix deferred.

**Nobody has been told.** This plan is scrupulous about a doctor being told
which sharing mode reads his prescriptions, and silent about telling him his
hours are reported to the owner. That is the more personally sensitive of the
two and carries the identical rumour risk. Apply the same rule.

**And it is a labour-relations product built by a company with no lawyer.**
Selling hour records to hospital owners in Pakistan puts one person inside wage
disputes. Attendance also appears in no phase, which means it will be built out
of sequence, on a weekend, because an owner asked.

**And then Safeer corrected the framing, which resolves most of it.**

He was not asking for a product that reports a doctor's hours to a hospital
owner. He was asking for something much smaller and entirely local: **the system
should know that today is a working day, when it started, and when it closed** —
so the figures have a boundary, the backup has a moment to run, and sync has a
sensible time to go looking for a good connection.

That is the clinic's own day boundary. It is not a report to management, it does
not leave the machine, and every objection above evaporates with it: nothing to
minimise on a server, no consent problem, no wage disputes, no lawyer.

**So it splits in two, and only the first one is being built:**

- **The working day. Build it, in Phase 1.** Open and close, local, the clinic's
  own record, the thing that locks the machine at night.
- **Reporting staff hours to a hospital owner. Not now.** If Indus asks and is
  paying, it is a separate feature with a consent screen and a lawyer, and the
  question-2 minimisation rule has to be reopened before a single hour leaves a
  building.

### What must be blocked at setup

`1234`, the current year, and the clinic's telephone number. Not because anyone
is brute-forcing from the internet — because the compounder will choose one of
those three and then everybody in the corridor knows it.

---

## The key model

The advisor's envelope design is right and the reviewer improved it in four
places. Combined:

**Every record gets its own single-use data key.** Content is encrypted once
under that key and never re-encrypted. The data key is then *wrapped* to one or
more public keys. Policy lives in the wraps, never in the ciphertext — which is
what makes a hospital changing its mind a batch of re-wraps rather than a
re-encryption of everything.

**Rooms hold an asymmetric keypair.** This is not decoration: it means the
compounder at the door and the counter can write *to* the room without being
able to *read* it. Vitals in, refunds in, prescriptions unreadable. A symmetric
key cannot do that.

**No data key may ever exist with exactly one wrap.** Every clinical key is
wrapped to the room and to a recovery key whose private half exists only on
paper. Enforce it in code and refuse to store a record that breaks it. This one
rule is what turns "a room key was lost" from an extinction into an afternoon.

**The data key is never derived from the login password. Not once, not as a
convenience, not "for now".**

This is the rule that cloud accounts make dangerous, and it is the one most
likely to be broken eighteen months from now by somebody being helpful about a
support ticket.

If the key comes from the password, then whoever controls authentication
controls the keys — and that is Safeer. He could issue himself a session for any
clinic and read everything in it. Every promise in this document would become
false without a single line of code changing, silently, and nobody outside would
be able to tell.

So: **the password unlocks the account; a separate key, generated on the
clinic's own machine and never transmitted, unlocks the data.** They must never
touch, and no code path may exist that lets one produce the other. This is worth
a test that fails the build.

**Four corrections from the review:**

1. **Data keys are single-use. Any edit mints a new one.** Re-encrypting a
   corrected prescription under the same key with AES-GCM is a catastrophic
   failure, not a small one: two open tabs, which is exactly the Latif
   arrangement, can leak plaintext and let an attacker forge records. If reuse
   is ever unavoidable, switch to XChaCha20-Poly1305.

2. **Derive the room keypair from the recovery seed** rather than generating it
   independently. The paper sheet is already a universal key, so this costs
   nothing and deletes an entire failure branch: a wiped browser profile is
   recovered by typing twelve words instead of by an admin ceremony.

3. **Never build a blind index on names.** Pakistani given names are so skewed
   that the server can de-anonymise the histogram by rank order with no key at
   all — "Muhammad" alone gives it away. Phone numbers are defensible. Names are
   found by the desk machine searching its own decrypted copy.

4. **The seal needs a signature, not a database rule.** `sealed` is currently
   enforced by row-level security, which the service key bypasses. If a printed
   prescription being unalterable is going to mean anything legally, the doctor's
   device must sign each record and chain it to the previous one.

**Two things nobody had specified.** How a second device in the same clinic gets
the key — QR from the first device, and never a password-wrapped copy on the
server, because the password will be `clinic123`. And that write-without-read
will feel like a broken app to the compounder, who cannot see what he just
typed, cannot fix a typo, and will enter the same blood pressure twice. He needs
a local plaintext cache of his own writes for the day.

---

## Recovery

The advisor proposed a printed sheet, and a restore drill at install. Both
right. The reviewer supplied the number that matters and it is ugly.

**Expect 30 to 50 percent of doctors to be unable to produce a usable recovery
sheet when they need it.** Bitcoin seed phrases are lost above 20 percent by
motivated technical users with money at stake. A doctor in Larkana has no
incentive on day one, a shared drawer, humidity, and an English wordlist he
reads as a second script.

So: print a QR of the seed beside the words, because scanning beats typing. Add
a visible checksum. Print three copies and make him name three locations aloud.
Make it look like a certificate, not a receipt. And **re-drill the restore at
day thirty and every six months**, because a drill at install only proves the
paper existed on the day it was printed.

An earlier draft blocked sync until the drill passed. **Remove that.** By Phase
3 sync is how the reception desk sees the queue, so blocking it is the vendor
switching off part of a hospital's working day over a missed drill — which is
precisely the behaviour "no kill switch" promises against. Nag loudly, report it
to operations, put it on the About screen in red. Never block.

For a hospital the failure is social rather than cryptographic: the person who
knew what the envelope was for leaves in 2027. Label it in Urdu with what breaks
without it, log the verification dates, and split it three ways so that any two
can recover — which is also better politics than one sheet unlocking twenty
doctors' archives, and one theft away from Nuskho being the cause of a
hospital-wide breach.

**But in `none` mode the three holders must not all be administration.** The
second reviewer caught this: operations owns backups, the recovery seed derives
the room keypair, and every clinical key is wrapped to a recovery key —
therefore an operations admin holding two of three envelopes decrypts every
doctor's archive, with no code change and nobody's cooperation. United Medical
Centre would be buying *"management cannot read you"* from a company that had
handed management a two-of-three that reads everything.

So in `none` mode a doctor's recovery share is held by that doctor, or split
among **doctors**, never among administration. The hospital's own share set
covers operations data only.

And the honest version of the pitch is not *"nobody can, ever"* — which the next
section shows is false anyway. It is **"nobody reads your records without you
finding out."**

---

## Phases, and the customers that go with them

The advisor phased the features. The reviewer's correction is that the
**customers** have to be sequenced too, and that cutting appointments while
naming Indus as the target is a contradiction: the separate reception desk *is*
why Indus would buy.

**Phase 0 — the pilot.** A gate, not a phase. Four to six weeks. Ends with a
measured tap-to-paper time, a slip watched being handed over, and either money
or a reason.

**Phase 1 — encrypted sync, one clinic, two devices.** Accounts, the thirty-day
offline session, envelope encryption, the printed sheet, the restore drill. The
end state is not a backup file: it is **the doctor's laptop and his tablet
showing the same patient, and Nuskho unable to read either.** Two devices is the
whole test — one device proves nothing, because one device is what already
works.

This is larger than the "encrypted backup" this phase used to be, and the reason
is question 3. Multi-device was chosen, so sync is not optional, so the key
model has to be right here rather than deferred to a later phase.

**Phase 2 — Latif.** One room, `assistant_does_reception`, closest to the pilot
already run. Room keypairs, write-without-read, phone lookup. No sharing
machinery at all.

**Phase 3 — United Medical Centre.** Multi-room, `none` mode. Doctors kept
separate is a *sold feature*, not a limitation, and belongs in the pitch. The
operations / clinical-reach split ships here, because this is the first customer
where a single all-powerful `admin` would be a lie.

**Phase 4 — Indus.** Appointments, the reception desk, `all` or `referral`
sharing. Built when Indus signs something, not before.

**Cut now:** platform accounts as a self-service product, referrals, `all` mode,
appointments, and per-room per-day counters. Provision the first twenty clinics
by hand — it is faster than building signup, and it is the moat.

---

## Six more, three decided and three open

### Decided

**Patient numbers collide the moment there are two devices, and this is a bug in
shipped code.** Numbering is per-clinic against a local high-water mark, which
was correct while a clinic was one computer. It is not correct now. The
compounder registers a patient at the counter while the doctor's tablet is
offline and registers another; both become `00043`; two different people carry
the same code and the same QR on paper in their hands, and the QR is the key the
clinic searches by.

The fix is not a bigger counter. **The internal identity is a stable random ID
minted on the device; the printed number is a separate, human-facing label that
only one writer may issue.** Either the counter machine owns issuing it, or it is
assigned on sync. Nothing may print until the number is certain, because paper
cannot be recalled. This is required before a second device runs anywhere.

**No kill switch. Ever.** The app must never contact a server to decide whether
it is allowed to run. If Supabase is unpaid, if the company is abandoned, if
Safeer is hit by a bus, every clinic keeps printing forever with no change in
behaviour. This costs nothing to guarantee and it is one of the strongest things
that can be said to a doctor in a town where software vendors genuinely
disappear: **if I vanish, your clinic still works.** Write it into the terms, not
just the code.

**Browser storage eviction, which the reviewer ranked above every attacker.** A
clinic can lose a month of records because Chrome decided it needed the disk.
Local-only had no answer to this. Encrypted sync does — the ciphertext is
elsewhere — which means **sync earns its keep twice, and the second reason is
patient safety rather than convenience.** Independently of sync,
`navigator.storage.persist()` gets called at startup and its refusal is surfaced
to the clinic rather than swallowed.

### Open, and they are Safeer's to answer

**A doctor leaves a hospital. Who owns the records?** Dr A resigns from Indus
after three years. If the key is his, the hospital loses three years of its own
patients' history. If the key is the hospital's, he loses every patient he ever
treated. Both are unacceptable to somebody, it will certainly happen, and there
is no answer here. It is mostly a contract question — but **the key model must be
able to express whatever the contract says, and today it cannot.** Deciding this
late means re-wrapping archives under pressure, in a dispute, with a lawyer
present.

**One doctor, two clinics.** Mornings at his own place, evenings at Indus. One
account, two organisations, different sharing rules, different keys. His tablet
must show both and must never mix them. Not modelled, and common enough in
Larkana to appear inside the first ten customers.

**There is no price, and this is the one still fully open.** Asked directly,
the answer was "I have not thought about it." That is honest and it is fine
today — but the gate ends with *"either money or a stated reason for refusing
it"*, and there is nothing to refuse.

It has to be decided **before the pilot doctor is asked**, not after, because
the first number said out loud becomes the anchor. Per doctor per month is
steady income that must be re-earned; one payment then free fits "no kill
switch" best and sells more easily; free-for-the-pilot is safest but makes the
pilot unable to test the thing it exists to test.

---

## What the code says

The second reviewer read the repository, not just this document. Four things
here are already true in shipped software and contradict what the plan claims
about itself. Each is free to fix today and expensive to fix in front of a
customer.

**The `admin` role is Nuskho, and it reads everything.** `roles.ts` names it
*"Nuskho admin"*, `profile.ts` describes its passphrase as *"held by the
company, not the clinic"*, and its grants include `prescribe`, `history`,
`backup` and `erase`. So the centrepiece of this plan — *"nobody outside the
clinic may see it, and that includes Safeer; 'I cannot' ends the
conversation"* — is false in the code that is deployed right now. The plan says
the capability, once it exists, must be defended by personal courage forever. It
exists. **Re-scope it before the first customer:** Nuskho's role keeps
`identity`, `review`, `paper` and `version`; `prescribe`, `history`, `backup`
and `erase` move to the clinic.

**The About screen promises something Phase 1 must break.** It tells the doctor,
on his own screen: *"There is no account, no server and no upload. Not now, and
there is no plan for one."* This plan is the plan for one, and the pilot doctor
will read that sentence during the gate. Change it **before** the pilot, not
after: *"Nothing about a patient leaves this computer. If that ever changes,
this screen will say so first, and you will have to agree."* The plan spends a
paragraph on how a doctor discovering he was read without being told is the
rumour that ends the company — and then walks into the same failure mode with
its own copy.

**`connect-src 'none'`** ships in the headers, and the deploy notes brag that it
enforces the promise *"even against a future version of this code that gets it
wrong."* Shipping sync means deleting that line. It is a visible, greppable,
screenshot-able reversal, and it should be planned for rather than discovered.

**There are no tests and no CI.** The plan's strongest safety mechanism — *"no
code path may exist that lets one produce the other, and this is worth a test
that fails the build"* — has nothing to attach to.

---

## The LAN, which this plan never considered

The strongest finding of the second review, and it deserves to be answered
rather than absorbed.

Every driver given for sync is a **same-building** problem: the compounder
registering a patient at the counter, the tablet in the consulting room, the
phone in his hand while he consults on the laptop. Not one is wide-area. The
plan jumped from *one machine* to *encrypted cloud sync* as though nothing lay
between them.

Question 1 has already concluded the honest distribution answer is a signed
desktop application. **A desktop application can bind a LAN port.** The tablet
and the phone open the room machine's address on the clinic's own wifi. That
single decision delivers, in weeks:

- two devices showing the same patient — **which is this plan's own stated
  acceptance test for Phase 1**
- one writer and N readers, enforced by topology rather than by a distributed
  lock that cannot work offline
- **browser storage eviction eliminated**, because the records live in the
  application's own file rather than in IndexedDB — the harm this document
  ranks second, solved as a side effect
- real backup to a second drive or a USB stick, which the code currently laments
  a browser cannot do
- and none of the hard work: no key management against a hostile host, no
  recovery-sheet catastrophe, no re-wrap engine, no HMAC'd patient refs, no
  ciphertext padding, no conflict resolution

What the LAN does not give is the doctor seeing history on his phone **at
home**. That is one feature, requested by nobody, validated by no pilot — and it
is currently purchasing the entire cryptographic programme.

**Answered: he does want it outside the clinic.** So the LAN is not the
alternative to sync — **it is half of the architecture, and it takes the harder
half.**

- **Inside the clinic: LAN.** The room machine holds the records and serves the
  tablet, the phone and the counter directly. All writing happens here. No
  cloud, no conflicts, no locks — one writer by topology.
- **Outside the clinic: one-way encrypted push, read-only.** His own records to
  his own devices, append-only. Single writer, no merges, no conflict
  resolution, no policy re-wraps.

Between them these deliver everything asked for, and the expensive part —
two-way multi-writer sync — is not built at all. That is the single largest
saving in this document, and it came from the reviewer noticing that every
stated driver was a same-building problem.

The desktop application decided in question 1 is what makes the LAN half
possible. A browser page cannot serve a port.

---

## A budget, because the gate only guards the front door

The plan protects against starting Phase 1 too early and does nothing about
never finishing it. Phase 1 as scoped — cloud auth, key generation, envelope
wrap and unwrap, QR enrolment, a sync protocol, exclusive-write semantics,
re-wrap on policy change, per-record signing and chaining, recovery sheet UX,
restore drills, padding, HMAC'd refs, migrating existing local data, plus the
deployment and service-worker change — is not six months for one part-time
person with no team and no tests. At ten hours a week it is comfortably
eighteen months.

**That is the most likely way this project dies:** a year inside sync, the pilot
clinic gets no improvement, the doctor drifts back to his pen, and there is
nothing shipped to sell.

**Phase 1 gets sixteen weeks of wall clock. If two devices are not showing the
same patient by week sixteen, sync is cut and the product ships on LAN and USB
backup.** Written down now, while it is cheap to agree with.

---

## The argument against all of it

Two, from the reviewer, and they compound. They belong in this document because
they are true.

**Encryption is not this product's risk. Correctness is.** What actually hurts a
patient is a pictogram meaning "three times a day" read as "three tablets at
once", or two similar brand names colliding on a slip handed to a woman who
cannot read it back. This plan gives six to nine months to making data
unreadable to a party that has never harmed anyone, and one evening to whether
the pictograms are understood. Ranked by real harm: a misread pictogram, then
browser storage eviction losing a month of records, then a curious employee at
Supabase — in that order, and it is not close.

**And end-to-end encryption destroys the support model of a one-person
company.** At fifty clinics, every bug report becomes "something is wrong" with
no reproducible state, permanently, because you cannot look. For a product sold
on trust and hand-holding, the ability to debug remotely may be the most
valuable thing you own in year two, and this plan gives it away before the first
customer.

Neither argument means do not do it. Both mean know what is being traded.
