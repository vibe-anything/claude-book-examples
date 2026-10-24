import fs from 'node:fs'
import path from 'node:path'
import Shell from './Shell'
import CategoryDistribution from './CategoryDistribution'
import RelationsWidget from './RelationsWidget'
import TimelineWidget from './TimelineWidget'

// 화면에 쓸 데이터는 wiki/data/dashboard.json을 그때그때 직접 읽는다.
// 사본을 dashboard/ 안에 두지 않는 이유는 이 폴더가 단가표 사본 네 개로 겪은 일과 같다.
// 원본이 바뀌어도 사본은 따라 바뀌지 않아서, 어느 것이 최신인지 모르게 된다.
const DATA_PATH = path.resolve(process.cwd(), '..', 'wiki', 'data', 'dashboard.json')

// 화면을 열 때마다 파일을 다시 읽는다. JSON을 고친 뒤 새로 고침만 하면 바로 반영된다.
export const dynamic = 'force-dynamic'

function loadData() {
  try {
    return { data: JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')), error: null }
  } catch (err) {
    return { data: null, error: err.message }
  }
}

export default function Page() {
  const { data, error } = loadData()

  if (error) {
    return (
      <main className="page">
        <h1 className="page-title">데이터를 읽지 못했다</h1>
        <div className="error">
          <p>
            <code>{DATA_PATH}</code>
          </p>
          <p className="page-sub">{error}</p>
          <p className="page-sub">
            이 앱은 저장소 루트의 <code>wiki/data/dashboard.json</code>을 읽는다.
            <code>dashboard/</code> 안에서 <code>npm run dev</code>로 실행해야 상대 경로가 맞는다.
          </p>
        </div>
      </main>
    )
  }

  const meta = data._meta ?? {}
  const counts = data.category_counts ?? {}

  return (
    <main className="page">
      <Shell generated={meta.generated}>
        <CategoryDistribution
          categories={counts.by_category ?? []}
          totals={{
            raw: counts.total_raw,
            wiki: counts.total_wiki,
            all: counts.total_repo_docs,
          }}
          source={meta.source}
          note={counts.note}
        />
        <RelationsWidget
          relations={data.relations ?? []}
          documents={data.documents ?? []}
          relationTypes={meta.relation_types ?? {}}
        />
        <TimelineWidget
          timeline={data.timeline ?? []}
          documents={data.documents ?? []}
          today={meta.today}
        />
      </Shell>
    </main>
  )
}
