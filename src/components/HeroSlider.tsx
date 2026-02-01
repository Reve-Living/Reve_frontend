import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&h=1080&fit=crop',
    title: 'Luxury Beds',
    subtitle: 'UK Handcrafted Bed Collection',
    cta: 'Shop Collection',
    link: '/category/beds',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=1920&h=1080&fit=crop',
    title: 'Ottoman Beds',
    subtitle: 'Maximise Your Space with Style',
    cta: 'Shop Collection',
    link: '/category/ottoman-beds',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1920&h=1080&fit=crop',
    title: 'Premium Mattresses',
    subtitle: 'Sleep in Ultimate Comfort',
    cta: 'Shop Collection',
    link: '/category/mattresses',
  },
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section
      className="relative h-[60vh] min-h-[400px] overflow-hidden md:h-[70vh] md:max-h-[700px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence mode="wait">
        {slides.map(
          (slide, index) =>
            index === currentSlide && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-espresso/70 via-espresso/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="container relative mx-auto flex h-full items-end px-4 pb-20 md:pb-24 md:pl-16 lg:pl-20">
                  <div className="max-w-2xl pl-8 md:pl-0">
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="mb-4 text-sm uppercase tracking-widest text-cream md:text-base"
                    >
                      {slide.subtitle}
                    </motion.p>
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="mb-6 font-serif text-4xl font-bold text-cream md:text-6xl lg:text-7xl"
                    >
                      {slide.title}
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    >
                      <Button
                        asChild
                        size="lg"
                        className="gradient-bronze text-lg font-semibold transition-transform hover:scale-105"
                      >
                        <Link to={slide.link}>{slide.cta}</Link>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )
        )}
      </AnimatePresence>

      {/* Left Arrow */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 backdrop-blur-sm transition-all hover:bg-black/50 md:left-5 md:p-3"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-white md:h-6 md:w-6" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 backdrop-blur-sm transition-all hover:bg-black/50 md:right-5 md:p-3"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-white md:h-6 md:w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-3 md:bottom-8">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 bg-primary'
                : 'w-2 bg-cream/50 hover:bg-cream'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
