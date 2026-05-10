-- ============================================================
-- FORGE — Schema Additions v2
-- Ejecutar en SQL Editor DESPUÉS del schema.sql inicial
-- ============================================================

-- ============================================================
-- BODY MEASUREMENTS
-- ============================================================
create table if not exists public.body_measurements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles on delete cascade not null,
  date       timestamptz not null,
  weight     numeric,
  height     numeric,
  body_fat   numeric,
  waist      numeric,
  chest      numeric,
  arms       numeric,
  hips       numeric,
  thighs     numeric,
  created_at timestamptz not null default now()
);

create index if not exists body_measurements_user_idx on public.body_measurements(user_id);
create index if not exists body_measurements_date_idx on public.body_measurements(date desc);

alter table public.body_measurements enable row level security;

create policy "Users manage their own body measurements"
  on public.body_measurements for all using (auth.uid() = user_id);

-- ============================================================
-- PERSONAL RECORDS
-- ============================================================
create table if not exists public.personal_records (
  user_id       uuid references public.profiles on delete cascade not null,
  exercise_id   text not null,
  exercise_name text not null,
  weight        numeric not null,
  reps          int not null,
  one_rm        numeric not null,
  date          timestamptz not null,
  primary key (user_id, exercise_id)
);

create index if not exists personal_records_user_idx on public.personal_records(user_id);

alter table public.personal_records enable row level security;

create policy "Users manage their own personal records"
  on public.personal_records for all using (auth.uid() = user_id);
