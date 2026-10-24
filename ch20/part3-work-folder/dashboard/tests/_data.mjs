/**
 * 테스트가 기대하는 값(건수 등)을 wiki/data/dashboard.json에서 직접 계산한다.
 *
 * 숫자를 테스트 코드에 적어 두지 않는 이유는 이 폴더가 파일 이름의 '최종'으로 겪은 문제와 같다.
 * 숫자를 적어 두면 데이터가 바뀌었을 때 테스트만 옛날 값을 고집하게 된다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const DATA_PATH = path.resolve(HERE, '..', '..', 'wiki', 'data', 'dashboard.json')

export const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

export const categories = data.category_counts.by_category
export const relations = data.relations
export const timeline = data.timeline

export const relationTypes = [...new Set(relations.map((r) => r.type))]
export const relationTypeCount = (type) => relations.filter((r) => r.type === type).length
export const warningRelations = relations.filter((r) => r.warning).length

export const futureEvents = timeline.filter((e) => e.future).length
export const pastEvents = timeline.length - futureEvents
export const warningEvents = timeline.filter((e) => e.warning).length

/**
 * 분포 차트에 막대가 그려지는 순서.
 * 원본 문서 카테고리를 건수가 많은 순서로 먼저 놓고, 그 뒤에 정리하면서 새로 만든
 * 카테고리(위키 등)를 같은 방식으로 놓는다.
 */
export const orderedCategoryCounts = [
  ...categories.filter((c) => !c.writable).sort((a, b) => b.count - a.count),
  ...categories.filter((c) => c.writable).sort((a, b) => b.count - a.count),
].map((c) => c.count)
