import { Router } from "express";
import { notifyNtfy } from "../services/ntfy.js";

const router = Router();

/** Simple in-memory throttle: max 40 publishes / IP / minute. */
const hits = new Map();

function allow(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 40;
  const row = hits.get(ip) || { count: 0, start: now };
  if (now - row.start > windowMs) {
    hits.set(ip, { count: 1, start: now });
    return true;
  }
  row.count += 1;
  hits.set(ip, row);
  return row.count <= max;
}

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) {
    return xf.split(",")[0].trim();
  }
  const ip = req.ip || req.socket?.remoteAddress || "";
  return String(ip).replace(/^::ffff:/, "") || "unknown";
}

async function lookupIpGeo(ip) {
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
    return null;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.error) return null;
    return {
      city: data.city || "",
      region: data.region || "",
      country: data.country_name || data.country || "",
      postal: data.postal || "",
      org: data.org || "",
      lat: data.latitude ?? null,
      lon: data.longitude ?? null,
    };
  } catch {
    return null;
  }
}

function line(label, value) {
  const v = String(value ?? "").trim();
  return v ? `${label}: ${v}` : null;
}

function formatVisitorMessage({ kind, visitor, ip, ipGeo }) {
  const v = visitor || {};
  const maps =
    v.geo?.lat != null && v.geo?.lon != null
      ? `https://maps.google.com/?q=${v.geo.lat},${v.geo.lon}`
      : ipGeo?.lat != null && ipGeo?.lon != null
        ? `https://maps.google.com/?q=${ipGeo.lat},${ipGeo.lon}`
        : "";

  const parts = [
    kind === "lead" ? "Lead details entered on site" : "New site visitor",
    line("Name", v.name),
    line("Mobile", v.phone),
    line("Email", v.email),
    line("Address", v.address),
    line("City", v.city),
    line("State", v.state),
    line("Pincode", v.pincode),
    line("IP", ip),
    line(
      "IP location",
      [ipGeo?.city, ipGeo?.region, ipGeo?.country, ipGeo?.postal]
        .filter(Boolean)
        .join(", ")
    ),
    line("ISP", ipGeo?.org),
    line(
      "GPS",
      v.geo
        ? `${v.geo.lat}, ${v.geo.lon} (±${v.geo.accuracyM || "?"}m)`
        : ""
    ),
    line("Maps", maps),
    line("Page", v.path || v.href),
    line("Referrer", v.referrer),
    line("Timezone", v.timezone),
    line("Language", v.language || v.languages),
    line("Device", v.platform),
    line("Screen", v.screen),
    line(
      "Network",
      v.connection?.type
        ? `${v.connection.type}${
            v.connection.downlink != null ? ` · ${v.connection.downlink}Mbps` : ""
          }`
        : ""
    ),
    line("UA", v.userAgent),
  ].filter(Boolean);

  return parts.join("\n").slice(0, 2000);
}

/**
 * Client → server → ntfy (avoids browser CORS failures to ntfy.sh).
 * POST /api/ntfy  { title, message, tags?, priority? }
 */
router.post("/", async (req, res) => {
  const ip = clientIp(req);
  if (!allow(ip)) {
    return res.status(429).json({ ok: false, message: "Too many notifications" });
  }

  const title = String(req.body?.title || "Crackaro").slice(0, 120);
  const message = String(req.body?.message || title).slice(0, 2000);
  const tags = req.body?.tags || "bell";
  const priority = Number(req.body?.priority) || 3;

  const ok = await notifyNtfy({ title, message, tags, priority });
  return res.status(ok ? 200 : 502).json({ ok });
});

/**
 * Rich visitor / lead capture.
 * POST /api/ntfy/visit  { kind?: 'visit'|'lead', visitor: {...} }
 */
router.post("/visit", async (req, res) => {
  const ip = clientIp(req);
  if (!allow(ip)) {
    return res.status(429).json({ ok: false, message: "Too many notifications" });
  }

  const kind = req.body?.kind === "lead" ? "lead" : "visit";
  const visitor = req.body?.visitor && typeof req.body.visitor === "object"
    ? req.body.visitor
    : {};

  const ipGeo = await lookupIpGeo(ip);
  const hasIdentity = Boolean(
    String(visitor.name || "").trim() || String(visitor.phone || "").trim()
  );

  const title =
    kind === "lead"
      ? `Lead · ${visitor.name || visitor.phone || "customer"}`
      : hasIdentity
        ? `Visitor · ${visitor.name || visitor.phone}`
        : "Crackaro — visitor";

  const message = formatVisitorMessage({ kind, visitor, ip, ipGeo });
  const ok = await notifyNtfy({
    title,
    message,
    tags: kind === "lead" ? ["bust_in_silhouette", "telephone_receiver"] : ["eyes", "round_pushpin"],
    priority: kind === "lead" ? 4 : 3,
  });

  return res.status(ok ? 200 : 502).json({ ok, ip });
});

export default router;
