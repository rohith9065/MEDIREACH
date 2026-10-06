import rateLimit from "express-rate-limit";

// Unauthenticated hospital search/detail endpoints had no rate limit at all until Phase 10 —
// generous enough not to affect a real user browsing, tight enough to blunt naive scraping.
// Same express-rate-limit shape as auth.routes.ts's authLimiter, just a higher ceiling.
export const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
