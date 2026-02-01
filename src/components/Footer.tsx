import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    customerService: [
      { name: 'Delivery Information', href: '/delivery' },
      { name: 'Returns Policy', href: '/returns' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Track Order', href: '/track-order' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms & Conditions', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  };

  return (
    <footer className="bg-espresso text-cream">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="mb-4 inline-block">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Reve Living" className="h-14 w-auto rounded" />
                <span className="font-serif text-xl font-semibold">Reve Living</span>
              </div>
            </Link>
            <p className="mb-5 max-w-xs text-sm text-cream/80">
              Crafting dreams into reality. Premium UK handcrafted beds and mattresses
              for the perfect night's sleep.
            </p>

            {/* Contact Info */}
            <div className="mb-5 space-y-2">
              <a
                href="tel:+4408001234567"
                className="flex items-center gap-3 text-sm text-cream/80 transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4" />
                <span>0800 123 4567</span>
              </a>
              <a
                href="mailto:hello@reveliving.co.uk"
                className="flex items-center gap-3 text-sm text-cream/80 transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                <span>hello@reveliving.co.uk</span>
              </a>
              <div className="flex items-start gap-3 text-sm text-cream/80">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>123 Furniture Lane, Manchester, M1 2AB</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-2">
            <h4 className="mb-3 font-serif text-base font-semibold">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/80 transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service Links */}
          <div className="lg:col-span-3">
            <h4 className="mb-3 font-serif text-base font-semibold">Customer Service</h4>
            <ul className="space-y-2">
              {footerLinks.customerService.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/80 transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links + Payment Icons */}
          <div className="lg:col-span-3">
            <h4 className="mb-3 font-serif text-base font-semibold">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/80 transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Payment Icons - Under Legal */}
            <div className="mt-6 flex items-center gap-2">
              {/* Visa */}
              <div className="flex h-7 w-11 items-center justify-center rounded bg-white">
                <span className="text-[11px] font-bold text-blue-800">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="flex h-7 w-11 items-center justify-center rounded bg-white">
                <div className="flex">
                  <div className="h-4 w-4 rounded-full bg-red-500 -mr-1.5"></div>
                  <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                </div>
              </div>
              {/* PayPal */}
              <div className="flex h-7 w-11 items-center justify-center rounded bg-white">
                <span className="text-[9px] font-bold text-blue-700">PayPal</span>
              </div>
              {/* Amex */}
              <div className="flex h-7 w-11 items-center justify-center rounded bg-blue-600">
                <span className="text-[9px] font-bold text-white">AMEX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cream/10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-cream/60 text-center md:text-left">
            © {currentYear} Reve Living. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
