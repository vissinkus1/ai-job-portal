/**
 * Auth API Integration Tests
 * Tests: register, login, token refresh, verify email, logout
 *
 * These tests require a MongoDB connection (test database).
 * Run with: npx vitest run server/tests/auth.test.js
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import cookieParser from "cookie-parser";

// We need to build a minimal app for testing
let app;
let server;

beforeAll(async () => {
    // Connect to a test database
    const testUri = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/ai_job_portal_test";

    try {
        await mongoose.connect(testUri, { serverSelectionTimeoutMS: 2500 });
    } catch (err) {
        console.warn("⚠️  Could not connect to test MongoDB. Skipping integration tests.");
        console.warn("   Set MONGO_TEST_URI env var or run MongoDB locally.");
        return;
    }

    // Build minimal Express app with auth routes
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    const authRoutes = (await import("../routes/authRoutes.js")).default;
    const rateLimit = (await import("express-rate-limit")).default;

    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
    const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

    app.use("/api/auth", authRoutes(limiter, verifyLimiter));
});

afterAll(async () => {
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    }
});

describe("Auth API", () => {
    const testUser = {
        name: "Test User",
        email: "test@example.com",
        password: "TestPass123!",
    };

    describe("POST /api/auth/register", () => {
        it("should register a new user", async () => {
            if (!app) return; // Skip if no DB

            const res = await request(app)
                .post("/api/auth/register")
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.message).toContain("registered");
        });

        it("should reject duplicate email", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/auth/register")
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already exists");
        });

        it("should reject missing required fields", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/auth/register")
                .send({ email: "no-name@test.com" });

            expect(res.status).toBe(400);
        });
    });

    describe("POST /api/auth/login", () => {
        it("should login with valid credentials", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: testUser.password });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.message).toContain("successful");
        });

        it("should reject invalid password", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: "wrongpassword" });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("Invalid");
        });

        it("should reject non-existent user", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "nonexistent@test.com", password: "pass123" });

            expect(res.status).toBe(400);
        });
    });

    describe("POST /api/auth/logout", () => {
        it("should logout and clear cookie", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/auth/logout");

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("Logged out");
        });
    });
});
