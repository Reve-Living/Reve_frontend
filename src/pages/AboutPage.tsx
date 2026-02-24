import { motion } from 'framer-motion';
import { Award, Heart, Leaf, Hammer } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsletterSection from '@/components/NewsletterSection';

const values = [
  {
    icon: Award,
    title: 'UK Handcrafted',
    description: 'Every bed is handmade by skilled craftsmen in our UK workshop, ensuring exceptional quality.',
  },
  {
    icon: Heart,
    title: 'Customer First',
    description: 'We believe in creating lasting relationships with our customers through exceptional service.',
  },
  {
    icon: Leaf,
    title: 'Sustainable',
    description: 'We source materials responsibly and aim to minimise our environmental footprint.',
  },
  {
    icon: Hammer,
    title: 'Built to Last',
    description: 'Our 10-year guarantee reflects our confidence in the durability of every piece we make.',
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
<Header />

      {/* Hero Section */}
      <section className="relative h-80 overflow-hidden md:h-96">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=1080&fit=crop)',
          }}
        >
          <div className="absolute inset-0 bg-espresso/70" />
        </div>
        <div className="container relative mx-auto flex h-full items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="mb-4 text-sm uppercase tracking-widest text-primary">Our Story</p>
            <h1 className="font-serif text-4xl font-bold text-cream md:text-5xl lg:text-6xl">
              About Reve Living
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 text-sm uppercase tracking-widest text-primary"
            >
              Est. 2020
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 font-serif text-3xl font-bold md:text-4xl"
            >
              Crafting Dreams into Reality
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mb-6 text-lg text-muted-foreground"
            >
              Reve Living was born from a simple belief: everyone deserves a beautiful, 
              comfortable night's sleep. Our journey began in a small workshop in Manchester, 
              where our founder, inspired by generations of furniture-making heritage, 
              set out to create beds that combine timeless design with modern comfort.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Today, we continue that tradition, handcrafting each bed in our UK workshop 
              using only the finest materials. From the sustainably sourced timber frames 
              to the premium fabrics and pocket-spring mattresses, every element is chosen 
              with care and assembled with pride.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-card py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-sm uppercase tracking-widest text-primary">Our Values</p>
            <h2 className="font-serif text-3xl font-bold md:text-4xl">What We Stand For</h2>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-background">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="mb-4 text-sm uppercase tracking-widest text-primary">Our Workshop</p>
              <h2 className="mb-6 font-serif text-3xl font-bold md:text-4xl">
                Where Craftsmanship Meets Comfort
              </h2>
              <p className="mb-6 text-muted-foreground">
                Our 20,000 sq ft workshop in Manchester is where the magic happens. 
                Here, our team of skilled craftsmen bring over 100 years of combined 
                experience to every piece they create.
              </p>
              <p className="mb-6 text-muted-foreground">
                From cutting and shaping the solid timber frames to hand-tufting our 
                mattresses and carefully upholstering each headboard, every step is 
                performed with meticulous attention to detail.
              </p>
              <ul className="space-y-3">
                {[
                  '25+ skilled craftsmen',
                  '100+ years combined experience',
                  'Traditional techniques, modern comfort',
                  'Quality control at every stage',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid gap-4"
            >
              <img
                src="https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&h=500&fit=crop"
                alt="Workshop"
                className="rounded-lg shadow-luxury"
              />
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop"
                  alt="Craftsman at work"
                  className="rounded-lg shadow-luxury"
                />
                <img
                  src="https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&h=300&fit=crop"
                  alt="Quality materials"
                  className="rounded-lg shadow-luxury"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default AboutPage;

