import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import investorsRouter from "../../routers/investors";
import { errorHandler } from "../../middleware/errorHandler";
import pool from "../../db";

vi.mock("../../db");

const mockedQuery = pool.query as ReturnType<typeof vi.fn>;

const app = express();
app.use(express.json());
app.use("/investors", investorsRouter);
app.use(errorHandler);

const mockInvestor = {
    id: "770e8400-e29b-41d4-a716-446655440002",
    name: "Goldman Sachs Asset Management",
    investor_type: "Institution",
    email: "investments@gsam.com",
    created_at: "2024-02-10T09:15:00Z",
};

beforeEach(() => vi.clearAllMocks());

// ── GET /investors ────────────────────────────────────────────

describe("GET /investors", () => {
    it("returns all investors with 200", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [mockInvestor] });

        const res = await request(app).get("/investors");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([mockInvestor]);
    });

    it("returns an empty array when no investors exist", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get("/investors");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("returns 500 when the database throws", async () => {
        mockedQuery.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app).get("/investors");

        expect(res.status).toBe(500);
    });
});

// ── POST /investors ───────────────────────────────────────────

describe("POST /investors", () => {
    const validBody = {
        name: "CalPERS",
        investor_type: "Institution",
        email: "privateequity@calpers.ca.gov",
    };

    it("creates an investor and returns 201", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [mockInvestor] });

        const res = await request(app).post("/investors").send(validBody);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(mockInvestor);
    });

    it("returns 400 when name is missing", async () => {
        const res = await request(app).post("/investors").send({ ...validBody, name: undefined });

        expect(res.status).toBe(400);
    });

    it("returns 400 when email is invalid", async () => {
        const res = await request(app).post("/investors").send({ ...validBody, email: "not-an-email" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when email is missing", async () => {
        const res = await request(app).post("/investors").send({ ...validBody, email: undefined });

        expect(res.status).toBe(400);
    });

    it("returns 400 when investor_type is invalid", async () => {
        const res = await request(app).post("/investors").send({ ...validBody, investor_type: "Hedge Fund" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when body is empty", async () => {
        const res = await request(app).post("/investors").send({});

        expect(res.status).toBe(400);
    });

    it("returns 409 when email already exists", async () => {
        mockedQuery.mockRejectedValueOnce({ code: "23505" });

        const res = await request(app).post("/investors").send(validBody);

        expect(res.status).toBe(409);
    });

    it("returns 500 when the database throws", async () => {
        mockedQuery.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app).post("/investors").send(validBody);

        expect(res.status).toBe(500);
    });
});