import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const destination =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/dashboard";
  const isPasswordRecovery = destination === "/update-password";
  const errorDestination = isPasswordRecovery
    ? "/update-password?error=expired"
    : "/login?error=callback";

  if (!code || request.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL(errorDestination, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(errorDestination, request.url));
  }

  if (request.nextUrl.searchParams.get("signup") === "buyer") {
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) {
      return NextResponse.redirect(new URL("/signup?error=callback", request.url));
    }

    const isNewMarketplaceAccount = !data.user.user_metadata.account_type;
    if (isNewMarketplaceAccount) {
      const emailConfirmed = Boolean(data.user.email_confirmed_at);
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...data.user.user_metadata,
          account_type: "customer",
          account_role: "buyer",
          account_verified: emailConfirmed,
          email_verified: emailConfirmed,
          phone_verified: false,
        },
      });
      if (metadataError) {
        return NextResponse.redirect(new URL("/signup?error=callback", request.url));
      }

      if (!emailConfirmed) {
        const email = data.user.email;
        if (!email) {
          return NextResponse.redirect(new URL("/signup?error=callback", request.url));
        }

        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (otpError) {
          return NextResponse.redirect(new URL("/signup?error=callback", request.url));
        }

        const cookieStore = await cookies();
        const cookieOptions = {
          httpOnly: true,
          maxAge: 60 * 60,
          path: "/",
          sameSite: "lax" as const,
          secure: process.env.NODE_ENV === "production",
        };
        cookieStore.set("pending_email_verification", email, cookieOptions);
        cookieStore.set("pending_email_otp_type", "email", cookieOptions);
        cookieStore.set("pending_buyer_signup", "true", cookieOptions);
        return NextResponse.redirect(new URL("/verify-account", request.url));
      }
      return NextResponse.redirect(new URL("/signup/success", request.url));
    }
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
