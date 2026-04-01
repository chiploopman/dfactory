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
    trace: "on-first-retry"
  },
  webServer: [
    {
      command: "pnpm --dir examples/react-starter dev --host 127.0.0.1 --port 3210 --ui-port 3211",
      port: 3211,
      timeout: 120_000,
      reuseExistingServer: false,
      cwd: process.cwd()
    },
    {
      command:
        "pnpm --dir examples/react-starter serve --host 127.0.0.1 --port 3220 --ui-dist-dir ../../packages/ui/dist",
      port: 3220,
      timeout: 120_000,
      reuseExistingServer: false,
      cwd: process.cwd()
    },
    {
      command: "pnpm --dir examples/vue-starter dev --host 127.0.0.1 --port 3310 --ui-port 3311",
      port: 3311,
      timeout: 120_000,
      reuseExistingServer: false,
      cwd: process.cwd()
    },
    {
      command:
        "pnpm --dir examples/vue-starter serve --host 127.0.0.1 --port 3320 --ui-dist-dir ../../packages/ui/dist",
      port: 3320,
      timeout: 120_000,
      reuseExistingServer: false,
      cwd: process.cwd()
    }
  ],
  projects: [
    {
      name: "react-chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:3211"
      }
    },
    {
      name: "vue-chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:3311"
      }
    }
  ]
});
