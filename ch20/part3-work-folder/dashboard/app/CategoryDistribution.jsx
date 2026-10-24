'use client'

import { useMemo, useState } from 'react'

const LABEL_COL = 152

/**
 * 막대 그래프의 눈금을 0부터 깔끔한 간격으로 만든다.
 * 간격은 1, 2, 5, 10, 20, 25, 50, 100 가운데 눈금 칸이 다섯 개를 넘지 않는 가장 작은 값이다.
 */
function niceScale(max) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100]
  const step = steps.find((s) => max / s <= 5) ?? 100
  const domain = Math.max(step, Math.ceil(max / step) * step)
  const ticks = []
  for (let t = 0; t <= domain; t += step) ticks.push(t)
  return { domain, ticks }
}

function Tooltip({ cat, above }) {
  return (
    <div className={above ? 'tooltip above' : 'tooltip'} role="tooltip">
      <div className="tooltip-title">
        {cat.label} · {cat.count}개
      </div>
      <div className="tooltip-path">{cat.path}</div>
      {cat.role && <div className="tooltip-row">성격: {cat.role}</div>}
      {cat.trust && <div className="tooltip-row">주의: {cat.trust}</div>}
    </div>
  )
}

function Row({ cat, domain, hovered, setHovered, above }) {
  const pct = domain ? (cat.count / domain) * 100 : 0
  const isOn = hovered === cat.id

  return (
    <div
      className="row"
      tabIndex={0}
      aria-label={`${cat.label} ${cat.count}개. ${cat.role ?? ''}`}
      onMouseEnter={() => setHovered(cat.id)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(cat.id)}
      onBlur={() => setHovered(null)}
    >
      <div className="row-label">
        <span className="row-label-text">{cat.label}</span>
        {cat.writable && <span className="badge">쓰기</span>}
      </div>
      <div className="track">
        <div className="bar" style={{ width: `${pct}%` }} />
        <span className="bar-value">{cat.count}</span>
      </div>
      {isOn && <Tooltip cat={cat} above={above} />}
    </div>
  )
}

function Gridlines({ ticks, domain }) {
  return (
    <div className="gridlines" aria-hidden="true">
      {ticks.map((t) => (
        <div
          key={t}
          className="gridline"
          data-zero={t === 0 ? 'true' : 'false'}
          style={{ left: `${(t / domain) * 100}%` }}
        />
      ))}
    </div>
  )
}

function Group({ title, count, cats, domain, ticks, hovered, setHovered }) {
  return (
    <>
      <div className="group-label">
        <span>{title}</span>
        <span className="group-count">{count}개</span>
      </div>
      <div className="rows">
        {/* 세로 눈금선은 막대가 그려지는 칸 안에만 긋는다. 그룹 제목 줄 위로는 지나가지 않게 한다. */}
        <Gridlines ticks={ticks} domain={domain} />
        {cats.map((cat, i) => (
          <Row
            key={cat.id}
            cat={cat}
            domain={domain}
            hovered={hovered}
            setHovered={setHovered}
            above={i >= cats.length - 2 && cats.length > 3}
          />
        ))}
      </div>
    </>
  )
}

export default function CategoryDistribution({ categories, totals, source, note }) {
  const [showTable, setShowTable] = useState(false)
  const [hovered, setHovered] = useState(null)

  const { raw, wiki, domain, ticks } = useMemo(() => {
    const byCount = (a, b) => b.count - a.count
    const rawCats = categories.filter((c) => !c.writable).sort(byCount)
    const wikiCats = categories.filter((c) => c.writable).sort(byCount)
    const max = categories.reduce((m, c) => Math.max(m, c.count), 0)
    const scale = niceScale(max)
    return { raw: rawCats, wiki: wikiCats, ...scale }
  }, [categories])

  const rawTotal = raw.reduce((s, c) => s + c.count, 0)
  const wikiTotal = wiki.reduce((s, c) => s + c.count, 0)

  return (
    <div style={{ '--label-col': `${LABEL_COL}px` }}>
      <div className="card">
        <div className="card-head">
          <h2 className="card-title">카테고리별 문서 분포</h2>
          <button className="btn" onClick={() => setShowTable((v) => !v)}>
            {showTable ? '차트 보기' : '표 보기'}
          </button>
        </div>
        <p className="card-sub">
          폴더 단위 문서 수. 원본과 위키는 성격이 달라 나눠 뒀고, 가로 눈금은 공유한다.
        </p>

        <div className="stats">
          <div className="stat">
            <div className="stat-label">원본 (읽기 전용)</div>
            <div className="stat-value">{totals.raw ?? rawTotal}</div>
            <div className="stat-note">거래처·회의록·보고서 등 9개 폴더</div>
          </div>
          <div className="stat">
            <div className="stat-label">wiki (쓰기 가능)</div>
            <div className="stat-value">{totals.wiki ?? wikiTotal}</div>
            <div className="stat-note">원본에서 파생한 요약·색인</div>
          </div>
          <div className="stat">
            <div className="stat-label">합계</div>
            <div className="stat-value">{totals.all ?? rawTotal + wikiTotal}</div>
            <div className="stat-note">CLAUDE.md 1개 포함</div>
          </div>
        </div>

        {showTable ? (
          <div className="table-wrap">
            <table>
              <caption className="sr-only">카테고리별 문서 수</caption>
              <thead>
                <tr>
                  <th scope="col">카테고리</th>
                  <th scope="col">경로</th>
                  <th scope="col" style={{ textAlign: 'right' }}>
                    문서 수
                  </th>
                  <th scope="col">성격</th>
                  <th scope="col">주의</th>
                </tr>
              </thead>
              <tbody>
                {[...raw, ...wiki].map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.label}
                      {c.writable ? ' (쓰기 가능)' : ''}
                    </td>
                    <td>
                      <code>{c.path}</code>
                    </td>
                    <td className="num">{c.count}</td>
                    <td>{c.role}</td>
                    <td>{c.trust}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>합계</td>
                  <td />
                  <td className="num">{rawTotal + wikiTotal}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div>
            <Group
              title="원본 (읽기 전용)"
              count={rawTotal}
              cats={raw}
              domain={domain}
              ticks={ticks}
              hovered={hovered}
              setHovered={setHovered}
            />
            <Group
              title="파생 (쓰기 가능)"
              count={wikiTotal}
              cats={wiki}
              domain={domain}
              ticks={ticks}
              hovered={hovered}
              setHovered={setHovered}
            />

            <div className="axis">
              <div className="axis-inner">
                {ticks.map((t) => (
                  <span
                    key={t}
                    className="tick"
                    style={{ left: `${(t / domain) * 100}%` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="note">
          {note && <p>{note}</p>}
          {source && <p>{source}</p>}
          <p>
            이 화면의 값은 근거가 아니다. 숫자를 인용할 때는 각 폴더의 원본을 열어
            확인할 것.
          </p>
        </div>
      </div>
    </div>
  )
}
