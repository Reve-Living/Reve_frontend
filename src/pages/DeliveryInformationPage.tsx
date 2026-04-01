import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DeliveryInformationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-8 font-serif text-4xl font-bold">Delivery Information</h1>
          <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              At Reve Living, we aim to provide a smooth and reliable delivery experience from the moment you
              place your order through to arrival. We work with a network of trusted delivery partners and
              in-house teams to ensure your order reaches you safely and on time.
            </p>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Delivery Coverage</h2>
              <p>We deliver across most of the UK Mainland.</p>
              <p>
                Free delivery is available to the majority of areas; however, certain postcode regions may require a
                delivery charge. These include:
              </p>
              <p>AB, DD, DG, FK, TD, TR, PA, PH, IV, KW, KY.</p>
              <p>
                If your postcode falls within these areas, please contact us before placing your order so we can
                provide a delivery quote.
              </p>
              <p>
                We do not currently deliver to Northern Ireland, Jersey, Channel Islands, or other off-shore
                locations.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Delivery Timeframes</h2>
              <p>
                Delivery timeframes vary depending on the product and are displayed on each product page.
              </p>
              <p>
                Most in-stock items are dispatched within 1–3 working days, while made-to-order items are typically
                delivered within 3–7 working days.
              </p>
              <p>
                In the unlikely event of a delay due to unforeseen circumstances, you will be notified as soon as
                possible.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Choosing a Delivery Date</h2>
              <p>
                If you have a preferred delivery date, you can leave a note in the delivery information box when
                placing your order.
              </p>
              <p>
                We will aim to deliver within the timeframe shown on the product page. If there are any delays, you
                will be notified.
              </p>
              <p>
                On the day of delivery, our delivery team will contact you to confirm arrival or arrange a suitable
                alternative if needed.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Delivery Process</h2>
              <p>
                On the day of delivery, routes are planned to ensure efficiency, and a delivery window of up to 6
                hours will be provided. Exact delivery times cannot be guaranteed.
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
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Tracking Your Order</h2>
              <p>At present, we do not provide a live tracking link.</p>
              <p>
                However, all orders are delivered within the stated delivery timeframe, and you will be contacted by
                the delivery team on the day of delivery.
              </p>
              <p>If there are any delays or changes, you will be informed as soon as possible.</p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Delivery Location</h2>
              <p>Standard delivery is made to the ground floor only.</p>
              <p>
                If delivery is required to upper floors, an additional charge of £10 per floor applies. This is payable
                directly to the delivery team.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Assembly Services</h2>
              <p>Assembly services are not included as standard.</p>
              <p>Most products are designed for easy self-assembly and include instructions.</p>
              <p>
                If you require assembly, please contact our customer team before placing your order to confirm
                availability and any applicable charges, which are payable directly to the delivery team.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Contacting Us</h2>
              <p>
                If you need assistance with delivery, preferred dates, or special arrangements, you can contact
                Reve Living via WhatsApp, phone, or email, and our team will be happy to assist you.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default DeliveryInformationPage;
