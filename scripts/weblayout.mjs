// Runs after the WEB build only (see package.json). The public site's front
// door is the welcome page, so it becomes the physical index.html, and the app
// itself moves to app.html, served at /app by the host's clean-URL handling.
// Physical files, no redirect rules: every host serves them the same way.
// The CLINIC build (dist/) is untouched; its index.html stays the app.
import { renameSync, copyFileSync, existsSync, rmSync } from 'node:fs'
const d = 'dist-web'
if (existsSync(`${d}/app.html`)) rmSync(`${d}/app.html`)
renameSync(`${d}/index.html`, `${d}/app.html`)
copyFileSync(`${d}/welcome.html`, `${d}/index.html`)
// never ship a _redirects file: the assets runtime auto-serves clean URLs and
// rewrite rules here have produced redirect loops. Belt and braces:
if (existsSync(`${d}/_redirects`)) rmSync(`${d}/_redirects`)
console.log('[weblayout] front door = welcome, app at /app')
