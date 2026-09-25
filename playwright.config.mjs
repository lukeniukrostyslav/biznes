import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: { browserName: 'chromium', headless: true },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173/app/index.html',
    reuseExistingServer: true,
    timeout: 15000
  },
  reporter: [['list']]
});
