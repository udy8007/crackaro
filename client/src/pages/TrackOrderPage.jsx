import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FestivalBanner from "../components/layout/FestivalBanner";
import Topbar from "../components/layout/Topbar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { trackOrder } from "../api/orders";
import { formatPrice } from "../context/CartContext";
import { saveLead } from "../utils/visitor";
import { notifyLeadCaptured } from "../utils/ntfy";

const FLOW = [
  {
    id: "payment_submitted",
    label: "Payment submitted",
    hint: "UTR received — awaiting verification",
    icon: "fa-receipt",
  },
  {
    id: "verified",
    label: "Payment verified",
    hint: "Payment confirmed by our team",
    icon: "fa-shield-halved",
  },
  {
    id: "packed",
    label: "Packed",
    hint: "Order packed and ready to dispatch",
    icon: "fa-box",
  },
  {
    id: "shipped",
    label: "Shipped",
    hint: "On the way to your delivery address",
    icon: "fa-truck-fast",
  },
  {
    id: "delivered",
    label: "Delivered",
    hint: "Order delivered successfully",
    icon: "fa-house-circle-check",
  },
];

const LABELS = {
  payment_submitted: "Payment submitted",
  verified: "Payment verified",
  rejected: "Payment rejected",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(
    () => searchParams.get("order") || ""
  );
  const [phone, setPhone] = useState(() =>
    (searchParams.get("phone") || "").replace(/\D/g, "").slice(0, 10)
  );
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const lookup = async (number, mobile) => {
    setError("");
    setOrder(null);
    setSearched(true);
    setLoading(true);
    try {
      const data = await trackOrder(number.trim(), mobile.trim());
      setOrder(data.order);
    } catch (err) {
      setError(err.message || "Could not find order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const o = searchParams.get("order");
    const p = (searchParams.get("phone") || "").replace(/\D/g, "").slice(0, 10);
    if (o) setOrderNumber(o);
    if (p) setPhone(p);
    if (o && p.length === 10) {
      lookup(o, p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const steps = useMemo(() => {
    if (!order) return [];
    if (order.status === "rejected" || order.status === "cancelled") {
      return [
        {
          ...FLOW[0],
          done: true,
          current: false,
        },
        {
          id: order.status,
          label: LABELS[order.status],
          hint:
            order.status === "rejected"
              ? "Payment could not be verified — contact support"
              : "This order was cancelled",
          icon:
            order.status === "rejected"
              ? "fa-circle-xmark"
              : "fa-ban",
          done: true,
          current: true,
          terminal: true,
        },
      ];
    }
    const idx = FLOW.findIndex((s) => s.id === order.status);
    return FLOW.map((step, i) => ({
      ...step,
      done: idx >= 0 && i <= idx,
      current: step.id === order.status,
    }));
  }, [order]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await lookup(orderNumber, phone);
  };

  const statusClass = order
    ? `track-status-pill track-status-pill--${order.status}`
    : "";

  return (
    <>
      <FestivalBanner />
      <Topbar />
      <Header />
      <main className="track-page">
        <div className="track-page__atmosphere" aria-hidden="true" />
        <div className="container track-page__inner">
          <nav className="cart-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Track order</span>
          </nav>

          <header className="track-hero">
            <p className="eyebrow">Order status</p>
            <h1>Track your order</h1>
            <p className="track-hero__lead">
              Enter your order number and the mobile used at checkout to see
              live fulfillment progress.
            </p>
          </header>

          <div className="track-layout">
            <form className="track-panel" onSubmit={handleSubmit}>
              <div className="track-panel__head">
                <span className="track-panel__icon" aria-hidden="true">
                  <i className="fa-solid fa-magnifying-glass-location"></i>
                </span>
                <div>
                  <h2>Find your shipment</h2>
                  <p>Details must match what you entered at checkout.</p>
                </div>
              </div>

              <div className="track-form-grid">
                <div className="form-group">
                  <label htmlFor="track-order">Order number</label>
                  <div className="track-input-wrap">
                    <i className="fa-solid fa-hashtag" aria-hidden="true"></i>
                    <input
                      id="track-order"
                      value={orderNumber}
                      onChange={(e) =>
                        setOrderNumber(e.target.value.toUpperCase())
                      }
                      placeholder="SCR-YYYYMMDDHHMM-####"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="track-phone">Mobile number</label>
                  <div className="track-input-wrap">
                    <i className="fa-solid fa-mobile-screen" aria-hidden="true"></i>
                    <input
                      id="track-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(next);
                        if (next.length === 10) {
                          saveLead({ phone: next });
                          notifyLeadCaptured({ phone: next });
                        }
                      }}
                      placeholder="10-digit mobile"
                      required
                      minLength={10}
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {error ? (
                <p className="track-alert track-alert--error" role="alert">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="btn btn-primary btn-lg track-submit"
                disabled={loading || phone.length !== 10 || !orderNumber.trim()}
              >
                <i className="fa-solid fa-location-arrow"></i>
                {loading ? "Looking up…" : "Track order"}
              </button>

              <p className="track-panel__hint">
                Order number is on your checkout confirmation. Need help?{" "}
                <a href="/#contact">Contact us</a>
              </p>
            </form>

            <aside className="track-aside">
              <h3>How tracking works</h3>
              <ul className="track-aside__list">
                <li>
                  <span className="track-aside__num">1</span>
                  <span>Submit UPI payment and place your order</span>
                </li>
                <li>
                  <span className="track-aside__num">2</span>
                  <span>We verify your UTR and pack the crackers</span>
                </li>
                <li>
                  <span className="track-aside__num">3</span>
                  <span>Track shipping until it reaches your door</span>
                </li>
              </ul>
              <div className="track-aside__note">
                <i className="fa-solid fa-lock"></i>
                <p>
                  We ask for your mobile so only you can view order details —
                  never share your UTR publicly.
                </p>
              </div>
            </aside>
          </div>

          {loading && !order ? (
            <div className="track-loading" aria-live="polite">
              <span className="track-loading__spinner" />
              Fetching latest status…
            </div>
          ) : null}

          {order ? (
            <section className="track-result" aria-live="polite">
              <div className="track-result__banner">
                <div>
                  <p className="track-result__label">Order</p>
                  <h2>{order.order_number}</h2>
                  <p className="track-result__placed">
                    Placed{" "}
                    {new Date(order.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {order.city || order.pincode
                      ? ` · ${[order.city, order.pincode].filter(Boolean).join(" ")}`
                      : ""}
                  </p>
                </div>
                <span className={statusClass}>
                  {LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="track-result__stats">
                <div>
                  <span>Amount paid</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
                {order.subtotal != null ? (
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(order.subtotal)}</strong>
                  </div>
                ) : null}
                {order.shipping_fee != null ? (
                  <div>
                    <span>Shipping</span>
                    <strong>{formatPrice(order.shipping_fee)}</strong>
                  </div>
                ) : null}
                <div>
                  <span>Customer</span>
                  <strong>{order.name || "—"}</strong>
                </div>
              </div>

              <div className="track-progress">
                <h3>Fulfillment progress</h3>
                <ol className="track-timeline">
                  {steps.map((step, index) => (
                    <li
                      key={step.id}
                      className={`track-timeline__step${
                        step.done ? " is-done" : ""
                      }${step.current ? " is-current" : ""}${
                        step.terminal ? " is-terminal" : ""
                      }`}
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <span className="track-timeline__rail" aria-hidden="true" />
                      <span className="track-timeline__marker" aria-hidden="true">
                        <i className={`fa-solid ${step.icon}`}></i>
                      </span>
                      <div className="track-timeline__copy">
                        <strong>{step.label}</strong>
                        <span>{step.hint}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {order.items?.length ? (
                <div className="track-items">
                  <h3>Items in this order</h3>
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.cartId || `${item.id}-${item.name}`}>
                        <span className="track-items__name">{item.name}</span>
                        <span className="track-items__qty">× {item.qty}</span>
                        <span className="track-items__price">
                          {formatPrice(
                            (item.priceValue || 0) * (item.qty || 1)
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="track-result__actions">
                <Link to="/#products" className="btn btn-primary">
                  Continue shopping
                </Link>
                <a href="/#contact" className="btn btn-outline">
                  Need help?
                </a>
              </div>
            </section>
          ) : null}

          {searched && !loading && !order && !error ? (
            <p className="track-empty">No order to show yet.</p>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
