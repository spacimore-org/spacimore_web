# Spacimore

A Next.js App Router starter with Supabase email/password authentication, server-managed sessions, and a protected dashboard.

## Requirements

- Node.js 20.9 or later
- A Supabase project

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` and set the values from your Supabase project:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
   ```

   Find the project URL and publishable key in your Supabase project's API settings. The service-role key is required only for vendor registration, which writes private verification documents and vendor profiles. Keep it server-side in `.env.local` and Vercel's server environment variables. Never commit it, share it, or expose it through a `NEXT_PUBLIC_` variable.

   Marketplace customer signup verifies email using a six-digit Supabase OTP; SMS verification is not required. In Supabase Authentication email templates, configure the confirmation and magic-link emails to include `{{ .Token }}` so users can enter the code. Configure SMTP for production delivery. Login uses email and password or the configured social providers.

3. In Supabase **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the allowed redirect URLs. When deployed, set `NEXT_PUBLIC_SITE_URL` to the deployed origin and add its `/auth/callback` URL as well.

4. Apply [`supabase/migrations/20261120140000_vendor_onboarding.sql`](./supabase/migrations/20261120140000_vendor_onboarding.sql) to your Supabase project using the SQL Editor or Supabase CLI. It creates a private vendor verification bucket, the vendor profile table, and owner-only read policies. Set the server-only `SUPABASE_SERVICE_ROLE_KEY` environment variable in local and deployed environments before enabling vendor signup. Verification documents are limited to 4 MB to fit the deployed server's request-size limit.

5. Start the application:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Included flows

- Email/password sign up, sign in, and sign out
- Email confirmation through the Supabase callback route
- Password reset email and authenticated password update
- Password resets require at least eight characters with a letter and a number; signup retains its stronger password policy. Supabase Authentication password settings must allow the reset policy.
- The [support page](./src/app/support/page.tsx) provides account and marketplace help and links to the support email.
- Marketplace buyer and vendor signup; vendors choose individual or registered-business category before entering account and profile details.
- Private vendor verification document uploads (PDF, PNG, or JPEG; max 4 MB)
- Cookie-based Supabase sessions, refreshed in the Next.js proxy
- Login sessions use browser-session cookies unless “Remember me” is selected; browsers that restore sessions may also restore session cookies.
- Protected `/dashboard` route with a server-side user check
- Sellers temporarily see the customer marketplace dashboard until the vendor dashboard is built.
- Responsive SpaciMore marketplace-style home page; the original workspace landing page is preserved at `/welcome`

The storefront catalog and cart count are front-end demo interactions; they are not connected to an inventory or checkout backend. Vendor identity and business documents are stored privately for verification and are not submitted to an external verification provider.

Email confirmation behavior is controlled in Supabase **Authentication → Providers → Email**. With confirmation enabled, a new user must follow the email link before signing in.

## Validation

```bash
npm run lint
node --test tests/signup-email-otp.test.mjs tests/signup-phone-otp.test.mjs
npx tsc --noEmit
npm run build
```
