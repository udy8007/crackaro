import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchPublicSettings } from "../../api/settings";
import { formatPrice, useCart } from "../../context/CartContext";

/**
 * Slim floating cart dock — brand-aligned, commerce-style.
 * Hidden on cart page and when cart is empty.
 */
export default function MinOrderBar() {
  const { total, count } = useCart();
  const location = useLocation();
  const onCart = location.pathname === "/cart";
  const [minOrderAmount, setMinOrderAmount] = useState(3000);

  useEffect(() => {
    fetchPublicSettings().then((data) => {
      if (data?.minOrderAmount != null) {
        setMinOrderAmount(Number(data.minOrderAmount) || 3000);
      }
    });
  }, []);

  const visible = !onCart && count > 0;

  useEffect(() => {
    document.body.classList.toggle("has-min-order-dock", visible);
    return () => document.body.classList.remove("has-min-order-dock");
  }, [visible]);

  if (!visible) return null;

  const meetsMinOrder = total >= minOrderAmount;
  const shortfall = Math.max(0, minOrderAmount - total);
  const pct = Math.min(
    100,
    minOrderAmount > 0 ? (total / minOrderAmount) * 100 : 0
  );
  const fillPct = meetsMinOrder
    ? 100
    : Math.min(100, Math.max(pct, pct > 0 ? 10 : 0));

  return (
    <div
      className={`cart-dock${meetsMinOrder ? " is-ready" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="cart-dock__shell">
        <div
          className="cart-dock__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={minOrderAmount}
          aria-valuenow={Math.min(total, minOrderAmount)}
          aria-label="Minimum order progress"
        >
          <span style={{ width: `${fillPct}%` }} />
        </div>

        <div className="cart-dock__body">
          <div className="cart-dock__info">
            <p className="cart-dock__total">{formatPrice(total)}</p>
            <p className="cart-dock__note">
              {meetsMinOrder ? (
                <>
                  <i className="fa-solid fa-check" aria-hidden="true"></i>
                  Min. order met
                </>
              ) : (
                <>
                  {formatPrice(shortfall)} to min · {formatPrice(minOrderAmount)}
                </>
              )}
            </p>
          </div>

          <Link to="/cart" className="cart-dock__cta">
            {meetsMinOrder ? "Checkout" : "Cart"}
            <em>{count}</em>
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}
