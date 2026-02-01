import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';

const mainCategories = [
  {
    id: '1',
    name: 'Beds',
    slug: 'beds',
    description: 'Explore our complete range of handcrafted beds, from divan to ottoman styles.',
    image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&h=600&fit=crop',
    subcategories: ['Divan Beds', 'Ottoman Beds', 'Upholstered Beds', 'Wooden Beds', 'Bunk Beds'],
  },
  {
    id: '2',
    name: 'Mattresses',
    slug: 'mattresses',
    description: 'Premium mattresses for the ultimate night\'s sleep, handcrafted in the UK.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
    subcategories: ['Pocket Spring', 'Memory Foam', 'Orthopaedic', 'Pillow Top'],
  },
  {
    id: '3',
    name: 'Sofas',
    slug: 'sofas',
    description: 'Luxurious sofas and seating solutions for modern living spaces.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
    subcategories: ['Sofa Sets', 'Recliner Sofas', 'Sofa Beds', 'Corner Sofas'],
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
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    }
  },
};

const CategoriesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      
      {/* Hero Section */}
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
              Browse Collections
            </motion.span>
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              All Categories
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Discover our complete range of handcrafted furniture, designed for comfort and built to last
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {mainCategories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <Link
                  to={`/category/${category.slug}`}
                  className="group relative flex h-[400px] w-full flex-col overflow-hidden rounded-2xl"
                >
                  {/* Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url(${category.image})` }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/50 to-espresso/20 transition-all duration-500" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8">
                    {/* Arrow Icon */}
                    <motion.div 
                      className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur-sm transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                      whileHover={{ rotate: 45 }}
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </motion.div>
                    
                    {/* Category Info */}
                    <div className="space-y-4">
                      <h2 className="font-serif text-3xl font-bold text-cream md:text-4xl transition-transform duration-300 group-hover:translate-x-2">
                        {category.name}
                      </h2>
                      <p className="text-cream/80">
                        {category.description}
                      </p>
                      
                      {/* Subcategories */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {category.subcategories.map((sub) => (
                          <span
                            key={sub}
                            className="rounded-full bg-cream/10 px-3 py-1 text-xs font-medium text-cream backdrop-blur-sm"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CategoriesPage;
