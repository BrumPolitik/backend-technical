import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import pool from "../db";
import { AppError } from "../middleware/errorHandler";
import { Investment } from "../types";

// mergeParams: true is required so this router can access :fund_id
// from the parent router (/funds/:fund_id/investments)
const router = Router({ mergeParams: true });

// ============================================================
// Validation schemas
// ============================================================

const CreateInvestmentSchema = z.object({
  investor_id: z.string().uuid("investor_id must be a valid UUID"),
  amount_usd: z.number().positive("amount_usd must be positive"),
  // Accepts ISO date strings like "2024-03-15"
  investment_date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "investment_date must be in YYYY-MM-DD format"
  ),
});

// ============================================================
// GET /funds/:fund_id/investments — list investments for a fund
// ============================================================
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fund_id } = req.params;

    const parsed = z.string().uuid("fund_id must be a valid UUID").safeParse(fund_id);
    if (!parsed.success) {
      throw new AppError(400, "Invalid fund_id — must be a UUID");
    }

    const fund = await pool.query("SELECT id FROM funds WHERE id = $1", [fund_id]);
    if (fund.rowCount === 0) throw new AppError(404, "Fund not found");

    const { rows } = await pool.query<Investment>(
      "SELECT * FROM investments WHERE fund_id = $1 ORDER BY investment_date DESC",
      [fund_id]
    );
    res.json(rows);

  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /funds/:fund_id/investments — create an investment in a fund
// ============================================================
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fund_id } = req.params;

    const fundIdParsed = z.string().uuid("fund_id must be a valid UUID").safeParse(fund_id);
    if (!fundIdParsed.success) {
      throw new AppError(400, "Invalid fund_id — must be a UUID");
    }

    const body = CreateInvestmentSchema.parse(req.body);

    const { rows: existence } = await pool.query<{ fund_exists: boolean; investor_exists: boolean }>(
        `SELECT
           EXISTS(SELECT 1 FROM funds     WHERE id = $1) AS fund_exists,
           EXISTS(SELECT 1 FROM investors WHERE id = $2) AS investor_exists`,
        [fund_id, body.investor_id]
    );

    if (!existence[0].fund_exists)     throw new AppError(404, "Fund not found");
    if (!existence[0].investor_exists) throw new AppError(404, "Investor not found");

    const { rows } = await pool.query<Investment>(
        `INSERT INTO investments (investor_id, fund_id, amount_usd, investment_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
        [body.investor_id, fund_id, body.amount_usd, body.investment_date]
    );
    res.status(201).json(rows[0]);

  } catch (err) {
    next(err);
  }
});

export default router;
