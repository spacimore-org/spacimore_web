import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLink } from "@/components/brand-link";

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
        <BrandLink className="brand auth-brand" />
        <h1 id="auth-title">{title}</h1>
        <p className="auth-intro">{description}</p>
        {children}
        {footer}
      </section>
    </main>
  );
}
