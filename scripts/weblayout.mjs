// Runs after the WEB build only (see package.json). The public site's front
// door is the welcome page, so it becomes the physical index.html, and the app
// itself moves to app.html, served at /app by the host's clean-URL handling.
// Physical files, no redirect rules: every host serves them the same way.
// The CLINIC build (dist/) is untouched; its index.html stays the app.
import { renameSync, copyFileSync, existsSync, rmSync, writeFileSync } from 'node:fs'
const d = 'dist-web'
if (existsSync(`${d}/app.html`)) rmSync(`${d}/app.html`)
renameSync(`${d}/index.html`, `${d}/app.html`)
copyFileSync(`${d}/welcome.html`, `${d}/index.html`)
// never ship a _redirects file: the assets runtime auto-serves clean URLs and
// rewrite rules here have produced redirect loops. Belt and braces:
if (existsSync(`${d}/_redirects`)) rmSync(`${d}/_redirects`)
/* robots.txt and sitemap.xml are WEB-ONLY, so they are written here rather
   than kept in public/. Vite copies everything in public/ into EVERY build,
   and a clinic's sealed offline folder was being handed a sitemap naming a
   public URL and a robots file telling crawlers that will never see it what
   not to crawl. Harmless, and still wrong to ship. */
const CANON = 'https://nuskho.larkode.com'
writeFileSync(`${d}/robots.txt`, `# Nuskho. The front door is indexable; nothing else here is meant to be
# found by search. /app is the practice copy of the clinical app itself: it
# holds no real patients and clears itself, but it is a tool, not a page, and
# a doctor searching for Nuskho should land on the welcome page instead.
User-agent: *
Allow: /$
Disallow: /app
Disallow: /login.html
Disallow: /c/
Disallow: /hb
Disallow: /sa

Sitemap: ${CANON}/sitemap.xml
`)
writeFileSync(`${d}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<!-- One page. The workers.dev address serves the same bytes so no link
     already sent breaks, and is deliberately not listed. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${CANON}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`)
console.log('[weblayout] front door = welcome, app at /app, robots + sitemap written')
