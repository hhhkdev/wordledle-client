-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (custom auth, not Supabase Auth)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  nickname text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Games table
create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  url text not null,
  description text,
  emoji text,
  color text,
  result_format text,
  created_at timestamptz default now()
);

-- Game results table
create table if not exists public.results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  date date not null default current_date,
  raw_result text not null,
  score integer default 0,
  attempts integer,
  max_attempts integer,
  completed boolean default false,
  created_at timestamptz default now(),
  unique(user_id, game_id, date)
);

-- Friends table
create table if not exists public.friends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  friend_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, friend_id),
  check (user_id != friend_id)
);

-- Seed games
insert into public.games (name, slug, url, description, emoji, color, result_format)
values
  ('Wordle', 'wordle', 'https://www.nytimes.com/games/wordle/index.html', '5글자 영단어 맞추기', '🟩', '#6aaa64', 'Wordle {number} {attempts}/6'),
  ('꼬들', 'kkodle', 'https://kkodle.com', '한국어 5글자 단어 맞추기', '🟧', '#e77e2d', '꼬들 {number} {attempts}/6'),
  ('Connections', 'connections', 'https://www.nytimes.com/games/connections', '4가지 카테고리로 단어 묶기', '🟨', '#f9c74f', 'Connections\nPuzzle #{number}'),
  ('Mini Crossword', 'mini-crossword', 'https://www.nytimes.com/crosswords/game/mini', '5x5 미니 십자말풀이', '✏️', '#4a90d9', 'NYT Mini Crossword'),
  ('Quordle', 'quordle', 'https://www.merriam-webster.com/games/quordle', '4개 단어 동시에 맞추기', '🟦', '#3b82f6', 'Daily Quordle {number}'),
  ('Framed', 'framed', 'https://framed.wtf', '영화 스틸컷으로 영화 맞추기', '🎬', '#6366f1', 'Framed #{number}')
on conflict (slug) do nothing;

-- NOTE: RLS is disabled here since we use custom auth (not Supabase Auth).
-- All access control is handled at the application layer.
-- For production, consider using Supabase Auth and enabling RLS with proper policies.
alter table public.users disable row level security;
alter table public.games disable row level security;
alter table public.results disable row level security;
alter table public.friends disable row level security;
