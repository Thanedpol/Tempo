-- =====================================================================
-- Tempo AI Hub — Supabase schema
-- Run this in Supabase SQL Editor (or `supabase db push`) ONCE per project.
-- =====================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- App users (profile table; mirrors auth.users one-to-one)
-- Triggered on every new sign-up so we always have a profile row.
-- ---------------------------------------------------------------------
create table if not exists public.app_users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  full_name    text,
  role         text not null default 'user' check (role in ('user', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Helper: is_admin(uid)
-- ---------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_users where id = uid and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- Generic timestamps trigger
-- ---------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- =====================================================================
-- Event (public catalogue; writeable by admins)
-- =====================================================================
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  artist          text not null,
  genre           text check (genre in ('rock','pop','hip-hop','electronic','jazz','classical','k-pop','indie','metal','other')),
  venue           text not null,
  city            text,
  date            date not null,
  time            text,
  image_url       text,
  source_platform text check (source_platform in ('TTM','Ticketmelon','Eventpop','Other')),
  source_url      text,
  status          text default 'upcoming' check (status in ('upcoming','on_sale','sold_out','cancelled')),
  zones           jsonb not null default '[]'::jsonb,
  description     text,
  tags            text[] default '{}',
  created_by      uuid references auth.users(id) on delete set null,
  created_date    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists events_date_idx on public.events(date desc);
create index if not exists events_created_date_idx on public.events(created_date desc);
drop trigger if exists tg_events_updated_at on public.events;
create trigger tg_events_updated_at before update on public.events
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- Hotel booking (catalogue + per-user bookings unified — keep simple)
-- =====================================================================
create table if not exists public.hotel_bookings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  booking_id        text,
  hotel_name        text not null,
  hotel_image       text,
  check_in          date not null,
  check_out         date not null,
  room_type         text not null,
  price_per_night   numeric,
  total_price       numeric,
  distance_to_venue text,
  status            text default 'pending' check (status in ('pending','confirmed','cancelled')),
  source            text check (source in ('Agoda','Booking.com','Other')),
  source_url        text,
  address           text,
  rating            numeric,
  amenities         text[] default '{}',
  event_id          uuid references public.events(id) on delete set null,
  created_date      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists hotel_bookings_user_idx on public.hotel_bookings(user_id);
create index if not exists hotel_bookings_created_idx on public.hotel_bookings(created_date desc);
drop trigger if exists tg_hotel_bookings_updated_at on public.hotel_bookings;
create trigger tg_hotel_bookings_updated_at before update on public.hotel_bookings
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- Booking (concert tickets per user)
-- =====================================================================
create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  event_id          uuid references public.events(id) on delete set null,
  event_title       text not null,
  event_date        text,
  venue             text,
  zone              text not null,
  quantity          integer not null default 1,
  total_price       numeric,
  status            text default 'pending' check (status in ('pending','payment_required','confirmed','cancelled','used')),
  ticket_code       text,
  qr_data           text,
  payment_method    text,
  hotel_booking_id  uuid references public.hotel_bookings(id) on delete set null,
  ai_session_id     uuid,
  notes             text,
  calendar_synced   boolean default false,
  wallet_added      boolean default false,
  created_date      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists bookings_user_idx on public.bookings(user_id);
create index if not exists bookings_created_idx on public.bookings(created_date desc);
drop trigger if exists tg_bookings_updated_at on public.bookings;
create trigger tg_bookings_updated_at before update on public.bookings
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- AI session (chat history per user)
-- =====================================================================
create table if not exists public.ai_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  session_id    text not null,
  messages      jsonb not null default '[]'::jsonb,
  status        text default 'active' check (status in ('active','waiting_captcha','waiting_payment','completed','error')),
  current_task  text,
  found_events  text[] default '{}',
  preferences   jsonb default '{}'::jsonb,
  created_date  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists ai_sessions_user_idx on public.ai_sessions(user_id);
create index if not exists ai_sessions_session_idx on public.ai_sessions(session_id);
drop trigger if exists tg_ai_sessions_updated_at on public.ai_sessions;
create trigger tg_ai_sessions_updated_at before update on public.ai_sessions
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- Notification
-- =====================================================================
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  message       text not null,
  type          text not null check (type in ('event_found','ticket_held','payment_required','captcha_required','booking_confirmed','reminder','alert')),
  is_read       boolean default false,
  action_url    text,
  event_id      uuid references public.events(id) on delete set null,
  booking_id    uuid references public.bookings(id) on delete set null,
  priority      text default 'medium' check (priority in ('low','medium','high','urgent')),
  created_date  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_created_idx on public.notifications(created_date desc);

-- =====================================================================
-- Row-Level Security
-- =====================================================================
alter table public.app_users       enable row level security;
alter table public.events          enable row level security;
alter table public.bookings        enable row level security;
alter table public.hotel_bookings  enable row level security;
alter table public.ai_sessions     enable row level security;
alter table public.notifications   enable row level security;

-- app_users: each user reads own profile; admin reads all
drop policy if exists "users read own profile" on public.app_users;
create policy "users read own profile" on public.app_users
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "users update own profile" on public.app_users;
create policy "users update own profile" on public.app_users
  for update using (auth.uid() = id);

-- events: public read; admin write
drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events for select using (true);

drop policy if exists "events admin write" on public.events;
create policy "events admin write" on public.events
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- bookings: owner only; admin all
drop policy if exists "bookings owner read"   on public.bookings;
drop policy if exists "bookings owner insert" on public.bookings;
drop policy if exists "bookings owner update" on public.bookings;
drop policy if exists "bookings owner delete" on public.bookings;
create policy "bookings owner read"   on public.bookings for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "bookings owner insert" on public.bookings for insert with check (auth.uid() = user_id);
create policy "bookings owner update" on public.bookings for update using (auth.uid() = user_id);
create policy "bookings owner delete" on public.bookings for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- hotel_bookings: catalogue rows (no user_id) are public-read; user rows are owner-only
drop policy if exists "hotel_bookings read"   on public.hotel_bookings;
drop policy if exists "hotel_bookings insert" on public.hotel_bookings;
drop policy if exists "hotel_bookings update" on public.hotel_bookings;
drop policy if exists "hotel_bookings delete" on public.hotel_bookings;
create policy "hotel_bookings read"   on public.hotel_bookings for select using (user_id is null or auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "hotel_bookings insert" on public.hotel_bookings for insert with check (auth.uid() = user_id or user_id is null);
create policy "hotel_bookings update" on public.hotel_bookings for update using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "hotel_bookings delete" on public.hotel_bookings for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ai_sessions: owner only
drop policy if exists "ai owner all" on public.ai_sessions;
create policy "ai owner all" on public.ai_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notifications: owner only
drop policy if exists "notif owner all" on public.notifications;
create policy "notif owner all" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- Storage bucket for uploads
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads public read" on storage.objects;
create policy "uploads public read" on storage.objects
  for select using (bucket_id = 'uploads');

drop policy if exists "uploads auth insert" on storage.objects;
create policy "uploads auth insert" on storage.objects
  for insert with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

drop policy if exists "uploads owner delete" on storage.objects;
create policy "uploads owner delete" on storage.objects
  for delete using (bucket_id = 'uploads' and auth.uid() = owner);
