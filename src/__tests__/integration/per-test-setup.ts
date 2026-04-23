import { beforeEach, afterAll } from "vitest";
import pool from "../../db";

beforeEach(async () => {
    // investments references both investors and funds, must be truncated first
    await pool.query("TRUNCATE TABLE investments, investors, funds RESTART IDENTITY CASCADE");
});

afterAll(async () => {
    await pool.end();
});