-- Notes table
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  parent_id   uuid references public.notes(id) on delete cascade,
  node_id     uuid,
  title       text not null default '',
  content     text,
  is_folder   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes
create index if not exists notes_user_id_idx      on public.notes(user_id);
create index if not exists notes_parent_id_idx    on public.notes(parent_id);
create index if not exists notes_updated_at_idx   on public.notes(updated_at desc);

-- RLS
alter table public.notes enable row level security;

create policy "Users see own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();
