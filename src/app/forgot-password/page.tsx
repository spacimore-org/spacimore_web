import { ResetPasswordForm } from "@/components/auth-forms";
import { PasswordRecoveryHeader, PasswordRecoveryLinks } from "@/components/password-recovery-layout";
import "../login/login.css";

export default function ForgotPasswordPage() {
  return (
    <main className="sign-in-page password-reset-page forgot-password-page">
      <section className="password-reset-content" aria-labelledby="reset-password-title">
        <PasswordRecoveryHeader />
        <h1 id="reset-password-title"><span>Forgot</span> Password</h1>
        <p className="password-reset-description">
          No worries! Enter your email address and we&apos;ll send you a reset link.
        </p>
        <ResetPasswordForm />
        <div className="password-recovery-divider"><span>or</span></div>
        <PasswordRecoveryLinks />
      </section>
    </main>
  );
}
