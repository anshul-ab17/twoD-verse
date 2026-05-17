import rateLimit from "express-rate-limit"

// Strict limit for auth endpoints — prevents brute-force and credential stuffing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
})

// General API limit — soft DDoS protection for all REST routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
  skip: (req) => req.path === "/health",
})

// Tighter limit for search/friends — prevents scraping and enumeration
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
})
