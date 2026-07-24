/** Canonical site origin used for SEO (sitemap, OG, JSON-LD). */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://crackaro.in"
).replace(/\/$/, "");

export const SITE_NAME = "Crackaro";

export const DEFAULT_TITLE = "Crackaro | Premium Fireworks & Crackers";

export const DEFAULT_DESCRIPTION =
  "Buy premium Sivakasi fireworks and crackers online from Crackaro. Gift packs for Diwali, weddings, and celebrations — safe, certified, and delivered with care.";

export const DEFAULT_KEYWORDS = [
  "crackers online",
  "Sivakasi crackers",
  "Diwali fireworks",
  "gift packs crackers",
  "Crackaro",
  "buy crackers Tamil Nadu",
  "wedding fireworks",
  "Mayur gift box",
].join(", ");

export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/packs/amazing-gift-pack-prime.png`;

export const ORGANIZATION = {
  name: SITE_NAME,
  legalName: "Crackaro",
  url: SITE_URL,
  email: "orders@crackaro.com",
  description: DEFAULT_DESCRIPTION,
  address: {
    streetAddress: "12, Crackers Market Road",
    addressLocality: "Sivakasi",
    addressRegion: "Tamil Nadu",
    postalCode: "626123",
    addressCountry: "IN",
  },
};

/** Public indexable routes for sitemap + route meta. */
export const PUBLIC_ROUTES = [
  {
    path: "/",
    changefreq: "daily",
    priority: "1.0",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  {
    path: "/cart",
    changefreq: "monthly",
    priority: "0.4",
    title: "Cart | Crackaro",
    description:
      "Review your Crackaro fireworks cart and place a secure order for Diwali and celebration packs.",
  },
  {
    path: "/track",
    changefreq: "monthly",
    priority: "0.5",
    title: "Track Order | Crackaro",
    description:
      "Track your Crackaro crackers order status with your order number and mobile number.",
  },
];
