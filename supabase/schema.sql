-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (custom auth, not Supabase Auth)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  nickname text unique not null,
  password_hash text not null,
  is_admin boolean not null default false,
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
  image_url text,
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
  puzzle_number integer,
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

-- Feedback table
create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz default now()
);

-- ── 기존 스키마 업그레이드 (idempotent) ────────────────────────
alter table public.results add column if not exists metadata jsonb default '{}';
alter table public.results add column if not exists puzzle_number integer;
alter table public.games   add column if not exists image_url text;
alter table public.users   add column if not exists is_admin boolean not null default false;

-- ── Games seed (upsert — 기존 데이터 보존) ──────────────────────
insert into public.games (name, slug, url, description, emoji, color, result_format, image_url)
values
  (
    'Wordle', 'wordle',
    'https://www.nytimes.com/games/wordle/index.html',
    '5글자 영단어 맞추기', '🟩', '#538d4e',
    'Wordle 1,806 4/6', null
  ),
  (
    '꼬들', 'kkodle',
    'https://kordle.kr',
    '한국어 6글자 단어 맞추기', '🟧', '#e07c3a',
    '꼬들 1610 5/6 Kordle.Kr 🔥3', null
  ),
  (
    '꼬오오오오들', 'kkooooodle',
    'https://koooo.kordle.kr',
    '한국어 12글자 단어 맞추기', '🟥', '#c0392b',
    '꼬오오오오들 1310 5/6', null
  ),
  (
    '꼬맨틀', 'kkomanttle',
    'https://semantle-ko.newsjel.ly',
    '단어 유사도로 정답 찾기', '🧠', '#8e44ad',
    'N번째 꼬맨틀을 풀었습니다!', null
  ),
  (
    '카카오 오늘의 단어', 'kakao-word',
    '',
    '카카오톡 미니게임 — 결과 입력 전용', '💬', '#C49A00',
    '오늘의 단어 맞히기 성공!', null
  ),
  (
    'Word Hurdle 4-letter', 'wordhurdle-4',
    'https://solitaired.com/wordhurdle-4-letter',
    '4글자 영단어 맞추기', '💙', '#1e3a5f',
    'Word Hurdle 4-letter 3201 4/6 #wordhurdle', null
  ),
  (
    'Word Hurdle 5-letter', 'wordhurdle-5',
    'https://solitaired.com/wordhurdle-5-letter',
    '5글자 영단어 맞추기', '💙', '#1e3a5f',
    'Word Hurdle 5-letter 3201 3/6 #wordhurdle', null
  ),
  (
    'Word Hurdle', 'wordhurdle-6',
    'https://solitaired.com/wordhurdle',
    '6글자 영단어 맞추기', '💙', '#1e3a5f',
    'Word Hurdle 3201 5/6 #wordhurdle', null
  )
on conflict (slug) do update set
  name         = excluded.name,
  url          = excluded.url,
  description  = excluded.description,
  emoji        = excluded.emoji,
  color        = excluded.color,
  result_format = excluded.result_format;

-- ── Row Level Security ──────────────────────────────────────────
alter table public.users    disable row level security;
alter table public.games    disable row level security;
alter table public.results  disable row level security;
alter table public.friends  disable row level security;
alter table public.feedback disable row level security;
