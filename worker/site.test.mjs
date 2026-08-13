import { describe, it, expect } from 'vitest'
import worker from './site.mjs'

/**
 * The worker's two routes, held to their word without a Cloudflare in sight:
 * env is three plain fakes. What matters most is the refusals — /sa without
 * the secret, /hb that never confirms anything — because those are the
 * surfaces a stranger sees.
 */
function fakeEnv({ withKv = true, key = 'sekrit' } = {}) {
  const store = new Map()
  const kv = {
    put: async (k, v) => { store.set(k, v) },
    get: async k => store.get(k) ?? null,
    delete: async k => { store.delete(k) },
    list: async ({ prefix }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    }),
  }
  return {
    env: {
      NKHB: withKv ? kv : undefined,
      SA_KEY: key,
      WA: '923333368189',
      ASSETS: { fetch: async () => new Response('site', { status: 200 }) },
    },
    store,
  }
}
const url = p => 'https://nuskho.example' + p

describe('the site worker', () => {
  it('serves the site for everything that is not its two routes', async () => {
    const { env } = fakeEnv()
    const r = await worker.fetch(new Request(url('/app')), env)
    expect(await r.text()).toBe('site')
  })

  it('hb stores last-seen and answers 204 whatever happens', async () => {
    const { env, store } = fakeEnv()
    // the app's sender encodeURIComponent()s both values; a raw + here would
    // be a prober's request, decoded to a space and stored harmlessly
    const r = await worker.fetch(new Request(url('/hb'), { method: 'POST', body: 'c=lrk-014&v=1.0.0%2Babc' }), env)
    expect(r.status).toBe(204)
    const row = JSON.parse(store.get('hb:LRK-014'))
    expect(row.v).toBe('1.0.0+abc')
    expect(row.at).toBeGreaterThan(0)
    // garbage: same face, nothing stored
    const g = await worker.fetch(new Request(url('/hb'), { method: 'POST', body: 'zzz' }), env)
    expect(g.status).toBe(204)
    // no KV bound: same face
    const { env: bare } = fakeEnv({ withKv: false })
    const b = await worker.fetch(new Request(url('/hb'), { method: 'POST', body: 'c=X&v=1' }), bare)
    expect(b.status).toBe(204)
  })

  it('sa refuses without the secret, and refuses everything when none is set', async () => {
    const { env } = fakeEnv()
    expect((await worker.fetch(new Request(url('/sa')), env)).status).toBe(403)
    const wrong = new Request(url('/sa'), { headers: { Authorization: 'Bearer nope' } })
    expect((await worker.fetch(wrong, env)).status).toBe(403)
    const { env: noKey } = fakeEnv({ key: undefined })
    const any = new Request(url('/sa'), { headers: { Authorization: 'Bearer anything' } })
    expect((await worker.fetch(any, noKey)).status).toBe(403)
  })

  it('sa round-trips a contract record and joins the heartbeat by code', async () => {
    const { env } = fakeEnv()
    const auth = { Authorization: 'Bearer sekrit', 'Content-Type': 'application/json' }
    await worker.fetch(new Request(url('/hb'), { method: 'POST', body: 'c=LRK-014&v=1.0.0' }), env)
    const w = await worker.fetch(new Request(url('/sa'), {
      method: 'POST', headers: auth,
      body: JSON.stringify({ code: 'lrk-014', name: 'Dr Khan Clinic', paidUntil: '2026-09-01', amount: 5000, invoices: [{ day: '2026-08-01', amount: 5000, note: 'august' }] }),
    }), env)
    expect(w.status).toBe(200)
    const r = await worker.fetch(new Request(url('/sa'), { headers: auth }), env)
    const out = await r.json()
    expect(out['LRK-014'].contract.name).toBe('Dr Khan Clinic')
    expect(out['LRK-014'].contract.invoices[0].amount).toBe(5000)
    expect(out['LRK-014'].hb.v).toBe('1.0.0')
  })

  const TOK = 'a'.repeat(32), TOK2 = 'b'.repeat(32)
  const saveWith = (env, token, extra = {}) => worker.fetch(new Request(url('/sa'), {
    method: 'POST', headers: { Authorization: 'Bearer sekrit', 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'LRK-014', token, name: 'Dr Khan Clinic', paidUntil: '2026-09-01', ...extra }),
  }), env)

  it('the portal shows the contract to the right link and one neutral sentence to every wrong one', async () => {
    const { env } = fakeEnv()
    await saveWith(env, TOK)
    await worker.fetch(new Request(url('/hb'), { method: 'POST', body: 'c=LRK-014&v=1.2.0' }), env)
    const good = await worker.fetch(new Request(url('/c/' + TOK)), env)
    expect(good.status).toBe(200)
    const html = await good.text()
    expect(html).toContain('Dr Khan Clinic')
    expect(html).toContain('2026-09-01')
    expect(html).toContain('1.2.0')
    expect(html).toContain('wa.me/923333368189')
    // no caches, no crawlers: a contract page must live nowhere but this reply
    expect(good.headers.get('Cache-Control')).toBe('no-store')
    expect(good.headers.get('X-Robots-Tag')).toBe('noindex')
    // wrong links, short links, no-KV: same neutral face, never a hint
    for (const bad of ['/c/' + TOK2, '/c/abc', '/c/']) {
      const r = await worker.fetch(new Request(url(bad)), env)
      expect(r.status).toBe(404)
      expect(await r.text()).toContain('not active')
    }
  })

  it('rotating the token kills the old link at the next save', async () => {
    const { env } = fakeEnv()
    await saveWith(env, TOK)
    expect((await worker.fetch(new Request(url('/c/' + TOK)), env)).status).toBe(200)
    await saveWith(env, TOK2)
    expect((await worker.fetch(new Request(url('/c/' + TOK)), env)).status).toBe(404)
    expect((await worker.fetch(new Request(url('/c/' + TOK2)), env)).status).toBe(200)
  })

  it('deleting a clinic kills its link too', async () => {
    const { env } = fakeEnv()
    await saveWith(env, TOK)
    await worker.fetch(new Request(url('/sa'), {
      method: 'POST', headers: { Authorization: 'Bearer sekrit', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'LRK-014', delete: true }),
    }), env)
    expect((await worker.fetch(new Request(url('/c/' + TOK)), env)).status).toBe(404)
  })

  it('the portal page never carries a script: a page that runs nothing leaks nothing', async () => {
    const { env } = fakeEnv()
    await saveWith(env, TOK)
    const html = await (await worker.fetch(new Request(url('/c/' + TOK)), env)).text()
    expect(html).not.toContain('<script')
    // and hostile names cannot smuggle one in
    await saveWith(env, TOK, { name: '<script>alert(1)</script>' })
    const h2 = await (await worker.fetch(new Request(url('/c/' + TOK)), env)).text()
    expect(h2).not.toContain('<script>alert')
    expect(h2).toContain('&lt;script&gt;')
  })
})
