const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function submitEnquiry(payload) {
  const response = await fetch(`${API_BASE}/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit enquiry");
  }

  return data;
}
