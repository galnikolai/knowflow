-- Flashcards table (SM-2 spaced repetition)
create table if not exists public.flashcards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  node_id       uuid references public.notes(id) on delete cascade,
  question      text not null,
  answer        text not null,
  -- SM-2 fields
  interval      integer not null default 1,       -- days until next review
  repetitions   integer not null default 0,       -- number of successful reviews
  ease_factor   float   not null default 2.5,     -- difficulty multiplier (1.3 – 3.5)
  next_review   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes
create index if not exists flashcards_user_id_idx     on public.flashcards(user_id);
create index if not exists flashcards_node_id_idx     on public.flashcards(node_id);
create index if not exists flashcards_next_review_idx on public.flashcards(next_review);

-- RLS
alter table public.flashcards enable row level security;

create policy "Users see own flashcards"
  on public.flashcards for select
  using (auth.uid() = user_id);

create policy "Users insert own flashcards"
  on public.flashcards for insert
  with check (auth.uid() = user_id);

create policy "Users update own flashcards"
  on public.flashcards for update
  using (auth.uid() = user_id);

create policy "Users delete own flashcards"
  on public.flashcards for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create trigger flashcards_updated_at
  before update on public.flashcards
  for each row execute procedure public.set_updated_at();
