import request from "supertest";
import { Application } from "express";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearDatabase,
} from "./utils/test-setup";
import { AccountModel } from "../src/entities/account.entities";
import { UserModel } from "../src/entities/user.entities";
import { TransferModel } from "../src/entities/transfer.entities";

describe("Transfer API", () => {
  let app: Application;
  let senderToken: string;
  let receiverToken: string;
  let senderAccountNumber: string;
  let receiverAccountNumber: string;
  let initialSenderBalance: number;
  let initialReceiverBalance: number;

  beforeAll(async () => {
    const setup = await setupTestEnvironment();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await clearDatabase();

    const senderResponse = await request(app).post("/api/v1/auth/signup").send({
      email: "sender@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Sender",
    });

    expect(senderResponse.status).toBe(201);
    senderToken = senderResponse.body.accessToken;

    const receiverResponse = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        email: "receiver@example.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Receiver",
      });

    expect(receiverResponse.status).toBe(201);
    receiverToken = receiverResponse.body.accessToken;

    await new Promise((resolve) => setTimeout(resolve, 300));

    const sender = await UserModel.findOne({ email: "sender@example.com" });
    const receiver = await UserModel.findOne({ email: "receiver@example.com" });

    const topupAmount = 500;
    await request(app)
      .post("/api/v1/transfer/topup")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ amount: topupAmount });

    const senderAccount = await AccountModel.findOne({ userId: sender!._id });
    const receiverAccount = await AccountModel.findOne({
      userId: receiver!._id,
    });
    expect(senderAccount).toBeDefined();
    expect(receiverAccount).toBeDefined();

    senderAccountNumber = senderAccount!.accountNumber;
    receiverAccountNumber = receiverAccount!.accountNumber;
    initialSenderBalance = senderAccount!.balance;
    initialReceiverBalance = receiverAccount!.balance;

    console.log(`Test Setup:
      - Sender: ${senderAccountNumber} (Balance: $${initialSenderBalance})
      - Receiver: ${receiverAccountNumber} (Balance: $${initialReceiverBalance})
    `);
  });

  describe("POST /api/v1/transfer/topup", () => {
    it("should successfully top up account balance", async () => {
      const topupAmount = 500;
      const response = await request(app)
        .post("/api/v1/transfer/topup")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ amount: topupAmount });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Balance topped up successfully",
        newBalance: initialSenderBalance + topupAmount,
      });

      const updatedAccount = await AccountModel.findOne({
        accountNumber: senderAccountNumber,
      });
      expect(updatedAccount!.balance).toBe(initialSenderBalance + topupAmount);
    });

    it("should handle multiple topups correctly", async () => {
      await request(app)
        .post("/api/v1/transfer/topup")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ amount: 300 });

      await request(app)
        .post("/api/v1/transfer/topup")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ amount: 700 });

      const updatedAccount = await AccountModel.findOne({
        accountNumber: senderAccountNumber,
      });
      expect(updatedAccount!.balance).toBe(initialSenderBalance + 1000);
    });

    it("should reject topup without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/transfer/topup")
        .send({ amount: 500 });

      expect(response.status).toBe(401);
    });

    it("should reject invalid topup amounts", async () => {
      const response = await request(app)
        .post("/api/v1/transfer/topup")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ amount: -100 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject zero topup amount", async () => {
      const response = await request(app)
        .post("/api/v1/transfer/topup")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ amount: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /api/v1/transfer/initiate", () => {
    describe("Successful Transfers", () => {
      it("should successfully transfer funds between different accounts", async () => {
        const transferData = {
          toAccountNumber: receiverAccountNumber,
          amount: 200,
          description: "Test payment for services",
        };

        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send(transferData);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
          message: "Transfer completed successfully",
          transfer: {
            reference: expect.any(String),
            amount: 200,
            status: "completed",
            createdAt: expect.any(String),
          },
        });

        const senderAccount = await AccountModel.findOne({
          accountNumber: senderAccountNumber,
        });
        const receiverAccount = await AccountModel.findOne({
          accountNumber: receiverAccountNumber,
        });
        const transferRecord = await TransferModel.findOne({
          reference: response.body.transfer.reference,
        });

        expect(senderAccount!.balance).toBe(initialSenderBalance - 200);
        expect(receiverAccount!.balance).toBe(initialReceiverBalance + 200);
        expect(transferRecord).toBeDefined();
        expect(transferRecord!.status).toBe("completed");
      });

      it("should handle multiple sequential transfers correctly", async () => {
        await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            toAccountNumber: receiverAccountNumber,
            amount: 100,
            description: "First payment",
          });

        await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            toAccountNumber: receiverAccountNumber,
            amount: 150,
            description: "Second payment",
          });

        const senderAccount = await AccountModel.findOne({
          accountNumber: senderAccountNumber,
        });
        const receiverAccount = await AccountModel.findOne({
          accountNumber: receiverAccountNumber,
        });
        const transfers = await TransferModel.find({});

        expect(senderAccount!.balance).toBe(initialSenderBalance - 250);
        expect(receiverAccount!.balance).toBe(initialReceiverBalance + 250);
        expect(transfers).toHaveLength(2);
      });
    });

    describe("Transfer Failures - Insufficient Funds", () => {
      it("should reject transfer when amount exceeds account balance", async () => {
        const excessiveAmount = initialSenderBalance + 1000;
        const transferData = {
          toAccountNumber: receiverAccountNumber,
          amount: excessiveAmount,
          description: "Large transfer attempt",
        };

        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send(transferData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Insufficient balance");

        const senderAccount = await AccountModel.findOne({
          accountNumber: senderAccountNumber,
        });
        const receiverAccount = await AccountModel.findOne({
          accountNumber: receiverAccountNumber,
        });

        expect(senderAccount!.balance).toBe(initialSenderBalance);
        expect(receiverAccount!.balance).toBe(initialReceiverBalance);
      });

      it("should reject transfer with zero balance after topup", async () => {
        const drainAmount = initialSenderBalance;
        await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            toAccountNumber: receiverAccountNumber,
            amount: drainAmount,
            description: "Drain balance",
          });

        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            toAccountNumber: receiverAccountNumber,
            amount: 1,
            description: "Should fail - zero balance",
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Insufficient balance");
      });
    });

    describe("Transfer Failures - Invalid Operations", () => {
      it("should reject transfer to own account", async () => {
        const transferData = {
          toAccountNumber: senderAccountNumber,
          amount: 100,
          description: "Self transfer attempt",
        };

        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send(transferData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain(
          "Cannot transfer to same account"
        );
      });

      it("should reject transfer to non-existent account", async () => {
        const transferData = {
          toAccountNumber: "9999999999",
          amount: 100,
          description: "Transfer to ghost account",
        };

        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send(transferData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Recipient account not found");
      });

      it("should reject transfer without authentication", async () => {
        const transferData = {
          toAccountNumber: receiverAccountNumber,
          amount: 100,
          description: "Unauthenticated attempt",
        };

        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .send(transferData);

        expect(response.status).toBe(401);
        expect(response.body.error).toContain("Access token required");
      });

      it("should reject transfer with invalid token", async () => {
        const transferData = {
          toAccountNumber: receiverAccountNumber,
          amount: 100,
          description: "Invalid token attempt",
        };

        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", "Bearer invalid-token-here")
          .send(transferData);

        expect(response.status).toBe(401);
        expect(response.body.error).toContain("Invalid or expired token");
      });
    });

    describe("Input Validation", () => {
      it("should reject negative amount", async () => {
        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            toAccountNumber: receiverAccountNumber,
            amount: -100,
            description: "Negative amount",
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("amount");
      });

      it("should reject zero amount", async () => {
        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            toAccountNumber: receiverAccountNumber,
            amount: 0,
            description: "Zero amount",
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("amount");
      });

      it("should reject non-numeric account number", async () => {
        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            toAccountNumber: "ABCDEFGHIJ",
            amount: 100,
          });

        expect(response.status).toBe(400);
      });

      it("should reject invalid account number format", async () => {
        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            toAccountNumber: "123",
            amount: 100,
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual(
          "toAccountNumber length must be 10 characters long"
        );
      });

      it("should reject missing required fields", async () => {
        const response = await request(app)
          .post("/api/v1/transfer/initiate")
          .set("Authorization", `Bearer ${senderToken}`)
          .send({
            description: "Missing fields",
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });
  });
});
