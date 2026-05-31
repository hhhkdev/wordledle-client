---
description: 현재 변경사항을 타입 체크 후 커밋한다
---

# /commit

현재 작업한 변경사항을 커밋한다. 아래 순서를 반드시 따른다.

## 순서

1. **타입 체크**: `pnpm tsc --noEmit` 실행. 오류가 있으면 커밋하지 말고 오류 내용을 사용자에게 알린다.

2. **변경 파일 확인**: `git status`와 `git diff` 로 무엇이 바뀌었는지 파악한다. `.env.local`, `*.key`, `*secret*` 같은 민감 파일이 스테이지에 포함되지 않도록 주의한다.

3. **스테이징**: 변경된 소스 파일을 스테이지한다. `git add -A` 대신 관련 파일만 선택적으로 추가한다.

4. **커밋 메시지 작성**: 이 프로젝트의 commitlint 규칙(`feat / fix / refactor / style / docs / test / chore / revert`)을 따른다.
   - 형식: `<type>: <한 줄 요약>`
   - 본문이 필요하면 빈 줄 후 추가
   - Co-Author 태그 포함

5. **커밋 실행**: `git commit -m "..."` 으로 커밋한다. husky pre-commit(tsc)이 다시 돌지만 이미 통과했으므로 문제없다.

6. 완료 후 커밋 해시와 메시지를 사용자에게 보여준다.
