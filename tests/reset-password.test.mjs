import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path, modules = {}) {
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
  });
  return exports;
}

const policy = load("../src/lib/reset-password.ts");

function setup({ user = { id: "buyer" }, updateError = null, emailError = null } = {}) {
  const updates = [];
  const resetRequests = [];
  const actions = load("../src/app/actions.ts", {
    "node:crypto": { randomUUID: () => "uuid" },
    "@supabase/supabase-js": { isAuthSessionMissingError: () => false },
    "next/headers": {},
    "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
    "@/lib/supabase/admin": {},
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: {
        getUser: async () => ({ data: { user }, error: null }),
        updateUser: async (data) => { updates.push(data); return { error: updateError }; },
        resetPasswordForEmail: async (email, options) => {
          resetRequests.push({ email, options });
          return { error: emailError };
        },
      } }),
    },
    "@/lib/supabase/env": { getSiteUrl: () => "https://example.test" },
    "@/lib/supabase/session-cookies": {},
    "@/lib/reset-password": policy,
    "@/lib/signup-phone-otp": {},
  });
  return { actions, updates, resetRequests };
}

function form(password, confirmation = password) {
  const data = new FormData();
  data.set("password", password);
  data.set("confirmPassword", confirmation);
  return data;
}

test("reset policy requires eight characters, a letter and a number", () => {
  for (const password of ["", "abc1234", "abcdefgh", "12345678"]) {
    assert.equal(policy.isValidResetPassword(password), false);
  }
  for (const password of ["abcdefg1", "ABCDEFG1", "abc123!@"]) {
    assert.equal(policy.isValidResetPassword(password), true);
  }
});

test("reset checks requirements, confirmation and authenticated user", async () => {
  const { actions, updates } = setup();
  assert.match((await actions.updatePasswordAction({}, form("abcdefg"))).error, /8 characters/);
  assert.match((await actions.updatePasswordAction({}, form("abcdefg1", "abcdefg2"))).error, /do not match/);
  assert.equal(updates.length, 0);
  const expired = setup({ user: null });
  assert.match((await expired.actions.updatePasswordAction({}, form("abcdefg1"))).error, /expired/);
  assert.equal(expired.updates.length, 0);
});

test("reset accepts the reference policy and surfaces Supabase failures", async () => {
  const { actions, updates } = setup();
  await assert.rejects(actions.updatePasswordAction({}, form("abcdefg1")), /redirect:\/dashboard/);
  assert.equal(updates[0].password, "abcdefg1");
  const failed = setup({ updateError: { message: "Password rejected by Supabase" } });
  assert.equal((await failed.actions.updatePasswordAction({}, form("abcdefg1"))).error, "Password rejected by Supabase");
});

test("reset link request validates email and reports delivery errors", async () => {
  const { actions, resetRequests } = setup();
  const data = new FormData();
  data.set("email", "invalid");
  assert.match((await actions.requestPasswordResetAction({}, data)).error, /valid email/);
  assert.equal(resetRequests.length, 0);
  data.set("email", "Person@example.test");
  assert.match((await actions.requestPasswordResetAction({}, data)).message, /reset link is on its way/);
  assert.equal(resetRequests[0].email, "person@example.test");
  assert.equal(resetRequests[0].options.redirectTo, "https://example.test/auth/callback?next=/update-password");
  const failed = setup({ emailError: { message: "Delivery failed" } });
  assert.equal((await failed.actions.requestPasswordResetAction({}, data)).error, "Delivery failed");
});
