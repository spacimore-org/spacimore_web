import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth-forms";
import { BrandLink } from "@/components/brand-link";
import "../login/login.css";

export default function ForgotPasswordPage() {
  return (
    <main className="login-page sign-in-page reset-password-page">
      <section className="login-panel" aria-labelledby="reset-password-title">
        <BrandLink className="login-brand" />

        <div className="login-content">
          <h1 id="reset-password-title">Reset your password</h1>
          <p className="login-description">
            Enter the email address linked to your account and we’ll send you a reset link.
          </p>
          <ResetPasswordForm />
          <p className="auth-switch">
            Remembered it? <Link href="/login">Back to sign in</Link>
          </p>
        </div>

        <p className="login-copyright">© SPACIMORE</p>
      </section>

      <aside className="login-story" aria-label="preferred marketplace">
        <span className="story-eyebrow">Your Preferred Marketplace</span>
        <div className="story-copy">
          <h2>Buy, sell and grow<br />together.</h2>
        </div>
        <div className="story-art" aria-hidden="true">
          <span className="story-orbit story-orbit-one" />
          <span className="story-orbit story-orbit-two" />
        </div>
      </aside>
    </main>
  );
}
