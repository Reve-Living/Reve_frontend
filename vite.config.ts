import { promises as fs } from "node:fs";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

type ProductSeoRecord = {
  name: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  short_description?: string;
  description?: string;
  price: string | number;
  stock_status?: string;
  in_stock?: boolean;
  primary_image_url?: string;
  images?: { url?: string }[];
};

const SITE_URL = "https://www.reveliving.co.uk";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const plainText = (value = "") =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const productSeoPlugin = (apiBaseUrl: string): Plugin => ({
  name: "product-seo-html",
  apply: "build",
  async closeBundle() {
    const normalizedApiUrl = apiBaseUrl.replace(/\/$/, "");
    let response = await fetch(`${normalizedApiUrl}/products/seo/`, { signal: AbortSignal.timeout(60_000) });
    // Allows the frontend's first deployment to succeed while the backend SEO endpoint is deploying.
    if (response.status === 404) {
      response = await fetch(`${normalizedApiUrl}/products/`, { signal: AbortSignal.timeout(60_000) });
    }
    if (!response.ok) {
      throw new Error(`Unable to load product SEO data (${response.status})`);
    }

    const products = await response.json() as ProductSeoRecord[];
    const template = await fs.readFile(path.resolve(__dirname, "dist/index.html"), "utf8");

    await Promise.all(products.map(async (product) => {
      if (!/^[a-z0-9_-]+$/i.test(product.slug)) return;

      const title = plainText(product.meta_title) || `${plainText(product.name)} | Reve Living`;
      const description = plainText(product.meta_description)
        || plainText(product.short_description)
        || plainText(product.description)
        || "Explore handcrafted furniture and made-to-order pieces from Reve Living.";
      const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;
      const imageUrl = String(product.primary_image_url || product.images?.[0]?.url || "").trim();
      const availability = product.in_stock === false || product.stock_status === "out_of_stock"
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock";
      const schema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: plainText(product.name),
        ...(imageUrl ? { image: [imageUrl] } : {}),
        description,
        url: canonicalUrl,
        brand: { "@type": "Brand", name: "Reve Living" },
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "GBP",
          price: String(product.price),
          availability,
        },
      }).replace(/</g, "\\u003c");

      let html = template
        .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
        .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
        .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, '<meta property="og:type" content="product" />');

      const extraHead = [
        `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
        `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
        imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : "",
        `<meta property="product:price:amount" content="${escapeHtml(String(product.price))}" />`,
        '<meta property="product:price:currency" content="GBP" />',
        `<script id="product-json-ld" type="application/ld+json">${schema}</script>`,
      ].filter(Boolean).join("\n    ");
      html = html.replace("</head>", `    ${extraHead}\n  </head>`);

      const outputDirectory = path.resolve(__dirname, "dist/product");
      await fs.mkdir(outputDirectory, { recursive: true });
      await fs.writeFile(path.join(outputDirectory, `${product.slug}.html`), html, "utf8");
    }));
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    productSeoPlugin(loadEnv(mode, process.cwd(), "").VITE_API_BASE_URL || "https://reve-backend.onrender.com/api"),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
