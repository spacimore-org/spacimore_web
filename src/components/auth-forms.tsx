"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  Hammer,
  ShoppingCart,
  Store,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  type AuthActionState,
} from "@/app/actions";

const accountTypes = [
  { value: "customer", label: "Marketplace", description: "Shop or sell products", image: "/customer.png" },
  { value: "service_provider", label: "Artisans", description: "Book or provide skilled services", image: "/provider.png" },
  { value: "storage", label: "Storage", description: "Rent or lease storage space", image: "/storage.png" },
  { value: "business", label: "Marketer", description: "Market products and earn rewards", image: "/business.png" },
  { value: "agent", label: "Agent", description: "Act as an agent for houses and properties in Nigeria", image: "/agent.png" },
] as const;

type AccountType = (typeof accountTypes)[number]["value"];
type AccountOption = "buyer" | "seller" | "book_service" | "provide_service" | "rent_space" | "lease_space";

type RoleOption = {
  value: AccountOption;
  label: string;
  description: string;
  icon: LucideIcon;
};

const roleOptions: Partial<Record<AccountType, RoleOption[]>> = {
  customer: [
    { value: "buyer", label: "Buyer", description: "People who will buy goods on the platform", icon: ShoppingCart },
    { value: "seller", label: "Seller", description: "People who will sell goods on the platform", icon: Store },
  ],
  service_provider: [
    { value: "book_service", label: "Book Service", description: "People who book services from skilled work professionals", icon: Wrench },
    { value: "provide_service", label: "Provide Service", description: "Artisans and skilled professionals who offer services to people who need them", icon: Hammer },
  ],
  storage: [
    { value: "rent_space", label: "Rent a Space", description: "People looking to rent storage spaces, such as warehouses or stores", icon: Warehouse },
    { value: "lease_space", label: "Lease Space", description: "People who have spaces or stores they want to rent out", icon: Building2 },
  ],
};

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
  const [selectedAccount, setSelectedAccount] = useState<AccountType>("customer");
  const [selectedOption, setSelectedOption] = useState<AccountOption | "">("");
  const [step, setStep] = useState<"account" | "option" | "credentials">("account");
  const selectedAccountType = accountTypes.find(({ value }) => value === selectedAccount)!;
  const options = roleOptions[selectedAccount];
  const selectedRole = options?.find(({ value }) => value === selectedOption);

  function continueFromAccount() {
    if (roleOptions[selectedAccount]) {
      setStep("option");
      return;
    }
    setStep("credentials");
  }

  const credentialsDescription = selectedRole
    ? `You're joining as a ${selectedRole.label}`
    : selectedAccount === "business"
      ? "You're creating an Affiliate Marketing account"
      : selectedAccount === "agent"
        ? "You're creating an Agent account"
        : `You're creating a ${selectedAccountType.label} account`;

  return (
    <div className="signup-flow">
      <h1 id="signup-title">
        {step === "credentials"
          ? "Create your account"
          : step === "option"
            ? `How will you use ${selectedAccountType.label}?`
            : "How would you like to join?"}
      </h1>
      <p className="login-description">
        {step === "credentials"
          ? credentialsDescription
          : step === "option"
            ? "Choose the option that best describes you"
            : "Choose the account that fits you best"}
      </p>

      {step === "credentials" ? (
        <form action={action} className="auth-form signup-credentials">
          <input type="hidden" name="accountType" value={selectedAccount} />
          <input type="hidden" name="accountOption" value={selectedOption} />
          <button
            className="signup-back"
            onClick={() => setStep(options ? "option" : "account")}
            type="button"
          >
            ← {options ? "Change selection" : "Change account type"}
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
        <>
          {step === "option" && (
            <button
              className="signup-back signup-back-option"
              onClick={() => {
                setSelectedOption("");
                setStep("account");
              }}
              type="button"
            >
              ← Change account type
            </button>
          )}
          <div className="signup-selector">
            <fieldset className="account-options">
              <legend className="visually-hidden">
                {step === "option" ? `Choose a ${selectedAccountType.label} option` : "Choose an account type"}
              </legend>
              {step === "account"
                ? accountTypes.map(({ value, label, description, image }) => (
                    <label
                      className={`account-option${selectedAccount === value ? " is-selected" : ""}`}
                      key={value}
                    >
                      <input
                        checked={selectedAccount === value}
                        name="accountTypeChoice"
                        onChange={() => {
                          setSelectedAccount(value);
                          setSelectedOption("");
                        }}
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
                  ))
                : options?.map(({ value, label, description, icon: Icon }) => (
                    <label
                      className={`account-option${selectedOption === value ? " is-selected" : ""}`}
                      key={value}
                    >
                      <input
                        checked={selectedOption === value}
                        name="accountOptionChoice"
                        onChange={() => setSelectedOption(value)}
                        type="radio"
                        value={value}
                      />
                      <span className="account-avatar" aria-hidden="true">
                        <Icon size={38} strokeWidth={1.7} />
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
              className={`button auth-submit${step === "account" ? " signup-main-continue" : ""}`}
              onClick={step === "account" ? continueFromAccount : () => setStep("credentials")}
              disabled={step === "option" && !selectedOption}
              type="button"
            >
              Continue
              {step === "account"
                ? <ChevronRight aria-hidden="true" size={16} />
                : <ArrowRight aria-hidden="true" size={16} />}
            </button>
          </div>
        </>
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
