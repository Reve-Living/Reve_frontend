import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { Collection } from '@/lib/types';

const CategoryGrid = () => {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Collection[]>('/collections/');
        setCollections(data.slice(0, 4));
      } catch {
        setCollections([]);
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
              Shop by Collection
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Discover our handcrafted collections, designed for comfort and built to last
            </p>
          </div>
          
          <div>
            <Button 
              asChild 
              size="lg"
              className="group gradient-bronze text-base font-semibold"
            >
              <Link to="/collections">
                View All Collections
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Category Grid - 4 items */}
        <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[240px] md:auto-rows-[260px]">
          {collections.map((collection) => (
            <div 
              key={collection.id}
            >
              <Link
                to={`/category/${collection.slug || 'divan-beds'}`}
                className="group relative flex h-full w-full overflow-hidden rounded-2xl"
              >
                {/* Image with Parallax Effect */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url(${collection.image})` }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/40 to-espresso/10 transition-all duration-500 group-hover:from-espresso/95" />
                
                {/* Decorative Corner Lines */}
                <div className="absolute left-4 top-4 h-8 w-8">
                  <div className="absolute left-0 top-0 h-full w-px bg-cream/30 transition-all duration-500 group-hover:h-10 group-hover:bg-primary" />
                  <div className="absolute left-0 top-0 h-px w-full bg-cream/30 transition-all duration-500 group-hover:w-10 group-hover:bg-primary" />
                </div>
                <div className="absolute bottom-4 right-4 h-8 w-8">
                  <div className="absolute bottom-0 right-0 h-full w-px bg-cream/30 transition-all duration-500 group-hover:h-10 group-hover:bg-primary" />
                  <div className="absolute bottom-0 right-0 h-px w-full bg-cream/30 transition-all duration-500 group-hover:w-10 group-hover:bg-primary" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 flex h-full w-full flex-col justify-between p-5">
                  {/* Top - Category Badge */}
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-cream/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-cream backdrop-blur-sm">
                      Collection
                    </span>
                    <div 
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur-sm transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                  
                  {/* Bottom - Category Info */}
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-semibold text-cream md:text-2xl transition-transform duration-300 group-hover:translate-x-2">
                      {collection.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-cream/70 line-clamp-1 max-w-[180px]">
                        {collection.description}
                      </p>
                      <span className="h-px flex-1 bg-cream/20 transition-all duration-500 group-hover:bg-primary/50" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
