import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { apiGet } from '@/lib/api';
import type { Category, Product, SubCategory } from '@/lib/types';

type CollectionTile = {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
  badge: string;
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
          apiGet<Category[]>('/categories/'),
          apiGet<SubCategory[]>('/subcategories/'),
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
      .filter((category) => category.show_in_collections)
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
          badge: 'Category',
          sortOrder: Number(category.sort_order) || 0,
        };
      });

    const subcategoryTiles = subcategories
      .filter((subcategory) => subcategory.show_in_collections)
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
          badge: parent ? parent.name : 'Subcategory',
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
              Browse every featured category and subcategory selected from the admin panel.
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
                    className="group relative flex h-[380px] w-full flex-col overflow-hidden rounded-2xl"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105"
                      style={{ backgroundImage: `url(${tile.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/50 to-espresso/20 transition-all duration-500" />
                    <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8">
                      <div className="flex items-start justify-between">
                        <span className="rounded-full bg-cream/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cream backdrop-blur-sm">
                          {tile.badge}
                        </span>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur-sm transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowUpRight className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h2 className="font-serif text-3xl font-bold text-cream md:text-4xl transition-transform duration-300 group-hover:translate-x-2">
                          {tile.name}
                        </h2>
                        <p className="line-clamp-3 text-cream/80">
                          {tile.description || `Browse our ${tile.name.toLowerCase()} range.`}
                        </p>
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
