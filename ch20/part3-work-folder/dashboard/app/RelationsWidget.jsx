'use client'

import { useMemo, useState } from 'react'

const LABEL_COL = 132

/** 경로에서 파일 이름만 떼어 낸다. 화면에는 문서 id 대신 사람이 알아보기 쉬운 파일 이름을 보여 준다. */
function basename(p) {
  return p ? p.split('/').pop() : ''
}

function niceScale(max) {
  const steps = [1, 2, 5, 10, 20, 25, 50]
  const step = steps.find((s) => max / s <= 5) ?? 50
  const domain = Math.max(step, Math.ceil(max / step) * step)
  const ticks = []
  for (let t = 0; t <= domain; t += step) ticks.push(t)
  return { domain, ticks }
}

/**
 * 관계 한 건을 한 줄로 보여 준다.
 * 어느 문서에서 어느 문서로 이어지는지(from → to)와 그 관계가 무슨 뜻인지를 함께 적는다.
 */
function RelationRow({ rel, docs }) {
  const from = docs[rel.from]
  const to = docs[rel.to]

  return (
    <li className="rel">
      <div className="rel-pair">
        <span className="rel-doc" title={from?.path ?? rel.from}>
          {basename(from?.path) || rel.from}
        </span>
        <span className="rel-arrow" aria-hidden="true">
          →
        </span>
        <span className="rel-doc" title={to?.path ?? rel.to}>
          {basename(to?.path) || rel.to}
        </span>
        {rel.resolved && <span className="badge">해소됨</span>}
        {rel.warning && (
          <span className="badge badge-warn">
            <span className="warn-glyph" aria-hidden="true">
              ▲
            </span>
            주의
          </span>
        )}
      </div>
      {rel.note && <p className="rel-note">{rel.note}</p>}
      {typeof rel.warning === 'string' && (
        <p className="rel-note rel-note-warn">{rel.warning}</p>
      )}
      {rel.evidence?.length > 0 && (
        <p className="rel-note rel-evidence">
          근거 {rel.evidence.length}건 ·{' '}
          {rel.evidence
            .map((id) => basename(docs[id]?.path) || id)
            .join(' · ')}
        </p>
      )}
    </li>
  )
}

export default function RelationsWidget({ relations, documents, relationTypes }) {
  const [selected, setSelected] = useState(null) // 지금 고른 관계 유형. 고르지 않았으면 null이다.
  const [warnOnly, setWarnOnly] = useState(false)

  const docs = useMemo(
    () => Object.fromEntries(documents.map((d) => [d.id, d])),
    [documents]
  )

  // 관계 유형별 건수는 코드에 숫자로 적어 두지 않고 데이터에서 그때그때 센다.
  const typeCounts = useMemo(() => {
    const counts = new Map()
    for (const r of relations) counts.set(r.type, (counts.get(r.type) ?? 0) + 1)
    return [...counts.entries()]
      .map(([type, count]) => ({ type, count, desc: relationTypes?.[type] ?? '' }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
  }, [relations, relationTypes])

  const { domain, ticks } = useMemo(
    () => niceScale(typeCounts.reduce((m, t) => Math.max(m, t.count), 0)),
    [typeCounts]
  )

  const shown = useMemo(() => {
    let list = relations
    if (selected) list = list.filter((r) => r.type === selected)
    if (warnOnly) list = list.filter((r) => r.warning)
    // 같은 유형끼리 모여 있어야 읽기 편하므로 유형, 그다음 출발 문서 순서로 정렬한다.
    return [...list].sort(
      (a, b) => a.type.localeCompare(b.type) || a.from.localeCompare(b.from)
    )
  }, [relations, selected, warnOnly])

  const warnTotal = relations.filter((r) => r.warning).length
  const grouped = useMemo(() => {
    const g = new Map()
    for (const r of shown) {
      if (!g.has(r.type)) g.set(r.type, [])
      g.get(r.type).push(r)
    }
    return [...g.entries()]
  }, [shown])

  return (
    <div className="card" style={{ '--label-col': `${LABEL_COL}px` }}>
      <div className="card-head">
        <h2 className="card-title">문서 간 관계</h2>
        <span className="card-meta">
          엣지 {relations.length}건 · 유형 {typeCounts.length}종
        </span>
      </div>
      <p className="card-sub">
        어느 문서가 어느 문서를 대체하고, 베끼고, 근거로 삼는지. 화살표는{' '}
        <code>from → to</code>이고, 읽는 방향은 유형 설명을 따른다.
      </p>

      {/* 필터 버튼 줄. 여기서 고른 조건이 아래 막대와 목록에 함께 적용된다. */}
      <div className="filter-row">
        <button
          className={selected === null ? 'chip chip-on' : 'chip'}
          onClick={() => setSelected(null)}
        >
          전체 {relations.length}
        </button>
        {typeCounts.map((t) => (
          <button
            key={t.type}
            className={selected === t.type ? 'chip chip-on' : 'chip'}
            onClick={() => setSelected(selected === t.type ? null : t.type)}
            title={t.desc}
          >
            {t.type} {t.count}
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

      <h3 className="sub-head">관계 유형별 건수</h3>
      <div className="rows">
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
        {typeCounts.map((t) => {
          const dim = selected !== null && selected !== t.type
          return (
            <button
              key={t.type}
              className={dim ? 'row row-btn row-dim' : 'row row-btn'}
              onClick={() => setSelected(selected === t.type ? null : t.type)}
              aria-pressed={selected === t.type}
              aria-label={`${t.type} ${t.count}건. ${t.desc}`}
              title={t.desc}
            >
              <span className="row-label">
                <span className="row-label-text">{t.type}</span>
              </span>
              <span className="track">
                <span
                  className="bar"
                  style={{ width: `${(t.count / domain) * 100}%` }}
                />
                <span className="bar-value">{t.count}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="axis">
        <div className="axis-inner">
          {ticks.map((t) => (
            <span key={t} className="tick" style={{ left: `${(t / domain) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <h3 className="sub-head">
        관계 목록
        <span className="sub-head-count">
          {shown.length}건
          {selected || warnOnly ? ' (필터 적용됨)' : ''}
        </span>
      </h3>

      {grouped.length === 0 && (
        <p className="empty">조건에 맞는 관계가 없다.</p>
      )}

      {grouped.map(([type, rels]) => (
        <section key={type} className="rel-group">
          <div className="rel-group-head">
            <code className="type-code">{type}</code>
            <span className="rel-group-count">{rels.length}건</span>
          </div>
          {relationTypes?.[type] && (
            <p className="rel-group-desc">{relationTypes[type]}</p>
          )}
          <ul className="rel-list">
            {rels.map((r, i) => (
              <RelationRow key={`${r.from}-${r.to}-${r.type}-${i}`} rel={r} docs={docs} />
            ))}
          </ul>
        </section>
      ))}

      <div className="note">
        <p>
          유형 설명은 <code>_meta.relation_types</code>를 그대로 쓴다. 화면에 한글
          이름을 따로 박지 않았다. 박아 두면 JSON이 바뀔 때 화면만 옛말을 하게 된다.
        </p>
        <p>
          노드-링크 그래프로 그리지 않았다. 노드 50개에 한글 라벨이면 서로 겹쳐
          읽히지 않고, 의미를 지닌 분류가 13종이라 목록이 더 정확하다.
        </p>
      </div>
    </div>
  )
}
