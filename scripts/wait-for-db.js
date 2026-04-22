#!/usr/bin/env node
/**
 * Waits for the postgres container to be healthy before allowing dev server to start.
 * Called automatically by the `predev` npm script.
 */

const net = require("net");
const { execSync } = require("child_process");

const MAX_RETRIES = 20;
const RETRY_DELAY_MS = 2000;
const DB_HOST = process.env.POSTGRES_HOST || "localhost";
const DB_PORT = parseInt(process.env.POSTGRES_PORT || "5432", 10);

function log(msg) {
  process.stdout.write(`[wait-for-db] ${msg}\n`);
}

function isDbReady() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket
        .connect(DB_PORT, DB_HOST, () => {
          socket.destroy();
          resolve(true);
        })
        .on("error", () => {
          socket.destroy();
          resolve(false);
        })
        .on("timeout", () => {
          socket.destroy();
          resolve(false);
        });
  });
}

async function wait() {
  log(`Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}...`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (await isDbReady()) {
      log("PostgreSQL is accepting connections ✓");

      log("Running database migrations...");
      try {
        execSync("npx ts-node src/db/migrate.ts", {
          stdio: "inherit",
          env: { ...process.env },
        });
        log("Migrations complete ✓");
      } catch (err) {
        log("Migration failed — check the error above.");
        process.exit(1);
      }

      return;
    }

    log(`Attempt ${attempt}/${MAX_RETRIES} — not ready yet, retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }

  log("ERROR: PostgreSQL did not become healthy in time.");
  process.exit(1);
}

wait();
