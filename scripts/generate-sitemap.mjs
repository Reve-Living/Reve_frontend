// Regenerates public/sitemap.xml from live catalog data (categories, subcategories,
// products, lifestyle articles) plus the site's static pages.
//
// Run manually with `npm run generate:sitemap`, or automatically before every
// build (see the "prebuild" script in package.json).

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SITE_URL = "https://www.reveliving.co.uk";
const API_BASE_URL = process.env.VITE_API_BASE_URL || "https://reve-backend.onrender.com/api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "..", "public", "sitemap.xml");

const STATIC_URLS = [
  { loc: "/", priority: "1.0" },
  { loc: "/about", priority: "0.8" },
  { loc: "/contact", priority: "0.8" },
  { loc: "/categories", priority: "0.8" },
  { loc: "/collections", priority: "0.8" },
  { loc: "/divan-beds", priority: "0.8" },
  { loc: "/delivery", priority: "0.6" },
  { loc: "/returns-refunds", priority: "0.6" },
  { loc: "/faq", priority: "0.6" },
  { loc: "/terms-conditions", priority: "0.4" },
  { loc: "/privacy-policy", priority: "0.4" },
];

async function fetchJson(pathname) {
  const url = `${API_BASE_URL}${pathname}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function xmlEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc, priority) {
  return `  <url>\n    <loc>${xmlEscape(`${SITE_URL}${loc}`)}</loc>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const urls = [...STATIC_URLS];

  const categories = await fetchJson("/categories/");
  for (const category of categories) {
    if (category.is_hidden) continue;
    urls.push({ loc: `/category/${category.slug}`, priority: "0.8" });

    const visibleSubcategories = (category.subcategories || []).filter((sub) => !sub.is_hidden);
    if (visibleSubcategories.length > 0) {
      urls.push({ loc: `/category/${category.slug}/subcategories`, priority: "0.7" });
    }
    for (const sub of visibleSubcategories) {
      urls.push({ loc: `/category/${category.slug}?sub=${sub.slug}`, priority: "0.7" });
    }
  }

  const productsPayload = await fetchJson("/products/seo/");
  const products = Array.isArray(productsPayload) ? productsPayload : (productsPayload.results || []);
  const seenProductSlugs = new Set();
  for (const product of products) {
    if (product.is_hidden) continue;
    const canonicalSlug = (product.canonical_slug || product.slug || "").trim();
    if (!canonicalSlug || seenProductSlugs.has(canonicalSlug)) continue;
    seenProductSlugs.add(canonicalSlug);
    urls.push({ loc: `/product/${canonicalSlug}`, priority: "0.6" });
  }

  const articles = await fetchJson("/lifestyle-articles/?active_only=true");
  for (const article of articles) {
    if (article.is_active === false) continue;
    urls.push({ loc: `/transform-your-home/${article.slug}`, priority: "0.5" });
  }

  const body = urls.map((u) => urlEntry(u.loc, u.priority)).join("\n\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset\n      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${body}\n\n</urlset>\n`;

  await writeFile(OUTPUT_PATH, xml, "utf8");
  console.log(`Wrote ${urls.length} URLs to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
