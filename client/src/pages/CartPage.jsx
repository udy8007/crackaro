import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FestivalBanner from "../components/layout/FestivalBanner";
import Topbar from "../components/layout/Topbar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import CheckoutForm from "../components/cart/CheckoutForm";
import { fetchPublicSettings } from "../api/settings";
import { formatPrice, useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, count, total, removeItem, updateQty, clearCart } = useCart();
  const [step, setStep] = useState("cart");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [minOrderAmount, setMinOrderAmount] = useState(3000);

  useEffect(() => {
    fetchPublicSettings().then((data) => {
      if (data?.minOrderAmount != null) {
        setMinOrderAmount(Number(data.minOrderAmount) || 3000);
      }
    });
  }, []);

  const meetsMinOrder = total >= minOrderAmount;
  const minOrderShortfall = Math.max(0, minOrderAmount - total);

  useEffect(() => {
    // Kick user back to cart if they drop below minimum while on checkout
    if (step === "checkout" && items.length > 0 && !meetsMinOrder) {
      setStep("cart");
    }
  }, [step, items.length, meetsMinOrder]);

  return (
    <>
      <FestivalBanner />
      <Topbar />
      <Header />
      <main className="cart-page">
        <div className="container">
          {placedOrder ? (
            <section className="cart-success-panel">
              <div className="cart-success-panel__icon">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h1>Order placed successfully</h1>
              <p>
                Order <strong>{placedOrder.order_number}</strong> is waiting for
                payment verification. We will update status after UTR check.
              </p>
              <div className="cart-success-panel__meta">
                <div>
                  <span>Amount</span>
                  <strong>{formatPrice(placedOrder.total)}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>Payment submitted</strong>
                </div>
              </div>
              <div className="cart-success-panel__actions">
                <Link
                  to={`/track?order=${encodeURIComponent(
                    placedOrder.order_number || ""
                  )}&phone=${encodeURIComponent(placedOrder.phone || "")}`}
                  className="btn btn-primary"
                >
                  Track this order
                </Link>
                <Link to="/#products" className="btn btn-outline">
                  Continue shopping
                </Link>
              </div>
            </section>
          ) : (
            <>
              <div className="cart-page__head">
                <div className="cart-page__title-block">
                  <h1>
                    {step === "checkout" ? "Checkout" : "Cart"}
                    <span className="cart-page__count">{count}</span>
                  </h1>
                  <p className="cart-page__meta">
                    <Link to="/">Home</Link>
                    <span className="cart-page__meta-sep">/</span>
                    <span>{step === "checkout" ? "Checkout" : "Cart"}</span>
                    <span className="cart-page__meta-sep">·</span>
                    Secure UPI checkout
                  </p>
                </div>
                {step === "checkout" ? (
                  <button
                    type="button"
                    className="btn btn-outline cart-page__edit"
                    onClick={() => setStep("cart")}
                  >
                    <i className="fa-solid fa-arrow-left"></i> Edit cart
                  </button>
                ) : null}
              </div>

              {items.length === 0 ? (
                <section className="cart-empty-panel">
                  <i className="fa-solid fa-basket-shopping"></i>
                  <h2>Your cart is empty</h2>
                  <p>Add crackers to continue.</p>
                  <Link to="/#products" className="btn btn-primary">
                    Browse products
                  </Link>
                </section>
              ) : step === "checkout" ? (
                <div className="cart-layout cart-layout--checkout">
                  <section className="cart-panel">
                    <CheckoutForm
                      onSuccess={(order) => {
                        setPlacedOrder(order);
                        setStep("done");
                      }}
                    />
                  </section>
                  <aside className="cart-summary">
                    <h2>Order summary</h2>
                    <ul className="cart-summary__list">
                      {items.map((item) => (
                        <li key={item.cartId}>
                          <span>
                            {item.name} × {item.qty}
                          </span>
                          <strong>
                            {formatPrice(item.priceValue * item.qty)}
                          </strong>
                        </li>
                      ))}
                    </ul>
                    <div className="cart-summary__total">
                      <span>Total payable</span>
                      <strong>{formatPrice(total)}</strong>
                    </div>
                    <div
                      className={`cart-min-progress${
                        meetsMinOrder ? " is-met" : ""
                      }`}
                    >
                      <div className="cart-min-progress__head">
                        <span>Minimum order {formatPrice(minOrderAmount)}</span>
                        <strong>
                          {meetsMinOrder
                            ? "Ready to place"
                            : `${formatPrice(minOrderShortfall)} to go`}
                        </strong>
                      </div>
                      <div className="cart-min-progress__track">
                        <span
                          style={{
                            width: `${Math.min(
                              100,
                              minOrderAmount > 0
                                ? (total / minOrderAmount) * 100
                                : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="cart-summary__note">
                      Pay the exact amount by UPI, then submit your UTR for admin
                      verification.
                    </p>
                  </aside>
                </div>
              ) : (
                <div className="cart-layout">
                  <section className="cart-panel">
                    <div className="cart-table-head">
                      <span>Product</span>
                      <span>Price</span>
                      <span>Qty</span>
                      <span>Total</span>
                      <span />
                    </div>
                    <ul className="cart-table">
                      {items.map((item) => (
                        <li key={item.cartId} className="cart-table__row">
                          <div className="cart-table__product">
                            <div
                              className={`cart-item__media${item.imageUrl ? " cart-item__media--photo" : ""} ${item.mediaClass}`}
                            >
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} />
                              ) : (
                                <i className={`fa-solid ${item.icon}`}></i>
                              )}
                            </div>
                            <div>
                              <h3>{item.name}</h3>
                              <p>
                                {item.unit
                                  ? item.unit.replace("/", "").trim()
                                  : "item"}
                                <span className="cart-table__unit-price">
                                  {" "}
                                  · {formatPrice(item.priceValue)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="cart-table__price">
                            {formatPrice(item.priceValue)}
                          </div>
                          <div className="cart-table__qty">
                            <div className="qty-control">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() =>
                                  updateQty(item.cartId, item.qty - 1)
                                }
                              >
                                −
                              </button>
                              <span>{item.qty}</span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() =>
                                  updateQty(item.cartId, item.qty + 1)
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="cart-table__line">
                            {formatPrice(item.priceValue * item.qty)}
                          </div>
                          <button
                            type="button"
                            className="cart-table__remove"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => removeItem(item.cartId)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="cart-panel__foot">
                      <Link to="/#products" className="btn btn-outline">
                        <i className="fa-solid fa-arrow-left"></i> Continue
                        shopping
                      </Link>
                      <button
                        type="button"
                        className="cart-clear-link"
                        onClick={clearCart}
                      >
                        Clear cart
                      </button>
                    </div>
                  </section>

                  <aside className="cart-summary">
                    <h2>Order summary</h2>
                    <div className="cart-summary__rows">
                      <div>
                        <span>Subtotal</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div>
                        <span>Shipping</span>
                        <span>Calculated on confirm</span>
                      </div>
                    </div>
                    <div className="cart-summary__total">
                      <span>Order total</span>
                      <strong>{formatPrice(total)}</strong>
                    </div>
                    <div
                      className={`cart-min-progress${
                        meetsMinOrder ? " is-met" : ""
                      }`}
                    >
                      <div className="cart-min-progress__head">
                        <span>Minimum order {formatPrice(minOrderAmount)}</span>
                        <strong>
                          {meetsMinOrder
                            ? "Ready to checkout"
                            : `${formatPrice(minOrderShortfall)} to go`}
                        </strong>
                      </div>
                      <div
                        className="cart-min-progress__track"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={minOrderAmount}
                        aria-valuenow={Math.min(total, minOrderAmount)}
                        aria-label="Progress toward minimum order"
                      >
                        <span
                          style={{
                            width: `${Math.min(
                              100,
                              minOrderAmount > 0
                                ? (total / minOrderAmount) * 100
                                : 0
                            )}%`,
                          }}
                        />
                      </div>
                      {!meetsMinOrder ? (
                        <p className="cart-summary__min-warn" role="alert">
                          Add {formatPrice(minOrderShortfall)} more to place
                          your order. Browse products and come back here.
                        </p>
                      ) : (
                        <p className="cart-summary__min-ok">
                          Minimum reached — you can place this order.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-block btn-lg"
                      disabled={!meetsMinOrder}
                      onClick={() => {
                        if (!meetsMinOrder) return;
                        setStep("checkout");
                      }}
                    >
                      {meetsMinOrder
                        ? "Proceed to checkout"
                        : `Add ${formatPrice(minOrderShortfall)} more`}
                    </button>
                    {!meetsMinOrder ? (
                      <Link
                        to="/#products"
                        className="btn btn-outline btn-block cart-summary__add-more"
                      >
                        <i className="fa-solid fa-plus"></i> Add more products
                      </Link>
                    ) : null}
                    <ul className="cart-summary__perks">
                      <li>
                        <i className="fa-solid fa-basket-shopping"></i> Min
                        order {formatPrice(minOrderAmount)}
                      </li>
                      <li>
                        <i className="fa-solid fa-shield-halved"></i> Secure UPI
                        payment
                      </li>
                      <li>
                        <i className="fa-solid fa-clipboard-check"></i> Admin
                        verifies UTR
                      </li>
                      <li>
                        <i className="fa-solid fa-truck-fast"></i> Pan-India
                        dispatch
                      </li>
                    </ul>
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
