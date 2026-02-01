import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Thank you for subscribing!');
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <section className="bg-[#F5F1EB] py-10 md:py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="mb-2 font-serif text-2xl font-bold text-foreground md:text-3xl">
            Join the Reve Living Family
          </h2>
          <p className="mb-5 text-muted-foreground">
            Subscribe to receive exclusive offers, interior inspiration, and be the
            first to know about new arrivals.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 flex-1 border-border bg-card"
              required
            />
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="gradient-bronze h-11 px-8 font-semibold transition-transform hover:scale-105"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>

          <p className="mt-3 text-xs text-muted-foreground">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
