# ch19 — 19장을 시작할 때 있어야 하는 것

18장을 마친 상태다. 17장 결과에 더해:

- 대성물산 현행 단가 9,500원이 3중 교차검증(회의록·이메일·카톡)으로 확정됨
- 위키 전체에 `[확정]/[모름]/[충돌]` 상태 태그와 값별 근거 문서명 도입
- 원본을 일부러 고쳤다가 `git revert`로 되돌린 실습의 흔적은 위키·CLAUDE.md 기록으로
  남아 있고, 원본 수정 건은 0건
- `.claude/skills/test/SKILL.md` — `/test` 검증 Skill (macOS의 Finder에서는 숨김 폴더라 평소엔 안 보임).
  `/test` 전수 대조로 찾은 위키 표기 오류 4건도 수정된 상태
- `CLAUDE.md`에 "정정과 주석은 위키에만 남긴다" 규칙 반영

## 쓰는 법

`part3-work-folder/`를 통째로 작업할 자리로 복사한다. 숨김 폴더 `.claude/`도 함께 복사된다. macOS의 Finder에서는 `Command`+`Shift`+`.`을 눌러야 보인다.
Git은 `git init` 후 시작 커밋 하나로 출발(ch17 README 참조).

**전제**: MarkItDown MCP 연결(ch18 README 참조), Node.js·npm 설치(19장에서 Next.js
대시보드를 만든다).
