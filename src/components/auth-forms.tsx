"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Hammer,
  LockKeyhole,
  Mail,
  Share2,
  ShoppingCart,
  Store,
  UsersRound,
  UserRound,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { BrandLink } from "@/components/brand-link";
import { VendorWelcome } from "@/components/vendor-welcome";
import { VendorSignupForm } from "@/components/vendor-signup-form";
import { getResetPasswordRequirements } from "@/lib/reset-password";
import {
  requestPasswordResetAction,
  resendEmailSignupOtpAction,
  signInAction,
  startSocialSignInAction,
  signUpAction,
  startSocialSignUpAction,
  updatePasswordAction,
  type AuthActionState,
  verifyEmailSignupOtpAction,
  vendorSignUpAction,
} from "@/app/actions";

const accountTypes = [
  { value: "customer", label: "Marketplace", description: "Shop from stores or sell products to customers.", icon: Store },
  { value: "service_provider", label: "Artisans", description: "Offer your services and get clients.", icon: Hammer },
  { value: "storage", label: "Storage", description: "Offer your services and get clients.", icon: Warehouse },
  { value: "business", label: "Marketers", description: "Offer your services and get clients.", icon: Share2 },
  { value: "agent", label: "Agents", description: "List and manage properties for businesses or individuals.", icon: UsersRound },
] as const;

type AccountType = (typeof accountTypes)[number]["value"];
type AccountOption = "buyer" | "seller" | "book_service" | "provide_service" | "rent_space" | "lease_space";
type SellerType = "individual" | "business";
type VendorCredentials = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  password: string;
  confirmPassword: string;
};
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

function EmailField({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <div className="field">
      <label htmlFor="email">Email Address</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@spacimore.com" defaultValue={defaultValue} required />
    </div>
  );
}

function PasswordField({
  id = "password",
  label = "Create Password",
  autoComplete = "current-password",
  placeholder = "Enter your password",
  showRequirements = false,
  minLength = 8,
  initialValue = "",
}: {
  id?: string;
  label?: string;
  autoComplete?: string;
  placeholder?: string;
  showRequirements?: boolean;
  minLength?: number;
  initialValue?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const requirements = [
    { label: "At least 12 characters", satisfied: password.length >= 12 },
    { label: "An uppercase letter", satisfied: /[A-Z]/.test(password) },
    { label: "A lowercase letter", satisfied: /[a-z]/.test(password) },
    { label: "A number", satisfied: /\d/.test(password) },
    { label: "A special character", satisfied: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className={`field${showRequirements ? " signup-password-field" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="login-password-wrap">
        <input
          autoComplete={autoComplete}
          id={id}
          minLength={minLength}
          name={id}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => setPassword(event.currentTarget.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          required
          type={showPassword ? "text" : "password"}
          value={password}
        />
        <button
          aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={showPassword}
          className="login-password-toggle"
          onClick={() => setShowPassword((visible) => !visible)}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          {showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
        </button>
      </div>
      {showRequirements && isFocused && (
        <div className="signup-password-requirements">
          <strong>Your password must contain:</strong>
          <ul>
            {requirements.map(({ label: requirement, satisfied }) => (
              <li className={satisfied ? "is-satisfied" : ""} key={requirement}>
                <span aria-hidden="true" className="signup-password-requirement-icon">
                  {satisfied ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                {requirement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SignInForm() {
  const [loginRole, setLoginRole] = useState<"buyer" | "seller">("buyer");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailState, emailAction, emailPending] = useActionState(signInAction, initialState);
  const [socialState, socialAction, socialPending] = useActionState(
    startSocialSignInAction,
    initialState,
  );

  return (
    <div className="signin-form-wrap">
      <div aria-label="Choose account type" className="signin-method-toggle" role="group">
        <button
          aria-pressed={loginRole === "seller"}
          className={loginRole === "seller" ? "is-active" : ""}
          onClick={() => setLoginRole("seller")}
          type="button"
        >
          <Store aria-hidden="true" size={19} />
          Vendor Login
        </button>
        <button
          aria-pressed={loginRole === "buyer"}
          className={loginRole === "buyer" ? "is-active" : ""}
          onClick={() => setLoginRole("buyer")}
          type="button"
        >
          <UserRound aria-hidden="true" size={19} />
          Customer Login
        </button>
      </div>

        <div className="signin-email-stage">
          <form action={emailAction} className="auth-form signin-auth-form">
            <div className="field">
              <label htmlFor="email">Email Address <b>*</b></label>
              <div className="signin-input-wrap">
                <Mail aria-hidden="true" size={21} />
                <input
                  autoComplete="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  type="email"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Password <b>*</b></label>
              <div className="signin-input-wrap">
                <LockKeyhole aria-hidden="true" size={20} />
                <input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="signin-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
                </button>
              </div>
            </div>
            <div className="signin-form-options">
              <label className="signin-remember">
                <input checked={remember} name="remember" onChange={(event) => setRemember(event.currentTarget.checked)} type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password">Forgot Password?</Link>
            </div>
            <FormFeedback state={emailState} />
            <button className="button auth-submit" type="submit" disabled={emailPending}>
              {emailPending ? "Signing in..." : "Login in"}
            </button>
          </form>
          <FormFeedback state={socialState} />
          <div className="signin-divider"><span>or continue with</span></div>
          <form action={socialAction} className="signin-social-options">
            {remember && <input name="remember" type="hidden" value="on" />}
            <button className="signin-social-button" name="provider" value="google" type="submit" disabled={socialPending}>
              <GoogleMark />
              Continue with Google
            </button>
            <button className="signin-social-button" name="provider" value="apple" type="submit" disabled={socialPending}>
              <AppleMark />
              Continue with Apple
            </button>
          </form>
        </div>
      <p className="auth-switch">
        Don&apos;t have an account?{" "}
        <Link href={`/signup?role=${loginRole}`}>Register as a {loginRole === "buyer" ? "customer" : "vendor"}</Link>
      </p>
    </div>
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

export function SignUpForm({ initialRole }: { initialRole?: "buyer" | "seller" }) {
  const [state, action, pending] = useActionState(signUpAction, initialState);
  const [vendorState, vendorAction, vendorPending] = useActionState(
    vendorSignUpAction,
    initialState,
  );
  const [socialState, socialAction, socialPending] = useActionState(
    startSocialSignUpAction,
    initialState,
  );
  const [selectedAccount, setSelectedAccount] = useState<AccountType>("customer");
  const [selectedOption, setSelectedOption] = useState<AccountOption | "">(initialRole ?? "");
  const [step, setStep] = useState<
    "account" | "option" | "credentials" | "vendorWelcome" | "sellerType" | "sellerDetails"
  >(initialRole === "seller" ? "vendorWelcome" : initialRole ? "credentials" : "account");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+234");
  const [buyerSignupStage, setBuyerSignupStage] = useState(1);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [profilePhotoError, setProfilePhotoError] = useState("");
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const personalInfoRef = useRef<HTMLFieldSetElement>(null);
  const contactInfoRef = useRef<HTMLFieldSetElement>(null);
  const securityInfoRef = useRef<HTMLFieldSetElement>(null);
  const [sellerType, setSellerType] = useState<SellerType | "">("");
  const [vendorCredentials, setVendorCredentials] = useState<VendorCredentials | null>(null);
  const selectedAccountType = accountTypes.find(({ value }) => value === selectedAccount)!;
  const options = roleOptions[selectedAccount];
  const selectedRole = options?.find(({ value }) => value === selectedOption);
  const isBuyerSignup = selectedOption === "buyer";
  const isVendorSignup = selectedOption === "seller";
  const isMarketplaceRoleSignup = isBuyerSignup || isVendorSignup;

  useEffect(() => {
    return () => {
      if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
    };
  }, [profilePhotoPreview]);

  function clearProfilePhoto() {
    if (profilePhotoRef.current) {
      profilePhotoRef.current.value = "";
      profilePhotoRef.current.setCustomValidity("");
    }
    setProfilePhotoPreview("");
    setProfilePhotoError("");
  }

  function chooseAccount(accountType: AccountType) {
    setSelectedAccount(accountType);
    setSelectedOption(accountType === "customer" ? "buyer" : "");
    if (roleOptions[accountType]) {
      setStep("option");
      return;
    }
    setStep("credentials");
  }

  function continueVendorCredentials(event: FormEvent<HTMLFormElement>) {
    if (!isVendorSignup) return;
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setVendorCredentials({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      phoneCountryCode: String(formData.get("phoneCountryCode") ?? "+234"),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    setStep("sellerDetails");
  }

  function continueBuyerSignup() {
    const activeStep = [
      personalInfoRef.current,
      contactInfoRef.current,
      securityInfoRef.current,
    ][buyerSignupStage - 1];
    const invalidControl =
      activeStep?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        ":invalid",
      );
    if (invalidControl) {
      invalidControl.reportValidity();
      return;
    }
    setBuyerSignupStage((current) => Math.min(current + 1, 3));
  }

  function validateBuyerSignup(event: FormEvent<HTMLFormElement>) {
    if (!isBuyerSignup) return;
    const stepRefs = [
      personalInfoRef.current,
      contactInfoRef.current,
      securityInfoRef.current,
    ];
    const invalidStep = stepRefs.findIndex((fieldset) =>
      fieldset?.querySelector(":invalid"),
    );
    if (invalidStep === -1) return;
    event.preventDefault();
    setBuyerSignupStage(invalidStep + 1);
    requestAnimationFrame(() => {
      const fieldset = [
        personalInfoRef.current,
        contactInfoRef.current,
        securityInfoRef.current,
      ][invalidStep];
      const invalidControl =
        fieldset?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          ":invalid",
        );
      invalidControl?.focus();
      invalidControl?.reportValidity();
    });
  }

  const credentialsDescription = selectedRole
    ? `You're joining as a ${selectedRole.label}`
    : selectedAccount === "business"
      ? "You're creating an Affiliate Marketing account"
      : selectedAccount === "agent"
        ? "You're creating an Agent account"
        : `You're creating a ${selectedAccountType.label} account`;

  return (
    <div
      className={`signup-flow${step === "account" ? " signup-account-stage" : ""}${step === "option" && selectedAccount === "customer" ? " signup-marketplace-option-stage" : ""}${step === "sellerType" ? " signup-vendor-category-stage" : ""}`}
    >
      {step === "account" && (
        <header className="signup-account-header">
          <span aria-hidden="true" />
          <BrandLink className="signup-account-brand" />
          <Link className="signup-account-back" href="/">
            <ArrowLeft aria-hidden="true" size={17} />
            <span>Back to home</span>
          </Link>
        </header>
      )}
      {step === "option" && selectedAccount === "customer" && (
        <div className="signup-marketplace-visual">
          <div className="signup-marketplace-header">
            <button
              aria-label="Go back to account selection"
              className="signup-back signup-marketplace-back"
              onClick={() => {
                setSelectedOption("");
                setStep("account");
              }}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={20} />
              <span className="signup-marketplace-back-label">Go Back</span>
            </button>
            <Image
              alt="MarketPlace: Shop, Sell, Grow"
              className="signup-marketplace-logo"
              height={110}
              src="/header.png"
              width={344}
            />
            <span aria-hidden="true" />
          </div>
          <Image
            alt="A shopper carrying bags and using her phone"
            className="signup-marketplace-illustration"
            height={425}
            src="/marketplace.png"
            width={587}
          />
        </div>
      )}
      {step === "sellerType" && (
        <div className="signup-vendor-category-visual">
          <div className="signup-vendor-category-header">
            <button aria-label="Back to Marketplace selection" className="signup-shopper-back" onClick={() => setStep("option")} type="button">
              <ChevronLeft aria-hidden="true" size={24} />
            </button>
            <Image alt="MarketPlace: Shop, Sell, Grow" className="signup-vendor-category-logo" height={110} src="/header.png" width={344} />
          </div>
          <Image alt="" aria-hidden="true" className="signup-vendor-category-illustration" height={202} src="/vendor-category-illustration.png" width={370} />
        </div>
      )}
      <h1
        className={
          step === "credentials" && isMarketplaceRoleSignup
            ? "signup-shopper-heading"
            : step === "account"
            ? "signup-account-heading"
            : step === "option" && selectedAccount === "customer"
              ? "signup-marketplace-option-heading"
            : step === "sellerType"
              ? "signup-vendor-category-heading"
            : step === "option" || step === "sellerDetails"
              ? "signup-option-heading"
              : undefined
        }
        id="signup-title"
      >
        {step === "option" && selectedAccount === "customer" ? (
          <>How would you<br /><span>like to join?</span></>
        ) : step === "credentials"
          ? isBuyerSignup
            ? "Create Shopper Account"
            : isVendorSignup
              ? "Create Vendor Account"
            : "Create your account"
          : step === "sellerType"
            ? <>Vendor <span>Category</span></>
            : step === "sellerDetails"
              ? sellerType === "individual"
                ? "Individual seller details"
                : "Registered business details"
          : step === "option"
            ? `How will you use ${selectedAccountType.label}?`
            : "How would you like to join?"}
      </h1>
      {!(step === "option" && selectedAccount === "customer") && (
        <p
          className={`login-description${step === "credentials" && isMarketplaceRoleSignup ? " signup-shopper-description" : step === "account" ? " signup-account-description" : step === "option" || step === "sellerType" || step === "sellerDetails" ? " signup-option-description" : ""}`}
        >
          {step === "credentials"
            ? isBuyerSignup
              ? "Join SpaciMore to discover and shop from trusted sellers"
              : isVendorSignup
                ? "Create your account to start selling on SpaciMore"
                : credentialsDescription
            : step === "sellerType"
              ? "Choose your vendor seller category"
              : step === "sellerDetails"
                ? sellerType === "individual"
                  ? "Enter your legal details for your individual seller account"
                  : "Enter your registered business and contact details"
                : step === "option"
                  ? "Choose the option that best describes you"
                  : "Choose your role to get started"}
        </p>
      )}

      {step === "credentials" ? (
        isBuyerSignup ? (
          <div className="signup-shopper-wizard">
            <div className="signup-shopper-header">
              <button
                aria-label={buyerSignupStage === 1 ? "Back to account type" : "Previous signup step"}
                className="signup-shopper-back"
                onClick={() => {
                  if (buyerSignupStage > 1) {
                    setBuyerSignupStage((current) => current - 1);
                  } else {
                    setStep("option");
                  }
                }}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={26} />
              </button>
              <Image
                alt="MarketPlace: Shop, Sell, Grow"
                className="signup-shopper-logo"
                height={110}
                src="/header.png"
                width={344}
              />
            </div>

            <ol aria-label="Signup progress" className="signup-progress">
              {["Personal Info", "Contact Info", "Security", "Verify"].map((label, index) => {
                const stage = index + 1;
                const isComplete = stage < buyerSignupStage;
                const isCurrent = stage === buyerSignupStage;
                return (
                  <li
                    aria-current={isCurrent ? "step" : undefined}
                    className={isCurrent ? "is-current" : isComplete ? "is-complete" : ""}
                    key={label}
                  >
                    <span className="signup-progress-marker">
                      {isComplete ? <Check aria-hidden="true" size={15} strokeWidth={3} /> : stage}
                    </span>
                    <span className="signup-progress-label">{label}</span>
                  </li>
                );
              })}
            </ol>

            <form
              action={action}
              className="signup-shopper-form"
              noValidate
              onSubmit={validateBuyerSignup}
            >
              <input name="accountType" type="hidden" value={selectedAccount} />
              <input name="accountOption" type="hidden" value={selectedOption} />

              <fieldset
                className="signup-shopper-step signup-shopper-personal"
                hidden={buyerSignupStage !== 1}
                ref={personalInfoRef}
              >
                <legend className="visually-hidden">Personal information</legend>
                <h1 className="signup-shopper-title">
                  Create <span>Your Account</span>
                </h1>
                <p className="signup-shopper-description">
                  Let&apos;s get started, tell us a little bit about yourself
                </p>

                <div className="signup-photo-field">
                  <label className="signup-photo-upload" htmlFor="profilePhoto">
                    <input
                      accept="image/jpeg,image/png"
                      aria-describedby={profilePhotoError ? "profilePhotoHelp profilePhotoError" : "profilePhotoHelp"}
                      id="profilePhoto"
                      name="profilePhoto"
                      onChange={(event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        const error = file && (!["image/jpeg", "image/png"].includes(file.type) || file.size === 0 || file.size > 2 * 1024 * 1024)
                          ? "Choose a JPG or PNG image no larger than 2 MB."
                          : "";
                        input.setCustomValidity(error);
                        setProfilePhotoError(error);
                        setProfilePhotoPreview(file && !error ? URL.createObjectURL(file) : "");
                      }}
                      ref={profilePhotoRef}
                      type="file"
                    />
                    <span className="signup-photo-avatar">
                      {profilePhotoPreview ? (
                        <Image alt="" height={68} src={profilePhotoPreview} unoptimized width={68} />
                      ) : (
                        <UserRound aria-hidden="true" size={40} strokeWidth={2.5} />
                      )}
                      <span className="signup-photo-camera"><Camera aria-hidden="true" size={14} /></span>
                    </span>
                    <span>Tap to upload Photo</span>
                    <small id="profilePhotoHelp">JPG, PNG (Max 2MB) · Optional</small>
                  </label>
                  {profilePhotoError && <p className="signup-photo-error" id="profilePhotoError" role="alert">{profilePhotoError}</p>}
                  {(profilePhotoPreview || profilePhotoError) && (
                    <button className="signup-photo-remove" onClick={clearProfilePhoto} type="button">Remove photo</button>
                  )}
                </div>

                <div className="signup-shopper-field">
                  <label htmlFor="buyerFirstName">First Name <b>*</b></label>
                  <div className="signup-shopper-input">
                    <input
                      autoComplete="given-name"
                      defaultValue=""
                      id="buyerFirstName"
                      name="firstName"
                      required
                    />
                  </div>
                </div>
                <div className="signup-shopper-field">
                  <label htmlFor="buyerLastName">Last Name <b>*</b></label>
                  <div className="signup-shopper-input">
                    <input
                      autoComplete="family-name"
                      id="buyerLastName"
                      name="lastName"
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset
                className="signup-shopper-step"
                hidden={buyerSignupStage !== 2}
                ref={contactInfoRef}
              >
                <legend className="visually-hidden">Contact information</legend>
                <h1 className="signup-shopper-title">Contact <span>Info</span></h1>
                <p className="signup-shopper-description">How can we reach you?</p>
                <EmailField />
                <div className="field">
                  <label htmlFor="phone">Phone Number <b>*</b></label>
                  <div className="signup-phone-fields">
                    <select
                      aria-label="Country calling code"
                      autoComplete="tel-country-code"
                      name="phoneCountryCode"
                      onChange={(event) => setPhoneCountryCode(event.currentTarget.value)}
                      value={phoneCountryCode}
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
              </fieldset>

              <fieldset
                className="signup-shopper-step"
                hidden={buyerSignupStage !== 3}
                ref={securityInfoRef}
              >
                <legend className="visually-hidden">Security</legend>
                <h1 className="signup-shopper-title">Secure <span>Your Account</span></h1>
                <p className="signup-shopper-description">Create a password to protect your account.</p>
                <PasswordField
                  autoComplete="new-password"
                  minLength={12}
                  placeholder="At least 12 characters"
                  showRequirements
                />
                <PasswordField
                  autoComplete="new-password"
                  id="confirmPassword"
                  label="Confirm password"
                  minLength={12}
                  placeholder="Re-enter your password"
                />
                <FormFeedback state={state} />
              </fieldset>

              {buyerSignupStage < 3 ? (
                <button
                  className="button auth-submit signup-shopper-submit"
                  onClick={continueBuyerSignup}
                  type="button"
                >
                  Continue {buyerSignupStage !== 1 && <ArrowRight aria-hidden="true" size={18} />}
                </button>
              ) : (
                <button
                  className="button auth-submit signup-shopper-submit"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? "Creating account..." : "Continue"}
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              )}
            </form>

            {buyerSignupStage === 3 && (
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
          </div>
        ) : (
        <div className="signup-credentials-stage">
          {isVendorSignup ? (
            <VendorSignupForm
              isPending={pending}
              error={state.error}
            />
          ) : (
            <>
          <form
            action={action}
            className={`auth-form signup-credentials${isMarketplaceRoleSignup ? " signup-buyer-credentials" : ""}`}
          >
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
            {isMarketplaceRoleSignup && (
              <div className="signup-name-fields">
                <div className="field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    autoComplete="given-name"
                    defaultValue={vendorCredentials?.firstName ?? ""}
                    id="firstName"
                    name="firstName"
                    placeholder="Eg David"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    autoComplete="family-name"
                    defaultValue={vendorCredentials?.lastName ?? ""}
                    id="lastName"
                    name="lastName"
                    placeholder="Eg Smith"
                    required
                  />
                </div>
              </div>
            )}
            <EmailField defaultValue={vendorCredentials?.email ?? ""} />
            {isMarketplaceRoleSignup && (
              <div className="field">
                <label htmlFor="phone">Phone Number</label>
                <div className="signup-phone-fields">
                  <select
                    aria-label="Country calling code"
                    autoComplete="tel-country-code"
                    onChange={(event) => setPhoneCountryCode(event.currentTarget.value)}
                    name="phoneCountryCode"
                    value={phoneCountryCode}
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
            <PasswordField
              autoComplete="new-password"
              initialValue={vendorCredentials?.password ?? ""}
              minLength={12}
              placeholder="At least 12 characters"
              showRequirements
            />
            <PasswordField
              autoComplete="new-password"
              id="confirmPassword"
              initialValue={vendorCredentials?.confirmPassword ?? ""}
              label="Confirm password"
              minLength={12}
              placeholder="Re-enter your password"
            />
            <FormFeedback state={state} />
            <button
              className={`button auth-submit${isBuyerSignup ? " signup-shopper-submit" : ""}`}
              type="submit"
              disabled={pending}
            >
              {pending
                ? "Creating account..."
                : isBuyerSignup
                  ? "Continue"
                  : "Create account"}
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
          )}
        </div>
        )
      ) : step === "vendorWelcome" ? (
        <VendorWelcome
          onContinue={() => setStep("sellerType")}
          onCancel={() => {
            setSelectedOption("");
            setStep("option");
          }}
        />
      ) : step === "sellerType" ? (
        <div aria-label="Choose your vendor seller category" className="seller-type-selector" role="group">
          {([
            { value: "individual", title: "Individual", description: "I want to create my store and sell to customers" },
            { value: "business", title: "Business", description: "I am a registered business and want to sell" },
          ] as const).map(({ value, title, description }) => (
            <button
              className="vendor-category-option"
              key={value}
              onClick={() => {
                setSellerType(value);
                setStep("credentials");
              }}
              type="button"
            >
              <Image alt="" aria-hidden="true" height={50} src="/bbb.png" width={50} />
              <span><strong>{title}</strong><span>{description}</span></span>
            </button>
          ))}
        </div>
      ) : step === "sellerDetails" && vendorCredentials && sellerType ? (
        <form action={vendorAction} className="auth-form vendor-details-form">
          <input name="firstName" type="hidden" value={vendorCredentials.firstName} />
          <input name="lastName" type="hidden" value={vendorCredentials.lastName} />
          <input name="email" type="hidden" value={vendorCredentials.email} />
          <input name="phone" type="hidden" value={vendorCredentials.phone} />
          <input name="phoneCountryCode" type="hidden" value={vendorCredentials.phoneCountryCode} />
          <input name="password" type="hidden" value={vendorCredentials.password} />
          <input name="confirmPassword" type="hidden" value={vendorCredentials.confirmPassword} />
          <input name="sellerType" type="hidden" value={sellerType} />
          <button
            className="signup-back"
            onClick={() => setStep("credentials")}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={16} />
            Back to account details
          </button>

          {sellerType === "individual" ? (
            <>
              <div className="field">
                <label htmlFor="legalFullName">Legal full name</label>
                <input
                  autoComplete="name"
                  defaultValue={`${vendorCredentials.firstName} ${vendorCredentials.lastName}`}
                  id="legalFullName"
                  name="legalFullName"
                  placeholder="Enter your legal name"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="dateOfBirth">Date of birth <span>(optional)</span></label>
                <input autoComplete="bday" id="dateOfBirth" name="dateOfBirth" type="date" />
              </div>
              <div className="signup-name-fields vendor-contact-fields">
                <div className="field">
                  <label htmlFor="vendorPhone">Phone</label>
                  <input
                    autoComplete="tel"
                    id="vendorPhone"
                    readOnly
                    value={`${vendorCredentials.phoneCountryCode}${vendorCredentials.phone}`}
                  />
                </div>
                <div className="field">
                  <label htmlFor="vendorEmail">Email</label>
                  <input autoComplete="email" id="vendorEmail" readOnly value={vendorCredentials.email} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="identityDocument">National identity verification <span>(if requested)</span></label>
                <input
                  accept="application/pdf,image/jpeg,image/png"
                  id="identityDocument"
                  name="identityDocument"
                  type="file"
                />
                <small className="vendor-upload-note">
                  Optional. Upload only if verification is requested. PDF, PNG, or JPEG, up to 4 MB.
                </small>
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="businessName">Registered business name</label>
                <input autoComplete="organization" id="businessName" name="businessName" required />
              </div>
              <div className="signup-name-fields">
                <div className="field">
                  <label htmlFor="registrationNumber">Business registration number</label>
                  <input id="registrationNumber" name="registrationNumber" required />
                </div>
                <div className="field">
                  <label htmlFor="businessType">Business type</label>
                  <select defaultValue="" id="businessType" name="businessType" required>
                    <option disabled value="">Select type</option>
                    <option value="sole_proprietorship">Sole proprietorship</option>
                    <option value="limited_company">Limited company</option>
                    <option value="partnership">Partnership</option>
                    <option value="nonprofit">Non-profit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="businessAddress">Business address</label>
                <textarea autoComplete="street-address" id="businessAddress" name="businessAddress" required rows={3} />
              </div>
              <div className="field">
                <label htmlFor="businessContactName">Business contact name</label>
                <input
                  autoComplete="name"
                  defaultValue={`${vendorCredentials.firstName} ${vendorCredentials.lastName}`}
                  id="businessContactName"
                  name="businessContactName"
                  required
                />
              </div>
              <div className="signup-name-fields">
                <div className="field">
                  <label htmlFor="businessContactEmail">Business contact email</label>
                  <input
                    autoComplete="email"
                    defaultValue={vendorCredentials.email}
                    id="businessContactEmail"
                    name="businessContactEmail"
                    required
                    type="email"
                  />
                </div>
                <div className="field">
                  <label htmlFor="businessContactPhone">Business contact phone</label>
                  <input
                    autoComplete="tel"
                    defaultValue={`${vendorCredentials.phoneCountryCode}${vendorCredentials.phone}`}
                    id="businessContactPhone"
                    name="businessContactPhone"
                    required
                    type="tel"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="businessDocument">Business registration documentation</label>
                <input
                  accept="application/pdf,image/jpeg,image/png"
                  id="businessDocument"
                  name="businessDocument"
                  required
                  type="file"
                />
                <small className="vendor-upload-note">
                  Private upload. PDF, PNG, or JPEG, up to 4 MB.
                </small>
              </div>
            </>
          )}

          <FormFeedback state={vendorState} />
          <button className="button auth-submit signup-option-continue" disabled={vendorPending} type="submit">
            {vendorPending ? "Creating vendor account..." : "Continue"}
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </form>
      ) : (
        <>
          <div className={`signup-selector${step === "option" && selectedAccount === "customer" ? " marketplace-option-selector" : ""}`}>
            <fieldset className={`account-options${step === "option" && selectedAccount === "customer" ? " marketplace-account-options" : ""}`}>
              <legend className="visually-hidden">
                {step === "option" ? `Choose a ${selectedAccountType.label} option` : "Choose an account type"}
              </legend>
              {step === "account"
                ? accountTypes.map(({ value, label, description, icon: Icon }) => (
                    <label
                      className={`account-option${selectedAccount === value ? " is-selected" : ""}`}
                      key={value}
                      onClick={() => {
                        if (selectedAccount === value) chooseAccount(value);
                      }}
                    >
                      <input
                        checked={selectedAccount === value}
                        name="accountTypeChoice"
                        onChange={() => chooseAccount(value)}
                        type="radio"
                        value={value}
                      />
                      <span className="account-avatar" aria-hidden="true">
                        <Icon aria-hidden="true" size={29} strokeWidth={1.7} />
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
                      onClick={() => {
                        if (step === "option" && selectedAccount === "customer") {
                          setSelectedOption(value);
                          setStep(value === "seller" ? "sellerType" : "credentials");
                        }
                      }}
                    >
                      <input
                        checked={selectedOption === value}
                        name="accountOptionChoice"
                        onChange={() => {
                          setSelectedOption(value);
                          if (step === "option" && selectedAccount === "customer") {
                            setStep(value === "seller" ? "sellerType" : "credentials");
                          }
                        }}
                        type="radio"
                        value={value}
                      />
                      <span className="account-avatar" aria-hidden="true">
                        {step === "option" && selectedAccount === "customer" ? (
                          <Image
                            alt=""
                            height={48}
                            src={value === "buyer" ? "/aaa.png" : "/bbb.png"}
                            width={48}
                          />
                        ) : (
                          <Icon size={38} strokeWidth={1.7} />
                        )}
                      </span>
                      <span className="account-option-copy">
                        <span className="account-option-title">
                          {step === "option" && selectedAccount === "customer" && value === "buyer"
                            ? "Customer"
                            : label}
                        </span>
                        <span className="account-option-description">
                          {step === "option" && selectedAccount === "customer"
                            ? value === "buyer"
                              ? "Shop your favourite products, track orders and more."
                              : "Sell your products and grow your business."
                            : description}
                        </span>
                      </span>
                      <span className="account-radio" aria-hidden="true">
                        {step === "option" &&
                          selectedAccount === "customer" &&
                          selectedOption === value && (
                            <Check size={18} strokeWidth={3} />
                          )}
                      </span>
                    </label>
                  ))}
            </fieldset>
            {step !== "account" && !(step === "option" && selectedAccount === "customer") && (
              <button
                className={`button auth-submit${step === "option" ? " signup-option-continue" : ""}`}
                onClick={() => setStep("credentials")}
                disabled={step === "option" && !selectedOption}
                type="button"
              >
                Continue
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type VerifyAccountFormProps = {
  maskedEmail: string;
  buyerVerification?: boolean;
  needsEmailCode?: boolean;
};

export function VerifyAccountForm({
  maskedEmail,
  buyerVerification = false,
  needsEmailCode = false,
}: VerifyAccountFormProps) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailSignupOtpAction,
    initialState,
  );
  const [emailCodeRequested, setEmailCodeRequested] = useState(!needsEmailCode);
  const [resendState, resendAction, resendPending] = useActionState(
    async (previousState: AuthActionState) => {
      const result = await resendEmailSignupOtpAction(previousState);
      if (result.message) setEmailCodeRequested(true);
      return result;
    },
    initialState,
  );
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [secondsRemaining, setSecondsRemaining] = useState(needsEmailCode ? 0 : 60);
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
  }, [resendState]);

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

  function renderOtpInputs(label: string) {
    return (
      <div
        className={buyerVerification ? "signup-verify-otp-inputs" : "verify-otp-inputs"}
        onPaste={handlePaste}
        role="group"
        aria-label={label}
      >
        {digits.map((digit, index) => (
          <input
            aria-label={`Verification code digit ${index + 1}`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className={buyerVerification ? "signup-verify-otp-digit" : "verify-otp-digit"}
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
    );
  }

  if (buyerVerification) {
    const isOtpSent = emailCodeRequested;

    return (
      <section className="signup-verify-flow" aria-labelledby="signup-verification-title">
        <header className="signup-verify-header">
          <Link aria-label="Back to sign up" className="signup-verify-back" href="/signup">
            <ChevronLeft aria-hidden="true" size={24} />
          </Link>
          <Image
            alt="MarketPlace: Shop, Sell, Grow"
            className="signup-verify-logo"
            height={110}
            src="/header.png"
            width={344}
          />
          <span aria-hidden="true" />
        </header>

        <ol aria-label="Signup progress" className="signup-verify-progress">
          {["Personal Info", "Contact Info", "Security", "Verify"].map((label, index) => {
            const stage = index + 1;
            const isCurrent = stage === 4;
            return (
              <li
                aria-current={isCurrent ? "step" : undefined}
                className={isCurrent ? "is-current" : "is-complete"}
                key={label}
              >
                <span className="signup-verify-progress-marker">
                  {isCurrent ? stage : <Check aria-hidden="true" size={15} strokeWidth={3} />}
                </span>
                <span className="signup-verify-progress-label">{label}</span>
              </li>
            );
          })}
        </ol>

        <h1 className="signup-verify-title" id="signup-verification-title">
          Verify Your <span>Email</span>
        </h1>
        <p className="signup-verify-description">
          {isOtpSent ? "Enter the 6-digit code sent to " : "Request a verification code for "}
          <strong>{maskedEmail}</strong>.
        </p>

        {isOtpSent ? (
          <form action={verifyAction} className="signup-verify-form">
            {renderOtpInputs("6-digit verification code")}
            <input name="token" type="hidden" value={code} />
            <FormFeedback state={verifyState} />
            <button
              className="button auth-submit signup-verify-submit"
              type="submit"
              disabled={verifyPending || code.length !== 6}
            >
              {verifyPending ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        ) : (
          <form action={resendAction} className="signup-verify-form">
            <button className="button auth-submit signup-verify-submit" disabled={resendPending} type="submit">
              {resendPending ? "Sending..." : "Send email code"}
            </button>
          </form>
        )}

        {isOtpSent && (
          <div className="signup-verify-resend">
            <span>Didn&apos;t receive the code?</span>
            {secondsRemaining > 0 ? (
              <span className="verify-resend-countdown">
                Resend in 0:{String(secondsRemaining).padStart(2, "0")}
              </span>
            ) : (
              <form action={resendAction}>
                <button
                  className="verify-resend-button"
                  type="submit"
                  disabled={resendPending}
                >
                  {resendPending ? "Sending..." : "Resend Code"}
                </button>
              </form>
            )}
          </div>
        )}
        <FormFeedback state={resendState} />
      </section>
    );
  }

  return (
    <div className="verify-account-form">
      <form action={verifyAction} className="auth-form">
        {renderOtpInputs("6-digit verification code")}
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
    <form action={action} className="auth-form forgot-password-form">
      <div className="field">
        <label htmlFor="email">Email Address *</label>
        <div className="signin-input-wrap">
          <Mail aria-hidden="true" size={21} />
          <input autoComplete="email" id="email" name="email" placeholder="Enter your email address" required type="email" />
        </div>
      </div>
      <FormFeedback state={state} />
      <button className="button auth-submit" type="submit" disabled={pending}>
        {pending ? "Sending link..." : "Send Reset Link"}
      </button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const requirements = getResetPasswordRequirements(password);

  return (
    <form action={action} className="auth-form update-password-form">
      <div className="field">
        <label htmlFor="password">New Password *</label>
        <div className="signin-input-wrap">
          <LockKeyhole aria-hidden="true" size={20} />
          <input autoComplete="new-password" id="password" minLength={8} name="password" onChange={(event) => setPassword(event.currentTarget.value)} placeholder="Enter New Password" required type={showPassword ? "text" : "password"} value={password} aria-describedby="reset-password-requirements" />
          <button aria-label={showPassword ? "Hide new password" : "Show new password"} aria-pressed={showPassword} className="signin-password-toggle" onClick={() => setShowPassword((visible) => !visible)} type="button">
            {showPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
          </button>
        </div>
      </div>
      <ul className="reset-password-requirements" id="reset-password-requirements">
        <li className={requirements.length ? "is-satisfied" : ""}><Check aria-hidden="true" size={13} />At least 8 characters <span className="visually-hidden">({requirements.length ? "met" : "not yet met"})</span></li>
        <li className={requirements.letterAndNumber ? "is-satisfied" : ""}><Check aria-hidden="true" size={13} />Include a letter and a number <span className="visually-hidden">({requirements.letterAndNumber ? "met" : "not yet met"})</span></li>
        <li className="is-optional"><Check aria-hidden="true" size={13} />Use special characters (Optional)</li>
      </ul>
      <div className="field">
        <label htmlFor="confirmPassword">Confirm New Password *</label>
        <div className="signin-input-wrap">
          <LockKeyhole aria-hidden="true" size={20} />
          <input autoComplete="new-password" id="confirmPassword" minLength={8} name="confirmPassword" placeholder="Confirm New Password" required type={showConfirmation ? "text" : "password"} />
          <button aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmation} className="signin-password-toggle" onClick={() => setShowConfirmation((visible) => !visible)} type="button">
            {showConfirmation ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
          </button>
        </div>
      </div>
      <FormFeedback state={state} />
      <button className="button auth-submit" type="submit" disabled={pending}>
        {pending ? "Updating password..." : "Reset Password"}
      </button>
    </form>
  );
}
