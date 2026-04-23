import { Pool, types } from "pg";
import dotenv from "dotenv";

dotenv.config();

types.setTypeParser(1082, (val: string) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Sensible defaults for a local dev / small production environment
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err);
});

export default pool;
