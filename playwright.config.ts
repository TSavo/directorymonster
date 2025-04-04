import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
  },
  // Keep it simple with minimal retries
  retries: 1,
};

export default config;
