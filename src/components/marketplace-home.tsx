"use client";

import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOutAction } from "@/app/actions";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Gift,
  Heart,
  House,
  Menu,
  MapPin,
  Search,
  ShoppingCart,
  Star,
  Store,
  UserRound,
  X,
  Warehouse,
} from "lucide-react";
import {
  marketplaceProducts,
  type MarketplaceProduct,
} from "@/lib/marketplace-products";

const productCategories = ["All", "Groceries", "Fashion", "Electronics", "Home", "Beauty"];

const nearbyProducts: MarketplaceProduct[] = [
  {
    id: "fresh-market-basket",
    name: "Fresh market produce basket",
    category: "Groceries",
    price: 8500,
    previousPrice: 10000,
    rating: "4.8",
    image: "/market.png",
  },
  marketplaceProducts[0],
  marketplaceProducts[1],
  marketplaceProducts[7],
  marketplaceProducts[11],
];

const storageSpaces = [
  { name: "Bodija stock room", location: "Ibadan, Oyo", detail: "48 sqm available", price: 2200 },
  { name: "GRA fulfilment space", location: "Port Harcourt, Rivers", detail: "34 sqm available", price: 3000 },
  { name: "Yaba secure hub", location: "Yaba, Lagos", detail: "48 sqm available", price: 3500 },
  { name: "Wuse merchant store", location: "Wuse, FCT", detail: "22 pallets available", price: 2200 },
];

const serviceListings = [
  "Plumbing call-out",
  "Electrical repairs",
  "Home painting",
  "Carpentry and fittings",
  "Appliance repairs",
  "Deep home cleaning",
];

const searchableProducts = [nearbyProducts[0], ...marketplaceProducts];
const popularSearches = ["Groceries", "Fashion", "Electronics", "Storage", "Plumbing"];

function matchesSearchTerms(value: string, searchTerm: string) {
  const normalizedValue = value.toLowerCase();
  return searchTerm.split(/\s+/).every((term) => normalizedValue.includes(term));
}

function formatPrice(price: number) {
  return `₦${price.toLocaleString("en-NG")}`;
}

function NearbyProductCard({
  product,
  onAdd,
  isSaved,
  onToggleSaved,
}: {
  product: MarketplaceProduct;
  onAdd: () => void;
  isSaved: boolean;
  onToggleSaved: () => void;
}) {
  const discount = Math.round(
    (1 - product.price / product.previousPrice) * 100,
  );

  return (
    <article className="nearby-product">
      <div className="nearby-product-media">
        <div
          aria-label={product.name}
          className="nearby-product-image"
          role="img"
          style={{
            backgroundImage: product.image.startsWith("/")
              ? `url(${product.image})`
              : `url(https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=440&q=80)`,
          }}
        />
        <span aria-hidden="true" className="nearby-product-category">{product.category}</span>
        <button
          aria-label={isSaved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          aria-pressed={isSaved}
          className={`nearby-save-product${isSaved ? " is-saved" : ""}`}
          onClick={onToggleSaved}
          type="button"
        >
          <Heart aria-hidden="true" fill={isSaved ? "currentColor" : "none"} size={16} />
        </button>
      </div>
      <div className="nearby-product-info">
        <div className="nearby-product-location">
          <span><MapPin aria-hidden="true" size={12} /> Benin City, Edo</span>
          <span className="nearby-verified">Verified</span>
        </div>
        <p className="nearby-product-name">{product.name}</p>
        <div className="nearby-product-bottom">
          <div>
            <strong>{formatPrice(product.price)}</strong>
            {discount > 0 && <del>{formatPrice(product.previousPrice)}</del>}
          </div>
          <button aria-label={`Add ${product.name} to cart`} onClick={onAdd} type="button">
            <ShoppingCart aria-hidden="true" size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function MarketplaceSearchOverlay({
  query,
  onQueryChange,
  onClose,
  onSelectResult,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelectResult: (destination: "products" | "services" | "storage", query?: string) => void;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTerm = query.trim().toLowerCase();
  const matchingProducts = useMemo(
    () =>
      searchTerm
        ? searchableProducts.filter((product) =>
            matchesSearchTerms(`${product.name} ${product.category}`, searchTerm),
          )
        : [],
    [searchTerm],
  );
  const matchingServices = useMemo(
    () =>
      searchTerm
        ? serviceListings.filter((service) => matchesSearchTerms(service, searchTerm))
        : [],
    [searchTerm],
  );
  const matchingStorage = useMemo(
    () => {
      if (!searchTerm) return [];
      const locationSearch = searchTerm.replace(/\bstorage\b/g, "").trim();
      return storageSpaces.filter(
        (space) =>
          !locationSearch ||
          matchesSearchTerms(`${space.name} ${space.location} ${space.detail}`, locationSearch),
      );
    },
    [searchTerm],
  );

  useEffect(() => {
    searchInputRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="market-search-overlay">
      <section
        aria-label="Search the SpaciMore marketplace"
        aria-modal="true"
        className="market-search-dialog"
        role="dialog"
      >
        <form
          className="market-search-overlay-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSelectResult("products", query);
          }}
          role="search"
        >
          <Search aria-hidden="true" size={22} />
          <input
            aria-label="Search products, services, and storage"
            autoComplete="off"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder="Search anything on SpaciMore"
            ref={searchInputRef}
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear search"
              className="market-search-clear"
              onClick={() => onQueryChange("")}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          )}
          <button aria-label="Close search" className="market-search-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={21} />
          </button>
        </form>

        <div className="market-search-results" aria-live="polite">
          {!searchTerm ? (
            <section className="popular-searches">
              <h2>Popular searches</h2>
              <div>
                {popularSearches.map((search) => (
                  <button key={search} onClick={() => onQueryChange(search)} type="button">
                    <Search aria-hidden="true" size={14} />
                    {search}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              {matchingProducts.length > 0 && (
                <section className="search-result-group">
                  <h2>Products <span>{matchingProducts.length}</span></h2>
                  {matchingProducts.map((product) => (
                    <button
                      className="market-search-result"
                      key={product.id}
                      onClick={() => onSelectResult("products", product.name)}
                      type="button"
                    >
                      <span className="search-result-icon"><ShoppingCart aria-hidden="true" size={17} /></span>
                      <span><strong>{product.name}</strong><small>{product.category} · {formatPrice(product.price)}</small></span>
                      <ChevronRight aria-hidden="true" size={17} />
                    </button>
                  ))}
                </section>
              )}
              {matchingServices.length > 0 && (
                <section className="search-result-group">
                  <h2>Services <span>{matchingServices.length}</span></h2>
                  {matchingServices.map((service) => (
                    <button
                      className="market-search-result"
                      key={service}
                      onClick={() => onSelectResult("services")}
                      type="button"
                    >
                      <span className="search-result-icon"><BriefcaseBusiness aria-hidden="true" size={17} /></span>
                      <span><strong>{service}</strong><small>Book a trusted professional</small></span>
                      <ChevronRight aria-hidden="true" size={17} />
                    </button>
                  ))}
                </section>
              )}
              {matchingStorage.length > 0 && (
                <section className="search-result-group">
                  <h2>Storage spaces <span>{matchingStorage.length}</span></h2>
                  {matchingStorage.map((space) => (
                    <button
                      className="market-search-result"
                      key={space.name}
                      onClick={() => onSelectResult("storage")}
                      type="button"
                    >
                      <span className="search-result-icon"><Warehouse aria-hidden="true" size={17} /></span>
                      <span><strong>{space.name}</strong><small>{space.location} · {formatPrice(space.price)}/day</small></span>
                      <ChevronRight aria-hidden="true" size={17} />
                    </button>
                  ))}
                </section>
              )}
              {!matchingProducts.length && !matchingServices.length && !matchingStorage.length && (
                <p className="market-search-empty">No matches found. Try a product, service, category, or location.</p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function MobileMarketplaceMenu({
  isOpen,
  onClose,
  signedInUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  signedInUser?: { displayName: string };
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`mobile-market-menu${isOpen ? " is-open" : ""}`}
    >
      <nav aria-label="Mobile main navigation" className="mobile-market-menu-links">
        <Link href="/" onClick={onClose}>Marketplace</Link>
        <a href="#services" onClick={onClose}>Services</a>
        <a href="#storage" onClick={onClose}>Storage</a>
        <a href="#earn-with-us" onClick={onClose}>Earnings</a>
      </nav>
      <div className="mobile-market-menu-actions">
        {signedInUser ? (
          <>
            <Link className="mobile-market-login" href="/dashboard" onClick={onClose}>My Account</Link>
            <form action={signOutAction}>
              <button className="mobile-market-get-started" type="submit">Sign Out</button>
            </form>
          </>
        ) : (
          <>
            <Link className="mobile-market-login" href="/login" onClick={onClose}>Log In</Link>
            <Link className="mobile-market-get-started" href="/signup" onClick={onClose}>Get Started</Link>
          </>
        )}
      </div>
    </div>
  );
}

export function MarketplaceHome({
  signedInUser,
}: {
  signedInUser?: { displayName: string };
}) {
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredProducts = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    const products = searchTerm ? searchableProducts : nearbyProducts;
    return products.filter(
      (product) =>
        (selectedCategory === "All" || product.category === selectedCategory) &&
        (!searchTerm ||
          `${product.name} ${product.category}`.toLowerCase().includes(searchTerm)),
    );
  }, [query, selectedCategory]);

  const toggleSaved = (productId: string) => {
    setSavedItems((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const closeSearch = useCallback(() => setShowSearch(false), []);
  const closeMobileMenu = useCallback(() => setShowMobileMenu(false), []);

  const selectSearchResult = useCallback(
    (destination: "products" | "services" | "storage", selectedQuery?: string) => {
      if (destination === "products") {
        setSelectedCategory("All");
        setQuery(selectedQuery ?? searchQuery);
      }

      closeSearch();
      window.setTimeout(() => {
        const target = destination === "products" ? "#popular" : `#${destination}`;
        document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    },
    [closeSearch, searchQuery],
  );

  return (
    <div className="marketplace-page">
      <span className="visually-hidden" aria-live="polite">
        {cartCount > 0 ? `${cartCount} items in cart` : ""}
      </span>

      <header className="market-header">
        <div className="market-container market-header-inner">
          <div className="market-header-brand-group">
            <BrandLink className="market-brand" />
            <button
              aria-expanded={showMobileMenu}
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
              className="mobile-menu-toggle"
              onClick={() => setShowMobileMenu((isOpen) => !isOpen)}
              type="button"
            >
              <span className="mobile-menu-icon" aria-hidden="true">
                <Menu size={23} />
                <X size={23} />
              </span>
            </button>
          </div>
          <nav className="market-primary-nav" aria-label="Main navigation">
            <Link href="/">Marketplace</Link>
            <a href="#services">Services</a>
            <a href="#storage">Storage</a>
            <a href="#earn-with-us">Earn with Us</a>
          </nav>
          <nav className="market-account-actions" aria-label="Account">
            {signedInUser && (
              <button aria-label={`Cart, ${cartCount} items`} className="market-cart-button" type="button">
                <ShoppingCart aria-hidden="true" size={20} />
                <span className="market-cart-count">{cartCount}</span>
              </button>
            )}
            {signedInUser ? (
              <>
                <Link className="market-join-button market-user-button" href="/dashboard">
                  <UserRound aria-hidden="true" size={18} />
                  <span>Hi, {signedInUser.displayName}</span>
                </Link>
                <form action={signOutAction} className="market-signout-form">
                  <button className="market-signout-button" type="submit">Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link className="market-login-link" href="/login">Log In</Link>
                <Link className="market-join-button market-get-started-button" href="/signup">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
        <MobileMarketplaceMenu
          isOpen={showMobileMenu}
          onClose={closeMobileMenu}
          signedInUser={signedInUser}
        />
      </header>

      {showSearch && (
        <MarketplaceSearchOverlay
          onClose={closeSearch}
          onQueryChange={setSearchQuery}
          onSelectResult={selectSearchResult}
          query={searchQuery}
        />
      )}
      <main className="market-container market-main">
        <section className="market-hero-layout" aria-label="Featured offers">
          <div className="market-promo">
            <div className="promo-image" role="img" aria-label="Solar panels in a green landscape" />
            <div className="promo-copy">
              <span className="promo-kicker">One Marketplace, Every Opportunity</span>
              <h1>Buy, sell and grow<br /><span>together.</span></h1>
              <h3>Discover trusted products and services, store goods nearby, and earn from every connection you make</h3>
              
              {/* <p>T&amp;Cs Apply</p> */}
              <form
                className="promo-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  document.querySelector("#popular")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Search aria-hidden="true" size={19} />
                <input
                  aria-label="Search products"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, services or storage"
                  type="search"
                  value={query}
                />
                <button type="submit">Search</button>
              </form>
              <ul className="promo-highlights" aria-label="Marketplace benefits">
                <li><BadgeCheck aria-hidden="true" size={17} />Verified Sellers</li>
                <li><MapPin aria-hidden="true" size={17} />Local Fulfilment</li>
                <li><Gift aria-hidden="true" size={17} />Rewards on every order</li>
              </ul>
            </div>
           
          </div>
        </section>

        <div className="market-start-heading">
          <span>START HERE</span>
          <h2>What would you like to do?</h2>
        </div>

        <nav className="market-quick-links" aria-label="Featured promotions">
          <a className="deal-tile deal-tile-shop" href="#popular">
            <span className="deal-tile-shop-icon"><Store aria-hidden="true" size={32} /></span>
            <span className="deal-tile-shop-copy">
              <strong>Shop</strong>
              <span className="deal-tile-shop-caption">Great Local Product</span>
            </span>
          </a>
          <a className="deal-tile deal-tile-shop" href="#popular">
            <span className="deal-tile-shop-icon"><Store aria-hidden="true" size={32} /></span>
            <span className="deal-tile-shop-copy">
              <strong>Book A Pro</strong>
              <span className="deal-tile-shop-caption">Book Help Nearby</span>
            </span>
          </a>
          <a className="deal-tile deal-tile-shop" href="#popular">
            <span className="deal-tile-shop-icon"><Store aria-hidden="true" size={32} /></span>
            <span className="deal-tile-shop-copy">
              <strong>Find Storage</strong>
              <span className="deal-tile-shop-caption">Space When You Need It</span>
            </span>
          </a>
          <a className="deal-tile deal-tile-shop" href="#popular">
            <span className="deal-tile-shop-icon"><Store aria-hidden="true" size={32} /></span>
            <span className="deal-tile-shop-copy">
              <strong>Agents</strong>
              <span className="deal-tile-shop-caption">Products and inspections</span>
            </span>
          </a>
         <a className="deal-tile deal-tile-shop" href="#popular">
            <span className="deal-tile-shop-icon"><Store aria-hidden="true" size={32} /></span>
            <span className="deal-tile-shop-copy">
              <strong>Earn Rewards</strong>
              <span className="deal-tile-shop-caption">Share and Get Paid</span>
            </span>
          </a>

          <a className="deal-tile deal-tile-shop" href="#popular">
            <span className="deal-tile-shop-icon"><Store aria-hidden="true" size={32} /></span>
            <span className="deal-tile-shop-copy">
              <strong>Spacekoin</strong>
              <span className="deal-tile-shop-caption">Voucher and coins</span>
            </span>
          </a>
        </nav>

        <section className="curated-section" id="popular" aria-labelledby="curated-title">
          <div className="curated-heading">
            <span>CURATED FOR YOU</span>
            <h2 id="curated-title">Popular Near you</h2>
          </div>
          <div className="product-category-filters" aria-label="Filter products by category" role="group">
            {productCategories.map((category) => (
              <button
                aria-pressed={selectedCategory === category}
                className={selectedCategory === category ? "is-selected" : ""}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
          {query && (
            <p className="nearby-search-label">
              Showing results for <strong>“{query}”</strong>
            </p>
          )}
          {filteredProducts.length ? (
            <div aria-live="polite" className="nearby-product-grid">
              {filteredProducts.map((product) => (
                <NearbyProductCard
                  isSaved={savedItems.has(product.id)}
                  key={product.id}
                  onAdd={() => setCartCount((count) => count + 1)}
                  onToggleSaved={() => toggleSaved(product.id)}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <p className="nearby-empty-state">No nearby products match this selection yet.</p>
          )}
        </section>

        <section className="nearby-storage" id="storage" aria-labelledby="storage-title">
          <div className="nearby-storage-copy">
            <span className="storage-label"><Warehouse aria-hidden="true" size={14} /> NEIGHBORHOOD STORAGE</span>
            <h2 id="storage-title">Store Closer<br />Deliver Faster</h2>
            <p>Verified spaces near your customers help vendors reduce delivery time and keep inventory secure.</p>
            <Link href="/signup">Explore Storage <ChevronRight aria-hidden="true" size={15} /></Link>
          </div>
          <div className="storage-listings">
            {storageSpaces.map((space) => (
              <article className="storage-listing" key={space.name}>
                <div className="storage-listing-top">
                  <span className="storage-listing-icon"><Warehouse aria-hidden="true" size={17} /></span>
                  <span className="storage-verified"><BadgeCheck aria-hidden="true" size={11} /> VERIFIED</span>
                </div>
                <h3>{space.name}</h3>
                <p className="storage-listing-location"><MapPin aria-hidden="true" size={12} /> {space.location}</p>
                <div className="storage-listing-bottom">
                  <span>{space.detail}<strong>{formatPrice(space.price)}<small> /day</small></strong></span>
                  <ChevronRight aria-hidden="true" size={15} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="nearby-services" id="services" aria-labelledby="services-title">
          <div className="nearby-services-heading">
            <div>
              <span>SKILLED HANDS, CLOSE BY</span>
              <h2 id="services-title">BOOK TRUSTED PRO</h2>
            </div>
            <Link href="/signup">Browse services <ChevronRight aria-hidden="true" size={14} /></Link>
          </div>
          <div className="service-listings">
            {serviceListings.map((service) => (
              <Link className="service-listing" href="/signup" key={service}>
                <span className="service-listing-icon"><BriefcaseBusiness aria-hidden="true" size={26} /></span>
                <span className="service-listing-copy">
                  <small>REPAIRS</small>
                  <strong>{service}</strong>
                  <span><Star aria-hidden="true" fill="currentColor" size={13} /> 4.6 <span>from ₦10,000</span></span>
                </span>
                <ChevronRight aria-hidden="true" className="service-listing-arrow" size={16} />
              </Link>
            ))}
          </div>
        </section>

        <section className="agent-earnings" id="earn-with-us" aria-labelledby="agent-earnings-title">
          <div className="agent-earnings-copy">
            <span className="agent-earnings-icon"><ChartNoAxesColumnIncreasing aria-hidden="true" size={24} /></span>
            <h2 id="agent-earnings-title">Turn your network into income</h2>
            <p>Share products you love, help local businesses reach new buyers, and earn commission when your links convert.</p>
            <strong>Up to 12% commission <span>·</span> Weekly payouts</strong>
            <Link href="/signup">Become a sales agent <ChevronRight aria-hidden="true" size={16} /></Link>
          </div>
          <div className="agent-rewards-art" aria-label="Weekly earnings and reward points">
            <div className="weekly-earnings"><span>THIS WEEK</span><strong>₦48,500</strong></div>
            <div className="reward-rings"><Gift aria-hidden="true" size={35} /></div>
            <div className="reward-points"><span>REWARD POINTS</span><strong>2,840 pts</strong></div>
          </div>
        </section>
      </main>

      <footer className="market-footer">
        <div className="market-container market-footer-inner">
          <BrandLink className="footer-brand" />
          <p>Built for Nigerian communities. Ready for Everywhere</p>
          <nav aria-label="Footer links">
            <Link href="/signup">Safety</Link>
            <Link href="/signup">Help</Link>
            <Link href="/signup">Terms</Link>
          </nav>
        </div>
      </footer>

      <nav className="mobile-market-nav" aria-label="Mobile navigation">
        <a className="mobile-nav-active" href="#"><House aria-hidden="true" size={19} />Home</a>
        <button onClick={() => setShowSearch(true)} type="button"><Search aria-hidden="true" size={19} />Search</button>
        <a href="#popular"><Heart aria-hidden="true" size={19} />Discover</a>
        <Link href={signedInUser ? "/dashboard" : "/login"}><UserRound aria-hidden="true" size={19} />Account</Link>
      </nav>
    </div>
  );
}
