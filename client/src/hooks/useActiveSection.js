import { useEffect, useState } from "react";

export default function useActiveSection(sectionIds) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || "home");

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + 120;
      let current = sectionIds[0];

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          current = id;
          break;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionIds]);

  return activeSection;
}
