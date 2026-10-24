/**
 * 화면을 직접 눌러 보는 테스트다. 서버가 만든 HTML만 봐서는 확인할 수 없는 부분을 다룬다.
 * 필터, 켜고 끄는 버튼, 툴팁, 밝은 화면과 어두운 화면 전환이 실제 브라우저에서 동작하는지 본다.
 */
import { expect, test } from '@playwright/test'
import {
  categories,
  futureEvents,
  pastEvents,
  relations,
  relationTypeCount,
  relationTypes,
  timeline,
  warningEvents,
  warningRelations,
} from './_data.mjs'

const card = (page, name) =>
  page.locator('.card').filter({ has: page.getByRole('heading', { name, exact: true }) })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('분포 위젯', () => {
  test('표 보기 토글이 차트와 표를 바꿔 놓는다', async ({ page }) => {
    const c = card(page, '카테고리별 문서 분포')
    await expect(c.locator('.bar').first()).toBeVisible()
    await expect(c.locator('table')).toHaveCount(0)

    await c.getByRole('button', { name: '표 보기' }).click()

    await expect(c.locator('table')).toBeVisible()
    await expect(c.locator('.bar')).toHaveCount(0)
    // 표에도 모든 카테고리가 빠짐없이 나와야 한다.
    // 마우스를 올려야만 보이는 툴팁에만 값을 숨겨 두지 않는다는 규칙이다.
    await expect(c.locator('tbody tr')).toHaveCount(categories.length)

    await c.getByRole('button', { name: '차트 보기' }).click()
    await expect(c.locator('.bar').first()).toBeVisible()
  })

  test('행에 hover하면 툴팁이 뜬다', async ({ page }) => {
    const c = card(page, '카테고리별 문서 분포')
    await expect(c.locator('.tooltip')).toHaveCount(0)

    const row = c.locator('.row').first()
    await row.hover()

    const tip = c.locator('.tooltip')
    await expect(tip).toBeVisible()
    await expect(tip.locator('.tooltip-path')).not.toBeEmpty()
  })

  test('키보드 포커스로도 같은 툴팁이 뜬다', async ({ page }) => {
    const c = card(page, '카테고리별 문서 분포')
    await c.locator('.row').first().focus()
    await expect(c.locator('.tooltip')).toBeVisible()
  })
})

test.describe('관계 위젯', () => {
  test('유형 칩을 누르면 그 유형만 남는다', async ({ page }) => {
    const c = card(page, '문서 간 관계')
    await expect(c.locator('li.rel')).toHaveCount(relations.length)

    const type = relationTypes[0]
    await c.getByRole('button', { name: new RegExp(`^${type} \\d+$`) }).click()

    await expect(c.locator('li.rel')).toHaveCount(relationTypeCount(type))
    await expect(c.locator('.type-code')).toHaveCount(1)
  })

  test('유형 막대를 눌러도 같은 필터가 걸리고 나머지가 흐려진다', async ({ page }) => {
    const c = card(page, '문서 간 관계')
    const type = relationTypes[0]

    await c.locator('.row-btn', { hasText: new RegExp(`^${type}`) }).click()

    await expect(c.locator('li.rel')).toHaveCount(relationTypeCount(type))
    await expect(c.locator('.row-btn.row-dim')).toHaveCount(relationTypes.length - 1)
  })

  test('"전체" 칩이 필터를 되돌린다', async ({ page }) => {
    const c = card(page, '문서 간 관계')
    await c.getByRole('button', { name: new RegExp(`^${relationTypes[0]} \\d+$`) }).click()
    await expect(c.locator('li.rel')).not.toHaveCount(relations.length)

    await c.getByRole('button', { name: /^전체 \d+$/ }).click()
    await expect(c.locator('li.rel')).toHaveCount(relations.length)
  })

  test('"주의만"이 warning 관계만 남긴다', async ({ page }) => {
    const c = card(page, '문서 간 관계')
    await c.getByRole('checkbox').check()
    await expect(c.locator('li.rel')).toHaveCount(warningRelations)
    await expect(c.locator('.badge-warn')).toHaveCount(warningRelations)
  })
})

test.describe('타임라인 위젯', () => {
  test('오늘까지 / 오늘 이후 필터가 이벤트를 나눈다', async ({ page }) => {
    const c = card(page, '시간축 타임라인')
    await expect(c.locator('li.ev')).toHaveCount(timeline.length)

    await c.getByRole('button', { name: /^오늘 이후 \d+$/ }).click()
    await expect(c.locator('li.ev')).toHaveCount(futureEvents)

    await c.getByRole('button', { name: /^오늘까지 \d+$/ }).click()
    await expect(c.locator('li.ev')).toHaveCount(pastEvents)

    await c.getByRole('button', { name: /^전체 \d+$/ }).click()
    await expect(c.locator('li.ev')).toHaveCount(timeline.length)
  })

  test('"주의만"이 warning 이벤트만 남긴다', async ({ page }) => {
    const c = card(page, '시간축 타임라인')
    await c.getByRole('checkbox').check()
    await expect(c.locator('li.ev')).toHaveCount(warningEvents)
  })

  test('분기 막대는 필터와 무관하게 전체를 유지한다', async ({ page }) => {
    const c = card(page, '시간축 타임라인')
    const before = await c.locator('.col-value').allTextContents()

    await c.getByRole('button', { name: /^오늘 이후 \d+$/ }).click()
    await expect(c.locator('li.ev')).toHaveCount(futureEvents)

    expect(await c.locator('.col-value').allTextContents()).toEqual(before)
  })
})

test('테마 토글이 실제로 배경색을 바꾼다', async ({ page }) => {
  const bg = () =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  const first = await bg()
  await page.getByRole('button', { name: '라이트·다크 전환' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/)
  const second = await bg()

  expect(second).not.toBe(first)
})
