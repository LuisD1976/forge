-- ============================================================
-- FORGE — Supabase Schema
-- Ejecutar en SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  username     text unique not null,
  display_name text not null,
  avatar_url   text default '',
  goal         text not null default 'muscle',
  experience   text not null default 'beginner',
  equipment    text not null default 'gym',
  is_pro       boolean not null default false,
  pro_expires_at timestamptz,
  streak       int not null default 0,
  total_workouts int not null default 0,
  weight       numeric,
  height       numeric,
  onboarding_complete boolean not null default false,
  questionnaire jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Trigger para updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Trigger para crear perfil vacío en cada signup (safety net)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'user_' || substring(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'display_name', 'Forjador')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================
create table public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles on delete cascade not null,
  name         text not null,
  date         timestamptz not null,
  duration     int not null default 0,
  exercises    jsonb not null default '[]',
  total_volume numeric not null default 0,
  xp_gained    int not null default 0,
  notes        text,
  created_at   timestamptz not null default now()
);

create index workout_sessions_user_id_idx on public.workout_sessions(user_id);
create index workout_sessions_date_idx on public.workout_sessions(date desc);

-- ============================================================
-- MUSCLE RANKS
-- ============================================================
create table public.muscle_ranks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles on delete cascade not null,
  muscle       text not null,
  tier         text not null default 'hierro',
  percentile   numeric not null default 5,
  one_rm       numeric not null default 0,
  xp           int not null default 0,
  next_level_xp int not null default 500,
  unique(user_id, muscle)
);

create index muscle_ranks_user_id_idx on public.muscle_ranks(user_id);

-- ============================================================
-- ROUTINES
-- ============================================================
create table public.routines (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles on delete cascade not null,
  name           text not null,
  description    text not null default '',
  exercises      jsonb not null default '[]',
  frequency      text not null default '',
  category       text not null default 'custom',
  difficulty     int not null default 1,
  is_ai_generated boolean not null default false,
  created_at     timestamptz not null default now()
);

create index routines_user_id_idx on public.routines(user_id);

-- ============================================================
-- SOCIAL POSTS
-- ============================================================
create table public.social_posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles on delete cascade not null,
  content         text not null,
  image_url       text,
  workout_summary jsonb,
  likes_count     int not null default 0,
  comments_count  int not null default 0,
  created_at      timestamptz not null default now()
);

create index social_posts_user_id_idx on public.social_posts(user_id);
create index social_posts_created_at_idx on public.social_posts(created_at desc);

-- ============================================================
-- POST LIKES
-- ============================================================
create table public.post_likes (
  user_id    uuid references public.profiles on delete cascade,
  post_id    uuid references public.social_posts on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Función para incrementar/decrementar likes
create or replace function public.handle_post_like()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.social_posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.social_posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger post_likes_counter
  after insert or delete on public.post_likes
  for each row execute procedure public.handle_post_like();

-- ============================================================
-- FRIENDSHIPS / FOLLOWS
-- ============================================================
create table public.friendships (
  follower_id  uuid references public.profiles on delete cascade,
  following_id uuid references public.profiles on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index friendships_follower_idx on public.friendships(follower_id);
create index friendships_following_idx on public.friendships(following_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.muscle_ranks enable row level security;
alter table public.routines enable row level security;
alter table public.social_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.friendships enable row level security;

-- Profiles: lectura pública, escritura sólo el propio usuario
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Workout sessions: sólo el dueño
create policy "Users manage their own workout sessions"
  on public.workout_sessions for all using (auth.uid() = user_id);

-- Muscle ranks: sólo el dueño
create policy "Users manage their own muscle ranks"
  on public.muscle_ranks for all using (auth.uid() = user_id);

-- Routines: sólo el dueño
create policy "Users manage their own routines"
  on public.routines for all using (auth.uid() = user_id);

-- Social posts: lectura pública, escritura sólo el dueño
create policy "Posts are viewable by everyone"
  on public.social_posts for select using (true);

create policy "Users can insert their own posts"
  on public.social_posts for insert with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.social_posts for delete using (auth.uid() = user_id);

-- Post likes: lectura pública, inserción/borrado sólo el dueño
create policy "Post likes are viewable by everyone"
  on public.post_likes for select using (true);

create policy "Users can like/unlike posts"
  on public.post_likes for all using (auth.uid() = user_id);

-- Friendships: lectura pública, gestión sólo el follower
create policy "Friendships are viewable by everyone"
  on public.friendships for select using (true);

create policy "Users can follow/unfollow"
  on public.friendships for all using (auth.uid() = follower_id);
