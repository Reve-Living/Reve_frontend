import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
<Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-8 font-serif text-4xl font-bold">Privacy & Cookie Policy</h1>
          <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              At Reve Living, we are committed to protecting your privacy and handling your personal data
              responsibly and transparently. This Privacy & Cookie Policy explains how we collect, use, store,
              and protect your information when you visit our website or make a purchase from us.
            </p>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Who We Are</h2>
              <p>
                Reve Living ("we", "us", "our") is responsible for controlling and processing your personal data.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">What is Personal Data</h2>
              <p>
                Personal data means any information that can identify you directly or indirectly, including your
                name, contact details, delivery address, payment information, online identifiers, and
                communications with us.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Personal Data We Collect</h2>
              <p>
                We may collect contact information, order and transaction details, payment information processed
                securely by third-party providers, account information where applicable, marketing preferences,
                website usage data, and communications sent to us.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">How We Use Your Personal Data</h2>
              <p>
                We use personal data to process orders, manage deliveries and returns, communicate with
                customers, improve our website and services, send marketing communications where consent has
                been given, comply with legal obligations, and maintain website security.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Legal Basis for Processing</h2>
              <p>
                We process personal data based on contract, legal obligation, legitimate interests, and consent
                where required.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Payments</h2>
              <p>
                Payments by card, bank transfer, PayPal, and Cash on Delivery are processed securely by
                third-party providers. We do not store full card details. Additional payment options such as Klarna
                may be added in the future.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Marketing Communications</h2>
              <p>
                Marketing communications are only sent where consent has been provided. You may unsubscribe
                at any time. Transactional messages relating to orders will still be sent where necessary.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Data Retention</h2>
              <p>
                We retain personal data only for as long as necessary for legal, accounting, and operational
                purposes.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Data Security</h2>
              <p>
                We take appropriate technical and organisational measures to protect personal data. No method of
                online transmission can be guaranteed to be completely secure.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Sharing Your Data</h2>
              <p>
                Personal data may be shared with payment providers, delivery partners, analytics and marketing
                platforms such as Google, Meta, and TikTok, and regulatory authorities where required. We do not
                sell personal data.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Your Rights</h2>
              <p>
                You have the right to access, correct, delete, restrict, or object to the processing of your personal
                data, withdraw consent, and complain to the Information Commissioner's Office.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Cookie Policy</h2>
              <p>
                Cookies are small text files placed on your device to ensure website functionality, analyse
                performance, and support marketing activities.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Types of Cookies</h2>
              <p>
                Essential cookies are required for website operation. Analytics cookies help us understand website
                usage. Marketing cookies are used by advertising platforms such as Meta and TikTok.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Managing Cookies</h2>
              <p>
                You can manage or withdraw cookie consent at any time using our cookie banner or settings tool.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">Changes to This Policy</h2>
              <p>
                This policy may be updated from time to time to reflect changes in legal or operational
                requirements.
              </p>
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

export default PrivacyPolicyPage;

