import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { apiGet } from '@/lib/api';
import { Product } from '@/lib/types';

const BestsellersSection = () => {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Product[]>('/products/?bestseller=1');
        setBestsellers(data.slice(0, 4));
      } catch {
        setBestsellers([]);
      }
    };
    load();
  }, []);

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
                Customer Favorites
              </span>
            </div>
            <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              Bestselling Beds
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Our most loved pieces, chosen by thousands of happy customers
            </p>
          </div>
          
          <div>
            <Button 
              asChild 
              size="lg"
              className="group gradient-bronze text-base font-semibold"
            >
              <Link to="/category/divan-beds">
                View All Bestsellers
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Products Grid with Stagger Animation */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers.map((product, index) => (
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
            asChild 
            variant="outline"
            size="lg"
            className="group border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Link to="/category/divan-beds">
              View All Bestsellers
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BestsellersSection;
