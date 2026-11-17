"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
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
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
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
      </div>
      <FormFeedback state={state} />
      <button className="button auth-submit" type="submit" disabled={pending}>
        <Mail aria-hidden="true" size={15} />
        {pending ? "Signing in..." : "Sign in"}
        <ArrowRight aria-hidden="true" size={16} />
      </button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={action} className="auth-form">
      <EmailField />
      <PasswordField autoComplete="new-password" />
      <PasswordField id="confirmPassword" label="Confirm password" autoComplete="new-password" />
      <FormFeedback state={state} />
      <button className="button auth-submit" type="submit" disabled={pending}>
        <Mail aria-hidden="true" size={15} />
        {pending ? "Creating account..." : "Create account"}
        <ArrowRight aria-hidden="true" size={16} />
      </button>
    </form>
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
