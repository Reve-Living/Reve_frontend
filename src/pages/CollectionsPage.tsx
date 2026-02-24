import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { apiGet } from '@/lib/api';
import { Collection } from '@/lib/types';

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
    },
  },
};

const CollectionsPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Collection[]>('/collections/');
        setCollections(data);
      } catch {
        setCollections([]);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
<Header />

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
              Explore Collections
            </motion.span>
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              All Collections
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Curated ranges of handcrafted furniture and bedroom essentials.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {collections.map((collection) => (
              <motion.div key={collection.id} variants={itemVariants} id={collection.slug}>
                <div className="group relative flex h-[380px] w-full flex-col overflow-hidden rounded-2xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url(${collection.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/50 to-espresso/20 transition-all duration-500" />
                  <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8">
                    <motion.div
                      className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur-sm transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                      whileHover={{ rotate: 45 }}
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </motion.div>
                    <div className="space-y-3">
                      <h2 className="font-serif text-3xl font-bold text-cream md:text-4xl transition-transform duration-300 group-hover:translate-x-2">
                        {collection.name}
                      </h2>
                      <p className="text-cream/80">
                        {collection.description}
                      </p>
                    </div>
                  </div>
                </div>

                {(collection.products_data || []).length > 0 && (
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(collection.products_data || []).map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CollectionsPage;

