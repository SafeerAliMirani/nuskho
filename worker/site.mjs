/**
 * THE SITE WORKER: static assets, plus EXACTLY THREE ROUTES, and the reason
 * the old "no worker script on purpose" rule changed shape.
 *
 * The rule used to be that this deployment is assets-only so it cannot
 * quietly grow a server route. Safeer then approved the heartbeat middle
 * path (clinic code and app version, opt-in, nothing else), the super admin
 * panel that reads it, and the contract portal for the clinics. So the rule
 * is now narrower and stated here where the routes live:
 *
 *   NOTHING ON THIS WORKER MAY EVER CARRY PATIENT DATA, and no route may be
 *   added that could. The three routes below carry a clinic code, a version
 *   string, and contract facts Safeer types himself. The app-side payload is
 *   pinned by a unit test (heartbeat.test.ts) to exactly two fields, and the
 *   clinical app has no other code path that reaches the network at all.
 *
 * /hb  POST, public. A clinic that opted in says "code X is alive on
 *      version Y". Stored as last-seen, overwriting the previous. Always
 *      answers 204, even for garbage, so a prober learns nothing.
 *
 * /sa  GET and POST, bearer-secret. Safeer's private panel (dev-sa.html,
 *      never deployed) reads the clinic list and writes contract records.
 *      The secret is a Cloudflare secret (wrangler secret put SA_KEY), never
 *      in this repo. Without the secret set, /sa refuses everything.
 *
 * /c/<token>  the CONTRACT PORTAL, chosen by Safeer on 12 Aug: one private,
 *      unguessable link per clinic, sent by him on WhatsApp. It shows the
 *      contract and nothing else: name, paid until, amount, payments, the
 *      app version last heard. The "ask for an extension" button opens
 *      WhatsApp to Safeer with a prefilled line; nothing is stored. A wrong
 *      token gets one neutral sentence, so links cannot be fished for. The
 *      pages are no-store and noindex. Rotating a clinic's token in the
 *      panel kills the old link at the next save.
 *
 * Storage is one KV namespace, NKHB. Until it is created and bound
 * (RUN-THIS has the two commands), both routes answer 503 and the site
 * itself serves exactly as before, so a half-done setup breaks nothing.
 *
 * KV keys:
 *   hb:<code>   {"v":"1.0.0+abc1234","at":1699999999999}    written by /hb
 *   cl:<code>   {"token","name","paidUntil","amount","contact","notes",
 *                "invoices":[]}                              written by /sa
 *   tok:<token> "<code>"    the private link's key, index kept by /sa
 */

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

const norm = s => String(s ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)

export default {
  async fetch(req, env) {
    const url = new URL(req.url)

    if (url.pathname === '/hb' && req.method === 'POST') {
      // Always 204. A wrong payload, a missing KV, a flooded code: the sender
      // is a clinic machine that must never learn or care, and a prober must
      // not be able to map what exists here.
      try {
        if (env.NKHB) {
          const text = (await req.text()).slice(0, 200)
          const p = new URLSearchParams(text)
          const c = norm(p.get('c'))
          const v = String(p.get('v') ?? '').replace(/[^A-Za-z0-9. +-]/g, '').slice(0, 40)
          if (c) await env.NKHB.put('hb:' + c, JSON.stringify({ v, at: Date.now() }))
        }
      } catch { /* deliberately nothing */ }
      return new Response(null, { status: 204 })
    }

    if (url.pathname === '/sa') {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
      // No secret configured means no admin API exists, not a default key.
      const want = env.SA_KEY
      const got = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
      if (!want || !got || got !== want) {
        return new Response('no', { status: 403, headers: cors })
      }
      if (!env.NKHB) return new Response('KV namespace NKHB is not bound yet. See RUN-THIS.', { status: 503, headers: cors })

      if (req.method === 'GET') {
        // Both halves of what the panel shows: the records Safeer typed and
        // the heartbeats the clinics sent, joined by code.
        const out = {}
        for (const prefix of ['cl:', 'hb:']) {
          let cursor
          do {
            const page = await env.NKHB.list({ prefix, cursor })
            for (const k of page.keys) {
              const code = k.name.slice(3)
              out[code] = out[code] ?? {}
              const val = await env.NKHB.get(k.name)
              try { out[code][prefix === 'cl:' ? 'contract' : 'hb'] = JSON.parse(val) } catch { /* skip a corrupt row */ }
            }
            cursor = page.list_complete ? undefined : page.cursor
          } while (cursor)
        }
        return new Response(JSON.stringify(out), {
          headers: { ...cors, 'Content-Type': 'application/json' },
        })
      }

      if (req.method === 'POST') {
        let body
        try { body = await req.json() } catch { return new Response('bad json', { status: 400, headers: cors }) }
        const code = norm(body.code)
        if (!code) return new Response('a clinic code is needed', { status: 400, headers: cors })
        const prevRaw = await env.NKHB.get('cl:' + code)
        let prevTok = ''
        try { prevTok = prevRaw ? (JSON.parse(prevRaw).token ?? '') : '' } catch { /* fresh */ }
        if (body.delete === true) {
          await env.NKHB.delete('cl:' + code)
          await env.NKHB.delete('hb:' + code)
          if (prevTok) await env.NKHB.delete('tok:' + prevTok)
          return new Response('{"ok":true}', { headers: { ...cors, 'Content-Type': 'application/json' } })
        }
        const clip = (x, n) => String(x ?? '').slice(0, n)
        // the private link's key, minted by the panel: rotating it is how a
        // leaked link dies. The index follows the record on every save.
        const token = String(body.token ?? '').replace(/[^a-f0-9]/g, '').slice(0, 64)
        const rec = {
          token: token.length >= 24 ? token : '',
          name: clip(body.name, 80),
          paidUntil: clip(body.paidUntil, 10),
          amount: Math.max(0, Math.min(10000000, Math.round(Number(body.amount) || 0))),
          contact: clip(body.contact, 60),
          notes: clip(body.notes, 500),
          invoices: Array.isArray(body.invoices)
            ? body.invoices.slice(0, 60).map(i => ({
                day: clip(i?.day, 10),
                amount: Math.max(0, Math.min(10000000, Math.round(Number(i?.amount) || 0))),
                note: clip(i?.note, 120),
              }))
            : [],
        }
        await env.NKHB.put('cl:' + code, JSON.stringify(rec))
        if (prevTok && prevTok !== rec.token) await env.NKHB.delete('tok:' + prevTok)
        if (rec.token) await env.NKHB.put('tok:' + rec.token, code)
        return new Response('{"ok":true}', { headers: { ...cors, 'Content-Type': 'application/json' } })
      }

      return new Response('no', { status: 405, headers: cors })
    }

    if (url.pathname.startsWith('/c/') && req.method === 'GET') {
      return portal(url.pathname.slice(3), env)
    }

    // Everything else is the website, exactly as before.
    return env.ASSETS.fetch(req)
  },
}

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))

// A fresh Response every time: a body streams once, so a shared instance
// would answer the first wrong link and crash on the second.
const neutral = () => new Response(
  '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">' +
  '<title>Nuskho</title><body style="font-family:sans-serif;padding:40px">' +
  '<p>This link is not active. Ring Nuskho and a fresh one will be sent.</p>',
  { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })

/**
 * The whole page a clinic can ever see: its own contract. Rendered here, on
 * the worker, from the cl: record and the hb: last-seen, with no script in
 * the page at all, because a page that runs nothing can leak nothing.
 */
async function portal(token, env) {
  if (!env.NKHB) return neutral()
  const t = String(token).replace(/[^a-f0-9]/g, '').slice(0, 64)
  if (t.length < 24) return neutral()
  const code = await env.NKHB.get('tok:' + t)
  if (!code) return neutral()
  const raw = await env.NKHB.get('cl:' + code)
  if (!raw) return neutral()
  let c
  try { c = JSON.parse(raw) } catch { return neutral() }
  let hb = null
  try { hb = JSON.parse(await env.NKHB.get('hb:' + code)) } catch { /* never heard */ }

  const today = new Date().toISOString().slice(0, 10)
  const overdue = c.paidUntil && c.paidUntil < today
  const rows = (c.invoices ?? []).map(i =>
    `<tr><td>${esc(i.day)}</td><td>Rs ${esc(i.amount)}</td><td>${esc(i.note)}</td></tr>`).join('')
  const wa = String(env.WA ?? '').replace(/[^0-9]/g, '')
  const ask = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(
        `Assalam o alaikum. This is ${c.name || code} (${code}). We would like to ask about extending our Nuskho service.`)}`
    : ''

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Nuskho, your service</title>
<style>
 body{font:16px/1.6 system-ui,sans-serif;max-width:560px;margin:24px auto;padding:0 18px;color:#182420}
 h1{font-size:20px;color:#0f5c4a}.card{background:#f7faf8;border:1px solid #e2e8e5;border-radius:14px;padding:16px 18px;margin:14px 0}
 table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #e2e8e5;padding:6px 8px}
 .due{color:#b3362a;font-weight:700}.ok{color:#0f5c4a;font-weight:700}
 a.btn{display:inline-block;background:#0f5c4a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;margin-top:8px}
 small{color:#5c6b64}
</style></head><body>
<h1>${esc(c.name || code)}</h1>
<p><small>Clinic code ${esc(code)}. This page shows your service and payments, and
nothing else: no patient, no prescription, no number from your clinic's work is
here or anywhere outside your own machine.</small></p>
<div class="card">
 <p>Paid until: <span class="${overdue ? 'due' : 'ok'}">${esc(c.paidUntil || 'no licence set')}</span>
 ${overdue ? '<br><small>The date has passed. If payment was already made, send the receipt and it will be set right.</small>' : ''}</p>
 ${c.amount ? `<p>Monthly: Rs ${esc(c.amount)}</p>` : ''}
 ${hb ? `<p><small>Your Nuskho version: ${esc(hb.v)}, last heard ${esc(new Date(hb.at).toISOString().slice(0, 10))}</small></p>` : ''}
 ${ask ? `<a class="btn" href="${ask}">Ask for an extension on WhatsApp</a>` : ''}
</div>
${rows ? `<div class="card"><p><b>Payments received</b></p><table>${rows}</table></div>` : ''}
<p><small>Nuskho \u0646\u0633\u062e\u0648</small></p>
</body></html>`
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
