import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../index";

const validInvestor = {
    name: "Goldman Sachs Asset Management",
    investor_type: "Institution",
    email: "investments@gsam.com",
};

describe("GET /investors", () => {
    it("returns an empty array when no investors exist", async () => {
        const res = await request(app).get("/investors");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("returns all investors", async () => {
        await request(app).post("/investors").send(validInvestor);
        await request(app).post("/investors").send({ ...validInvestor, email: "other@gsam.com" });

        const res = await request(app).get("/investors");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });
});

describe("POST /investors", () => {
    it("creates an investor and returns 201 with all fields", async () => {
        const res = await request(app).post("/investors").send(validInvestor);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject(validInvestor);
        expect(res.body.id).toBeDefined();
        expect(res.body.created_at).toBeDefined();
    });

    it("returns 409 when email already exists", async () => {
        await request(app).post("/investors").send(validInvestor);
        const res = await request(app).post("/investors").send(validInvestor);

        expect(res.status).toBe(409);
    });

    it("returns 400 when email is invalid", async () => {
        const res = await request(app).post("/investors").send({ ...validInvestor, email: "not-an-email" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when investor_type is invalid", async () => {
        const res = await request(app).post("/investors").send({ ...validInvestor, investor_type: "Hedge Fund" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when name is missing", async () => {
        const { name, ...body } = validInvestor;
        const res = await request(app).post("/investors").send(body);

        expect(res.status).toBe(400);
    });

    it("accepts all valid investor types", async () => {
        const types = ["Individual", "Institution", "Family Office"];

        for (const [i, investor_type] of types.entries()) {
            const res = await request(app)
                .post("/investors")
                .send({ ...validInvestor, email: `test${i}@test.com`, investor_type });

            expect(res.status).toBe(201);
            expect(res.body.investor_type).toBe(investor_type);
        }
    });
});