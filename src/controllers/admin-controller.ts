import { Request, Response } from "express";
import {
  IUserRepository,
  IAccountRepository,
} from "../interfaces/repositories.interface";

export class AdminController {
  constructor(
    private userRepository: IUserRepository,
    private accountRepository: IAccountRepository
  ) {}

  getDashboard = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        message: "Admin dashboard data",
        timestamp: new Date().toISOString(),
        systemStatus: "Operational",
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
