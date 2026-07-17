const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function authHeaders(token, json = false) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "x-admin-token": token,
  };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

export async function requestAdminOtp(email) {
  const response = await fetch(`${API_BASE}/admin/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseJson(response);
}

export async function verifyAdminOtp(email, otp) {
  const response = await fetch(`${API_BASE}/admin/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return parseJson(response);
}

export async function logoutAdmin(token) {
  const response = await fetch(`${API_BASE}/admin/auth/logout`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return parseJson(response);
}

export async function fetchAdminOrders(token) {
  const response = await fetch(`${API_BASE}/orders`, {
    headers: authHeaders(token),
  });
  return parseJson(response);
}

export async function updateOrderStatus(token, orderId, payload) {
  const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: authHeaders(token, true),
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function fetchAdminEnquiries(token) {
  const response = await fetch(`${API_BASE}/enquiries`, {
    headers: authHeaders(token),
  });
  return parseJson(response);
}
