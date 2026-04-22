import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import pool from "../db";
import { AppError } from "../middleware/errorHandler";
import { Fund } from "../types";

const router = Router();

// ============================================================
// Validation schemas
// ============================================================

const FundStatusSchema = z.enum(["Fundraising", "Investing", "Closed"]);

const CreateFundSchema = z.object({
  name: z.string().min(1, "name is required"),
  vintage_year: z
    .number()
    .int()
    .min(1900)
    .max(2200),
  target_size_usd: z.number().positive("target_size_usd must be positive"),
  status: FundStatusSchema,
});

const UpdateFundSchema = CreateFundSchema.extend({
  id: z.string().uuid("id must be a valid UUID"),
});

// ============================================================
// GET /funds — list all funds
// ============================================================
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: query the funds table and return all rows
    // Example:
    //   const { rows } = await pool.query<Fund>(
    //     "SELECT * FROM funds ORDER BY created_at DESC"
    //   );
    //   res.json(rows);
    res.status(501).json({ error: "Not implemented" });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /funds/:id — get a single fund by UUID
// ============================================================
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate that the path param is a UUID before hitting the DB
    const parsed = z.string().uuid("id must be a valid UUID").safeParse(id);
    if (!parsed.success) {
      throw new AppError(400, "Invalid fund id — must be a UUID");
    }

    // TODO: query by id, throw AppError(404, ...) if not found
    // Example:
    //   const { rows } = await pool.query<Fund>(
    //     "SELECT * FROM funds WHERE id = $1",
    //     [id]
    //   );
    //   if (rows.length === 0) throw new AppError(404, "Fund not found");
    //   res.json(rows[0]);
    res.status(501).json({ error: "Not implemented" });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /funds — create a new fund
// ============================================================
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateFundSchema.parse(req.body);

    // TODO: insert into funds table and return the created row
    // Example:
    //   const { rows } = await pool.query<Fund>(
    //     `INSERT INTO funds (name, vintage_year, target_size_usd, status)
    //      VALUES ($1, $2, $3, $4)
    //      RETURNING *`,
    //     [body.name, body.vintage_year, body.target_size_usd, body.status]
    //   );
    //   res.status(201).json(rows[0]);
    res.status(501).json({ error: "Not implemented" });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PUT /funds — update an existing fund (id in request body per spec)
// ============================================================
router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = UpdateFundSchema.parse(req.body);

    // TODO: update the fund and return the updated row
    // Example:
    //   const { rows } = await pool.query<Fund>(
    //     `UPDATE funds
    //      SET name = $1, vintage_year = $2, target_size_usd = $3, status = $4
    //      WHERE id = $5
    //      RETURNING *`,
    //     [body.name, body.vintage_year, body.target_size_usd, body.status, body.id]
    //   );
    //   if (rows.length === 0) throw new AppError(404, "Fund not found");
    //   res.json(rows[0]);
    res.status(501).json({ error: "Not implemented" });
  } catch (err) {
    next(err);
  }
});

export default router;
