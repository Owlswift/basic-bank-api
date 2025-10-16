import request from "supertest";
import { Application } from "express";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearDatabase,
} from "./utils/test-setup";

describe("Auth API", () => {
  let app: Application;

  beforeAll(async () => {
    const setup = await setupTestEnvironment();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /api/v1/auth/signup", () => {
    it("should register a new user and create an account", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.role).toBe("customer");
    });

    it("should not allow duplicate email registration", async () => {
      const userData = {
        email: "duplicate@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      };

      const firstResponse = await request(app)
        .post("/api/v1/auth/signup")
        .send(userData);
      expect(firstResponse.status).toBe(201);

      const secondResponse = await request(app)
        .post("/api/v1/auth/signup")
        .send(userData);
      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.error).toContain("User already exists");
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/signin", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/signup").send({
        email: "login@example.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Doe",
      });
    });

    it("should sign in with valid credentials", async () => {
      const response = await request(app).post("/api/v1/auth/signin").send({
        email: "login@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.user.email).toBe("login@example.com");
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app).post("/api/v1/auth/signin").send({
        email: "login@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain("Invalid email or password");
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const signupResponse = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "refresh@example.com",
          password: "password123",
          firstName: "Refresh",
          lastName: "User",
        });

      refreshToken = signupResponse.body.refreshToken;
    });

    it("should refresh access token with valid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
    });

    it("should reject invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken: "invalid-token" })
        .expect(401);

      expect(response.body.error).toContain("Invalid refresh token");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should logout user and invalidate refresh token", async () => {
      const signupResponse = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "logout@example.com",
          password: "password123",
          firstName: "Logout",
          lastName: "User",
        });

      expect(signupResponse.status).toBe(201);

      const accessToken = signupResponse.body.accessToken;
      const refreshToken = signupResponse.body.refreshToken;

      const logoutResponse = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toContain("Logged out successfully");

      const refreshResponse = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body.error).toContain("Invalid refresh token");
    });
  });
});
