import "server-only";

export type SignupOtpProvider = "twilio" | "termii";

type OtpResult<T> = { value: T } | { error: string };
type ProviderResponse = OtpResult<Record<string, unknown>>;

const configurationError =
  "Phone verification is not configured. Please contact support or try again later.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getSignupOtpProvider(): OtpResult<SignupOtpProvider> {
  const provider = process.env.SIGNUP_SMS_OTP_PROVIDER || "twilio";
  if (provider === "twilio" || provider === "termii") {
    return { value: provider };
  }
  return { error: configurationError };
}

async function postJson(
  url: string,
  init: RequestInit,
  checkingCode = false,
): Promise<ProviderResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { error: "We couldn't reach the phone verification service. Please try again." };
  }

  if (!response.ok) {
    if (checkingCode && response.status === 404) {
      return { error: "The verification code is invalid or expired. Request a new code." };
    }
    return { error: "The phone verification service couldn't complete your request. Please try again." };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { error: "The phone verification service returned an invalid response." };
  }
  if (!isRecord(data)) {
    return { error: "The phone verification service returned an invalid response." };
  }
  return { value: data };
}

async function twilioRequest(
  endpoint: "Verifications" | "VerificationCheck",
  fields: Record<string, string>,
): Promise<ProviderResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid || !/^AC[a-fA-F0-9]{32}$/.test(accountSid) || !/^VA[a-fA-F0-9]{32}$/.test(serviceSid)) {
    return { error: configurationError };
  }
  return postJson(
    `https://verify.twilio.com/v2/Services/${serviceSid}/${endpoint}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(fields).toString(),
    },
    endpoint === "VerificationCheck",
  );
}

async function termiiRequest(
  endpoint: "send" | "verify",
  fields: Record<string, string | number>,
): Promise<ProviderResponse> {
  const apiKey = process.env.TERMII_API_KEY;
  const baseUrl = process.env.TERMII_BASE_URL?.replace(/\/+$/, "");
  if (!apiKey || !baseUrl) return { error: configurationError };
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      return { error: configurationError };
    }
  } catch {
    return { error: configurationError };
  }
  return postJson(`${baseUrl}/api/sms/otp/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, ...fields }),
  }, endpoint === "verify");
}

export async function sendSignupPhoneOtp(
  provider: SignupOtpProvider,
  phone: string,
): Promise<OtpResult<string>> {
  let result: ProviderResponse;
  if (provider === "twilio") {
    result = await twilioRequest("Verifications", { To: phone, Channel: "sms" });
    if ("error" in result) return result;
    if (
      result.value.status !== "pending" ||
      typeof result.value.sid !== "string" ||
      !/^VE[a-fA-F0-9]{32}$/.test(result.value.sid) ||
      result.value.to !== phone
    ) {
      return { error: "The phone verification service returned an invalid response." };
    }
    return { value: result.value.sid };
  }

  const senderId = process.env.TERMII_SENDER_ID;
  if (!senderId) return { error: configurationError };
  result = await termiiRequest("send", {
    message_type: "NUMERIC",
    to: phone.replace(/\D/g, ""),
    from: senderId,
    channel: "generic",
    pin_attempts: 3,
    pin_time_to_live: 5,
    pin_length: 6,
    pin_placeholder: "< 123456 >",
    message_text: "Your SpaciMore verification code is < 123456 >. It expires in 5 minutes.",
    pin_type: "NUMERIC",
  });
  if ("error" in result) return result;
  if (typeof result.value.pinId !== "string" || !result.value.pinId) {
    return { error: "The phone verification service didn't return a code reference." };
  }
  return { value: result.value.pinId };
}

export async function checkSignupPhoneOtp(
  provider: SignupOtpProvider,
  phone: string,
  verificationId: string,
  code: string,
): Promise<OtpResult<true>> {
  if (provider === "twilio") {
    const result = await twilioRequest("VerificationCheck", {
      VerificationSid: verificationId,
      Code: code,
    });
    if ("error" in result) return result;
    if (
      result.value.status !== "approved" ||
      result.value.sid !== verificationId ||
      result.value.to !== phone
    ) {
      return { error: "That code is invalid or expired. Check it and try again." };
    }
    return { value: true };
  }

  const result = await termiiRequest("verify", {
    pin_id: verificationId,
    pin: code,
  });
  if ("error" in result) return result;
  if (
    String(result.value.verified).toLowerCase() !== "true" ||
    (typeof result.value.msisdn === "string" &&
      result.value.msisdn.replace(/\D/g, "") !== phone.replace(/\D/g, ""))
  ) {
    return { error: "That code is invalid or expired. Check it and try again." };
  }
  return { value: true };
}
