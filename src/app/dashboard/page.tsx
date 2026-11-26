import { redirect } from "next/navigation";
import { MarketplaceHome } from "@/components/marketplace-home";
import { createClient } from "@/lib/supabase/server";
import "../marketplace.css";

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }
  if (!data.user) {
    redirect("/login");
  }

  if (data.user.user_metadata.account_verified === false) {
    redirect("/verify-account");
  }

  if (data.user.user_metadata.account_role === "buyer" || data.user.user_metadata.account_role === "seller") {
    const metadata = data.user.user_metadata;
    const firstName =
      typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
    const fullName =
      typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
    const displayName =
      firstName ||
      fullName.split(/\s+/)[0] ||
      data.user.email?.split("@")[0] ||
      (metadata.account_role === "seller" ? "Vendor" : "Shopper");

    return <MarketplaceHome signedInUser={{ displayName }} />;
  }

  return redirect("/login");
}
