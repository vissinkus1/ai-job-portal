/**
 * Admin, Search, and Saved Jobs API Tests
 * Tests: admin user management, search, saved jobs
 *
 * Run with: npx vitest run server/tests/admin-search-saved.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import cookieParser from "cookie-parser";

let app;
let adminToken, seekerToken;
let jobId;

beforeAll(async () => {
    const testUri = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/ai_job_portal_test_admin";

    try {
        await mongoose.connect(testUri, { serverSelectionTimeoutMS: 2500 });
    } catch (err) {
        console.warn("⚠️  Could not connect to test MongoDB. Skipping integration tests.");
        return;
    }

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.set("io", { to: () => ({ emit: () => {} }) });

    const authRoutes = (await import("../routes/authRoutes.js")).default;
    const adminRoutes = (await import("../routes/adminRoutes.js")).default;
    const searchRoutes = (await import("../routes/searchRoutes.js")).default;
    const savedJobRoutes = (await import("../routes/savedJobRoutes.js")).default;
    const jobRoutes = (await import("../routes/jobRoutes.js")).default;
    const rateLimit = (await import("express-rate-limit")).default;

    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
    app.use("/api/auth", authRoutes(limiter, limiter));
    app.use("/api/admin", adminRoutes);
    app.use("/api/search", searchRoutes);
    app.use("/api/saved-jobs", savedJobRoutes);
    app.use("/api/jobs", jobRoutes);

    // Create admin
    await request(app).post("/api/auth/register").send({
        name: "Admin User",
        email: "admin@test.com",
        password: "TestPass123!",
        role: "admin",
    });
    const adminLogin = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "TestPass123!",
    });
    adminToken = adminLogin.body.token;

    // Create seeker
    await request(app).post("/api/auth/register").send({
        name: "Seeker User",
        email: "seekerx@test.com",
        password: "TestPass123!",
        role: "seeker",
    });
    const seekerLogin = await request(app).post("/api/auth/login").send({
        email: "seekerx@test.com",
        password: "TestPass123!",
    });
    seekerToken = seekerLogin.body.token;

    // Create employer & job for search/save tests
    await request(app).post("/api/auth/register").send({
        name: "Emp User",
        email: "empx@test.com",
        password: "TestPass123!",
        role: "employer",
    });
    const empLogin = await request(app).post("/api/auth/login").send({
        email: "empx@test.com",
        password: "TestPass123!",
    });
    const jobRes = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${empLogin.body.token}`)
        .send({
            title: "Python Developer",
            company: "Search Corp",
            location: "Delhi",
            description: "Looking for a skilled Python developer for backend systems.",
            skills: ["Python", "Django", "PostgreSQL"],
            type: "Full-time",
        });
    jobId = jobRes.body._id;
});

afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    }
});

describe("Admin API", () => {
    describe("GET /api/admin/users — List Users", () => {
        it("should return users for admin", async () => {
            if (!app) return;

            const res = await request(app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(3);
        });

        it("should reject non-admin from listing users", async () => {
            if (!app) return;

            const res = await request(app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(403);
        });
    });
});

describe("Search API", () => {
    describe("GET /api/search — Search Jobs", () => {
        it("should return matching results", async () => {
            if (!app) return;

            const res = await request(app).get("/api/search?q=Python");

            expect(res.status).toBe(200);
        });

        it("should return empty for non-matching query", async () => {
            if (!app) return;

            const res = await request(app).get("/api/search?q=zzzznotarealjobtitle");

            expect(res.status).toBe(200);
            const results = Array.isArray(res.body) ? res.body : res.body.jobs || [];
            expect(results.length).toBe(0);
        });
    });
});

describe("Saved Jobs API", () => {
    describe("POST /api/saved-jobs/:jobId — Save Job", () => {
        it("should save a job as seeker", async () => {
            if (!app) return;

            const res = await request(app)
                .post(`/api/saved-jobs/${jobId}`)
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(200);
        });
    });

    describe("GET /api/saved-jobs — List Saved", () => {
        it("should return saved jobs", async () => {
            if (!app) return;

            const res = await request(app)
                .get("/api/saved-jobs")
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe("DELETE /api/saved-jobs/:jobId — Unsave", () => {
        it("should unsave a job", async () => {
            if (!app) return;

            const res = await request(app)
                .delete(`/api/saved-jobs/${jobId}`)
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(200);
        });
    });
});
