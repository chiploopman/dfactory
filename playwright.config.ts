import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3211",
    trace: "on-first-retry"
  },
  webServer: [
    {
      command:
        "node packages/cli/dist/index.js dev --host 127.0.0.1 --port 3210 --ui-port 3211 --config dfactory.config.ts",
      port: 3211,
      timeout: 120_000,
      reuseExistingServer: false,
      cwd: process.cwd()
    },
    {
      command:
        "node packages/cli/dist/index.js serve --host 127.0.0.1 --port 3220 --config dfactory.config.ts --ui-dist-dir packages/ui/dist",
      port: 3220,
      timeout: 120_000,
      reuseExistingServer: false,
      cwd: process.cwd()
    }
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
