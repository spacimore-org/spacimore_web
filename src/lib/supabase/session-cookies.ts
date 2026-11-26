import type { CookieOptions } from "@supabase/ssr";

export const sessionOnlyCookie = "auth_session_only";

export function authCookieOptions(options: CookieOptions, sessionOnly: boolean): CookieOptions {
  if (!sessionOnly || options.maxAge === 0) return options;
  return { ...options, maxAge: undefined, expires: undefined };
}
