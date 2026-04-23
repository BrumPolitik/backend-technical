#!/usr/bin/env node

const { Client } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

async function cleanDb() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    await client.connect();

    // Order matters — investments references both investors and funds
    await client.query("TRUNCATE TABLE investments, investors, funds RESTART IDENTITY CASCADE");

    console.log("[clean-db] All tables truncated ✓");

    await client.end();
}

cleanDb().catch((err) => {
    console.error("[clean-db] Failed:", err.message);
    process.exit(1);
});