import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="landing">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="SpaciMore home">
          <span className="brand-mark">f</span>
          <span>SpaciMore</span>
        </Link>
        <nav className="header-actions" aria-label="Main navigation">
          <Link className="nav-link" href="/login">Log in</Link>
          <Link className="button button-small" href="/signup">Get started <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> YOUR SPACE, SECURED</div>
          <h1>A calmer way<br />to <span>get things</span><br />in motion.</h1>
          <p className="hero-description">
            A thoughtful home for your work. Sign in securely and pick up right where you left off.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/signup">Create your account <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href="/login">Already have an account? <span>Log in</span></Link>
          </div>
          <div className="trust-note"><span className="shield-icon" aria-hidden="true">✓</span> Private by design. Securely powered by Supabase.</div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-glow" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-card">
            <div className="art-card-top"><span className="art-avatar">F</span><span className="art-card-label">YOUR WORKSPACE</span><span className="art-menu">···</span></div>
            <div className="art-greeting">Good things<br />take <em>shape.</em></div>
            <div className="art-progress"><span /><span /><span /><span /><span /></div>
            <div className="art-card-bottom"><span>YOUR NEXT CHAPTER</span><span>01 — 04</span></div>
          </div>
          <div className="floating-note note-top"><span className="note-check">✓</span><span>All in one place</span></div>
          <div className="floating-note note-bottom"><span className="note-lock">✳</span><span>Just for you</span></div>
          <div className="art-sparkle sparkle-one">✳</div>
          <div className="art-sparkle sparkle-two">✳</div>
          <div className="art-caption">A little more focus.<br />A lot more flow.</div>
        </div>
      </section>

      <footer className="landing-footer">
        <span>MADE FOR YOUR NEXT BIG THING</span>
        <span>© SpaciMore</span>
      </footer>
    </main>
  );
}
