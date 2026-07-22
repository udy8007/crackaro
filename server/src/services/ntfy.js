const DEFAULT_TOPIC = "crackro";

function topicUrl() {
  const topic = String(process.env.NTFY_TOPIC || DEFAULT_TOPIC)
    .trim()
    .replace(/^\/+|\/+$/g, "");
  const base = String(process.env.NTFY_SERVER || "https://ntfy.sh")
    .trim()
    .replace(/\/+$/, "");
  return `${base}/${topic || DEFAULT_TOPIC}`;
}

/**
 * Publish to ntfy (default: https://ntfy.sh/crackro).
 * Uses JSON body so Node/browser proxies don't depend on custom header CORS.
 * Never throws.
 */
export async function notifyNtfy({
  title = "Crackaro",
  message = "",
  tags = "bell",
  priority = 3,
} = {}) {
  const topic = String(process.env.NTFY_TOPIC || DEFAULT_TOPIC)
    .trim()
    .replace(/^\/+|\/+$/g, "") || DEFAULT_TOPIC;
  const base = String(process.env.NTFY_SERVER || "https://ntfy.sh")
    .trim()
    .replace(/\/+$/, "");

  const payload = {
    topic,
    title: String(title).slice(0, 120),
    message: String(message || title).slice(0, 2000),
    priority: Number(priority) || 3,
    tags: Array.isArray(tags)
      ? tags
      : String(tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
  };

  try {
    const response = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn("[ntfy]", response.status, text || topicUrl());
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[ntfy]", err?.message || err);
    return false;
  }
}
