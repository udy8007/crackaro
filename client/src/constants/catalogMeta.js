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

export const EMPTY_PRODUCT_FORM = {
  name: "",
  category: "sparklers",
  description: "",
  unit: "/ 1 box",
  costPrice: "",
  sellPrice: "",
  stock: "100",
  tag: "80% Off",
  tagClass: "tag-gold",
  mediaClass: "c-gold",
  icon: "fa-wand-magic-sparkles",
  imageUrl: "",
  imageBase64: "",
  imagePreview: "",
  active: true,
};

export function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      reject(new Error("Image must be under 2.5 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}
