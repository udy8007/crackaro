import { useCart } from "../../context/CartContext";
import { PRODUCT_FILTERS, PRODUCTS } from "../../data/products";

export default function Products({ activeFilter, onFilterChange }) {
  const { addItem } = useCart();

  const visible = PRODUCTS.filter(
    (product) => activeFilter === "all" || product.category === activeFilter
  );

  const handleAdd = (product) => {
    addItem({
      type: "product",
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      icon: product.icon,
      mediaClass: product.mediaClass,
    });
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

        <div className="product-grid" id="productGrid">
          {visible.map((product) => (
            <article
              key={product.id}
              className="product-card"
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
                  <button
                    type="button"
                    className="btn btn-sm btn-primary add-cart-btn"
                    onClick={() => handleAdd(product)}
                  >
                    <i className="fa-solid fa-cart-plus"></i> Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
