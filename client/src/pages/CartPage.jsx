import { useState } from "react";
import { Link } from "react-router-dom";
import FestivalBanner from "../components/layout/FestivalBanner";
import Topbar from "../components/layout/Topbar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import CheckoutForm from "../components/cart/CheckoutForm";
import { formatPrice, useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, count, total, removeItem, updateQty, clearCart } = useCart();
  const [step, setStep] = useState("cart");
  const [placedOrder, setPlacedOrder] = useState(null);

  return (
    <>
      <FestivalBanner />
      <Topbar />
      <Header />
      <main className="cart-page">
        <div className="container">
          <nav className="cart-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Cart</span>
          </nav>

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
                <div>
                  <p className="eyebrow">Shopping cart</p>
                  <h1>
                    {step === "checkout" ? "Checkout" : "Your cart"}
                  </h1>
                  <p className="cart-page__sub">
                    {count} item{count === 1 ? "" : "s"} · Secure UPI checkout
                  </p>
                </div>
                {step === "checkout" ? (
                  <button
                    type="button"
                    className="btn btn-outline"
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
                  <p>Add crackers or festival packs to continue.</p>
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
                                {item.unit ? item.unit.replace("/", "").trim() : "item"}
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
                    <button
                      type="button"
                      className="btn btn-primary btn-block btn-lg"
                      onClick={() => setStep("checkout")}
                    >
                      Proceed to checkout
                    </button>
                    <ul className="cart-summary__perks">
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
