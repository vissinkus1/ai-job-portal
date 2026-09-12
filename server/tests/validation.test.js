/**
 * Validation Middleware Unit Tests
 * Tests the express-validator schemas and error handler without DB.
 *
 * Run with: npx vitest run server/tests/validation.test.js
 */

import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

// Import validators and error handler
import validators from "../middleware/validators.js";
import { validate, globalErrorHandler } from "../middleware/errorHandler.js";

function buildApp(validationChain, handler) {
    const app = express();
    app.use(express.json());
    app.post("/test", validationChain, validate, handler || ((req, res) => res.json({ ok: true })));
    app.use(globalErrorHandler);
    return app;
}

describe("Validation Middleware", () => {
    describe("Job Validation", () => {
        it("should reject job without title", async () => {
            const app = buildApp(validators.createJob);
            const res = await request(app)
                .post("/test")
                .send({ company: "Acme", location: "NYC", description: "A job description that is long enough to pass validation checks." });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("title");
        });

        it("should reject job without description", async () => {
            const app = buildApp(validators.createJob);
            const res = await request(app)
                .post("/test")
                .send({ title: "Developer", company: "Acme", location: "NYC" });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("description");
        });

        it("should reject invalid job type", async () => {
            const app = buildApp(validators.createJob);
            const res = await request(app)
                .post("/test")
                .send({
                    title: "Developer",
                    company: "Acme",
                    location: "NYC",
                    description: "A valid description for the job posting.",
                    type: "InvalidType",
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("job type");
        });

        it("should accept valid job data", async () => {
            const app = buildApp(validators.createJob);
            const res = await request(app)
                .post("/test")
                .send({
                    title: "Senior React Developer",
                    company: "Acme Corp",
                    location: "Remote",
                    description: "We are looking for a senior React developer to join our team.",
                    type: "Full-time",
                    experienceLevel: "Senior",
                    skills: ["React", "Node.js"],
                });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    describe("Application Status Validation", () => {
        it("should reject invalid status", async () => {
            const app = express();
            app.use(express.json());
            app.put("/test/:id", validators.updateApplicationStatus, validate, (req, res) => res.json({ ok: true }));

            const res = await request(app)
                .put("/test/507f1f77bcf86cd799439011")
                .send({ status: "invalid_status" });

            expect(res.status).toBe(400);
        });

        it("should accept valid status", async () => {
            const app = express();
            app.use(express.json());
            app.put("/test/:id", validators.updateApplicationStatus, validate, (req, res) => res.json({ ok: true }));

            const res = await request(app)
                .put("/test/507f1f77bcf86cd799439011")
                .send({ status: "accepted" });

            expect(res.status).toBe(200);
        });
    });

    describe("Chat Message Validation", () => {
        it("should reject empty message", async () => {
            const app = express();
            app.use(express.json());
            app.post("/test/:userId", validators.sendMessage, validate, (req, res) => res.json({ ok: true }));

            const res = await request(app)
                .post("/test/507f1f77bcf86cd799439011")
                .send({ content: "" });

            expect(res.status).toBe(400);
        });

        it("should reject message over 5000 chars", async () => {
            const app = express();
            app.use(express.json());
            app.post("/test/:userId", validators.sendMessage, validate, (req, res) => res.json({ ok: true }));

            const res = await request(app)
                .post("/test/507f1f77bcf86cd799439011")
                .send({ content: "x".repeat(5001) });

            expect(res.status).toBe(400);
        });
    });

    describe("Job Alert Validation", () => {
        it("should accept valid alert", async () => {
            const app = buildApp(validators.createAlert);
            const res = await request(app)
                .post("/test")
                .send({
                    name: "My Alert",
                    keywords: ["React"],
                    jobTypes: ["Full-time"],
                    emailNotify: true,
                });

            expect(res.status).toBe(200);
        });

        it("should reject invalid job type in alert", async () => {
            const app = buildApp(validators.createAlert);
            const res = await request(app)
                .post("/test")
                .send({
                    name: "My Alert",
                    jobTypes: ["InvalidType"],
                });

            expect(res.status).toBe(400);
        });
    });
});

describe("Global Error Handler", () => {
    it("should handle thrown errors gracefully", async () => {
        const app = express();
        app.get("/crash", () => {
            throw new Error("Intentional crash");
        });
        app.use(globalErrorHandler);

        const res = await request(app).get("/crash");
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Internal server error");
    });
});
