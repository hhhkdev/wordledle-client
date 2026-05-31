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
  -- Game-specific extra data (streak, time_seconds, max_similarity, puzzle_number, etc.)
  metadata jsonb default '{}',
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

-- ── Add metadata column if upgrading from older schema ──────────────────────
-- (safe to run even if column already exists)
alter table public.results add column if not exists metadata jsonb default '{}';

-- ── Games seed ──────────────────────────────────────────────────────────────
-- Delete old games first to allow clean re-seed
delete from public.games;

insert into public.games (name, slug, url, description, emoji, color, result_format)
values
  (
    'Wordle', 'wordle',
    'https://www.nytimes.com/games/wordle/index.html',
    '5글자 영단어 맞추기', '🟩', '#538d4e',
    'Wordle 1,806 4/6'
  ),
  (
    '꼬들', 'kkodle',
    'https://kordle.kr',
    '한국어 6글자 단어 맞추기', '🟧', '#e07c3a',
    '꼬들 1610 5/6 Kordle.Kr 🔥3'
  ),
  (
    '꼬오오오오들', 'kkooooodle',
    'https://koooo.kordle.kr',
    '한국어 12글자 단어 맞추기', '🟥', '#c0392b',
    '꼬오오오오들 1310 5/6'
  ),
  (
    '꼬맨틀', 'kkomanttle',
    'https://semantle-ko.newsjel.ly',
    '단어 유사도로 정답 찾기', '🧠', '#8e44ad',
    'N번째 꼬맨틀을 풀었습니다!'
  );

-- ── Row Level Security ──────────────────────────────────────────────────────
-- NOTE: RLS disabled — using custom auth (not Supabase Auth).
-- For production, integrate Supabase Auth and re-enable RLS with proper policies.
alter table public.users disable row level security;
alter table public.games disable row level security;
alter table public.results disable row level security;
alter table public.friends disable row level security;
