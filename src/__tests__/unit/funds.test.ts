import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import fundsRouter from "../../routers/funds";
import { errorHandler } from "../../middleware/errorHandler";
import pool from "../../db";

//Must be same as pool import to work
vi.mock("../../db");

const mockedQuery = pool.query as ReturnType<typeof vi.fn>;

const app = express();
app.use(express.json());
app.use("/funds", fundsRouter);
app.use(errorHandler);

const mockFund = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Titanbay Growth Fund I",
    vintage_year: 2024,
    target_size_usd: "250000000.00",
    status: "Fundraising",
    created_at: "2024-01-15T10:30:00Z",
};

beforeEach(() => vi.clearAllMocks());

// ── GET /funds ────────────────────────────────────────────────

describe("GET /funds", () => {
    it("returns all funds with 200", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [mockFund] });

        const res = await request(app).get("/funds");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([mockFund]);
    });

    it("returns an empty array when no funds exist", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get("/funds");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("returns 500 when the database throws", async () => {
        mockedQuery.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app).get("/funds");

        expect(res.status).toBe(500);
    });
});

// ── GET /funds/:id ────────────────────────────────────────────

describe("GET /funds/:id", () => {
    it("returns the fund with 200 when found", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [mockFund] });

        const res = await request(app).get(`/funds/${mockFund.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockFund);
    });

    it("returns 404 when the fund does not exist", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get("/funds/550e8400-e29b-41d4-a716-446655440000");

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Fund not found");
    });

    it("returns 400 when id is not a valid UUID", async () => {
        const res = await request(app).get("/funds/not-a-uuid");

        expect(res.status).toBe(400);
    });

    it("returns 500 when the database throws", async () => {
        mockedQuery.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app).get(`/funds/${mockFund.id}`);

        expect(res.status).toBe(500);
    });
});

// ── POST /funds ───────────────────────────────────────────────

describe("POST /funds", () => {
    const validBody = {
        name: "Titanbay Growth Fund II",
        vintage_year: 2025,
        target_size_usd: 500000000.00,
        status: "Fundraising",
    };

    it("creates a fund and returns 201", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [mockFund] });

        const res = await request(app).post("/funds").send(validBody);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(mockFund);
    });

    it("returns 400 when name is missing", async () => {
        const res = await request(app).post("/funds").send({ ...validBody, name: undefined });

        expect(res.status).toBe(400);
    });

    it("returns 400 when vintage_year is not an integer", async () => {
        const res = await request(app).post("/funds").send({ ...validBody, vintage_year: 20.5 });

        expect(res.status).toBe(400);
    });

    it("returns 400 when vintage_year is out of range", async () => {
        const res = await request(app).post("/funds").send({ ...validBody, vintage_year: 1800 });

        expect(res.status).toBe(400);
    });

    it("returns 400 when target_size_usd is negative", async () => {
        const res = await request(app).post("/funds").send({ ...validBody, target_size_usd: -100 });

        expect(res.status).toBe(400);
    });

    it("returns 400 when target_size_usd is zero", async () => {
        const res = await request(app).post("/funds").send({ ...validBody, target_size_usd: 0 });

        expect(res.status).toBe(400);
    });

    it("returns 400 when status is invalid", async () => {
        const res = await request(app).post("/funds").send({ ...validBody, status: "InvalidStatus" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when body is empty", async () => {
        const res = await request(app).post("/funds").send({});

        expect(res.status).toBe(400);
    });

    it("returns 500 when the database throws", async () => {
        mockedQuery.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app).post("/funds").send(validBody);

        expect(res.status).toBe(500);
    });
});

// ── PUT /funds ────────────────────────────────────────────────

describe("PUT /funds", () => {
    const validBody = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 300000000.00,
        status: "Investing",
    };

    it("updates a fund and returns 200", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [{ ...mockFund, ...validBody }] });

        const res = await request(app).put("/funds").send(validBody);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("Investing");
    });

    it("returns 404 when the fund does not exist", async () => {
        mockedQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).put("/funds").send(validBody);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Fund not found");
    });

    it("returns 400 when id is missing", async () => {
        const res = await request(app).put("/funds").send({ ...validBody, id: undefined });

        expect(res.status).toBe(400);
    });

    it("returns 400 when id is not a valid UUID", async () => {
        const res = await request(app).put("/funds").send({ ...validBody, id: "not-a-uuid" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when status is invalid", async () => {
        const res = await request(app).put("/funds").send({ ...validBody, status: "InvalidStatus" });

        expect(res.status).toBe(400);
    });

    it("returns 500 when the database throws", async () => {
        mockedQuery.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app).put("/funds").send(validBody);

        expect(res.status).toBe(500);
    });
});