import { IUser } from "../entities/user.entities";
import { IAccount } from "../entities/account.entities";

export interface IUserRepository {
  create(userData: Partial<IUser>): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
}

export interface IAccountRepository {
  create(accountData: Partial<IAccount>): Promise<IAccount>;
  findByAccountNumber(accountNumber: string): Promise<IAccount | null>;
  findByUserId(userId: string): Promise<IAccount | null>;
  updateBalance(accountId: string, amount: number): Promise<IAccount | null>;
}

export interface ITokenRepository {
  setRefreshToken(
    userId: string,
    token: string,
    expiresIn?: number
  ): Promise<void>;
  getRefreshToken(userId: string): Promise<string | null>;
  deleteRefreshToken(userId: string): Promise<void>;
}
