import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { categories } from '@/data/products';

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
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 flex flex-col items-center text-center"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary"
          >
            Explore Our Range
          </motion.span>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
            Shop by Category
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Discover our handcrafted collections, designed for comfort and built to last
          </p>
        </motion.div>

        {/* Bento-Style Category Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[280px] md:auto-rows-[320px]"
        >
          {categories.map((category, index) => {
            // First item spans 2 columns on larger screens
            const isLarge = index === 0;
            
            return (
              <motion.div 
                key={category.id} 
                variants={itemVariants}
                className={isLarge ? 'md:col-span-2 md:row-span-1' : ''}
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
                  <div className="absolute left-6 top-6 h-12 w-12">
                    <div className="absolute left-0 top-0 h-full w-px bg-cream/30 transition-all duration-500 group-hover:h-16 group-hover:bg-primary" />
                    <div className="absolute left-0 top-0 h-px w-full bg-cream/30 transition-all duration-500 group-hover:w-16 group-hover:bg-primary" />
                  </div>
                  <div className="absolute bottom-6 right-6 h-12 w-12">
                    <div className="absolute bottom-0 right-0 h-full w-px bg-cream/30 transition-all duration-500 group-hover:h-16 group-hover:bg-primary" />
                    <div className="absolute bottom-0 right-0 h-px w-full bg-cream/30 transition-all duration-500 group-hover:w-16 group-hover:bg-primary" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 md:p-8">
                    {/* Top - Category Badge */}
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-cream/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-cream backdrop-blur-sm">
                        Collection
                      </span>
                      <motion.div 
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur-sm transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                        whileHover={{ rotate: 45 }}
                      >
                        <ArrowUpRight className="h-5 w-5" />
                      </motion.div>
                    </div>
                    
                    {/* Bottom - Category Info */}
                    <div className="space-y-3">
                      <h3 className="font-serif text-2xl font-semibold text-cream md:text-3xl transition-transform duration-300 group-hover:translate-x-2">
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-cream/70 line-clamp-1 max-w-xs">
                          {category.description}
                        </p>
                        <span className="h-px flex-1 bg-cream/20 transition-all duration-500 group-hover:bg-primary/50" />
                        <span className="text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
                          Explore
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default CategoryGrid;
