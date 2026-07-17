export function adminAuth(req, res, next) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    return res.status(503).json({
      message: "ADMIN_SECRET is not configured on the server.",
    });
  }

  const key = req.header("x-admin-key") || req.query.key;
  if (!key || key !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
}
