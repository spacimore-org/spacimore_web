"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";

const pendingEmailCookie = "pending_email_verification";
const pendingEmailOtpTypeCookie = "pending_email_otp_type";
const emailOtpLifetime = 60 * 60;

const accountOptionsByType: Record<string, readonly string[]> = {
  customer: ["buyer", "seller"],
  service_provider: ["book_service", "provide_service"],
  storage: ["rent_space", "lease_space"],
};
const shopperCountryCodes = [
  "+234",
  "+1",
  "+44",
  "+233",
  "+91",
  "+971",
  "+27",
  "+61",
  "+254",
  "+33",
];

export type AuthActionState = {
  error?: string;
  message?: string;
};

async function setPendingEmailVerification(email: string, otpType: "signup" | "email") {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    maxAge: emailOtpLifetime,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  cookieStore.set(pendingEmailCookie, email, options);
  cookieStore.set(pendingEmailOtpTypeCookie, otpType, options);
}

async function clearPendingEmailVerification() {
  const cookieStore = await cookies();
  cookieStore.delete(pendingEmailCookie);
  cookieStore.delete(pendingEmailOtpTypeCookie);
}

async function readPendingEmailVerification() {
  const cookieStore = await cookies();
  const email = cookieStore.get(pendingEmailCookie)?.value;
  const otpType = cookieStore.get(pendingEmailOtpTypeCookie)?.value;
  if (!email || (otpType !== "signup" && otpType !== "email")) {
    return null;
  }
  return { email, otpType };
}

function readEmail(formData: FormData) {
  const value = formData.get("email");
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function readPassword(formData: FormData) {
  const value = formData.get("password");
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!isValidEmail(email) || !password) {
    return { error: "Enter a valid email address and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }
  if (!data.user) {
    return { error: "We couldn't sign you in. Please try again." };
  }

  if (data.user.user_metadata.account_verified === false) {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      return { error: otpError.message };
    }
    await setPendingEmailVerification(email, "email");
    redirect("/verify-account");
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const confirmation = formData.get("confirmPassword");
  const firstNameValue = formData.get("firstName");
  const lastNameValue = formData.get("lastName");
  const phoneValue = formData.get("phone");
  const phoneCountryCode = formData.get("phoneCountryCode");
  const accountType = formData.get("accountType");
  const accountOption = formData.get("accountOption");
  const validAccountTypes = [
    "customer",
    "business",
    "service_provider",
    "agent",
    "storage",
  ];

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }
  if (typeof accountType !== "string" || !validAccountTypes.includes(accountType)) {
    return { error: "Choose a valid account type." };
  }
  const validOptions = accountOptionsByType[accountType];
  let accountRole: string | undefined;
  if (validOptions) {
    if (typeof accountOption !== "string" || !validOptions.includes(accountOption)) {
      return { error: "Choose a valid account option." };
    }
    accountRole = accountOption;
  } else if (accountOption !== null && accountOption !== "") {
    return { error: "Choose a valid account option." };
  }
  const firstName = typeof firstNameValue === "string" ? firstNameValue.trim() : "";
  const lastName = typeof lastNameValue === "string" ? lastNameValue.trim() : "";
  const phone = typeof phoneValue === "string" ? phoneValue.trim() : "";
  if (
    accountRole === "buyer" &&
    (!firstName ||
      !lastName ||
      typeof phoneCountryCode !== "string" ||
      !shopperCountryCodes.some((code) => code === phoneCountryCode) ||
      !/^\d{7,10}$/.test(phone))
  ) {
    return { error: "Enter your first name, last name, and a valid phone number." };
  }
  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters." };
  }
  if (typeof confirmation !== "string" || password !== confirmation) {
    return { error: "Those passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", getSiteUrl()).toString(),
      data: {
        account_type: accountType,
        ...(accountRole ? { account_role: accountRole } : {}),
        ...(accountRole === "buyer"
          ? {
              first_name: firstName,
              last_name: lastName,
              phone: `${phoneCountryCode}${phone}`,
              phone_country_code: phoneCountryCode,
              account_verified: false,
            }
          : {}),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (accountRole === "buyer") {
    if (!data.user) {
      return { error: "We couldn't start verification. Please try signing up again." };
    }
    let otpType: "signup" | "email" = "signup";
    if (data.session) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (otpError) {
        return { error: otpError.message };
      }
      otpType = "email";
    }
    await setPendingEmailVerification(email, otpType);
    redirect("/verify-account");
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    message: "Check your inbox for a confirmation link to finish creating your account.",
  };
}

export async function verifyEmailSignupOtpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";
  if (!/^\d{6}$/.test(token)) {
    return { error: "Enter the 6-digit code from your email." };
  }

  const pendingVerification = await readPendingEmailVerification();
  if (!pendingVerification) {
    return { error: "This verification request has expired. Please sign up again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: pendingVerification.email,
    token,
    type: pendingVerification.otpType,
  });

  if (error) {
    return { error: "That code is invalid or expired. Check it and try again." };
  }
  if (!data.user) {
    return { error: "We couldn't verify your account. Please request a new code." };
  }

  if (data.user.user_metadata.account_role === "buyer") {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        ...data.user.user_metadata,
        account_verified: true,
      },
    });
    if (metadataError) {
      return { error: metadataError.message };
    }
  }

  await clearPendingEmailVerification();
  redirect("/dashboard");
}

export async function resendEmailSignupOtpAction(
  _previousState: AuthActionState,
): Promise<AuthActionState> {
  void _previousState;
  const pendingVerification = await readPendingEmailVerification();
  if (!pendingVerification) {
    return { error: "This verification request has expired. Please sign up again." };
  }

  const supabase = await createClient();
  const result =
    pendingVerification.otpType === "signup"
      ? await supabase.auth.resend({
          type: "signup",
          email: pendingVerification.email,
        })
      : await supabase.auth.signInWithOtp({
          email: pendingVerification.email,
          options: { shouldCreateUser: false },
        });

  if (result.error) {
    return { error: result.error.message };
  }
  return { message: "A new verification code has been sent." };
}

export async function startSocialSignUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const provider = formData.get("provider");
  if (provider !== "google" && provider !== "apple") {
    return { error: "Choose a valid sign-up provider." };
  }

  const callbackUrl = new URL("/auth/callback", getSiteUrl());
  callbackUrl.searchParams.set("signup", "buyer");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error) {
    return { error: error.message };
  }
  if (!data.url) {
    return { error: "Unable to start social sign-up. Please try again." };
  }

  redirect(data.url);
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL(
      "/auth/callback?next=/update-password",
      getSiteUrl(),
    ).toString(),
  });

  if (error) {
    return { error: error.message };
  }

  return {
    message: "If an account exists for that address, a password reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = readPassword(formData);
  const confirmation = formData.get("confirmPassword");

  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters." };
  }
  if (typeof confirmation !== "string" || password !== confirmation) {
    return { error: "Those passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message };
  }
  if (!data.user) {
    return { error: "This password reset link has expired. Request a new one to continue." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  redirect("/login");
}
