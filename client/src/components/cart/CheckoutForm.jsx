import { useEffect, useMemo, useState } from "react";
import { getPaymentConfig, placeOrder } from "../../api/orders";
import { formatPrice, useCart } from "../../context/CartContext";

const INITIAL = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  utr: "",
};

export default function CheckoutForm({ onBack, onSuccess, compact = false }) {
  const { items, total, clearCart } = useCart();
  const [form, setForm] = useState(INITIAL);
  const [config, setConfig] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPaymentConfig()
      .then(setConfig)
      .catch(() =>
        setConfig({
          upiId: "sparklecrackers@upi",
          payeeName: "Sparkle Crackers",
          note: "Pay via UPI and enter UTR below.",
        })
      );
  }, []);

  const upiLink = useMemo(() => {
    if (!config) return "";
    const params = new URLSearchParams({
      pa: config.upiId,
      pn: config.payeeName,
      am: String(total),
      cu: "INR",
      tn: "Sparkle Crackers Order",
    });
    return `upi://pay?${params.toString()}`;
  }, [config, total]);

  const qrUrl = useMemo(() => {
    if (!upiLink) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;
  }, [upiLink]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await placeOrder({
        ...form,
        items,
        total,
      });
      clearCart();
      onSuccess?.(result.order);
    } catch (err) {
      setError(err.message || "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className={`checkout-form${compact ? " checkout-form--compact" : ""}`}
      onSubmit={handleSubmit}
    >
      {onBack ? (
        <button type="button" className="checkout-back" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Back to cart
        </button>
      ) : null}

      <div className="checkout-section">
        <h3>1. Delivery details</h3>
        <div className="form-group">
          <label htmlFor="co-name">Full name</label>
          <input
            id="co-name"
            name="name"
            required
            value={form.name}
            onChange={updateField}
            placeholder="Your full name"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="co-phone">Mobile number</label>
            <input
              id="co-phone"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={updateField}
              placeholder="10-digit mobile"
            />
          </div>
          <div className="form-group">
            <label htmlFor="co-email">Email (optional)</label>
            <input
              id="co-email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="co-address">Full address</label>
          <textarea
            id="co-address"
            name="address"
            rows="3"
            required
            value={form.address}
            onChange={updateField}
            placeholder="House no, street, landmark"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="co-city">City</label>
            <input
              id="co-city"
              name="city"
              value={form.city}
              onChange={updateField}
              placeholder="City"
            />
          </div>
          <div className="form-group">
            <label htmlFor="co-state">State</label>
            <input
              id="co-state"
              name="state"
              value={form.state}
              onChange={updateField}
              placeholder="State"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="co-pincode">Pincode</label>
          <input
            id="co-pincode"
            name="pincode"
            required
            pattern="\d{6}"
            maxLength={6}
            value={form.pincode}
            onChange={updateField}
            placeholder="6-digit pincode"
          />
        </div>
      </div>

      <div className="checkout-section checkout-payment">
        <h3>2. Pay via UPI</h3>
        <p className="checkout-note">
          {config?.note || "Scan QR, pay the exact amount, then enter UTR."}
        </p>
        <div className="checkout-qr-wrap">
          {qrUrl ? (
            <img src={qrUrl} alt="UPI payment QR code" className="checkout-qr" />
          ) : (
            <div className="checkout-qr checkout-qr--loading">Loading QR…</div>
          )}
          <div className="checkout-upi-meta">
            <p>
              <strong>UPI ID:</strong> {config?.upiId || "—"}
            </p>
            <p>
              <strong>Payee:</strong> {config?.payeeName || "Sparkle Crackers"}
            </p>
            <p>
              <strong>Amount:</strong> {formatPrice(total)}
            </p>
            {upiLink ? (
              <a className="btn btn-outline btn-sm" href={upiLink}>
                Open UPI app
              </a>
            ) : null}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="co-utr">UTR / UPI reference number</label>
          <input
            id="co-utr"
            name="utr"
            required
            minLength={6}
            value={form.utr}
            onChange={updateField}
            placeholder="Enter UTR after payment"
          />
        </div>
      </div>

      {error ? <p className="form-note error">{error}</p> : null}

      <button
        type="submit"
        className="btn btn-primary btn-block btn-lg"
        disabled={submitting || items.length === 0}
      >
        <i className="fa-solid fa-lock"></i>{" "}
        {submitting ? "Placing order..." : `Place order · ${formatPrice(total)}`}
      </button>
    </form>
  );
}
