import { Router } from "express";
import { quoteShippingWithSettings } from "../services/shipping.js";

const router = Router();

router.get("/quote", async (req, res) => {
  try {
    const pincode = String(req.query.pincode || "").trim();
    const subtotal = Number(req.query.subtotal) || 0;
    const state = String(req.query.state || "").trim();
    const quote = await quoteShippingWithSettings({ pincode, subtotal, state });
    return res.json(quote);
  } catch (error) {
    console.error("[shipping]", error);
    return res.status(500).json({
      serviceable: false,
      fee: 0,
      message: "Could not calculate shipping.",
    });
  }
});

export default router;
