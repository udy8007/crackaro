import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminOrders, updateOrderStatus } from "../api/orders";
import { formatPrice } from "../context/CartContext";

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
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem("crackaro_admin_key") || ""
  );
  const [keyInput, setKeyInput] = useState(adminKey);
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState(Object.keys(STATUS_LABELS));
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadOrders = async (key = adminKey) => {
    if (!key) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminOrders(key);
      setOrders(data.orders || []);
      if (data.statuses?.length) setStatuses(data.statuses);
      localStorage.setItem("crackaro_admin_key", key);
      setAdminKey(key);
    } catch (err) {
      setError(err.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) loadOrders(adminKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const handleLogin = (event) => {
    event.preventDefault();
    loadOrders(keyInput.trim());
  };

  const handleStatusChange = async (order, status) => {
    setBusyId(order.id);
    setError("");
    try {
      const data = await updateOrderStatus(adminKey, order.id, { status });
      setOrders((prev) =>
        prev.map((row) => (row.id === order.id ? data.order : row))
      );
    } catch (err) {
      setError(err.message || "Could not update status");
    } finally {
      setBusyId("");
    }
  };

  if (!adminKey) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <Link to="/" className="admin-back">
            ← Back to shop
          </Link>
          <h1>Admin login</h1>
          <p>Enter the admin secret to verify payments and update order status.</p>
          <form onSubmit={handleLogin} className="admin-login-form">
            <label htmlFor="admin-key">Admin secret</label>
            <input
              id="admin-key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="ADMIN_SECRET"
              required
            />
            <button type="submit" className="btn btn-primary">
              Open dashboard
            </button>
          </form>
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
          <h1>Orders admin</h1>
          <p>Verify UTR payments and move orders through fulfillment.</p>
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
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              localStorage.removeItem("crackaro_admin_key");
              setAdminKey("");
              setKeyInput("");
              setOrders([]);
            }}
          >
            Logout
          </button>
        </div>
      </header>

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

        {filtered.map((order) => (
          <article key={order.id} className="admin-order">
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
              <strong>{formatPrice(order.total)}</strong>
            </div>

            <div className="admin-order__grid">
              <div>
                <h3>Customer</h3>
                <p>
                  {order.name}
                  <br />
                  {order.phone}
                  {order.email ? (
                    <>
                      <br />
                      {order.email}
                    </>
                  ) : null}
                </p>
              </div>
              <div>
                <h3>Address</h3>
                <p>
                  {order.address}
                  <br />
                  {[order.city, order.state, order.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div>
                <h3>Payment UTR</h3>
                <p className="admin-utr">{order.utr || "—"}</p>
                <p>Payment: {order.payment_status || "—"}</p>
              </div>
            </div>

            <div className="admin-order__items">
              <h3>Items</h3>
              <ul>
                {(order.items || []).map((item) => (
                  <li key={item.cartId || `${item.name}-${item.qty}`}>
                    {item.name} × {item.qty} —{" "}
                    {formatPrice((item.priceValue || 0) * (item.qty || 1))}
                  </li>
                ))}
              </ul>
            </div>

            <div className="admin-order__actions">
              <label>
                Update status
                <select
                  value={order.status}
                  disabled={busyId === order.id}
                  onChange={(e) => handleStatusChange(order, e.target.value)}
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
                  onClick={() => handleStatusChange(order, "shipped")}
                >
                  Mark shipped
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
