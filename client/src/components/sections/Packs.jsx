import { useEffect, useState } from "react";
import { fetchCatalog } from "../../api/products";
import { useCart } from "../../context/CartContext";

export default function Packs() {
  const { items, addItem, updateQty, removeItem } = useCart();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchCatalog()
      .then((data) => {
        if (alive) setPacks(data.packs || []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const getLine = (pack) =>
    items.find((row) => row.cartId === `pack-${pack.id}`);

  const handleAddPack = (pack) => {
    if (pack.stock <= 0) return;
    addItem({
      type: "pack",
      id: String(pack.id),
      name: pack.name,
      price: pack.price,
      priceValue: pack.priceValue,
      unit: pack.unit || "/ pack",
      icon: "fa-gift",
      mediaClass: "c-orange",
      maxStock: pack.stock,
      qty: 1,
    });
  };

  const handleQtyChange = (pack, nextQty) => {
    const cartId = `pack-${pack.id}`;
    if (nextQty < 1) {
      removeItem(cartId);
      return;
    }
    const max = Number(pack.stock) || 1;
    updateQty(cartId, Math.min(nextQty, max));
  };

  return (
    <section className="section" id="packs">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Festival Packs</p>
          <h2>Ready-made celebration boxes</h2>
          <p className="section-desc">
            Value packs designed for families, offices, and wedding events.
          </p>
        </div>
        {loading ? <p className="catalog-status">Loading packs…</p> : null}
        <div className="pack-grid">
          {packs.map((pack) => {
            const oos = pack.stock <= 0;
            const line = getLine(pack);
            const qty = line?.qty || 0;
            const atMax = qty >= (Number(pack.stock) || 0);

            return (
              <article key={pack.id} className={`pack-card ${pack.className}`}>
                {pack.featured ? (
                  <span className="pack-badge">Most Popular</span>
                ) : null}
                <div className="pack-top">
                  <h3>{pack.name}</h3>
                  <p className="pack-price">{pack.price}</p>
                </div>
                <ul>
                  {(pack.items || []).map((item) => (
                    <li key={item}>
                      <i className="fa-solid fa-check"></i> {item}
                    </li>
                  ))}
                </ul>
                {oos ? (
                  <button type="button" className="btn btn-outline pack-btn" disabled>
                    Out of stock
                  </button>
                ) : qty > 0 ? (
                  <div className="qty-control pack-qty">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => handleQtyChange(pack, qty - 1)}
                    >
                      −
                    </button>
                    <span>{qty}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={atMax}
                      onClick={() => handleQtyChange(pack, qty + 1)}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`btn ${pack.buttonClass} pack-btn`}
                    onClick={() => handleAddPack(pack)}
                  >
                    <i className="fa-solid fa-cart-plus"></i> Add to Cart
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
