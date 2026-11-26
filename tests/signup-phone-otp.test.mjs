import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/signup-phone-otp.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const accountSid = `AC${"a".repeat(32)}`;
const serviceSid = `VA${"b".repeat(32)}`;
const verificationSid = `VE${"c".repeat(32)}`;
const phone = "+2347000000000";

function createProvider(env, fetch) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "server-only") return {};
      throw new Error(`Unexpected import: ${name}`);
    },
    process: { env },
    fetch,
    Buffer,
    URL,
    URLSearchParams,
    AbortSignal,
  });
  return exports;
}

function twilioEnvironment() {
  return {
    TWILIO_ACCOUNT_SID: accountSid,
    TWILIO_AUTH_TOKEN: "test-token",
    TWILIO_VERIFY_SERVICE_SID: serviceSid,
  };
}

test("Twilio is the default and sends an SMS through Verify", async () => {
  const calls = [];
  const provider = createProvider(twilioEnvironment(), async (url, init) => {
    calls.push({ url, init });
    return Response.json({ sid: verificationSid, status: "pending", to: phone });
  });
  assert.equal(provider.getSignupOtpProvider().value, "twilio");
  assert.equal((await provider.sendSignupPhoneOtp("twilio", phone)).value, verificationSid);
  assert.equal(calls[0].url, `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`);
  assert.equal(calls[0].init.headers.Authorization, `Basic ${Buffer.from(`${accountSid}:test-token`).toString("base64")}`);
  assert.equal(calls[0].init.headers["Content-Type"], "application/x-www-form-urlencoded");
  const fields = new URLSearchParams(calls[0].init.body);
  assert.equal(fields.get("To"), phone);
  assert.equal(fields.get("Channel"), "sms");
});

test("Twilio checks only an approved code for the intended verification and phone", async () => {
  const calls = [];
  let response = { sid: verificationSid, status: "approved", to: phone };
  const provider = createProvider(twilioEnvironment(), async (url, init) => {
    calls.push({ url, init });
    return Response.json(response);
  });
  assert.equal((await provider.checkSignupPhoneOtp("twilio", phone, verificationSid, "123456")).value, true);
  assert.equal(calls[0].url, `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`);
  const fields = new URLSearchParams(calls[0].init.body);
  assert.equal(fields.get("VerificationSid"), verificationSid);
  assert.equal(fields.get("Code"), "123456");
  response = { sid: verificationSid, status: "pending", to: phone };
  assert.ok((await provider.checkSignupPhoneOtp("twilio", phone, verificationSid, "000000")).error);
  response = { sid: verificationSid, status: "approved", to: "+2347000000001" };
  assert.ok((await provider.checkSignupPhoneOtp("twilio", phone, verificationSid, "123456")).error);
  response = { sid: `VE${"d".repeat(32)}`, status: "approved", to: phone };
  assert.ok((await provider.checkSignupPhoneOtp("twilio", phone, verificationSid, "123456")).error);
});

test("missing settings, network errors, and expired codes fail explicitly", async () => {
  const missing = createProvider({}, async () => { throw new Error("unexpected request"); });
  assert.match((await missing.sendSignupPhoneOtp("twilio", phone)).error, /not configured/);
  const invalid = createProvider({ SIGNUP_SMS_OTP_PROVIDER: "other" }, async () => {});
  assert.match(invalid.getSignupOtpProvider().error, /not configured/);
  const offline = createProvider(twilioEnvironment(), async () => { throw new Error("offline"); });
  assert.match((await offline.sendSignupPhoneOtp("twilio", phone)).error, /couldn't reach/);
  const expired = createProvider(twilioEnvironment(), async () => new Response(null, { status: 404 }));
  assert.match((await expired.checkSignupPhoneOtp("twilio", phone, verificationSid, "123456")).error, /expired/);
});

test("Termii remains selectable and checks the phone on verified codes", async () => {
  const calls = [];
  const env = {
    SIGNUP_SMS_OTP_PROVIDER: "termii",
    TERMII_API_KEY: "test-key",
    TERMII_BASE_URL: "https://api.example.test",
    TERMII_SENDER_ID: "SpaciMore",
  };
  const provider = createProvider(env, async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return Response.json(url.endsWith("/send")
      ? { pinId: "termii-pin" }
      : { verified: "True", msisdn: "2347000000000" });
  });
  assert.equal(provider.getSignupOtpProvider().value, "termii");
  assert.equal((await provider.sendSignupPhoneOtp("termii", phone)).value, "termii-pin");
  assert.equal(calls[0].body.to, "2347000000000");
  assert.equal((await provider.checkSignupPhoneOtp("termii", phone, "termii-pin", "123456")).value, true);
  assert.equal(calls[1].body.pin_id, "termii-pin");
});
