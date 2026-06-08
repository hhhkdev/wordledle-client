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
- `games`: id, name, slug, url, description, emoji, color, result_format, image_url
- `results`: id, user_id, game_id, date, puzzle_number, raw_result, score, attempts, max_attempts, completed, metadata — unique(user_id, game_id, date)
- `friends`: id, user_id, friend_id — unique(user_id, friend_id)

스키마 파일: `supabase/schema.sql`

### 게임 결과 파싱
`src/lib/games.ts`의 `parseGameResult(gameSlug, rawText)` 함수로 게임별 공유 텍스트를 파싱.
반환값: `{ score, attempts, max_attempts, completed, metadata }`

현재 지원 slug: `wordle`, `kkodle`, `kkooooodle`, `kkomanttle`, `kakao-word`

`kakao-word`는 URL 없이 결과 입력만 가능한 게임 (카카오톡 미니게임). `game.url = ''`로 설정.

새 게임 추가 시:
1. `GAMES` 배열에 게임 정보 추가
2. `parseGameResult`에 slug별 파싱 로직 추가
3. Supabase DB에 seed 추가 (`supabase/schema.sql` 하단 참고)

### 점수 체계

점수 계산은 `src/lib/games.ts`의 `scoreCleared(attempts, maxAttempts, basePoints)` 함수로 처리.

| 게임 | 기본 점수 | 시도 보너스 | 최소 | 최대 | 실패 |
|------|-----------|-------------|------|------|------|
| Wordle | 10점 | +1점/절약한 시도 (max 6) | 10점 | 15점 | 0점 |
| 꼬들 | 10점 | +1점/절약한 시도 (max 6) | 10점 | 15점 | 0점 |
| 꼬오오오오들 | 20점 | +1점/절약한 시도 (max 6) | 20점 | 25점 | 0점 |
| 꼬맨틀 | 20점 | 없음 (시도 무제한) | — | 20점 | 0점 |
| 카카오 오늘의 단어 | 10점 | +1점/절약한 시도 (max 5) | 10점 | 14점 | -5점 |

**예시**: 꼬들을 4번 만에 클리어 → 10 + (6−4) = **12점**

**5게임 전체 최대**: 15 + 15 + 25 + 20 + 14 = **89점**

랭킹은 누적 점수 기준. 꼬맨틀 단독 랭킹은 총 추측 횟수 오름차순(적을수록 상위).

### 게임별 초기화 시간

| 게임 | 초기화 | 비고 |
|------|--------|------|
| Wordle | 자정 (현지 시각) | 회차 번호로 식별 (#1806 등) |
| 꼬들 | 자정 KST | 날짜 기준 |
| 꼬오오오오들 | 자정 KST | 날짜 기준 |
| 꼬맨틀 | 자정 KST | 날짜 기준 |
| 카카오 오늘의 단어 | 자정 KST | 날짜 기준 · URL 없음 (카카오톡 전용) |

홈 화면 "이번 회차 랭킹"에서 Wordle은 회차 번호, 한국 게임은 날짜로 표시.

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

## 게임 카드 배경 이미지 가이드

게임별 배경 이미지는 Supabase `games.image_url` 컬럼에 URL을 저장하면 자동으로 적용됩니다.

| 항목 | 권장값 |
|------|--------|
| **비율** | 4:3 (가로형) |
| **권장 크기** | 800×600px (2x 레티나 대응) |
| **최소 크기** | 400×300px |
| **포맷** | WebP 또는 JPEG |
| **안전 영역** | 이미지 **상단 40%** — 하단 60%는 콘텐츠 오버레이로 가려짐 |
| **로고 배치** | 상단 중앙 권장 |

카드 렌더링 크기 참고:
- 모바일(375px 기준): 카드 너비 ~170px
- 데스크탑(1280px): 카드 너비 ~600px
- 모든 화면에서 `object-fit: cover`로 중앙 크롭

## 공지사항 추가 방법

`src/components/Announcements.tsx` 파일 상단의 `ANNOUNCEMENTS` 배열에 추가합니다:

```ts
{
  date: 'YYYY-MM-DD',
  tag: '업데이트' | '공지' | '이벤트' | '점검',
  title: '제목',
  content: '내용',
}
```

## 주의사항

- 패키지 매니저는 **pnpm** — `npm install` 대신 `pnpm install` 사용
- `.env.local`에 실제 Supabase 키를 입력해야 앱이 동작함
- 현재 RLS 비활성화 — 운영 시 Supabase Auth 연동 필요
- Supabase 스키마 변경 후 `supabase/schema.sql` 전체를 SQL Editor에서 재실행
