I've read the plan in full and the shipped code (`roles.ts`, `profile.ts`, `db.ts`, `safety.ts`, `code.ts`, `backup.ts`, `bus.ts`, `print/*`, `Welcome/Setup/Intake/Lock/App`). Here is the design.

---

# Nuskho: opening a clinic

Design document v1. Written against `nuskho-plan-v4.md` and the code as shipped on 4 August 2026.

**The one invariant, restated because everything below bends around it:** the doctor taps PRINT and paper comes out. Nothing in this document may sit between those two events. Not a network call, not a key server, not a lease check, not a sync. Everything the print path needs is already on the machine before the patient sits down.

**The second invariant, which is new here:** *print first, seal after.* The visit is written to local storage and printed. The encryption wraps, the signature, the chain, the LAN push and the outside-clinic push all happen after the paper is in the patient's hand. If any of them fail, the paper is still correct and the record is still written. This is the mechanical reason the crypto can never delay a prescription.

---

## Part 0 — The three things a clinic is made of

Everything in this document is one of these three, and separating them is most of the design.

| | What it is | Where it lives | Who makes it |
|---|---|---|---|
| **The licence** | a row saying "this clinic exists, it is Dr Ahmed's, it is paid until March" | Nuskho's server | Safeer |
| **The keyring** | the clinic's actual encryption identity — a 12-word seed and everything derived from it | the doctor's own machine, and paper | the doctor's machine, on first run |
| **The host** | the one device that holds the clinic's records and serves the others | the room | named at setup |

The licence never touches the keyring. The keyring is never transmitted. The host is never the server.

This is what makes "Nuskho cannot read a prescription" a fact about wiring rather than a promise about behaviour: **there is no code path by which a keyring reaches Nuskho, because the keyring is minted after the last screen Safeer ever touches.**

---

# 1. How a clinic gets opened

## 1.1 The shape of it in one paragraph

Safeer fills in a form on his own machine and gets back a small file. He sends it on WhatsApp. The doctor taps it, and his app opens already knowing his name, his degrees, his paper size and his specialty. He taps one button, which mints the clinic's key on his own machine. He prints a recovery sheet. He sets a PIN. He prints a test slip. He is working. Safeer never saw a key and never will. **None of it required the internet except WhatsApp, and there is a path that does not require even that.**

## 1.2 What Safeer does

### Screen S1 — "Open a clinic"

This lives inside the same app, behind the Nuskho role (`roles.ts` already has it, already de-scoped to `paper, medicines, lock, identity, review`). Safeer runs the app on his own laptop in Larkana.

The form is **the fields that already exist** — `IdentityFields`, `PaperFields`, `FeeFields` from `src/screens/setup/fields.tsx` — plus four new ones:

```
CLINIC
  Clinic name (English)      [ Ahmed Clinic          ]
  Clinic name (Sindhi)       [ احمد ڪلينڪ            ]
  Town                       [ Larkana ▾ ]

THE DOCTOR                          (existing IdentityFields)
  Name En / Sd, Degrees En / Sd, PMC reg (optional),
  Address, Phone (the compounder's), Timing, Logo

PAPER                               (existing PaperFields + TokenFields)
  A5 / A4 · plain or his letterhead · top/bottom mm
  Thermal token printer: none / 58mm / 80mm

WHAT HE CHARGES                     (existing FeeFields)
  Rs [ 500 ]

WHAT KIND OF DOCTOR                 (existing SPECIALTIES chips)
  ( ) GP  ( ) Skin  ( ) Eye  ( ) Child  …

WHO ELSE'S PRESCRIPTIONS HIS ROOM MAY READ
  (•) Only his own                              ← default, always
  ( ) Only patients another doctor sends him
  ( ) Every doctor in this building

[ Open the clinic ]
```

That last block is **the only configuration decision in the whole product**. See Part 2. It defaults to "only his own" and Safeer should leave it alone unless a hospital has asked otherwise in writing.

### Screen S2 — "Send it to him"

```
  Ahmed Clinic, Larkana — opened

  ┌──────────────────────────────────────────┐
  │  dr-ahmed-larkana.nuskho      (4 KB)     │
  │  [ Send on WhatsApp ]  [ Save to a stick ]│
  └──────────────────────────────────────────┘

  If he cannot receive a file, read him this
  over the phone instead:

          K7M – 4QP – 9X2

  Good until 18 August. It can be used once.

  He will need nothing else. He does not need
  internet to use either of these.
```

Two artefacts, same contents, different transport:

**The opening file** (`.nuskho`). It is the existing `SetupFile` from `src/backup.ts` with `kind: 'opening'` and three additions: a clinic id, the licence ticket, and **a signature over the whole file made by Nuskho's offline release key** — the same key that will sign application updates. The doctor's app verifies that signature before showing him anything. It carries no patients and no key material of any kind, so WhatsApp holding a copy of it forever is harmless.

**The opening code.** Nine characters, three groups of three, from Crockford base-32 with `I L O U` removed: `0123456789ABCDEFGHJKMNPQRSTVWXYZ`. Eight random characters and one check character. It is case-insensitive and has no ambiguous glyphs, because it will be read out over a bad PTCL line by someone who reads Latin script as a second alphabet. Redeeming it needs internet **once**, on the doctor's side, and it downloads the same file.

The file is the primary path. The code is the fallback. If a doctor has neither, there is a third path in §1.3 and it costs him ninety seconds of typing.

### Screen S3 — "Clinics" (Safeer's console)

One row per clinic. This is the only screen Safeer has that touches a live clinic, and it is deliberately thin:

```
  Ahmed Clinic, Larkana      v1.2.0   seen 2 hrs ago   ✓ key made   ✓ sheet printed   2 devices
  Latif Clinic, Ratodero     v1.1.4   seen 6 days ago  ✓ key made   ✗ NO SHEET        1 device
  United Medical Centre      v1.2.0   seen today       ✓ key made   ✓ sheet printed   9 devices
```

Clinic name, version, last seen, whether a key was made, whether a recovery sheet was confirmed, how many devices. Nothing per-day, nothing per-room, nothing per-patient, no counts of slips. This is narrower than the plan's question 2 allows and that is on purpose: the plan already caught itself contradicting its own minimisation rule over attendance, and the cheapest way not to have that argument twice is not to collect the numbers.

## 1.3 What the doctor does — his first run

### Screen D1 — the door (replaces the current `Welcome` intro)

```
        نسخو   Nuskho
        The prescription, printed.

  [ I have a file from Nuskho ]        ← taps the WhatsApp file
  [ I have a code from Nuskho ]        ← types K7M-4QP-9X2
  [ Set up the clinic myself ]         ← the existing wizard, unchanged
  [ Just show me how it works ]        ← DEMO. Refuses to save a real patient.
```

The third button matters. **A clinic must be able to come into existence with no file, no code, no internet and no Safeer.** If the file was lost, if the code expired, if he is a doctor who found the app himself — he types his own name and works. The licence is attached later, or never. This is what "no kill switch" means in practice at the moment of creation, not just at runtime.

The fourth button is the demo the plan demands: a red banner across the top, a hard block on `db.patients.add`, and the word DEMO printed diagonally across every slip.

### Screen D2 — "Is this you?"

Nothing is typed here. Everything is already filled in from the file. He is confirming, not entering.

```
  Nuskho has set this up for you.

    Dr Muhammad Ahmed
    MBBS, FCPS
    ڊاڪٽر محمد احمد
    Ahmed Clinic, Larkana
    Prints on: A5, your own letterhead (32mm top)
    Fee: Rs 500
    Token printer: 58mm thermal

  [ Yes, this is me ]      [ Something is wrong ]
```

"Something is wrong" opens the existing wizard with everything pre-filled. It does not phone Safeer.

### Screen D3 — "Make this clinic's key" — *the important screen*

```
  This computer is about to make a key that
  belongs to you.

  • Everything about your patients is locked
    with it.
  • It is made here, on this machine. It never
    goes on the internet.
  • Nuskho does not have it and cannot make
    another one. If you lose it, we cannot help
    you — that is the point of it.

  The next screen prints the paper that gets it
  back. Do not skip that screen.

              [ Make the key ]
```

One button. Takes about a second. It generates 128 bits of entropy from the OS CSPRNG and from that derives, by HKDF:

- the **clinic root** signing key (Ed25519) — signs sealed records and chains them
- the **room key** (X25519), derived at index 0 — the room's private half. A second room in a hospital is index 1, and so on. Deriving rooms from the seed rather than generating them independently is the plan's correction #2, and it deletes a whole failure branch.
- the **recovery key** (X25519) — the second wrap on every record, whose private half exists on paper and nowhere else
- the **break-glass key** (X25519) — see §2.5
- the **directory key** — for the counter's patient index

Nothing here needs a network, and nothing here can fail because of one.

### Screen D4 — the recovery sheet — *the screen 30–50% of doctors will defeat*

The plan says to expect 30–50% loss. This screen is designed on the assumption that it is right.

```
  Print this. Three times.

  ┌───────────────────────────────────────┐
  │  1 anchor    5 velvet    9  ridge     │
  │  2 copper    6 marble   10  saddle    │
  │  3 lantern   7 orchard  11  timber    │
  │  4 hollow    8 pillar   12  wander    │
  │                                       │
  │  Check: 7K2M          [QR: the seed]  │
  └───────────────────────────────────────┘

  [ Print 3 copies ]     [ Also save it to a USB stick ]

  Say out loud where the three copies will go.
  1. ____________  2. ____________  3. ____________

  Now confirm you have it:
    Word 7  [ orchard ]     Word 11  [ timber ]

                [ Done ]  ← greyed until both are right
```

Decisions, and why:

- **The QR is the real recovery path; the words are the backup to the backup.** Nobody in Larkana is going to type twelve English words correctly under pressure. The QR carries `NUSKHO-SEED:v1:<seed+checksum, base64url>` and restores in one scan.
- **"Also save it to a USB stick" is new and it is the highest-value line on this screen.** The desktop application can write a file; a browser could not, which is why the plan never had this. It writes `clinic-key-ahmed.nuskho.enc`, the seed encrypted under a passphrase the doctor types, onto whatever removable drive he picks. A doctor who cannot keep paper for a year can keep a pen drive in a drawer. Two independent 50%-failure mechanisms give a much better joint number than one.
- **Setup does not finish until two words are typed back.** This is a gate, and it is legitimate, because at this moment nobody is waiting outside. It is the only gate in the entire product.
- It looks like a certificate. Border, seal, the doctor's name printed on it, and the sentence *"Without this paper, this clinic's records cannot be opened by anyone, including Nuskho"* in Sindhi and English — so that whoever finds it in a drawer in 2029 knows what it is.
- **Re-drill at day 30 and every six months.** Loud nag, red line on the About screen, reported to the Clinics console. **Never a block.** Blocking sync over a missed drill is the vendor switching off part of a hospital's working day, which is precisely what "no kill switch" promises against.

### Screen D5 — "Lock this computer"

The existing `PinTab` UI, with one change: the PIN box now **rejects** `1234`, `0000`, `1111`, the current year, the previous year, and any run of digits that appears in the clinic's own telephone number. Not because of brute force, but because the compounder will pick one of those and then the whole corridor knows it.

### Screen D6 — "Put ink on paper"

Unchanged from the shipped wizard. Setup is not finished until something has printed.

### Screen D7 — the front door

`Lock.tsx` as it stands. He picks Doctor, types his PIN, and the evening starts.

**Elapsed, on a laptop, with a doctor who is paying attention: under six minutes, of which three are the printer.**

## 1.4 How the compounder joins

Two things are happening and they must not be confused:

- **"May this phone hold this clinic's queue?"** — asked once, by two people standing next to each other. This is pairing.
- **"Who is at this phone right now?"** — asked at the start of each day, in one tap. This is `Lock.tsx`, already built.

### The decision that saves the most work: the compounder has no account

The plan's sign-in table gives the compounder an account "created by the clinic, never self-registered". **I am cutting that.** The compounder is a *name in a list on the clinic's own devices*, exactly as `roles.ts` already models him — a hat picked at the door, with an optional PIN. No email, no server row, no password reset, no deprovisioning flow, no user management screens.

This is a deliberate deviation from the plan and the reason is the budget. Compounder accounts are perhaps three weeks of work that buys nothing the clinic can feel. Removing a compounder is deleting a name and revoking a device, both local, both instant, both offline. When a hospital with forty staff turns up and asks for central staff management, that is a real feature request with money attached and it can be built then.

### The pairing ceremony — no network of any kind

The two devices are in the same room. **There is no remote pairing, ever.** A clinic that cannot get two devices into one room does not get a second device.

**Step 1 — on the host** (the doctor's machine). Setup → *People & devices* → **Add a device**.

```
  What is this device for?

  [ The counter — registering patients, money, tokens ]
  [ My own phone or tablet — reading only            ]

  ⚠ It must be here, in this room, with you now.
```

**Step 2 — the host shows a QR, full screen.**

```
  ┌─────────────────────┐
  │                     │
  │   ███ ▄▄  ██ ▀ ███  │   Hold the phone up to
  │   █ █ ██▀▄ ▀█ ▄  █  │   this screen.
  │   ███ ▄ ▀██▀ ▄████  │
  │       …             │   Do not take a photograph
  │                     │   of it and send it to
  └─────────────────────┘   anybody.

  This square stops working in 3 minutes.     2:41
```

The QR carries `NUSKHO-PAIR:v1:` and about 350 bytes: clinic id, clinic name, doctor name, the role being offered, the host's self-signed TLS certificate fingerprint, its LAN address hints, an ephemeral X25519 public key, a nonce, and an expiry. **It carries no key material.** At QR version 13, level M, displayed at 60mm on a laptop screen, a five-year-old Android phone reads it in under a second.

**Step 3 — on the phone.** Install → **Join a clinic** → the camera opens immediately. It scans.

```
  Ahmed Clinic
  Dr Muhammad Ahmed, Larkana

  This phone would become THE COUNTER.

  It will be able to:
    ✓ register patients and find old ones
    ✓ take the fee and print the token
    ✓ take blood pressure, weight, sugar

  It will never be able to:
    ✗ open a prescription
    ✗ see what anyone was given before
    ✗ export anything

  Now read the six numbers on the doctor's
  screen and type them here:

              [ _ _ _ _ _ _ ]
```

**Step 4 — the six digits appear on the host, *and not before now*.**

This is the whole security of the ceremony. The six digits are not in the QR and are not on screen while the QR is. They are a **short authentication string** computed from the completed key exchange — a hash over both devices' public keys, truncated to six digits. They cannot be derived from the QR alone, they are different for every attempt, and they can only be produced by the device that actually did the exchange.

So: a photographed QR sent on WhatsApp is worthless. Somebody who scans a leaked photo gets a handshake whose six digits do not match the ones on the doctor's screen, and the doctor sees a device he did not expect asking to join.

```
  A phone is asking to join as THE COUNTER.

  Read these six numbers to whoever is holding it:

                4 1 8 0 3 7

  If the numbers on his screen are not these,
  say NO — somebody else is trying to join.

  Whose phone is it?  [ Ghulam Rasool          ]

        [ Yes, let it in ]     [ No ]
```

**Step 5 — what actually crosses.** Once both sides agree, the host encrypts a payload to the phone's public key and displays it as a *second* QR (or, if the LAN is already up, pushes it over the LAN — same payload either way). The phone receives:

- its own device identity, signed by the clinic root
- the **room's public key only** — so it can write vitals and fees *to* the room without being able to read what is in it. This is the asymmetric room keypair earning its keep exactly as the plan says.
- the **directory key** — for the local patient index (§3.4)
- a **lease** of patient numbers and today's tokens (§3.5)
- the host's certificate fingerprint and LAN hints

**No network was used at any point.** Two QRs and six spoken digits.

**If the camera will not work** — cracked lens, a phone whose camera the compounder has broken, bad light — there is a typed fallback: the host shows a 20-character code in five groups, the phone offers "type it instead". It is horrible and it is used twice a year and it must exist.

**Step 6 — the phone finishes.**

```
  You are the counter at Ahmed Clinic.

  Set a PIN?  (optional — leave blank and it
  opens with one tap)
       [ _ _ _ _ ]

  ⚠ This phone must be allowed to keep running
    in the background or it will stop talking
    to the doctor's computer.
       [ Allow it ]        ← OEM battery exemption
```

That last prompt is not decoration. See §4.6.

## 1.5 How a second device joins

The identical ceremony, one different button in Step 1. What differs is the grant.

**The doctor's own phone or tablet is a permanently read-only mirror.** It shows the queue, patient history and the day's figures. It cannot prescribe and it cannot print a prescription. This is the plan's own position and it is right: a takeover lock cannot close a session on a device it cannot reach, and the unreachable device is the entire point of this product.

The mirror gets, at pairing: its own device identity, and its device public key registered on the host. From that moment, **every record the host seals is wrapped to that device as well**.

**The consequence, stated plainly because it will surprise someone:** a device paired in November cannot read records sealed in September. All wraps are decided at seal time; there is **no re-wrap engine in v1**, because a re-wrap engine is one of the most expensive things in the plan's Phase 1. The escape hatch is a button on the host — *"Bring my old patients onto this tablet"* — which is a batch job with a progress bar that the doctor runs once, deliberately, while nobody is waiting. A batch job is an afternoon. An engine is two months.

## 1.6 No internet, at each step

| Step | Needs internet? |
|---|---|
| Safeer builds the clinic and the file | Only to register the licence row. The file is produced offline. |
| The file reaches the doctor | WhatsApp, or a pen drive, or the typed code, or none of them (D1 button 3). |
| The doctor accepts the file | **No.** Signature verified against a key shipped in the app. |
| The key is minted | **No.** Never. |
| The recovery sheet | **No.** A printer. |
| Pairing the compounder's phone | **No.** Two QRs and six digits. |
| Pairing a mirror | **No.** |
| The whole working day | **No.** |
| The licence being registered | Whenever. It never blocks anything. |
| The outside-clinic push | Yes, obviously, and its failure is silent. |

**The only step that needs the internet is the one that does not matter.**

A note on the plan's thirty-day cloud session: **it does not apply inside the clinic.** Inside the clinic the day-open PIN is the whole of authentication and there is no account at all. Cloud accounts exist for exactly two things — Safeer's licence console, and the doctor's outside-clinic mirror. A doctor who never leaves his clinic never makes an account and never notices one exists. This is a simplification of the plan and I think it is a straight improvement: it means the offline path is not a fallback that has to be tested, it is the only path.

## 1.7 New phone, lost phone, dead laptop

**He gets a new phone (mirror).** Forty seconds. Setup → People & devices → Add a device → two QRs → six digits → done. Then optionally the "bring my old patients over" batch. **Because mirrors are read-only, replacing one is a non-event.** This is the largest practical dividend of the read-only decision and it is worth saying out loud to a doctor.

**He loses a phone.** Setup → People & devices → the row → **This one is lost**.

```
  Ghulam Rasool's phone — the counter
  Last seen: today, 6:40pm

  [ This one is lost or stolen ]

  What this does:
    ✓ it stops getting anything new from here,
      from this moment
    ✓ its number lease is cancelled, so no
      number it holds can ever be printed again

  What this cannot do — and nobody can:
    ✗ reach that phone and erase it

  What is on it: the names, numbers and phone
  numbers of your patients. Not a single
  prescription, not one diagnosis. It is locked
  with his PIN. If he had no PIN, whoever has
  the phone can read that list.
```

I will not design a remote wipe, because a remote wipe that requires the lost device to be online is a lie in a town with load-shedding, and a doctor who is told he has one will stop worrying about the thing he should worry about. The honest statement is above and it is also the strongest argument in the product for the counter PIN being non-optional in a clinic with staff.

**No re-keying.** The clinic does not rotate its seed because a counter phone was lost, because the counter phone never held anything that could open a prescription. Rotating means re-wrapping the archive; the whole point of the room-public-key design is that this is not necessary.

**The host laptop dies.** This is the real disaster and it is the one the recovery sheet exists for.

```
  Bring a clinic back onto this computer

  You will need BOTH:
    1. the backup file   (the pen drive, or the
       second drive in the clinic)
    2. the recovery sheet — the QR on it, or
       the twelve words

  [ Choose the backup file ]
  [ Scan the sheet ]  [ Type the twelve words ]
```

Then: the seed re-derives the room key, the records decrypt, the app checks the signature chain and reports any gap, the patient-number high-water mark jumps clear of everything restored (the existing `bumpHighWaterPastRestore` in `safety.ts`, still correct), all leases are burned, and every paired device must be **re-paired** — because the new machine has a new TLS certificate and the phones must not trust a machine on the strength of a name.

Re-pairing two devices is four minutes. It is the correct cost.

---

# 2. One model, four shapes

## 2.1 The model

Three nouns and nothing else:

- A **clinic** is one doctor's practice. It has one keyring, one host, and a number space.
- A **room** is where prescribing happens. It has a keypair. A clinic usually has one. A hospital has one per consulting room.
- A **device** is a paired machine with a grant: *host*, *counter*, or *mirror*.

And people are **hats picked at a door**, exactly as `roles.ts` already has them.

## 2.2 The single configuration decision

> **Whose prescriptions may this doctor's room read, besides his own?**
>
> `reads: 'mine' | 'referred' | 'building'` — **default `mine`.**

That is the whole of it. It is set once, in the opening file or in Setup, and it is displayed permanently in plain words on the doctor's own screen — not buried in settings — because the day a doctor discovers his owner has been reading and nobody told him is the rumour that ends the company.

It works mechanically because **it is a decision about how many public keys each data key gets wrapped to, taken at the moment of sealing:**

| `reads` | Wraps applied at seal |
|---|---|
| `mine` | this room + recovery + break-glass + the doctor's mirrors |
| `referred` | the same, plus the receiving room's key, added at the moment a referral is made |
| `building` | the same, plus the building's shared room key |

And the plan's load-bearing rule — **changing the mode must never open the past** — falls out free. Old records were sealed with the old wrap set. Flipping the switch cannot reach into them.

## 2.3 Everything else is not configuration

Here is the part that matters, and it is what stops this becoming four products:

| Shape | Compounder | Ops admin | Rooms | `reads` |
|---|---|---|---|---|
| SOLO | no counter device paired | nobody given the hat | 1 | `mine` |
| PRIVATE CLINIC | a counter device is paired | nobody given the hat | 1 | `mine` |
| HOSPITAL, SHARING | a counter device is paired | somebody given the hat | N | `building` |
| HOSPITAL, NOT SHARING | a counter device is paired | somebody given the hat | N | `mine` |

Three of the four columns are not settings. **They are facts about whether a device was paired or a name was written down.** There is no "clinic type" field, no mode picker, no plan tier, and no screen anywhere that asks "what kind of clinic is this?". A clinic becomes a private clinic the moment somebody pairs a phone, and it does so without anyone deciding anything.

Exactly one column is a genuine setting, and its default is the most private value.

## 2.4 What a clinic is before anyone configures anything

**SOLO.** One device, which is host and room and counter at once. One person. No PIN. No ops admin. `reads: 'mine'`. No LAN. No accounts. No internet.

This is the shipped app today, and that is the test of whether the model is right: **the pilot clinic running tonight is already a valid instance of this design and does not have to change to become one.**

## 2.5 The roles, corrected

`roles.ts` today has `counter | doctor | admin`, where `admin` is Nuskho. The plan requires splitting the hospital administrator into operations and clinical reach. Proposed set:

```ts
export type Role = 'counter' | 'doctor' | 'office' | 'nuskho'
```

- **counter** — unchanged: `queue`, `money`.
- **doctor** — unchanged, plus `devices` (he owns pairing).
- **office** *(new)* — the hospital's operations person, who in practice is the IT man. `figures`, `paper`, `devices`, `staff`, `backup-run`, `version`. **Never `queue`, never `prescribe`, never `history`, never `backup`, never `erase`, in any mode, with no override.**
- **nuskho** — the current `admin`, renamed. `identity`, `review`, `paper`, `version`. Already correctly de-scoped in the shipped code; do not touch it.

Two things this forces, and both are load-bearing:

**`backup` must split into two permissions.** Today `backup` means "export a readable copy of every prescription in the building". Operations must be able to *run* a backup and *carry the file*, and must never be able to open it. So: `backup-run` produces a sealed file — ciphertext, openable only with the recovery sheet — and `backup-open` is the doctor's alone. Without this split, the plan's own catastrophe applies: the ops admin who holds the backups and two of three recovery envelopes decrypts every doctor's archive, and United Medical Centre has been sold the exact opposite of what it bought.

**Recovery shares in a `none`-mode hospital are held by doctors, never by administration.** The hospital's own share set covers operations data only.

**Break-glass.** In `none` mode, an unconscious patient at 2am whose record is in Dr Ahmed's room, with Dr Ahmed's phone off, is a patient-safety hole the plan was selling as a feature. Every data key gets a fourth wrap to a break-glass key, split among **doctors**, two-of-three. Cost: 48 bytes per record. Using it is loud — logged locally, unerasable, and shown to the owning doctor in plain words the next time he opens the app, before anything else on the screen. The honest pitch is not "nobody can, ever". It is **"nobody reads your records without you finding out."**

**In SOLO, `office` is a hat the doctor wears three times a year**, behind his own PIN. There is no third person and none should be invented.

## 2.6 One doctor, two clinics

Listed as open in the plan; the model already answers it. Two keyrings on one device, picked at the door — the front door screen lists "Ahmed Clinic" and "Indus, Room 4" as two entries. Separate hosts, separate number spaces, separate `reads` settings, no shared storage, and a hard rule that a visit opened under one keyring cannot be saved under the other. What is *not* answered is who owns the records when he leaves Indus, and that remains a contract question the key model must eventually be able to express.

---

# 3. The device matrix

This is where the interesting problems are, and where the plan has gaps.

## 3.1 Which device holds the data

**Exactly one device is the host, and it is the machine that prints the prescription.** Named at setup, changed only by an explicit ceremony that retires the old one.

| Device | Holds |
|---|---|
| **Host** (doctor's laptop/PC) | everything: patients, visits, drugs, the room private key, the archive |
| **Counter** (compounder's phone) | today's queue; its own writes for the day, in the clear, on the device; the patient *directory*; the room **public** key; a number lease |
| **Mirror** (doctor's phone/tablet) | a read-only copy of records wrapped to it, and nothing writable |

## 3.2 Can a phone be the LAN server? No, and this is decided

**The compounder's phone is never the host and never binds a port.** It is a client, permanently.

Why, concretely:

- Android OEM ROMs sold in Pakistan — Infinix, Tecno, Vivo, Xiaomi, Realme — kill background services aggressively and by default. A foreground service with a persistent notification survives sometimes. "Sometimes" is not a server.
- Wifi power-save drops the radio when the screen is off. A server that answers only when someone is looking at it is not a server.
- iOS will not do it at all: backgrounded apps are suspended, and `NSLocalNetworkUsageDescription` gates even client-side discovery.
- The doctor would then be depending on the compounder's personal phone, its battery, and whether he took it to lunch.

**So: the counter phone works fully offline against its own storage, and pushes to the host at every contact.** Not at day-end — at every contact, so the exposure window is minutes rather than a day.

## 3.3 What happens when the phone is the only device awake

This is the normal evening, not the edge case: the compounder opens at 5pm, the doctor arrives at 6.

With the host asleep, the counter can do **all** of it:

- **Find a returning patient** — from its local directory (§3.4)
- **Register a new patient** — a real, final patient number from its lease (§3.5)
- **Take the money** — locally recorded
- **Print the token** — over Bluetooth (§3.6)
- **Take vitals** — encrypted to the room's public key, unreadable to the phone thereafter, exactly as `Vitals.tsx` already collects them

When the doctor's laptop wakes, the phone finds it and pushes. **The counter is authoritative for the queue and the fee; the host does not merge, it takes.** This mirrors the field-ownership split the platform doc already describes (the room owns `lines/diagnosis/vitals/tests/advice/printedAt/status`, the counter owns `fee`) and it means there is no merge algorithm to get wrong.

**The one thing the counter cannot do is print a prescription.** That is correct and permanent.

## 3.4 The patient directory on the counter phone

To resolve `48213 → Ghulam Rasool` with the host asleep, the counter must hold an index. It holds: patient number, name, phone, city, age, date of last visit. **No diagnosis, no medicine, no vitals history, no fee history.** That is precisely the counter's existing permission surface in `roles.ts` — the counter already sees names and numbers today.

5,000 patients at ~80 bytes is about 400 KB. Encrypted at rest under a directory key, held in the Android Keystore, released at day-open.

**What I am not sure about:** whether doctors will accept that the compounder's personal phone carries a list of every patient's name and phone number. It is defensible — he sees those names anyway, all day, at the counter — but "he sees them" and "they are in his pocket at home" feel different to a doctor, and I have not tested that reaction. The alternative is that a returning patient gets registered as a duplicate whenever the laptop is off, which is a clinical cost, not just an annoyance. **Ask a doctor before building it.**

## 3.5 Numbers, which is a shipped bug and gets worse

The plan is right that this breaks the day a second device runs. `nextPatientNum()` in `db.ts` is `max(table, localStorage high-water) + 1`, and two devices have two localStorages.

**The fix is leases, and they are invisible.**

- The host owns the clinic's number space.
- Any device that issues numbers holds a **lease**: a disjoint contiguous block, e.g. counter gets 4001–4200, host keeps 4201 upward.
- A device prints only from its own lease. **Two devices can never mint the same number, offline, indefinitely, without communicating** — which is the property that matters, because they routinely will not communicate.
- Leases refresh on every contact and at day-open. A 200-number lease at 140 patients a day is over a week of total isolation.
- If a lease is ever exhausted with the host unreachable, the counter **stops issuing numbers** and says so. It does not invent one. Nothing prints until the number is certain, because paper cannot be recalled.
- Leases live **outside the restorable set**, alongside the existing high-water mark in `safety.ts`, for exactly the reason that file already gives.
- A restore always burns the current lease and takes a fresh one above everything seen.

**Tokens are different and louder.** A token is shouted across a full waiting room; a collision means two people stand up. So: **the counter device owns today's tokens.** The host does not issue one while a counter has been seen today. If the doctor needs to add someone himself and the counter is unreachable, the host issues from a high block and says so:

```
  The counter phone is not reachable.
  This number starts at 51 so it cannot clash
  with anything Ghulam has given out.
```

The existing `tokenHighWater` day-keyed guard in `safety.ts` stays and becomes the per-device floor.

## 3.6 Bluetooth thermal printing — **the biggest thing the plan has not accounted for**

`src/print/token.ts` carries this comment:

> *"As an ordinary print job at a narrow page size, not as ESC/POS bytes. Every thermal printer worth buying installs as a Windows printer and accepts one."*

**That is true on Windows and false on Android.** Android has no print spooler for generic Bluetooth thermal printers. Its print framework requires a vendor print-service plugin, and the ₨4,000 Chinese 58mm printers sold in Larkana ship with their own app, not a print service. So the compounder's phone must speak **ESC/POS over Bluetooth SPP/RFCOMM** directly.

And there is a second finding inside that one which is worse:

> **The Sindhi on the token cannot be printed as ESC/POS text. At all.**

`renderToken` prints `نمبر`, `في`, `مفت`, `ادا ڪرڻي آهي`, and a full Sindhi footer line. No ESC/POS codepage carries Arabic-script Sindhi, and none of them do contextual shaping — you would get boxes, or reversed disconnected letters, which is worse than boxes because it looks like it worked.

**So the token must be rasterised.** The phone renders the existing `renderToken` HTML into an offscreen canvas at the printer's dot pitch — 384 dots for 58mm, 576 for 80mm — thresholds it to 1-bit, and ships it with `GS v 0`. The existing HTML and `TOKEN_CSS` survive unchanged, which is the saving grace; only the transport is new.

What this actually costs, itemised because it will otherwise be discovered in week 12:

- Bluetooth runtime permissions (Android 12+ needs `BLUETOOTH_CONNECT`; below that, discovery needs **location** permission, which looks alarming and needs an explanation screen)
- OS-level pairing, plus a printer-picker screen and a "test print" button
- ESC/POS dialect variation between clones — some accept `GS v 0`, some only `ESC *`, some have different line-feed behaviour after a bitmap
- Rasterising HTML to a 1-bit bitmap at a fixed dot width, and getting the threshold right so 6.6pt text is legible on thermal paper
- Reconnect logic — BT drops constantly and a printer that has gone away must not hang the counter
- **USB-OTG thermal on Android is a second, entirely separate implementation.** Recommendation: do not support it in v1.

**Recommendation, and it is a purchasing decision not an engineering one:** buy three specific printers in Larkana, support exactly those three, name them in the setup guide, and refuse to promise anything about a fourth. The alternative is an infinite tail of Chinese firmware quirks debugged remotely against a promise never to look at a clinic's state.

**The escape hatch that already exists and must be preserved:** the shipped code guarantees the token printer is never load-bearing — the number is issued and shown on screen whether or not anything prints, and `printToken` never throws. A clinic with a broken Bluetooth printer writes the number on a pad and the evening continues. Keep that property exactly as it is.

## 3.7 Camera QR scanning

Two uses, and they have different risk profiles.

**Pairing** — a fresh, crisp, 60mm QR on a backlit screen at 20cm. Trivial. Not a risk.

**Reading the patient's old slip** — this is the real one. The QR is 14mm, printed by a laser onto a slip that has been folded into a wallet for six months, in a room lit by one tube light, read by a ₨18,000 phone. Mitigations:

- **Increase the slip QR to 18mm when the clinic has a phone-scanning counter.** Level M error correction is already correct; the constraint is module size against the camera, not error correction.
- **Print the QR on the prescription (laser, durable), never only on the token.** Thermal paper fades within months — the shipped `token.ts` says so itself — and a faded thermal QR is unreadable. The prescription is the patient's card; the token is a receipt for one evening. `profile.showQr` already defaults on for the slip. Keep it.
- **The typed 5-digit box stays the primary path and stays first on screen.** The camera is the shortcut, not the mechanism. The Luhn check digit in `code.ts` is what makes typing safe, and it protects the camera path too.
- Torch button, continuous autofocus, and a scan that opens the patient immediately with **no confirm tap** — the compounder's budget at the door is thirty seconds and a confirmation dialog is where it dies.

One structural note: `Intake.tsx` today assumes a USB scanner acting as a keyboard wedge, typing into the focused box. On a phone there is no such thing. The camera path is genuinely new UI, not a small addition to the existing box.

## 3.8 The LAN itself — three traps

**Discovery.** mDNS (`_nuskho._tcp.local`). Works on most home routers. **Fails on hospital and guest wifi with AP isolation, and on a surprising number of cheap PTCL routers.** Fallbacks, in order: the last-known IP from the pairing QR; the last IP that worked; a manual "type the address the doctor's screen is showing".

**Windows Firewall.** The first time the host binds its port, Windows shows a dialog. If the doctor — or the shop boy who installed it — clicks Cancel, **the LAN silently never works again for the life of the machine**, and it will present as "the app is broken". The installer must add the firewall rule itself, with the elevation it already has, and the host must run a self-check at day-open with a one-tap Fix.

**Transport.** The host serves over TLS with a self-signed certificate it generated at setup. **Its fingerprint is pinned at pairing time**, carried in the pairing QR. No CA, no `.local` certificate problem, and a device on the same wifi impersonating the host fails the pin.

## 3.9 The doctor on a phone or tablet

The task's matrix says the doctor may work "from a laptop, PC, tablet or phone, with a printer connected". I am narrowing this and saying so plainly:

**The prescription-printing device is a desktop — Windows, or macOS/Linux if it ever comes up.** Phones and tablets are read-only mirrors, permanently, which is the plan's own position.

The reason is not preference:

- A5/A4 laser printing from Android means Mopria/IPP, which means the laser must be a **network** printer. An HP LaserJet M28 connected by USB to a Windows PC is invisible to a phone. Most clinics in Larkana have exactly that arrangement.
- The shipped print path is `renderFitted` → `window.print()` with a global `@page` rule and an `afterprint` handshake (`print/print.ts`). None of that exists on Android. It is a second print implementation, of the *complicated* document, and it is not in any budget.

**SOLO on a phone** is therefore supported in exactly one configuration: a network/Mopria-capable laser, or a thermal-only practice. The second option — the prescription itself on 80mm thermal — might genuinely work for a two-or-three-medicine slip and would be a real product for a doctor with no PC at all. **It is unvalidated and I would not build it before someone has held one.**

---

# 4. What breaks

These are the ones I am most confident will happen in Larkana in the first three months. Sequence first, then what the design does.

### 4.1 The Windows Firewall dialog gets dismissed

**Sequence.** Tuesday: the doctor installs from the WhatsApp link. Windows asks whether to allow Nuskho on the network. He is not sure what it means and clicks Cancel. Wednesday: the compounder's phone pairs perfectly — pairing needs no network — and works all evening from its lease and its directory. Thursday, Friday, Saturday: it still works, and never syncs. The doctor's screen never shows a patient the compounder registered. He concludes the app is broken and rings Safeer, who cannot look at anything.

**Response.** The installer adds the firewall rule itself. The host runs a reachability self-check at day-open. When nothing has been heard from a paired device, the host shows, on the queue screen and not in settings:

```
  ⚠ Ghulam's phone has not been heard from for
    4 days. Everything he has registered is on
    that phone and is not here yet.
                        [ Fix the network ]
```

The Fix button re-adds the firewall rule and shows the manual IP. And the counter phone shows the mirror-image line on its own home screen, permanently, in red — because the person who will notice first is the compounder.

**This is my highest-confidence failure and it is not a crypto problem.**

### 4.2 The pairing QR is photographed and sent

**Sequence.** The compounder is not in that day. The doctor, being helpful, photographs the pairing QR and WhatsApps it so Ghulam can "set up his phone at home".

**Response.** It does not work, and that is the design. The QR expires in three minutes, is single-use, and contains no key material. The six confirmation digits are computed from the completed handshake and appear only on the host, after the scan, so a photo cannot produce them. The host would show *"a phone is asking to join"* with digits that do not match anything Ghulam sees.

The screen also says, in Sindhi and English, *"Do not take a photograph of this."* — because the failure to design for is not an attacker, it is a helpful doctor.

### 4.3 The recovery sheet is never printed properly

**Sequence.** Setup runs at 9pm. The laser is out of paper. He taps through. Three months later the laptop's disk dies.

**Response.** Three independent mechanisms, because the plan's 30–50% figure says one will not do:

1. Setup does not complete until two words are typed back. This is the only gate in the product and it is placed where nobody is waiting.
2. The seed is also written to a USB stick, encrypted under a passphrase, at that same moment. Two failure modes that are not correlated.
3. Re-drill at day 30 and every six months: an actual restore drill, not a reminder. Loud nag, red on About, flagged on Safeer's console. **Never a block.**

**What I am not sure about:** the wordlist. English BIP-39 is what every library supports and what the QR fallback makes tolerable, but twelve English words to a Sindhi speaker is close to twelve random strings. A Sindhi wordlist is a real linguistic project — it needs 2048 words that are unambiguous when handwritten in Arabic script, which is harder than it sounds. My decision is **English BIP-39 with the QR as the primary path**, and I flag that as the weakest link in the whole document.

### 4.4 Two patients hold the same number

**Sequence.** Monday, the counter phone is paired. Tuesday, the doctor's laptop stays off; the compounder registers fourteen patients. Wednesday, something looks wrong on the laptop and the doctor restores Sunday's backup, which rewinds the patients table past numbers that are already on paper in fourteen households.

**Response.** Leases (§3.5) make the offline half impossible by construction. The restore half is already half-solved in `safety.ts` — `bumpHighWaterPastRestore` adds 50 — and the fix is to extend the same discipline: **a restore burns every outstanding lease and takes fresh ones above everything seen, on every device, at next contact.** A gap in the numbering costs nothing. Two people sharing an identity costs a wrong prescription handed to somebody who cannot read it.

### 4.5 Load-shedding kills the host mid-evening

**Sequence.** 7:40pm, the power goes. The laptop has no UPS and dies mid-consultation. The compounder's phone, on its own battery, keeps taking money and printing tokens for forty minutes. 8:20pm the power returns.

**Response.** The counter is authoritative for the queue and the fee; on reconnect the host **takes** the counter's writes rather than merging them, so there is no algorithm to be wrong. The half-written consultation survives because `db.ts` already writes on every change — *"load-shedding is normal here; power will cut mid-session and reopening Chrome must lose nothing"* — and that property must survive the move to a desktop app and a real file on disk.

Note what this does *not* try to do: it does not try to distinguish a power cut from a doctor walking out. The plan already established that the honest-gap flag is meaningless in Larkana because the power cut is the normal case. Do not ship the flag.

### 4.6 The OEM ROM quietly kills the counter app

**Sequence.** The compounder's Infinix decides Nuskho is using battery. Background sync stops. He does not notice, because the app works perfectly when it is open — everything he does is local. Six days later the doctor discovers he has no record of a hundred and eighty patients.

**Response.** The battery-optimisation exemption is requested during pairing, on the phone, with an explanation. And the counter's home screen carries a permanent line: *"Last talked to the doctor's computer: 6 days ago"* — red past two days. The device that can detect the problem is the one that must display it, because the host cannot report what it has not heard.

### 4.7 The Sindhi on the thermal token prints as boxes

**Sequence.** The token is implemented as ESC/POS text because that is the obvious thing to do and it works fine for the English. The first real token prints `????` where `نمبر` should be, or — worse — prints Sindhi letters reversed and disconnected, which looks like a font problem rather than an architecture problem and gets debugged for three weeks.

**Response.** §3.6: raster only, `GS v 0`, at 384/576 dots. There is no text path for the token, ever. Write this as a rule in the code with the reason attached, in the same voice as `token.ts`'s existing "a fee may appear here, a medicine may not" rule, because that comment is exactly the kind that survives.

### 4.8 The doctor buys a new laptop and does not tell anyone

**Sequence.** The old one is slow. The shop installs Nuskho for him from the website. He starts using it. There are now two hosts with the same clinic name and two diverging archives, and the compounder's phone is paired to the dead one.

**Response.** Three things. The web link is a **demo that refuses to store a real patient** — banner, hard block, DEMO across every slip. **A device cannot become a host by claiming to be one**: becoming a host requires the backup file *and* the recovery sheet, both. And there is an explicit ceremony, *"Move this clinic to a new computer"*, that retires the old host by name and forces re-pairing of every device.

### 4.9 The doctor gives the compounder his PIN

**Sequence.** He is stuck in traffic at 6pm and twenty people are waiting. He rings Ghulam and tells him the PIN so he can "start people off". From that evening, the doctor's PIN is the clinic's PIN.

**Response.** This is a social problem and the app can only reduce the pressure, not solve it. What it does: **make the counter's job complete without the doctor's PIN.** Registering, money, tokens, vitals, lookups — none of it ever asks for the doctor. The pressure to share only exists if the counter is blocked, so do not block it. And the doctor's PIN is asked once, at day-open on the room device, and never again — never mid-consultation, never on a timer. A doctor locked out in front of a patient goes back to his pen, and it only has to happen twice.

I will not claim this is solved. It is reduced.

### 4.10 The old slip will not scan

**Sequence.** A returning patient hands over a slip that was folded through the QR square, or a thermal token from four months ago that has faded to grey. The camera hunts and fails while a queue builds.

**Response.** The typed 5-digit box is first on screen and always available; the Luhn check digit makes typing safe. The QR goes on the laser prescription, not only on the thermal token. And the shipped philosophy stands: *"No old slip? Add as new. A duplicate costs nothing; asking questions at the door costs the evening."*

### 4.11 A doctor pairs a tablet and finds it empty

**Sequence.** Month two, he buys a tablet, pairs it in forty seconds, opens it in the evening to show a patient his history — and it has nothing before today, because all wraps are decided at seal time and there is no re-wrap engine.

**Response.** This is a designed limitation, so it must be stated at the moment of pairing rather than discovered:

```
  This tablet will show everything from today
  onward.

  Your older patients are not on it yet.
  [ Bring my old patients onto this tablet ]
  (takes a few minutes, do it now while nobody
   is waiting)
```

---

# 5. What I am not sure about

Listed rather than papered over.

1. **The patient directory on the compounder's phone.** Defensible on permissions, untested on feeling. Ask a doctor before building it. If the answer is no, the fallback is duplicates whenever the host is asleep, and that is a clinical cost, not a convenience cost.
2. **The recovery wordlist.** English BIP-39 with a QR is my decision and it is the weakest link in this document.
3. **The nine-character opening code over a phone line.** Untested with a real Sindhi-speaking compounder on a real bad connection. The WhatsApp file makes it a fallback, which is the only reason I am comfortable.
4. **ESC/POS on the printers actually sold in Larkana.** Buy three before finalising anything in §3.6.
5. **mDNS on the routers doctors actually have.** Cheap PTCL routers and hospital guest wifi are both hostile. The manual-IP fallback may end up being the normal path, in which case the pairing QR carrying an IP that later changes by DHCP becomes a live problem worth solving with a static reservation in the install guide.
6. **Whether a doctor accepts that his phone is read-only forever.** The plan asserts it, I agree with it, and nobody has told a doctor yet.
7. **Whether the demo can really be kept from becoming somebody's live clinic.** A banner and a save-block are the honest attempt; a determined shop boy will find a way.
8. **Prescription-on-thermal for SOLO-on-phone.** Interesting, cheap, unvalidated. Print one before believing in it.
9. **The business model against "no kill switch".** This design makes the licence genuinely optional at runtime, by construction. That is the right engineering answer and it is an unsolved commercial one.

---

# 6. This needs more than one part-time person, and here is the honest arithmetic

The plan already gives Phase 1 sixteen weeks of wall clock and says that if two devices are not showing the same patient by week sixteen, sync is cut. Taking that seriously, here is what fits — and what does not.

**Fits in sixteen weeks, roughly:**

| Weeks | What |
|---|---|
| 1–3 | Tauri desktop shell; records in a real file on disk instead of IndexedDB; backup to a USB stick. **This alone kills browser-storage eviction, which the plan ranks as the second-largest real harm, and it needs no cryptography at all.** |
| 4–6 | Seed generation, key derivation, at-rest encryption, the recovery sheet, the restore path. |
| 7–10 | QR pairing, the LAN host, the counter phone app, camera scanning, leases. |
| 11–14 | ESC/POS raster thermal printing on the phone. |
| 15–16 | Safeer's console, the opening file, hardening, the firewall installer. |

**Does not fit and is not in it:** the outside-clinic push, cloud accounts for doctors, re-wrap engines, appointments, referrals, `all` mode, multi-room hospitals, compounder accounts, staff management, attendance.

**Now the honest part.** That table assumes one person who is simultaneously competent at, and has time for: Rust/Tauri packaging and code signing, a Windows installer that manipulates firewall rules, libsodium key derivation and envelope encryption done correctly the first time, mDNS and self-signed TLS with certificate pinning, an Android application, Bluetooth RFCOMM, ESC/POS raster generation against undocumented Chinese firmware, and a camera QR pipeline. **At ten hours a week that is not sixteen weeks. It is closer to two years, and the plan's own budget section says so about a smaller scope than this one.**

So, loudly: **this design as written needs either a second person or a smaller scope.** If it must be one part-time person, cut in this order and stop when the hours fit:

1. **Cut the Bluetooth thermal printing on the phone entirely** (weeks 11–14). The counter writes the number on a pad, exactly as the shipped code already permits. This is four weeks for a courtesy receipt.
2. **Cut the counter phone.** Ship weeks 1–6 and 15–16 only: a desktop app, a real file on disk, a key, a recovery sheet, USB backup, and Safeer's console. **That is a genuinely better product than what exists today, it removes the largest real risk to a clinic's records, it serves SOLO and PRIVATE-with-one-machine completely, and it can ship in about eight weeks.**
3. Add the LAN and the counter phone as the next release, once a doctor has asked for it with money in his hand.

Note what survives that cut: **everything in Part 1 and Part 2 still holds.** The clinic still opens the same way, the keyring is still minted on the doctor's machine, `reads` still defaults to `mine`, and SOLO is still what you get before anyone configures anything. The model does not change when the device count does — which is the test of whether it was the right model.