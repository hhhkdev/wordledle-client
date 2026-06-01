pnpm tsc --noEmit 로 타입 체크를 먼저 실행해줘. 오류가 있으면 중단하고 알려줘.

통과하면 git status 와 git diff 로 변경 내용을 확인하고, 이 프로젝트의 commitlint 규칙에 맞는 커밋 메시지를 작성해줘.

타입: feat / fix / refactor / style / docs / test / chore / revert 중 선택
형식: `<type>: <한 줄 요약>`

커밋 메시지 마지막에 반드시 포함:
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

민감한 파일(.env.local 등)은 스테이지하지 마.

커밋 완료 후 git push origin main 까지 실행해줘.
