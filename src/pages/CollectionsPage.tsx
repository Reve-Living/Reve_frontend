import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EdgeAwareCoverImage from '@/components/EdgeAwareCoverImage';
import type { EdgeAwareImageStyle } from '@/components/EdgeAwareCoverImage';
import { apiGet } from '@/lib/api';
import type { Category, Product, SubCategory } from '@/lib/types';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [categoriesRes, subcategoriesRes, productsRes] = await Promise.all([
          apiGet<Category[]>('/categories/', { noStore: true }),
          apiGet<SubCategory[]>('/subcategories/', { noStore: true }),
          apiGet<Product[]>('/products/'),
        ]);

        setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
        setSubcategories(Array.isArray(subcategoriesRes) ? subcategoriesRes : []);
        setProducts(Array.isArray(productsRes) ? productsRes : []);
      } catch {
        setCategories([]);
        setSubcategories([]);
        setProducts([]);
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
        const categoryProducts = products.filter((product) => product.category_slug === category.slug);
        const image =
          resolveImageUrl(category.image) ||
          resolveImageUrl(categoryProducts[0]?.images?.[0]?.url) ||
          '';

        return {
          id: `category-${category.id}`,
          name: category.name,
          description: category.description || '',
          image,
          href: `/category/${category.slug}`,
          sortOrder: Number(category.sort_order) || 0,
        };
      });

    const subcategoryTiles = subcategories
      .filter((subcategory) => subcategory.show_in_all_collections)
      .map((subcategory) => {
        const parent = categoryMap.get(subcategory.category);
        const subcategoryProducts = products.filter((product) => product.subcategory_slug === subcategory.slug);
        const image =
          resolveImageUrl(subcategory.image) ||
          resolveImageUrl(subcategoryProducts[0]?.images?.[0]?.url) ||
          resolveImageUrl(parent?.image) ||
          '';

        return {
          id: `subcategory-${subcategory.id}`,
          name: subcategory.name,
          description: subcategory.description || '',
          image,
          href: parent ? `/category/${parent.slug}?sub=${subcategory.slug}` : `/categories`,
          sortOrder: Number(subcategory.sort_order) || 0,
        };
      });

    return [...subcategoryTiles, ...categoryTiles]
      .filter((tile) => tile.image)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      });
  }, [categories, products, subcategories]);

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
                    className="group flex h-full w-full flex-col overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <EdgeAwareCoverImage
                        src={tile.image}
                        alt={tile.name}
                        imgClassName="duration-700 ease-out brightness-[1.08] saturate-[1.06]"
                        defaultStyle={getCollectionImageStyle(tile.name)}
                        containerAspectRatio={4 / 3}
                      />
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
