import Link from "next/link";
import { Sprout } from "lucide-react";
import { SignUpForm } from "@/components/auth-forms";
import "../login/login.css";

export default function SignupPage() {
  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="signup-title">
        <Link className="login-brand" href="/" aria-label="SpaciMore home">
          <span className="login-brand-mark"><Sprout aria-hidden="true" size={20} /></span>
          <span>SpaciMore</span>
        </Link>

        <div className="login-content">
          <span className="login-eyebrow">A GOOD PLACE TO START</span>
          <h1 id="signup-title">Join SpaciMore</h1>
          <p className="login-description">Create an account and make room for good things.</p>
          <SignUpForm />
          <p className="auth-switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>

        <p className="login-copyright">© SPACIMORE</p>
      </section>

      <aside className="login-story" aria-label="A quieter kind of progress">
        <span className="story-eyebrow">A QUIETER KIND OF PROGRESS</span>
        <div className="story-copy">
          <h2>Make room for<br />what matters.</h2>
          <p>A little space to gather your thoughts and begin<br className="desktop-break" /> again, whenever you need.</p>
        </div>
        <div className="story-art" aria-hidden="true">
          <span className="story-orbit story-orbit-one" />
          <span className="story-orbit story-orbit-two" />
          <span className="story-leaf" />
        </div>
        <span className="story-footer">TAKE IT AT YOUR PACE</span>
        <span className="story-index">01 — 01</span>
      </aside>
    </main>
  );
}
