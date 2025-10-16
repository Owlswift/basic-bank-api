import { RedisClientType } from "redis";
import { ITokenRepository } from "../interfaces/repositories.interface";

export class TokenRepository implements ITokenRepository {
  constructor(private redisClient: RedisClientType) {}

  async setRefreshToken(
    userId: string,
    token: string,
    expiresIn: number = 7 * 24 * 60 * 60
  ): Promise<void> {
    await this.redisClient.set(`refresh_token:${userId}`, token, {
      EX: expiresIn,
    });
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return await this.redisClient.get(`refresh_token:${userId}`);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.redisClient.del(`refresh_token:${userId}`);
  }
}
