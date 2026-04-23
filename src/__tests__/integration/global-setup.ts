import { Client } from "pg";
import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const adminClient = () =>
    new Client({
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: "postgres", // connect to default DB to create/drop test DB
    });

export async function setup(): Promise<void> {
    const client = adminClient();
    await client.connect();

    // Drop if exists from a previous crashed run, then recreate clean
    await client.query(`DROP DATABASE IF EXISTS titanbay_test`);
    await client.query(`CREATE DATABASE titanbay_test`);
    await client.end();

    console.log("[integration] Test database created ✓");

    // Run migrations against the test DB
    execSync("npx ts-node src/db/migrate.ts", {
        stdio: "inherit",
        env: { ...process.env },
    });

    console.log("[integration] Migrations applied ✓");
}

export async function teardown(): Promise<void> {
    const client = adminClient();
    await client.connect();

    // Disconnect all active connections to the test DB before dropping
    await client.query(`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'titanbay_test' AND pid <> pg_backend_pid()
  `);

    await client.query(`DROP DATABASE IF EXISTS titanbay_test`);
    await client.end();

    console.log("[integration] Test database destroyed ✓");
}