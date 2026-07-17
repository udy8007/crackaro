import { useEffect, useState } from "react";
import { fetchCatalog } from "../../api/products";
import { useCart } from "../../context/CartContext";
import { PRODUCT_FILTERS } from "../../data/products";

export default function Products({ activeFilter, onFilterChange }) {
  const { items, addItem, updateQty, removeItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchCatalog()
      .then((data) => {
        if (!alive) return;
        setProducts(data.products || []);
        if (data.fromFallback) {
          setError("Showing offline catalog — connect API for live stock.");
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || "Could not load products");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const visible = products.filter(
    (product) => activeFilter === "all" || product.category === activeFilter
  );

  const getLine = (product) =>
    items.find((row) => row.cartId === `product-${product.id}`);

  const handleAdd = (product) => {
    if (product.stock <= 0) return;
    addItem({
      type: "product",
      id: String(product.id),
      name: product.name,
      price: product.price,
      priceValue: product.priceValue,
      unit: product.unit,
      icon: product.icon,
      mediaClass: product.mediaClass,
      maxStock: product.stock,
      qty: 1,
    });
  };

  const handleQtyChange = (product, nextQty) => {
    const cartId = `product-${product.id}`;
    if (nextQty < 1) {
      removeItem(cartId);
      return;
    }
    const max = Number(product.stock) || 1;
    updateQty(cartId, Math.min(nextQty, max));
  };

  return (
    <section className="section section-alt" id="products">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Featured Products</p>
          <h2>Popular crackers this season</h2>
          <p className="section-desc">
            Handpicked bestsellers with clear pricing and quality grades.
          </p>
        </div>

        <div className="filter-bar" id="filterBar">
          {PRODUCT_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`filter-btn${activeFilter === filter.id ? " active" : ""}`}
              onClick={() => onFilterChange(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? <p className="catalog-status">Loading products…</p> : null}
        {error ? <p className="catalog-status catalog-status--warn">{error}</p> : null}

        <div className="product-grid" id="productGrid">
          {visible.map((product) => {
            const oos = product.stock <= 0;
            const line = getLine(product);
            const qty = line?.qty || 0;
            const atMax = qty >= (Number(product.stock) || 0);

            return (
              <article
                key={product.id}
                className={`product-card${oos ? " product-card--oos" : ""}`}
                data-category={product.category}
              >
                <div className={`product-media ${product.mediaClass}`}>
                  <i className={`fa-solid ${product.icon}`}></i>
                </div>
                <div className="product-body">
                  <span className={`tag ${product.tagClass}`}>{product.tag}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <span className="price">
                      {product.price} <small>{product.unit}</small>
                    </span>
                    {oos ? (
                      <button type="button" className="btn btn-sm btn-outline" disabled>
                        Out of stock
                      </button>
                    ) : qty > 0 ? (
                      <div className="qty-control product-qty">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => handleQtyChange(product, qty - 1)}
                        >
                          −
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={atMax}
                          onClick={() => handleQtyChange(product, qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary add-cart-btn"
                        onClick={() => handleAdd(product)}
                      >
                        <i className="fa-solid fa-cart-plus"></i> Add to cart
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
