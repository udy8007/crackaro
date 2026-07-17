import { useCart } from "../../context/CartContext";
import { PACKS } from "../../data/products";

export default function Packs() {
  const { addItem } = useCart();

  const handleAddPack = (pack) => {
    addItem({
      type: "pack",
      id: pack.id,
      name: pack.name,
      price: pack.price,
      unit: "/ pack",
      icon: "fa-gift",
      mediaClass: "c-orange",
    });
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
        <div className="pack-grid">
          {PACKS.map((pack) => (
            <article key={pack.id} className={`pack-card ${pack.className}`}>
              {pack.featured ? (
                <span className="pack-badge">Most Popular</span>
              ) : null}
              <div className="pack-top">
                <h3>{pack.name}</h3>
                <p className="pack-price">{pack.price}</p>
              </div>
              <ul>
                {pack.items.map((item) => (
                  <li key={item}>
                    <i className="fa-solid fa-check"></i> {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`btn ${pack.buttonClass} pack-btn`}
                onClick={() => handleAddPack(pack)}
              >
                <i className="fa-solid fa-cart-plus"></i> Add to Cart
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
