import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { Product, Category } from '@/lib/types';

interface TileData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link: string;
  slug: string;
}

// Visual fallback tiles to avoid blank section
const initialTiles: TileData[] = [
  {
    id: 1,
    title: 'Enhance Your Bedroom',
    subtitle: 'with Our Collection',
    description: 'Create a sanctuary of comfort and style',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=400&fit=crop',
    link: '/category/beds',
    slug: 'beds',
  },
  {
    id: 2,
    title: 'Style Your',
    subtitle: 'Living Space',
    description: 'Sofas that blend comfort with elegance',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
    link: '/category/sofas',
    slug: 'sofas',
  },
  {
    id: 3,
    title: 'Sleep Better',
    subtitle: 'Every Night',
    description: 'Premium mattresses for restful sleep',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
    link: '/category/mattresses',
    slug: 'mattresses',
  },
];

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

const LifestyleSection = () => {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const categories = await apiGet<Category[]>('/categories/');
        const topCategories = categories.slice(0, 3);

        const tilesFromCategories = await Promise.all(
          topCategories.map(async (category, index) => {
            let image = resolveImageUrl(category.image);
            if (!image) {
              try {
                const products = await apiGet<Product[]>(`/products/?category=${category.slug}`);
                image = resolveImageUrl(products?.[0]?.images?.[0]?.url) || '';
              } catch (err) {
                console.error(`Error fetching products for category ${category.slug}:`, err);
              }
            }

            const description = (category.description || '').trim();
            return {
              id: category.id ?? index,
              title: category.name,
              subtitle: 'Curated picks from the admin',
              description: description || `Explore our latest ${category.name} releases.`,
              image,
              link: `/category/${category.slug}`,
              slug: category.slug,
            };
          })
        );

        const validTiles = tilesFromCategories.filter((tile) => tile.image || tile.description);
        if (validTiles.length === 0) {
          setLoadError('No lifestyle tiles available yet; showing defaults.');
          setTiles(initialTiles);
        } else {
          setTiles(validTiles);
        }
      } catch (err) {
        console.error('Error fetching lifestyle data:', err);
        setLoadError('Unable to load lifestyle content; showing defaults.');
        setTiles(initialTiles);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, []);

  const hasTiles = tiles.length > 0;
  const placeholderCards = useMemo(() => Array.from({ length: 3 }, (_, idx) => idx), []);

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

        {/* Lifestyle Grid - Equal Compact Tiles */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {hasTiles &&
            tiles.map((tile) => (
              <div
                key={tile.id}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="aspect-[4/3]">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <h3 className="font-serif text-xl font-bold text-cream md:text-2xl">
                    {tile.title}
                  </h3>
                  <p className="font-serif text-lg text-cream/90">
                    {tile.subtitle}
                  </p>
                  <p className="mt-1 text-sm text-cream/70">
                    {tile.description}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-4 gradient-bronze font-medium"
                  >
                    <Link to={tile.link}>
                      Discover More
                    </Link>
                  </Button>
                </div>
              </div>
            ))}

          {isLoading &&
            placeholderCards.map((card) => (
              <div
                key={`placeholder-${card}`}
                className="relative overflow-hidden rounded-2xl border border-muted/40 bg-muted/40"
              >
                <div className="aspect-[4/3] animate-pulse bg-muted/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 space-y-2 p-5">
                  <div className="h-4 w-32 rounded bg-white/50" />
                  <div className="h-3 w-48 rounded bg-white/30" />
                  <div className="h-3 w-28 rounded bg-white/20" />
                </div>
              </div>
            ))}
        </div>

        {!isLoading && !hasTiles && (
          <div className="mt-8 rounded-xl border border-muted/40 bg-card p-6 text-center text-muted-foreground">
            <p>{loadError || 'No lifestyle content is available yet. Add categories with images in the admin to populate this section.'}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Button asChild variant="outline" className="border-accent">
                <Link to="/categories">Browse categories</Link>
              </Button>
              <Button asChild className="gradient-bronze">
                <Link to="/collections">View collections</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LifestyleSection;
