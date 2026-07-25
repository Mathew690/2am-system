-- The 2AM System — waitlist capture.
-- Run this once in the Supabase SQL editor (same project as ClipScry is fine).

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,                      -- 'site' | 'ig' | etc, so we can tell where signups came from
  building text,                    -- optional: what they said they're building
  created_at timestamptz not null default now()
);

-- one row per email, case-insensitive
create unique index if not exists waitlist_email_unique
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

-- Anonymous visitors may ONLY insert. Nobody can read the list from the browser,
-- so the email list can't be scraped with the public key.
-- (No DROP here on purpose: nothing in this script removes anything. If you ever
-- re-run it, the policy line will simply error with "already exists" — harmless.)
create policy "anon can join waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);
