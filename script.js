(function () {
  const header = document.getElementById("header");
  const nav = document.getElementById("nav");
  const menuToggle = document.getElementById("menuToggle");
  const backTop = document.getElementById("backTop");
  const filterBar = document.getElementById("filterBar");
  const productCards = document.querySelectorAll(".product-card");
  const contactForm = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  const interestSelect = document.getElementById("interest");
  const messageField = document.getElementById("message");

  // Mobile menu
  menuToggle.addEventListener("click", function () {
    nav.classList.toggle("open");
    const icon = menuToggle.querySelector("i");
    icon.classList.toggle("fa-bars");
    icon.classList.toggle("fa-xmark");
  });

  nav.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      const icon = menuToggle.querySelector("i");
      icon.classList.add("fa-bars");
      icon.classList.remove("fa-xmark");
    });
  });

  // Active nav on scroll
  const sections = document.querySelectorAll("section[id]");

  function updateActiveNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute("id");
      const link = nav.querySelector('a[href="#' + id + '"]');
      if (!link) return;
      if (scrollY >= top && scrollY < top + height) {
        nav.querySelectorAll(".nav-link").forEach(function (item) {
          item.classList.remove("active");
        });
        link.classList.add("active");
      }
    });

    if (window.scrollY > 400) {
      backTop.classList.add("show");
    } else {
      backTop.classList.remove("show");
    }
  }

  window.addEventListener("scroll", updateActiveNav);
  updateActiveNav();

  // Product filters
  filterBar.addEventListener("click", function (event) {
    const btn = event.target.closest(".filter-btn");
    if (!btn) return;

    filterBar.querySelectorAll(".filter-btn").forEach(function (item) {
      item.classList.remove("active");
    });
    btn.classList.add("active");

    const filter = btn.getAttribute("data-filter");
    productCards.forEach(function (card) {
      const category = card.getAttribute("data-category");
      if (filter === "all" || category === filter) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  });

  // Category cards jump + filter
  document.querySelectorAll(".category-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const filter = card.getAttribute("data-filter");
      const targetBtn = filterBar.querySelector('[data-filter="' + filter + '"]');
      if (targetBtn) targetBtn.click();
    });
  });

  // Enquire / pack prefill
  function prefillEnquiry(text) {
    if (messageField) {
      messageField.value = text;
    }
    if (interestSelect) {
      interestSelect.value = "custom";
    }
  }

  document.querySelectorAll(".enquire-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const product = btn.getAttribute("data-product");
      prefillEnquiry("I would like to enquire about: " + product);
      document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelectorAll(".pack-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const pack = btn.getAttribute("data-pack");
      prefillEnquiry("I am interested in the " + pack + " pack. Please share availability and delivery details.");
      if (pack === "Family Delight") interestSelect.value = "family";
      if (pack === "Grand Diwali") interestSelect.value = "diwali";
      if (pack === "Wedding Special") interestSelect.value = "wedding";
    });
  });

  // Contact form
  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();
    formNote.textContent = "Thank you! Your enquiry has been received. We will contact you shortly.";
    formNote.classList.add("success");
    contactForm.reset();
  });

  // Sticky header subtle shadow
  window.addEventListener("scroll", function () {
    if (window.scrollY > 10) {
      header.style.boxShadow = "0 4px 16px rgba(17, 24, 39, 0.06)";
    } else {
      header.style.boxShadow = "none";
    }
  });
})();
