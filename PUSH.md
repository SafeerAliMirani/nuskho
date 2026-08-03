# Getting this onto GitHub and then Cloudflare

The commit is already made. Nothing here needs a decision from you except the
repository name.

## 1. GitHub

Create an **empty private** repo at <https://github.com/new>. Name it `nuskho`.
Do not tick "add a README", "add .gitignore" or "add a licence" — this folder
already has all three and an initial commit, and those tick boxes are what cause
the "unrelated histories" error people hit here.

Then, in `E:\Medical Project Larkana`:

```
git remote add origin https://github.com/SafeerAliMirani/nuskho.git
git branch -M main
git push -u origin main
```

If it asks for a password, use a personal access token rather than your GitHub
password — GitHub stopped accepting passwords for git in 2021.

**Keep it private.** The company name is undecided, `nuskho.pk` is not
registered, and a public repo means anyone can register the name before you do.

## 2. Cloudflare Pages

Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** →
pick `nuskho`.

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build:web` |
| Build output directory | `dist-web` |
| Node version | `20` (`.nvmrc` already says so) |

That is all of it. Every push to `main` redeploys.

`public/_headers` is picked up automatically. The line that matters in it is
`connect-src 'none'`, which tells the browser to refuse any network request this
app makes, to anywhere — so "nothing about a patient leaves this computer" stops
being a promise and becomes something the browser enforces, including against a
future version of this code that gets it wrong.

## 3. Netlify (already half done)

I created an empty project called `nuskho` on your Netlify team while trying to
deploy from here; the upload was refused from this sandbox. If you would rather
use Netlify than Cloudflare, connect the same GitHub repo to it and it will
build from `netlify.toml`, which is already in the folder. If not, delete the
project — it is empty and costs nothing either way.

## Two builds, and do not mix them up

```
npm run build       -> dist/       base './'   the CLINIC install, opened from a folder
npm run build:web   -> dist-web/   base '/'    the WEB copy, for Cloudflare
```

`dist/` is what a clinic gets on a pen drive: double-click `index.html`, no
server, no internet. `dist-web/` has absolute asset paths and will not work from
a folder. The clinic install is the real product; the web copy is for showing
it, getting it, and installing it to a phone home screen.

## When nuskho.pk is registered

`APP.web` in `src/profile.ts` is deliberately an empty string, so no printed slip
carries an address you do not own. Put `'nuskho.pk'` back the day the
registration is confirmed, and not a day before — a few thousand slips in
people's drawers pointing at a domain someone else can buy is not a mistake you
can recall.
