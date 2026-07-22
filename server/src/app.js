import "./loadEnv.js";
import express from "express";
import cors from "cors";
import enquiriesRouter from "./routes/enquiries.js";
import ordersRouter from "./routes/orders.js";
import adminAuthRouter from "./routes/adminAuth.js";
import productsRouter from "./routes/products.js";
import shippingRouter from "./routes/shipping.js";
import settingsRouter from "./routes/settings.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "crackaro-api",
    db: Boolean(
      process.env.SUPABASE_URL &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
    ),
  });
});

app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/products", productsRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/enquiries", enquiriesRouter);
app.use("/api/orders", ordersRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});

export default app;
