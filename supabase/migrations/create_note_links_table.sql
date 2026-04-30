-- AI-generated semantic links between notes
create table if not exists public.note_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  source_id   uuid not null references public.notes(id) on delete cascade,
  target_id   uuid not null references public.notes(id) on delete cascade,
  strength    float not null default 0.5,  -- 0..1 semantic similarity
  label       text,                         -- optional short description
  is_manual   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, source_id, target_id)
);

create index if not exists note_links_user_idx on public.note_links(user_id);
create index if not exists note_links_source_idx on public.note_links(source_id);
create index if not exists note_links_target_idx on public.note_links(target_id);

alter table public.note_links enable row level security;

create policy "Users see own note_links"
  on public.note_links for select
  using (auth.uid() = user_id);

create policy "Users insert own note_links"
  on public.note_links for insert
  with check (auth.uid() = user_id);

create policy "Users delete own note_links"
  on public.note_links for delete
  using (auth.uid() = user_id);
