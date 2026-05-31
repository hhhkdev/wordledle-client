# CLAUDE.md — WORDLEDLE 프로젝트 참고 문서

## 프로젝트 개요

WORDLEDLE: 워들류 게임 링크 모음 + 결과 공유 + 친구 랭킹 서비스.
Next.js 16 (App Router) + Supabase + Tailwind CSS로 구성.

## 개발 명령어

```bash
pnpm dev    # 개발 서버 (localhost:3000)
pnpm build  # 프로덕션 빌드
pnpm lint   # ESLint
pnpm tsc --noEmit  # TypeScript 타입 체크
```

## 아키텍처

### 인증
- 커스텀 인증: 닉네임 + 비밀번호(SHA-256 해시)
- 세션: localStorage에 User 객체 저장 (`wordledle_user` 키)
- `AuthContext` (`src/contexts/AuthContext.tsx`)가 전역 상태 관리
- Supabase Auth 미사용 → RLS 비활성화 상태

### 데이터베이스 (Supabase)
테이블:
- `users`: id, nickname (unique), password_hash, created_at
- `games`: id, name, slug, url, description, emoji, color, result_format
- `results`: id, user_id, game_id, date, raw_result, score, attempts, max_attempts, completed — unique(user_id, game_id, date)
- `friends`: id, user_id, friend_id — unique(user_id, friend_id)

스키마 파일: `supabase/schema.sql`

### 게임 결과 파싱
`src/lib/games.ts`의 `parseGameResult(gameSlug, rawText)` 함수로 게임별 공유 텍스트를 파싱.
반환값: `{ score, attempts, max_attempts, completed }`

현재 지원 slug: `wordle`, `kkodle`, `connections`, `quordle`, `framed`, `mini-crossword`

새 게임 추가 시:
1. `GAMES` 배열에 게임 정보 추가
2. `parseGameResult`에 slug별 파싱 로직 추가
3. Supabase DB에 seed 추가 (`supabase/schema.sql` 하단 참고)

### 디자인 원칙
- Toss UX 정신: 단순하고 명확한 UI, 불필요한 요소 제거
- 둥근 모서리 (rounded-xl, rounded-2xl), 미묘한 border, 충분한 padding
- 색상: 파란색 계열 primary, 회색 계열 neutral
- 게임카드: 상단 컬러 바 + 이모지 + 게임명 + 설명 + 액션 버튼

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 주의사항

- 패키지 매니저는 **pnpm** — `npm install` 대신 `pnpm install` 사용
- `.env.local`에 실제 Supabase 키를 입력해야 앱이 동작함
- 현재 RLS 비활성화 — 운영 시 Supabase Auth 연동 필요
