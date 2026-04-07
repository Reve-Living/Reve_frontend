import { motion } from 'framer-motion';
import { Award, HeartHandshake, Leaf, ShieldCheck, Sparkles, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsletterSection from '@/components/NewsletterSection';
import brandMark from '@/assets/logo.png';
import wordmark from '@/assets/Logo wordmark.svg';

const badgeCopy = [
  'Comfort-first living',
  'Made with intention',
  'Designed to feel personal',
];

const pillars = [
  {
    icon: Sparkles,
    title: 'Beautiful by design',
    description:
      'We focus on bedrooms that feel calm, elevated and considered, with pieces that sit naturally in everyday life.',
  },
  {
    icon: HeartHandshake,
    title: 'Easy to choose',
    description:
      'Our collection is curated to simplify decision-making, helping customers find the right look, fit and finish with confidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Built for daily use',
    description:
      'Comfort, support and durability stay at the centre of every range so each piece feels good long after delivery day.',
  },
];

const highlights = [
  {
    icon: Award,
    title: 'Refined quality',
    description: 'Thoughtful materials, clean finishes and a premium feel in every detail.',
  },
  {
    icon: Leaf,
    title: 'Practical comfort',
    description: 'Style matters, but so does how a bed supports the rhythm of real life.',
  },
  {
    icon: Star,
    title: 'A personal touch',
    description: 'From statement headboards to softer silhouettes, every choice is made to feel like home.',
  },
];

const promises = [
  'A collection shaped around comfort, function and visual simplicity.',
  'A warm, supportive shopping experience from discovery through delivery.',
  'Design decisions that help every bedroom feel more restful and complete.',
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="overflow-hidden">
        <section className="relative bg-background py-16 md:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-6rem] top-8 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute right-[-4rem] top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="container relative mx-auto px-4">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
              >
                <p className="mb-4 text-sm uppercase tracking-[0.28em] text-primary">About Reve Living</p>
                <h1 className="font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                  Creating bedrooms that feel softer, calmer and more beautifully lived in.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Reve Living brings together comfort-led beds and bedroom pieces with a more refined,
                  welcoming point of view. We believe the room you start and end your day in should
                  feel considered, restful and unmistakably yours.
                </p>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Our approach is simple: curate well, design thoughtfully and keep the experience warm
                  from the first browse to the final setup. The result is a collection that balances
                  elegance, practicality and everyday comfort.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {badgeCopy.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-accent/20 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative"
              >
                <div className="rounded-[32px] border border-accent/10 bg-[#F4EEE6] p-6 shadow-luxury md:p-8">
                  <div className="rounded-[24px] border border-white/70 bg-[#FBF7F1] p-8">
                    <div className="flex min-h-[320px] flex-col items-center justify-center gap-6 text-center">
                      <img
                        src={brandMark}
                        alt="Reve Living logo"
                        className="h-28 w-28 rounded-full object-cover shadow-[0_12px_30px_rgba(87,59,31,0.10)]"
                      />
                      <img
                        src={wordmark}
                        alt="Reve Living"
                        className="h-16 w-auto max-w-[220px] object-contain"
                      />
                      <p className="max-w-sm text-base leading-7 text-muted-foreground">
                        A softer take on modern bedroom living, where comfort, character and quiet luxury
                        meet in one place.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5EEE5] py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              {pillars.map((pillar, index) => (
                <motion.article
                  key={pillar.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="rounded-[28px] border border-accent/10 bg-background/70 p-6 backdrop-blur-sm"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <pillar.icon className="h-6 w-6" />
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-foreground">{pillar.title}</h2>
                  <p className="mt-3 text-base leading-7 text-muted-foreground">{pillar.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F1E9DF] py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid items-start gap-10 lg:grid-cols-[1fr,0.95fr]">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
              >
                <p className="text-sm uppercase tracking-[0.28em] text-primary">Our Perspective</p>
                <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl">
                  We see the bedroom as more than a room. It is where restoration begins.
                </h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  That is why Reve Living is built around pieces that support both the look and the
                  feeling of home. We want every design to bring ease into the space, whether that means
                  a stronger visual centre, better use of layout or a more inviting place to switch off.
                </p>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  Rather than filling a catalogue for the sake of volume, we focus on a collection that
                  feels edited and intentional. Each style is chosen to help customers create a bedroom
                  that feels restful, elevated and easy to live with.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5 }}
                className="rounded-[32px] border border-accent/10 bg-background/80 p-7 shadow-luxury"
              >
                <h3 className="font-serif text-2xl font-semibold text-foreground">What guides us</h3>
                <div className="mt-6 space-y-5">
                  {highlights.map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm leading-7 text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-[#EEE5DA] py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-[0.28em] text-primary"
              >
                The Reve Living Promise
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="mt-4 font-serif text-3xl font-bold text-foreground md:text-4xl"
              >
                Every decision should make the space feel better to live in.
              </motion.h2>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
              {promises.map((promise, index) => (
                <motion.div
                  key={promise}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="rounded-[24px] border border-accent/10 bg-background/75 p-6 text-left"
                >
                  <div className="mb-4 h-1.5 w-12 rounded-full bg-primary" />
                  <p className="text-base leading-7 text-foreground">{promise}</p>
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

