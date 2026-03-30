import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { Category, SubCategory, Product } from '@/lib/types';
import EdgeAwareCoverImage from '@/components/EdgeAwareCoverImage';
import type { EdgeAwareImageStyle } from '@/components/EdgeAwareCoverImage';

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

const CategoryGrid = () => {
  const navigate = useNavigate();
  type GridItem = {
    id: number;
    name: string;
    slug: string;
    description: string;
    image: string;
    isSubcategory?: boolean;
    parentSlug?: string;
  };
  const [categories, setCategories] = useState<GridItem[]>([]);

  const resolveImageUrl = useMemo(
    () => (value?: string) => {
      const raw = (value || '').trim();
      if (!raw) return '';
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
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
    const load = async () => {
      try {
        const [categoryData, subcategoryData] = await Promise.all([
          apiGet<Category[]>('/categories/', { noStore: true }),
          apiGet<SubCategory[]>('/subcategories/', { noStore: true }),
        ]);

        const selectedCategories = categoryData.filter((category) => category.show_in_collections);
        const selectedSubcategories = subcategoryData.filter((subcategory) => subcategory.show_in_collections);

        const categoryMap = new Map(categoryData.map((category) => [category.id, category]));

        const buildCard = async (
          item: Category | SubCategory,
          parentSlug?: string,
          index = 0,
          isSubcategory = false
        ): Promise<GridItem | null> => {
          let image = resolveImageUrl((item as Category).image || (item as SubCategory).image);

          if (!image) {
            try {
              const endpoint = isSubcategory
                ? `/products/?subcategory=${item.slug}`
                : `/products/?category=${item.slug}`;
              const products = await apiGet<Product[]>(endpoint);
              image = resolveImageUrl(products?.[0]?.images?.[0]?.url);
            } catch {
              image = '';
            }
          }

          if (!image) return null;

          return {
            id: item.id ?? index,
            name: item.name,
            slug: item.slug,
            description: (item as Category).description || (item as SubCategory).description || '',
            image,
            isSubcategory,
            parentSlug,
          };
        };

        const selectedSubcategoryCards = await Promise.all(
          selectedSubcategories.map((sub, idx) =>
            buildCard(sub, categoryMap.get(sub.category)?.slug, idx, true)
          )
        );

        const selectedCategoryCards = await Promise.all(
          selectedCategories.map((category, idx) => buildCard(category, undefined, idx))
        );

        const valid = [...selectedSubcategoryCards, ...selectedCategoryCards].filter(
          (c): c is GridItem => Boolean(c)
        );
        setCategories(valid.slice(0, 4));
      } catch {
        setCategories([]);
      }
    };
    load();
  }, []);

  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="text-center lg:text-left">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
              Explore Our Range
            </span>
            <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              Shop by Collections
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Discover our handcrafted ranges, designed for comfort and built to last
            </p>
          </div>
          
          <div>
            <Button
              size="lg"
              className="group gradient-bronze text-base font-semibold"
              onClick={() => navigate('/collections')}
            >
              View All Collections
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Category Grid - 4 items */}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
            <div key={`${category.isSubcategory ? 'sub' : 'cat'}-${category.slug || category.id}`}>
              <Link
                to={
                  category.isSubcategory && category.parentSlug
                    ? `/category/${category.parentSlug}?sub=${category.slug}`
                    : `/category/${category.slug || 'divan-beds'}`
                }
                className="group flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <EdgeAwareCoverImage
                    src={resolveImageUrl(category.image)}
                    alt={category.name}
                    imgClassName="duration-700 ease-out brightness-[1.08] saturate-[1.06]"
                    defaultStyle={getCollectionImageStyle(category.name)}
                    containerAspectRatio={4 / 3}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="min-h-[48px] font-serif text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                    {category.name}
                  </h3>

                  {category.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <span className="h-px flex-1 bg-border transition-colors duration-300 group-hover:bg-primary/40" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryGrid;
