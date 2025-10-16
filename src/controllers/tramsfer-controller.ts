import { Request, Response } from "express";
import { ITransferService } from "../interfaces/services.interface";
import { IAccountRepository } from "../interfaces/repositories.interface";
import { AuthenticatedRequest } from "../types/common";

export class TransferController {
  constructor(
    private transferService: ITransferService,
    private accountRepository: IAccountRepository
  ) {}

  initiateTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest;
      const { toAccountNumber, amount, description } = req.body;

      const transfer = await this.transferService.initiateTransfer(
        authenticatedReq.user.userId,
        toAccountNumber,
        amount,
        description
      );

      res.status(201).json({
        message: "Transfer completed successfully",
        transfer: {
          reference: transfer.reference,
          amount: transfer.amount,
          status: transfer.status,
          createdAt: transfer.createdAt,
        },
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getTransferHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest;
      const transfers = await this.transferService.getTransferHistory(
        authenticatedReq.user.userId
      );
      res.json({ transfers });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  topupBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest;
      const { amount } = req.body;

      const account = await this.accountRepository.findByUserId(
        authenticatedReq.user.userId
      );
      if (!account) {
        res.status(404).json({ error: "Account not found" });
        return;
      }

      const updatedAccount = await this.accountRepository.updateBalance(
        account._id.toString(),
        amount
      );

      res.json({
        message: "Balance topped up successfully",
        newBalance: updatedAccount!.balance,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
