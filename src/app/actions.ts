"use server";

import { randomUUID } from "node:crypto";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { sessionOnlyCookie } from "@/lib/supabase/session-cookies";
import { isValidResetPassword } from "@/lib/reset-password";
import {
  checkSignupPhoneOtp,
  getSignupOtpProvider,
  sendSignupPhoneOtp,
  type SignupOtpProvider,
} from "@/lib/signup-phone-otp";

const pendingEmailCookie = "pending_email_verification";
const pendingEmailOtpTypeCookie = "pending_email_otp_type";
const pendingBuyerSignupCookie = "pending_buyer_signup";
const pendingBuyerPhoneVerificationCookie = "pending_buyer_phone_verification";
const pendingPhoneCookie = "pending_phone_sign_in";
const emailOtpLifetime = 60 * 60;
const phoneOtpLifetime = 10 * 60;
const buyerPhoneOtpLifetime = 10 * 60;
const buyerPhoneOtpResendDelay = 60_000;
const vendorDocumentBucket = "vendor-verification-documents";
const vendorDocumentMaxBytes = 4 * 1024 * 1024;
const profilePhotoBucket = "profile-photos";
const profilePhotoMaxBytes = 2 * 1024 * 1024;
const vendorBusinessTypes = [
  "sole_proprietorship",
  "limited_company",
  "partnership",
  "nonprofit",
  "other",
] as const;

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
  nextStep?: "phone";
};

type PendingBuyerPhoneVerification = {
  userId: string;
  phone: string;
  pinId: string;
  sentAt: number;
  provider?: SignupOtpProvider;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readPendingBuyerPhoneVerification(
  value: string | undefined,
): PendingBuyerPhoneVerification | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !isRecord(parsed) ||
      typeof parsed.userId !== "string" ||
      typeof parsed.phone !== "string" ||
      typeof parsed.pinId !== "string" ||
      typeof parsed.sentAt !== "number" ||
      (parsed.provider !== undefined && parsed.provider !== "twilio" && parsed.provider !== "termii")
    ) {
      return null;
    }
    return {
      userId: parsed.userId,
      phone: parsed.phone,
      pinId: parsed.pinId,
      sentAt: parsed.sentAt,
      provider: parsed.provider,
    };
  } catch {
    return null;
  }
}

async function setPendingEmailVerification(
  email: string,
  otpType: "signup" | "email",
  isBuyerSignup = false,
) {
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
  if (isBuyerSignup) {
    cookieStore.set(pendingBuyerSignupCookie, "true", options);
  } else {
    cookieStore.delete(pendingBuyerSignupCookie);
  }
}

async function clearPendingEmailVerification() {
  const cookieStore = await cookies();
  cookieStore.delete(pendingEmailCookie);
  cookieStore.delete(pendingEmailOtpTypeCookie);
  cookieStore.delete(pendingBuyerSignupCookie);
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

async function setPendingPhoneSignIn(phone: string) {
  const cookieStore = await cookies();
  cookieStore.set(pendingPhoneCookie, phone, {
    httpOnly: true,
    maxAge: phoneOtpLifetime,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

async function readPendingPhoneSignIn() {
  const cookieStore = await cookies();
  return cookieStore.get(pendingPhoneCookie)?.value ?? null;
}

async function clearPendingPhoneSignIn() {
  const cookieStore = await cookies();
  cookieStore.delete(pendingPhoneCookie);
}

async function setPendingBuyerPhoneVerification(
  pending: PendingBuyerPhoneVerification,
) {
  const cookieStore = await cookies();
  cookieStore.set(pendingBuyerPhoneVerificationCookie, JSON.stringify(pending), {
    httpOnly: true,
    maxAge: buyerPhoneOtpLifetime,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

async function readPendingBuyerPhoneVerificationCookie() {
  const cookieStore = await cookies();
  return readPendingBuyerPhoneVerification(
    cookieStore.get(pendingBuyerPhoneVerificationCookie)?.value,
  );
}

async function clearPendingBuyerPhoneVerification() {
  const cookieStore = await cookies();
  cookieStore.delete(pendingBuyerPhoneVerificationCookie);
}

async function sendBuyerPhoneOtp(
  phone: string,
  userId: string,
): Promise<{ message: string } | { error: string }> {
  const provider = getSignupOtpProvider();
  if ("error" in provider) return provider;
  const result = await sendSignupPhoneOtp(provider.value, phone);
  if ("error" in result) return result;

  await setPendingBuyerPhoneVerification({
    userId,
    phone,
    pinId: result.value,
    sentAt: Date.now(),
    provider: provider.value,
  });
  return { message: "We sent a verification code to your phone." };
}

function readEmail(formData: FormData) {
  return readEmailField(formData, "email");
}

function readEmailField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function readPassword(formData: FormData) {
  const value = formData.get("password");
  return typeof value === "string" ? value : "";
}

function meetsPasswordRequirements(password: string) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

const passwordRequirementsMessage =
  "Use at least 12 characters, including uppercase and lowercase letters, a number, and a special character.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function getVendorDocumentExtension(file: File) {
  if (file.size > vendorDocumentMaxBytes) {
    return null;
  }

  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isPdf =
    file.type === "application/pdf" &&
    signature[0] === 0x25 &&
    signature[1] === 0x50 &&
    signature[2] === 0x44 &&
    signature[3] === 0x46 &&
    signature[4] === 0x2d;
  const isPng =
    file.type === "image/png" &&
    signature.length === 8 &&
    signature[0] === 0x89 &&
    signature[1] === 0x50 &&
    signature[2] === 0x4e &&
    signature[3] === 0x47 &&
    signature[4] === 0x0d &&
    signature[5] === 0x0a &&
    signature[6] === 0x1a &&
    signature[7] === 0x0a;
  const isJpeg =
    file.type === "image/jpeg" &&
    signature[0] === 0xff &&
    signature[1] === 0xd8 &&
    signature[2] === 0xff;

  if (isPdf) return "pdf";
  if (isPng) return "png";
  if (isJpeg) return "jpg";
  return null;
}

async function getProfilePhotoExtension(file: File) {
  if (file.size > profilePhotoMaxBytes) {
    return null;
  }

  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isPng =
    file.type === "image/png" &&
    signature.length === 8 &&
    signature[0] === 0x89 &&
    signature[1] === 0x50 &&
    signature[2] === 0x4e &&
    signature[3] === 0x47 &&
    signature[4] === 0x0d &&
    signature[5] === 0x0a &&
    signature[6] === 0x1a &&
    signature[7] === 0x0a;
  const isJpeg =
    file.type === "image/jpeg" &&
    signature[0] === 0xff &&
    signature[1] === 0xd8 &&
    signature[2] === 0xff;

  if (isPng) return "png";
  if (isJpeg) return "jpg";
  return null;
}

async function removeVendorDocuments(admin: ReturnType<typeof createAdminClient>, paths: string[]) {
  if (!paths.length) return null;
  const { error } = await admin.storage.from(vendorDocumentBucket).remove(paths);
  return error;
}

async function deleteVendorAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const { error } = await admin.auth.admin.deleteUser(userId);
  return error;
}

async function setSignInPersistence(formData: FormData) {
  const cookieStore = await cookies();
  if (formData.get("remember") === "on") {
    cookieStore.delete(sessionOnlyCookie);
  } else {
    cookieStore.set(sessionOnlyCookie, "true", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
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

  await setSignInPersistence(formData);
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
    await setPendingEmailVerification(email, "email", data.user.user_metadata.account_role === "buyer");
    redirect("/verify-account");
  }

  redirect("/dashboard");
}

export async function startPhoneSignInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const phoneCountryCode = readText(formData, "phoneCountryCode");
  const phoneNumber = readText(formData, "phone").replace(/\D/g, "");
  if (
    !shopperCountryCodes.some((code) => code === phoneCountryCode) ||
    !/^\d{7,10}$/.test(phoneNumber)
  ) {
    return { error: "Enter a valid phone number." };
  }

  const phone = `${phoneCountryCode}${phoneNumber}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: false },
  });
  if (error) {
    return { error: error.message };
  }

  await setPendingPhoneSignIn(phone);
  return { message: "A sign-in code has been sent to your phone." };
}

export async function verifyPhoneSignInOtpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const token = readText(formData, "token");
  if (!/^\d{6}$/.test(token)) {
    return { error: "Enter the 6-digit code from your phone." };
  }

  const phone = await readPendingPhoneSignIn();
  if (!phone) {
    return { error: "This sign-in request has expired. Please try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) {
    return { error: "That code is invalid or expired. Check it and try again." };
  }
  if (!data.user) {
    return { error: "We couldn't sign you in. Please request a new code." };
  }

  await clearPendingPhoneSignIn();
  redirect("/dashboard");
}

export async function resendPhoneSignInOtpAction(
  _previousState: AuthActionState,
): Promise<AuthActionState> {
  void _previousState;
  const phone = await readPendingPhoneSignIn();
  if (!phone) {
    return { error: "This sign-in request has expired. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: false },
  });
  if (error) {
    return { error: error.message };
  }

  return { message: "A new sign-in code has been sent." };
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const confirmation = formData.get("confirmPassword");
  const firstNameValue = formData.get("firstName");
  const middleName = readText(formData, "middleName");
  const lastNameValue = formData.get("lastName");
  const phoneValue = formData.get("phone");
  const phoneCountryCode = formData.get("phoneCountryCode");
  const dateOfBirth = readText(formData, "dateOfBirth");
  const gender = readText(formData, "gender");
  const profilePhotoValue = formData.get("profilePhoto");
  const profilePhoto =
    profilePhotoValue instanceof File && profilePhotoValue.size > 0
      ? profilePhotoValue
      : null;
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
  const profilePhotoExtension = profilePhoto
    ? await getProfilePhotoExtension(profilePhoto)
    : null;
  if (profilePhoto && !profilePhotoExtension) {
    return { error: "Profile photos must be a PNG or JPEG no larger than 2 MB." };
  }
  if (
    accountRole === "buyer" &&
    dateOfBirth &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
      Number.isNaN(Date.parse(`${dateOfBirth}T00:00:00Z`)) ||
      new Date(`${dateOfBirth}T00:00:00Z`).toISOString().slice(0, 10) !== dateOfBirth ||
      new Date(`${dateOfBirth}T00:00:00Z`) > new Date())
  ) {
    return { error: "Enter a valid date of birth that is not in the future." };
  }
  if (
    accountRole === "buyer" &&
    gender &&
    !["female", "male", "other", "prefer_not_to_say"].includes(gender)
  ) {
    return { error: "Choose a valid gender option." };
  }
  if (
    (accountRole === "buyer" || accountRole === "seller") &&
    (!firstName ||
      !lastName ||
      typeof phoneCountryCode !== "string" ||
      !shopperCountryCodes.some((code) => code === phoneCountryCode) ||
      !/^\d{7,10}$/.test(phone))
  ) {
    return { error: "Enter your first name, last name, and a valid phone number." };
  }
  if (!meetsPasswordRequirements(password)) {
    return { error: passwordRequirementsMessage };
  }
  if (typeof confirmation !== "string" || password !== confirmation) {
    return { error: "Those passwords do not match." };
  }
  if (accountRole === "seller") {
    return { error: "Complete the seller registration details to create a vendor account." };
  }

  let admin: ReturnType<typeof createAdminClient> | null = null;
  let pendingProfilePhotoPath: string | null = null;
  if (profilePhoto && profilePhotoExtension) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { error: "Profile photo uploads are not configured. Please contact support." };
    }
    admin = createAdminClient();
    pendingProfilePhotoPath = `pending/${randomUUID()}.${profilePhotoExtension}`;
    const { error: uploadError } = await admin.storage
      .from(profilePhotoBucket)
      .upload(pendingProfilePhotoPath, profilePhoto, {
        contentType: profilePhoto.type,
        upsert: false,
      });
    if (uploadError) {
      return { error: `Could not upload your profile photo: ${uploadError.message}` };
    }
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
              middle_name: middleName || null,
              last_name: lastName,
              phone: `${phoneCountryCode}${phone}`,
              phone_country_code: phoneCountryCode,
              date_of_birth: dateOfBirth || null,
              gender: gender || null,
              account_verified: false,
            }
          : {}),
      },
    },
  });

  if (error) {
    if (admin && pendingProfilePhotoPath) {
      const { error: cleanupError } = await admin.storage
        .from(profilePhotoBucket)
        .remove([pendingProfilePhotoPath]);
      return {
        error: cleanupError
          ? `${error.message} Profile photo cleanup failed: ${cleanupError.message}`
          : error.message,
      };
    }
    return { error: error.message };
  }

  if (accountRole === "buyer") {
    if (!data.user) {
      if (admin && pendingProfilePhotoPath) {
        const { error: cleanupError } = await admin.storage
          .from(profilePhotoBucket)
          .remove([pendingProfilePhotoPath]);
        if (cleanupError) {
          return {
            error: `We couldn't start verification, and profile photo cleanup failed: ${cleanupError.message}`,
          };
        }
      }
      return { error: "We couldn't start verification. Please try signing up again." };
    }
    if (admin && pendingProfilePhotoPath && profilePhotoExtension) {
      const finalProfilePhotoPath =
        `${data.user.id}/${randomUUID()}.${profilePhotoExtension}`;
      const { error: moveError } = await admin.storage
        .from(profilePhotoBucket)
        .move(pendingProfilePhotoPath, finalProfilePhotoPath);
      if (moveError) {
        const { error: cleanupError } = await admin.storage
          .from(profilePhotoBucket)
          .remove([pendingProfilePhotoPath]);
        const deleteError = await deleteVendorAuthUser(admin, data.user.id);
        const cleanupMessages = [cleanupError?.message, deleteError?.message].filter(Boolean);
        return {
          error: cleanupMessages.length
            ? `Could not finalize your profile photo: ${moveError.message}. Cleanup failed: ${cleanupMessages.join("; ")}`
            : `Could not finalize your profile photo: ${moveError.message}`,
        };
      }

      const photoUrl = admin.storage
        .from(profilePhotoBucket)
        .getPublicUrl(finalProfilePhotoPath).data.publicUrl;
      const { error: metadataError } = await admin.auth.admin.updateUserById(data.user.id, {
        user_metadata: {
          ...data.user.user_metadata,
          profile_photo_path: finalProfilePhotoPath,
          profile_photo_url: photoUrl,
        },
      });
      if (metadataError) {
        const { error: cleanupError } = await admin.storage
          .from(profilePhotoBucket)
          .remove([finalProfilePhotoPath]);
        const deleteError = await deleteVendorAuthUser(admin, data.user.id);
        const cleanupMessages = [cleanupError?.message, deleteError?.message].filter(Boolean);
        return {
          error: cleanupMessages.length
            ? `Could not save your profile photo: ${metadataError.message}. Cleanup failed: ${cleanupMessages.join("; ")}`
            : `Could not save your profile photo: ${metadataError.message}`,
        };
      }
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
    await setPendingEmailVerification(email, otpType, accountRole === "buyer");
    redirect("/verify-account");
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    message: "Check your inbox for a confirmation link to finish creating your account.",
  };
}

export async function vendorSignUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const firstName = readText(formData, "firstName");
  const lastName = readText(formData, "lastName");
  const email = readEmail(formData);
  const password = readPassword(formData);
  const confirmation = formData.get("confirmPassword");
  const phone = readText(formData, "phone");
  const phoneCountryCode = readText(formData, "phoneCountryCode");
  const sellerType = readText(formData, "sellerType");

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!firstName || !lastName || !/^\d{7,10}$/.test(phone) ||
      !shopperCountryCodes.some((code) => code === phoneCountryCode)) {
    return { error: "Enter your first name, last name, and a valid phone number." };
  }
  if (!meetsPasswordRequirements(password)) {
    return { error: passwordRequirementsMessage };
  }
  if (typeof confirmation !== "string" || password !== confirmation) {
    return { error: "Those passwords do not match." };
  }
  if (sellerType !== "individual" && sellerType !== "business") {
    return { error: "Choose an individual or registered business seller type." };
  }

  const legalFullName = readText(formData, "legalFullName");
  const dateOfBirth = readText(formData, "dateOfBirth") || null;
  const businessName = readText(formData, "businessName");
  const registrationNumber = readText(formData, "registrationNumber");
  const businessType = readText(formData, "businessType");
  const businessAddress = readText(formData, "businessAddress");
  const businessContactName = readText(formData, "businessContactName");
  const businessContactEmail = readEmailField(formData, "businessContactEmail");
  const businessContactPhone = readText(formData, "businessContactPhone");
  const identityDocumentValue = formData.get("identityDocument");
  const businessDocumentValue = formData.get("businessDocument");
  const identityDocument =
    identityDocumentValue instanceof File && identityDocumentValue.size > 0
      ? identityDocumentValue
      : null;
  const businessDocument =
    businessDocumentValue instanceof File && businessDocumentValue.size > 0
      ? businessDocumentValue
      : null;

  if (sellerType === "individual") {
    if (legalFullName.length < 3) {
      return { error: "Enter your full legal name." };
    }
    if (dateOfBirth && (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
        Number.isNaN(Date.parse(`${dateOfBirth}T00:00:00Z`)) ||
        new Date(`${dateOfBirth}T00:00:00Z`).toISOString().slice(0, 10) !== dateOfBirth ||
        new Date(`${dateOfBirth}T00:00:00Z`) > new Date())) {
      return { error: "Enter a valid date of birth that is not in the future." };
    }
  } else {
    if (
      !businessName ||
      !registrationNumber ||
      !vendorBusinessTypes.some((type) => type === businessType) ||
      !businessAddress ||
      !businessContactName ||
      !isValidEmail(businessContactEmail) ||
      !/^\+?\d{7,15}$/.test(businessContactPhone)
    ) {
      return { error: "Complete all registered business and contact details." };
    }
    if (!businessDocument) {
      return { error: "Upload the business registration document." };
    }
  }

  const identityDocumentExtension = identityDocument
    ? await getVendorDocumentExtension(identityDocument)
    : null;
  const businessDocumentExtension = businessDocument
    ? await getVendorDocumentExtension(businessDocument)
    : null;
  if (identityDocument && !identityDocumentExtension) {
    return { error: "Identity documents must be a PDF, PNG, or JPEG no larger than 4 MB." };
  }
  if (businessDocument && !businessDocumentExtension) {
    return { error: "Business documents must be a PDF, PNG, or JPEG no larger than 4 MB." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Vendor registration storage is not configured. Please contact support." };
  }

  const admin = createAdminClient();
  const documents: Array<{
    pendingPath: string;
    finalPath: string;
    extension: string;
    profileColumn: "identity_document_path" | "business_registration_document_path";
  }> = [];
  const documentsToUpload: Array<{
    file: File;
    extension: string;
    profileColumn: "identity_document_path" | "business_registration_document_path";
  }> = [];
  if (identityDocument && identityDocumentExtension) {
    documentsToUpload.push({
      file: identityDocument,
      extension: identityDocumentExtension,
      profileColumn: "identity_document_path",
    });
  }
  if (businessDocument && businessDocumentExtension) {
    documentsToUpload.push({
      file: businessDocument,
      extension: businessDocumentExtension,
      profileColumn: "business_registration_document_path",
    });
  }

  for (const document of documentsToUpload) {
    const id = randomUUID();
    const pendingPath = `pending/${id}.${document.extension}`;
    const { error } = await admin.storage
      .from(vendorDocumentBucket)
      .upload(pendingPath, document.file, {
        contentType: document.file.type,
        upsert: false,
      });

    if (error) {
      const cleanupError = await removeVendorDocuments(
        admin,
        documents.map(({ pendingPath: uploadedPath }) => uploadedPath),
      );
      return {
        error: cleanupError
          ? `Could not upload the vendor document: ${error.message}. Cleanup also failed: ${cleanupError.message}`
          : `Could not upload the vendor document: ${error.message}`,
      };
    }

    documents.push({
      pendingPath,
      finalPath: "",
      extension: document.extension,
      profileColumn: document.profileColumn,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", getSiteUrl()).toString(),
      data: {
        account_type: "customer",
        account_role: "seller",
        seller_type: sellerType,
        account_verified: false,
      },
    },
  });

  if (error || !data.user) {
    const cleanupError = await removeVendorDocuments(
      admin,
      documents.map(({ pendingPath }) => pendingPath),
    );
    if (cleanupError) {
      return { error: `Could not complete vendor registration or clean up uploaded documents: ${cleanupError.message}` };
    }
    return { error: error?.message ?? "We couldn't create your vendor account. Please try again." };
  }

  for (const document of documents) {
    const finalPath = `${data.user.id}/${randomUUID()}.${document.extension}`;
    const { error: moveError } = await admin.storage
      .from(vendorDocumentBucket)
      .move(document.pendingPath, finalPath);
    if (moveError) {
      const cleanupError = await removeVendorDocuments(
        admin,
        documents.flatMap(({ pendingPath, finalPath }) => [
          pendingPath,
          ...(finalPath ? [finalPath] : []),
        ]),
      );
      const deleteError = await deleteVendorAuthUser(admin, data.user.id);
      const cleanupMessages = [
        cleanupError?.message,
        deleteError?.message,
      ].filter(Boolean);
      return {
        error: cleanupMessages.length
          ? `Could not complete vendor registration or clean up: ${cleanupMessages.join("; ")}`
          : `Could not finalize the vendor document upload: ${moveError.message}`,
      };
    }
    document.finalPath = finalPath;
  }

  const documentPaths = Object.fromEntries(
    documents.map(({ profileColumn, finalPath }) => [profileColumn, finalPath]),
  );
  const { error: profileError } = await admin.from("vendor_profiles").insert({
    user_id: data.user.id,
    seller_type: sellerType,
    first_name: firstName,
    last_name: lastName,
    legal_full_name: sellerType === "individual" ? legalFullName : `${firstName} ${lastName}`,
    date_of_birth: sellerType === "individual" ? dateOfBirth : null,
    contact_email: email,
    contact_phone: `${phoneCountryCode}${phone}`,
    business_name: sellerType === "business" ? businessName : null,
    registration_number: sellerType === "business" ? registrationNumber : null,
    business_type: sellerType === "business" ? businessType : null,
    business_address: sellerType === "business" ? businessAddress : null,
    business_contact_name: sellerType === "business" ? businessContactName : null,
    business_contact_email: sellerType === "business" ? businessContactEmail : null,
    business_contact_phone: sellerType === "business" ? businessContactPhone : null,
    ...documentPaths,
  });

  if (profileError) {
    const cleanupError = await removeVendorDocuments(
      admin,
      documents.map(({ finalPath }) => finalPath),
    );
    const deleteError = await deleteVendorAuthUser(admin, data.user.id);
    const cleanupMessages = [
      cleanupError?.message,
      deleteError?.message,
    ].filter(Boolean);
    return {
      error: cleanupMessages.length
        ? `Could not save your vendor details or clean up: ${cleanupMessages.join("; ")}`
        : `Could not save your vendor details: ${profileError.message}`,
    };
  }

  if (data.session) {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      return { error: `Your account was created, but we couldn't send its verification code: ${otpError.message}` };
    }
    await setPendingEmailVerification(email, "email");
  } else {
    await setPendingEmailVerification(email, "signup");
  }

  redirect("/verify-account");
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

  const isBuyer = data.user.user_metadata.account_role === "buyer";
  if (isBuyer || data.user.user_metadata.account_role === "seller") {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        ...data.user.user_metadata,
        account_verified: true,
        email_verified: true,
      },
    });
    if (metadataError) {
      return { error: "Your email was verified, but we couldn't update your account. Please sign in to try again." };
    }
  }

  await clearPendingEmailVerification();
  if (isBuyer) {
    await clearPendingBuyerPhoneVerification();
    redirect("/signup/success");
  }
  redirect("/dashboard");
}

export async function resendBuyerPhoneSignupOtpAction(
  _previousState: AuthActionState,
): Promise<AuthActionState> {
  void _previousState;
  const pending = await readPendingBuyerPhoneVerificationCookie();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  const user = data.user;
  const phone = user?.user_metadata.phone;
  if (
    !user ||
    user.user_metadata.account_role !== "buyer" ||
    !user.email_confirmed_at ||
    user.user_metadata.account_verified === true ||
    typeof phone !== "string" ||
    !/^\+\d{8,15}$/.test(phone) ||
    (pending &&
      (pending.userId !== user.id ||
        pending.phone !== phone))
  ) {
    return {
      error: "This phone verification request has expired. Please sign up again.",
      nextStep: "phone",
    };
  }

  const waitRemaining = pending
    ? buyerPhoneOtpResendDelay - (Date.now() - pending.sentAt)
    : 0;
  if (pending?.pinId && waitRemaining > 0) {
    return {
      error: `Please wait ${Math.ceil(waitRemaining / 1000)} seconds before requesting another code.`,
      nextStep: "phone",
    };
  }

  const result = await sendBuyerPhoneOtp(phone, user.id);
  if ("error" in result) {
    return { error: result.error, nextStep: "phone" };
  }
  return { message: result.message, nextStep: "phone" };
}

export async function startBuyerPhoneSignupOtpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const phoneCountryCode = readText(formData, "phoneCountryCode");
  const phoneNumber = readText(formData, "phone").replace(/\D/g, "");
  if (
    !shopperCountryCodes.some((code) => code === phoneCountryCode) ||
    !/^\d{7,10}$/.test(phoneNumber)
  ) {
    return { error: "Enter a valid phone number.", nextStep: "phone" };
  }

  const phone = `${phoneCountryCode}${phoneNumber}`;
  const pending = await readPendingBuyerPhoneVerificationCookie();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  const user = data.user;
  if (
    !user ||
    user.user_metadata.account_role !== "buyer" ||
    !user.email_confirmed_at ||
    user.user_metadata.account_verified === true
  ) {
    return {
      error: "This phone verification request has expired. Please sign up again.",
      nextStep: "phone",
    };
  }
  if (pending?.pinId && pending.userId !== user.id) {
    return {
      error: "This phone verification request has expired. Please sign up again.",
      nextStep: "phone",
    };
  }
  if (pending?.pinId && pending.phone !== phone) {
    return {
      error: "A code has already been sent to this account's phone. Verify it before changing the number.",
      nextStep: "phone",
    };
  }
  const waitRemaining = pending
    ? buyerPhoneOtpResendDelay - (Date.now() - pending.sentAt)
    : 0;
  if (pending?.pinId && waitRemaining > 0) {
    const remaining = Math.max(
      1,
      Math.ceil(waitRemaining / 1000),
    );
    return {
      error: `Please wait ${remaining} seconds before requesting another code.`,
      nextStep: "phone",
    };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      phone,
      phone_country_code: phoneCountryCode,
      phone_verified: false,
      account_verified: false,
    },
  });
  if (metadataError) {
    return {
      error: "We couldn't save your phone number. Please try again.",
      nextStep: "phone",
    };
  }

  const result = await sendBuyerPhoneOtp(phone, user.id);
  if ("error" in result) {
    return { error: result.error, nextStep: "phone" };
  }
  return { message: result.message, nextStep: "phone" };
}

export async function verifyBuyerPhoneSignupOtpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";
  if (!/^\d{6}$/.test(token)) {
    return { error: "Enter the 6-digit code sent to your phone.", nextStep: "phone" };
  }

  const pending = await readPendingBuyerPhoneVerificationCookie();
  if (!pending?.pinId) {
    return {
      error: "Request a new phone verification code before continuing.",
      nextStep: "phone",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (
    !data.user ||
    pending.userId !== data.user.id ||
    data.user.user_metadata.account_role !== "buyer" ||
    !data.user.email_confirmed_at ||
    data.user.user_metadata.phone !== pending.phone
  ) {
    return {
      error: "This phone verification request has expired. Please sign up again.",
      nextStep: "phone",
    };
  }

  const result = await checkSignupPhoneOtp(
    pending.provider ?? "termii",
    pending.phone,
    pending.pinId,
    token,
  );
  if ("error" in result) {
    return { error: result.error, nextStep: "phone" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...data.user.user_metadata,
      account_verified: true,
      email_verified: true,
      phone_verified: true,
    },
  });
  if (updateError) {
    return {
      error: "Your phone is verified, but we couldn't finish setting up your account. Please try again.",
      nextStep: "phone",
    };
  }

  await clearPendingBuyerPhoneVerification();
  await clearPendingEmailVerification();
  redirect("/signup/success");
}

export async function resendEmailSignupOtpAction(
  _previousState: AuthActionState,
): Promise<AuthActionState> {
  void _previousState;
  const pendingVerification = await readPendingEmailVerification();
  if (!pendingVerification) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error && !isAuthSessionMissingError(error)) {
      return { error: "We couldn't access your account. Please try again." };
    }
    if (!data.user || data.user.user_metadata.account_role !== "buyer" ||
        data.user.user_metadata.account_verified !== false || !data.user.email) {
      return { error: "This verification request has expired. Please sign in to request a new code." };
    }
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: data.user.email,
      options: { shouldCreateUser: false },
    });
    if (sendError) return { error: sendError.message };
    await setPendingEmailVerification(data.user.email, "email", true);
    return { message: "A new verification code has been sent to your email." };
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

export async function startSocialSignInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const provider = formData.get("provider");
  if (provider !== "google" && provider !== "apple") {
    return { error: "Choose a valid sign-in provider." };
  }

  await setSignInPersistence(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: new URL("/auth/callback", getSiteUrl()).toString() },
  });
  if (error) {
    return { error: error.message };
  }
  if (!data.url) {
    return { error: "Unable to start social sign-in. Please try again." };
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

  if (!isValidResetPassword(password)) {
    return { error: "Use at least 8 characters, including a letter and a number." };
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

  (await cookies()).delete(sessionOnlyCookie);
  redirect("/login");
}
