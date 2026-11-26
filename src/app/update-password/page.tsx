import Link from "next/link";
import { isAuthSessionMissingError } from "@supabase/auth-js";
import { UpdatePasswordForm } from "@/components/auth-forms";
import { BrandLink } from "@/components/brand-link";
import { PasswordRecoveryHeader, PasswordRecoveryLinks } from "@/components/password-recovery-layout";
import { createClient } from "@/lib/supabase/server";
import "../login/login.css";

export const instant = false;

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error && !isAuthSessionMissingError(error)) {
    throw error;
  }

  if (!data.user) {
    return (
      <main className="login-page sign-in-page update-password-page">
        <section className="login-panel" aria-labelledby="update-password-title">
          <BrandLink className="login-brand" />

          <div className="login-content">
            <h1 id="update-password-title">This link has expired</h1>
            <p className="login-description">
              Password reset links can only be used once. Request a fresh link to continue.
            </p>
            <Link className="button auth-submit" href="/forgot-password">
              Request a new link <span aria-hidden="true">↗</span>
            </Link>
            <p className="auth-switch">
              Remembered your password? <Link href="/login">Back to sign in</Link>
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

  return (
    <main className="sign-in-page password-reset-page">
      <section className="password-reset-content" aria-labelledby="update-password-title">
        <PasswordRecoveryHeader />
        <h1 id="update-password-title"><span>Reset</span> Password</h1>
        <p className="password-reset-description">Enter your new password below</p>
        <UpdatePasswordForm />
        <PasswordRecoveryLinks />
      </section>
    </main>
  );
}
