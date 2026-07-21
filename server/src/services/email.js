import nodemailer from "nodemailer";

let transporterPromise = null;
let usingEthereal = false;
let etherealUser = "";

function hasRealSmtp() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  if (!host || !user || !pass) return false;
  if (pass === "your_gmail_app_password" || pass === "your_app_password") {
    return false;
  }
  return true;
}

export function getAdminEmail() {
  return String(process.env.ADMIN_EMAIL || "mr.mit97@gmail.com")
    .trim()
    .toLowerCase();
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function isAdminEmail(email) {
  return normalizeEmail(email) === getAdminEmail();
}

export function maskEmail(email) {
  const value = normalizeEmail(email);
  const [name, domain] = value.split("@");
  if (!name || !domain) return value;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export function isEmailConfigured() {
  // Always allow OTP request: real SMTP or Ethereal test mail
  return Boolean(getAdminEmail());
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (hasRealSmtp()) {
        usingEthereal = false;
        const port = Number(process.env.SMTP_PORT || 587);
        console.log(
          `[email] Real SMTP ${process.env.SMTP_HOST}:${port} as ${process.env.SMTP_USER}`
        );
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: port === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }

      // Fallback so login works before Gmail App Password is set
      const testAccount = await nodemailer.createTestAccount();
      usingEthereal = true;
      etherealUser = testAccount.user;
      console.log(
        `[email] SMTP_PASS missing — using Ethereal test inbox ${testAccount.user}`
      );
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();
  }
  return transporterPromise;
}

export async function sendOtpEmail(toEmail, otp) {
  const mailer = await getTransporter();
  const recipient = normalizeEmail(toEmail || getAdminEmail());
  const from = usingEthereal
    ? `"Crackaro" <${etherealUser}>`
    : process.env.SMTP_FROM ||
      `"Crackaro" <${process.env.SMTP_USER}>`;

  const info = await mailer.sendMail({
    from,
    to: recipient,
    subject: "Your Crackaro admin OTP",
    text: `Your admin login OTP is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border:1px solid #fde68a; border-radius:12px;">
        <h2 style="color:#be123c;margin:0 0 12px;">Crackaro Admin</h2>
        <p style="color:#374151;margin:0 0 8px;">Your one-time password for admin login:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#111827;margin:20px 0;">${otp}</p>
        <p style="color:#6b7280;font-size:13px;margin:0;">Valid for 5 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log(`[email] OTP preview: ${previewUrl}`);
  } else {
    console.log(`[email] OTP mailed to ${recipient} id=${info.messageId}`);
  }

  return {
    provider: usingEthereal ? "ethereal" : "nodemailer",
    id: info.messageId,
    to: recipient,
    previewUrl,
  };
}
