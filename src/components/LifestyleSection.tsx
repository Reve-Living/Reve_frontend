import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const lifestyleTiles = [
  {
    id: 1,
    title: 'Enhance Your Bedroom',
    subtitle: 'with Our Collection',
    description: 'Create a sanctuary of comfort and style',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&h=600&fit=crop',
    link: '/category/beds',
    size: 'large',
  },
  {
    id: 2,
    title: 'Style Your',
    subtitle: 'Living Space',
    description: 'Sofas that blend comfort with elegance',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
    link: '/category/sofas',
    size: 'medium',
  },
  {
    id: 3,
    title: 'Sleep Better',
    subtitle: 'Every Night',
    description: 'Premium mattresses for restful sleep',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
    link: '/category/mattresses',
    size: 'medium',
  },
];

const LifestyleSection = () => {
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
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Large Tile */}
          <Link
            to={lifestyleTiles[0].link}
            className="group relative overflow-hidden rounded-2xl md:col-span-2 lg:col-span-1 lg:row-span-2"
          >
            <div className="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[500px]">
              <img
                src={lifestyleTiles[0].image}
                alt={lifestyleTiles[0].title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <h3 className="font-serif text-2xl font-bold text-cream md:text-3xl">
                {lifestyleTiles[0].title}
              </h3>
              <p className="font-serif text-xl text-cream/90 md:text-2xl">
                {lifestyleTiles[0].subtitle}
              </p>
              <p className="mt-2 text-sm text-cream/70">
                {lifestyleTiles[0].description}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-primary transition-all group-hover:gap-3">
                <span className="font-medium">Explore Collection</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* Medium Tiles */}
          {lifestyleTiles.slice(1).map((tile) => (
            <Link
              key={tile.id}
              to={tile.link}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div className="aspect-[4/3]">
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/30 to-transparent" />
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
                <div className="mt-3 inline-flex items-center gap-2 text-primary transition-all group-hover:gap-3">
                  <span className="text-sm font-medium">Shop Now</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LifestyleSection;
