import { expect, test } from '@playwright/test'
import {
  categories,
  data,
  futureEvents,
  orderedCategoryCounts,
  relations,
  relationTypes,
  timeline,
  warningRelations,
} from './_data.mjs'

const card = (page, name) =>
  page.locator('.card').filter({ has: page.getByRole('heading', { name, exact: true }) })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('세 위젯이 모두 보인다', async ({ page }) => {
  for (const name of ['카테고리별 문서 분포', '문서 간 관계', '시간축 타임라인']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  }
  await expect(page.locator('.card')).toHaveCount(3)
})

test('데이터 읽기 실패 화면이 아니다', async ({ page }) => {
  await expect(page.getByText('데이터를 읽지 못했다')).toHaveCount(0)
})

test.describe('분포 위젯', () => {
  test('막대가 카테고리 수만큼 있고 값이 데이터와 같다', async ({ page }) => {
    const c = card(page, '카테고리별 문서 분포')
    await expect(c.locator('.bar')).toHaveCount(categories.length)
    const shown = await c.locator('.bar-value').allTextContents()
    expect(shown.map(Number)).toEqual(orderedCategoryCounts)
  })

  test('스탯 타일이 원본·wiki·합계를 그대로 보여준다', async ({ page }) => {
    const { total_raw, total_wiki, total_repo_docs } = data.category_counts
    const shown = await card(page, '카테고리별 문서 분포')
      .locator('.stat-value')
      .allTextContents()
    expect(shown.map(Number)).toEqual([total_raw, total_wiki, total_repo_docs])
  })

  test('카테고리 라벨이 하나도 빠지지 않았다', async ({ page }) => {
    const c = card(page, '카테고리별 문서 분포')
    for (const cat of categories) {
      await expect(c.getByText(cat.label, { exact: true }).first()).toBeVisible()
    }
  })
})

test.describe('관계 위젯', () => {
  test('관계 항목이 엣지 수만큼 있다', async ({ page }) => {
    await expect(card(page, '문서 간 관계').locator('li.rel')).toHaveCount(relations.length)
  })

  test('유형 막대가 유형 수만큼 있고 건수 합이 엣지 수와 같다', async ({ page }) => {
    const c = card(page, '문서 간 관계')
    await expect(c.locator('.row-btn')).toHaveCount(relationTypes.length)
    const shown = await c.locator('.row-btn .bar-value').allTextContents()
    expect(shown.reduce((s, v) => s + Number(v), 0)).toBe(relations.length)
  })

  test('주의 배지가 warning 관계 수와 같다', async ({ page }) => {
    await expect(card(page, '문서 간 관계').locator('.badge-warn')).toHaveCount(
      warningRelations
    )
  })
})

test.describe('타임라인 위젯', () => {
  test('이벤트 항목이 timeline 수만큼 있다', async ({ page }) => {
    await expect(card(page, '시간축 타임라인').locator('li.ev')).toHaveCount(timeline.length)
  })

  test('분기 축이 끊기지 않는다 (빈 분기도 자리를 지킨다)', async ({ page }) => {
    const labels = await card(page, '시간축 타임라인').locator('.col-label').allTextContents()
    const idx = labels.map((t) => {
      const m = t.match(/(\d{2})Q([1-4])/)
      expect(m, `분기 라벨을 읽지 못했다: ${t}`).not.toBeNull()
      return Number(m[1]) * 4 + Number(m[2]) - 1
    })
    expect(idx.length).toBeGreaterThan(1)
    for (let i = 1; i < idx.length; i += 1) {
      expect(idx[i] - idx[i - 1], `분기가 건너뛰었다: ${labels[i - 1]} → ${labels[i]}`).toBe(1)
    }
  })

  test('분기 막대 값의 합이 이벤트 수와 같다', async ({ page }) => {
    const shown = await card(page, '시간축 타임라인').locator('.col-value').allTextContents()
    expect(shown.reduce((s, v) => s + Number(v), 0)).toBe(timeline.length)
  })

  test('"오늘 이후" 배지가 future 이벤트 수와 같다', async ({ page }) => {
    // 필터 버튼('오늘 이후 N')은 세지 않고, 이벤트 옆에 붙은 '오늘 이후' 표시만 센다
    await expect(
      card(page, '시간축 타임라인').locator('li.ev .badge', { hasText: /^오늘 이후$/ })
    ).toHaveCount(futureEvents)
  })

  test('배열 순서가 화면 순서와 같다 (재정렬하지 않았다)', async ({ page }) => {
    const shown = await card(page, '시간축 타임라인').locator('.ev-title').allTextContents()
    expect(shown).toEqual(timeline.map((e) => e.title))
  })
})
