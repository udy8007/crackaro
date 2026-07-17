import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdminOrders,
  logoutAdmin,
  requestAdminOtp,
  updateOrderStatus,
  verifyAdminOtp,
} from "../api/admin";
import { formatPrice } from "../context/CartContext";

const TOKEN_KEY = "crackaro_admin_token";
const DEFAULT_ADMIN_EMAIL = "mr.mit97@gmail.com";

const STATUS_LABELS = {
  payment_submitted: "Payment submitted",
  verified: "Payment verified",
  rejected: "Payment rejected",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminPage() {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || ""
  );
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [otp, setOtp] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState(Object.keys(STATUS_LABELS));
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadOrders = async (sessionToken = token) => {
    if (!sessionToken) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminOrders(sessionToken);
      setOrders(data.orders || []);
      if (data.statuses?.length) setStatuses(data.statuses);
    } catch (err) {
      setError(err.message || "Failed to load orders");
      if (/session|unauthorized|login/i.test(err.message || "")) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setStep("email");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadOrders(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "payment_submitted").length;
    const verified = orders.filter((o) => o.status === "verified").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const revenue = orders
      .filter((o) => !["rejected", "cancelled"].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { pending, verified, shipped, revenue };
  }, [orders]);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setError("");
    setSentTo("");
    setPreviewUrl("");
    try {
      const data = await requestAdminOtp(email.trim());
      setSentTo(data.sentTo || data.email || email.trim());
      setPreviewUrl(data.previewUrl || "");
      setStep("otp");
      setOtp("");
    } catch (err) {
      setError(err.message || "Could not send OTP");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setError("");
    try {
      const data = await verifyAdminOtp(email.trim(), otp.trim());
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setStep("email");
      setOtp("");
      setSentTo("");
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) await logoutAdmin(token);
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setOrders([]);
    setStep("email");
  };

  const handleStatusChange = async (order, status) => {
    setBusyId(order.id);
    setError("");
    try {
      const data = await updateOrderStatus(token, order.id, { status });
      setOrders((prev) =>
        prev.map((row) => (row.id === order.id ? data.order : row))
      );
    } catch (err) {
      setError(err.message || "Could not update status");
    } finally {
      setBusyId("");
    }
  };

  if (!token) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-card--otp">
          <Link to="/" className="admin-back">
            ← Back to shop
          </Link>
          <div className="admin-card__badge">Admin panel</div>
          <h1>Email OTP login</h1>
          <p>
            Sign in with the registered admin email. A one-time password will be
            sent by mail (Nodemailer). Only email login is accepted.
          </p>

          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="admin-login-form">
              <label htmlFor="admin-email">Admin email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={authLoading || !email.includes("@")}
              >
                {authLoading ? "Sending OTP..." : "Send OTP to email"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="admin-login-form">
              <p className="admin-otp-hint">
                OTP sent to <strong>{sentTo || email}</strong>
              </p>
              {previewUrl ? (
                <a
                  className="admin-demo-otp admin-preview-link"
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open OTP email preview
                </a>
              ) : (
                <p className="admin-otp-hint">
                  Open your Gmail inbox, copy the 6-digit OTP, then verify below.
                </p>
              )}
              <label htmlFor="admin-otp">Enter 6-digit OTP</label>
              <input
                id="admin-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                required
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={authLoading || otp.length !== 6}
              >
                {authLoading ? "Verifying..." : "Verify & login"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setSentTo("");
                  setError("");
                }}
              >
                Change email
              </button>
            </form>
          )}

          {error ? <p className="form-note error">{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-page--dashboard">
      <header className="admin-top">
        <div>
          <Link to="/" className="admin-back">
            ← Shop
          </Link>
          <h1>Orders dashboard</h1>
          <p>
            Logged in as <strong>{email || DEFAULT_ADMIN_EMAIL}</strong> ·
            Verify UTR and update fulfillment status
          </p>
        </div>
        <div className="admin-top-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => loadOrders()}
            disabled={loading}
          >
            Refresh
          </button>
          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-stats">
        <div className="admin-stat">
          <span>Total orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="admin-stat">
          <span>Awaiting verify</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="admin-stat">
          <span>Verified</span>
          <strong>{stats.verified}</strong>
        </div>
        <div className="admin-stat">
          <span>Shipped</span>
          <strong>{stats.shipped}</strong>
        </div>
        <div className="admin-stat">
          <span>Active value</span>
          <strong>{formatPrice(stats.revenue)}</strong>
        </div>
      </div>

      <div className="admin-filters">
        <button
          type="button"
          className={`filter-btn${filter === "all" ? " active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({orders.length})
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            className={`filter-btn${filter === status ? " active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {STATUS_LABELS[status] || status} (
            {orders.filter((o) => o.status === status).length})
          </button>
        ))}
      </div>

      {error ? <p className="form-note error">{error}</p> : null}
      {loading ? <p>Loading orders…</p> : null}

      <div className="admin-orders">
        {filtered.length === 0 && !loading ? (
          <p className="admin-empty">No orders in this filter.</p>
        ) : null}

        {filtered.map((order) => {
          const open = expandedId === order.id;
          return (
            <article key={order.id} className="admin-order">
              <button
                type="button"
                className="admin-order__toggle"
                onClick={() => setExpandedId(open ? "" : order.id)}
              >
                <div className="admin-order__head">
                  <div>
                    <h2>{order.order_number || order.id.slice(0, 8)}</h2>
                    <p>
                      {new Date(order.created_at).toLocaleString("en-IN")} ·{" "}
                      <span className={`status-pill status-pill--${order.status}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </p>
                  </div>
                  <div className="admin-order__head-right">
                    <strong>{formatPrice(order.total)}</strong>
                    <i
                      className={`fa-solid fa-chevron-${open ? "up" : "down"}`}
                    ></i>
                  </div>
                </div>
              </button>

              {open ? (
                <div className="admin-order__body">
                  <div className="admin-order__grid">
                    <div>
                      <h3>Customer</h3>
                      <p>
                        <strong>{order.name}</strong>
                        <br />
                        Mobile: {order.phone}
                        {order.email ? (
                          <>
                            <br />
                            Email: {order.email}
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div>
                      <h3>Delivery address</h3>
                      <p>
                        {order.address}
                        <br />
                        {[order.city, order.state, order.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <h3>Payment</h3>
                      <p className="admin-utr">UTR: {order.utr || "—"}</p>
                      <p>Payment status: {order.payment_status || "—"}</p>
                      <p>Order status: {STATUS_LABELS[order.status] || order.status}</p>
                    </div>
                  </div>

                  <div className="admin-order__items">
                    <h3>Order items ({(order.items || []).length})</h3>
                    <div className="admin-items-table">
                      <div className="admin-items-table__head">
                        <span>Product</span>
                        <span>Qty</span>
                        <span>Rate</span>
                        <span>Amount</span>
                      </div>
                      {(order.items || []).map((item) => (
                        <div
                          key={item.cartId || `${item.name}-${item.qty}`}
                          className="admin-items-table__row"
                        >
                          <span>{item.name}</span>
                          <span>{item.qty}</span>
                          <span>{formatPrice(item.priceValue || 0)}</span>
                          <span>
                            {formatPrice(
                              (item.priceValue || 0) * (item.qty || 1)
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-order__actions">
                    <label>
                      Update status
                      <select
                        value={order.status}
                        disabled={busyId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status] || status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="admin-quick">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={busyId === order.id}
                        onClick={() => handleStatusChange(order, "verified")}
                      >
                        Verify payment
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        disabled={busyId === order.id}
                        onClick={() => handleStatusChange(order, "rejected")}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        disabled={busyId === order.id}
                        onClick={() => handleStatusChange(order, "packed")}
                      >
                        Packed
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        disabled={busyId === order.id}
                        onClick={() => handleStatusChange(order, "shipped")}
                      >
                        Shipped
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        disabled={busyId === order.id}
                        onClick={() => handleStatusChange(order, "delivered")}
                      >
                        Delivered
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
