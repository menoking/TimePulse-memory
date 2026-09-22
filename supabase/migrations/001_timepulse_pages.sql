-- TimePulse Memory: one public page per slug, anonymous read and owner-only write.
create table if not exists public.timepulse_pages (
  slug text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{"schemaVersion":1,"timers":[]}'::jsonb,
  is_public boolean not null default false,
  version bigint not null default 1 check (version > 0),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.timepulse_pages enable row level security;

revoke all on table public.timepulse_pages from anon, authenticated;
grant select on table public.timepulse_pages to anon, authenticated;
grant insert, update, delete on table public.timepulse_pages to authenticated;

drop policy if exists "Public pages are readable" on public.timepulse_pages;
create policy "Public pages are readable"
on public.timepulse_pages
for select
to anon
using (is_public = true);

drop policy if exists "Owners can read their pages" on public.timepulse_pages;
create policy "Owners can read their pages"
on public.timepulse_pages
for select
to authenticated
using (is_public = true or (select auth.uid()) = owner_id);

drop policy if exists "Owners can create their pages" on public.timepulse_pages;
create policy "Owners can create their pages"
on public.timepulse_pages
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update their pages" on public.timepulse_pages;
create policy "Owners can update their pages"
on public.timepulse_pages
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can delete their pages" on public.timepulse_pages;
create policy "Owners can delete their pages"
on public.timepulse_pages
for delete
to authenticated
using ((select auth.uid()) = owner_id);

