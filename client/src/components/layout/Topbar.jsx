export default function Topbar() {
  return (
    <div className="topbar">
      <div className="container topbar-inner">
        <div className="topbar-left">
          <span>
            <i className="fa-solid fa-phone"></i> +91 98765 43210
          </span>
          <span>
            <i className="fa-solid fa-envelope"></i> orders@crackaro.com
          </span>
        </div>
        <div className="topbar-right">
          <span>
            <i className="fa-solid fa-truck-fast"></i> Pan-India Delivery
          </span>
          <span>
            <i className="fa-solid fa-certificate"></i> PESO Certified
          </span>
        </div>
      </div>
    </div>
  );
}
