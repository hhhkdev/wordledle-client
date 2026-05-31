import type { UserConfig } from '@commitlint/types'

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 새 기능
        'fix',      // 버그 수정
        'refactor', // 리팩토링 (기능 변경 없음)
        'style',    // 코드 포맷, 세미콜론 등 (로직 변경 없음)
        'docs',     // 문서 변경
        'test',     // 테스트 추가/수정
        'chore',    // 빌드, 패키지 등 기타 작업
        'revert',   // 이전 커밋 되돌리기
      ],
    ],
    'subject-max-length': [2, 'always', 72],
    'subject-empty': [2, 'never'],
    'subject-case': [0], // 한국어 제목 허용
    'body-max-line-length': [2, 'always', 100],
  },
}

export default config
