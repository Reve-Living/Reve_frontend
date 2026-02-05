import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Menu, X, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import logo from '@/assets/logo.png';
import { apiGet } from '@/lib/api';
import { Category } from '@/lib/types';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { toggleCart, totalItems } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const [navLinks, setNavLinks] = useState<
    { name: string; href: string; children?: { name: string; href: string; description?: string }[] }[]
  >([{ name: 'Home', href: '/' }]);

  useEffect(() => {
    const loadNav = async () => {
      try {
        const categories = await apiGet<Category[]>('/categories/');
        const dynamicLinks = categories.map((cat) => ({
          name: cat.name,
          href: `/category/${cat.slug}`,
          children: [
            { name: `View All ${cat.name}`, href: `/category/${cat.slug}` },
            ...(cat.subcategories || []).map((sub) => ({
              name: sub.name,
              href: `/category/${cat.slug}?sub=${sub.slug}`,
              description: sub.description || undefined,
            })),
          ],
        }));
        setNavLinks([
          { name: 'Home', href: '/' },
          ...dynamicLinks,
          { name: 'About Us', href: '/about' },
          { name: 'Contact Us', href: '/contact' },
        ]);
      } catch {
        setNavLinks([
          { name: 'Home', href: '/' },
          { name: 'About Us', href: '/about' },
          { name: 'Contact Us', href: '/contact' },
        ]);
      }
    };
    loadNav();
  }, []);

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-50 ${
          isScrolled
            ? 'top-0 border-b border-white/10 bg-background shadow-lg'
            : 'top-[20px] bg-background'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="Reve Living"
                className="h-20 w-auto rounded mt-2"
              />
              <span className="hidden font-serif text-xl font-semibold text-foreground sm:block">
                Reve Living
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => link.children && setActiveDropdown(link.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {link.children ? (
                    <button className="story-link inline-flex items-center gap-1 py-2 font-medium text-foreground transition-colors hover:text-primary">
                      <span>{link.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  ) : (
                    <Link
                      to={link.href}
                      className="story-link py-2 font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {link.children && activeDropdown === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-full w-72 rounded-lg bg-card p-4 shadow-luxury"
                      >
                        <div className="flex flex-col gap-2">
                          {link.children.map((child) => (
                            <Link
                              key={child.name}
                              to={child.href}
                              className="group rounded-md p-3 transition-colors hover:bg-background"
                            >
                              <p className="font-medium text-foreground group-hover:text-primary">
                                {child.name}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {child.description}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="hidden overflow-hidden md:block"
                  >
                    <Input
                      placeholder="Search..."
                      className="border-accent bg-card"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hover:bg-muted"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Account */}
              <Button asChild variant="ghost" size="icon" className="hidden hover:bg-muted md:flex">
                <Link to="/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCart}
                className="relative hover:bg-muted"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                  >
                    {totalItems}
                  </span>
                )}
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover:bg-muted lg:hidden"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-card lg:hidden"
            >
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <div key={link.name}>
                      {link.children ? (
                        <>
                          <button
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === link.name ? null : link.name
                              )
                            }
                            className="flex w-full items-center justify-between py-2 font-medium text-foreground"
                          >
                            {link.name}
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                activeDropdown === link.name ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          <AnimatePresence>
                            {activeDropdown === link.name && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden pl-4"
                              >
                                {link.children.map((child) => (
                                  <Link
                                    key={child.name}
                                    to={child.href}
                                    className="block py-2 text-muted-foreground hover:text-primary"
                                  >
                                    {child.name}
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={link.href}
                          className="block py-2 font-medium text-foreground hover:text-primary"
                        >
                          {link.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                {/* Mobile Search */}
                <div className="mt-6">
                  <Input placeholder="Search products..." className="border-accent" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed header + announcement bar */}
      <div className={`h-[${isScrolled ? '80px' : '80px'}]`} style={{ height: isScrolled ? '80px' : '80px' }} />
    </>
  );
};

export default Header;
