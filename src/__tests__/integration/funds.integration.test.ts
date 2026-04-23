import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../index";

const validFund = {
    name: "Titanbay Growth Fund I",
    vintage_year: 2024,
    target_size_usd: 250000000.00,
    status: "Fundraising",
};

describe("GET /funds", () => {
    it("returns an empty array when no funds exist", async () => {
        const res = await request(app).get("/funds");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("returns all funds", async () => {
        await request(app).post("/funds").send(validFund);
        await request(app).post("/funds").send({ ...validFund, name: "Fund II" });

        const res = await request(app).get("/funds");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });
});

describe("GET /funds/:id", () => {
    it("returns the fund when it exists", async () => {
        const created = await request(app).post("/funds").send(validFund);
        const res = await request(app).get(`/funds/${created.body.id}`);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe(validFund.name);
    });

    it("returns 404 when fund does not exist", async () => {
        const res = await request(app).get("/funds/550e8400-e29b-41d4-a716-446655440000");

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Fund not found");
    });

    it("returns 400 when id is not a valid UUID", async () => {
        const res = await request(app).get("/funds/not-a-uuid");

        expect(res.status).toBe(400);
    });
});

describe("POST /funds", () => {
    it("creates a fund and returns 201 with all fields", async () => {
        const res = await request(app).post("/funds").send(validFund);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({...validFund, target_size_usd: "250000000.00"});
        expect(res.body.id).toBeDefined();
        expect(res.body.created_at).toBeDefined();
    });

    it("returns 400 when name is missing", async () => {
        const { name, ...body } = validFund;
        const res = await request(app).post("/funds").send(body);

        expect(res.status).toBe(400);
    });

    it("returns 400 when status is invalid", async () => {
        const res = await request(app).post("/funds").send({ ...validFund, status: "InvalidStatus" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when vintage_year is out of range", async () => {
        const res = await request(app).post("/funds").send({ ...validFund, vintage_year: 1800 });

        expect(res.status).toBe(400);
    });

    it("returns 400 when target_size_usd is negative", async () => {
        const res = await request(app).post("/funds").send({ ...validFund, target_size_usd: -100 });

        expect(res.status).toBe(400);
    });
});

describe("PUT /funds", () => {
    it("updates a fund and returns 200", async () => {
        const created = await request(app).post("/funds").send(validFund);

        const res = await request(app).put("/funds").send({
            id: created.body.id,
            ...validFund,
            status: "Investing",
            target_size_usd: 300000000.00,
        });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("Investing");
        expect(res.body.target_size_usd).toBe("300000000.00");
    });

    it("preserves created_at after update", async () => {
        const created = await request(app).post("/funds").send(validFund);

        const res = await request(app).put("/funds").send({
            id: created.body.id,
            ...validFund,
            status: "Closed",
        });

        expect(res.body.created_at).toBe(created.body.created_at);
    });

    it("returns 404 when fund does not exist", async () => {
        const res = await request(app).put("/funds").send({
            id: "550e8400-e29b-41d4-a716-446655440000",
            ...validFund,
        });

        expect(res.status).toBe(404);
    });

    it("returns 400 when id is missing", async () => {
        const res = await request(app).put("/funds").send(validFund);

        expect(res.status).toBe(400);
    });

    it("returns 400 when id is not a valid UUID", async () => {
        const res = await request(app).put("/funds").send({ ...validFund, id: "not-a-uuid" });

        expect(res.status).toBe(400);
    });
});