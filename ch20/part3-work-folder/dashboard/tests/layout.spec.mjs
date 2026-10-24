/**
 * 화면에 그려진 모양을 재는 테스트다. 실제 브라우저로 그려 봐야만 알 수 있는 것을 확인한다.
 * 라벨 글자가 잘리지 않는지, 막대 길이가 값에 비례하는지, 화면 밖으로 넘치는 곳이 없는지 본다.
 * 마지막에는 그려진 화면을 눈으로도 확인할 수 있게 스크린샷을 남긴다.
 */
import { expect, test } from '@playwright/test'
import { orderedCategoryCounts } from './_data.mjs'

const card = (page, name) =>
  page.locator('.card').filter({ has: page.getByRole('heading', { name, exact: true }) })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('가로 스크롤이 생기지 않는다', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('카테고리 라벨이 잘리지 않는다', async ({ page }) => {
  const clipped = await card(page, '카테고리별 문서 분포')
    .locator('.row-label-text')
    .evaluateAll((els) =>
      els
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => `${el.textContent} (${el.scrollWidth}px > ${el.clientWidth}px)`)
    )
  expect(clipped, '말줄임으로 잘리는 라벨이 있다 — 라벨 열을 넓혀야 한다').toEqual([])
})

test('관계 유형 이름이 잘리지 않는다', async ({ page }) => {
  const clipped = await card(page, '문서 간 관계')
    .locator('.row-label-text')
    .evaluateAll((els) =>
      els
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => `${el.textContent} (${el.scrollWidth}px > ${el.clientWidth}px)`)
    )
  expect(clipped).toEqual([])
})

test('막대 길이가 값에 비례한다', async ({ page }) => {
  const widths = await card(page, '카테고리별 문서 분포')
    .locator('.bar')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width))

  expect(widths.length).toBe(orderedCategoryCounts.length)

  const max = Math.max(...orderedCategoryCounts)
  const maxWidth = Math.max(...widths)
  widths.forEach((w, i) => {
    const expected = (orderedCategoryCounts[i] / max) * maxWidth
    expect(
      Math.abs(w - expected),
      `${i}번째 막대 폭이 값과 어긋난다 (값 ${orderedCategoryCounts[i]}, 폭 ${w.toFixed(1)}px, 기대 ${expected.toFixed(1)}px)`
    ).toBeLessThanOrEqual(1.5)
  })
})

test('막대가 트랙을 넘지 않는다', async ({ page }) => {
  for (const title of ['카테고리별 문서 분포', '문서 간 관계']) {
    const over = await card(page, title)
      .locator('.track')
      .evaluateAll((tracks) =>
        tracks
          .map((tr) => {
            const bar = tr.querySelector('.bar')
            if (!bar) return null
            const t = tr.getBoundingClientRect()
            const b = bar.getBoundingClientRect()
            return b.right > t.right + 1 ? `${b.right - t.right}px 넘침` : null
          })
          .filter(Boolean)
      )
    expect(over, `${title}에서 막대가 트랙을 넘었다`).toEqual([])
  }
})

test('카드 안 요소가 카드를 넘치지 않는다', async ({ page }) => {
  const bleed = await page.locator('.card').evaluateAll((cards) =>
    cards.flatMap((c) => {
      const box = c.getBoundingClientRect()
      return [...c.querySelectorAll('*')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && (r.right > box.right + 1 || r.left < box.left - 1)
        })
        .slice(0, 5)
        .map((el) => `${el.className || el.tagName}`)
    })
  )
  expect(bleed).toEqual([])
})

test('좁은 화면에서도 가로 스크롤이 생기지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 900 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('스크린샷을 남긴다 (전체·위젯별, 라이트·다크)', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 1200 })

  const shots = [
    ['dist', '카테고리별 문서 분포'],
    ['rel', '문서 간 관계'],
    ['time', '시간축 타임라인'],
  ]

  await page.screenshot({ path: 'screenshots/full-light.png', fullPage: true })
  for (const [key, name] of shots) {
    await card(page, name).screenshot({ path: `screenshots/${key}-light.png` })
  }

  await page.getByRole('button', { name: '라이트·다크 전환' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.screenshot({ path: 'screenshots/full-dark.png', fullPage: true })
  for (const [key, name] of shots) {
    await card(page, name).screenshot({ path: `screenshots/${key}-dark.png` })
  }
})
