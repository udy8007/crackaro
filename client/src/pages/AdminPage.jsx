import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdminEnquiries,
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

const FLOW_PIPELINE = [
  {
    status: "payment_submitted",
    label: "Submitted",
    hint: "UTR received",
    icon: "fa-receipt",
  },
  {
    status: "verified",
    label: "Verified",
    hint: "Payment OK",
    icon: "fa-shield-halved",
  },
  {
    status: "packed",
    label: "Packed",
    hint: "Ready to go",
    icon: "fa-box",
  },
  {
    status: "shipped",
    label: "Shipped",
    hint: "In transit",
    icon: "fa-truck-fast",
  },
  {
    status: "delivered",
    label: "Delivered",
    hint: "Complete",
    icon: "fa-house-circle-check",
  },
];

function pipelineIndex(status) {
  return FLOW_PIPELINE.findIndex((step) => step.status === status);
}

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
  const [enquiries, setEnquiries] = useState([]);
  const [tab, setTab] = useState("orders");
  const [statuses, setStatuses] = useState(Object.keys(STATUS_LABELS));
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");

  const handleAuthFailure = (message) => {
    if (/session|unauthorized|login/i.test(message || "")) {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setStep("email");
    }
  };

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
      handleAuthFailure(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEnquiries = async (sessionToken = token) => {
    if (!sessionToken) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminEnquiries(sessionToken);
      setEnquiries(data.enquiries || []);
    } catch (err) {
      setError(err.message || "Failed to load enquiries");
      handleAuthFailure(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (tab === "orders") loadOrders(token);
    else loadEnquiries(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "payment_submitted").length;
    const verified = orders.filter((o) => o.status === "verified").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const revenue = orders
      .filter((o) => !["rejected", "cancelled"].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { pending, verified, shipped, revenue };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (!q) return true;
      const hay = [
        order.order_number,
        order.name,
        order.phone,
        order.utr,
        order.pincode,
        order.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, filter, query]);

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
    setEnquiries([]);
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
      <div className="admin-page admin-page--login">
        <div className="admin-page__atmosphere" aria-hidden="true" />
        <div className="admin-login">
          <Link to="/" className="admin-back">
            <i className="fa-solid fa-arrow-left"></i> Back to shop
          </Link>
          <div className="admin-login__panel">
            <div className="admin-login__brand">
              <span className="admin-login__mark" aria-hidden="true">
                <i className="fa-solid fa-burst"></i>
              </span>
              <div>
                <p className="eyebrow">Crackaro</p>
                <h1>Admin sign in</h1>
              </div>
            </div>
            <p className="admin-login__lead">
              Secure email OTP access for order verification and enquiries.
            </p>

            {step === "email" ? (
              <form onSubmit={handleRequestOtp} className="admin-login-form">
                <label htmlFor="admin-email">Admin email</label>
                <div className="admin-input-wrap">
                  <i className="fa-solid fa-envelope" aria-hidden="true"></i>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg admin-login__submit"
                  disabled={authLoading || !email.includes("@")}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  {authLoading ? "Sending OTP…" : "Send OTP to email"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="admin-login-form">
                <p className="admin-otp-hint">
                  OTP sent to <strong>{sentTo || email}</strong>
                </p>
                {previewUrl ? (
                  <a
                    className="admin-preview-link"
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fa-solid fa-up-right-from-square"></i>
                    Open OTP email preview
                  </a>
                ) : (
                  <p className="admin-otp-hint">
                    Open your inbox, copy the 6-digit OTP, then verify below.
                  </p>
                )}
                <label htmlFor="admin-otp">Enter 6-digit OTP</label>
                <div className="admin-input-wrap">
                  <i className="fa-solid fa-key" aria-hidden="true"></i>
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
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg admin-login__submit"
                  disabled={authLoading || otp.length !== 6}
                >
                  <i className="fa-solid fa-right-to-bracket"></i>
                  {authLoading ? "Verifying…" : "Verify & login"}
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

            {error ? (
              <p className="admin-alert admin-alert--error" role="alert">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const displayEmail = email || DEFAULT_ADMIN_EMAIL;

  return (
    <div className="admin-page admin-page--dashboard">
      <div className="admin-page__atmosphere" aria-hidden="true" />
      <div className="admin-shell">
        <header className="admin-topbar">
          <div className="admin-topbar__brand">
            <span className="admin-topbar__mark" aria-hidden="true">
              <i className="fa-solid fa-burst"></i>
            </span>
            <div>
              <Link to="/" className="admin-back">
                <i className="fa-solid fa-store"></i> Shop
              </Link>
              <p className="eyebrow">Crackaro</p>
              <h1>Operations desk</h1>
              <p>
                Signed in as <strong>{displayEmail}</strong>
              </p>
            </div>
          </div>
          <div className="admin-topbar__actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                tab === "orders" ? loadOrders() : loadEnquiries()
              }
              disabled={loading}
            >
              <i className="fa-solid fa-rotate-right"></i>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleLogout}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              Logout
            </button>
          </div>
        </header>

        <nav className="admin-tabs" aria-label="Admin sections">
          <button
            type="button"
            className={`admin-tab${tab === "orders" ? " is-active" : ""}`}
            onClick={() => setTab("orders")}
          >
            <i className="fa-solid fa-bag-shopping"></i>
            Orders
            <span>{orders.length}</span>
          </button>
          <button
            type="button"
            className={`admin-tab${tab === "enquiries" ? " is-active" : ""}`}
            onClick={() => setTab("enquiries")}
          >
            <i className="fa-solid fa-inbox"></i>
            Enquiries
            <span>{enquiries.length}</span>
          </button>
        </nav>

        {error ? (
          <p className="admin-alert admin-alert--error" role="alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </p>
        ) : null}

        {tab === "enquiries" ? (
          <section className="admin-section">
            <div className="admin-section__head">
              <div>
                <h2>Customer enquiries</h2>
                <p>Wholesale and contact form messages</p>
              </div>
            </div>
            {loading ? (
              <div className="admin-loading">
                <span className="admin-loading__spinner" />
                Loading enquiries…
              </div>
            ) : null}
            {!loading && enquiries.length === 0 ? (
              <div className="admin-empty-state">
                <i className="fa-regular fa-folder-open"></i>
                <h3>No enquiries yet</h3>
                <p>New contact form messages will appear here.</p>
              </div>
            ) : null}
            <div className="admin-enquiries">
              {enquiries.map((row) => (
                <article key={row.id} className="admin-enquiry">
                  <div className="admin-enquiry__head">
                    <div>
                      <h3>{row.name}</h3>
                      <p>
                        {new Date(row.created_at).toLocaleString("en-IN")}
                        {row.interest ? ` · ${row.interest}` : ""}
                      </p>
                    </div>
                    <div className="admin-enquiry__contact">
                      <a href={`tel:${row.phone}`}>
                        <i className="fa-solid fa-phone"></i> {row.phone}
                      </a>
                      {row.email ? (
                        <a href={`mailto:${row.email}`}>
                          <i className="fa-solid fa-envelope"></i> {row.email}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <p className="admin-enquiry__message">{row.message}</p>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="admin-section">
            <div className="admin-stats">
              <article className="admin-stat">
                <span>Total orders</span>
                <strong>{orders.length}</strong>
              </article>
              <article className="admin-stat admin-stat--warn">
                <span>Awaiting verify</span>
                <strong>{stats.pending}</strong>
              </article>
              <article className="admin-stat admin-stat--ok">
                <span>Verified</span>
                <strong>{stats.verified}</strong>
              </article>
              <article className="admin-stat">
                <span>Shipped</span>
                <strong>{stats.shipped}</strong>
              </article>
              <article className="admin-stat admin-stat--accent">
                <span>Active value</span>
                <strong>{formatPrice(stats.revenue)}</strong>
              </article>
            </div>

            <div className="admin-toolbar">
              <div className="admin-search">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search order, name, phone, UTR…"
                  aria-label="Search orders"
                />
              </div>
              <div className="admin-filters" role="tablist" aria-label="Order status">
                <button
                  type="button"
                  className={`admin-chip${filter === "all" ? " is-active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All <em>{orders.length}</em>
                </button>
                {statuses.map((status) => {
                  const count = orders.filter((o) => o.status === status).length;
                  return (
                    <button
                      key={status}
                      type="button"
                      className={`admin-chip${
                        filter === status ? " is-active" : ""
                      }`}
                      onClick={() => setFilter(status)}
                    >
                      {STATUS_LABELS[status] || status} <em>{count}</em>
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <span className="admin-loading__spinner" />
                Loading orders…
              </div>
            ) : null}

            {!loading && filtered.length === 0 ? (
              <div className="admin-empty-state">
                <i className="fa-solid fa-box-open"></i>
                <h3>No orders in this view</h3>
                <p>Try another status filter or clear the search.</p>
              </div>
            ) : null}

            <div className="admin-orders">
              {filtered.map((order) => {
                const open = expandedId === order.id;
                const busy = busyId === order.id;
                return (
                  <article
                    key={order.id}
                    className={`admin-order${open ? " is-open" : ""}`}
                  >
                    <button
                      type="button"
                      className="admin-order__toggle"
                      onClick={() => setExpandedId(open ? "" : order.id)}
                      aria-expanded={open}
                    >
                      <div className="admin-order__head">
                        <div className="admin-order__title">
                          <h2>{order.order_number || order.id.slice(0, 8)}</h2>
                          <div className="admin-order__meta">
                            <span>
                              {new Date(order.created_at).toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`status-pill status-pill--${order.status}`}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                            {order.utr ? (
                              <span className="admin-order__utr-chip">
                                UTR {order.utr}
                              </span>
                            ) : null}
                          </div>
                          <p className="admin-order__customer-line">
                            {order.name} · {order.phone}
                            {order.city ? ` · ${order.city}` : ""}
                          </p>
                        </div>
                        <div className="admin-order__head-right">
                          <strong>{formatPrice(order.total)}</strong>
                          <i
                            className={`fa-solid fa-chevron-${
                              open ? "up" : "down"
                            }`}
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
                              <a href={`tel:${order.phone}`}>{order.phone}</a>
                              {order.email ? (
                                <>
                                  <br />
                                  <a href={`mailto:${order.email}`}>
                                    {order.email}
                                  </a>
                                </>
                              ) : null}
                            </p>
                          </div>
                          <div>
                            <h3>Delivery</h3>
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
                            <p>Payment: {order.payment_status || "—"}</p>
                            {order.subtotal != null ? (
                              <p>
                                Subtotal {formatPrice(order.subtotal)} · Ship{" "}
                                {formatPrice(order.shipping_fee || 0)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="admin-order__items">
                          <h3>Items ({(order.items || []).length})</h3>
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

                        <div className="admin-status-board">
                          <div className="admin-status-board__head">
                            <div>
                              <h3>Fulfillment pipeline</h3>
                              <p>
                                Tap a step to move this order — current stage is
                                highlighted.
                              </p>
                            </div>
                            <span
                              className={`status-pill status-pill--${order.status}`}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>

                          {order.status === "rejected" ||
                          order.status === "cancelled" ? (
                            <div className="admin-status-terminal">
                              <i className="fa-solid fa-triangle-exclamation"></i>
                              <div>
                                <strong>
                                  {STATUS_LABELS[order.status] || order.status}
                                </strong>
                                <p>
                                  This order left the happy path. You can reopen
                                  it by choosing a pipeline step below if needed.
                                </p>
                              </div>
                            </div>
                          ) : null}

                          <ol className="admin-pipeline" aria-label="Order status pipeline">
                            {FLOW_PIPELINE.map((step, index) => {
                              const currentIdx = pipelineIndex(order.status);
                              const isCurrent = order.status === step.status;
                              const isDone =
                                currentIdx >= 0 && index < currentIdx;
                              const isNext =
                                currentIdx >= 0 && index === currentIdx + 1;
                              return (
                                <li key={step.status}>
                                  <button
                                    type="button"
                                    className={`admin-pipeline__step${
                                      isDone ? " is-done" : ""
                                    }${isCurrent ? " is-current" : ""}${
                                      isNext ? " is-next" : ""
                                    }`}
                                    disabled={busy || isCurrent}
                                    onClick={() =>
                                      handleStatusChange(order, step.status)
                                    }
                                    title={`Set status to ${step.label}`}
                                  >
                                    <span
                                      className="admin-pipeline__marker"
                                      aria-hidden="true"
                                    >
                                      <i className={`fa-solid ${step.icon}`}></i>
                                    </span>
                                    <span className="admin-pipeline__copy">
                                      <strong>{step.label}</strong>
                                      <small>{step.hint}</small>
                                    </span>
                                    {isCurrent ? (
                                      <span className="admin-pipeline__now">
                                        Now
                                      </span>
                                    ) : null}
                                    {isNext ? (
                                      <span className="admin-pipeline__now admin-pipeline__now--next">
                                        Next
                                      </span>
                                    ) : null}
                                  </button>
                                  {index < FLOW_PIPELINE.length - 1 ? (
                                    <span
                                      className={`admin-pipeline__connector${
                                        isDone || isCurrent ? " is-lit" : ""
                                      }`}
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                </li>
                              );
                            })}
                          </ol>

                          <div className="admin-status-board__footer">
                            <div className="admin-status-board__exceptions">
                              <span>Exceptions</span>
                              <button
                                type="button"
                                className="admin-exception-btn admin-exception-btn--reject"
                                disabled={busy || order.status === "rejected"}
                                onClick={() =>
                                  handleStatusChange(order, "rejected")
                                }
                              >
                                <i className="fa-solid fa-xmark"></i>
                                Reject payment
                              </button>
                              <button
                                type="button"
                                className="admin-exception-btn"
                                disabled={busy || order.status === "cancelled"}
                                onClick={() =>
                                  handleStatusChange(order, "cancelled")
                                }
                              >
                                <i className="fa-solid fa-ban"></i>
                                Cancel order
                              </button>
                            </div>
                            <label className="admin-status-jump">
                              Jump to
                              <select
                                value={order.status}
                                disabled={busy}
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
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
