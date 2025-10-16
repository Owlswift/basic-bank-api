import { Model } from "mongoose";
import { nanoid } from "nanoid";
import { ITransfer } from "../entities/transfer.entities";
import { IAccountRepository } from "../interfaces/repositories.interface";
import { ITransferService } from "../interfaces/services.interface";

export class TransferService implements ITransferService {
  constructor(
    private accountRepository: IAccountRepository,
    private transferModel: Model<ITransfer>
  ) {}

  async initiateTransfer(
    fromUserId: string,
    toAccountNumber: string,
    amount: number,
    description: string = ""
  ): Promise<ITransfer> {
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    const fromAccount = await this.accountRepository.findByUserId(fromUserId);
    if (!fromAccount) {
      throw new Error("Sender account not found");
    }

    if (fromAccount.balance < amount) {
      throw new Error("Insufficient balance");
    }

    const toAccount = await this.accountRepository.findByAccountNumber(
      toAccountNumber
    );
    if (!toAccount) {
      throw new Error("Recipient account not found");
    }

    if (fromAccount._id.toString() === toAccount._id.toString()) {
      throw new Error("Cannot transfer to same account");
    }

    const transfer = new this.transferModel({
      fromAccount: fromAccount._id,
      toAccount: toAccount._id,
      amount,
      reference: nanoid(),
      description,
      status: "pending" as const,
    });

    try {
      await this.accountRepository.updateBalance(
        fromAccount._id.toString(),
        -amount
      );
      await this.accountRepository.updateBalance(
        toAccount._id.toString(),
        amount
      );

      transfer.status = "completed";
      await transfer.save();

      return transfer;
    } catch (error) {
      transfer.status = "failed";
      await transfer.save();
      throw new Error(
        `Transfer failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getTransferHistory(userId: string): Promise<ITransfer[]> {
    const userAccount = await this.accountRepository.findByUserId(userId);
    if (!userAccount) {
      throw new Error("Account not found");
    }

    return await this.transferModel
      .find({
        $or: [{ fromAccount: userAccount._id }, { toAccount: userAccount._id }],
      })
      .populate("fromAccount", "accountNumber")
      .populate("toAccount", "accountNumber")
      .sort({ createdAt: -1 });
  }
}
