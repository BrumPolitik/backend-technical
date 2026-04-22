import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import pool from "../db";
import { AppError } from "../middleware/errorHandler";
import { Investor } from "../types";

const router = Router();

// ============================================================
// Validation schemas
// ============================================================

const InvestorTypeSchema = z.enum(["Individual", "Institution", "Family Office"]);

const CreateInvestorSchema = z.object({
  name: z.string().min(1, "name is required"),
  investor_type: InvestorTypeSchema,
  email: z.string().email("email must be a valid email address"),
});

// ============================================================
// GET /investors — list all investors
// ============================================================
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: query the investors table and return all rows
    // Example:
    //   const { rows } = await pool.query<Investor>(
    //     "SELECT * FROM investors ORDER BY created_at DESC"
    //   );
    //   res.json(rows);
    res.status(501).json({ error: "Not implemented" });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /investors — create a new investor
// ============================================================
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateInvestorSchema.parse(req.body);

    // TODO: insert into investors table and return the created row
    // The email column has a UNIQUE constraint — pg will throw a 23505
    // error if a duplicate is submitted, which the error handler converts
    // to a 409 Conflict automatically.
    //
    // Example:
    //   const { rows } = await pool.query<Investor>(
    //     `INSERT INTO investors (name, investor_type, email)
    //      VALUES ($1, $2, $3)
    //      RETURNING *`,
    //     [body.name, body.investor_type, body.email]
    //   );
    //   res.status(201).json(rows[0]);
    res.status(501).json({ error: "Not implemented" });
  } catch (err) {
    next(err);
  }
});

export default router;
