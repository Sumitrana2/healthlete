import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";
import { env } from "../../config/env";
import logger from "../logger/logger";

@Injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  async sendOtpEmail(
    email: string,
    otp: string,
    purpose: "email_verify" | "forgot_password"
  ) {
    if (env.NODE_ENV === "development") {
      console.log(`\n📧 DEV OTP for ${email} (${purpose}): ${otp}\n`);
    }

    const subject =
      purpose === "email_verify"
        ? "Verify your HealthLete account"
        : "Reset your HealthLete password";

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
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject,
        html,
      });
      logger.info({ email, purpose }, "OTP email sent");
    } catch (err) {
      if (env.NODE_ENV === "development") {
        logger.warn(
          { email, purpose, err },
          "DEV: SMTP failed — OTP was already printed to console"
        );
        return;
      }
      logger.error({ err, email }, "Failed to send OTP email");
      throw err;
    }
  }
}
