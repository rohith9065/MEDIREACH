import { z } from "zod";

// A forgotten env var should fail loudly at startup, not ship a known-guessable secret —
// this placeholder is the literal value committed in .env.example, so reject it outright once
// we're actually in production.
const PLACEHOLDER_JWT_SECRET = "change-this-to-a-long-random-string";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    TEST_DATABASE_URL: z.string().optional(),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters — generate one with `openssl rand -base64 48`"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    // Comma-separated production frontend origins, e.g. "https://app.example.com,https://admin.example.com".
    // Left unset in local dev — see app.ts for the permissive fallback that applies then.
    CORS_ORIGINS: z.string().optional(),
  })
  .refine((val) => !(val.NODE_ENV === "production" && val.JWT_SECRET === PLACEHOLDER_JWT_SECRET), {
    message: "JWT_SECRET is still the placeholder value from .env.example — set a real secret before running in production",
    path: ["JWT_SECRET"],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;
const isTest = env.NODE_ENV === "test";

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  // In test mode, prefer TEST_DATABASE_URL so `npm test` never touches the dev database.
  databaseUrl: isTest && env.TEST_DATABASE_URL ? env.TEST_DATABASE_URL : env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  corsOrigins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((o) => o.trim()) : undefined,
  isProduction: env.NODE_ENV === "production",
  isTest,
};
