#!/usr/bin/env node
/**
 * Conditional postinstall:
 *   - On local dev (no CI/Vercel env): install Playwright Chromium so scrapers work.
 *   - On Vercel / GitHub Actions / generic CI: skip Chromium (too large for serverless
 *     functions, would also slow CI builds significantly). Scrapers won't work in
 *     those environments anyway — deploy them on a real Node host (Fly.io, Railway, VPS).
 *
 * To force the install anyway: `SKIP_PLAYWRIGHT_INSTALL=false node scripts/postinstall.mjs`
 */
import { spawnSync } from 'node:child_process';

const isVercel  = !!process.env.VERCEL;
const isCI      = process.env.CI === 'true' || process.env.CI === '1';
const explicit  = process.env.SKIP_PLAYWRIGHT_INSTALL;

const shouldSkip = explicit === 'true' || (explicit !== 'false' && (isVercel || isCI));

if (shouldSkip) {
  const why = isVercel ? 'Vercel' : isCI ? 'CI' : 'env';
  console.log(`[postinstall] Skipping Playwright Chromium download (${why} detected).`);
  console.log('[postinstall] Scrapers won\'t work in this environment — deploy them on a Node host.');
  process.exit(0);
}

console.log('[postinstall] Installing Playwright Chromium for local dev…');
const result = spawnSync('npx', ['playwright', 'install', 'chromium'], { stdio: 'inherit', shell: true });
process.exit(result.status ?? 0);
