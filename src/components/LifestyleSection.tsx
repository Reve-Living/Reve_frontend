import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { Category, Product } from '@/lib/types';

interface TileData {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
}

const LifestyleSection = () => {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const resolveImageUrl = useMemo(
    () => (value?: string) => {
      const raw = (value || '').trim();
      if (!raw) return '';
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) {
        return raw;
      }
      if (raw.startsWith('//')) return `https:${raw}`;
      const base = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_API_BASE_URL || '';
      if (raw.startsWith('/')) {
        try {
          return base ? new URL(raw, base).toString() : '';
        } catch {
          return '';
        }
      }
      return '';
    },
    []
  );

  useEffect(() => {
    const fetchTiles = async () => {
      setIsLoading(true);
      try {
        const categories = await apiGet<Category[]>('/categories/', { noStore: true });
        const topCategories = categories.slice(0, 3);

        const tilesFromCategories = await Promise.all(
          topCategories.map(async (category, index) => {
            let image = resolveImageUrl(category.image);
            if (!image) {
              try {
                const products = await apiGet<Product[]>(`/products/?category=${category.slug}`);
                image = resolveImageUrl(products?.[0]?.images?.[0]?.url);
              } catch {
                image = '';
              }
            }

            if (!image) return null;

            return {
              id: category.id ?? index,
              title: category.name,
              description: (category.description || `Explore our latest ${category.name} releases.`).trim(),
              image,
              link: `/category/${category.slug}`,
            };
          })
        );

        const validTiles = tilesFromCategories.filter((tile): tile is TileData => Boolean(tile));
        setTiles(validTiles);
      } catch {
        setTiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTiles();
  }, [resolveImageUrl]);

  const hasTiles = tiles.length > 0;

  if (!isLoading && !hasTiles) {
    // No real data: hide the section entirely (no placeholders).
    return null;
  }

  return (
    <section className="py-14 md:py-20 bg-[#FAF8F5]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Inspiration
          </span>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
            Transform Your Home
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Discover how our handcrafted furniture can elevate every room in your home
          </p>
        </div>

        {/* Lifestyle Grid */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(hasTiles ? tiles : Array.from({ length: 3 })).map((tile, idx) => (
            <div
              key={tile?.id ?? `placeholder-${idx}`}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div className="aspect-[4/3]">
                <img
                  src={tile?.image || ''}
                  alt={tile?.title || 'Category'}
                  className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isLoading ? 'blur-sm animate-pulse bg-muted' : ''}`}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/40 to-transparent" />

              <div className="absolute left-4 top-4 h-8 w-8">
                <div className="absolute left-0 top-0 h-full w-px bg-cream/30 transition-all duration-500 group-hover:h-10 group-hover:bg-primary" />
                <div className="absolute left-0 top-0 h-px w-full bg-cream/30 transition-all duration-500 group-hover:w-10 group-hover:bg-primary" />
              </div>
              <div className="absolute bottom-4 right-4 h-8 w-8">
                <div className="absolute bottom-0 right-0 h-full w-px bg-cream/30 transition-all duration-500 group-hover:h-10 group-hover:bg-primary" />
                <div className="absolute bottom-0 right-0 h-px w-full bg-cream/30 transition-all duration-500 group-hover:w-10 group-hover:bg-primary" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream backdrop-blur-sm">
                    Category
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 text-cream backdrop-blur-sm transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="mt-3 font-serif text-2xl font-semibold text-cream md:text-3xl">
                  {tile?.title || ''}
                </h3>
                <p className="text-sm text-cream/75">
                  {tile?.description || ''}
                </p>

                <Button
                  asChild
                  size="sm"
                  className="mt-4 gradient-bronze font-medium"
                >
                  <Link to={tile?.link || '#'}>Discover More</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LifestyleSection;
