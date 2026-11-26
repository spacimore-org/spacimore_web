import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/app/actions.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ role = "buyer", invalid = false, updateError = false, pending = true } = {}) {
  const values = new Map(pending ? [
    ["pending_email_verification", "buyer@example.test"],
    ["pending_email_otp_type", "signup"],
    ["pending_buyer_signup", "true"],
  ] : []);
  values.set("pending_buyer_phone_verification", "legacy");
  const user = {
    id: "buyer-id",
    email: "buyer@example.test",
    email_confirmed_at: "2026-01-01",
    user_metadata: { account_role: role, account_verified: false },
  };
  const calls = [];
  const client = {
    auth: {
      async verifyOtp(params) {
        calls.push(["verify", params]);
        return invalid ? { data: {}, error: { message: "invalid" } } : { data: { user }, error: null };
      },
      async updateUser(params) {
        calls.push(["update", params]);
        return { error: updateError ? { message: "update failed" } : null };
      },
      async getUser() { return { data: { user }, error: null }; },
      async signInWithOtp(params) {
        calls.push(["send", params]);
        return { error: null };
      },
    },
  };
  const modules = {
    "node:crypto": { randomUUID: () => "uuid" },
    "@supabase/supabase-js": { isAuthSessionMissingError: () => false },
    "next/headers": {
      cookies: async () => ({
        get: (name) => values.has(name) ? { value: values.get(name) } : undefined,
        set: (name, value) => values.set(name, value),
        delete: (name) => values.delete(name),
      }),
    },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
    "@/lib/supabase/admin": {},
    "@/lib/supabase/server": { createClient: async () => client },
    "@/lib/supabase/env": {},
    "@/lib/supabase/session-cookies": { sessionOnlyCookie: "auth_session_only" },
    "@/lib/reset-password": {},
    "@/lib/signup-phone-otp": {},
  };
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
  });
  return { actions: exports, calls, values };
}

function code(value = "123456") {
  const form = new FormData();
  form.set("token", value);
  return form;
}

test("customer email OTP completes signup without an SMS request", async () => {
  const { actions, calls, values } = setup();
  await assert.rejects(actions.verifyEmailSignupOtpAction({}, code()), /redirect:\/signup\/success/);
  assert.deepEqual(calls.map(([name]) => name), ["verify", "update"]);
  assert.equal(calls[1][1].data.account_verified, true);
  assert.equal(calls[1][1].data.email_verified, true);
  assert.equal(calls[1][1].data.phone_verified, undefined);
  assert.equal(values.has("pending_buyer_phone_verification"), false);
  assert.equal(values.has("pending_email_verification"), false);
});

test("invalid or failed email verification never completes signup", async () => {
  const invalid = setup({ invalid: true });
  assert.match((await invalid.actions.verifyEmailSignupOtpAction({}, code())).error, /invalid or expired/);
  assert.deepEqual(invalid.calls.map(([name]) => name), ["verify"]);
  const failed = setup({ updateError: true });
  assert.match((await failed.actions.verifyEmailSignupOtpAction({}, code())).error, /couldn't update/);
  assert.equal(failed.values.has("pending_email_verification"), true);
});

test("vendor verification still goes to dashboard", async () => {
  const { actions, calls } = setup({ role: "seller" });
  await assert.rejects(actions.verifyEmailSignupOtpAction({}, code()), /redirect:\/dashboard/);
  assert.equal(calls[1][1].data.account_verified, true);
});

test("customers waiting on an old SMS step can request an email code", async () => {
  const { actions, calls, values } = setup({ pending: false });
  assert.match((await actions.resendEmailSignupOtpAction({})).message, /sent to your email/);
  assert.equal(calls[0][0], "send");
  assert.equal(calls[0][1].email, "buyer@example.test");
  assert.equal(values.get("pending_email_otp_type"), "email");
  assert.equal(values.get("pending_buyer_signup"), "true");
});
