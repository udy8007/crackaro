import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="#home" className="logo" aria-label="Crackaro home">
            <span className="logo-icon" aria-hidden="true">
              <i className="fa-solid fa-burst"></i>
            </span>
            <span className="logo-text">
              <strong>Crackaro</strong>
              <small>Fireworks &amp; Crackers</small>
            </span>
          </a>
          <p>
            Premium fireworks and crackers for festive celebrations — quality,
            safety, and reliable service.
          </p>
          <div className="social">
            <a href="#" aria-label="Facebook">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a href="#" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" aria-label="WhatsApp">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a href="#" aria-label="YouTube">
              <i className="fa-brands fa-youtube"></i>
            </a>
          </div>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="#categories">Categories</a>
            </li>
            <li>
              <a href="#products">Products</a>
            </li>
            <li>
              <a href="#packs">Festival Packs</a>
            </li>
            <li>
              <a href="#safety">Safety</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li>
              <a href="#about">About Us</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
            <li>
              <Link to="/track">Track order</Link>
            </li>
            <li>
              <a href="#safety">Safety Policy</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Order Info</h4>
          <ul>
            <li>Free shipping above ₹3,000</li>
            <li>Delivery timelines vary by location</li>
            <li>Follow local fireworks regulations</li>
            <li>Use only as per safety instructions</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>&copy; 2026 Crackaro. All rights reserved.</p>
          <p>Celebrate responsibly. Follow local laws and safety guidelines.</p>
        </div>
      </div>
    </footer>
  );
}
