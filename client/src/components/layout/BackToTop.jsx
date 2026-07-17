import { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#home"
      className={`back-top${show ? " show" : ""}`}
      id="backTop"
      aria-label="Back to top"
    >
      <i className="fa-solid fa-arrow-up"></i>
    </a>
  );
}
