import { motion } from 'framer-motion';
import { Truck, Shield, CreditCard, Award } from 'lucide-react';

const trustFeatures = [
  {
    icon: Award,
    title: 'Handcrafted in the UK',
    description: 'Made with care & quality materials',
  },
  {
    icon: Truck,
    title: 'Fast UK Delivery',
    description: 'Next-day delivery available on most items',
  },
  {
    icon: CreditCard,
    title: 'Secure & Flexible Payments',
    description: 'Pay securely by card, PayPal, bank transfer, or cash on delivery',
  },
  {
    icon: Shield,
    title: '10-Year Guarantee',
    description: 'Quality you can trust',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TrustSection = () => {
  return (
    <section className="bg-muted/50 py-10 md:py-14">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
            Our Promise to You
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent bg-card transition-all duration-300 group-hover:border-primary group-hover:bg-primary">
                <feature.icon className="h-7 w-7 text-accent transition-colors duration-300 group-hover:text-primary-foreground" />
              </div>
              <h3 className="mb-1 font-serif text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;
