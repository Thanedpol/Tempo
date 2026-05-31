# Tempo AI Hub — self-hosted

**[🇬🇧 English](#english) · [🇹🇭 ภาษาไทย](#thai)**

<a id="english"></a>

## 🇬🇧 English

> 🇹🇭 อ่านภาษาไทย → [ภาษาไทย](#thai)

**Tempo** is an AI concierge for live events in Thailand — find concerts, buy tickets, and book a
place to stay near the venue, all in one chat-first app, instead of juggling several websites.

### Who it's for
- **Gen Z & Gen Y** in Thailand (students / early-career) who live on their phones
- **K-Pop & T-Pop fans** chasing fast-selling shows
- **Event tourists** travelling for a concert who also need a place to stay nearby

### Problems we set out to solve
The pain points of buying concert tickets in Thailand today:
1. Crashes / getting kicked out of the payment page
2. Money charged but no ticket received
3. Scalper bots sweeping tickets & resale-market fraud
4. Hidden fees / opaque pricing
5. Weak security & bot protection
6. Unclear contracts — postponement / cancellation / member pre-sale rights
7. Slow ticket delivery & hard-to-reach customer support

### Why Tempo / benefits
- 🤖 **An AI assistant does the work** — say what you want; it searches, compares and recommends
- 💸 **Transparent pricing** — ticket + fee + total shown before you pay
- 🏨 **Ticket + nearby stay in one place** — ideal for fans travelling to a show
- 🛡️ **Trustworthy by design** *(in progress)* — resilient payments, anti-bot, fair refunds, reliable delivery

> **Status:** a working **MVP / demo** — strong on audience & vision; most data is still mock and
> several trust features are on the roadmap. See [`docs/GAP_ANALYSIS_AND_ROADMAP.md`](./docs/GAP_ANALYSIS_AND_ROADMAP.md).

### Tech stack
Replaces the Base44 backend with **Next.js + Supabase + Playwright**. The original React frontend
(pages, components, styling) is reused unchanged. Only the API surface and auth were rewritten.

### What's where

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
| `app/api/payments/…`                | Payment foundation: create / status / confirm (demo) / webhook (Omise · Stripe · demo). |
| `lib/server/`                       | Server-only helpers (Supabase clients, guards, LLM router, scraper logic, payments). |
| `supabase/schema.sql`               | Database schema, RLS policies, storage bucket + policies, triggers.     |
| `docs/GAP_ANALYSIS_AND_ROADMAP.md`  | Product gap analysis vs. the 7 ticket pain points + phased roadmap.     |

### One-time setup

#### 1. Supabase project

1. Create a project at <https://supabase.com>.
2. **SQL Editor** → paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) → Run.
3. **Authentication → Providers**
   - Enable **Email** (magic link works out of the box).
   - Enable **Google** and paste your OAuth client ID/secret (Google Cloud Console → OAuth consent + credentials).
4. **Authentication → URL Configuration**
   - **Site URL**: `http://localhost:3000` (production: your real URL).
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` (and the production one too).
5. **Settings → API** → copy the **Project URL**, **anon public key**, and **service_role key** into `.env.local`.

#### 2. Local install

```bash
cd tempo-ai-hub-next
cp .env.example .env.local      # then fill in real values
npm install                     # also runs `playwright install chromium`
npm run dev                     # http://localhost:3000
```

#### 3. AI provider

OpenRouter is the default. Get a free key at <https://openrouter.ai/keys> and paste into
`OPENROUTER_API_KEY`. You can switch providers by setting `LLM_PROVIDER=openai` or `gemini`
and the matching key.

#### 4. Make yourself admin

Admin role is required to run scrapers and edit the public Event catalogue. After your first sign-in:

```sql
-- run in Supabase SQL Editor
update public.app_users set role = 'admin' where email = 'you@example.com';
```

### How auth flows now

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

### Scrapers

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

### Payments

`/api/payments/*` + `lib/server/payments.ts` provide a provider-agnostic charge lifecycle with
**idempotency** and **reconciliation** (directly targeting "system crash on payment" and
"charged but no ticket"). The provider is picked from env at runtime:

- **Omise** (recommended for Thailand — PromptPay + cards) when `OMISE_SECRET_KEY` is set.
- **Stripe** (international cards) when `STRIPE_SECRET_KEY` is set.
- **demo** (full flow, NO real charge) when neither is set — great for local testing.

After deploy, point the provider webhook at `/api/payments/webhook?provider=omise` (or `stripe`).
This is a foundation: production still needs a `payments` table, real card tokens, and webhook
signature verification (see [`docs/GAP_ANALYSIS_AND_ROADMAP.md`](./docs/GAP_ANALYSIS_AND_ROADMAP.md)).

### Deploying

- **Vercel** works for everything *except* the scrapers (Playwright needs a real Chromium
  binary, which is too big for Vercel functions). For production, deploy the scrapers on a
  long-running Node host (Fly.io / Railway / a VPS) and call them as an external service, or use
  `@sparticuz/chromium` if you really must run them inside a Lambda.
- Set the same env vars in your hosting platform. Don't forget `SUPABASE_SERVICE_ROLE_KEY`
  (server-only).
- Update `NEXT_PUBLIC_APP_URL` and the Supabase **Site URL / Redirect URLs** to match the
  production domain.

### Known gaps vs. the original Base44 app

- `app_public_settings` endpoint — replaced with a static stub (`{ id: 'tempo-ai-hub' }`); the SPA
  doesn't actually need anything from it.
- "User not registered" flow — Supabase Auth lets anyone sign in; if you want a closed beta,
  add an `allowlist` check inside `app/auth/callback/route.ts`.
- Real-time notifications — easy to add via `supabase.channel(...)` if/when needed.

### Commands

```bash
npm run dev        # next dev (http://localhost:3000)
npm run build      # production build
npm run start      # serve the build
npm run lint
```

---

<a id="thai"></a>

## 🇹🇭 ภาษาไทย

> 🇬🇧 Read in English → [English](#english)

**Tempo** คือผู้ช่วยอัจฉริยะ (Agentic AI) สำหรับงานคอนเสิร์ต/อีเวนต์ในไทย — ช่วย **ค้นหางาน → ซื้อตั๋ว →
จองที่พักใกล้สถานที่จัดงาน** จบในแอปเดียวแบบแชต แทนที่จะต้องเปิดหลายเว็บและจัดการเองทีละขั้น

### ทำเพื่อใคร
- **Gen Z และ Gen Y** ในไทย (นักศึกษา / วัยทำงานตอนต้น) ที่ใช้มือถือเป็นหลัก
- **แฟน K-Pop / T-Pop** ที่ต้องลุ้นตั๋วรอบที่ขายหมดไว
- **นักท่องเที่ยวสาย Event** ที่เดินทางมาดูงานและต้องการที่พักใกล้ ๆ

### แก้ปัญหาอะไร
Pain points ของการซื้อตั๋วคอนเสิร์ตในไทยทุกวันนี้:
1. ระบบล่ม / เด้งออกจากหน้าชำระเงิน
2. ตัดเงินสำเร็จแต่ไม่ได้รับตั๋ว
3. มิจฉาชีพ/บอทกวาดตั๋ว และการโกงในตลาดรอง
4. ความไม่โปร่งใสเรื่องราคา (ค่าธรรมเนียมแฝง)
5. ระบบความปลอดภัย/ป้องกันบอทอ่อนแอ
6. ข้อสัญญา การเลื่อน/ยกเลิกงาน และสิทธิ์สมาชิกพิเศษไม่ชัดเจน
7. การจัดส่งตั๋วล่าช้า และติดต่อฝ่ายสนับสนุนยาก

### ทำไมต้อง Tempo / ประโยชน์
- 🤖 **มีผู้ช่วย AI ทำงานให้** — บอกความต้องการเป็นภาษาคน แล้ว AI ค้นหา/เปรียบเทียบ/แนะนำให้
- 💸 **ราคาโปร่งใส** — เห็นราคาบัตร + ค่าธรรมเนียม + ยอดรวม ก่อนกดจ่าย
- 🏨 **ตั๋ว + ที่พักใกล้งาน จบที่เดียว** — เหมาะกับแฟนเพลงที่เดินทางมาดูงาน
- 🛡️ **น่าเชื่อถือตั้งแต่ออกแบบ** *(กำลังพัฒนา)* — จ่ายเงินทนทาน, กันบอท, คืนเงินเป็นธรรม, ส่งตั๋วชัวร์

> **สถานะ:** เป็น **MVP / Demo ที่ใช้งานได้** — ตอบกลุ่มเป้าหมายและวิสัยทัศน์ได้ดี แต่ข้อมูลส่วนใหญ่ยังเป็น mock
> และฟีเจอร์ด้านความน่าเชื่อถือหลายอย่างยังอยู่ใน roadmap · ดู [`docs/GAP_ANALYSIS_AND_ROADMAP.md`](./docs/GAP_ANALYSIS_AND_ROADMAP.md)

### เทคโนโลยีที่ใช้
โปรเจกต์นี้แทนที่ backend เดิม (Base44) ด้วย **Next.js + Supabase + Playwright** โดย frontend ฝั่ง React เดิม
(หน้าเพจ, คอมโพเนนต์, สไตล์) ถูกนำกลับมาใช้แบบไม่แก้ — เขียนใหม่เฉพาะส่วน API และระบบยืนยันตัวตน (auth) เท่านั้น

### มีอะไรอยู่ตรงไหน

| Path                                | หน้าที่                                                                  |
|-------------------------------------|-------------------------------------------------------------------------|
| `src/`                              | React Router SPA ตัวเดิม — ใช้ตามเดิม                                    |
| `src/api/base44Client.js`           | **เขียนใหม่** — interface เดิม (`base44.entities.X`, `auth.me`…) แต่ยิงเข้า API ของเรา |
| `src/lib/AuthContext.jsx`           | **เขียนใหม่** — ทำงานบน Supabase โดยเปิด hook ตัวเดิมไว้                 |
| `app/[[...slug]]/`                  | Catch-all route ที่โหลด SPA ขึ้นมาฝั่ง client                            |
| `app/login/`, `app/auth/callback/`  | หน้าเพจ Next.js จริงสำหรับ Supabase Auth                                 |
| `app/api/auth/me/`                  | คืนค่าผู้ใช้ปัจจุบัน (`{id,email,role,…}`)                               |
| `app/api/entities/[entity]/…`       | CRUD สำหรับ Event / Booking / HotelBooking / AISession / Notification    |
| `app/api/functions/askAIWith*`      | Proxy ไป OpenRouter และ Ollama (คงรูปแบบ payload เดิม)                   |
| `app/api/functions/scrape*`         | Scraper 5 ตัว (Playwright + Cheerio + LLM): TheConcert, Ticketmelon, TTM, Agoda, Booking.com |
| `app/api/functions/invokeLLM/`      | Endpoint สกัดข้อมูลด้วย AI แบบทั่วไป ใช้โดย scraper                       |
| `app/api/integrations/uploadFile/`  | อัปโหลดไฟล์ → Supabase Storage bucket `uploads` → คืน public URL          |
| `app/api/payments/…`                | รากฐานระบบชำระเงิน: create / status / confirm (demo) / webhook (Omise · Stripe · demo) |
| `lib/server/`                       | Helper ฝั่งเซิร์ฟเวอร์เท่านั้น (Supabase clients, guards, LLM router, scraper, payments) |
| `supabase/schema.sql`               | สคีมาฐานข้อมูล, RLS policy, storage bucket + policy, trigger             |
| `docs/GAP_ANALYSIS_AND_ROADMAP.md`  | วิเคราะห์ช่องว่างของผลิตภัณฑ์เทียบปัญหาตั๋ว 7 ข้อ + แผนพัฒนาแบบเป็นเฟส     |

### การตั้งค่าครั้งแรก (ทำครั้งเดียว)

#### 1. โปรเจกต์ Supabase

1. สร้างโปรเจกต์ที่ <https://supabase.com>
2. **SQL Editor** → วางเนื้อหาของ [`supabase/schema.sql`](./supabase/schema.sql) → กด Run
3. **Authentication → Providers**
   - เปิด **Email** (magic link ใช้ได้ทันที)
   - เปิด **Google** แล้ววาง OAuth client ID/secret (จาก Google Cloud Console → OAuth consent + credentials)
4. **Authentication → URL Configuration**
   - **Site URL**: `http://localhost:3000` (production: ใส่ URL จริงของคุณ)
   - **Redirect URLs**: เพิ่ม `http://localhost:3000/auth/callback` (และของ production ด้วย)
5. **Settings → API** → คัดลอก **Project URL**, **anon public key** และ **service_role key** ไปใส่ใน `.env.local`

#### 2. ติดตั้งบนเครื่อง

```bash
cd tempo-ai-hub-next
cp .env.example .env.local      # then fill in real values
npm install                     # also runs `playwright install chromium`
npm run dev                     # http://localhost:3000
```

#### 3. ผู้ให้บริการ AI

ค่าเริ่มต้นคือ OpenRouter — ขอ key ฟรีได้ที่ <https://openrouter.ai/keys> แล้วนำไปใส่ใน
`OPENROUTER_API_KEY` หากต้องการเปลี่ยนผู้ให้บริการ ตั้งค่า `LLM_PROVIDER=openai` หรือ `gemini`
พร้อมใส่ key ของผู้ให้บริการนั้น

#### 4. ตั้งตัวเองให้เป็น admin

ต้องมีสิทธิ์ admin จึงจะรัน scraper และแก้ไขแคตตาล็อก Event สาธารณะได้ หลังจากล็อกอินครั้งแรก:

```sql
-- run in Supabase SQL Editor
update public.app_users set role = 'admin' where email = 'you@example.com';
```

### ระบบ auth ทำงานอย่างไรตอนนี้

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

ทุกการเรียก entity (`base44.entities.Event.list()` ฯลฯ) จะผ่าน `fetch('/api/entities/events', { credentials: 'include' })`
และ middleware ของ Next.js จะรีเฟรช cookie เซสชันของ Supabase ในทุก request ทำให้ route handler เห็นผู้ใช้ที่อัปเดตเสมอ

### Scrapers

แต่ละ scraper ทำงานดังนี้:
1. `chromium.launch()` (Playwright) → ได้ HTML ที่เรนเดอร์ครบ
2. Cheerio ตัด `<script>/<style>/<nav>` ออก แล้วจำกัดเอกสารไว้ที่ ~40 KB
3. LLM ที่ตั้งค่าไว้แปลง HTML ที่กลั่นแล้วเป็น JSON ตามสคีมา entity ของเรา
4. Supabase client (service-role) `insert()` ลงตาราง `events` หรือ `hotel_bookings`

เฉพาะ admin เท่านั้นที่เรียกใช้ได้ และ scraper ถูกฮาร์ดโค้ดชี้ไปยัง URL หน้ารายการของแต่ละเว็บ — ถ้าโครงสร้างเว็บต้นทางเปลี่ยน
ให้แก้ใน `app/api/functions/scrape*/route.ts`

> หมายเหตุ: `playwright install chromium` จะรันตอน post-install บนโฮสต์ที่ไม่อนุญาตให้รันสิ่งนี้
> (เช่นบาง serverless platform) ให้ใช้บริการเบราว์เซอร์โฮสต์ของ Playwright หรือแยกรัน scraper บน worker ต่างหาก

### ระบบชำระเงิน (Payments)

`/api/payments/*` + `lib/server/payments.ts` ให้วงจรการชำระเงินที่ไม่ผูกกับผู้ให้บริการรายใดราย หนึ่ง พร้อม
**idempotency** และ **reconciliation** (แก้ปัญหา "ระบบล่มตอนจ่ายเงิน" และ "ตัดเงินแล้วไม่ได้ตั๋ว" โดยตรง)
โดยเลือกผู้ให้บริการจาก env ตอน runtime:

- **Omise** (แนะนำสำหรับไทย — PromptPay + บัตร) เมื่อมี `OMISE_SECRET_KEY`
- **Stripe** (บัตรต่างประเทศ) เมื่อมี `STRIPE_SECRET_KEY`
- **demo** (เดินครบทุกขั้น แต่ไม่ตัดเงินจริง) เมื่อไม่ได้ตั้งทั้งสองตัว — เหมาะกับการทดสอบในเครื่อง

หลัง deploy ให้ตั้ง webhook ของผู้ให้บริการชี้มาที่ `/api/payments/webhook?provider=omise` (หรือ `stripe`)
ทั้งนี้เป็นเพียง "รากฐาน" — ก่อนใช้ production ยังต้องมีตาราง `payments`, token บัตรจริง และการ verify ลายเซ็น webhook
(ดู [`docs/GAP_ANALYSIS_AND_ROADMAP.md`](./docs/GAP_ANALYSIS_AND_ROADMAP.md))

### การ Deploy

- **Vercel** ใช้ได้กับทุกอย่าง *ยกเว้น* scraper (Playwright ต้องใช้ Chromium จริงซึ่งใหญ่เกินไปสำหรับ
  Vercel functions) สำหรับ production ให้ deploy scraper บนโฮสต์ Node ที่รันได้ยาวๆ (Fly.io / Railway / VPS)
  แล้วเรียกเป็นบริการภายนอก หรือใช้ `@sparticuz/chromium` หากจำเป็นต้องรันใน Lambda จริงๆ
- ตั้งค่า env เดียวกันบนแพลตฟอร์มที่โฮสต์ อย่าลืม `SUPABASE_SERVICE_ROLE_KEY` (ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น)
- อัปเดต `NEXT_PUBLIC_APP_URL` และ **Site URL / Redirect URLs** ของ Supabase ให้ตรงกับโดเมน production

### ช่องว่างที่ต่างจากแอป Base44 เดิม

- Endpoint `app_public_settings` — แทนด้วย stub แบบคงที่ (`{ id: 'tempo-ai-hub' }`) เพราะ SPA ไม่ได้ใช้ค่าจากมันจริงๆ
- ขั้นตอน "User not registered" — Supabase Auth ให้ใครก็ล็อกอินได้ ถ้าต้องการทำ closed beta
  ให้เพิ่มการเช็ก `allowlist` ใน `app/auth/callback/route.ts`
- การแจ้งเตือนแบบ real-time — เพิ่มได้ง่ายผ่าน `supabase.channel(...)` เมื่อต้องการ

### คำสั่ง

```bash
npm run dev        # next dev (http://localhost:3000)
npm run build      # production build
npm run start      # serve the build
npm run lint
```
