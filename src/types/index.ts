// ============================================================
// Domain types — these mirror the API spec data models exactly.
// ============================================================

export type FundStatus = "Fundraising" | "Investing" | "Closed";
export type InvestorType = "Individual" | "Institution" | "Family Office";

export interface Fund {
  id: string;
  name: string;
  vintage_year: number;
  target_size_usd: number;
  status: FundStatus;
  created_at: string;
}

export interface Investor {
  id: string;
  name: string;
  investor_type: InvestorType;
  email: string;
  created_at: string;
}

export interface Investment {
  id: string;
  investor_id: string;
  fund_id: string;
  amount_usd: number;
  investment_date: string; // ISO date string YYYY-MM-DD
}

// ============================================================
// Request body shapes (used by Zod schemas in each router)
// ============================================================

export type CreateFundBody = Omit<Fund, "id" | "created_at">;
export type UpdateFundBody = Omit<Fund, "created_at">;

export type CreateInvestorBody = Omit<Investor, "id" | "created_at">;

export type CreateInvestmentBody = Omit<Investment, "id" | "fund_id">;
