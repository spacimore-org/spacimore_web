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

2. Copy `.env.example` to `.env.local` and set the values from your Supabase project:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   Find the project URL and publishable key in your Supabase project's API settings. Never put a Supabase `service_role` key in this application.

3. In Supabase **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the allowed redirect URLs. When deployed, set `NEXT_PUBLIC_SITE_URL` to the deployed origin and add its `/auth/callback` URL as well.

4. Start the application:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Included flows

- Email/password sign up, sign in, and sign out
- Email confirmation through the Supabase callback route
- Password reset email and authenticated password update
- Cookie-based Supabase sessions, refreshed in the Next.js proxy
- Protected `/dashboard` route with a server-side user check
- Responsive SpaciMore marketplace-style home page; the original workspace landing page is preserved at `/welcome`

The storefront catalog and cart count are front-end demo interactions; they are not connected to an inventory or checkout backend.

Email confirmation behavior is controlled in Supabase **Authentication → Providers → Email**. With confirmation enabled, a new user must follow the email link before signing in.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
```
