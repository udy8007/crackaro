import { useEffect, useMemo, useState } from "react";
import { getPaymentConfig, placeOrder } from "../../api/orders";
import { quoteShipping } from "../../api/shipping";
import { fetchPublicSettings } from "../../api/settings";
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
  const { items, total: subtotal, clearCart, syncPricesFromCatalog } = useCart();
  const [form, setForm] = useState(INITIAL);
  const [config, setConfig] = useState(null);
  const [minOrderAmount, setMinOrderAmount] = useState(3000);
  const [shipping, setShipping] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPaymentConfig()
      .then(setConfig)
      .catch(() =>
        setConfig({
          upiId: "crackaro@upi",
          payeeName: "Crackaro",
          note: "Pay via UPI and enter UTR below.",
          utrHint: "8–22 alphanumeric characters.",
          utrPattern: "^[A-Za-z0-9]{8,22}$",
        })
      );
    fetchPublicSettings().then((data) => {
      if (data?.minOrderAmount != null) {
        setMinOrderAmount(Number(data.minOrderAmount) || 3000);
      }
    });
  }, []);

  useEffect(() => {
    const pin = form.pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setShipping(null);
      return undefined;
    }

    let alive = true;
    setShippingLoading(true);
    quoteShipping({
      pincode: pin,
      subtotal,
      state: form.state,
    })
      .then((quote) => {
        if (alive) setShipping(quote);
      })
      .catch((err) => {
        if (alive) {
          setShipping({
            serviceable: false,
            fee: 0,
            message: err.message || "Could not calculate shipping.",
          });
        }
      })
      .finally(() => {
        if (alive) setShippingLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [form.pincode, form.state, subtotal]);

  const shippingFee = shipping?.serviceable ? Number(shipping.fee) || 0 : 0;
  const grandTotal = subtotal + shippingFee;
  const meetsMinOrder = subtotal >= minOrderAmount;
  const minOrderShortfall = Math.max(0, minOrderAmount - subtotal);
  const canPay =
    Boolean(shipping?.serviceable) && items.length > 0 && meetsMinOrder;

  const upiLink = useMemo(() => {
    if (!config || !canPay) return "";
    const params = new URLSearchParams({
      pa: config.upiId,
      pn: config.payeeName,
      am: String(grandTotal),
      cu: "INR",
      tn: "Crackaro Order",
    });
    return `upi://pay?${params.toString()}`;
  }, [config, canPay, grandTotal]);

  const qrUrl = useMemo(() => {
    if (!upiLink) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;
  }, [upiLink]);

  const updateField = (event) => {
    const { name, value } = event.target;
    if (name === "utr") {
      setForm((prev) => ({
        ...prev,
        utr: value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 22),
      }));
      return;
    }
    if (name === "pincode") {
      setForm((prev) => ({
        ...prev,
        pincode: value.replace(/\D/g, "").slice(0, 6),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!shipping?.serviceable) {
      setError(shipping?.message || "Enter a serviceable pincode first.");
      return;
    }

    if (!meetsMinOrder) {
      setError(
        `Minimum order is ${formatPrice(minOrderAmount)}. Add ${formatPrice(minOrderShortfall)} more to place your order.`
      );
      return;
    }

    const utr = form.utr.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,22}$/.test(utr)) {
      setError("UTR must be 8–22 letters/numbers (no spaces).");
      return;
    }

    setSubmitting(true);
    try {
      // Keep cart totals aligned with DB before place (avoids stale localStorage prices)
      const synced = await syncPricesFromCatalog({ force: true });
      const latestItems = synced.items?.length ? synced.items : items;
      const latestSubtotal = latestItems.reduce(
        (sum, item) => sum + item.priceValue * item.qty,
        0
      );
      if (latestSubtotal < minOrderAmount) {
        const short = Math.max(0, minOrderAmount - latestSubtotal);
        setError(
          `Minimum order is ${formatPrice(minOrderAmount)}. Add ${formatPrice(short)} more to place your order.`
        );
        return;
      }

      const result = await placeOrder({
        ...form,
        utr,
        items: latestItems.map((item) => ({
          id: item.id,
          type: item.type,
          qty: item.qty,
        })),
      });
      clearCart();
      onSuccess?.(result.order);
    } catch (err) {
      setError(err.message || "Could not place order");
      syncPricesFromCatalog({ force: true });
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
          {shippingLoading ? (
            <p className="checkout-shipping-note">Calculating shipping…</p>
          ) : null}
          {shipping ? (
            <p
              className={`checkout-shipping-note${
                shipping.serviceable ? "" : " checkout-shipping-note--error"
              }`}
            >
              {shipping.message}
              {shipping.serviceable
                ? ` · Shipping ${formatPrice(shipping.fee)}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>

      <div className="checkout-section checkout-payment">
        <h3>2. Pay via UPI</h3>
        <p className="checkout-note">
          {config?.note || "Scan QR, pay the exact amount, then enter UTR."}
        </p>
        <div className="checkout-totals">
          <div>
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <div>
            <span>Shipping</span>
            <strong>
              {shipping?.serviceable ? formatPrice(shippingFee) : "—"}
            </strong>
          </div>
          <div className="checkout-totals__grand">
            <span>Pay exactly</span>
            <strong>{canPay ? formatPrice(grandTotal) : "—"}</strong>
          </div>
        </div>
        {!meetsMinOrder ? (
          <p className="checkout-shipping-note checkout-shipping-note--error">
            Minimum order {formatPrice(minOrderAmount)}. Add{" "}
            {formatPrice(minOrderShortfall)} more to checkout.
          </p>
        ) : null}
        <div className="checkout-qr-wrap">
          {qrUrl ? (
            <img src={qrUrl} alt="UPI payment QR code" className="checkout-qr" />
          ) : (
            <div className="checkout-qr checkout-qr--loading">
              {!meetsMinOrder
                ? `Min order ${formatPrice(minOrderAmount)} required`
                : canPay
                  ? "Loading QR…"
                  : "Enter a serviceable pincode for QR"}
            </div>
          )}
          <div className="checkout-upi-meta">
            <p>
              <strong>UPI ID:</strong> {config?.upiId || "—"}
            </p>
            <p>
              <strong>Payee:</strong> {config?.payeeName || "Crackaro"}
            </p>
            <p>
              <strong>Amount:</strong>{" "}
              {canPay ? formatPrice(grandTotal) : "—"}
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
            minLength={8}
            maxLength={22}
            pattern="[A-Za-z0-9]{8,22}"
            value={form.utr}
            onChange={updateField}
            placeholder="e.g. 123456789012"
            autoComplete="off"
          />
          <p className="checkout-shipping-note">
            {config?.utrHint || "8–22 letters/numbers from your bank SMS."}
          </p>
        </div>
      </div>

      {error ? <p className="form-note error">{error}</p> : null}

      <button
        type="submit"
        className="btn btn-primary btn-block btn-lg"
        disabled={submitting || !canPay || form.utr.length < 8}
      >
        <i className="fa-solid fa-lock"></i>{" "}
        {submitting
          ? "Placing order..."
          : `Place order · ${canPay ? formatPrice(grandTotal) : "—"}`}
      </button>
    </form>
  );
}
