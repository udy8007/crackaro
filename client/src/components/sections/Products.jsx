import { useEffect, useMemo, useState } from "react";
import { fetchCatalog } from "../../api/products";
import { useCart } from "../../context/CartContext";
import { PRODUCT_FILTERS } from "../../data/products";

export default function Products({ activeFilter, onFilterChange }) {
  const { items, addItem, updateQty, removeItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

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

  useEffect(() => {
    if (!preview) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setPreview(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [preview]);

  const visible = useMemo(
    () =>
      products.filter(
        (product) => activeFilter === "all" || product.category === activeFilter
      ),
    [products, activeFilter]
  );

  const filterCounts = useMemo(() => {
    const counts = { all: products.length };
    for (const product of products) {
      const key = product.category;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [products]);

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
      imageUrl: product.imageUrl || null,
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

  const previewLine = preview ? getLine(preview) : null;
  const previewQty = previewLine?.qty || 0;
  const previewOos = preview ? preview.stock <= 0 : false;
  const previewAtMax = preview
    ? previewQty >= (Number(preview.stock) || 0)
    : false;

  return (
    <section className="section products-shop" id="products">
      <div className="products-shop__glow" aria-hidden="true" />
      <div className="container">
        <header className="products-shop__head">
          <p className="eyebrow">Featured Products</p>
          <h2>
            Shop crackers
            <span className="products-shop__title-long"> by category</span>
          </h2>
          <p className="section-desc products-shop__desc">
            Clear pricing and live stock — choose a category below.
          </p>
        </header>

        <div className="products-shop__toolbar">
          <div
            className="products-filters"
            id="filterBar"
            role="tablist"
            aria-label="Product categories"
          >
            {PRODUCT_FILTERS.map((filter) => {
              const active = activeFilter === filter.id;
              const count = filterCounts[filter.id] ?? 0;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`products-filter${active ? " is-active" : ""}`}
                  onClick={(event) => {
                    onFilterChange(filter.id);
                    event.currentTarget.scrollIntoView({
                      behavior: "smooth",
                      inline: "center",
                      block: "nearest",
                    });
                  }}
                >
                  <span className="products-filter__icon" aria-hidden="true">
                    <i className={`fa-solid ${filter.icon}`} />
                  </span>
                  <span className="products-filter__label">{filter.label}</span>
                  <span className="products-filter__count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? <p className="catalog-status">Loading products…</p> : null}
        {error ? (
          <p className="catalog-status catalog-status--warn">{error}</p>
        ) : null}

        {!loading && visible.length === 0 ? (
          <p className="catalog-status">No products in this category.</p>
        ) : null}

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
                <button
                  type="button"
                  className="product-card__preview-hit"
                  aria-label={`Preview ${product.name}`}
                  onClick={() => setPreview(product)}
                />
                <div
                  className={`product-media${
                    product.imageUrl ? " product-media--photo" : ""
                  } ${product.mediaClass}`}
                >
                  {oos ? (
                    <span className="product-card__badge">Sold out</span>
                  ) : null}
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallbackTried) return;
                        img.dataset.fallbackTried = "1";
                        const src = String(product.imageUrl);
                        if (src.includes(".png")) {
                          img.src = src.replace(/\.png(\?|$)/, ".jpg$1");
                        } else {
                          img.style.display = "none";
                        }
                      }}
                    />
                  ) : (
                    <i className={`fa-solid ${product.icon}`}></i>
                  )}
                </div>
                <div className="product-body">
                  <span className={`tag ${product.tagClass}`}>{product.tag}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div
                    className="product-footer"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <span className="price">
                      {product.price} <small>{product.unit}</small>
                    </span>
                    {oos ? (
                      <button
                        type="button"
                        className="product-cta product-cta--disabled"
                        disabled
                      >
                        Out of stock
                      </button>
                    ) : qty > 0 ? (
                      <div
                        className="product-qty"
                        role="group"
                        aria-label="Quantity"
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => handleQtyChange(product, qty - 1)}
                        >
                          −
                        </button>
                        <span aria-live="polite">{qty}</span>
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
                        className="product-cta"
                        onClick={() => handleAdd(product)}
                      >
                        <i
                          className="fa-solid fa-cart-plus"
                          aria-hidden="true"
                        ></i>
                        <span>Add to cart</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {preview ? (
        <div
          className="product-preview"
          role="dialog"
          aria-modal="true"
          aria-label={preview.name}
        >
          <button
            type="button"
            className="product-preview__backdrop"
            aria-label="Close preview"
            onClick={() => setPreview(null)}
          />
          <div className="product-preview__sheet">
            <div className="product-preview__grab" aria-hidden="true" />
            <button
              type="button"
              className="product-preview__close"
              aria-label="Close"
              onClick={() => setPreview(null)}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>

            <div
              className={`product-preview__media${
                preview.imageUrl ? " product-preview__media--photo" : ""
              } ${preview.mediaClass || ""}`}
            >
              {preview.imageUrl ? (
                <img src={preview.imageUrl} alt={preview.name} />
              ) : (
                <i className={`fa-solid ${preview.icon}`}></i>
              )}
            </div>

            <div className="product-preview__body">
              <span className={`tag ${preview.tagClass}`}>{preview.tag}</span>
              <h3>{preview.name}</h3>
              <p className="product-preview__desc">
                {preview.description || "No description available."}
              </p>
              <p className="product-preview__price">
                {preview.price} <small>{preview.unit}</small>
              </p>

              {previewOos ? (
                <button
                  type="button"
                  className="product-cta product-cta--disabled"
                  disabled
                >
                  Out of stock
                </button>
              ) : previewQty > 0 ? (
                <div className="product-preview__actions">
                  <div
                    className="product-qty"
                    role="group"
                    aria-label="Quantity"
                  >
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => handleQtyChange(preview, previewQty - 1)}
                    >
                      −
                    </button>
                    <span aria-live="polite">{previewQty}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={previewAtMax}
                      onClick={() => handleQtyChange(preview, previewQty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline product-preview__done"
                    onClick={() => setPreview(null)}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="product-cta"
                  onClick={() => handleAdd(preview)}
                >
                  <i className="fa-solid fa-cart-plus" aria-hidden="true"></i>
                  <span>Add to cart</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
