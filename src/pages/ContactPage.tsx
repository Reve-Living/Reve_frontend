import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const faqs = [
  {
    question: 'Where do you deliver?',
    answer:
      'We deliver across most of the UK Mainland using trusted delivery partners and in-house teams for a reliable service.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Delivery timeframes vary by product and are shown on each product page. Most in-stock items are dispatched within 1-3 working days, while made-to-order items are typically delivered within 3-7 working days.',
  },
  {
    question: 'Can you deliver upstairs or to a specific room?',
    answer:
      'Standard delivery is to the ground floor only. Upper-floor delivery can be arranged for an additional GBP 10 per floor, payable to the delivery team.',
  },
  {
    question: 'Do you offer assembly?',
    answer:
      'Assembly is not included as standard. If you need assembly, please contact the customer team before ordering to confirm availability and any service charges.',
  },
  {
    question: 'Can I return my order?',
    answer:
      'Returns are accepted within 30 days of delivery. Items must be in resaleable condition, and custom-made or made-to-order items are non-refundable unless faulty or supplied incorrectly.',
  },
  {
    question: 'What if my item arrives damaged or faulty?',
    answer:
      'Please inspect your order on arrival and report any visible damage at delivery. If an issue is found after unpacking, it must be reported within 48 hours.',
  },
];

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const response = await fetch("https://formspree.io/f/mlgowbgv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  } catch (error) {
    toast.error("Network error. Please try again.");
  }

  setIsSubmitting(false);
};

  return (
    <div className="min-h-screen bg-background">
<Header />

      {/* Hero Section */}
      <section className="relative h-64 overflow-hidden md:h-80">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=1920&h=1080&fit=crop)',
          }}
        >
          <div className="absolute inset-0 bg-espresso/70" />
        </div>
        <div className="container relative mx-auto flex h-full items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="mb-4 text-sm uppercase tracking-widest text-primary">Get in Touch</p>
            <h1 className="font-serif text-4xl font-bold text-cream md:text-5xl">
              Contact Us
            </h1>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-2 font-serif text-2xl font-bold md:text-3xl">
              Send Us a Message
            </h2>
            <p className="mb-8 text-muted-foreground">
              Have a question about our products or need assistance with your order? 
              Fill out the form below and we'll get back to you within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 border-accent"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 border-accent"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 border-accent"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="mt-1 border-accent"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="mt-1 border-accent"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full gradient-bronze gap-2 sm:w-auto"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>

          {/* Contact Info & FAQ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Contact Details */}
            <div className="rounded-lg bg-card p-6 shadow-luxury">
              <h3 className="mb-6 font-serif text-xl font-semibold">Contact Details</h3>
              <div className="space-y-4">
                <a
                  href="tel:+442078717675"
                  className="flex items-center gap-4 text-muted-foreground transition-colors hover:text-primary"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">020 7871 7675</p>
                    <p className="text-sm">Mon - Fri: 9am - 6pm</p>
                  </div>
                </a>
                <a
                  href="mailto:info@reveliving.co.uk"
                  className="flex items-center gap-4 text-muted-foreground transition-colors hover:text-primary"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">info@reveliving.co.uk</p>
                    <p className="text-sm">We reply within 24 hours</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Reve Living Limited</p>
                    <p className="text-sm">128 City Road, London, EC1V 2NX</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Mon - Fri: 9am - 6pm</p>
                    <p className="text-sm">Sat: 10am - 4pm, Sun: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="mb-6 font-serif text-xl font-semibold">
                Frequently Asked Questions
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;

