import Link from "next/link";
import { SignUpForm } from "@/components/auth-forms";
import { BrandLink } from "@/components/brand-link";
import "../login/login.css";

export default function SignupPage() {
  return (
    <main className="login-page signup-page">
      <section className="login-panel" aria-labelledby="signup-title">
        <BrandLink className="login-brand" />

        <div className="login-content">
          <span className="login-eyebrow">A GOOD PLACE TO START</span>
          <SignUpForm />
          <p className="auth-switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>

        <p className="login-copyright">© SPACIMORE</p>
      </section>

      <aside className="login-story" aria-label="A quieter kind of progress">
        <span className="story-eyebrow">Your Preferred Marketplace</span>
        <div className="story-copy">
          <h2>Buy, sell and grow<br />together.</h2>
          
        </div>
        <div className="story-art" aria-hidden="true">
          <span className="story-orbit story-orbit-one" />
          <span className="story-orbit story-orbit-two" />
         
        </div>
        {/* <span className="story-footer">TAKE IT AT YOUR PACE</span> */}
        {/* <span className="story-index">01 — 01</span> */}
      </aside>
    </main>
  );
}
