-- Reviews table — history of every card review session
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  flashcard_id  uuid not null references public.flashcards(id) on delete cascade,
  grade         smallint not null check (grade in (0, 3, 5)),
  -- grade: 0 = again, 3 = hard/ok, 5 = easy
  interval_after  integer not null,   -- interval (days) written to card after this review
  ease_after      float   not null,   -- ease_factor after this review
  reviewed_at   timestamptz not null default now()
);

-- Indexes
create index if not exists reviews_user_id_idx      on public.reviews(user_id);
create index if not exists reviews_flashcard_id_idx on public.reviews(flashcard_id);
create index if not exists reviews_reviewed_at_idx  on public.reviews(reviewed_at desc);

-- Composite index for daily stats queries
create index if not exists reviews_user_date_idx
  on public.reviews(user_id, reviewed_at desc);

-- RLS
alter table public.reviews enable row level security;

create policy "Users see own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

create policy "Users insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);
