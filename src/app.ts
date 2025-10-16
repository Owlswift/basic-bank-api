import express from "express";
import helmet from "helmet";
import cors from "cors";
import { RedisClientType } from "redis";
import { connectDB } from "./config/database";
import redisClient from "./config/redis";

// Models
import { UserModel } from "./entities/user.entities";
import { AccountModel } from "./entities/account.entities";
import { TransferModel } from "./entities/transfer.entities";

// Repositories
import { UserRepository } from "./repositories/user-repository";
import { AccountRepository } from "./repositories/account-repository";
import { TokenRepository } from "./repositories/token-repository";

// Services
import { AuthService } from "./services/auth-service";
import { TransferService } from "./services/transfer-service";

// Routes
import { initializeV1Routes } from "./routes/v1";

// Middleware
import { generalLimiter } from "./middleware/rate-limit.middleware";

export class BankAPI {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(generalLimiter);
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    this.app.get("/health", (_req: express.Request, res: express.Response) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    });
  }

  private setupRoutes(): void {
    // Initialize dependencies
    const userRepository = new UserRepository(UserModel);
    const accountRepository = new AccountRepository(AccountModel);
    const tokenRepository = new TokenRepository(redisClient as RedisClientType);

    const authService = new AuthService(
      userRepository,
      tokenRepository,
      accountRepository
    );

    const transferService = new TransferService(
      accountRepository,
      TransferModel
    );

    const services = {
      authService,
      transferService,
    };

    const repositories = {
      userRepository,
      accountRepository,
    };

    this.app.use("/api/v1", initializeV1Routes(services, repositories));

    this.app.use("*", (_req: express.Request, res: express.Response) => {
      res.status(404).json({ error: "Route not found" });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(
      (
        error: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        console.error("Unhandled error:", error);
        res.status(500).json({
          error: "Internal server error",
          ...(process.env.NODE_ENV === "development" && {
            details: error.message,
          }),
        });
      }
    );
  }

  async start(port: string | number = process.env.PORT || 3000): Promise<void> {
    try {
      await connectDB();
      await redisClient.connect();

      this.app.listen(port, () => {
        console.log(`Bank API server running on port ${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}
