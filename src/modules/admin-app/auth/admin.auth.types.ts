export interface AdminLoginResult {
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isSuperAdmin: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface MessageResult {
  message: string;
}

export interface ResetOtpResult {
  resetToken: string;
}

export type OtpPurpose = "email_verify" | "forgot_password";
