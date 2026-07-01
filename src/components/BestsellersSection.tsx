import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { apiGet } from '@/lib/api';
import { Product } from '@/lib/types';

type SectionMode = 'new' | 'bestseller';
type BestsellersSectionProps = {
  mode?: SectionMode;
};

const sectionCopy: Record<
  SectionMode,
  {
    badge: string;
    title: string;
    description: string;
    cta: string;
    href: string;
  }
> = {
  new: {
    badge: 'Just Landed',
    title: 'New Arrivals',
    description: 'Freshly added pieces ready to bring something new into your space',
    cta: 'View All New Arrivals',
    href: '/categories?new=1',
  },
  bestseller: {
    badge: 'Customer Favorites',
    title: 'Bestselling Beds',
    description: 'Our most loved pieces, chosen by thousands of happy customers',
    cta: 'View All Bestsellers',
    href: '/categories?bestseller=1',
  },
};

const sectionPath: Record<SectionMode, string> = {
  new: '/products/?is_new=1&summary=1',
  bestseller: '/products/?bestseller=1&summary=1',
};

const BestsellersSection = ({ mode = 'bestseller' }: BestsellersSectionProps) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Product[]>(sectionPath[mode]);
        setProducts(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch {
        setProducts([]);
      }
    };
    load();
  }, [mode]);

  const copy = sectionCopy[mode];

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="relative bg-card py-14 md:py-20 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-40 bottom-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <div
          className="mb-10 flex flex-col items-center justify-between gap-6 lg:flex-row"
        >
          <div className="text-center lg:text-left">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-widest text-primary">
                {copy.badge}
              </span>
            </div>
            <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              {copy.description}
            </p>
          </div>
          
          <div>
            <Button
              size="lg"
              className="group gradient-bronze text-base font-semibold"
              onClick={() => navigate(copy.href)}
            >
              {copy.cta}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Products Grid with Stagger Animation */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <div key={product.id}>
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>

        {/* Bottom CTA for Mobile */}
        <div
          className="mt-8 flex justify-center lg:hidden"
        >
          <Button
            variant="outline"
            size="lg"
            className="group border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => navigate(copy.href)}
          >
            {copy.cta}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BestsellersSection;
