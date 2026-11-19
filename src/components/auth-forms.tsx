"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ClipboardEvent } from "react";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
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
  resendEmailSignupOtpAction,
  signInAction,
  signUpAction,
  startSocialSignUpAction,
  updatePasswordAction,
  type AuthActionState,
  verifyEmailSignupOtpAction,
} from "@/app/actions";

const accountTypes = [
  { value: "customer", label: "Marketplace", description: "Shop and buy varieties of products or sell products to customer.", image: "/business.png" },
  { value: "service_provider", label: "Artisans", description: "Hire skilled & verified professionals or offer skilled services.", image: "/provider.png" },
  { value: "storage", label: "Storage", description: "Rent space for your business or lease storage space to tenants.", image: "/storage.png" },
  { value: "business", label: "Marketer", description: "Promote products/services and earn rewards on every sale.", image: "/affiliate.png" },
  { value: "agent", label: "Agent", description: "List, promote and manage offerings on behalf of businesses or individuals.", image: "/agent.png" },
] as const;

type AccountType = (typeof accountTypes)[number]["value"];
type AccountOption = "buyer" | "seller" | "book_service" | "provide_service" | "rent_space" | "lease_space";
const shopperCountryCodes = [
  { country: "Nigeria", code: "+234" },
  { country: "United States", code: "+1" },
  { country: "United Kingdom", code: "+44" },
  { country: "Ghana", code: "+233" },
  { country: "India", code: "+91" },
  { country: "United Arab Emirates", code: "+971" },
  { country: "South Africa", code: "+27" },
  { country: "Australia", code: "+61" },
  { country: "Kenya", code: "+254" },
  { country: "France", code: "+33" },
] as const;

type RoleOption = {
  value: AccountOption;
  label: string;
  description: string;
  icon: LucideIcon;
};

const roleOptions: Partial<Record<AccountType, RoleOption[]>> = {
  customer: [
    { value: "buyer", label: "Shopper", description: "I want to shop and buy products", icon: ShoppingCart },
    { value: "seller", label: "Vendor", description: "I want to sell goods on the platform", icon: Store },
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
      <label htmlFor="email">Email Address</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@spacimore.com" required />
    </div>
  );
}

function PasswordField({
  id = "password",
  label = "Create Password",
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

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="signup-provider-google" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.88c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.36 37.93 46.98 31.8 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.95 23.95 0 0 0 0 21.56l7.98-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" className="signup-provider-apple" viewBox="0 0 384 512">
      <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.8-44.6-35.6-2.8-74.5 20.8-88.8 20.8-15.1 0-49.5-19.8-76.6-19.8C62.5 141.2 0 187.1 0 281.1c0 27.8 5.1 56.5 15.3 86.1 13.6 38.9 62.7 134.2 114 132.7 24.2-.6 41.3-17.2 74.4-17.2 32.1 0 47.9 17.2 74.9 17.2 51.8-.8 96.2-87.4 109.2-126.4-69.3-32.7-69.1-102.8-69.1-104.8ZM262.5 104.5c27.4-32.5 24.9-62.4 24.1-73.2-24.2 1.4-52.2 16.5-68.1 34.6-17.5 19.5-27.8 43.6-25.6 70.7 26.2 2 50.1-11.4 69.6-32.1Z" />
    </svg>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initialState);
  const [socialState, socialAction, socialPending] = useActionState(
    startSocialSignUpAction,
    initialState,
  );
  const [selectedAccount, setSelectedAccount] = useState<AccountType>("customer");
  const [selectedOption, setSelectedOption] = useState<AccountOption | "">("");
  const [step, setStep] = useState<"account" | "option" | "credentials">("account");
  const [phoneNumber, setPhoneNumber] = useState("");
  const selectedAccountType = accountTypes.find(({ value }) => value === selectedAccount)!;
  const options = roleOptions[selectedAccount];
  const selectedRole = options?.find(({ value }) => value === selectedOption);
  const isBuyerSignup = selectedOption === "buyer";

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
      <h1
        className={
          step === "credentials" && isBuyerSignup
            ? "signup-shopper-heading"
            : step === "account"
            ? "signup-account-heading"
            : step === "option"
              ? "signup-option-heading"
              : undefined
        }
        id="signup-title"
      >
        {step === "credentials"
          ? isBuyerSignup
            ? "Create Shopper Account"
            : "Create your account"
          : step === "option"
            ? `How will you use ${selectedAccountType.label}?`
            : "How would you like to join?"}
      </h1>
      <p
        className={`login-description${step === "credentials" && isBuyerSignup ? " signup-shopper-description" : step === "account" ? " signup-account-description" : step === "option" ? " signup-option-description" : ""}`}
      >
        {step === "credentials"
          ? isBuyerSignup
            ? "Join SpaciMore to discover and shop from trusted sellers"
            : credentialsDescription
          : step === "option"
            ? "Choose the option that best describes you"
            : "Choose the account that fits you best"}
      </p>

      {step === "credentials" ? (
        <>
          <form action={action} className={`auth-form signup-credentials${isBuyerSignup ? " signup-buyer-credentials" : ""}`}>
            <input type="hidden" name="accountType" value={selectedAccount} />
            <input type="hidden" name="accountOption" value={selectedOption} />
            <button
              className="signup-back"
              onClick={() => setStep(options ? "option" : "account")}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={16} />
              {options ? "Change Selection" : "Go Back"}
            </button>
            {isBuyerSignup && (
              <div className="signup-name-fields">
                <div className="field">
                  <label htmlFor="firstName">First Name</label>
                  <input id="firstName" name="firstName" autoComplete="given-name" placeholder="Eg David" required />
                </div>
                <div className="field">
                  <label htmlFor="lastName">Last Name</label>
                  <input id="lastName" name="lastName" autoComplete="family-name" placeholder="Eg Smith" required />
                </div>
              </div>
            )}
            <EmailField />
            {isBuyerSignup && (
              <div className="field">
                <label htmlFor="phone">Phone Number</label>
                <div className="signup-phone-fields">
                  <select
                    aria-label="Country calling code"
                    autoComplete="tel-country-code"
                    defaultValue="+234"
                    name="phoneCountryCode"
                  >
                    {shopperCountryCodes.map(({ country, code }) => (
                      <option key={country} title={country} value={code}>{code}</option>
                    ))}
                  </select>
                  <input
                    autoComplete="tel-national"
                    id="phone"
                    inputMode="numeric"
                    maxLength={10}
                    name="phone"
                    onChange={(event) => setPhoneNumber(event.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
                    pattern="[0-9]{7,10}"
                    placeholder="Phone number"
                    required
                    type="tel"
                    value={phoneNumber}
                  />
                </div>
              </div>
            )}
            <PasswordField autoComplete="new-password" />
            <PasswordField id="confirmPassword" label="Confirm password" autoComplete="new-password" />
            <FormFeedback state={state} />
            <button
              className={`button auth-submit${isBuyerSignup ? " signup-shopper-submit" : ""}`}
              type="submit"
              disabled={pending}
            >
              {pending ? "Creating account..." : isBuyerSignup ? "Continue" : "Create account"}
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          </form>
          {isBuyerSignup && (
            <div className="signup-social">
              <div className="signup-social-divider"><span>or continue with</span></div>
              <form action={socialAction} className="signup-social-options">
                <button className="signup-social-button" name="provider" value="google" type="submit" disabled={socialPending}>
                  <GoogleMark />
                  {socialPending ? "Connecting..." : "Continue with Google"}
                </button>
                <button className="signup-social-button" name="provider" value="apple" type="submit" disabled={socialPending}>
                  <AppleMark />
                  {socialPending ? "Connecting..." : "Continue with Apple"}
                </button>
              </form>
              <FormFeedback state={socialState} />
            </div>
          )}
        </>
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
              <ChevronLeft aria-hidden="true" size={16} />
              Go Back
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
              className={`button auth-submit${step === "account" ? " signup-main-continue" : step === "option" ? " signup-option-continue" : ""}`}
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

export function VerifyAccountForm({ maskedEmail }: { maskedEmail: string }) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailSignupOtpAction,
    initialState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendEmailSignupOtpAction,
    initialState,
  );
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secondsRemaining === 0) return;
    const timer = window.setTimeout(
      () => setSecondsRemaining((seconds) => seconds - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [secondsRemaining]);

  useEffect(() => {
    if (!resendState.message) return;
    const timer = window.setTimeout(() => {
      setSecondsRemaining(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [resendState.message]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, position) => position === index ? digit : item));
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedDigits) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => pastedDigits[index] ?? ""));
    inputRefs.current[Math.min(pastedDigits.length, 5)]?.focus();
  }

  const code = digits.join("");

  return (
    <div className="verify-account-form">
      <form action={verifyAction} className="auth-form">
        <div className="verify-otp-inputs" onPaste={handlePaste} role="group" aria-label="6-digit verification code">
          {digits.map((digit, index) => (
            <input
              aria-label={`Verification code digit ${index + 1}`}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              className="verify-otp-digit"
              inputMode="numeric"
              key={index}
              maxLength={1}
              onChange={(event) => updateDigit(index, event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digits[index] && index > 0) {
                  inputRefs.current[index - 1]?.focus();
                }
                if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
                if (event.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
              }}
              ref={(element) => { inputRefs.current[index] = element; }}
              type="text"
              value={digit}
            />
          ))}
        </div>
        <input name="token" type="hidden" value={code} />
        <FormFeedback state={verifyState} />
        <button className="button auth-submit" type="submit" disabled={verifyPending || code.length !== 6}>
          {verifyPending ? "Verifying..." : "Verify account"}
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </form>

      <div className="verify-resend">
        <span>Didn’t receive the code?</span>
        {secondsRemaining > 0 ? (
          <span className="verify-resend-countdown">Resend in 0:{String(secondsRemaining).padStart(2, "0")}</span>
        ) : (
          <form action={resendAction}>
            <button className="verify-resend-button" type="submit" disabled={resendPending}>
              {resendPending ? "Sending..." : "Resend code"}
            </button>
          </form>
        )}
      </div>
      <FormFeedback state={resendState} />
      <p className="verify-email-hint">Code sent to <strong>{maskedEmail}</strong></p>
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
