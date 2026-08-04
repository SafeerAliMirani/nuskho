# Putting Nuskho on Cloudflare Pages

**Read this first.** The web copy is not how a clinic runs Nuskho. A clinic runs
the folder: `dist/index.html`, opened from the disk, with the internet unplugged.
That stays true and nothing here changes it.

The web copy exists for three jobs, and they are all worth doing:

1. **Showing it.** A doctor can look at it on his phone in thirty seconds
   without anyone installing anything.
2. **Getting it.** One address to send a clinic, instead of a zip on WhatsApp
   that arrives corrupted.
3. **Keeping it.** It installs as an app on a phone or a laptop and then works
   offline, so a doctor who added it in Larkana can still open it in a village.

---

## Build

```
npm install
npm run build:web        # -> dist-web/
```

`npm run build` is the different one: it produces `dist/` with `base: './'` for
the folder install. Do not deploy that; its asset paths assume a folder.

## Deploy

You have to do the login yourself. I cannot, and should not, hold your
Cloudflare credentials.

```
npm i -g wrangler
wrangler login                                   # opens a browser, once
wrangler pages deploy dist-web --project-name nuskho
```

That is the whole deploy. Subsequent releases are the last line again.

To attach `nuskho.pk` once you have registered it: Cloudflare dashboard →
Workers & Pages → nuskho → Custom domains.

---

## What is already configured

**`public/_headers`** sets the Content Security Policy, and one line in it is
the important one:

```
connect-src 'none'
```

That tells the browser to refuse any network request this app tries to make, to
anywhere. It turns "nothing about a patient leaves this computer" from something
we promise into something the browser enforces on our behalf — including against
a future version of this code that gets it wrong. If a build ever needs to call
out, it will fail loudly here rather than quietly succeed.

The rest: no referrer, no sniffing, no framing, no geolocation, no camera, no
microphone, no ad cohort.

**`public/sw.js`** is deliberately the most conservative service worker
possible. Cache-first, never network-first, no background sync, no push, and it
ignores anything that is not a same-origin GET. A new version is taken on the
next open and never in the middle of a consultation, because a half-updated app
is worse than an old one when the thing it prints is a prescription.

**`public/_redirects`** sends everything to `index.html`. There is one page.

---

## Before you point a domain at it

- **Register `nuskho.pk` first.** `APP.web` in `src/profile.ts` is deliberately
  blank, so no slip carries an address we do not own. Put the string back the day
  the registration is confirmed, and not a day before.
- ~~**Decide what the landing page says.**~~ Done — `public/welcome.html` is the
  front door and `public/login.html` the role sign-in. On Netlify, `/` rewrites
  to the welcome page and the app itself is shown at `/demo` (see
  `netlify.toml`); an installed home-screen app still opens the app, because the
  manifest's `start_url` is `./demo`. Three rules those pages carry:
  - **The WhatsApp number is a placeholder** (`wa.me/923000000000`, shown as
    `+92 3XX XXXXXXX`). Search for `wa.me/` in both files and replace it with
    the real public number before the link goes to anyone.
  - They are plain, self-contained HTML — no JavaScript, fonts inlined — so the
    CSP below applies to them unchanged. Keep them that way.
  - After editing either page, **bump `CACHE` in `public/sw.js`** (v2 → v3 …),
    or returning visitors keep the cached old copy for ever.
- **Do not put a contact form on it.** Support is the offline ticket in
  About → Something is wrong: a reference number and a report the clinic reads
  before sending. A form on a website is a server that receives text typed by a
  person standing in a clinic, and that is exactly the channel through which a
  patient's name eventually gets sent to us.
