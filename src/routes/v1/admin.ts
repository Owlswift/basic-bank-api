import express from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { IUserRepository } from "../../interfaces/repositories.interface";
import { IAccountRepository } from "../../interfaces/repositories.interface";
import { AdminController } from "../../controllers/admin-controller";

const router = express.Router();

export const initializeAdminRoutes = (
  userRepository: IUserRepository,
  accountRepository: IAccountRepository
) => {
  const adminController = new AdminController(
    userRepository,
    accountRepository
  );

  router.get(
    "/dashboard",
    authenticate,
    authorize("admin"),
    adminController.getDashboard
  );

  return router;
};

export default initializeAdminRoutes;
