"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";

const accountOptionsByType: Record<string, readonly string[]> = {
  customer: ["buyer", "seller"],
  service_provider: ["book_service", "provide_service"],
  storage: ["rent_space", "lease_space"],
};

export type AuthActionState = {
  error?: string;
  message?: string;
};

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
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
  const phoneDigits = phone.replace(/\D/g, "");
  if (
    accountRole === "buyer" &&
    (!firstName || !lastName || phoneDigits.length < 7 || phoneDigits.length > 15 || !/^[+()\d\s.-]+$/.test(phone))
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
              phone,
            }
          : {}),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    message: "Check your inbox for a confirmation link to finish creating your account.",
  };
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
