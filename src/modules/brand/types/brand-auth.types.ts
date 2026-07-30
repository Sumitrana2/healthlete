export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role?: string;
  requestType?: string;
  budgetRange?: string;
  timeline?: string;
  campaignGoal?: string;
  campaignDescription?: string;
  language?: string;
  categoryIds?: number[];
}

export interface RegisterResult {
  brandId: string;
  email: string;
  message: string;
}

export type OtpPurpose = "email_verify" | "forgot_password";

export interface MessageResult {
  message: string;
}

export interface ResetOtpResult {
  resetToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  brand: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    // companyName: string;
    approvalStatus: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResult {
  message: string;
}
