import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { UpdatePasswordForm } from "@/components/auth-forms";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    return (
      <AuthShell
        title="This link has expired"
        description="Password reset links can only be used once. Request a fresh link to continue."
      >
        <Link className="button auth-submit" href="/forgot-password">
          Request a new link <span aria-hidden="true">↗</span>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least 8 characters. You can sign in with it right away."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
