"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { signOutAction } from "@/app/actions";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Flower2,
  Gift,
  Heart,
  House,
  MapPin,
  PhoneCall,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  UserRound,
  X,
} from "lucide-react";
import {
  marketplaceProducts,
  type MarketplaceProduct,
} from "@/lib/marketplace-products";

function formatPrice(price: number) {
  return `₦${price.toLocaleString("en-NG")}`;
}

function ProductCard({
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
    <article className="market-product">
      <div
        className="market-product-image"
        role="img"
        aria-label={product.name}
        style={{
          backgroundImage: `url(https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=440&q=80)`,
        }}
      >
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          aria-label={isSaved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          aria-pressed={isSaved}
          className={`save-product${isSaved ? " is-saved" : ""}`}
          onClick={onToggleSaved}
          type="button"
        >
          <Heart aria-hidden="true" fill={isSaved ? "currentColor" : "none"} size={16} />
        </button>
      </div>
      <div className="market-product-info">
        <p className="market-product-name">{product.name}</p>
        <p className="market-product-price">{formatPrice(product.price)}</p>
        <div className="market-product-meta">
          <span className="old-price">{formatPrice(product.previousPrice)}</span>
          <span className="discount">{discount}% off</span>
        </div>
        <div className="market-rating"><Star aria-hidden="true" fill="currentColor" size={12} /> {product.rating} <small>({product.category})</small></div>
        <button className="add-to-cart" onClick={onAdd} type="button">Add to cart</button>
      </div>
    </article>
  );
}

function ProductSection({
  title,
  products,
  accent = false,
  onAdd,
  savedItems,
  onToggleSaved,
}: {
  title: string;
  products: MarketplaceProduct[];
  accent?: boolean;
  onAdd: (product: MarketplaceProduct) => void;
  savedItems: Set<string>;
  onToggleSaved: (productId: string) => void;
}) {
  return (
    <section className={`market-section${accent ? " section-accent" : ""}`}>
      <div className="market-section-heading">
        <h2>{title}</h2>
        <a href="#popular">See all <ChevronRight aria-hidden="true" size={14} /></a>
      </div>
      {products.length ? (
        <div className="market-product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={() => onAdd(product)}
              isSaved={savedItems.has(product.id)}
              onToggleSaved={() => onToggleSaved(product.id)}
            />
          ))}
        </div>
      ) : (
        <p className="empty-search">No products match your search. Try another term.</p>
      )}
    </section>
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

  const filteredProducts = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return marketplaceProducts.filter(
      (product) =>
        !searchTerm ||
        `${product.name} ${product.category}`.toLowerCase().includes(searchTerm),
    );
  }, [query]);

  const toggleSaved = (productId: string) => {
    setSavedItems((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  return (
    <div className="marketplace-page">
      <span className="visually-hidden" aria-live="polite">
        {cartCount > 0 ? `${cartCount} items in cart` : ""}
      </span>

      <header className="market-header">
        <div className={`market-container market-header-inner${showSearch ? " has-search" : ""}`}>
          <Link className="market-brand" href="/" aria-label="SpaciMore home">
            <span className="market-brand-mark">S</span>
            <span>Spaci<span>More</span></span>
          </Link>
          <nav className="market-primary-nav" aria-label="Main navigation">
            <Link href="/">Marketplace</Link>
            <a href="#services">Services</a>
            <a href="#storage">Storage</a>
            <a href="#earn-with-us">Earn with Us</a>
          </nav>
          <label className="market-search">
            <Search aria-hidden="true" size={19} />
            <input
              aria-label="Search products"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, brands and categories"
              type="search"
              value={query}
            />
            {query && (
              <button onClick={() => setQuery("")} type="button" aria-label="Clear search"><X aria-hidden="true" size={17} /></button>
            )}
          </label>
          <nav className="market-account-actions" aria-label="Account">
            <button
              aria-expanded={showSearch}
              aria-label={showSearch ? "Hide product search" : "Show product search"}
              className="header-search-toggle"
              onClick={() => setShowSearch((visible) => !visible)}
              type="button"
            >
              <Search aria-hidden="true" size={18} />
            </button>
            <label className="market-location">
              <MapPin aria-hidden="true" size={16} />
              <select aria-label="Choose your location" defaultValue="">
                <option disabled value="">Choose location</option>
                <option value="lagos">Lagos</option>
                <option value="abuja">Abuja</option>
                <option value="port-harcourt">Port Harcourt</option>
                <option value="ibadan">Ibadan</option>
                <option value="kano">Kano</option>
              </select>
              <ChevronDown aria-hidden="true" size={14} />
            </label>
            <span className="market-cart" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingCart aria-hidden="true" size={18} />
              <span>Cart</span>
              {cartCount > 0 && <span className="market-cart-count">{cartCount}</span>}
            </span>
            
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
              <Link className="market-join-button" href="/login">
                <UserRound aria-hidden="true" size={18} />
                <span>Sign In</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

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

        <section className="flash-section">
          <div className="flash-heading">
            <div><Sparkles aria-hidden="true" className="flash-burst" size={19} /><h2>Today’s little steals</h2><span className="flash-subtitle">Good finds, even better prices</span></div>
            <a href="#popular">Shop all deals <ArrowRight aria-hidden="true" size={15} /></a>
          </div>
          <div className="flash-products">
            {marketplaceProducts.slice(0, 5).map((product, index) => (
              <button
                className="flash-product"
                key={product.id}
                onClick={() => setCartCount((count) => count + 1)}
                type="button"
              >
                <div
                  className="flash-product-image"
                  style={{ backgroundImage: `url(https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=360&q=75)` }}
                  role="img"
                  aria-label={product.name}
                >
                  {index === 0 && <span className="flash-sticker">HOT</span>}
                </div>
                <span className="flash-product-title">{product.name}</span>
                <strong>{formatPrice(product.price)}</strong>
                <small><del>{formatPrice(product.previousPrice)}</del><span>{Math.round((1 - product.price / product.previousPrice) * 100)}% off</span></small>
                <span className="flash-stock"><i style={{ width: `${78 - index * 10}%` }} />{index + 2} items left</span>
              </button>
            ))}
          </div>
        </section>

        <section className="market-feature-banners" aria-label="Featured collections">
          <a className="feature-banner banner-lime" href="#popular">
            <span className="feature-eyebrow">A FRESH LOOK</span>
            <strong>Make yourself<br />at home.</strong>
            <span className="feature-link">Explore home <b><ArrowUpRight aria-hidden="true" size={15} /></b></span>
            <House aria-hidden="true" className="feature-art feature-art-home" />
          </a>
          <a className="feature-banner banner-lilac" href="#popular">
            <span className="feature-eyebrow">GOOD THINGS, DAILY</span>
            <strong>Your next<br />daily favourite.</strong>
            <span className="feature-link">Shop beauty <b><ArrowUpRight aria-hidden="true" size={15} /></b></span>
            <Flower2 aria-hidden="true" className="feature-art feature-art-beauty" />
          </a>
        </section>

        <div id="popular" className="market-sections">
          {query && <p className="search-results-label">Showing results for <strong>“{query}”</strong></p>}
          {query ? (
            <ProductSection
              title="Search results"
              products={filteredProducts}
              onAdd={() => setCartCount((count) => count + 1)}
              savedItems={savedItems}
              onToggleSaved={toggleSaved}
            />
          ) : (
            <>
              <ProductSection
                title="Popular right now"
                products={filteredProducts.slice(0, 6)}
                onAdd={() => setCartCount((count) => count + 1)}
                savedItems={savedItems}
                onToggleSaved={toggleSaved}
              />
              <ProductSection
                title="Everyday favourites"
                products={filteredProducts.slice(4, 10)}
                onAdd={() => setCartCount((count) => count + 1)}
                savedItems={savedItems}
                onToggleSaved={toggleSaved}
              />
              <section className="wide-editorial">
                <div><span>THE SPACIMORE EDIT</span><h2>A good day starts<br />with a good find.</h2><p>Thoughtful picks for the little moments that make your day.</p><a href="#popular">Explore the edit <b><ArrowRight aria-hidden="true" size={15} /></b></a></div>
                <div className="editorial-image" role="img" aria-label="A bright, welcoming home" />
              </section>
              <ProductSection
                title="Little things, lovely prices"
                products={filteredProducts.slice(2, 8)}
                onAdd={() => setCartCount((count) => count + 1)}
                savedItems={savedItems}
                onToggleSaved={toggleSaved}
              />
              <ProductSection
                title="Find your next favourite"
                products={filteredProducts.slice(6, 12)}
                accent
                onAdd={() => setCartCount((count) => count + 1)}
                savedItems={savedItems}
                onToggleSaved={toggleSaved}
              />
            </>
          )}
        </div>

        <section className="market-newsletter">
          <div className="newsletter-mark"><Sparkles aria-hidden="true" size={22} /></div>
          <div><h2>Spaci<span>More</span></h2></div>
          <Link href="/signup">Safety</Link>
          <Link href="/signup"> Help </Link>
          <Link href="/signup">Contact </Link>
        </section>
      </main>

      <footer className="market-footer">
        <div className="market-container">
         
          
          <div className="footer-bottom"><span>© SpaciMore. Made for your everyday.</span><span>Secure shopping · Easy returns · Here to help</span></div>
        </div>
      </footer>

      <nav className="mobile-market-nav" aria-label="Mobile navigation">
        <a className="mobile-nav-active" href="#"><House aria-hidden="true" size={19} />Home</a>
        <button onClick={() => document.querySelector(".market-search input")?.scrollIntoView({ behavior: "smooth", block: "center" })} type="button"><Search aria-hidden="true" size={19} />Search</button>
        <a href="#popular"><Heart aria-hidden="true" size={19} />Discover</a>
        <Link href={signedInUser ? "/dashboard" : "/login"}><UserRound aria-hidden="true" size={19} />Account</Link>
      </nav>
    </div>
  );
}
