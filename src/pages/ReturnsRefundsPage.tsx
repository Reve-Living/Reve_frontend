import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ReturnsRefundsPage = () => {
  return (
    <div className="min-h-screen bg-background">
<Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-8 font-serif text-4xl font-bold">Returns & Refunds Policy</h1>
          <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              At Reve Living, we want you to shop with confidence. If something isn't right, our returns and
              refunds process is designed to be clear, fair, and straightforward.
            </p>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Returns Window</h2>
              <p>We accept returns and offer refunds within 30 days of delivery.</p>
              <p>
                To begin a return, you must contact us within this 30-day period so we can guide you through the
                process and arrange the next steps.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Return & Collection Charges</h2>
              <p>
                A £60 collection fee applies to all returns, including change-of-mind returns, exchanges, and
                cancellations after delivery has been scheduled.
              </p>
              <p>This fee will be deducted from your refund.</p>
              <p>
                You may alternatively arrange your own return, provided the item is returned safely and in line with
                our condition requirements.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Condition of Returned Items</h2>
              <p>Returned items must be in reasonable, resaleable condition.</p>
              <p>
                Items showing damage, misuse, or excessive wear (including stains, tears, marks, or structural
                issues) may be subject to a deduction of up to 75% of the item value.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Packaging Requirements</h2>
              <p>
                We strongly recommend keeping the original packaging until you are certain you will not be
                returning the item.
              </p>
              <p>
                If original packaging is unavailable, suitable replacement packaging must be provided.
              </p>
              <p>Photographs of the fully packaged item may be requested before collection is arranged.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                Damaged or Faulty Items on Delivery
              </h2>
              <p>Please inspect your delivery upon arrival.</p>
              <p>If visible damage is present, sign the courier's device as "Damaged".</p>
              <p>If damage is discovered after unpacking, notify us within 48 hours of delivery.</p>
              <p>Claims made after 48 hours may not be eligible for a refund or exchange.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Non-Returnable Items</h2>
              <p>Custom-made or tailored items are non-refundable unless faulty or supplied incorrectly.</p>
              <p>
                This includes non-standard bed sizes, custom headboard dimensions, and made-to-order
                specifications.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Refund Processing</h2>
              <p>Approved refunds are issued using the original payment method.</p>
              <p>
                Please allow up to 5 working days after processing for the refund to appear in your account.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                Order Cancellations Before Delivery
              </h2>
              <p>Orders may be cancelled for a full refund if a delivery date has not been scheduled.</p>
              <p>Once a delivery date is confirmed, a £60 cancellation fee will apply.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Starting a Return</h2>
              <p>
                To begin a return, exchange, or cancellation, please contact Reve Living Customer Support within
                the applicable timeframes.
              </p>
              <p className="mt-4">
                <strong>Reve Living Limited</strong>
                <br />
                128 City Road, London, EC1V 2NX
                <br />
                <strong>Email:</strong> info@reveliving.co.uk
                <br />
                <strong>Phone:</strong> 020 7871 7675
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnsRefundsPage;

