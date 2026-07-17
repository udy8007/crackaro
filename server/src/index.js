import "./loadEnv.js";
import express from "express";
import cors from "cors";
import enquiriesRouter from "./routes/enquiries.js";
import ordersRouter from "./routes/orders.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "crackaro-api",
    db: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)),
  });
});

app.use("/api/enquiries", enquiriesRouter);
app.use("/api/orders", ordersRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});

app.listen(PORT, () => {
  const hasDb = Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`[db] configured: ${hasDb}`);
});
