import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EdgeAwareCoverImage from '@/components/EdgeAwareCoverImage';
import type { EdgeAwareImageStyle } from '@/components/EdgeAwareCoverImage';
import { apiGet } from '@/lib/api';
import type { Category, SubCategory } from '@/lib/types';

type CollectionTile = {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
  sortOrder: number;
};

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

const getCollectionImageStyle = (name: string): Partial<EdgeAwareImageStyle> => {
  const normalized = (name || '').toLowerCase();

  if (normalized.includes('console table') || normalized.includes('console tables')) {
    return { objectPosition: '50% 42%', baseScale: 1.18, hoverScale: 1.24 };
  }

  if (
    normalized.includes('table') ||
    normalized.includes('tables') ||
    normalized.includes('coffee') ||
    normalized.includes('dining')
  ) {
    return { objectPosition: '50% 46%', baseScale: 1.12, hoverScale: 1.18 };
  }

  return { baseScale: 1.1, hoverScale: 1.16 };
};

const CollectionsPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const prefetchCollectionRoute = (href: string) => {
    const match = href.match(/^\/category\/([^?]+)(?:\?sub=([^&]+))?/);
    if (!match) return;

    const categorySlug = decodeURIComponent(match[1] || '').trim();
    const subcategorySlug = decodeURIComponent(match[2] || '').trim();
    if (!categorySlug) return;

    if (subcategorySlug) {
      void apiGet(`/products/?subcategory=${encodeURIComponent(subcategorySlug)}&summary=1`).catch(() => []);
      void apiGet(
        `/categories/${encodeURIComponent(categorySlug)}/filters/?subcategory=${encodeURIComponent(subcategorySlug)}`
      ).catch(() => ({ filters: [] }));
      return;
    }

    void apiGet(`/products/?category=${encodeURIComponent(categorySlug)}&summary=1`).catch(() => []);
    void apiGet(`/categories/${encodeURIComponent(categorySlug)}/filters/`).catch(() => ({ filters: [] }));
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [categoriesRes, subcategoriesRes] = await Promise.allSettled([
          apiGet<Category[]>('/categories/'),
          apiGet<SubCategory[]>('/subcategories/'),
        ]);

        const normalizedCategories =
          categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value) ? categoriesRes.value : [];
        const directSubcategories =
          subcategoriesRes.status === 'fulfilled' && Array.isArray(subcategoriesRes.value) ? subcategoriesRes.value : [];
        const nestedSubcategories = normalizedCategories.flatMap((category) => category.subcategories || []);
        const uniqueSubcategories = Array.from(
          new Map(
            [...nestedSubcategories, ...directSubcategories].map((subcategory) => [subcategory.id, subcategory] as const)
          ).values()
        );

        setCategories(normalizedCategories);
        setSubcategories(uniqueSubcategories);
      } catch {
        setCategories([]);
        setSubcategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const tiles = useMemo<CollectionTile[]>(() => {
    const categoryMap = new Map(categories.map((category) => [category.id, category]));

    const categoryTiles = categories
      .filter((category) => category.show_in_all_collections)
      .map((category) => {
        return {
          id: `category-${category.id}`,
          name: category.name,
          description: category.description || '',
          image: resolveImageUrl(category.image),
          href: `/category/${category.slug}`,
          sortOrder: Number(category.sort_order) || 0,
        };
      });

    const subcategoryTiles = subcategories
      .filter((subcategory) => subcategory.show_in_all_collections)
      .map((subcategory) => {
        const parent = categoryMap.get(subcategory.category);

        return {
          id: `subcategory-${subcategory.id}`,
          name: subcategory.name,
          description: subcategory.description || '',
          image: resolveImageUrl(subcategory.image) || resolveImageUrl(parent?.image),
          href: parent ? `/category/${parent.slug}?sub=${subcategory.slug}` : `/categories`,
          sortOrder: Number(subcategory.sort_order) || 0,
        };
      });

    return [...subcategoryTiles, ...categoryTiles]
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      });
  }, [categories, subcategories]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative bg-card py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary"
            >
              Explore Collections
            </motion.span>
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              All Collections
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Browse every category and subcategory available in your catalog.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading collections...</div>
          ) : tiles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {tiles.map((tile, index) => (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                >
                  <Link
                    to={tile.href}
                    onMouseEnter={() => prefetchCollectionRoute(tile.href)}
                    onFocus={() => prefetchCollectionRoute(tile.href)}
                    onPointerDown={() => prefetchCollectionRoute(tile.href)}
                    onTouchStart={() => prefetchCollectionRoute(tile.href)}
                    className="group flex h-full w-full flex-col overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {tile.image ? (
                        <EdgeAwareCoverImage
                          src={tile.image}
                          alt={tile.name}
                          imgClassName="duration-700 ease-out brightness-[1.08] saturate-[1.06]"
                          defaultStyle={getCollectionImageStyle(tile.name)}
                          containerAspectRatio={4 / 3}
                        />
                      ) : (
                        <div className="flex h-full items-end bg-[linear-gradient(135deg,#f2ebe2_0%,#ded2c4_100%)] p-5">
                          <span className="font-serif text-3xl font-semibold text-[#5f4a38]">
                            {tile.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h2 className="min-h-[56px] font-serif text-2xl font-semibold text-foreground transition-colors group-hover:text-primary">
                        {tile.name}
                      </h2>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                          {tile.description || `Browse our ${tile.name.toLowerCase()} range.`}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                        <span className="h-px flex-1 bg-border transition-colors duration-300 group-hover:bg-primary/40" />
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:translate-x-1">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No collections are selected yet.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CollectionsPage;
