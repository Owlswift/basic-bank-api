import { Request, Response } from "express";
import { IAuthService } from "../interfaces/services.interface";
import { AuthenticatedRequest } from "../types/common";

export class AuthController {
  constructor(private authService: IAuthService) {}

  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.signup(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  signin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.signin(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);
      res.json(tokens);
    } catch (error) {
      res.status(401).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest;
      await this.authService.logout(authenticatedReq.user.userId);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
