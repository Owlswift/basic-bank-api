import express from "express";
import { AuthController } from "../../controllers/auth-controller";
import {
  validateRequest,
  schemas,
} from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authLimiter } from "../../middleware/rate-limit.middleware";
import { IAuthService } from "../../interfaces/services.interface";

const router = express.Router();

export const initializeAuthRoutes = (authService: IAuthService) => {
  const authController = new AuthController(authService);

  router.post(
    "/signup",
    authLimiter,
    validateRequest(schemas.signup),
    authController.signup
  );

  router.post(
    "/signin",
    authLimiter,
    validateRequest(schemas.signin),
    authController.signin
  );

  router.post(
    "/refresh-token",
    validateRequest(schemas.refreshToken),
    authController.refreshToken
  );

  router.post("/logout", authenticate, authController.logout);

  return router;
};

export default initializeAuthRoutes;
