import { Router } from "express";
import { quoteShipping } from "../services/shipping.js";

const router = Router();

router.get("/quote", (req, res) => {
  const pincode = String(req.query.pincode || "").trim();
  const subtotal = Number(req.query.subtotal) || 0;
  const state = String(req.query.state || "").trim();
  const quote = quoteShipping({ pincode, subtotal, state });
  return res.json(quote);
});

export default router;
