import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // The stack under test runs `next dev`, where a first visit to a route
  // compiles it on demand; 30s was not enough headroom for login retries on
  // top of that.
  timeout: 60000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    actionTimeout: 10000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
