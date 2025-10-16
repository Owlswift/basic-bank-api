import { Model } from "mongoose";
import { IAccount } from "../entities/account.entities";
import { IAccountRepository } from "../interfaces/repositories.interface";

export class AccountRepository implements IAccountRepository {
  constructor(private accountModel: Model<IAccount>) {}

  async create(accountData: Partial<IAccount>): Promise<IAccount> {
    const account = new this.accountModel(accountData);
    return await account.save();
  }

  async findByAccountNumber(accountNumber: string): Promise<IAccount | null> {
    return await this.accountModel.findOne({ accountNumber, isActive: true });
  }

  async findByUserId(userId: string): Promise<IAccount | null> {
    return await this.accountModel.findOne({ userId, isActive: true });
  }

  async updateBalance(
    accountId: string,
    amount: number
  ): Promise<IAccount | null> {
    return await this.accountModel.findByIdAndUpdate(
      accountId,
      { $inc: { balance: amount } },
      { new: true }
    );
  }
}
