-- VOX optional persistent schema for Supabase (PostgreSQL).
-- Run in Supabase SQL Editor. Do not put service_role keys in the client.
create extension if not exists pgcrypto;

create table if not exists public.vox_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9_-]{1,40}$'),
  title text not null default 'General',
  created_at timestamptz not null default now()
);

create table if not exists public.vox_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.vox_rooms(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists vox_messages_room_created_idx
  on public.vox_messages(room_id, created_at desc);

alter table public.vox_rooms enable row level security;
alter table public.vox_messages enable row level security;

-- Starter read access for demo room discovery/history.
drop policy if exists "VOX rooms readable" on public.vox_rooms;
create policy "VOX rooms readable" on public.vox_rooms for select to anon, authenticated using (true);
drop policy if exists "VOX rooms can be created" on public.vox_rooms;
create policy "VOX rooms can be created" on public.vox_rooms for insert to anon, authenticated with check (slug ~ '^[a-z0-9_-]{1,40}$');

drop policy if exists "VOX messages readable" on public.vox_messages;
create policy "VOX messages readable" on public.vox_messages for select to anon, authenticated using (true);
drop policy if exists "VOX messages can be sent" on public.vox_messages;
create policy "VOX messages can be sent" on public.vox_messages for insert to anon, authenticated with check (char_length(display_name) between 1 and 24 and char_length(body) between 1 and 1000);

grant select, insert on public.vox_rooms to anon, authenticated;
grant select, insert on public.vox_messages to anon, authenticated;
