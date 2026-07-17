import { Router } from "express";
import {
  createOtp,
  createSession,
  destroySession,
  isAdminEmail,
  normalizeEmail,
  verifyOtp,
} from "../services/otpStore.js";
import {
  getAdminEmail,
  isEmailConfigured,
  isValidEmail,
  maskEmail,
  sendOtpEmail,
} from "../services/email.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = Router();

router.post("/request-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (!isAdminEmail(email)) {
      return res.status(403).json({
        message: "This email is not authorized for admin login.",
      });
    }
    if (!isEmailConfigured()) {
      return res.status(503).json({
        message: "ADMIN_EMAIL is missing in server/.env",
      });
    }

    const otp = await createOtp(email);
    const sendResult = await sendOtpEmail(email, otp);
    const isEthereal = sendResult.provider === "ethereal";

    return res.json({
      message: isEthereal
        ? "OTP emailed via test inbox. Open the preview link (SMTP_PASS not set yet)."
        : `OTP sent to ${maskEmail(email)}. Check your Gmail inbox.`,
      email: maskEmail(email),
      expiresInSec: 300,
      channel: "email",
      provider: sendResult.provider,
      sentTo: maskEmail(sendResult.to),
      ...(sendResult.previewUrl ? { previewUrl: sendResult.previewUrl } : {}),
    });
  } catch (error) {
    console.error("[admin-otp]", error);
    return res.status(500).json({
      message: error.message || "Could not send OTP email.",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (!isAdminEmail(email)) {
      return res.status(403).json({
        message: "This email is not authorized for admin login.",
      });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter the 6-digit OTP." });
    }

    const result = await verifyOtp(email, otp);
    if (!result.ok) {
      return res.status(401).json({ message: result.message });
    }

    const token = await createSession(email);
    return res.json({
      message: "Login successful",
      token,
      admin: { email: getAdminEmail() },
    });
  } catch (error) {
    console.error("[admin-otp]", error);
    return res.status(500).json({ message: "Could not verify OTP." });
  }
});

router.get("/me", adminAuth, (req, res) => {
  return res.json({
    admin: { email: req.admin.email || req.admin.phone },
  });
});

router.post("/logout", async (req, res) => {
  const header = req.header("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const token = bearer || req.header("x-admin-token") || "";
  await destroySession(token);
  return res.json({ message: "Logged out" });
});

export default router;
