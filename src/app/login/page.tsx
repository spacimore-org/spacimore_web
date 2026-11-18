import Link from "next/link";
import { Sprout } from "lucide-react";
import { SignInForm } from "@/components/auth-forms";
import "./login.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const instant = false;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <Link className="login-brand" href="/" aria-label="SpaciMore home">
          <span className="login-brand-mark"><Sprout aria-hidden="true" size={20} /></span>
          <span>SpaciMore</span>
        </Link>

        <div className="login-content">
          <span className="login-eyebrow">A PLACE TO BEGIN AGAIN</span>
          <h1 id="login-title">Welcome To SpaciMore</h1>
          <p className="login-description">Pick up where you left off.</p>
          {error === "callback" && (
            <p className="form-message form-message-error" role="alert">
              That confirmation link is invalid or has expired. Please try again.
            </p>
          )}
          <SignInForm />
          <p className="auth-switch">
            New around here? <Link href="/signup">Create an account</Link>
          </p>
        </div>

        <p className="login-copyright">© SPACIMORE</p>
      </section>

      <aside className="login-story" aria-label="preferred marketplace">
        <span className="story-eyebrow">Preferred Marketplace</span>
        <div className="story-copy">
          <h2>Buy, sell and grow<br />together.</h2>
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
