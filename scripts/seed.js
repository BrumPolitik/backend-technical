#!/usr/bin/env node

const { Client } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

async function seed() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    console.log("[seed] Clearing existing data...");
    await client.query("TRUNCATE TABLE investments, investors, funds RESTART IDENTITY CASCADE");

    // ── Funds ─────────────────────────────────────────────────────────────────
    console.log("[seed] Inserting funds...");
    const { rows: funds } = await client.query(`
    INSERT INTO funds (name, vintage_year, target_size_usd, status) VALUES
      ('Titanbay Growth Fund I',         2021, 250000000.00,   'Closed'),
      ('Titanbay Growth Fund II',        2023, 500000000.00,   'Investing'),
      ('Titanbay Growth Fund III',       2024, 750000000.00,   'Fundraising'),
      ('Titanbay Venture Capital Fund',  2022, 150000000.00,   'Closed'),
      ('Titanbay Real Assets Fund',      2023, 1000000000.00,  'Investing'),
      ('Titanbay Credit Opportunities',  2024, 300000000.00,   'Fundraising')
    RETURNING id, name, vintage_year
  `);

    funds.forEach(f => console.log(`  ✓ Fund: ${f.name} (${f.vintage_year}) — ${f.id}`));

    // ── Investors ─────────────────────────────────────────────────────────────
    console.log("[seed] Inserting investors...");
    const { rows: investors } = await client.query(`
    INSERT INTO investors (name, investor_type, email) VALUES
      ('Goldman Sachs Asset Management',  'Institution',  'privateequity@gsam.com'),
      ('CalPERS',                         'Institution',  'privateequity@calpers.ca.gov'),
      ('Blackrock Alternative Advisors',  'Institution',  'alternatives@blackrock.com'),
      ('Rothschild Family Office',        'Family Office','investments@rothschild-fo.com'),
      ('Rockefeller Capital Management',  'Family Office','capital@rockefeller.com'),
      ('James Hargreaves',                'Individual',   'james.hargreaves@gmail.com'),
      ('Sarah Chen',                      'Individual',   'sarah.chen@outlook.com'),
      ('Nordic Pension Fund',             'Institution',  'alternatives@nordicpension.se'),
      ('Wellington Management',           'Institution',  'pe@wellington.com'),
      ('Pritzker Family Office',          'Family Office','investments@pritzker-fo.com')
    RETURNING id, name
  `);

    investors.forEach(i => console.log(`  ✓ Investor: ${i.name} — ${i.id}`));

    // ── Investments ───────────────────────────────────────────────────────────
    // Realistic allocation — not every investor is in every fund
    console.log("[seed] Inserting investments...");

    const [
        growthI, growthII, growthIII,
        venture, realAssets, credit
    ] = funds;

    const [
        goldman, calpers, blackrock,
        rothschild, rockefeller, james,
        sarah, nordic, wellington, pritzker
    ] = investors;

    const investmentData = [
        // Growth Fund I (Closed — 2021)
        { investor: goldman,     fund: growthI,     amount: 50000000.00,  date: "2021-03-15" },
        { investor: calpers,     fund: growthI,     amount: 75000000.00,  date: "2021-04-01" },
        { investor: blackrock,   fund: growthI,     amount: 40000000.00,  date: "2021-04-22" },
        { investor: rothschild,  fund: growthI,     amount: 25000000.00,  date: "2021-05-10" },
        { investor: nordic,      fund: growthI,     amount: 30000000.00,  date: "2021-06-01" },

        // Growth Fund II (Investing — 2023)
        { investor: goldman,     fund: growthII,    amount: 100000000.00, date: "2023-02-14" },
        { investor: calpers,     fund: growthII,    amount: 120000000.00, date: "2023-03-01" },
        { investor: wellington,  fund: growthII,    amount: 80000000.00,  date: "2023-03-20" },
        { investor: pritzker,    fund: growthII,    amount: 50000000.00,  date: "2023-04-05" },
        { investor: james,       fund: growthII,    amount: 5000000.00,   date: "2023-04-18" },

        // Growth Fund III (Fundraising — 2024)
        { investor: goldman,     fund: growthIII,   amount: 150000000.00, date: "2024-01-10" },
        { investor: blackrock,   fund: growthIII,   amount: 100000000.00, date: "2024-02-01" },
        { investor: sarah,       fund: growthIII,   amount: 2500000.00,   date: "2024-02-20" },

        // Venture Capital Fund (Closed — 2022)
        { investor: rothschild,  fund: venture,     amount: 20000000.00,  date: "2022-01-15" },
        { investor: rockefeller, fund: venture,     amount: 30000000.00,  date: "2022-02-10" },
        { investor: james,       fund: venture,     amount: 1000000.00,   date: "2022-03-01" },
        { investor: sarah,       fund: venture,     amount: 1500000.00,   date: "2022-03-22" },

        // Real Assets Fund (Investing — 2023)
        { investor: calpers,     fund: realAssets,  amount: 200000000.00, date: "2023-05-01" },
        { investor: nordic,      fund: realAssets,  amount: 150000000.00, date: "2023-06-15" },
        { investor: wellington,  fund: realAssets,  amount: 100000000.00, date: "2023-07-01" },
        { investor: pritzker,    fund: realAssets,  amount: 75000000.00,  date: "2023-08-10" },

        // Credit Opportunities (Fundraising — 2024)
        { investor: goldman,     fund: credit,      amount: 80000000.00,  date: "2024-03-01" },
        { investor: blackrock,   fund: credit,      amount: 60000000.00,  date: "2024-03-15" },
        { investor: rockefeller, fund: credit,      amount: 40000000.00,  date: "2024-04-01" },
    ];

    for (const inv of investmentData) {
        await client.query(
            `INSERT INTO investments (investor_id, fund_id, amount_usd, investment_date)
       VALUES ($1, $2, $3, $4)`,
            [inv.investor.id, inv.fund.id, inv.amount, inv.date]
        );
        console.log(`  ✓ ${inv.investor.name} → ${inv.fund.name} ($${inv.amount.toLocaleString()}) on ${inv.date}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    const { rows: [counts] } = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM funds)       AS funds,
      (SELECT COUNT(*) FROM investors)   AS investors,
      (SELECT COUNT(*) FROM investments) AS investments
  `);

    console.log(`\n[seed] Done ✓`);
    console.log(`  Funds:       ${counts.funds}`);
    console.log(`  Investors:   ${counts.investors}`);
    console.log(`  Investments: ${counts.investments}`);

    await client.end();
}

seed().catch((err) => {
    console.error("[seed] Failed:", err.message);
    process.exit(1);
});