import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const NAV_LINKS = [
  { href: "/#home", label: "Home", id: "home" },
  { href: "/#categories", label: "Categories", id: "categories" },
  { href: "/#products", label: "Products", id: "products" },
  { href: "/#packs", label: "Festival Packs", id: "packs" },
  { href: "/#about", label: "About", id: "about" },
  { href: "/#safety", label: "Safety", id: "safety" },
  { href: "/#contact", label: "Contact", id: "contact" },
];

export default function Header({ activeSection }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();
  const location = useLocation();
  const onHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className="header"
      id="header"
      style={{
        boxShadow: scrolled ? "0 4px 16px rgba(17, 24, 39, 0.06)" : "none",
      }}
    >
      <div className="container header-inner">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo-icon">
            <i className="fa-solid fa-burst"></i>
          </span>
          <span className="logo-text">
            <strong>Sparkle</strong>
            <small>Crackers</small>
          </span>
        </Link>

        <nav className={`nav${menuOpen ? " open" : ""}`} id="nav">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`nav-link${
                onHome && activeSection === link.id ? " active" : ""
              }`}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <Link
            to="/track"
            className={`header-track-link${
              location.pathname === "/track" ? " is-active" : ""
            }`}
            onClick={closeMenu}
          >
            Track order
          </Link>
          <span className="festival-chip">
            <i className="fa-solid fa-star"></i> Celebration Sale
          </span>
          <Link
            to="/cart"
            className="cart-btn"
            aria-label={`Cart, ${count} items`}
            onClick={closeMenu}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            {count > 0 ? <span className="cart-btn__badge">{count}</span> : null}
          </Link>
          <a href="/#contact" className="btn btn-primary" onClick={closeMenu}>
            Get Quote
          </a>
          <button
            className="menu-toggle"
            id="menuToggle"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`}></i>
          </button>
        </div>
      </div>
    </header>
  );
}
