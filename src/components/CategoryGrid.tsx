import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the 4 featured categories
const featuredCategories = [
  {
    id: '1',
    name: 'Divan Beds',
    slug: 'divan-beds',
    description: 'Premium divan beds with built-in drawer storage and luxury headboard options.',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop',
  },
  {
    id: '2',
    name: 'Ottoman Beds',
    slug: 'ottoman-beds',
    description: 'Elegant ottoman beds with lift-up storage for maximum space utilisation.',
    image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&h=600&fit=crop',
  },
  {
    id: '3',
    name: 'Upholstered Beds',
    slug: 'upholstered-beds',
    description: 'Luxurious upholstered beds featuring premium fabrics and sophisticated designs.',
    image: 'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=800&h=600&fit=crop',
  },
  {
    id: '4',
    name: 'Mattresses',
    slug: 'mattresses',
    description: 'Handcrafted mattresses for the ultimate night\'s sleep.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    }
  },
};

const CategoryGrid = () => {
  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex flex-col items-center justify-between gap-6 lg:flex-row"
        >
          <div className="text-center lg:text-left">
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary"
            >
              Explore Our Range
            </motion.span>
            <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              Shop by Category
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Discover our handcrafted collections, designed for comfort and built to last
            </p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              asChild 
              size="lg"
              className="group gradient-bronze text-base font-semibold"
            >
              <Link to="/categories">
                View All Categories
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Category Grid - 4 items */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[240px] md:auto-rows-[260px]"
        >
          {featuredCategories.map((category) => (
            <motion.div 
              key={category.id} 
              variants={itemVariants}
            >
              <Link
                to={`/category/${category.slug}`}
                className="group relative flex h-full w-full overflow-hidden rounded-2xl"
              >
                {/* Image with Parallax Effect */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url(${category.image})` }}
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
                    <motion.div 
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur-sm transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                      whileHover={{ rotate: 45 }}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </motion.div>
                  </div>
                  
                  {/* Bottom - Category Info */}
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-semibold text-cream md:text-2xl transition-transform duration-300 group-hover:translate-x-2">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-cream/70 line-clamp-1 max-w-[180px]">
                        {category.description}
                      </p>
                      <span className="h-px flex-1 bg-cream/20 transition-all duration-500 group-hover:bg-primary/50" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CategoryGrid;
