-- Neggy Clicker database setup.
-- Paste this whole file into Supabase: SQL Editor -> New query -> Run.
-- Safe to run more than once.

-- One profile per player, created automatically when they sign up.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Players can read their own profile" on public.profiles;
create policy "Players can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(new.raw_user_meta_data ->> 'username'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One cloud save per player. Only the owner can read or write it.
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  total_neggys double precision not null default 0 check (total_neggys >= 0),
  rebirths integer not null default 0 check (rebirths >= 0),
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

drop policy if exists "Players can read their own save" on public.saves;
create policy "Players can read their own save"
  on public.saves for select
  using (auth.uid() = user_id);

drop policy if exists "Players can create their own save" on public.saves;
create policy "Players can create their own save"
  on public.saves for insert
  with check (auth.uid() = user_id);

drop policy if exists "Players can update their own save" on public.saves;
create policy "Players can update their own save"
  on public.saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public leaderboard: only username and scores, never the full save.
create or replace view public.leaderboard as
  select p.username, s.total_neggys, s.rebirths, s.updated_at
  from public.saves s
  join public.profiles p on p.id = s.user_id
  order by s.total_neggys desc
  limit 100;

grant select on public.leaderboard to anon, authenticated;
