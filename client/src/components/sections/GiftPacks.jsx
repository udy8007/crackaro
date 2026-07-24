import { useEffect, useState } from "react";
import { fetchCatalog } from "../../api/products";
import { useCart } from "../../context/CartContext";

function packClassName(pack) {
  return `pack-card gift-pack-card ${pack.className || "pack-orange"}`.trim();
}

export default function GiftPacks() {
  const { items, addItem, updateQty, removeItem } = useCart();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchCatalog()
      .then((data) => {
        if (!alive) return;
        setPacks(data.packs || []);
        if (data.fromFallback) {
          setError("Showing offline gift packs — connect API for live stock.");
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || "Could not load gift packs");
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

  const getLine = (pack) => items.find((row) => row.cartId === `pack-${pack.id}`);

  const handleAdd = (pack) => {
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
      imageUrl: pack.imageUrl || null,
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

  const previewLine = preview ? getLine(preview) : null;
  const previewQty = previewLine?.qty || 0;
  const previewOos = preview ? preview.stock <= 0 : false;
  const previewAtMax = preview
    ? previewQty >= (Number(preview.stock) || 0)
    : false;

  return (
    <section className="section gift-packs" id="packs">
      <div className="container">
        <header className="section-head gift-packs__head">
          <p className="eyebrow">Gift Packs</p>
          <h2>Ready-made celebration boxes</h2>
          <p className="section-desc">
            Curated Sivakasi gift packs with clear item lists — perfect for
            family festivals and bulk gifting.
          </p>
        </header>

        {error ? <p className="gift-packs__note">{error}</p> : null}

        {loading ? (
          <p className="gift-packs__note">Loading gift packs…</p>
        ) : packs.length === 0 ? (
          <p className="gift-packs__note">No gift packs available right now.</p>
        ) : (
          <div className="pack-grid gift-pack-grid">
            {packs.map((pack) => {
              const line = getLine(pack);
              const qty = line?.qty || 0;
              const oos = pack.stock <= 0;
              const atMax = qty >= (Number(pack.stock) || 0);
              const previewItems = (pack.items || []).slice(0, 4);

              return (
                <article key={pack.id} className={packClassName(pack)}>
                  {pack.featured ? (
                    <span className="pack-badge">Most Popular</span>
                  ) : null}

                  <button
                    type="button"
                    className="gift-pack-card__media"
                    onClick={() => setPreview(pack)}
                    aria-label={`View ${pack.name} contents`}
                  >
                    {pack.imageUrl ? (
                      <img src={pack.imageUrl} alt={pack.name} />
                    ) : (
                      <span className="gift-pack-card__icon" aria-hidden="true">
                        <i className="fa-solid fa-gift"></i>
                      </span>
                    )}
                    {pack.itemCount ? (
                      <span className="gift-pack-card__count">
                        {pack.itemCount} items
                      </span>
                    ) : null}
                  </button>

                  <div className="pack-top">
                    {pack.tag ? (
                      <span className={`tag ${pack.tagClass || "tag-gold"}`}>
                        {pack.tag}
                      </span>
                    ) : null}
                    <h3>{pack.name}</h3>
                    <p className="pack-price">
                      {pack.price}
                      {pack.mrpLabel && pack.mrp > pack.priceValue ? (
                        <small className="gift-pack-card__mrp">
                          MRP {pack.mrpLabel}
                        </small>
                      ) : null}
                    </p>
                  </div>

                  <ul className="gift-pack-card__list">
                    {previewItems.map((item, index) => (
                      <li key={`${pack.id}-${index}`}>
                        <i className="fa-solid fa-check" aria-hidden="true"></i>
                        <span>
                          {item.name}
                          {item.contains ? (
                            <em> · {item.contains}</em>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="gift-pack-card__contents"
                    onClick={() => setPreview(pack)}
                  >
                    View full contents
                    <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                  </button>

                  {oos ? (
                    <button
                      type="button"
                      className="btn btn-outline pack-btn"
                      disabled
                    >
                      Out of stock
                    </button>
                  ) : qty > 0 ? (
                    <div className="product-qty pack-qty" role="group" aria-label="Quantity">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => handleQtyChange(pack, qty - 1)}
                      >
                        −
                      </button>
                      <span aria-live="polite">{qty}</span>
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
                      className={`btn ${pack.buttonClass || "btn-outline"} pack-btn`}
                      onClick={() => handleAdd(pack)}
                    >
                      <i className="fa-solid fa-cart-plus" aria-hidden="true"></i>
                      <span>Add pack</span>
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {preview ? (
        <div
          className="product-preview gift-pack-preview"
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
          <div className="product-preview__sheet gift-pack-preview__sheet">
            <div className="product-preview__grab" aria-hidden="true" />
            <button
              type="button"
              className="product-preview__close"
              aria-label="Close"
              onClick={() => setPreview(null)}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>

            <div className="product-preview__media product-preview__media--photo gift-pack-preview__media">
              {preview.imageUrl ? (
                <img src={preview.imageUrl} alt={preview.name} />
              ) : (
                <i className="fa-solid fa-gift"></i>
              )}
            </div>

            <div className="product-preview__body gift-pack-preview__body">
              {preview.tag ? (
                <span className={`tag ${preview.tagClass || "tag-gold"}`}>
                  {preview.tag}
                </span>
              ) : null}
              <h3>{preview.name}</h3>
              <p className="product-preview__price">
                {preview.price} <small>{preview.unit || "/ pack"}</small>
                {preview.mrpLabel && preview.mrp > preview.priceValue ? (
                  <small className="gift-pack-card__mrp">
                    {" "}
                    MRP {preview.mrpLabel}
                  </small>
                ) : null}
              </p>
              <p className="gift-pack-preview__meta">
                {preview.itemCount || preview.items?.length || 0} items included
              </p>

              <div className="gift-pack-preview__table-wrap">
                <table className="gift-pack-preview__table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Item</th>
                      <th scope="col">Contains</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.items || []).map((item, index) => (
                      <tr key={`${preview.id}-row-${index}`}>
                        <td>{index + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.contains || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
                  <div className="product-qty" role="group" aria-label="Quantity">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        handleQtyChange(preview, previewQty - 1)
                      }
                    >
                      −
                    </button>
                    <span aria-live="polite">{previewQty}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={previewAtMax}
                      onClick={() =>
                        handleQtyChange(preview, previewQty + 1)
                      }
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
                  <span>Add pack</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
