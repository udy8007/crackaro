import { useMemo, useState } from "react";
import FestivalBanner from "../components/layout/FestivalBanner";
import Topbar from "../components/layout/Topbar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BackToTop from "../components/layout/BackToTop";
import Hero from "../components/sections/Hero";
import Trust from "../components/sections/Trust";
import Categories from "../components/sections/Categories";
import Products from "../components/sections/Products";
import Packs from "../components/sections/Packs";
import About from "../components/sections/About";
import Safety from "../components/sections/Safety";
import Testimonials from "../components/sections/Testimonials";
import Contact from "../components/sections/Contact";
import useActiveSection from "../hooks/useActiveSection";

const SECTION_IDS = [
  "home",
  "categories",
  "products",
  "packs",
  "about",
  "safety",
  "contact",
];

export default function HomePage() {
  const sectionIds = useMemo(() => SECTION_IDS, []);
  const activeSection = useActiveSection(sectionIds);
  const [activeFilter, setActiveFilter] = useState("all");

  const handleSelectCategory = (filter) => {
    setActiveFilter(filter === "gift" ? "all" : filter);
  };

  return (
    <>
      <FestivalBanner />
      <Topbar />
      <Header activeSection={activeSection} />
      <main>
        <Hero />
        <Trust />
        <Categories onSelectCategory={handleSelectCategory} />
        <Products
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <Packs />
        <About />
        <Safety />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
