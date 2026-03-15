const nodemailer = require('nodemailer');

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || port === 465) === 'true' || port === 465;

  return {
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER;
}

async function sendSignupOtpEmail({ to, otp }) {
  const transporter = nodemailer.createTransport(getSmtpConfig());

  const from = getFromAddress();
  if (!from) {
    throw new Error('SMTP_FROM, EMAIL_FROM, or SMTP_USER must be configured');
  }

  const subject = 'Your BookShell signup code';
  const text = `Your BookShell verification code is: ${otp}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2 style="margin: 0 0 8px;">Verify your BookShell account</h2>
      <p style="margin: 0 0 12px;">Use this code to complete signup:</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 8px 0 16px;">${otp}</div>
      <p style="margin: 0;">This code expires in 10 minutes.</p>
    </div>
  `;

  await transporter.sendMail({ from, to, subject, text, html });
}

async function sendPasswordResetOtpEmail({ to, otp }) {
  const transporter = nodemailer.createTransport(getSmtpConfig());

  const from = getFromAddress();
  if (!from) {
    throw new Error('SMTP_FROM, EMAIL_FROM, or SMTP_USER must be configured');
  }

  const subject = 'Your BookShell password reset code';
  const text = `Your BookShell password reset code is: ${otp}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2 style="margin: 0 0 8px;">Reset your BookShell password</h2>
      <p style="margin: 0 0 12px;">Use this code to reset your password:</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 8px 0 16px;">${otp}</div>
      <p style="margin: 0;">This code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({ from, to, subject, text, html });
}

module.exports = {
  sendSignupOtpEmail,
  sendPasswordResetOtpEmail,
};
