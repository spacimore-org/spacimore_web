import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, ShoppingBag, Store, UserRound } from "lucide-react";
import { BrandLink } from "@/components/brand-link";
import "./support.css";

export default function SupportPage() {
  return (
    <main className="support-page">
      <header className="support-header">
        <BrandLink className="support-brand" />
        <Link className="support-home" href="/"><ArrowLeft aria-hidden="true" size={17} /> Back to home</Link>
      </header>
      <div className="support-content">
        <div className="support-intro">
          <span>SPACIMORE HELP CENTER</span>
          <h1>How can we help?</h1>
          <p>Find help with your account, orders, or selling on SpaciMore.</p>
        </div>
        <section aria-labelledby="support-topics-title">
          <h2 id="support-topics-title">What do you need help with?</h2>
          <div className="support-topics">
            <a href="#account-help"><UserRound aria-hidden="true" /><strong>My account</strong><span>Login and password help</span></a>
            <a href="#order-help"><ShoppingBag aria-hidden="true" /><strong>Orders</strong><span>Questions about your purchases</span></a>
            <a href="#vendor-help"><Store aria-hidden="true" /><strong>Vendor support</strong><span>Help with selling</span></a>
          </div>
        </section>
        <section aria-labelledby="support-faq-title" className="support-faq">
          <h2 id="support-faq-title">Frequently asked questions</h2>
          <details id="account-help">
            <summary>How do I reset my password?</summary>
            <p>Request a password reset link using your account email on the <Link href="/forgot-password">forgot password page</Link>. Open the link in your email to choose a new password.</p>
          </details>
          <details>
            <summary>I can&apos;t access my account. What should I do?</summary>
            <p>Check that you are using the email address linked to your account. If you still need help, email our support team.</p>
          </details>
          <details id="order-help">
            <summary>How do I get help with an order?</summary>
            <p>Email our support team with your order number and a description of the issue. Please don&apos;t include passwords or verification codes.</p>
          </details>
          <details id="vendor-help">
            <summary>Where can vendors get help?</summary>
            <p>For help with your vendor account or selling, email our support team with a description of your question.</p>
          </details>
        </section>
        <section aria-labelledby="support-contact-title" className="support-contact">
          <MessageCircle aria-hidden="true" size={27} />
          <div>
            <h2 id="support-contact-title">Still need help?</h2>
            <p>Send us an email and describe how we can help.</p>
            <a className="support-email" href="mailto:support@spacimore.com"><Mail aria-hidden="true" size={18} /> support@spacimore.com</a>
          </div>
        </section>
      </div>
    </main>
  );
}
