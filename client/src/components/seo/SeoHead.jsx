import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  PUBLIC_ROUTES,
  SITE_NAME,
  SITE_URL,
} from "../../seo/site";

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null) return;
    el.setAttribute(key, value);
  });
  return el;
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setRobots(content) {
  upsertMeta('meta[name="robots"]', { name: "robots", content });
}

/**
 * Updates document title + meta for the active route.
 * Admin is noindexed; public routes get canonical + index.
 */
export default function SeoHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = PUBLIC_ROUTES.find((row) => row.path === pathname);
    const isAdmin = pathname.startsWith("/admin");
    const title = isAdmin
      ? `Admin | ${SITE_NAME}`
      : route?.title || DEFAULT_TITLE;
    const description = route?.description || DEFAULT_DESCRIPTION;
    const canonicalPath = route?.path || (isAdmin ? "/admin" : "/");
    const canonical = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;
    const ogImage = DEFAULT_OG_IMAGE;

    document.title = title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonical,
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: ogImage,
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: ogImage,
    });

    upsertLink("canonical", canonical);

    if (isAdmin) {
      setRobots("noindex, nofollow");
    } else {
      setRobots("index, follow, max-image-preview:large");
    }
  }, [pathname]);

  return null;
}
