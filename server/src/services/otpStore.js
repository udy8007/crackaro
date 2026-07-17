import crypto from "crypto";
import { supabase } from "../db/supabase.js";
import { isAdminEmail, normalizeEmail } from "./email.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const memoryOtps = new Map();
const memorySessions = new Map();
const verifyAttempts = new Map();

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

/** identity key stored in admin_otps.phone / admin_sessions.phone columns */
export function normalizeIdentity(email) {
  return normalizeEmail(email);
}

export { isAdminEmail, normalizeEmail };

export async function createOtp(email) {
  const key = normalizeIdentity(email);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = hash(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  verifyAttempts.delete(key);

  if (supabase) {
    await supabase
      .from("admin_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("phone", key)
      .is("consumed_at", null);

    const { error } = await supabase.from("admin_otps").insert({
      phone: key,
      otp_hash: otpHash,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("[otp] supabase insert failed, using memory:", error.message);
      memoryOtps.set(key, { otpHash, expiresAt: Date.now() + OTP_TTL_MS });
    }
  } else {
    memoryOtps.set(key, { otpHash, expiresAt: Date.now() + OTP_TTL_MS });
  }

  return otp;
}

export async function verifyOtp(email, otp) {
  const key = normalizeIdentity(email);
  const attempts = (verifyAttempts.get(key) || 0) + 1;
  verifyAttempts.set(key, attempts);
  if (attempts > 5) {
    return { ok: false, message: "Too many attempts. Request a new OTP." };
  }

  const otpHash = hash(String(otp).trim());

  if (supabase) {
    const { data, error } = await supabase
      .from("admin_otps")
      .select("id, otp_hash, expires_at, consumed_at")
      .eq("phone", key)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[otp] supabase read failed:", error.message);
    } else if (data) {
      if (new Date(data.expires_at).getTime() < Date.now()) {
        await supabase
          .from("admin_otps")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", data.id);
        return { ok: false, message: "OTP expired. Please request a new one." };
      }
      if (data.otp_hash !== otpHash) {
        return { ok: false, message: "Invalid OTP." };
      }
      await supabase
        .from("admin_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", data.id);
      verifyAttempts.delete(key);
      return { ok: true };
    }
  }

  const row = memoryOtps.get(key);
  if (!row) {
    return { ok: false, message: "OTP expired. Please request a new one." };
  }
  if (Date.now() > row.expiresAt) {
    memoryOtps.delete(key);
    return { ok: false, message: "OTP expired. Please request a new one." };
  }
  if (row.otpHash !== otpHash) {
    return { ok: false, message: "Invalid OTP." };
  }
  memoryOtps.delete(key);
  verifyAttempts.delete(key);
  return { ok: true };
}

export async function createSession(email) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hash(token);
  const key = normalizeIdentity(email);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  if (supabase) {
    const { error } = await supabase.from("admin_sessions").insert({
      phone: key,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
    if (error) {
      console.error("[otp] session insert failed, using memory:", error.message);
      memorySessions.set(token, {
        email: key,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });
    }
  } else {
    memorySessions.set(token, {
      email: key,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
  }

  return token;
}

export async function getSession(token) {
  if (!token) return null;
  const tokenHash = hash(token);

  if (supabase) {
    const { data, error } = await supabase
      .from("admin_sessions")
      .select("phone, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!error && data) {
      if (new Date(data.expires_at).getTime() < Date.now()) {
        await supabase.from("admin_sessions").delete().eq("token_hash", tokenHash);
        return null;
      }
      return { email: data.phone, phone: data.phone };
    }
  }

  const row = memorySessions.get(token);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    memorySessions.delete(token);
    return null;
  }
  return { email: row.email, phone: row.email };
}

export async function destroySession(token) {
  if (!token) return;
  memorySessions.delete(token);
  if (supabase) {
    await supabase.from("admin_sessions").delete().eq("token_hash", hash(token));
  }
}
