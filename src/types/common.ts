import { Request } from "express";

export type UserRole = "customer" | "admin";
export type TransferStatus = "pending" | "completed" | "failed" | "cancelled";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
