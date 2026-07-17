import { CATEGORIES } from "../../data/products";

export default function Categories({ onSelectCategory }) {
  return (
    <section className="section" id="categories">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Shop by Category</p>
          <h2>Find the perfect crackers for your celebration</h2>
          <p className="section-desc">
            From gentle sparklers to grand aerial displays — curated for every
            occasion and age group.
          </p>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <a
              key={category.filter}
              href="#products"
              className={`category-card ${category.className}`}
              onClick={() => onSelectCategory(category.filter)}
            >
              <i className={`fa-solid ${category.icon}`}></i>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
