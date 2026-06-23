import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import logger from '../../config/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export async function sendOtpEmail(email: string, otp: string, purpose: 'email_verify' | 'forgot_password') {
  const subject = purpose === 'email_verify'
    ? 'Verify your HealthLete account'
    : 'Reset your HealthLete password';

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>This code expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject,
      html,
    });
    logger.info({ email, purpose }, 'OTP email sent');
  } catch (err) {
    logger.error({ err, email }, 'Failed to send OTP email');
    throw err;
  }
}