import { AuthService } from "../src/services/auth-service";
import { UserRepository } from "../src/repositories/user-repository";
import { TokenRepository } from "../src/repositories/token-repository";
import { AccountRepository } from "../src/repositories/account-repository";
import { UserModel } from "../src/entities/user.entities";
import { AccountModel } from "../src/entities/account.entities";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearDatabase,
} from "./utils/test-setup";
import redisClient from "../src/config/redis";

jest.mock("../src/entities/user.entities");
jest.mock("../src/entities/account.entities");

describe("AuthService", () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let tokenRepository: TokenRepository;
  let accountRepository: AccountRepository;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await clearDatabase();

    userRepository = new UserRepository(UserModel as any);
    tokenRepository = new TokenRepository(redisClient as any);
    accountRepository = new AccountRepository(AccountModel as any);

    authService = new AuthService(
      userRepository,
      tokenRepository,
      accountRepository
    );

    jest.clearAllMocks();
  });

  describe("signup", () => {
    it("should throw error for duplicate email", async () => {
      const userData = {
        email: "duplicate@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
      };

      (UserModel.findOne as jest.Mock).mockResolvedValueOnce({
        email: "duplicate@example.com",
      });

      await expect(authService.signup(userData)).rejects.toThrow(
        "User already exists with this email"
      );
    });
  });

  describe("signin", () => {
    it("should throw error with invalid password", async () => {
      const mockUser = {
        _id: "123",
        email: "login@example.com",
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (UserModel.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(
        authService.signin("login@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error with non-existent email", async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        authService.signin("nonexistent@example.com", "password123")
      ).rejects.toThrow("Invalid email or password");
    });
  });
});
