import express from "express";
import initializeAuthRoutes from "./auth";
import initializeTransferRoutes from "./transfer";
import initializeAdminRoutes from "./admin";
import {
  IAuthService,
  ITransferService,
} from "../../interfaces/services.interface";
import {
  IUserRepository,
  IAccountRepository,
} from "../../interfaces/repositories.interface";

const router = express.Router();

export const initializeV1Routes = (
  services: {
    authService: IAuthService;
    transferService: ITransferService;
  },
  repositories: {
    userRepository: IUserRepository;
    accountRepository: IAccountRepository;
  }
) => {
  router.use("/auth", initializeAuthRoutes(services.authService));

  router.use(
    "/transfer",
    initializeTransferRoutes(
      services.transferService,
      repositories.accountRepository
    )
  );

  router.use(
    "/admin",
    initializeAdminRoutes(
      repositories.userRepository,
      repositories.accountRepository
    )
  );

  return router;
};

export default initializeV1Routes;
