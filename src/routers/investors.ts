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

    const { rows } = await pool.query<Investor>(
      "SELECT * FROM investors ORDER BY created_at DESC"
    );
    res.json(rows);

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

    const { rows } = await pool.query<Investor>(
      `INSERT INTO investors (name, investor_type, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [body.name, body.investor_type, body.email]
    );
    res.status(201).json(rows[0]);

  } catch (err) {
    next(err);
  }
});

export default router;
