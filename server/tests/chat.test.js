/**
 * Chat API Integration Tests
 * Tests: send messages, fetch conversations, fetch messages
 *
 * Run with: npx vitest run server/tests/chat.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import cookieParser from "cookie-parser";

let app;
let user1Token, user2Token;
let user1Id, user2Id;

beforeAll(async () => {
    const testUri = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/ai_job_portal_test_chat";

    try {
        await mongoose.connect(testUri, { serverSelectionTimeoutMS: 2500 });
    } catch (err) {
        console.warn("⚠️  Could not connect to test MongoDB. Skipping integration tests.");
        return;
    }

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    const authRoutes = (await import("../routes/authRoutes.js")).default;
    const chatRoutes = (await import("../routes/chatRoutes.js")).default;
    const profileRoutes = (await import("../routes/profileRoutes.js")).default;
    const rateLimit = (await import("express-rate-limit")).default;

    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
    app.use("/api/auth", authRoutes(limiter, limiter));
    app.use("/api/chat", chatRoutes);
    app.use("/api/profile", profileRoutes);

    // Create two users
    await request(app).post("/api/auth/register").send({
        name: "Chat User 1",
        email: "chat1@test.com",
        password: "TestPass123!",
    });
    const login1 = await request(app).post("/api/auth/login").send({
        email: "chat1@test.com",
        password: "TestPass123!",
    });
    user1Token = login1.body.token;

    await request(app).post("/api/auth/register").send({
        name: "Chat User 2",
        email: "chat2@test.com",
        password: "TestPass123!",
    });
    const login2 = await request(app).post("/api/auth/login").send({
        email: "chat2@test.com",
        password: "TestPass123!",
    });
    user2Token = login2.body.token;

    // Get user IDs
    const profile1 = await request(app).get("/api/profile/me").set("Authorization", `Bearer ${user1Token}`);
    user1Id = profile1.body._id;
    const profile2 = await request(app).get("/api/profile/me").set("Authorization", `Bearer ${user2Token}`);
    user2Id = profile2.body._id;
});

afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    }
});

describe("Chat API", () => {
    describe("POST /api/chat/:userId — Send Message", () => {
        it("should send a message from user1 to user2", async () => {
            if (!app) return;

            const res = await request(app)
                .post(`/api/chat/${user2Id}`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({ content: "Hello from User 1!" });

            expect(res.status).toBe(201);
            expect(res.body.content).toBe("Hello from User 1!");
            expect(res.body.sender).toBe(user1Id);
        });

        it("should send a reply from user2 to user1", async () => {
            if (!app) return;

            const res = await request(app)
                .post(`/api/chat/${user1Id}`)
                .set("Authorization", `Bearer ${user2Token}`)
                .send({ content: "Hey! How are you?" });

            expect(res.status).toBe(201);
            expect(res.body.content).toBe("Hey! How are you?");
        });

        it("should reject empty message", async () => {
            if (!app) return;

            const res = await request(app)
                .post(`/api/chat/${user2Id}`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({ content: "" });

            expect([400, 500]).toContain(res.status);
        });

        it("should reject unauthenticated message", async () => {
            if (!app) return;

            const res = await request(app)
                .post(`/api/chat/${user2Id}`)
                .send({ content: "No auth" });

            expect(res.status).toBe(401);
        });
    });

    describe("GET /api/chat/:userId — Fetch Messages", () => {
        it("should fetch messages between two users", async () => {
            if (!app) return;

            const res = await request(app)
                .get(`/api/chat/${user2Id}`)
                .set("Authorization", `Bearer ${user1Token}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe("GET /api/chat/conversations — List Conversations", () => {
        it("should return conversations for user1", async () => {
            if (!app) return;

            const res = await request(app)
                .get("/api/chat/conversations")
                .set("Authorization", `Bearer ${user1Token}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });
});
