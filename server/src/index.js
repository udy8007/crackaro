import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  const hasDb = Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`[db] configured: ${hasDb}`);
});
