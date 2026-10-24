/**
 * 세 위젯(분포·관계·타임라인)이 실제로 화면에 나오는지 확인하는 테스트다.
 *
 * 개발용 서버를 직접 띄워 첫 화면("/")을 한 번 받아 오고, 받아 온 HTML을 검사한다.
 * 따로 설치할 도구 없이 Node.js에 들어 있는 기능(node:test, node:assert, fetch)만 쓴다.
 *
 *   cd dashboard && npm test
 *
 * 기대하는 값은 코드에 적어 두지 않고 wiki/data/dashboard.json에서 계산한다.
 * 숫자를 적어 두면 데이터가 바뀌었을 때 테스트만 옛날 값을 고집하게 된다.
 * 이 폴더가 파일 이름의 '최종'으로 겪은 문제와 같은 종류다.
 */

import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_PATH = path.resolve(APP_DIR, '..', 'wiki', 'data', 'dashboard.json')
const PORT = Number(process.env.TEST_PORT ?? 3599)
const URL = `http://127.0.0.1:${PORT}/`
const BOOT_TIMEOUT_MS = 90_000

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

let server
let html = ''

/**
 * React가 글자를 HTML로 내보낼 때처럼 특수 문자(&, < 등)를 바꿔 적는다.
 * 위젯 제목을 HTML에서 찾을 때 필요하다.
 */
function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')
}

function count(haystack, re) {
  return (haystack.match(re) ?? []).length
}

async function waitForServer() {
  const deadline = Date.now() + BOOT_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const res = await fetch(URL)
      if (res.ok) return res
    } catch {
      /* 서버가 아직 준비되지 않았다. 잠시 뒤 다시 시도한다. */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`dev 서버가 ${BOOT_TIMEOUT_MS}ms 안에 뜨지 않았다 (${URL})`)
}

before(async () => {
  // node_modules/.bin/next는 Windows에서 바로 실행되지 않는 셸 스크립트라서,
  // next 패키지의 실행 파일을 Node.js로 직접 띄운다.
  server = spawn(
    process.execPath,
    [path.join(APP_DIR, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '-p', String(PORT), '-H', '127.0.0.1'],
    { cwd: APP_DIR, stdio: 'ignore', detached: process.platform !== 'win32', windowsHide: true }
  )
  const res = await waitForServer()
  assert.equal(res.status, 200, 'GET / 가 200이어야 한다')
  html = await res.text()
})

after(() => {
  if (server?.pid) {
    // next dev는 실행하면서 다른 프로세스를 더 띄운다.
    // 그래서 하나만 끄지 않고 함께 뜬 프로세스를 한꺼번에 끈다.
    if (process.platform === 'win32') {
      // Windows에서는 taskkill /t로 함께 뜬 프로세스까지 끈다.
      spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' })
    } else {
      try {
        process.kill(-server.pid, 'SIGTERM')
      } catch {
        server.kill('SIGTERM')
      }
    }
  }
})

const MARKS = [
  ['dist', '카테고리별 문서 분포'],
  ['rel', '문서 간 관계'],
  ['time', '시간축 타임라인'],
]

/**
 * 받아 온 HTML을 위젯 제목을 기준으로 위젯별 구간으로 자른다.
 * .bar 같은 이름은 여러 위젯이 함께 쓰기 때문에, 구간을 나눠야 위젯마다 따로 셀 수 있다.
 *
 * 화면에 없는 위젯은 빈 문자열로 돌려주고, 여기서는 실패로 처리하지 않는다.
 * 위젯 하나가 빠졌다고 상관없는 위젯의 테스트까지 모두 실패하면 어디가 문제인지 알기 어렵다.
 */
function sections() {
  const found = MARKS.map(([key, mark]) => ({ key, mark, at: html.indexOf(mark) }))
    .filter((m) => m.at > -1)
    .sort((a, b) => a.at - b.at)

  const out = { dist: '', rel: '', time: '' }
  found.forEach((m, i) => {
    const end = i + 1 < found.length ? found[i + 1].at : html.length
    out[m.key] = html.slice(m.at, end)
  })
  return out
}

/** 위젯 구간을 꺼낸다. 위젯이 아예 화면에 없으면 개수를 비교하기 전에 그 사실부터 알려 준다. */
function sectionOf(key) {
  const s = sections()[key]
  const mark = MARKS.find(([k]) => k === key)[1]
  assert.ok(s.length > 0, `위젯이 렌더되지 않았다: ${mark}`)
  return s
}

describe('페이지 전체', () => {
  test('데이터 읽기 실패 화면이 아니다', () => {
    assert.ok(
      !html.includes('데이터를 읽지 못했다'),
      'wiki/data/dashboard.json을 읽지 못했다 — dashboard/ 안에서 실행했는지 확인할 것'
    )
  })

  test(`위젯 카드가 ${MARKS.length}장 있다`, () => {
    assert.equal(count(html, /class="card"/g), MARKS.length)
  })

  test('세 위젯이 모두 떴다', () => {
    const missing = MARKS.filter(([, mark]) => !html.includes(mark)).map(([, m]) => m)
    assert.deepEqual(missing, [], `렌더되지 않은 위젯: ${missing.join(', ')}`)
  })

  test('위젯이 예상한 순서로 놓였다', () => {
    const at = MARKS.map(([, mark]) => html.indexOf(mark)).filter((i) => i > -1)
    const sorted = [...at].sort((a, b) => a - b)
    assert.deepEqual(at, sorted, '분포 → 관계 → 타임라인 순이어야 한다')
  })
})

describe('위젯 1 — 카테고리별 문서 분포', () => {
  const cats = data.category_counts.by_category

  test(`막대가 카테고리 수(${cats.length})만큼 있다`, () => {
    assert.equal(count(sectionOf('dist'), /class="bar"/g), cats.length)
  })

  test('막대 값의 합이 카테고리 문서 수 합과 같다', () => {
    const shown = [...sectionOf('dist').matchAll(/class="bar-value">(\d+)</g)].map((m) =>
      Number(m[1])
    )
    const expected = cats.reduce((s, c) => s + c.count, 0)
    assert.equal(
      shown.reduce((s, v) => s + v, 0),
      expected
    )
  })

  test('카테고리 라벨이 하나도 빠지지 않았다', () => {
    const dist = sectionOf('dist')
    for (const c of cats) {
      assert.ok(dist.includes(esc(c.label)), `라벨 누락: ${c.label}`)
    }
  })

  test('스탯 타일이 원본·wiki·합계를 그대로 보여준다', () => {
    const { total_raw, total_wiki, total_repo_docs } = data.category_counts
    const shown = [...sectionOf('dist').matchAll(/class="stat-value">(\d+)</g)].map((m) =>
      Number(m[1])
    )
    assert.deepEqual(shown, [total_raw, total_wiki, total_repo_docs])
  })
})

describe('위젯 2 — 문서 간 관계', () => {
  const types = [...new Set(data.relations.map((r) => r.type))]

  test(`관계 항목이 엣지 수(${data.relations.length})만큼 있다`, () => {
    assert.equal(count(sectionOf('rel'), /class="rel"/g), data.relations.length)
  })

  test(`유형 막대가 유형 수(${types.length})만큼 있다`, () => {
    assert.equal(count(sectionOf('rel'), /row-btn/g), types.length)
  })

  test('유형별 건수의 합이 엣지 수와 같다', () => {
    const shown = [...sectionOf('rel').matchAll(/class="bar-value">(\d+)</g)].map((m) =>
      Number(m[1])
    )
    assert.equal(
      shown.reduce((s, v) => s + v, 0),
      data.relations.length
    )
  })

  test('주의 배지가 warning 관계 수와 같다', () => {
    const expected = data.relations.filter((r) => r.warning).length
    assert.equal(count(sectionOf('rel'), /badge-warn/g), expected)
  })

  test('유형 이름이 하나도 빠지지 않았다', () => {
    const rel = sectionOf('rel')
    for (const t of types) assert.ok(rel.includes(t), `유형 누락: ${t}`)
  })
})

describe('위젯 3 — 시간축 타임라인', () => {
  const events = data.timeline

  test(`이벤트 항목이 timeline 수(${events.length})만큼 있다`, () => {
    assert.equal(count(sectionOf('time'), /<li class="ev/g), events.length)
  })

  test('분기 막대 값의 합이 이벤트 수와 같다', () => {
    const shown = [...sectionOf('time').matchAll(/class="col-value">(\d+)</g)].map((m) =>
      Number(m[1])
    )
    assert.equal(
      shown.reduce((s, v) => s + v, 0),
      events.length
    )
  })

  test('분기 축이 끊기지 않는다 (빈 분기도 자리를 지킨다)', () => {
    const labels = [...sectionOf('time').matchAll(/col-label[^>]*">(\d{2})Q([1-4])/g)].map(
      (m) => Number(m[1]) * 4 + Number(m[2]) - 1
    )
    assert.ok(labels.length >= 2, '분기 라벨이 읽히지 않았다')
    for (let i = 1; i < labels.length; i += 1) {
      assert.equal(
        labels[i] - labels[i - 1],
        1,
        `분기가 건너뛰었다: ${labels[i - 1]} → ${labels[i]}`
      )
    }
  })

  test('"오늘 이후" 배지가 future 이벤트 수와 같다', () => {
    const expected = events.filter((e) => e.future).length
    assert.equal(count(sectionOf('time'), />오늘 이후</g), expected)
  })

  test('이벤트 제목이 하나도 빠지지 않았다', () => {
    const time = sectionOf('time')
    for (const e of events) {
      assert.ok(time.includes(esc(e.title)), `제목 누락: ${e.title}`)
    }
  })

  test('배열 순서가 화면 순서와 같다 (재정렬하지 않았다)', () => {
    const time = sectionOf('time')
    let cursor = 0
    for (const e of events) {
      const at = time.indexOf(esc(e.title), cursor)
      assert.ok(at > -1, `순서가 어긋났다: ${e.title}`)
      cursor = at
    }
  })
})
