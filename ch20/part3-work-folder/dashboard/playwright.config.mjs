import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3601)

export default defineConfig({
  testDir: './tests',
  // 이름이 .spec.mjs로 끝나는 브라우저 테스트만 여기서 실행한다.
  // 서버가 만든 화면을 빠르게 훑는 *.node.test.mjs는 node --test로 따로 돌리므로 뺀다.
  testMatch: /.*\.spec\.mjs$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next dev -p ${PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
