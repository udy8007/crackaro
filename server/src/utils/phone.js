/** Normalize Indian mobile to 10 digits. */
export function normalizePhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

export function isAllowedAdminPhone(phone) {
  const allowed = String(process.env.ADMIN_PHONES || "")
    .split(",")
    .map((p) => normalizePhone(p))
    .filter(Boolean);

  if (!allowed.length) return false;
  return allowed.includes(phone);
}
