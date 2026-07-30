import crypto from 'crypto';
import { env } from '../../../config/env';

export function generateOtp(length: number = env.OTP_LENGTH): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export function compareOtp(plainOtp: string, hashedOtp: string): boolean {
  return hashOtp(plainOtp) === hashedOtp;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}