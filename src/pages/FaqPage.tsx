import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const FaqPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-8 font-serif text-4xl font-bold">FAQ</h1>
          <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Where do you deliver?</h2>
              <p>
                We deliver across most of the UK Mainland, using a network of trusted delivery partners and
                in-house teams to ensure a fast, reliable and timely service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                Is delivery free and are any areas excluded?
              </h2>
              <p>Free delivery is available to most Mainland UK areas.</p>
              <p>
                However, the following postcode areas are excluded and may require a delivery quote:
              </p>
              <p>AB, DD, DG, FK, TD, TR, PA, PH, IV, KW, KY.</p>
              <p>If your postcode falls within these areas, please contact us before placing your order.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">How long does delivery take?</h2>
              <p>
                Delivery timeframes vary depending on the product, delivery postcode, and scheduled delivery route.
                Estimated delivery times are displayed on each product page and typically range from 1-10 working days.
              </p>
              <p>
                In the unlikely event of an unforeseen delay, we will notify you as soon as possible.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                How can I choose my preferred delivery date?
              </h2>
              <p>
                You can leave your preferred delivery date in the delivery information box when placing your
                order.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                What happens on the day of delivery?
              </h2>
              <p>
                On the day of delivery, routes are planned to ensure efficiency. Our delivery team will contact you
                to confirm your estimated delivery time.
              </p>
              <p>
                If you are unavailable on the scheduled date, the delivery team will work with you to arrange an
                alternative suitable date.
              </p>
              <p>
                To avoid any inconvenience or additional delivery costs, we recommend informing us in advance if
                you are unable to receive your order or require delivery on a specific date.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                Can you deliver upstairs or to a specific room?
              </h2>
              <p>Standard delivery is made to the ground floor only.</p>
              <p>
                Delivery to upper floors can be arranged for an additional £10 per floor, payable to the delivery
                team.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Do you offer assembly?</h2>
              <p>Assembly services are not included as standard at the moment.</p>
              <p>
                If you require assembly, please contact our customer team before placing your order to confirm
                availability and any service charges, which are payable directly to the delivery team.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                How can I contact you regarding delivery?
              </h2>
              <p>For delivery enquiries, special requests, or changes, you can contact us by:</p>
              <p>Sending a message on WhatsApp</p>
              <p>Calling the number provided</p>
              <p>Emailing our customer support team</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Can I return my order?</h2>
              <p>
                Yes, you can return your order within 14 days of delivery. To begin the process, you must
                contact us within this period so we can arrange the return.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                What condition must items be returned in?
              </h2>
              <p>
                Items must be in a resaleable condition. If items show signs of damage, misuse, or wear,
                deductions of up to 75% of the item value may be applied.
              </p>
              <p>
                We recommend keeping the original packaging. If it is not available, suitable packaging must be
                used, and we may request photos before collection.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                Are there any return or cancellation charges?
              </h2>
              <p>
                A £60 collection fee applies to returns, exchanges, and cancellations once a delivery has been
                scheduled. This amount will be deducted from your refund.
              </p>
              <p>
                If you prefer, you may arrange your own return, provided the item is returned safely and meets
                our conditions.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                What if my item arrives damaged or faulty?
              </h2>
              <p>You should inspect your order on arrival. If there is visible damage, it should be marked at the time of delivery.</p>
              <p>
                If any issues are discovered after unpacking, they must be reported within 48 hours. Claims
                made after this period may not be accepted.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                Are any items non-returnable?
              </h2>
              <p>Custom-made or made-to-order items are non-refundable unless faulty or supplied incorrectly.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                How are refunds processed?
              </h2>
              <p>
                Refunds are issued to the original payment method. Once processed, please allow up to 5
                working days for the funds to appear in your account.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Can I cancel my order?</h2>
              <p>
                Orders can be cancelled for a full refund before a delivery date is scheduled. If a delivery date
                has already been confirmed, a £60 cancellation fee will apply.
              </p>
            </section>

          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default FaqPage;
