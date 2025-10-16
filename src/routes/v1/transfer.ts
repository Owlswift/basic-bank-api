import express from "express";
import {
  validateRequest,
  schemas,
} from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { ITransferService } from "../../interfaces/services.interface";
import { transferLimiter } from "../../middleware/rate-limit.middleware";
import { TransferController } from "../../controllers/tramsfer-controller";
import { IAccountRepository } from "../../interfaces/repositories.interface";

const router = express.Router();

export const initializeTransferRoutes = (
  transferService: ITransferService,
  accountRepository: IAccountRepository
) => {
  const transferController = new TransferController(
    transferService,
    accountRepository
  );

  router.post(
    "/topup",
    authenticate,
    validateRequest(schemas.topup),
    transferController.topupBalance
  );

  router.post(
    "/initiate",
    authenticate,
    transferLimiter,
    validateRequest(schemas.transfer),
    transferController.initiateTransfer
  );

  router.get("/history", authenticate, transferController.getTransferHistory);

  return router;
};

export default initializeTransferRoutes;
