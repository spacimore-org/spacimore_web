import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function compile(path, modules, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
      return modules[name];
    },
    process: { env: {} },
    FormData,
    File,
    URL,
    Date,
    ...globals,
  });
  return exports;
}

const cookieModule = compile("../src/lib/supabase/session-cookies.ts", {});

function setup() {
  const values = new Map();
  const cookieStore = {
    get: (name) => values.get(name),
    set: (name, value, options) => values.set(name, { value, options }),
    delete: (name) => values.delete(name),
  };
  const calls = [];
  const supabase = { auth: {
    signInWithPassword: async () => ({ data: { user: { user_metadata: { account_role: "buyer" } } }, error: null }),
    signInWithOAuth: async () => ({ data: { url: "https://example.test/authorize" }, error: null }),
    signOut: async () => ({ error: null }),
  } };
  const actions = compile("../src/app/actions.ts", {
    "node:crypto": { randomUUID: () => "uuid" },
    "@supabase/supabase-js": { isAuthSessionMissingError: () => false },
    "next/headers": { cookies: async () => cookieStore },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
    "@/lib/supabase/admin": {},
    "@/lib/supabase/server": {
      createClient: async () => {
        calls.push(values.get(cookieModule.sessionOnlyCookie));
        return supabase;
      },
    },
    "@/lib/supabase/env": { getSiteUrl: () => "https://example.test" },
    "@/lib/supabase/session-cookies": cookieModule,
    "@/lib/reset-password": {},
    "@/lib/signup-phone-otp": {},
  });
  return { actions, values, calls };
}

function loginForm(remember) {
  const form = new FormData();
  form.set("email", "customer@example.test");
  form.set("password", "password");
  if (remember) form.set("remember", "on");
  return form;
}

test("login and social login apply the selected persistence before creating the client", async () => {
  const { actions, values, calls } = setup();
  await assert.rejects(actions.signInAction({}, loginForm(false)), /redirect:\/dashboard/);
  assert.equal(calls[0].value, "true");
  assert.equal(calls[0].options.maxAge, undefined);
  await assert.rejects(actions.signInAction({}, loginForm(true)), /redirect:\/dashboard/);
  assert.equal(values.has(cookieModule.sessionOnlyCookie), false);
  const social = new FormData();
  social.set("provider", "google");
  await assert.rejects(actions.startSocialSignInAction({}, social), /redirect:https:\/\/example.test\/authorize/);
  assert.equal(calls[2].value, "true");
  await assert.rejects(actions.signOutAction(), /redirect:\/login/);
  assert.equal(values.has(cookieModule.sessionOnlyCookie), false);
});

test("session cookies stay session-only on refresh and preserve cookie deletion", () => {
  const options = { path: "/", maxAge: 3600, expires: new Date(), sameSite: "lax" };
  const session = cookieModule.authCookieOptions(options, true);
  assert.equal(session.maxAge, undefined);
  assert.equal(session.expires, undefined);
  assert.equal(session.path, "/");
  assert.equal(cookieModule.authCookieOptions(options, false), options);
  const deletion = { path: "/", maxAge: 0 };
  assert.equal(cookieModule.authCookieOptions(deletion, true), deletion);
});

test("server and proxy preserve session-only cookies when Supabase refreshes", async () => {
  const writes = [];
  const requestCookies = {
    get: (name) => name === cookieModule.sessionOnlyCookie ? { value: "true" } : undefined,
    getAll: () => [],
    set: () => {},
  };
  const mockSupabase = {
    createServerClient: (_url, _key, options) => {
      options.cookies.setAll([{ name: "sb-auth", value: "refreshed", options: { maxAge: 3600, path: "/" } }]);
      return { auth: { getUser: async () => ({ data: { user: { id: "buyer" } }, error: null }) } };
    },
  };
  const env = { getSupabaseEnv: () => ({ url: "https://example.test", publishableKey: "test" }) };
  const server = compile("../src/lib/supabase/server.ts", {
    "@supabase/ssr": mockSupabase,
    "next/headers": { cookies: async () => ({
      ...requestCookies,
      set: (name, value, options) => writes.push({ name, value, options }),
    }) },
    "./env": env,
    "./session-cookies": cookieModule,
  });
  await server.createClient();
  const proxy = compile("../src/proxy.ts", {
    "@supabase/ssr": mockSupabase,
    "@supabase/auth-js": { isAuthSessionMissingError: () => false },
    "next/server": { NextResponse: { next: () => ({ cookies: { set: (name, value, options) => writes.push({ name, value, options }) } }) } },
    "@/lib/supabase/env": env,
    "@/lib/supabase/session-cookies": cookieModule,
  });
  await proxy.proxy({ cookies: requestCookies });
  assert.equal(writes.length, 2);
  assert.ok(writes.every(({ options }) => options.maxAge === undefined));
});
