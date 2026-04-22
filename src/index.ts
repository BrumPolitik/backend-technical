import express from "express";
import dotenv from "dotenv";

import fundsRouter from "./routers/funds";
import investorsRouter from "./routers/investors";
import investmentsRouter from "./routers/investments";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routers ───────────────────────────────────────────────────
// Investments are nested under funds (/funds/:fund_id/investments)
// so the investments router must be mounted before the funds router
// to avoid /:id swallowing the nested path — Express matches in order.
app.use("/funds/:fund_id/investments", investmentsRouter);
app.use("/funds", fundsRouter);
app.use("/investors", investorsRouter);

// ── 404 catch-all ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Titanbay API running on http://localhost:${PORT}`);
});

export default app;
