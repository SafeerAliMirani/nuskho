# The patient's phone, the QR, and the token desk

Decided 4 August 2026, from Safeer's own answers about Larkana, with an
independent review of the arithmetic. The clickable design is
`superadmin-panel.html`'s sibling. The token-flow study it grew from was deleted once the tokens became working software; it is in the git history.

---

## The ground truth these decisions stand on (Safeer, 4 Aug 2026)

- Eight to ten families in ten can open a web link on some phone in the house.
- **Fee first, always.** At Ali Hospital and Indus Hospital a receptionist takes
  the money and issues the token; in most of Larkana the compounder does both.
- Specialists sit **evening shifts**; patients come for a named, often famous,
  doctor — who may sit in a hospital room or a stand-alone clinic.
- The compounder calls the name at the door; a peon manages entry; and
  **influence is real: number 60 walks in while 25 is running, adjusted quietly,
  without telling the room.**
- The chemist reads the slip and hands it back — **the paper stays with the
  family for months.** A chemist could scan a code, but speed rules the counter.
- Fakes/altered slips were *not* reported as a major problem.

## Decision 1 — where a patient's history lives

**In the clinic and on paper. Nowhere else. No Nuskho server holds records.**
Chosen explicitly over an opt-in server and over a full portal. This keeps rule
2 ("records never leave the building") and rule 7 ("Nuskho cannot read a
prescription") literally true, at the price that Nuskho can never show a family
anything the family does not already hold.

## Decision 2 — what the QR becomes (direction, not yet build)

Today the QR is `NUSKHO:<patient code>`, 14 mm, for the clinic's own USB
scanner — and `qr.ts` documents good reasons for that. The direction that
satisfies "one prescription · full history · genuine · nuskho.pk" without a
records server is the **EU digital-certificate pattern**: at print time, pack
the slip's own snapshot (the same `RxLine.snap` the paper shows), sign it with
the clinic's key, compress, and print it as a **second, larger QR** encoding
`https://qr.nuskho.pk/#<url-safe-base64 payload>`. The viewer page reads the
part after `#` — which a browser does not send when opening the page — verifies
the signature, shows the slip Sindhi-first, and keeps a copy in the phone's own
storage. History = scans accumulating on the family's phone, grouped by person,
because one phone serves a household.

**Answering `qr.ts`'s own objections:** paper stays authoritative — the phone
view labels itself a copy of the paper; the payload is generated from the same
snapshot at the same moment, and the signature makes any divergence detectable
tampering rather than ambiguity. The dense-code objection was *right* and sets
the size below.

**Engineering constraints (reviewer-checked — treat as requirements):**

1. **Two squares, not one.** The 14 mm `NUSKHO:` code stays untouched for the
   desk scanner; the payload square is additional. A keyboard-wedge scanner
   typing a 1 KB URL into the search box is not a feature.
2. **~35–45 mm printed** for the payload square (4–8 medicines ≈ V15–V22 QR;
   modules must stay ≥ ~0.4 mm for budget cameras on laser print in dim shops;
   the EU printed comparable payloads at ~50 mm). Comfortable on A4; on A5 this
   is a real layout question `dev-fit` must re-prove — possibly the slip's back.
3. **URL-safe base64, not base45.** RFC 9285 base45 contains space and `%` and
   breaks inside URLs; the EU avoided this by not using a URL at all.
4. **The viewer is served code** and therefore needs the same signed-update
   discipline as the app. The honest claim is "**Nuskho holds no copy**" — not
   "no one can see it": a forwarded link carries the prescription to whoever
   receives it, Chrome sync stores visited URLs, and Google Lens scans via the
   cloud on many phones.
5. **Phone-side truths:** links opened in WhatsApp's in-app browser keep
   separate storage from Chrome (a family's history can silently split);
   browsers can evict stored slips (home-screen install protects); first open
   needs internet once. Losing the wallet must never matter more than the paper.
6. **`qr.nuskho.pk` registered before anything prints.** Unchanged rule.

**Until all of the above is settled and the pilot is done, the shipped QR stays
exactly as it is.** Nothing here is pilot work.

## Decision 3 — the token desk and the room queue

Locked by the ground truth, and shown in the mockup:

- **Numbers belong to the room, not the building.** Each sitting doctor's queue
  counts alone; each room's slips recall by its own numbers.
- **Fee first at token issue**, per-doctor fees, tonight's sitting doctors only.
  One screen serves both the hospital receptionist and the solo compounder —
  the difference is a role, not a product. (Note: the solo app currently asks
  the fee *after* printing, by design; whether that survives contact with
  fee-first reality is a **pilot observation, not a code change now**.)
- **Any row can be called. No renumbering. No public "now serving" display,
  ever.** The quiet adjustment for influence is a fact of the room; software
  that exposes it embarrasses the doctor and gets uninstalled. The README
  banned queue displays before we knew this; keep it banned.
- **Call-by-number** is a per-patient courtesy flag (women's names, anyone who
  asks) — the chit already carries the number.
- Every token still resolves (seen / left / cancelled / referred) so the
  evening's figures stay honest. **Who jumped whom is deliberately never a
  statistic.**
- The chit gains one line when hospital mode exists: the **Room / doctor** row.
  Fee and name stay; clinical content stays off it (rule 4).

## What the world's systems taught (kept, adapted, refused)

- **India, ABDM "Scan & Share"** (3+ crore OPD tokens): registration friction is
  the queue's real bottleneck. Nuskho's equivalent — desk-scans the old slip's
  code and fields fill — already exists; keep sharpening that, not accounts.
- **EU Digital COVID Certificate**: the whole Decision-2 pipeline, proven at
  continental scale. Adopted wholesale.
- **Bahmni / OpenMRS** (low-resource hospital EMR): validates local-server,
  works-offline hospital architecture; also proves module order — OPD +
  pharmacy + billing before anything exotic. Matches the roadmap already.
- **Epic MyChart**: the portal features people actually use are "my medicines,
  my visits, my family's records" — Nuskho's paper + phone-wallet covers that
  set without a server. The account-based portal itself: refused, by Decision 1.

## Sindhi introduced by these mockups — Pirah's queue

درخواستون (requests/tickets) · قطار (queue) · مريض جو فون · اسان جا پرچا ·
اصل پرچو (genuine slip) · پني وارو پرچو اصل آهي · هي رڪارڊ رڳو هن فون ۾ آهي ·
نمبر سان سڏيو · ٽوڪن ڇاپيو · ڪمرو · معدو / بخار / کنگهه · اڀياس ·
plus the welcome/login batch (ڪمپائونڊر، فارميسي، اڊمن، ٽوڪن ڪائونٽر).
Nothing from this list prints on a slip; all of it is screen UI.
