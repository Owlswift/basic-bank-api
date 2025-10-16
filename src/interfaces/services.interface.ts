import { ITransfer } from "../entities/transfer.entities";
import { IUser } from "../entities/user.entities";
import { AuthTokens, UserRole } from "../types/common";

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface TransferData {
  toAccountNumber: string;
  amount: number;
  description?: string;
}

export interface IAuthService {
  signup(userData: SignupData): Promise<{ user: Partial<IUser> } & AuthTokens>;
  signin(
    email: string,
    password: string
  ): Promise<{ user: Partial<IUser> } & AuthTokens>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
}

export interface ITransferService {
  initiateTransfer(
    fromUserId: string,
    toAccountNumber: string,
    amount: number,
    description?: string
  ): Promise<ITransfer>;
  getTransferHistory(userId: string): Promise<ITransfer[]>;
}
