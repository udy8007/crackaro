export const PRODUCT_CATEGORIES = [
  { id: "sparklers", label: "Sparklers", icon: "fa-wand-magic-sparkles", mediaClass: "c-gold" },
  { id: "ground", label: "Ground", icon: "fa-circle-notch", mediaClass: "c-orange" },
  { id: "fancy", label: "Sky Shots", icon: "fa-meteor", mediaClass: "c-blue" },
  { id: "rockets", label: "Rockets", icon: "fa-rocket", mediaClass: "c-blue" },
  { id: "fountain", label: "Fountains", icon: "fa-seedling", mediaClass: "c-green" },
  { id: "bombs", label: "Bombs", icon: "fa-bomb", mediaClass: "c-orange" },
  { id: "lakshmi", label: "Sound", icon: "fa-bolt", mediaClass: "c-orange" },
  { id: "kids", label: "Kids", icon: "fa-child", mediaClass: "c-gold" },
  { id: "wala", label: "Wala", icon: "fa-link", mediaClass: "c-orange" },
];

export const MEDIA_CLASSES = [
  "c-gold",
  "c-orange",
  "c-blue",
  "c-green",
  "c-red",
  "c-purple",
];

export const TAG_CLASSES = [
  "tag-gold",
  "tag-orange",
  "tag-blue",
  "tag-green",
  "tag-red",
];

export const PRODUCT_ICONS = [
  "fa-bag-shopping",
  "fa-wand-magic-sparkles",
  "fa-rocket",
  "fa-meteor",
  "fa-bomb",
  "fa-bolt",
  "fa-seedling",
  "fa-fire",
  "fa-star",
  "fa-gift",
];

export function slugifyProductId(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
