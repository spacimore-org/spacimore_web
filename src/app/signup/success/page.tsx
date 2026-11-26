import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "../../login/login.css";

export const instant = false;

export default async function SignupSuccessPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }
  if (!data.user) {
    redirect("/login");
  }
  if (data.user.user_metadata.account_role !== "buyer") {
    redirect("/dashboard");
  }
  if (data.user.user_metadata.account_verified !== true) {
    redirect("/verify-account");
  }

  const metadata = data.user.user_metadata;
  const firstName =
    typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const lastName =
    typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    data.user.email?.split("@")[0] ||
    "Customer";
  const customerId = `MP${data.user.id.replace(/-/g, "").slice(0, 7).toUpperCase()}`;

  return (
    <main className="signup-success-page">
      <section className="signup-success-flow" aria-labelledby="signup-success-title">
        <header className="signup-success-header">
          <Link aria-label="Go to homepage" className="signup-success-back" href="/">
            <ChevronLeft aria-hidden="true" size={24} />
          </Link>
          <Image
            alt="MarketPlace: Shop, Sell, Grow"
            className="signup-success-logo"
            height={110}
            src="/header.png"
            width={344}
          />
          <span aria-hidden="true" />
        </header>

        <div className="signup-success-content">
          <h1 id="signup-success-title">Registration <span>Success</span></h1>
          <p>
            Your account has been created successfully,
            <br />
            Welcome to MarketPlace
          </p>

          <div className="signup-success-customer">
            <span className="signup-success-avatar"><UserRound aria-hidden="true" size={29} /></span>
            <span className="signup-success-divider" aria-hidden="true" />
            <span className="signup-success-customer-copy">
              <strong>{displayName}</strong>
              <span>Customer ID: {customerId}</span>
            </span>
            <span className="signup-success-active">
              <BadgeCheck aria-hidden="true" size={17} />
              Active
            </span>
          </div>

          <Link className="signup-success-dashboard" href="/dashboard">
            Go to Dashboard
          </Link>
          <Link className="signup-success-shopping" href="/dashboard">
            Continue Shopping
          </Link>
          <p className="signup-success-note">
            You can complete your profile later in settings
          </p>
        </div>
      </section>
    </main>
  );
}
