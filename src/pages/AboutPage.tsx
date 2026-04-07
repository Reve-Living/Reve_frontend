import { motion } from 'framer-motion';
import { Award, HeartHandshake, ShieldCheck, Truck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsletterSection from '@/components/NewsletterSection';

const storySections = [
  {
    eyebrow: 'Built on Relationships',
    title: 'Built on Relationships',
    description:
      'We believe good service matters just as much as good products. Our approach is simple - clear communication, honest pricing, and a smooth experience from order to delivery. We aim to build long-term relationships with our customers by being reliable, responsive, and easy to deal with at every step.',
    image:
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&h=900&fit=crop',
    imageAlt: 'A styled bedroom interior from the Reve Living collection',
  },
  {
    eyebrow: 'Quality You Can Rely On',
    title: 'Quality You Can Rely On',
    description:
      'Our collection is built through a mix of skilled craftsmanship and partnerships with reliable manufacturers. Not every product is handmade, but every product is carefully selected to meet our standards for quality and finish. We focus on offering furniture that looks right, feels right, and lasts over time.',
    image:
      'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=1200&h=900&fit=crop',
    imageAlt: 'A premium bed setup representing Reve Living quality',
  },
];

const values = [
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Carefully selected materials and finishes',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted Sourcing',
    description: 'Working with reliable partners and suppliers',
  },
  {
    icon: HeartHandshake,
    title: 'Customer First',
    description: 'Clear communication and smooth service',
  },
  {
    icon: Truck,
    title: 'Fast UK Delivery',
    description: 'Free delivery on most orders',
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="overflow-hidden bg-[#faf6ef]">
        <section className="relative py-16 md:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-6rem] top-8 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute right-[-4rem] top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="container relative mx-auto max-w-6xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-5xl text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">EST. 2020</p>
              <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                Crafting Comfort for Everyday Living
              </h1>
              <p className="mx-auto mt-8 max-w-5xl text-lg leading-9 text-muted-foreground md:text-[2rem] md:leading-[3.4rem]">
                Reve Living is built on years of experience in the furniture trade, focused on delivering
                quality, comfort, and dependable service. While we have served customers offline for
                years, we are now bringing our range online to make it easier to shop from anywhere in
                the UK.
              </p>
              <p className="mx-auto mt-8 max-w-5xl text-lg leading-9 text-muted-foreground md:text-[2rem] md:leading-[3.4rem]">
                We offer a carefully selected range of beds, mattresses, sofas, and furniture suited for
                modern homes - combining well-crafted pieces with products sourced from trusted
                suppliers. Every item is chosen with a focus on practicality, durability, and everyday
                comfort.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="pb-16 md:pb-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="space-y-12 md:space-y-16">
              {storySections.map((section, index) => {
                const isReversed = index % 2 === 1;

                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: index * 0.08, duration: 0.45 }}
                    className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
                  >
                    <div className={isReversed ? 'lg:order-2' : ''}>
                      <p className="text-sm uppercase tracking-[0.28em] text-primary">{section.eyebrow}</p>
                      <h2 className="mt-4 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
                        {section.title}
                      </h2>
                      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-[1.15rem]">
                        {section.description}
                      </p>
                    </div>

                    <div className={isReversed ? 'lg:order-1' : ''}>
                      <div className="overflow-hidden rounded-[28px] border border-[#d9c5ab] bg-card shadow-[0_18px_40px_rgba(87,59,31,0.08)]">
                        <img
                          src={section.image}
                          alt={section.imageAlt}
                          className="h-[280px] w-full object-cover md:h-[340px] lg:h-[360px]"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pt-4 md:pt-8">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-[0.28em] text-primary"
              >
                Our Values
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="mt-4 font-serif text-4xl font-bold text-foreground md:text-5xl"
              >
                What We Stand For
              </motion.h2>
            </div>
          </div>
        </section>

        <section className="mt-10 bg-[#fbf7f1] py-14 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-primary/80 text-primary">
                    <value.icon className="h-9 w-9" />
                  </div>
                  <p className="font-serif text-2xl font-semibold leading-tight text-foreground">{value.title}</p>
                  <p className="mx-auto mt-3 max-w-[220px] text-base leading-8 text-muted-foreground">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default AboutPage;

