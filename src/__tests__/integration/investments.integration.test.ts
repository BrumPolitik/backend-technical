import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../index";

const validFund = {
    name: "Titanbay Growth Fund I",
    vintage_year: 2024,
    target_size_usd: 250000000.00,
    status: "Fundraising",
};

const validInvestor = {
    name: "Goldman Sachs Asset Management",
    investor_type: "Institution",
    email: "investments@gsam.com",
};

// Seed a fund and investor before each test so they are available
let fundId: string;
let investorId: string;

beforeEach(async () => {
    const fund = await request(app).post("/funds").send(validFund);
    const investor = await request(app).post("/investors").send(validInvestor);
    fundId = fund.body.id;
    investorId = investor.body.id;
});

const validInvestment = () => ({
    investor_id: investorId,
    amount_usd: 50000000.00,
    investment_date: "2024-03-15",
});

describe("GET /funds/:fund_id/investments", () => {
    it("returns an empty array when fund has no investments", async () => {
        const res = await request(app).get(`/funds/${fundId}/investments`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("returns all investments for a fund", async () => {
        await request(app).post(`/funds/${fundId}/investments`).send(validInvestment());

        const res = await request(app).get(`/funds/${fundId}/investments`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });

    it("returns 404 when fund does not exist", async () => {
        const res = await request(app).get("/funds/550e8400-e29b-41d4-a716-446655440000/investments");

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Fund not found");
    });

    it("returns 400 when fund_id is not a valid UUID", async () => {
        const res = await request(app).get("/funds/not-a-uuid/investments");

        expect(res.status).toBe(400);
    });

    it("only returns investments for the correct fund", async () => {
        const otherFund = await request(app).post("/funds").send({ ...validFund, name: "Other Fund" });
        const otherInvestor = await request(app).post("/investors").send({ ...validInvestor, email: "other@gsam.com" });

        await request(app).post(`/funds/${fundId}/investments`).send(validInvestment());
        await request(app).post(`/funds/${otherFund.body.id}/investments`).send({
            ...validInvestment(),
            investor_id: otherInvestor.body.id,
        });

        const res = await request(app).get(`/funds/${fundId}/investments`);

        expect(res.body).toHaveLength(1);
        expect(res.body[0].fund_id).toBe(fundId);
    });
});

describe("POST /funds/:fund_id/investments", () => {
    it("creates an investment and returns 201 with all fields", async () => {
        const res = await request(app)
            .post(`/funds/${fundId}/investments`)
            .send(validInvestment());

        expect(res.status).toBe(201);
        expect(res.body.fund_id).toBe(fundId);
        expect(res.body.investor_id).toBe(investorId);
        expect(res.body.amount_usd).toBe("50000000.00");
        expect(res.body.investment_date).toBe("2024-03-15");
        expect(res.body.id).toBeDefined();
    });

    it("returns 404 when fund does not exist", async () => {
        const res = await request(app)
            .post("/funds/550e8400-e29b-41d4-a716-446655440000/investments")
            .send(validInvestment());

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Fund not found");
    });

    it("returns 404 when investor does not exist", async () => {
        const res = await request(app)
            .post(`/funds/${fundId}/investments`)
            .send({ ...validInvestment(), investor_id: "550e8400-e29b-41d4-a716-446655440000" });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Investor not found");
    });

    it("returns 400 when amount_usd is negative", async () => {
        const res = await request(app)
            .post(`/funds/${fundId}/investments`)
            .send({ ...validInvestment(), amount_usd: -100 });

        expect(res.status).toBe(400);
    });

    it("returns 400 when investment_date is in wrong format", async () => {
        const res = await request(app)
            .post(`/funds/${fundId}/investments`)
            .send({ ...validInvestment(), investment_date: "15-03-2024" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when investor_id is not a valid UUID", async () => {
        const res = await request(app)
            .post(`/funds/${fundId}/investments`)
            .send({ ...validInvestment(), investor_id: "not-a-uuid" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when fund_id is not a valid UUID", async () => {
        const res = await request(app)
            .post("/funds/not-a-uuid/investments")
            .send(validInvestment());

        expect(res.status).toBe(400);
    });

    describe("investment_date validation", () => {
        it("returns 400 when investment_date is in wrong format", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "15-03-2024" });

            expect(res.status).toBe(400);
        });

        it("returns 400 when investment_date is missing", async () => {
            const { investment_date, ...body } = validInvestment();
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send(body);

            expect(res.status).toBe(400);
        });

        it("returns 400 when investment_date is not a string", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: 20240315 });

            expect(res.status).toBe(400);
        });

        it("returns 422 when investment_date is Feb 31st", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "2024-02-31" });

            expect(res.status).toBe(422);
            expect(res.body.error).toBe("Investment_date is not a valid calendar date.");
        });

        it("returns 422 when investment_date has invalid month", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "2024-13-01" });

            expect(res.status).toBe(422);
        });

        it("returns 422 when investment_date has invalid day", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "2024-01-32" });

            expect(res.status).toBe(422);
        });

        it("returns 201 for a valid leap year date", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "2024-02-29" });

            expect(res.status).toBe(201);
        });

        it("returns 422 for an invalid leap year date", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "2023-02-29" });

            expect(res.status).toBe(422);
        });

        it("returns 422 when investment_date is before the fund vintage year", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "2023-01-01" });

            // fundId was created with vintage_year 2024
            expect(res.status).toBe(422);
            expect(res.body.error).toContain("vintage year");
        });

        it("returns 201 when investment_date is in the fund vintage year", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "2024-01-01" });

            expect(res.status).toBe(201);
        });

        it("returns 201 when investment_date is after the fund vintage year", async () => {
            const res = await request(app)
                .post(`/funds/${fundId}/investments`)
                .send({ ...validInvestment(), investment_date: "2025-06-15" });

            expect(res.status).toBe(201);
        });
    });
});