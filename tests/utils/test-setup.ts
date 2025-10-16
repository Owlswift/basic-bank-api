import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Application } from "express";
import redisClient from "../../src/config/redis";
import { BankAPI } from "../../src/app";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-key";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

let mongod: MongoMemoryServer;

export const setupTestEnvironment = async (): Promise<{
  app: Application;
  bankAPI: BankAPI;
}> => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  const mockRedis = {
    store: new Map(),
    async set(key: string, value: string, options?: any) {
      this.store.set(key, value);
      if (options?.EX) {
        setTimeout(() => this.store.delete(key), options.EX * 1000);
      }
    },
    async get(key: string) {
      return this.store.get(key) || null;
    },
    async del(key: string) {
      return this.store.delete(key);
    },
    async connect() {
      /* no-op */
    },
    async disconnect() {
      /* no-op */
    },
    isReady: () => true,
    getClient: function () {
      return this;
    },
  };

  (redisClient as any) = mockRedis;

  const bankAPI = new BankAPI();
  return { app: bankAPI.app, bankAPI };
};

export const teardownTestEnvironment = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }

  const mockRedis = redisClient as any;
  if (mockRedis.store) {
    mockRedis.store.clear();
  }
};

export const clearDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
    } catch (error) {}
  }

  const mockRedis = redisClient as any;
  if (mockRedis.store) {
    mockRedis.store.clear();
  }
};
