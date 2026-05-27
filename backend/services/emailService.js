const nodemailer = require('nodemailer');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const PLACEHOLDER_VALUES = new Set([
  '',
  'your@gmail.com',
  'your_gmail_app_password',
  'no-reply@eventshub.com',
]);

function isConfigured(value) {
  return value && !PLACEHOLDER_VALUES.has(value.trim());
}

function hasEmailConfig() {
  return (
    isConfigured(process.env.EMAIL_HOST) &&
    isConfigured(process.env.EMAIL_PORT) &&
    isConfigured(process.env.EMAIL_USER) &&
    isConfigured(process.env.EMAIL_PASS) &&
    isConfigured(process.env.EMAIL_FROM)
  );
}

const transport = hasEmailConfig()
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

async function sendMail(options) {
  if (transport) {
    return transport.sendMail(options);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email service is not configured');
  }

  console.warn('Email service is not configured. Development email output follows.');
  console.info({
    to: options.to,
    subject: options.subject,
    previewUrl: options.previewUrl,
  });

  return { messageId: 'dev-email-not-configured' };
}

function buildEmailTemplate({
  heading,
  greeting,
  message,
  buttonText,
  buttonUrl,
  expiryText,
  footerText,
  extraContent = '',
}) {
  return `
    <div style="margin:0;padding:32px 16px;background-color:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
        <div style="background-color:#6366f1;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.2;">EventsHub</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:24px;color:#111827;">${heading}</h2>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">${message}</p>
          ${extraContent}
          <div style="margin:32px 0;text-align:center;">
            <a href="${buttonUrl}" style="display:inline-block;padding:16px 32px;background-color:#6366f1;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;border-radius:12px;">
              ${buttonText}
            </a>
          </div>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${expiryText}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">${footerText}</p>
        </div>
      </div>
    </div>
  `;
}

async function sendVerificationEmail(to, fullName, token) {
  const buttonUrl = `${CLIENT_URL}/verify-email?token=${token}`;
  const html = buildEmailTemplate({
    heading: 'Verify your account',
    greeting: `Hi ${fullName},`,
    message: 'Please verify your email to activate your account.',
    buttonText: 'Verify Email',
    buttonUrl,
    expiryText: 'Link expires in 24 hours.',
    footerText: "If you didn't create this account, ignore this email.",
  });

  return sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Verify your EventsHub account',
    html,
    previewUrl: buttonUrl,
  });
}

async function sendPasswordResetEmail(to, fullName, token) {
  const buttonUrl = `${CLIENT_URL}/reset-password?token=${token}`;
  const html = buildEmailTemplate({
    heading: 'Reset your password',
    greeting: `Hi ${fullName},`,
    message: 'We received a request to reset your EventsHub password.',
    buttonText: 'Reset Password',
    buttonUrl,
    expiryText: 'Link expires in 1 hour.',
    footerText: "If you didn't request a password reset, ignore this email.",
  });

  return sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset your EventsHub password',
    html,
    previewUrl: buttonUrl,
  });
}

async function sendInvitationEmail(
  to,
  inviterName,
  businessName,
  role,
  token
) {
  const buttonUrl = `${CLIENT_URL}/accept-invite?token=${token}`;
  const html = buildEmailTemplate({
    heading: `You're invited to join ${businessName}`,
    greeting: `Hi,`,
    message: `${inviterName} invited you to join ${businessName} on EventsHub.`,
    buttonText: 'Accept Invitation',
    buttonUrl,
    expiryText: 'Invitation expires in 48 hours.',
    footerText: "If you weren't expecting this invitation, you can ignore this email.",
    extraContent: `
      <div style="margin:0 0 24px;padding:16px;background-color:#eef2ff;border-radius:12px;">
        <p style="margin:0;font-size:14px;color:#4338ca;font-weight:700;">Invited role</p>
        <p style="margin:8px 0 0;font-size:16px;color:#111827;">${role}</p>
      </div>
    `,
  });

  return sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `You're invited to join ${businessName} on EventsHub`,
    html,
    previewUrl: buttonUrl,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvitationEmail,
};
