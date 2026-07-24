/**
 * Vercel serverless entry — serves Express at /api/*
 * Production: https://crackaro.in/api/health
 */
import app from "../server/src/app.js";

export default function handler(req, res) {
  return app(req, res);
}
