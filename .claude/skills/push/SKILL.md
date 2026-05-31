---
description: 현재 변경사항을 커밋하고 origin에 푸시한다
---

# /push

/commit 과 동일한 과정을 수행한 뒤 origin에 푸시한다.

## 순서

1. **타입 체크**: `pnpm tsc --noEmit` 실행. 오류가 있으면 중단하고 사용자에게 알린다.

2. **변경 파일 확인**: `git status`와 `git diff`로 변경 내용 파악. 민감 파일 스테이징 여부 확인.

3. **이미 커밋된 변경만 있을 경우**: 스테이징/커밋 단계를 건너뛰고 바로 푸시.
   변경된 파일이 있을 경우: /commit 스킬과 동일하게 스테이징 → 커밋 진행.

4. **커밋 메시지 규칙**: `feat / fix / refactor / style / docs / test / chore / revert` 중 선택.
   - Co-Author 태그 포함

5. **푸시**: `git push origin <현재 브랜치>` 실행.
   - force push는 사용자가 명시적으로 요청한 경우에만 허용.
   - main/master 브랜치에 force push는 절대 하지 않는다.

6. 완료 후 푸시된 커밋 해시, 메시지, 브랜치명을 사용자에게 보여준다.
