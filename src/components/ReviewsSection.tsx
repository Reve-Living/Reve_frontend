import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: 'Sarah Thompson',
    location: 'Manchester',
    rating: 5,
    text: "Absolutely stunning bed! The quality is exceptional and the delivery was seamless. The Chelsea Divan has transformed our bedroom. Worth every penny!",
    product: 'Chelsea Divan',
  },
  {
    id: 2,
    name: 'Emma Roberts',
    location: 'Birmingham',
    rating: 5,
    text: "Thrilled with our new bed! It's even more beautiful in person. Delivery was prompt and the entire experience was easy and pleasant. Highly recommend.",
    product: 'Windsor Ottoman Bed',
  },
  {
    id: 3,
    name: 'Robert Wilson',
    location: 'London',
    rating: 5,
    text: "Excellent quality and great service. The bed looks amazing and the storage is perfect for our needs. Delivered on time and in perfect condition.",
    product: 'Kingston Bed',
  },
  {
    id: 4,
    name: 'James Mitchell',
    location: 'Leeds',
    rating: 5,
    text: "The Pocket Spring mattress has completely changed my sleep. No more back pain! The quality is comparable to mattresses twice the price.",
    product: 'Pocket Spring Deluxe',
  },
  {
    id: 5,
    name: 'Laura Bennett',
    location: 'Bristol',
    rating: 5,
    text: "Beautiful craftsmanship on our new ottoman bed. The storage space is incredible and the velvet finish is luxurious. Customer service was outstanding.",
    product: 'Vienna Ottoman',
  },
  {
    id: 6,
    name: 'David Clark',
    location: 'Edinburgh',
    rating: 5,
    text: "We've had our Hampton Oak bed for 3 months now and it's perfect. Solid construction, beautiful design, and the delivery team were very professional.",
    product: 'Hampton Oak Bed',
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

const ReviewsSection = () => {
  const [startIndex, setStartIndex] = useState(0);
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const currentPage = Math.floor(startIndex / reviewsPerPage);

  const nextReviews = () => {
    setStartIndex((prev) => {
      const next = prev + reviewsPerPage;
      return next >= reviews.length ? 0 : next;
    });
  };

  const prevReviews = () => {
    setStartIndex((prev) => {
      const next = prev - reviewsPerPage;
      return next < 0 ? (totalPages - 1) * reviewsPerPage : next;
    });
  };

  const visibleReviews = reviews.slice(startIndex, startIndex + reviewsPerPage);

  return (
    <section className="bg-muted/30 py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-primary">
            <Star className="h-4 w-4 fill-primary" />
            <span className="font-medium">Rated 4.8/5</span>
            <span className="text-muted-foreground">by UK customers</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            What Our Customers Say
          </h2>
        </motion.div>

        {/* Reviews Grid */}
        <div className="relative">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-5 md:grid-cols-3"
            key={startIndex}
          >
            {visibleReviews.map((review) => (
              <motion.div
                key={review.id}
                variants={itemVariants}
                className="rounded-lg bg-card p-6 shadow-luxury"
              >
                {/* Quote Icon */}
                <Quote className="mb-4 h-8 w-8 text-primary/30" />

                {/* Rating */}
                <div className="mb-3 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-primary text-primary'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>

                {/* Reviewer Info */}
                <div className="mb-2">
                  <p className="font-semibold text-foreground">{review.name}</p>
                  <p className="text-sm text-muted-foreground">{review.location}</p>
                </div>

                {/* Product */}
                <p className="mb-3 text-sm font-medium text-primary">
                  Purchased: {review.product}
                </p>

                {/* Review Text */}
                <p className="text-sm italic text-muted-foreground line-clamp-4">
                  "{review.text}"
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Navigation - only show if more than one page */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={prevReviews}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-all hover:bg-primary hover:text-primary-foreground"
                aria-label="Previous reviews"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Page Dots */}
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setStartIndex(index * reviewsPerPage)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentPage
                        ? 'w-6 bg-primary'
                        : 'w-2 bg-border hover:bg-accent'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextReviews}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-all hover:bg-primary hover:text-primary-foreground"
                aria-label="Next reviews"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
