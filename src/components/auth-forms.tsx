"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, ChevronRight, Eye, EyeOff } from "lucide-react";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  type AuthActionState,
} from "@/app/actions";

const initialState: AuthActionState = {};

function FormFeedback({ state }: { state: AuthActionState }) {
  if (state.error) {
    return <p className="form-message form-message-error" role="alert">{state.error}</p>;
  }
  if (state.message) {
    return <p className="form-message form-message-success" role="status">{state.message}</p>;
  }
  return null;
}

function EmailField() {
  return (
    <div className="field">
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
    </div>
  );
}

function PasswordField({
  id = "password",
  label = "Password",
  autoComplete = "current-password",
}: {
  id?: string;
  label?: string;
  autoComplete?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} type="password" autoComplete={autoComplete} minLength={8} required />
    </div>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="auth-form">
      <EmailField />
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="login-password-wrap">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="At least 8 characters"
            required
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="login-password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
          </button>
        </div>
        <Link className="forgot-password-link" href="/forgot-password">Forgot password?</Link>
      </div>
      <FormFeedback state={state} />
      <button className="button auth-submit" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Continue"}
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initialState);
  const [selectedAccount, setSelectedAccount] = useState("customer");
  const [showCredentials, setShowCredentials] = useState(false);

  const accountTypes = [
    { value: "customer", label: "Marketplace", description: "Shop or sell products", image: "/customer.png" },
     { value: "service_provider", label: "Artisans", description: "Offer or acquire verified services", image: "/provider.png" },
    { value: "storage", label: "Storage", description: "Rent or lease storage space", image: "/storage.png" },
     { value: "business", label: "Marketer", description: "Market products and earn rewards", image: "/business.png" },
    { value: "agent", label: "Agent", description: "earn commissions on sales", image: "/agent.png" },
    
  ];
  const selectedLabel = accountTypes.find(({ value }) => value === selectedAccount)?.label ?? "Customer";

  return (
    <div className="signup-flow">
      <h1 id="signup-title">
        {showCredentials ? "Create your account" : "How would you like to join?"}
      </h1>
      <p className="login-description">
        {showCredentials
          ? `You're joining as a ${selectedLabel}`
          : "Choose the account that fits you best"}
      </p>

      {showCredentials ? (
        <form action={action} className="auth-form signup-credentials">
          <input type="hidden" name="accountType" value={selectedAccount} />
          <button
            className="signup-back"
            onClick={() => setShowCredentials(false)}
            type="button"
          >
            ← Change account type
          </button>
          <EmailField />
          <PasswordField autoComplete="new-password" />
          <PasswordField id="confirmPassword" label="Confirm password" autoComplete="new-password" />
          <FormFeedback state={state} />
          <button className="button auth-submit" type="submit" disabled={pending}>
            {pending ? "Creating account..." : "Create account"}
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </form>
      ) : (
        <div className="signup-selector">
          <fieldset className="account-options">
            <legend className="visually-hidden">Choose an account type</legend>
            {accountTypes.map(({ value, label, description, image }) => (
              <label
                className={`account-option${selectedAccount === value ? " is-selected" : ""}`}
                key={value}
              >
                <input
                  checked={selectedAccount === value}
                  name="accountTypeChoice"
                  onChange={() => setSelectedAccount(value)}
                  type="radio"
                  value={value}
                />
                <span className="account-avatar" aria-hidden="true">
                  <Image src={image} alt="" width={512} height={512} />
                </span>
                <span className="account-option-copy">
                  <span className="account-option-title">{label}</span>
                  <span className="account-option-description">{description}</span>
                </span>
                <span className="account-radio" aria-hidden="true" />
              </label>
            ))}
          </fieldset>
          <button
            className="button auth-submit"
            onClick={() => setShowCredentials(true)}
            type="button"
          >
            Continue
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={action} className="auth-form">
      <EmailField />
      <FormFeedback state={state} />
      <button className="button auth-submit" type="submit" disabled={pending}>
        {pending ? "Sending link..." : "Send reset link"} <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <form action={action} className="auth-form">
      <PasswordField id="password" label="New password" autoComplete="new-password" />
      <PasswordField id="confirmPassword" label="Confirm new password" autoComplete="new-password" />
      <FormFeedback state={state} />
      <button className="button auth-submit" type="submit" disabled={pending}>
        {pending ? "Updating password..." : "Update password"} <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
