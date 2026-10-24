# ch20 — 20장을 시작할 때 있어야 하는 것

두 폴더로 나뉜다.

## `part3-work-folder/` — 19장을 마친 작업 폴더

18장 결과에 더해:

- `wiki/data/dashboard.json` — 위키에서 추출한 대시보드용 파생 데이터(+검산 스크립트)
- `dashboard/` — Next.js 대시보드. 분포·관계·타임라인 위젯 3개(`app/`), SSR 렌더
  테스트와 Playwright E2E 테스트(`tests/`)까지 포함

`part3-work-folder/`를 통째로 작업할 자리로 복사한다. `dashboard/`에는 `node_modules/`가 없으므로
실행하려면 `dashboard/` 안에서 `npm install` 후 `npm run dev`(화면)·`npm test`(테스트).
테스트 전에는 한 번 `npx playwright install chromium`으로 테스트용 브라우저를 받아 둔다.
이 명령들은 Claude Code에 실행을 맡겨도 된다. Windows PowerShell에서 직접 쳤는데 “스크립트를 실행할 수 없으므로
… npm.ps1 파일을 로드할 수 없습니다” 오류가 나면 `npm.cmd`, `npx.cmd`처럼 `.cmd`를 붙여 친다.
Git은 `git init` 후 시작 커밋 하나로 출발(ch17 README 참조). MarkItDown MCP 연결
전제(ch18 README 참조).

## `incoming/` — 금요일 오후에 도착하는 새 문서

20장 첫 장면에서 도착하는 초록별상사 수정 제안서(`초록별상사_수정제안서_v2.pptx`)다.
`part3-work-folder/`에 일부러 넣지 않았다 — 정리를 마친 뒤에 **밖에서 새로 도착하는** 문서라는
설정이기 때문이다. 20장을 시작할 때 이 파일을 작업 폴더 맨 위에 복사해 넣고, 본문의
첫 프롬프트("방금 받은 제안서, 위키에 반영해 줘.")를 따라 하면 된다.
