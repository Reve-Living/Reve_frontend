import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsConditionsPage = () => {
  return (
    <div className="min-h-screen bg-background">
<Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-8 font-serif text-4xl font-bold">Terms & Conditions</h1>
          <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              These Terms & Conditions explain how purchases from Reve Living work. By placing an order on
              our website, you agree to the terms below.
            </p>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">About Us</h2>
              <p>Reve Living sells beds and bedroom furniture to customers in the UK.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Using Our Website</h2>
              <p>
                Please use our website responsibly and ensure that any information you provide is accurate and up
                to date.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Product Information</h2>
              <p>
                We aim to display products accurately. Images are for illustration only and colours or finishes may
                vary slightly due to lighting, screen settings, and the nature of upholstered products. Minor
                variations are not considered faults.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Pricing</h2>
              <p>
                All prices are shown in GBP (£) and include VAT unless stated otherwise. Prices may change, but
                confirmed orders will not be affected.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Orders</h2>
              <p>
                Placing an order is an offer to buy. Your order is accepted once we confirm processing or delivery
                arrangements. We may cancel orders where payment cannot be authorised or errors are identified.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Payments</h2>
              <p>
                We accept card payments, bank transfer, PayPal, and Cash on Delivery. Payments are handled
                securely by third-party providers. We do not store card details.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Delivery</h2>
              <p>
                Delivery times are estimates and may vary. You are responsible for ensuring safe and suitable
                access for delivery. Risk passes to you once the item is delivered.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Cancellations</h2>
              <p>
                Orders can be cancelled for a full refund if a delivery date has not been scheduled. Once a delivery
                date is confirmed, a £60 cancellation fee applies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Returns & Refunds</h2>
              <p>
                Returns are accepted within 30 days of delivery in line with our Returns & Refunds Policy. A £60
                collection fee applies where applicable. Items must be returned in resaleable condition.
                Custom-made items are non-refundable unless faulty.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Bespoke Items</h2>
              <p>
                Products made to your specifications cannot be cancelled once production has begun and are
                non-refundable unless faulty or incorrect.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Damaged or Faulty Items</h2>
              <p>
                Please check your order on delivery. Any damage must be reported within 48 hours so we can
                resolve the issue promptly.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Your Legal Rights</h2>
              <p>Nothing in these terms affects your rights under UK consumer law.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Liability</h2>
              <p>
                We are not responsible for indirect or consequential losses. Our liability is limited to the value of the
                product purchased, where permitted by law.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Privacy</h2>
              <p>Your personal data is handled in line with our Privacy & Cookie Policy.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Changes to These Terms</h2>
              <p>We may update these Terms & Conditions from time to time. Changes apply to future orders only.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Governing Law</h2>
              <p>These Terms are governed by the laws of England and Wales.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Contact Us</h2>
              <p>
                <strong>Reve Living Limited</strong>
                <br />
                128 City Road, London, EC1V 2NX
                <br />
                Email: info@reveliving.co.uk
                <br />
                Phone: 020 7871 7675
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsConditionsPage;

