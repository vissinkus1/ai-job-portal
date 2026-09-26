/**
 * Applications API Integration Tests
 * Tests: apply, check, list, status update, withdraw, notes, export
 *
 * Run with: npx vitest run server/tests/applications.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import cookieParser from "cookie-parser";

let app;
let employerToken;
let seekerToken;
let jobId;
let applicationId;

beforeAll(async () => {
    const testUri = process.env.MONGO_TEST_URI || "mongodb://localhost:27017/ai_job_portal_test_apps";

    try {
        await mongoose.connect(testUri);
    } catch (err) {
        console.warn("⚠️  Could not connect to test MongoDB. Skipping integration tests.");
        return;
    }

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Set up a fake io for notifications
    app.set("io", { to: () => ({ emit: () => {} }) });

    const authRoutes = (await import("../routes/authRoutes.js")).default;
    const jobRoutes = (await import("../routes/jobRoutes.js")).default;
    const applicationRoutes = (await import("../routes/applicationRoutes.js")).default;
    const rateLimit = (await import("express-rate-limit")).default;

    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
    app.use("/api/auth", authRoutes(limiter, limiter));
    app.use("/api/jobs", jobRoutes);
    app.use("/api/applications", applicationRoutes);

    // Create employer
    await request(app).post("/api/auth/register").send({
        name: "App Employer",
        email: "appemployer@test.com",
        password: "TestPass123!",
        role: "employer",
    });
    const empLogin = await request(app).post("/api/auth/login").send({
        email: "appemployer@test.com",
        password: "TestPass123!",
    });
    employerToken = empLogin.body.token;

    // Create seeker
    await request(app).post("/api/auth/register").send({
        name: "App Seeker",
        email: "appseeker@test.com",
        password: "TestPass123!",
        role: "seeker",
    });
    const seekerLogin = await request(app).post("/api/auth/login").send({
        email: "appseeker@test.com",
        password: "TestPass123!",
    });
    seekerToken = seekerLogin.body.token;

    // Create a job
    const jobRes = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${employerToken}`)
        .send({
            title: "Test Application Job",
            company: "Test Corp",
            location: "Remote",
            description: "This is a test job for the applications test suite.",
            skills: ["JavaScript", "React"],
        });
    jobId = jobRes.body._id;
});

afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    }
});

describe("Applications API", () => {
    describe("POST /api/applications/:jobId — Apply", () => {
        it("should apply to a job as seeker", async () => {
            if (!app) return;

            const res = await request(app)
                .post(`/api/applications/${jobId}`)
                .set("Authorization", `Bearer ${seekerToken}`)
                .send({ coverLetter: "I am very interested in this position." });

            expect(res.status).toBe(201);
            expect(res.body.application).toBeDefined();
            applicationId = res.body.application._id;
        });

        it("should reject duplicate application", async () => {
            if (!app) return;

            const res = await request(app)
                .post(`/api/applications/${jobId}`)
                .set("Authorization", `Bearer ${seekerToken}`)
                .send({ coverLetter: "Applying again" });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already applied");
        });

        it("should reject application to own job", async () => {
            if (!app) return;

            const res = await request(app)
                .post(`/api/applications/${jobId}`)
                .set("Authorization", `Bearer ${employerToken}`)
                .send({ coverLetter: "My own job" });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("cannot apply to your own");
        });

        it("should reject application to non-existent job", async () => {
            if (!app) return;

            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .post(`/api/applications/${fakeId}`)
                .set("Authorization", `Bearer ${seekerToken}`)
                .send({});

            expect(res.status).toBe(404);
        });
    });

    describe("GET /api/applications/check/:jobId — Check", () => {
        it("should confirm seeker has applied", async () => {
            if (!app) return;

            const res = await request(app)
                .get(`/api/applications/check/${jobId}`)
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.applied).toBe(true);
        });
    });

    describe("GET /api/applications/me — My Applications", () => {
        it("should return seeker's applications", async () => {
            if (!app) return;

            const res = await request(app)
                .get("/api/applications/me")
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe("GET /api/applications/job/:jobId — Applicants", () => {
        it("should return applicants for employer's job", async () => {
            if (!app) return;

            const res = await request(app)
                .get(`/api/applications/job/${jobId}`)
                .set("Authorization", `Bearer ${employerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.applications.length).toBeGreaterThanOrEqual(1);
            expect(res.body.jobSkills).toBeDefined();
        });

        it("should reject non-owner from viewing applicants", async () => {
            if (!app) return;

            const res = await request(app)
                .get(`/api/applications/job/${jobId}`)
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(401);
        });
    });

    describe("PUT /api/applications/:id/status — Update Status", () => {
        it("should update application status as employer", async () => {
            if (!app || !applicationId) return;

            const res = await request(app)
                .put(`/api/applications/${applicationId}/status`)
                .set("Authorization", `Bearer ${employerToken}`)
                .send({ status: "reviewed" });

            expect(res.status).toBe(200);
            expect(res.body.application.status).toBe("reviewed");
        });

        it("should reject invalid status", async () => {
            if (!app || !applicationId) return;

            const res = await request(app)
                .put(`/api/applications/${applicationId}/status`)
                .set("Authorization", `Bearer ${employerToken}`)
                .send({ status: "invalid_status" });

            expect(res.status).toBe(400);
        });
    });

    describe("PUT /api/applications/:id/notes — Employer Notes", () => {
        it("should save employer notes", async () => {
            if (!app || !applicationId) return;

            const res = await request(app)
                .put(`/api/applications/${applicationId}/notes`)
                .set("Authorization", `Bearer ${employerToken}`)
                .send({ notes: "Great candidate, schedule interview." });

            expect(res.status).toBe(200);
            expect(res.body.employerNotes).toBe("Great candidate, schedule interview.");
        });
    });

    describe("GET /api/applications/job/:jobId/export — CSV Export", () => {
        it("should export applicants as CSV", async () => {
            if (!app) return;

            const res = await request(app)
                .get(`/api/applications/job/${jobId}/export`)
                .set("Authorization", `Bearer ${employerToken}`);

            expect(res.status).toBe(200);
            expect(res.headers["content-type"]).toContain("text/csv");
            expect(res.text).toContain("Name,Email");
        });
    });

    describe("DELETE /api/applications/:id — Withdraw", () => {
        it("should reject withdrawal of reviewed application", async () => {
            if (!app || !applicationId) return;

            const res = await request(app)
                .delete(`/api/applications/${applicationId}`)
                .set("Authorization", `Bearer ${seekerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("pending");
        });
    });
});
