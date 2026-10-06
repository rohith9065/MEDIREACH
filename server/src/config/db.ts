import { Pool, types } from "pg";
import { config } from "./env";

// node-pg's default DATE parser returns a JS Date object at local-timezone midnight, which
// is a well-known source of off-by-one-day bugs once you toISOString() it later (Phase 6
// treats appointment_date as a plain "YYYY-MM-DD" string end to end). Returning the raw
// string from Postgres sidesteps that entirely — applies to every query in the app.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  // Managed Postgres hosts (Supabase, Render, Railway) all terminate with a self-signed cert
  // and require SSL — this is the standard snippet each of them documents. Local dev/test
  // Postgres has no SSL listener at all, so this must stay off outside production.
  ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});
