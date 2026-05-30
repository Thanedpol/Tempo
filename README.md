# Tempo AI Hub — self-hosted

Replaces the Base44 backend with **Next.js + Supabase + Playwright**. The original React frontend
(pages, components, styling) is reused unchanged. Only the API surface and auth were rewritten.

## What's where

| Path                                | What it does                                                            |
|-------------------------------------|-------------------------------------------------------------------------|
| `src/`                              | Original React Router SPA — reused as-is.                               |
| `src/api/base44Client.js`           | **Rewritten** — same surface (`base44.entities.X`, `auth.me`…) hitting our API. |
| `src/lib/AuthContext.jsx`           | **Rewritten** — drives off Supabase, exposes the same hook.             |
| `app/[[...slug]]/`                  | Catch-all that mounts the SPA client-side.                              |
| `app/login/`, `app/auth/callback/`  | Real Next.js pages for Supabase Auth.                                   |
| `app/api/auth/me/`                  | Returns the current user (`{id,email,role,…}`).                         |
| `app/api/entities/[entity]/…`       | CRUD for Event / Booking / HotelBooking / AISession / Notification.     |
| `app/api/functions/askAIWith*`      | OpenRouter and Ollama proxies (preserve the original payload shape).    |
| `app/api/functions/scrape*`         | Five Playwright + Cheerio + LLM scrapers (TheConcert, Ticketmelon, TTM, Agoda, Booking.com). |
| `app/api/functions/invokeLLM/`      | Generic AI extraction endpoint used by scrapers.                        |
| `app/api/integrations/uploadFile/`  | Multipart upload → Supabase Storage `uploads` bucket → returns a public URL. |
| `lib/server/`                       | Server-only helpers (Supabase clients, guards, LLM router, scraper logic). |
| `supabase/schema.sql`               | Database schema, RLS policies, storage bucket + policies, triggers.     |

## One-time setup

### 1. Supabase project

1. Create a project at <https://supabase.com>.
2. **SQL Editor** → paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) → Run.
3. **Authentication → Providers**
   - Enable **Email** (magic link works out of the box).
   - Enable **Google** and paste your OAuth client ID/secret (Google Cloud Console → OAuth consent + credentials).
4. **Authentication → URL Configuration**
   - **Site URL**: `http://localhost:3000` (production: your real URL).
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` (and the production one too).
5. **Settings → API** → copy the **Project URL**, **anon public key**, and **service_role key** into `.env.local`.

### 2. Local install

```bash
cd tempo-ai-hub-next
cp .env.example .env.local      # then fill in real values
npm install                     # also runs `playwright install chromium`
npm run dev                     # http://localhost:3000
```

### 3. AI provider

OpenRouter is the default. Get a free key at <https://openrouter.ai/keys> and paste into
`OPENROUTER_API_KEY`. You can switch providers by setting `LLM_PROVIDER=openai` or `gemini`
and the matching key.

### 4. Make yourself admin

Admin role is required to run scrapers and edit the public Event catalogue. After your first sign-in:

```sql
-- run in Supabase SQL Editor
update public.app_users set role = 'admin' where email = 'you@example.com';
```

## How auth flows now

```
Browser (SPA)                                Next.js                          Supabase
     │                                          │                                 │
     │  click "Continue with Google"            │                                 │
     ├─────────────────────────────────────────►│  /login (real Next page)        │
     │                                          ├──signInWithOAuth──────────────► │
     │ ◄─────────── redirect to Google ──────── │                                 │
     │  …Google consent…                                                          │
     │ ──redirect──► /auth/callback?code=…      │                                 │
     │                                          ├──exchangeCodeForSession──────► │
     │ ◄────── 302 → returnTo ──────────────────│                                 │
     │                                          │                                 │
     │  SPA boots, useAuth() runs               │                                 │
     │  fetch /api/auth/me ─────────────────►   │  reads Supabase cookies        │
     │ ◄────────────── { user } ─────────────── │                                 │
```

All entity calls (`base44.entities.Event.list()` etc.) go through `fetch('/api/entities/events', { credentials: 'include' })`. The Next.js middleware refreshes the Supabase session cookie on every request, so route handlers always see a fresh user.

## Scrapers

Each scraper does:
1. `chromium.launch()` (Playwright) → fully rendered HTML.
2. Cheerio strips `<script>/<style>/<nav>` and caps the document to ~40 KB.
3. The configured LLM converts the distilled HTML to structured JSON matching our entity schema.
4. Service-role Supabase client `insert()`s into `events` or `hotel_bookings`.

Only admins can invoke them. They're hard-coded to the listing URL of each site — adjust in
`app/api/functions/scrape*/route.ts` if the source structure changes.

> Note: `playwright install chromium` runs as a post-install. On hosts that don't allow this
> (some serverless platforms), use Playwright's hosted browser endpoint or run scrapers from a
> separate worker.

## Deploying

- **Vercel** works for everything *except* the scrapers (Playwright needs a real Chromium
  binary, which is too big for Vercel functions). For production, deploy the scrapers on a
  long-running Node host (Fly.io / Railway / a VPS) and call them as an external service, or use
  `@sparticuz/chromium` if you really must run them inside a Lambda.
- Set the same env vars in your hosting platform. Don't forget `SUPABASE_SERVICE_ROLE_KEY`
  (server-only).
- Update `NEXT_PUBLIC_APP_URL` and the Supabase **Site URL / Redirect URLs** to match the
  production domain.

## Known gaps vs. the original Base44 app

- `app_public_settings` endpoint — replaced with a static stub (`{ id: 'tempo-ai-hub' }`); the SPA
  doesn't actually need anything from it.
- "User not registered" flow — Supabase Auth lets anyone sign in; if you want a closed beta,
  add an `allowlist` check inside `app/auth/callback/route.ts`.
- Real-time notifications — easy to add via `supabase.channel(...)` if/when needed.

## Commands

```bash
npm run dev        # next dev (http://localhost:3000)
npm run build      # production build
npm run start      # serve the build
npm run lint
```
