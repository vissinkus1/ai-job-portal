/**
 * Jobs API Integration Tests
 * Tests: CRUD operations, search, filtering, pagination
 *
 * Run with: npx vitest run server/tests/jobs.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import cookieParser from "cookie-parser";

let app;
let employerToken;
let seekerToken;
let createdJobId;

beforeAll(async () => {
    const testUri = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/ai_job_portal_test_jobs";

    try {
        await mongoose.connect(testUri, { serverSelectionTimeoutMS: 2500 });
    } catch (err) {
        console.warn("⚠️  Could not connect to test MongoDB. Skipping integration tests.");
        return;
    }

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Import routes
    const authRoutes = (await import("../routes/authRoutes.js")).default;
    const jobRoutes = (await import("../routes/jobRoutes.js")).default;
    const rateLimit = (await import("express-rate-limit")).default;

    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
    app.use("/api/auth", authRoutes(limiter, limiter));
    app.use("/api/jobs", jobRoutes);

    // Register & login an employer
    await request(app).post("/api/auth/register").send({
        name: "Test Employer",
        email: "employer@test.com",
        password: "TestPass123!",
        role: "employer",
    });
    const empLogin = await request(app).post("/api/auth/login").send({
        email: "employer@test.com",
        password: "TestPass123!",
    });
    employerToken = empLogin.body.token;

    // Register & login a seeker
    await request(app).post("/api/auth/register").send({
        name: "Test Seeker",
        email: "seeker@test.com",
        password: "TestPass123!",
        role: "seeker",
    });
    const seekerLogin = await request(app).post("/api/auth/login").send({
        email: "seeker@test.com",
        password: "TestPass123!",
    });
    seekerToken = seekerLogin.body.token;
});

afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    }
});

describe("Jobs API", () => {
    describe("POST /api/jobs — Create Job", () => {
        it("should create a job as employer", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${employerToken}`)
                .send({
                    title: "Senior React Developer",
                    company: "Acme Corp",
                    location: "Bangalore, India",
                    type: "Full-time",
                    experienceLevel: "Senior",
                    description: "We are looking for a senior React developer to join our team and build amazing products.",
                    skills: ["React", "Node.js", "TypeScript"],
                    salary: "₹15L - ₹25L",
                });

            expect(res.status).toBe(201);
            expect(res.body.title).toBe("Senior React Developer");
            expect(res.body.skills).toContain("React");
            createdJobId = res.body._id;
        });

        it("should reject job creation by seeker", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${seekerToken}`)
                .send({
                    title: "Unauthorized Job",
                    company: "Test",
                    location: "Test",
                    description: "This should not be created because seekers cannot post jobs.",
                });

            expect(res.status).toBe(403);
        });

        it("should reject job without required fields", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${employerToken}`)
                .send({ title: "Missing Fields" });

            expect(res.status).toBe(400);
        });

        it("should reject unauthenticated job creation", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/jobs")
                .send({
                    title: "No Auth Job",
                    company: "Test",
                    location: "Test",
                    description: "This should be rejected because no token is provided.",
                });

            expect(res.status).toBe(401);
        });

        it("should reject invalid job type", async () => {
            if (!app) return;

            const res = await request(app)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${employerToken}`)
                .send({
                    title: "Bad Type Job",
                    company: "Test Corp",
                    location: "Remote",
                    description: "A valid description for the job posting here.",
                    type: "InvalidType",
                });

            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/jobs — List Jobs", () => {
        it("should return all jobs (public, no auth needed)", async () => {
            if (!app) return;

            const res = await request(app).get("/api/jobs");

            expect(res.status).toBe(200);
            // Could be array or paginated object
            const jobs = Array.isArray(res.body) ? res.body : res.body.jobs;
            expect(jobs.length).toBeGreaterThanOrEqual(1);
        });

        it("should filter by search term", async () => {
            if (!app) return;

            const res = await request(app).get("/api/jobs?search=React");

            expect(res.status).toBe(200);
            const jobs = Array.isArray(res.body) ? res.body : res.body.jobs;
            expect(jobs.length).toBeGreaterThanOrEqual(1);
            expect(jobs[0].title).toContain("React");
        });

        it("should filter by job type", async () => {
            if (!app) return;

            const res = await request(app).get("/api/jobs?type=Full-time");

            expect(res.status).toBe(200);
            const jobs = Array.isArray(res.body) ? res.body : res.body.jobs;
            jobs.forEach((job) => expect(job.type).toBe("Full-time"));
        });

        it("should return paginated results", async () => {
            if (!app) return;

            const res = await request(app).get("/api/jobs?limit=1&page=1");

            expect(res.status).toBe(200);
            expect(res.body.jobs).toBeDefined();
            expect(res.body.totalPages).toBeDefined();
            expect(res.body.total).toBeDefined();
        });
    });

    describe("GET /api/jobs/:id — Single Job", () => {
        it("should return a single job", async () => {
            if (!app || !createdJobId) return;

            const res = await request(app).get(`/api/jobs/${createdJobId}`);

            expect(res.status).toBe(200);
            expect(res.body.title).toBe("Senior React Developer");
            expect(res.body.views).toBeGreaterThanOrEqual(1);
        });

        it("should return 404 for non-existent job", async () => {
            if (!app) return;

            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/jobs/${fakeId}`);

            expect(res.status).toBe(404);
        });
    });

    describe("PUT /api/jobs/:id — Update Job", () => {
        it("should update own job as employer", async () => {
            if (!app || !createdJobId) return;

            const res = await request(app)
                .put(`/api/jobs/${createdJobId}`)
                .set("Authorization", `Bearer ${employerToken}`)
                .send({ title: "Updated React Developer" });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe("Updated React Developer");
        });

        it("should reject update by non-owner", async () => {
            if (!app || !createdJobId) return;

            // Create a second employer
            await request(app).post("/api/auth/register").send({
                name: "Other Employer",
                email: "other@test.com",
                password: "TestPass123!",
                role: "employer",
            });
            const otherLogin = await request(app).post("/api/auth/login").send({
                email: "other@test.com",
                password: "TestPass123!",
            });

            const res = await request(app)
                .put(`/api/jobs/${createdJobId}`)
                .set("Authorization", `Bearer ${otherLogin.body.token}`)
                .send({ title: "Hijacked Title" });

            expect(res.status).toBe(401);
        });
    });

    describe("DELETE /api/jobs/:id — Delete Job", () => {
        it("should reject deletion by seeker", async () => {
            if (!app || !createdJobId) return;

            const res = await request(app)
                .delete(`/api/jobs/${createdJobId}`)
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(403);
        });

        it("should delete own job as employer", async () => {
            if (!app || !createdJobId) return;

            const res = await request(app)
                .delete(`/api/jobs/${createdJobId}`)
                .set("Authorization", `Bearer ${employerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("removed");
        });

        it("should return 404 when deleting already-deleted job", async () => {
            if (!app || !createdJobId) return;

            const res = await request(app)
                .delete(`/api/jobs/${createdJobId}`)
                .set("Authorization", `Bearer ${employerToken}`);

            expect(res.status).toBe(404);
        });
    });
});
