/**
 * Collect whatever the browser can share without native app access.
 * Name / mobile only exist if the visitor typed them (or we saved them earlier).
 */

const LEAD_KEY = "crackaro_visitor_lead";

export function loadSavedLead() {
  try {
    const raw = localStorage.getItem(LEAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLead(partial = {}) {
  try {
    const prev = loadSavedLead() || {};
    const next = {
      ...prev,
      ...Object.fromEntries(
        Object.entries(partial).filter(
          ([, v]) => v != null && String(v).trim() !== ""
        )
      ),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LEAD_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

function readConnection() {
  const c =
    typeof navigator !== "undefined"
      ? navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection
      : null;
  if (!c) return null;
  return {
    type: c.effectiveType || c.type || null,
    downlink: c.downlink ?? null,
  };
}

function requestGeo(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lon: Number(pos.coords.longitude.toFixed(5)),
          accuracyM: Math.round(pos.coords.accuracy || 0),
        });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 300000 }
    );
  });
}

export async function collectVisitorInfo({ askGeo = true } = {}) {
  const lead = loadSavedLead() || {};
  const geo = askGeo ? await requestGeo() : null;

  return {
    path: window.location.pathname || "/",
    href: window.location.href || "",
    referrer: document.referrer || "",
    language: navigator.language || "",
    languages: Array.isArray(navigator.languages)
      ? navigator.languages.slice(0, 4).join(", ")
      : "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    platform: navigator.platform || "",
    userAgent: String(navigator.userAgent || "").slice(0, 240),
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
    connection: readConnection(),
    geo,
    name: lead.name || "",
    phone: lead.phone || "",
    email: lead.email || "",
    city: lead.city || "",
    state: lead.state || "",
    pincode: lead.pincode || "",
    address: lead.address || "",
  };
}
