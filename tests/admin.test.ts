import request from "supertest";
import { Application } from "express";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearDatabase,
} from "./utils/test-setup";
import { UserModel } from "../src/entities/user.entities";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("Admin API", () => {
  let app: Application;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    const setup = await setupTestEnvironment();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await clearDatabase();

    const hashedPassword = await bcrypt.hash("admin123", 12);
    const adminUser = new UserModel({
      email: "admin@example.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });
    await adminUser.save();

    const customerResponse = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        email: "customer@example.com",
        password: "password123",
        firstName: "Customer",
        lastName: "User",
      });

    customerToken = customerResponse.body.accessToken;

    const adminResponse = await request(app).post("/api/v1/auth/signin").send({
      email: "admin@example.com",
      password: "admin123",
    });

    if (adminResponse.status === 200) {
      adminToken = adminResponse.body.accessToken;

      try {
        const decoded = jwt.verify(
          adminToken,
          process.env.JWT_ACCESS_SECRET!
        ) as any;
      } catch (error) {
        console.log("Token verification failed:", error);
      }
    } else {
      const dbAdmin = await UserModel.findOne({ email: "admin@example.com" });

      const altAdminResponse = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "altadmin@example.com",
          password: "admin123",
          firstName: "AltAdmin",
          lastName: "User",
        });

      if (altAdminResponse.status === 201) {
        await UserModel.findOneAndUpdate(
          { email: "altadmin@example.com" },
          { role: "admin" }
        );

        const altSignin = await request(app).post("/api/v1/auth/signin").send({
          email: "altadmin@example.com",
          password: "admin123",
        });

        adminToken = altSignin.body.accessToken;
      }
    }
  });

  describe("GET /api/v1/admin/dashboard", () => {
    it("should allow access for admin users", async () => {
      const response = await request(app)
        .get("/api/v1/admin/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("systemStatus");
    });

    it("should reject access for customer users", async () => {
      const response = await request(app)
        .get("/api/v1/admin/dashboard")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Insufficient permissions");
    });

    it("should reject access without authentication", async () => {
      const response = await request(app).get("/api/v1/admin/dashboard");

      expect(response.status).toBe(401);
    });
  });
});
