import jwt from "jsonwebtoken";
import { IUser } from "../entities/user.entities";
import {
  IUserRepository,
  IAccountRepository,
  ITokenRepository,
} from "../interfaces/repositories.interface";
import { IAuthService, SignupData } from "../interfaces/services.interface";
import { AuthTokens, JwtPayload, UserRole } from "../types/common";

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private tokenRepository: ITokenRepository,
    private accountRepository: IAccountRepository
  ) {}

  private generateAccountNumber(): string {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  private generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
      algorithm: "HS256",
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      algorithm: "HS256",
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  async signup(
    userData: SignupData
  ): Promise<{ user: Partial<IUser> } & AuthTokens> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const user = await this.userRepository.create(userData);

    let accountNumber: string;
    let accountExists = true;

    while (accountExists) {
      accountNumber = this.generateAccountNumber();
      const existingAccount = await this.accountRepository.findByAccountNumber(
        accountNumber
      );
      if (!existingAccount) {
        accountExists = false;
      }
    }

    await this.accountRepository.create({
      accountNumber: accountNumber!,
      userId: user._id,
      balance: 0,
      currency: "NGN",
    });

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.tokenRepository.setRefreshToken(
      user._id.toString(),
      tokens.refreshToken
    );

    return {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async signin(
    email: string,
    password: string
  ): Promise<{ user: Partial<IUser> } & AuthTokens> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await user.comparePassword(password))) {
      throw new Error("Invalid email or password");
    }

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.tokenRepository.setRefreshToken(
      user._id.toString(),
      tokens.refreshToken
    );

    return {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as JwtPayload;

      const storedToken = await this.tokenRepository.getRefreshToken(
        decoded.userId
      );
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error("Invalid refresh token");
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new Error("User not found");
      }

      const tokens = this.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      await this.tokenRepository.setRefreshToken(
        user._id.toString(),
        tokens.refreshToken
      );

      return tokens;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  async logout(userId: string): Promise<void> {
    await this.tokenRepository.deleteRefreshToken(userId);
  }
}
