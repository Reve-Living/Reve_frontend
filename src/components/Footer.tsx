import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, CreditCard } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { name: 'Divan Beds', href: '/category/divan-beds' },
      { name: 'Ottoman Beds', href: '/category/ottoman-beds' },
      { name: 'Upholstered Beds', href: '/category/upholstered-beds' },
      { name: 'Wooden Beds', href: '/category/wooden-beds' },
      { name: 'Bunk Beds', href: '/category/bunk-beds' },
      { name: 'Mattresses', href: '/category/mattresses' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Delivery Information', href: '/delivery' },
      { name: 'Returns Policy', href: '/returns' },
    ],
    support: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Size Guide', href: '/size-guide' },
      { name: 'Care Instructions', href: '/care' },
      { name: 'Track Order', href: '/track-order' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms & Conditions', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  };

  return (
    <footer className="bg-espresso text-cream">
      {/* MOVING BANNER - Large Reve Living Text */}
      <div className="relative h-32 md:h-48 overflow-hidden bg-primary border-b border-cream/10">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 15s linear infinite;
          }
        `}</style>
        
        <div className="absolute inset-0 flex items-center">
          <div className="animate-marquee flex whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="mx-8 md:mx-16 text-6xl md:text-8xl lg:text-9xl font-serif font-bold tracking-tight">
                <span className="text-cream">REVE</span>
                <span className="text-espresso"> LIVING</span>
                <span className="text-espresso mx-4">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="mb-6 inline-block">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Reve Living" className="h-20 w-auto rounded" />
                <span className="font-serif text-xl font-semibold">Reve Living</span>
              </div>
            </Link>
            <p className="mb-6 max-w-sm text-cream/80">
              Crafting dreams into reality. Premium UK handcrafted beds and mattresses
              for the perfect night's sleep.
            </p>

            {/* Contact Info */}
            <div className="mb-6 space-y-3">
              <a
                href="tel:+441onal-phone"
                className="flex items-center gap-3 text-cream/80 transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4" />
                <span>0800 123 4567</span>
              </a>
              <a
                href="mailto:hello@reveliving.co.uk"
                className="flex items-center gap-3 text-cream/80 transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                <span>hello@reveliving.co.uk</span>
              </a>
              <div className="flex items-start gap-3 text-cream/80">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>123 Furniture Lane, Manchester, M1 2AB</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/30 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-cream/80 transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-cream/80 transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="mb-4 mt-6 font-serif text-lg font-semibold">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-cream/80 transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">We Accept</h4>
            <div className="flex flex-wrap gap-2">
              {['Visa', 'Mastercard', 'PayPal', 'Amex', 'COD'].map((method) => (
                <div
                  key={method}
                  className="flex items-center gap-1 rounded bg-cream/10 px-3 py-2 text-sm"
                >
                  <CreditCard className="h-4 w-4" />
                  {method}
                </div>
              ))}
            </div>

            <h4 className="mb-4 mt-6 font-serif text-lg font-semibold">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-cream/80 transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-accent/30">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
          <p className="text-sm text-cream/60">
            © {currentYear} Reve Living. All rights reserved. UK Handcrafted with ❤️
          </p>
          <p className="text-sm text-cream/60">
            Company Reg: 12345678 | VAT: GB123456789
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
