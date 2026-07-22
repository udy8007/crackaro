import { useEffect, useState } from "react";
import { fetchPublicSettings } from "../../api/settings";

export default function FestivalBanner() {
  const [minOrderAmount, setMinOrderAmount] = useState(3000);
  const [deliveryFee, setDeliveryFee] = useState(250);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(6000);

  useEffect(() => {
    fetchPublicSettings().then((data) => {
      if (data?.minOrderAmount != null) {
        setMinOrderAmount(Number(data.minOrderAmount) || 3000);
      }
      if (data?.deliveryFee != null) {
        setDeliveryFee(Number(data.deliveryFee) || 250);
      }
      if (data?.freeDeliveryAbove != null) {
        setFreeDeliveryAbove(Number(data.freeDeliveryAbove) || 6000);
      }
    });
  }, []);

  const rupee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  return (
    <div className="festival-banner">
      <div className="container festival-banner-inner">
        <span className="festival-banner__priority">
          <i className="fa-solid fa-basket-shopping"></i> Minimum order{" "}
          {rupee(minOrderAmount)} to checkout
        </span>
        <span className="festival-banner-sep">•</span>
        <span>
          <i className="fa-solid fa-truck-fast"></i> Delivery {rupee(deliveryFee)}
          · Free above {rupee(freeDeliveryAbove)}
        </span>
        <span className="festival-banner-sep">•</span>
        <span>
          <i className="fa-solid fa-burst"></i> Crackaro Festival Mode ON
        </span>
        <span className="festival-banner-sep">•</span>
        <span>
          <i className="fa-solid fa-bolt"></i> Limited festive stock — Order
          early
        </span>
      </div>
    </div>
  );
}
