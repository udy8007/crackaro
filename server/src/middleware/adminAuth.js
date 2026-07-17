import { getSession } from "../services/otpStore.js";

export async function adminAuth(req, res, next) {
  try {
    const header = req.header("authorization") || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const token =
      bearer ||
      req.header("x-admin-token") ||
      req.header("x-admin-key") ||
      req.query.key;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Please login with email OTP." });
    }

    const session = await getSession(token);
    if (session) {
      req.admin = {
        email: session.email,
        phone: session.phone,
        auth: "email-otp",
      };
      return next();
    }

    const secret = process.env.ADMIN_SECRET;
    if (secret && token === secret) {
      req.admin = {
        email: process.env.ADMIN_EMAIL || "",
        auth: "secret",
      };
      return next();
    }

    return res
      .status(401)
      .json({ message: "Session expired. Please login again." });
  } catch (error) {
    console.error("[adminAuth]", error);
    return res.status(500).json({ message: "Auth error" });
  }
}
