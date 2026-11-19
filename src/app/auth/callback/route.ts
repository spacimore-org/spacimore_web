import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const destination =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=callback", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=callback", request.url));
  }

  if (request.nextUrl.searchParams.get("signup") === "buyer") {
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) {
      return NextResponse.redirect(new URL("/signup?error=callback", request.url));
    }

    if (!data.user.user_metadata.account_type) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...data.user.user_metadata,
          account_type: "customer",
          account_role: "buyer",
          account_verified: true,
        },
      });
      if (metadataError) {
        return NextResponse.redirect(new URL("/signup?error=callback", request.url));
      }
    }
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
