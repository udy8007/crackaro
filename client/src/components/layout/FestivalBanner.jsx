import { useEffect, useState } from "react";
import { fetchPublicSettings } from "../../api/settings";

export default function FestivalBanner() {
  const [minOrderAmount, setMinOrderAmount] = useState(3000);

  useEffect(() => {
    fetchPublicSettings().then((data) => {
      if (data?.minOrderAmount != null) {
        setMinOrderAmount(Number(data.minOrderAmount) || 3000);
      }
    });
  }, []);

  const minLabel = `₹${Number(minOrderAmount).toLocaleString("en-IN")}`;

  return (
    <div className="festival-banner">
      <div className="container festival-banner-inner">
        {/* First span is the only one shown on mobile — keep min order here */}
        <span className="festival-banner__priority">
          <i className="fa-solid fa-basket-shopping"></i> Minimum order{" "}
          {minLabel} to checkout
        </span>
        <span className="festival-banner-sep">•</span>
        <span>
          <i className="fa-solid fa-burst"></i> Crackaro Festival Mode ON
        </span>
        <span className="festival-banner-sep">•</span>
        <span>
          <i className="fa-solid fa-truck-fast"></i> Free shipping above ₹5,000
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
