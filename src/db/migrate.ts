/**
 * Simple migration runner.
 *
 * Reads every *.sql file from src/db/migrations/ in lexicographic order,
 * tracks which ones have already been applied in a `migrations` table, and
 * runs any that haven't been applied yet — all within a single transaction
 * so a failed migration never leaves the schema half-applied.
 */

import fs from "fs";
import path from "path";
import pool from "./index";
import dotenv from "dotenv";

dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    // Ensure the tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id          SERIAL      PRIMARY KEY,
        filename    TEXT        NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Discover migration files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort(); // lexicographic — 001_... comes before 002_...

    for (const file of files) {
      const { rowCount } = await client.query(
        "SELECT 1 FROM migrations WHERE filename = $1",
        [file]
      );

      if (rowCount && rowCount > 0) {
        console.log(`[migrate] Skipping ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO migrations (filename) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`[migrate] Applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log("[migrate] All migrations up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
