import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="auth-page">
      <Link className="auth-back" href="/">← Back to home</Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="brand auth-brand" href="/" aria-label="SpaciMore home">
          <span className="brand-mark">f</span>
          <span>SpaciMore</span>
        </Link>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-intro">{description}</p>
        {children}
        {footer}
      </section>
    </main>
  );
}
