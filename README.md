# WORDLEDLE

워들 게임 링크 모음 & 결과 공유 랭킹 서비스.

## 소개

WORDLEDLE은 Wordle, 꼬들, Connections 등 다양한 워들류 게임 링크를 한 곳에 모아두고, 게임 결과를 붙여넣어 친구들과 랭킹을 겨룰 수 있는 서비스입니다.

## 주요 기능

- **대시보드**: 워들 게임 링크를 큰 버튼 형식으로 모아 바로 이동 가능
- **결과 입력**: 게임 결과 공유 텍스트를 붙여넣어 기록 저장
- **랭킹 보드**: 전체 랭킹 및 친구 랭킹 조회 (게임별 필터 지원)
- **로그인/회원가입**: 닉네임 + 비밀번호로 단순 가입
- **친구**: 닉네임으로 친구 추가 및 친구 랭킹 확인

## 지원 게임

| 게임 | 설명 |
|------|------|
| Wordle | 5글자 영단어 맞추기 (NYT) |
| 꼬들 | 한국어 5글자 단어 맞추기 |
| Connections | 4가지 카테고리로 단어 묶기 (NYT) |
| Mini Crossword | 5x5 미니 십자말풀이 (NYT) |
| Quordle | 4개 단어 동시에 맞추기 |
| Framed | 영화 스틸컷으로 영화 맞추기 |

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: 닉네임 + 비밀번호 커스텀 인증 (SHA-256 해시, localStorage 세션)

## 개발 환경 설정

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일에 Supabase 정보를 입력합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase 데이터베이스 설정

Supabase 프로젝트의 SQL Editor에서 `supabase/schema.sql`을 실행합니다.

이 스크립트는 다음을 수행합니다:
- 테이블 생성 (users, games, results, friends)
- 기본 게임 데이터 시드 삽입

### 4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

## 디렉토리 구조

```
src/
├── app/               # Next.js App Router 페이지
│   ├── page.tsx       # 대시보드 (홈)
│   ├── login/         # 로그인
│   ├── register/      # 회원가입
│   ├── ranking/       # 랭킹 보드
│   └── friends/       # 친구 관리
├── components/
│   ├── ui/            # 범용 UI 컴포넌트 (Button, Input, Modal, Badge)
│   ├── game/          # 게임 관련 컴포넌트 (GameCard, ResultModal)
│   ├── ranking/       # 랭킹 컴포넌트 (RankingTable)
│   └── Navbar.tsx     # 상단 네비게이션
├── contexts/
│   └── AuthContext.tsx # 인증 상태 전역 관리
├── lib/
│   ├── auth.ts        # 로그인/회원가입 로직
│   ├── games.ts       # 게임 목록 및 결과 파싱
│   ├── utils.ts       # 유틸리티 함수
│   └── supabase/      # Supabase 클라이언트
└── types/
    └── index.ts       # 공통 타입 정의
```

## Supabase 설정 참고사항

현재 커스텀 인증을 사용하므로 RLS(Row Level Security)는 비활성화되어 있습니다. 운영 환경에서는 Supabase Auth와 연동하여 적절한 RLS 정책을 적용하는 것을 권장합니다.
