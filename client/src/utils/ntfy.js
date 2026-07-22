const API_BASE = import.meta.env.VITE_API_URL || "/api";
const VISIT_KEY = "crackaro_ntfy_visit_v3";
const LEAD_PUSH_KEY = "crackaro_ntfy_lead_v1";

/**
 * Fire-and-forget via our API → ntfy.sh/crackro.
 */
export function notifyNtfy({
  title = "Crackaro",
  message = "",
  tags = "shopping_cart",
  priority = 3,
} = {}) {
  try {
    const payload = {
      title: String(title).slice(0, 120),
      message: String(message || title).slice(0, 2000),
      tags: Array.isArray(tags) ? tags : String(tags),
      priority: Number(priority) || 3,
    };
    void fetch(`${API_BASE}/ntfy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

/** Full visitor capture → server enriches IP/geo → ntfy. */
export async function notifySiteVisit() {
  try {
    if (typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(VISIT_KEY)) return;
      sessionStorage.setItem(VISIT_KEY, "1");
    }
  } catch {
    // continue
  }

  try {
    const { collectVisitorInfo } = await import("./visitor.js");
    const visitor = await collectVisitorInfo({ askGeo: true });
    void fetch(`${API_BASE}/ntfy/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    notifyNtfy({
      title: "Crackaro — visitor",
      message: `Someone entered (${window.location.pathname || "/"})`,
      tags: ["eyes"],
    });
  }
}

/**
 * When checkout/contact has mobile (and ideally name), push lead once per session.
 */
export function notifyLeadCaptured(lead = {}) {
  const name = String(lead.name || "").trim();
  const phone = String(lead.phone || "").replace(/\D/g, "");
  if (phone.length < 10) return;

  try {
    if (typeof sessionStorage !== "undefined") {
      const key = `${LEAD_PUSH_KEY}:${phone || name}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    }
  } catch {
    // continue
  }

  void fetch(`${API_BASE}/ntfy/visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "lead",
      visitor: {
        name,
        phone,
        email: lead.email || "",
        address: lead.address || "",
        city: lead.city || "",
        state: lead.state || "",
        pincode: lead.pincode || "",
        path: window.location.pathname || "/",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        language: navigator.language || "",
        userAgent: String(navigator.userAgent || "").slice(0, 240),
      },
    }),
    keepalive: true,
  }).catch(() => {});
}
