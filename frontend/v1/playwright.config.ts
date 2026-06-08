import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the ObiOne frontend.
 *
 * Prerequisite: the backend must be running and seeded with demo data
 *   (cd ../backend && make up && make seed-demo)
 * so that the consultor/cliente accounts and the 4 demo projects exist.
 *
 * The frontend dev server (Vite, :5173) is started automatically below and
 * reused if one is already running. It reads VITE_API_BASE_URL from .env
 * (defaults to http://localhost:8000).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
