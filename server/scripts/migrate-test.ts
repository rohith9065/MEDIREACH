import { spawnSync } from "child_process";

// node-pg-migrate reads DATABASE_URL from the environment. This wrapper points it at
// TEST_DATABASE_URL instead, so `npm test` can migrate the test database independently
// of whatever the dev DATABASE_URL is set to.
const testUrl = process.env.TEST_DATABASE_URL;

if (!testUrl) {
  console.error("TEST_DATABASE_URL is not set. Check server/.env (see .env.example).");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["node-pg-migrate", "up", "-m", "../database/migrations", "-j", "ts", "--tsconfig", "./tsconfig.json"],
  {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DATABASE_URL: testUrl },
  },
);

process.exit(result.status ?? 1);
