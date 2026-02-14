import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { apiGet } from '@/lib/api';
import type { Category, SubCategory } from '@/lib/types';
import logo from '@/assets/logo.png';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [navLinks, setNavLinks] = useState<
    { name: string; href: string; children?: { name: string; href: string }[] }[]
  >([
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ]);
  const { toggleCart, totalItems } = useCart();
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  useEffect(() => {
    const loadNav = async () => {
      try {
        const categories = await apiGet<Category[]>('/categories/');
        const subcategories = await apiGet<SubCategory[]>('/subcategories/');

        const dynamicLinks = categories.map((cat) => {
          const children = subcategories
            .filter((sub) => sub.category === cat.id)
            .map((sub) => ({
              name: sub.name,
              href: `/category/${cat.slug}?sub=${sub.slug}`,
            }));

          return {
            name: cat.name,
            href: `/category/${cat.slug}`,
            children: children.length ? children : undefined,
          };
        });

        setNavLinks((prev) => {
          // Keep Home/About/Contact in place; insert dynamic categories after Home.
          const staticStart = prev.filter((l) => ['Home'].includes(l.name));
          const staticEnd = prev.filter((l) => ['About Us', 'Contact Us'].includes(l.name));
          return [...staticStart, ...dynamicLinks, ...staticEnd];
        });
      } catch {
        // leave default links on failure
      }
    };
    loadNav();
  }, []);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/30 bg-background shadow-sm">
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
                  {link.children && activeDropdown === link.name && (
                    <div className="absolute left-0 top-full w-56 rounded-lg bg-card p-3 shadow-luxury">
                      <div className="flex flex-col">
                        {link.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            className="rounded-md px-3 py-2 text-left font-medium text-foreground transition-colors hover:bg-background hover:text-primary"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              {isSearchOpen && (
                <div className="hidden md:block">
                  <Input
                    placeholder="Search..."
                    className="w-52 border-accent bg-card"
                    autoFocus
                  />
                </div>
              )}
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
        {isMobileMenuOpen && (
          <div className="border-t border-border bg-card lg:hidden">
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
                        {activeDropdown === link.name && (
                          <div className="pl-4">
                            {link.children.map((child) => (
                              <Link
                                key={child.name}
                                to={child.href}
                                className="block py-2 text-muted-foreground hover:text-primary"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
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
          </div>
        )}
      </header>

      {/* Spacer for fixed header + announcement bar */}
      <div className="h-20" />
    </>
  );
};

export default Header;
