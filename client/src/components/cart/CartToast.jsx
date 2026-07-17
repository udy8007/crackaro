import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

export default function CartToast() {
  const { toast, clearToast } = useCart();
  if (!toast) return null;

  return (
    <div className="cart-toast" role="status" aria-live="polite">
      <i className="fa-solid fa-circle-check"></i>
      <span>{toast}</span>
      <Link to="/cart" className="cart-toast__link" onClick={clearToast}>
        View cart
      </Link>
    </div>
  );
}
