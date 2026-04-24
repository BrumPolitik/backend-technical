import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Global Express error handler — must have 4 parameters to be recognised as one. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation error",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Application errors with an explicit HTTP status
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // PostgreSQL unique-violation (code 23505) → 409 Conflict
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  ) {
    res.status(409).json({ error: "A record with these unique values already exists." });
    return;
  }

  // PostgreSQL date time parse error violation (code 22008) → 422 Unprocessable Data
  if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "22008"
  ) {
    res.status(422).json({ error: "Investment_date is not a valid calendar date." });
    return;
  }

  // PostgreSQL foreign-key violation (code 23503) → 422 Unprocessable
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23503"
  ) {
    res.status(422).json({ error: "Referenced resource does not exist." });
    return;
  }

  // Unexpected errors → 500
  if (process.env.NODE_ENV !== "test") {
    console.error("[error]", err);
  }
  res.status(500).json({ error: "Internal server error." });
}
