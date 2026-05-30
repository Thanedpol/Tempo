# Deployment

## Vercel (recommended for everything EXCEPT the scrapers)

### 1. Connect the repo
1. Go to <https://vercel.com/new>
2. Import `Thanedpol/Tempo`
3. **Framework Preset**: Next.js (auto-detected)
4. **Build Command**: `next build` (default)
5. **Install Command**: `npm install` (default)
6. **Root Directory**: `./` (the repo root is already the Next.js project)

### 2. Environment Variables — set these in Vercel project settings

| Var | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`        | ✅ for real auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | ✅ for real auth | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY`       | ✅ for admin writes | server-only |
| `NEXT_PUBLIC_APP_URL`             | ✅ | e.g. `https://tempo.vercel.app` |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH`     | ⚠️ leave UNSET / `false` in prod | otherwise everyone becomes admin |
| `LLM_PROVIDER`                    | optional | `openrouter` / `openai` / `anthropic` / `gemini` |
| `OPENROUTER_API_KEY`              | for AI chat | |
| `OPENAI_API_KEY`                  | optional | |
| `ANTHROPIC_API_KEY`               | optional | |
| `GEMINI_API_KEY`                  | optional | |
| `AGODA_AFFILIATE_ID`              | for revenue | |
| `BOOKING_AFFILIATE_ID`            | for revenue | |
| `KLOOK_AFFILIATE_ID`              | for revenue | |
| `SKIP_PLAYWRIGHT_INSTALL`         | already auto-set to `true` on Vercel | |

### 3. Common build errors and fixes

**Error: `'next' is not recognized`**
- Cause: install step failed silently
- Fix: redeploy; check `Install Command` is `npm install`

**Error: `Module not found: Can't resolve 'playwright'`**
- Cause: scraper route imported playwright at module-load time
- Status: ✅ already fixed — playwright is now lazy-imported inside `fetchRenderedHTML`
- Scrapers still throw a clear error at *runtime* when called (Playwright binary isn't on Vercel)

**Error: `Function size exceeds 50 MB`**
- Cause: bundled too much into one serverless function
- Fix: scraper routes excluded; if it recurs, check `vercel.json` function patterns

**Error: page renders blank / 500**
- Cause: missing env vars at runtime
- Fix: set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or set `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` (dev only!)

### 4. After first deploy

Set Supabase auth redirect URL:
- Authentication → URL Configuration → add `https://YOUR-DOMAIN.vercel.app/auth/callback`

Run the schema migration:
- `supabase/schema.sql` → paste into Supabase SQL Editor → Run

Promote your account to admin:
```sql
update public.app_users set role = 'admin' where email = 'you@example.com';
```

---

## Scrapers — separate host

The scrapers use Playwright + Chromium (~300 MB binary). They CANNOT run on Vercel's
serverless functions. Options:

### Option A — Railway / Fly.io / Render / VPS (recommended)
Deploy the same repo on one of these as a long-running Node process:
```bash
npm install                # installs Playwright + Chromium
npm run build
npm run start              # serves the same API, scrapers actually work
```
Then call the scraper endpoint from Vercel via webhook (e.g. cron):
```
POST https://scrapers.your-host.com/api/admin/sync
Body: { "source": "ticketmelon" }
```

### Option B — `@sparticuz/chromium` (still Vercel)
Replace `playwright` with `playwright-core` + `@sparticuz/chromium` — fits within
Vercel's 50 MB function limit. Slower cold start, more memory. Edit `lib/server/scrape.ts`:
```ts
import chromium from '@sparticuz/chromium';
import { chromium as playwright } from 'playwright-core';
const browser = await playwright.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

### Option C — drop scrapers
The Ticketmelon scraper doesn't use Playwright at all — it hits a public JSON API
directly. If you don't need TTM/Eventpop/Agoda/Booking scraping, you can deploy
to Vercel without any extra setup. Just disable those sources in `/settings` →
Crawler.

---

## GitHub Actions

`.github/workflows/ci.yml` builds + lints on every push and pull request.
- ✅ uses Node 20
- ✅ skips Playwright install (`SKIP_PLAYWRIGHT_INSTALL=true`)
- ✅ injects placeholder env vars so build doesn't crash on import

Add real secrets in **Settings → Secrets and variables → Actions** if your CI
needs to run integration tests later.
