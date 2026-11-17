import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

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
