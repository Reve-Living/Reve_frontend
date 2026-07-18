import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import type { Category, Product, SubCategory } from '@/lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const SUBCATEGORY_PAGE_CACHE_MS = 10 * 60 * 1000;
const SUBCATEGORY_PAGE_CACHE_PREFIX = 'reve-subcategory-page:v2:';
const SUBCATEGORY_PRODUCTS_LIMIT = 120;

const resolveImageUrl = (value?: string): string => {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) {
    const base = SUPABASE_URL || API_BASE_URL;
    try {
      return base ? new URL(raw, base).toString() : raw;
    } catch {
      return raw;
    }
  }
  return raw;
};

type SubcategoryCard = {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
};

type SubcategoryPageSnapshot = {
  ts: number;
  category: Category;
  subcategories: SubCategory[];
  products: Product[];
};

const normalizeProductsResponse = (response: Product[] | { results?: Product[] }): Product[] =>
  Array.isArray(response) ? response : Array.isArray(response?.results) ? response.results : [];

const buildCategoryProductsPath = (categorySlug: string) => {
  const params = new URLSearchParams({
    category: categorySlug,
    summary: '1',
    limit: String(SUBCATEGORY_PRODUCTS_LIMIT),
  });
  return `/products/?${params.toString()}`;
};

const readPageSnapshot = (slug?: string): SubcategoryPageSnapshot | null => {
  if (typeof window === 'undefined' || !slug) return null;
  try {
    const raw = window.sessionStorage.getItem(`${SUBCATEGORY_PAGE_CACHE_PREFIX}${slug}`);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as SubcategoryPageSnapshot;
    if (!snapshot?.category || !Array.isArray(snapshot.subcategories) || !Array.isArray(snapshot.products)) return null;
    if (Date.now() - snapshot.ts > SUBCATEGORY_PAGE_CACHE_MS) {
      window.sessionStorage.removeItem(`${SUBCATEGORY_PAGE_CACHE_PREFIX}${slug}`);
      return null;
    }
    return snapshot;
  } catch {
    return null;
  }
};

const writePageSnapshot = (
  slug: string | undefined,
  snapshot: Omit<SubcategoryPageSnapshot, 'ts'>
) => {
  if (typeof window === 'undefined' || !slug) return;
  try {
    window.sessionStorage.setItem(
      `${SUBCATEGORY_PAGE_CACHE_PREFIX}${slug}`,
      JSON.stringify({ ...snapshot, ts: Date.now() })
    );
  } catch {
    // Ignore storage limits; the live API load still works.
  }
};

const CategorySubcategoriesPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSnapshot = useMemo(() => readPageSnapshot(slug), [slug]);
  const [category, setCategory] = useState<Category | null>(initialSnapshot?.category ?? null);
  const [subcategories, setSubcategories] = useState<SubCategory[]>(initialSnapshot?.subcategories ?? []);
  const [products, setProducts] = useState<Product[]>(initialSnapshot?.products ?? []);
  const [isLoading, setIsLoading] = useState(!initialSnapshot);
  const [loadError, setLoadError] = useState(false);
  const selectedSubSlugs = useMemo(
    () =>
      (searchParams.get('subs') || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    [searchParams]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const cachedSnapshot = readPageSnapshot(slug);
      setLoadError(false);

      if (!slug) {
        setCategory(null);
        setSubcategories([]);
        setProducts([]);
        setIsLoading(false);
        setLoadError(true);
        return;
      }

      if (cachedSnapshot) {
        setCategory(cachedSnapshot.category);
        setSubcategories(cachedSnapshot.subcategories);
        setProducts(cachedSnapshot.products);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      const apiOptions = {
        staleWhileRevalidate: true,
        maxStaleMs: SUBCATEGORY_PAGE_CACHE_MS,
      };

      try {
        const initialProductsPromise = apiGet<Product[] | { results?: Product[] }>(
          buildCategoryProductsPath(slug),
          apiOptions
        );

        const categoryMatches = await apiGet<Category[]>(`/categories/?slug=${slug}`, apiOptions).catch(() => []);
        let categoryItem = categoryMatches?.[0] || null;

        if (!categoryItem) {
          const allCategories = await apiGet<Category[]>('/categories/', apiOptions).catch(() => []);
          categoryItem =
            allCategories.find((entry) => entry.slug === slug || entry.name?.trim().toLowerCase() === slug.replace(/-/g, ' ')) ||
            null;
        }

        if (cancelled) return;

        if (!categoryItem) {
          setCategory(null);
          setSubcategories([]);
          setProducts([]);
          setLoadError(true);
          setIsLoading(false);
          return;
        }

        const nextSubcategories = Array.isArray(categoryItem.subcategories) ? categoryItem.subcategories : [];
        setCategory(categoryItem);
        setSubcategories(nextSubcategories);
        setIsLoading(false);
        writePageSnapshot(slug, {
          category: categoryItem,
          subcategories: nextSubcategories,
          products: cachedSnapshot?.products ?? [],
        });

        try {
          const resolvedSlug = categoryItem.slug || slug;
          const needsSlugRetry = resolvedSlug !== slug;

          const productsRes = await (needsSlugRetry
            ? apiGet<Product[] | { results?: Product[] }>(buildCategoryProductsPath(resolvedSlug), apiOptions)
            : initialProductsPromise);

          if (cancelled) return;

          const normalizedProducts = normalizeProductsResponse(productsRes);

          setProducts(normalizedProducts);
          writePageSnapshot(slug, {
            category: categoryItem,
            subcategories: nextSubcategories,
            products: normalizedProducts,
          });
        } catch {
          // Product counts and fallback images are only enrichment; keep the category cards visible.
        }
      } catch {
        if (cancelled) return;
        if (!cachedSnapshot) {
          setCategory(null);
          setSubcategories([]);
          setProducts([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const cards = useMemo<SubcategoryCard[]>(() => {
    const allowedSubSlugs = new Set(selectedSubSlugs);
    return subcategories
      .filter((sub) => allowedSubSlugs.size === 0 || allowedSubSlugs.has(sub.slug))
      .map((sub) => {
        const subProducts = products.filter((product) => product.subcategory_slug === sub.slug);
        const fallbackImage =
          resolveImageUrl(sub.image) ||
          resolveImageUrl(subProducts[0]?.images?.[0]?.url) ||
          resolveImageUrl(category?.image) ||
          '';

        return {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description || '',
          image: fallbackImage,
          productCount: subProducts.length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [category?.image, products, selectedSubSlugs, subcategories]);

  const seoTitle = category?.meta_title || (category?.name ? `${category.name} Collections | Reve Living` : 'Reve Living');
  const seoDescription =
    category?.meta_description ||
    category?.description ||
    'Browse category collections and choose the perfect subcategory for your space.';

  useEffect(() => {
    document.title = seoTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', seoDescription);
  }, [seoDescription, seoTitle]);

  useEffect(() => {
    if (isLoading || !category) return;
    if (subcategories.length === 0) {
      navigate(`/category/${category.slug}`, { replace: true });
    }
  }, [category, isLoading, navigate, subcategories.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center text-muted-foreground">Loading collections...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!category || loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">Category Not Found</h1>
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border/50 bg-card/60">
        <div className="w-full px-4 py-8 md:px-8 md:py-10 lg:px-12">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{category.name}</span>
          </nav>

          <div className="max-w-3xl space-y-4">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-primary">
              Shop by Category
            </span>
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              Explore {category.name}
            </h1>
            <p className="text-base leading-7 text-muted-foreground md:text-lg">
              {category.description || `Choose a ${category.name.toLowerCase()} style to see the products inside that range.`}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gradient-bronze">
                <Link to={`/category/${category.slug}`}>View All {category.name}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-12 md:px-8 lg:px-12">
        {cards.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <Link
                  to={`/category/${category.slug}?sub=${card.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_20px_50px_-30px_rgba(74,58,46,0.35)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {card.image ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${card.image})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--cream))] to-[hsl(var(--ivory))]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 rounded-full bg-background/85 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-foreground backdrop-blur-sm">
                      {card.productCount > 0 ? `${card.productCount} products` : 'View products'}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="space-y-2">
                      <h2 className="font-serif text-2xl font-semibold text-foreground transition-colors group-hover:text-primary">
                        {card.name}
                      </h2>
                      <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {card.description || `Browse our ${card.name.toLowerCase()} range.`}
                      </p>
                    </div>

                    <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Shop {card.name}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : null}
      </section>

      <Footer />
    </div>
  );
};

export default CategorySubcategoriesPage;
