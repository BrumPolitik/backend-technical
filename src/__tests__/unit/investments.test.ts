import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import investmentsRouter from "../../routers/investments";
import { errorHandler } from "../../middleware/errorHandler";
import pool from "../../db";

vi.mock("../../db");

const mockedQuery = pool.query as ReturnType<typeof vi.fn>;

const app = express();
app.use(express.json());
app.use("/funds/:fund_id/investments", investmentsRouter);
app.use(errorHandler);

const FUND_ID = "550e8400-e29b-41d4-a716-446655440000";
const INVESTOR_ID = "770e8400-e29b-41d4-a716-446655440002";

const mockInvestment = {
    id: "990e8400-e29b-41d4-a716-446655440004",
    investor_id: INVESTOR_ID,
    fund_id: FUND_ID,
    amount_usd: "50000000.00",
    investment_date: "2024-03-15",
};

beforeEach(() => vi.clearAllMocks());

// ── GET /funds/:fund_id/investments ───────────────────────────

describe("GET /funds/:fund_id/investments", () => {
    it("returns all investments for a fund with 200", async () => {
        mockedQuery
            .mockResolvedValueOnce({ rowCount: 1 })
            .mockResolvedValueOnce({ rows: [mockInvestment] });

        const res = await request(app).get(`/funds/${FUND_ID}/investments`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([mockInvestment]);
    });

    it("returns an empty array when fund has no investments", async () => {
        mockedQuery
            .mockResolvedValueOnce({ rowCount: 1 })
            .mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get(`/funds/${FUND_ID}/investments`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("returns 404 when fund does not exist", async () => {
        mockedQuery.mockResolvedValueOnce({ rowCount: 0 });

        const res = await request(app).get(`/funds/${FUND_ID}/investments`);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Fund not found");
    });

    it("returns 400 when fund_id is not a valid UUID", async () => {
        const res = await request(app).get("/funds/not-a-uuid/investments");

        expect(res.status).toBe(400);
    });

    it("returns 500 when the database throws", async () => {
        mockedQuery.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app).get(`/funds/${FUND_ID}/investments`);

        expect(res.status).toBe(500);
    });
});

// ── POST /funds/:fund_id/investments ──────────────────────────

describe("POST /funds/:fund_id/investments", () => {
    const validBody = {
        investor_id: INVESTOR_ID,
        amount_usd: 75000000.00,
        investment_date: "2024-09-22",
    };

    it("creates an investment and returns 201", async () => {
        mockedQuery
            .mockResolvedValueOnce({ rows: [{ fund_exists: true, investor_exists: true }] })
            .mockResolvedValueOnce({ rows: [mockInvestment] });

        const res = await request(app).post(`/funds/${FUND_ID}/investments`).send(validBody);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(mockInvestment);
    });

    it("returns 404 when fund does not exist", async () => {
        mockedQuery.mockResolvedValueOnce({
            rows: [{ fund_exists: false, investor_exists: true }],
        });

        const res = await request(app).post(`/funds/${FUND_ID}/investments`).send(validBody);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Fund not found");
    });

    it("returns 404 when investor does not exist", async () => {
        mockedQuery.mockResolvedValueOnce({
            rows: [{ fund_exists: true, investor_exists: false }],
        });

        const res = await request(app).post(`/funds/${FUND_ID}/investments`).send(validBody);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Investor not found");
    });

    it("returns 404 for investment when neither fund nor investor exist", async () => {
        mockedQuery.mockResolvedValueOnce({
            rows: [{ fund_exists: false, investor_exists: false }],
        });

        const res = await request(app).post(`/funds/${FUND_ID}/investments`).send(validBody);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Fund not found");
    });

    it("returns 400 when fund_id is not a valid UUID", async () => {
        const res = await request(app).post("/funds/not-a-uuid/investments").send(validBody);

        expect(res.status).toBe(400);
    });

    it("returns 400 when investor_id is not a valid UUID", async () => {
        const res = await request(app)
            .post(`/funds/${FUND_ID}/investments`)
            .send({ ...validBody, investor_id: "not-a-uuid" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when amount_usd is negative", async () => {
        const res = await request(app)
            .post(`/funds/${FUND_ID}/investments`)
            .send({ ...validBody, amount_usd: -100 });

        expect(res.status).toBe(400);
    });

    it("returns 400 when amount_usd is zero", async () => {
        const res = await request(app)
            .post(`/funds/${FUND_ID}/investments`)
            .send({ ...validBody, amount_usd: 0 });

        expect(res.status).toBe(400);
    });

    it("returns 400 when investment_date is in the wrong format", async () => {
        const res = await request(app)
            .post(`/funds/${FUND_ID}/investments`)
            .send({ ...validBody, investment_date: "22-09-2024" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when investment_date is missing", async () => {
        const res = await request(app)
            .post(`/funds/${FUND_ID}/investments`)
            .send({ ...validBody, investment_date: undefined });

        expect(res.status).toBe(400);
    });

    it("returns 409 when investor has already committed to this fund", async () => {
        mockedQuery
            .mockResolvedValueOnce({ rows: [{ fund_exists: true, investor_exists: true }] })
            .mockRejectedValueOnce({ code: "23505" });

        const res = await request(app).post(`/funds/${FUND_ID}/investments`).send(validBody);

        expect(res.status).toBe(409);
    });

    it("returns 500 when the database throws", async () => {
        mockedQuery.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app).post(`/funds/${FUND_ID}/investments`).send(validBody);

        expect(res.status).toBe(500);
    });
});