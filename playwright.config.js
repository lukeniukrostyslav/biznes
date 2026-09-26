import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', headless: true, trace: 'retain-on-failure' } },
    { name: 'firefox', use: { browserName: 'firefox', headless: true, trace: 'retain-on-failure' } },
    { name: 'webkit', use: { browserName: 'webkit', headless: true, trace: 'retain-on-failure' } }
  ],
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'node e2e/server.mjs',
    url: 'http://127.0.0.1:4173/app/index.html',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
