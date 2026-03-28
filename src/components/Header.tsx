import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnnouncementBar from '@/components/AnnouncementBar';
import { useCart } from '@/context/CartContext';
import { apiGet } from '@/lib/api';
import { formatWholePrice } from '@/lib/pricing';
import type { Category, Product, SubCategory } from '@/lib/types';
import logoLettersOnly from '@/assets/Logo letters only.svg';

const getSortOrder = (value?: number) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [navLinks, setNavLinks] = useState<
    { name: string; href: string; children?: { name: string; href: string }[] }[]
  >([
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ]);
  const { toggleCart, totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const shouldShowSearchResults = isSearchOpen && normalizedSearch.length > 0;
  const limitedSearchResults = useMemo(() => searchResults.slice(0, 6), [searchResults]);
  const utilityLinks = useMemo(
    () => navLinks.filter((link) => ['About Us', 'Contact Us'].includes(link.name)),
    [navLinks]
  );
  const mainNavLinks = useMemo(
    () => navLinks.filter((link) => !['About Us', 'Contact Us'].includes(link.name)),
    [navLinks]
  );

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [location]);

  useEffect(() => {
    const loadNav = async () => {
      try {
        // Fetch in parallel to avoid waiting for one before the other
        const [categories, subcategories] = await Promise.all([
          apiGet<Category[]>('/categories/', { noStore: true }),
          apiGet<SubCategory[]>('/subcategories/', { noStore: true }),
        ]);

        // Respect admin display order first, then fall back to name for ties.
        const sortedCategories = [...categories].sort((a, b) => {
          const orderDiff = getSortOrder(a.sort_order) - getSortOrder(b.sort_order);
          if (orderDiff !== 0) return orderDiff;
          return a.name.localeCompare(b.name);
        });
        const subsByCategory = subcategories.reduce<Record<number, SubCategory[]>>(
          (acc, sub) => {
            acc[sub.category] = acc[sub.category] || [];
            acc[sub.category].push(sub);
            return acc;
          },
          {}
        );

        Object.values(subsByCategory).forEach((list) =>
          list.sort((a, b) => {
            const orderDiff = getSortOrder(a.sort_order) - getSortOrder(b.sort_order);
            if (orderDiff !== 0) return orderDiff;
            return a.name.localeCompare(b.name);
          })
        );

        const dynamicLinks = sortedCategories.map((cat) => {
          const children = subsByCategory[cat.id]?.map((sub) => ({
            name: sub.name,
            href: `/category/${cat.slug}?sub=${sub.slug}`,
          }));

          return {
            name: cat.name,
            href: `/category/${cat.slug}`,
            children: children && children.length ? children : undefined,
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

  useEffect(() => {
    if (!isSearchOpen || allProducts.length > 0 || isLoadingSearch) return;

    const loadProducts = async () => {
      try {
        setIsLoadingSearch(true);
        const products = await apiGet<Product[]>('/products/');
        setAllProducts(products);
      } catch {
        setAllProducts([]);
      } finally {
        setIsLoadingSearch(false);
      }
    };

    void loadProducts();
  }, [allProducts.length, isLoadingSearch, isSearchOpen]);

  useEffect(() => {
    if (!normalizedSearch) {
      setSearchResults([]);
      return;
    }

    const results = allProducts.filter((product) => {
      const haystack = [
        product.name,
        product.category_name,
        product.subcategory_name,
        product.short_description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    setSearchResults(results);
  }, [allProducts, normalizedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSearch = () => {
    setIsSearchOpen((prev) => !prev);
    if (isSearchOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearchSelect = (slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/product/${slug}`);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (limitedSearchResults[0]) {
      handleSearchSelect(limitedSearchResults[0].slug);
    }
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/30 bg-background shadow-sm">
        <AnnouncementBar />
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center gap-4">
            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-1 md:gap-2 leading-none">
              <img
                src={logoLettersOnly}
                alt="RL monogram"
                className="block h-12 md:h-14 lg:h-16 w-auto object-contain"
                style={{ mixBlendMode: 'multiply' }} // blend white background into header backdrop
              />
              <span 
                className="block text-2xl md:text-3xl lg:text-4xl leading-none"
                style={{ 
                  fontFamily: '"Great Vibes", cursive', 
                  color: '#602e17',
                  lineHeight: 1
                }}
              >
                Reve Living
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:gap-6 xl:gap-8">
              {mainNavLinks.map((link) => (
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

              <div ref={searchRef} className="hidden">
                <div className="relative">
                  {isSearchOpen ? (
                    <>
                      <form onSubmit={handleSearchSubmit} className="w-72">
                        <Input
                          placeholder="Search..."
                          className="h-11 border-accent bg-card pr-12"
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
                          aria-label="Search"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                      </form>

                      {shouldShowSearchResults && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                          {limitedSearchResults.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto p-2">
                              {limitedSearchResults.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleSearchSelect(product.slug)}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                                >
                                  {product.images?.[0]?.url ? (
                                    <img
                                      src={product.images[0].url}
                                      alt={product.name}
                                      className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="h-14 w-14 flex-shrink-0 rounded-md bg-muted" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-foreground">{product.name}</p>
                                    {(product.category_name || product.subcategory_name) && (
                                      <p className="truncate text-sm text-muted-foreground">
                                        {[product.category_name, product.subcategory_name].filter(Boolean).join(' / ')}
                                      </p>
                                    )}
                                    <p className="text-sm font-semibold text-primary">
                                      {formatWholePrice(Number(product.price))}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                              {isLoadingSearch ? 'Searching products...' : 'No related items found.'}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={openSearch}
                      className="hover:bg-muted"
                      aria-label="Open search"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {utilityLinks[1] && (
                  <Link
                    to={utilityLinks[1].href}
                    className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {utilityLinks[1].name}
                  </Link>
                )}

                {utilityLinks[0] && (
                  <Link
                    to={utilityLinks[0].href}
                    className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {utilityLinks[0].name}
                  </Link>
                )}
              </div>
            </nav>

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-4">
              <div ref={searchRef} className="hidden lg:flex lg:items-center lg:gap-4">
                <div className="relative">
                  {isSearchOpen ? (
                    <>
                      <form onSubmit={handleSearchSubmit} className="w-72">
                        <Input
                          placeholder="Search..."
                          className="h-11 border-accent bg-card pr-12"
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
                          aria-label="Search"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                      </form>

                      {shouldShowSearchResults && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                          {limitedSearchResults.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto p-2">
                              {limitedSearchResults.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleSearchSelect(product.slug)}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                                >
                                  {product.images?.[0]?.url ? (
                                    <img
                                      src={product.images[0].url}
                                      alt={product.name}
                                      className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="h-14 w-14 flex-shrink-0 rounded-md bg-muted" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-foreground">{product.name}</p>
                                    {(product.category_name || product.subcategory_name) && (
                                      <p className="truncate text-sm text-muted-foreground">
                                        {[product.category_name, product.subcategory_name].filter(Boolean).join(' / ')}
                                      </p>
                                    )}
                                    <p className="text-sm font-semibold text-primary">
                                      {formatWholePrice(Number(product.price))}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                              {isLoadingSearch ? 'Searching products...' : 'No related items found.'}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={openSearch}
                      className="hover:bg-muted"
                      aria-label="Open search"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {utilityLinks[1] && (
                  <Link
                    to={utilityLinks[1].href}
                    className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {utilityLinks[1].name}
                  </Link>
                )}

                {utilityLinks[0] && (
                  <Link
                    to={utilityLinks[0].href}
                    className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {utilityLinks[0].name}
                  </Link>
                )}
              </div>

              {/* Search */}
              {isSearchOpen && (
                <div ref={searchRef} className="relative hidden md:block lg:hidden">
                  <form onSubmit={handleSearchSubmit}>
                    <Input
                      placeholder="Search..."
                      className="w-52 border-accent bg-card"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>

                  {shouldShowSearchResults && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                      {limitedSearchResults.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto p-2">
                          {limitedSearchResults.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleSearchSelect(product.slug)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                            >
                              {product.images?.[0]?.url ? (
                                <img
                                  src={product.images[0].url}
                                  alt={product.name}
                                  className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-14 w-14 flex-shrink-0 rounded-md bg-muted" />
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">{product.name}</p>
                                {(product.category_name || product.subcategory_name) && (
                                  <p className="truncate text-sm text-muted-foreground">
                                    {[product.category_name, product.subcategory_name].filter(Boolean).join(' / ')}
                                  </p>
                                )}
                                <p className="text-sm font-semibold text-primary">
                                  {formatWholePrice(Number(product.price))}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          {isLoadingSearch ? 'Searching products...' : 'No related items found.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={openSearch}
                className="hover:bg-muted lg:hidden"
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
                {[...utilityLinks, ...mainNavLinks].map((link) => (
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
      <div className="h-[100px]" />
    </>
  );
};

export default Header;
