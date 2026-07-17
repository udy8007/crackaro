/**
 * Real SMS providers for admin OTP.
 * Set SMS_PROVIDER=msg91 | twilio | fast2sms
 * If unset / incomplete, falls back to console (dev only when ALLOW_DEMO_OTP=true).
 */

function toE164India(phone10) {
  return `91${phone10}`;
}

async function sendMsg91(phone10, otp) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) {
    throw new Error("MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are required");
  }

  const mobile = toE164India(phone10);
  const response = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      authkey: authKey,
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile,
      otp: String(otp),
      otp_expiry: 5,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.type === "error") {
    throw new Error(data.message || data.msg || "MSG91 OTP send failed");
  }
  return { provider: "msg91", id: data.request_id || data.message };
}

async function sendTwilio(phone10, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER are required"
    );
  }

  const body = new URLSearchParams({
    To: `+91${phone10}`,
    From: from,
    Body: `Your Sparkle Crackers admin login OTP is ${otp}. Valid for 5 minutes. Do not share.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Twilio SMS send failed");
  }
  return { provider: "twilio", id: data.sid };
}

async function sendFast2Sms(phone10, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY is required");

  // Prefer DLT template route when template id is set
  const templateId = process.env.FAST2SMS_TEMPLATE_ID;
  const senderId = process.env.FAST2SMS_SENDER_ID || "";

  const params = new URLSearchParams({
    authorization: apiKey,
    route: templateId ? "dlt" : "otp",
    numbers: phone10,
    flash: "0",
  });

  if (templateId) {
    params.set("sender_id", senderId);
    params.set("message", templateId);
    params.set("variables_values", String(otp));
  } else {
    params.set("variables_values", String(otp));
    params.set(
      "message",
      `Your Sparkle Crackers admin login OTP is ${otp}. Valid for 5 minutes.`
    );
  }

  const response = await fetch(
    `https://www.fast2sms.com/dev/bulkV2?${params.toString()}`,
    {
      method: "GET",
      headers: { authorization: apiKey },
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.return === false) {
    throw new Error(data.message || "Fast2SMS send failed");
  }
  return { provider: "fast2sms", id: data.request_id };
}

export function getSmsProvider() {
  return String(process.env.SMS_PROVIDER || "").trim().toLowerCase();
}

export function isSmsConfigured() {
  const provider = getSmsProvider();
  if (provider === "msg91") {
    return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
  }
  if (provider === "twilio") {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER
    );
  }
  if (provider === "fast2sms") {
    return Boolean(process.env.FAST2SMS_API_KEY);
  }
  return false;
}

export async function sendOtpSms(phone10, otp) {
  const provider = getSmsProvider();

  if (provider === "msg91") return sendMsg91(phone10, otp);
  if (provider === "twilio") return sendTwilio(phone10, otp);
  if (provider === "fast2sms") return sendFast2Sms(phone10, otp);

  // Dev fallback
  console.log(`[sms:console] OTP for ${phone10}: ${otp}`);
  return { provider: "console", id: "console" };
}
