import Link from "next/link";
import { cookies } from "next/headers";
import { Sprout } from "lucide-react";
import { VerifyAccountForm } from "@/components/auth-forms";
import "../login/login.css";

export const instant = false;

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name[0]}${"•".repeat(Math.min(Math.max(name.length - 1, 3), 6))}@${domain}`;
}

export default async function VerifyAccountPage() {
  const cookieStore = await cookies();
  const email = cookieStore.get("pending_email_verification")?.value;

  return (
    <main className="login-page sign-in-page verify-page">
      <section className="login-panel" aria-labelledby="verify-account-title">
        <Link className="login-brand" href="/" aria-label="SpaciMore home">
          <span className="login-brand-mark"><Sprout aria-hidden="true" size={20} /></span>
          <span>SpaciMore</span>
        </Link>

        <div className="login-content">
          {email ? (
            <>
              <h1 id="verify-account-title">Verify your account</h1>
              <p className="login-description">
                Enter the 6-digit code sent to your email address.
              </p>
              <VerifyAccountForm maskedEmail={maskEmail(email)} />
            </>
          ) : (
            <>
              <h1 id="verify-account-title">Verification link expired</h1>
              <p className="login-description">
                Start signup again to request a new verification code.
              </p>
              <Link className="button auth-submit" href="/signup">
                Back to sign up
              </Link>
            </>
          )}
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
