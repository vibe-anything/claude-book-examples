'use client'

import { Fragment, useMemo, useState } from 'react'

function basename(p) {
  return p ? p.split('/').pop() : ''
}

/**
 * 문서마다 제각각인 날짜 표기를 읽어 연도와 월만 꺼낸다.
 * "2026-09-05", "2026-09", "2026.9.5", "24.3.15", "24/3/15" 같은 표기를 모두 받는다.
 * 읽지 못한 날짜는 null을 돌려준다. 이런 항목은 버리지 않고 화면에서 '날짜 미상'으로 따로 모은다.
 */
function parseDate(s) {
  const hit = String(s ?? '').trim().match(/^(\d{4}|\d{2})[-./](\d{1,2})(?:[-./](\d{1,2}))?\.?$/)
  if (!hit) return null
  const y = hit[1].length === 2 ? 2000 + Number(hit[1]) : Number(hit[1])
  const m = Number(hit[2])
  if (m < 1 || m > 12) return null
  return { y, m }
}

/**
 * 날짜를 '몇 번째 분기인지' 나타내는 정수로 바꾼다. 연도에 4를 곱하고 분기 번호(0~3)를 더한다.
 * 예를 들어 "2026-09-09"는 3분기라 2026 × 4 + 2 = 8106이 된다.
 * 이 정수가 있어야 분기를 빠짐없이 차례로 늘어놓을 수 있다. 날짜를 읽지 못하면 null을 돌려준다.
 */
function quarterIndex(date) {
  const p = parseDate(date)
  return p ? p.y * 4 + Math.floor((p.m - 1) / 3) : null
}

/** 분기 정수를 화면에 쓸 이름으로 바꾼다. 예를 들어 8106은 2026년 3분기라 "26Q3"으로 적는다. */
function quarterLabel(idx) {
  const y = Math.floor(idx / 4)
  return `${String(y).slice(2)}Q${(idx % 4) + 1}`
}

function niceScale(max) {
  const steps = [1, 2, 5, 10, 20, 25, 50]
  const step = steps.find((s) => max / s <= 4) ?? 50
  const domain = Math.max(step, Math.ceil(max / step) * step)
  const ticks = []
  for (let t = 0; t <= domain; t += step) ticks.push(t)
  return { domain, ticks }
}

/**
 * 날짜를 원본에 적힌 만큼만 보여 준다. 월까지만 적힌 날짜에 없는 일(日)을 지어 넣지 않는다.
 * 기간으로 적힌 일은 '시작 ~ 끝'으로 보여 준다.
 */
function formatDate(ev) {
  if (ev.precision === 'range' && ev.end) {
    const sameYear = ev.end.slice(0, 4) === ev.date.slice(0, 4)
    return `${ev.date} ~ ${sameYear ? ev.end.slice(5) : ev.end}`
  }
  return ev.date
}

function EventRow({ ev, docs }) {
  return (
    <li className={ev.future ? 'ev ev-future' : 'ev'}>
      <div className="ev-when">
        <span className="ev-date">{formatDate(ev)}</span>
        {ev.time && <span className="ev-time">{ev.time}</span>}
        {ev.precision === 'month' && <span className="ev-loose">월 단위</span>}
      </div>
      <div className="ev-body">
        <div className="ev-head">
          <code className="type-code">{ev.type}</code>
          <span className="ev-title">{ev.title}</span>
          {ev.date_status === '추정' && <span className="badge">날짜 추정</span>}
          {ev.open && <span className="badge">미결</span>}
          {ev.future && <span className="badge">오늘 이후</span>}
          {ev.warning && (
            <span className="badge badge-warn">
              <span className="warn-glyph" aria-hidden="true">
                ▲
              </span>
              주의
            </span>
          )}
        </div>
        {ev.note && <p className="rel-note">{ev.note}</p>}
        {ev.docs?.length > 0 && (
          <p className="rel-note rel-evidence">
            {ev.docs.map((id) => basename(docs[id]?.path) || id).join(' · ')}
          </p>
        )}
      </div>
    </li>
  )
}

export default function TimelineWidget({ timeline, documents, today }) {
  const [scope, setScope] = useState('all') // 보여 줄 범위. all(전체), past(오늘까지), future(오늘 이후)
  const [warnOnly, setWarnOnly] = useState(false)

  const docs = useMemo(
    () => Object.fromEntries(documents.map((d) => [d.id, d])),
    [documents]
  )

  // 분기마다 이벤트가 몇 건인지 센다. 이벤트가 없는 분기도 빈 칸으로 남긴다.
  // 빈 분기를 건너뛰면 축이 줄어들어, 예를 들어 "2025년 하반기에는 아무 일도 없었다"는
  // 사실이 화면에서 사라진다.
  const quarters = useMemo(() => {
    if (!timeline.some((ev) => quarterIndex(ev.date) !== null)) return []
    const hits = new Map()
    let lo = Infinity
    let hi = -Infinity
    for (const ev of timeline) {
      const q = quarterIndex(ev.date)
      if (q === null) continue // 날짜를 읽지 못한 이벤트는 분기 막대에 넣지 않는다
      lo = Math.min(lo, q)
      hi = Math.max(hi, q)
      if (!hits.has(q)) hits.set(q, { count: 0, future: true })
      const bucket = hits.get(q)
      bucket.count += 1
      if (!ev.future) bucket.future = false
    }
    const out = []
    for (let q = lo; q <= hi; q += 1) {
      const hit = hits.get(q)
      out.push({
        idx: q,
        label: quarterLabel(q),
        count: hit?.count ?? 0,
        future: hit ? hit.future : false,
      })
    }
    return out
  }, [timeline])

  const { domain, ticks } = useMemo(
    () => niceScale(quarters.reduce((m, q) => Math.max(m, q.count), 0)),
    [quarters]
  )

  const todayQuarter = today ? quarterIndex(today) : null

  const shown = useMemo(() => {
    let list = timeline
    if (scope === 'past') list = list.filter((e) => !e.future)
    if (scope === 'future') list = list.filter((e) => e.future)
    if (warnOnly) list = list.filter((e) => e.warning)
    return list // 다시 정렬하지 않는다. 순서는 데이터 파일이 정해 둔 대로 쓴다(dashboard.json의 _meta.timeline_order 참고)
  }, [timeline, scope, warnOnly])

  const futureTotal = timeline.filter((e) => e.future).length
  const warnTotal = timeline.filter((e) => e.warning).length

  // 이벤트를 연도별로 묶는다. 순서는 바꾸지 않고, 연도가 바뀌는 곳에서 끊어 새 묶음을 시작한다.
  const years = useMemo(() => {
    const out = []
    const unknown = []
    for (const ev of shown) {
      const p = parseDate(ev.date)
      if (!p) {
        unknown.push(ev)
        continue
      }
      const y = String(p.y)
      if (!out.length || out[out.length - 1].year !== y) out.push({ year: y, events: [] })
      out[out.length - 1].events.push(ev)
    }
    if (unknown.length) out.push({ year: '날짜 미상', events: unknown })
    return out
  }, [shown])

  // '오늘' 구분선은 오늘 이후(future) 이벤트가 처음 나오는 자리 바로 앞에 긋는다.
  // 어디부터가 오늘 이후인지는 데이터에 표시돼 있다.
  const firstFutureIdx = shown.findIndex((e) => e.future)

  return (
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">시간축 타임라인</h2>
        <span className="card-meta">
          이벤트 {timeline.length}건 · {timeline[0]?.date} ~{' '}
          {timeline[timeline.length - 1]?.date}
        </span>
      </div>
      <p className="card-sub">
        계약·단가·정책·보고가 언제 일어났는지. 오늘({today}) 이후 {futureTotal}건은 다가올 계약
        시한·만료다.
      </p>

      <div className="filter-row">
        {[
          ['all', `전체 ${timeline.length}`],
          ['past', `오늘까지 ${timeline.length - futureTotal}`],
          ['future', `오늘 이후 ${futureTotal}`],
        ].map(([key, label]) => (
          <button
            key={key}
            className={scope === key ? 'chip chip-on' : 'chip'}
            onClick={() => setScope(key)}
            aria-pressed={scope === key}
          >
            {label}
          </button>
        ))}
        <label className="chip chip-check">
          <input
            type="checkbox"
            checked={warnOnly}
            onChange={(e) => setWarnOnly(e.target.checked)}
          />
          주의만 {warnTotal}
        </label>
      </div>

      <h3 className="sub-head">
        분기별 이벤트 수
        <span className="sub-head-count">필터와 무관하게 전체를 보여준다</span>
      </h3>

      <div className="col-chart">
        <div className="col-grid" aria-hidden="true">
          {ticks.map((t) => (
            <div
              key={t}
              className="col-gridline"
              data-zero={t === 0 ? 'true' : 'false'}
              style={{ bottom: `${(t / domain) * 100}%` }}
            >
              <span className="col-tick">{t}</span>
            </div>
          ))}
        </div>
        <div className="col-bands">
          {quarters.map((q) => (
            <div
              className="col-band"
              key={q.idx}
              tabIndex={0}
              aria-label={`${q.label} ${q.count}건`}
            >
              <div className="col-slot">
                {q.count > 0 && (
                  <div
                    className={q.future ? 'col-bar col-bar-future' : 'col-bar'}
                    style={{ height: `${(q.count / domain) * 100}%` }}
                  >
                    <span className="col-value">{q.count}</span>
                  </div>
                )}
              </div>
              <div
                className={
                  q.idx === todayQuarter ? 'col-label col-label-now' : 'col-label'
                }
              >
                {q.label}
                {q.idx === todayQuarter && (
                  <span className="col-now" aria-label={`오늘 ${today}`}>
                    ▲ 오늘
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="chart-foot">
        이벤트가 없는 분기도 빈 자리로 남겼다. 건너뛰면 축이 압축되어 "2025년 하반기에
        아무 기록도 없다"는 사실이 지워진다. 전부 오늘 이후인 분기는 막대를 비워 뒀고,
        오늘이 낀 분기(▲)는 지난 일과 앞일이 섞여 있어 채운 막대로 둔다.
      </p>

      <h3 className="sub-head">
        이벤트
        <span className="sub-head-count">
          {shown.length}건{scope !== 'all' || warnOnly ? ' (필터 적용됨)' : ''}
        </span>
      </h3>

      {shown.length === 0 && <p className="empty">조건에 맞는 이벤트가 없다.</p>}

      {years.map(({ year, events }) => (
        <section key={year + events[0].date} className="tl-year">
          <div className="tl-year-head">{year}</div>
          <ul className="ev-list">
            {events.map((ev, i) => {
              const globalIdx = shown.indexOf(ev)
              const isBoundary = globalIdx === firstFutureIdx && firstFutureIdx > 0
              return (
                <Fragment key={`${ev.date}-${ev.title}-${i}`}>
                  {isBoundary && (
                    <li className="tl-now" role="separator">
                      <span>오늘 {today}</span>
                    </li>
                  )}
                  <EventRow ev={ev} docs={docs} />
                </Fragment>
              )
            })}
          </ul>
        </section>
      ))}

      <div className="note">
        <p>
          <strong>배열 순서가 곧 시간 순서다.</strong> 날짜 문자열로 다시 정렬하지 않았다.
          <code>2026-09</code>(9월 말 이동)처럼 월 단위로만 적힌 항목이 같은 달의 일 단위
          항목 앞으로 튀기 때문이다. 없는 날짜를 <code>2026-09-30</code>으로 채워 정렬을
          맞추는 것은 이 저장소가 금지한다.
        </p>
        <p>
          <code>날짜 추정</code> 배지가 붙은 항목은 값이 아니라 추정이다. 카톡 캡처처럼
          문서에 날짜 표기가 없는 경우다.
        </p>
      </div>
    </div>
  )
}
