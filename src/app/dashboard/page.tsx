import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions";
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

  if (data.user.user_metadata.account_role === "buyer") {
    const metadata = data.user.user_metadata;
    const firstName =
      typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
    const fullName =
      typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
    const displayName =
      firstName ||
      fullName.split(/\s+/)[0] ||
      data.user.email?.split("@")[0] ||
      "Shopper";

    return <MarketplaceHome signedInUser={{ displayName }} />;
  }

  return (
    <main className="dashboard-page">
      <header className="site-header dashboard-header">
        <Link className="brand" href="/" aria-label="SpaciMore home">
          <span className="brand-mark">f</span>
          <span>SpaciMore</span>
        </Link>
        <form action={signOutAction}>
          <button className="button-quiet" type="submit">Sign out</button>
        </form>
      </header>
      <section className="dashboard-main">
        <div className="dashboard-kicker">YOUR WORKSPACE</div>
        <h1>You’re right where<br />you <em>belong.</em></h1>
        <p className="dashboard-description">
          Your account is set up and ready. This is your private space to build what comes next.
        </p>
        <div className="account-panel">
          <div className="account-panel-label">SIGNED IN AS</div>
          <p className="account-email">{data.user.email}</p>
        </div>
      </section>
    </main>
  );
}
