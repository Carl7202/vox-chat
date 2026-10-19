-- GUITAR LAB practice history. Safe to run more than once.
create table if not exists public.guitar_practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity text not null check (activity in ('chords','riffs','timing','scales','ear','speed','lesson')),
  score integer not null default 0 check (score between 0 and 100),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists guitar_practice_logs_user_created_idx on public.guitar_practice_logs(user_id, created_at desc);
alter table public.guitar_practice_logs enable row level security;
drop policy if exists "Users can read own guitar practice" on public.guitar_practice_logs;
create policy "Users can read own guitar practice" on public.guitar_practice_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own guitar practice" on public.guitar_practice_logs;
create policy "Users can insert own guitar practice" on public.guitar_practice_logs for insert to authenticated with check ((select auth.uid()) = user_id);
revoke all on table public.guitar_practice_logs from anon;
grant select, insert on table public.guitar_practice_logs to authenticated;
