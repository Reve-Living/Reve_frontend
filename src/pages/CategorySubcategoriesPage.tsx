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

const CategorySubcategoriesPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const load = async () => {
      setIsLoading(true);
      setLoadError(false);

      if (!slug) {
        setCategory(null);
        setSubcategories([]);
        setProducts([]);
        setIsLoading(false);
        setLoadError(true);
        return;
      }

      try {
        const initialProductsPromise = apiGet<Product[] | { results?: Product[] }>(`/products/?category=${slug}`);

        const categoryMatches = await apiGet<Category[]>(`/categories/?slug=${slug}`).catch(() => []);
        let categoryItem = categoryMatches?.[0] || null;

        if (!categoryItem) {
          const allCategories = await apiGet<Category[]>('/categories/').catch(() => []);
          categoryItem =
            allCategories.find((entry) => entry.slug === slug || entry.name?.trim().toLowerCase() === slug.replace(/-/g, ' ')) ||
            null;
        }

        if (!categoryItem) {
          setCategory(null);
          setSubcategories([]);
          setProducts([]);
          setLoadError(true);
          setIsLoading(false);
          return;
        }

        setCategory(categoryItem);

        const resolvedSlug = categoryItem.slug || slug;
        const needsSlugRetry = resolvedSlug !== slug;

        const [subcategoriesRes, productsRes] = await Promise.allSettled([
          apiGet<SubCategory[]>(`/subcategories/?category=${categoryItem.id}`),
          needsSlugRetry
            ? apiGet<Product[] | { results?: Product[] }>(`/products/?category=${resolvedSlug}`)
            : initialProductsPromise,
        ]);

        if (subcategoriesRes.status === 'fulfilled' && Array.isArray(subcategoriesRes.value)) {
          setSubcategories(subcategoriesRes.value);
        } else {
          setSubcategories([]);
        }

        const normalizedProducts =
          productsRes.status === 'fulfilled'
            ? Array.isArray(productsRes.value)
              ? productsRes.value
              : Array.isArray(productsRes.value?.results)
              ? productsRes.value.results
              : []
            : [];

        setProducts(normalizedProducts);
      } catch {
        setCategory(null);
        setSubcategories([]);
        setProducts([]);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
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
                      {card.productCount} products
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
