// Portfolio (Capital Markets) BIAN Semantic API catalog.
//
// Built from the implemented BIAN routes in the portfolio demo:
//   - agents:  backend/api_portfolio_data.py   (the two GET Retrieve routes)
//   - loaders: backend/main.py                 (the POST PerformanceAnalysis/Execute route)
// Only the two BIAN-mapped collections (portfolioAllocation, portfolioPerformance)
// have BIAN URLs; everything else in the capital-markets demo stays native REST
// (not represented here). Convention diverges from the accounts/transactions
// all-POST rule: GET for retrieves, POST for writes — tracking the literal v14
// paths that carry {portfolioId} in the path. camelCase wire = storage; no registry.
//
// Shape contract — consumed by `BianApiTab`:
//   enums: { <label>: [values] }            (object, not array)
//   request.examples: [{ label?, value }]    (array, not request.example)
//   response.example: <object|null>          (singular)

export const PORTFOLIO_API_CATALOG = {
  version: "v1.0",
  description:
    "Capital Markets — Investment Portfolio BIAN v14 Semantic API. Allocation reads via InvestmentPortfolioPlanning and daily performance read/write via InvestmentPortfolioAnalysis, for the equity (PORT-0001) and crypto (PORT-0002) portfolios. Verb-in-URL with the portfolioId in the path; GET for retrieves, POST for the performance write. Bodies/responses are camelCase (wire = storage; no alias registry).",
  conventions: {
    method: "GET · POST",
    verbInUrl: true,
  },
  statusCodes: [
    { code: 200, meaning: "OK — Retrieve returned the document(s), or Execute completed the write." },
    { code: 400, meaning: "Bad Request — invalid/missing date, a future date for the yesterday/date modes, or a missing range for backfill." },
    { code: 404, meaning: "Not Found — unknown portfolioId (allocation Retrieve accepts only PORT-0001 / PORT-0002)." },
    { code: 422, meaning: "Unprocessable Entity — body failed schema validation (e.g. mode not in yesterday|date|backfill)." },
    { code: 500, meaning: "Internal Server Error — data-access or computation failure." },
  ],
  services: [
    {
      key: "portfolio",
      name: "Investment Portfolio",
      serviceDomains: [
        {
          key: "InvestmentPortfolioPlanning",
          label: "InvestmentPortfolioPlanning — Allocation",
          description:
            "Control record: ManagedInvestmentPortfolioAgreement. The equity (PORT-0001) and crypto (PORT-0002) portfolios live in one folded portfolioAllocation collection, selected by the portfolioId in the path. Read-only in the demo.",
          operations: [
            {
              id: "allocation_retrieve",
              method: "GET",
              path: "/InvestmentPortfolioPlanning/{portfolioId}/Retrieve",
              summary:
                "Retrieve a portfolio's asset allocation, keyed by asset symbol. Equity portfolio = PORT-0001, crypto portfolio = PORT-0002.",
              bianAction: "retrieve",
              headers: [
                { name: "Accept", required: false, notes: "application/json" },
              ],
              enums: {
                portfolioId: ["PORT-0001", "PORT-0002"],
              },
              request: {
                notes:
                  "portfolioId in the path; no request body. PORT-0001 returns equities, PORT-0002 returns crypto (whose entries also carry binanceSymbol).",
                examples: [
                  { label: "equity allocation", value: { portfolioId: "PORT-0001" } },
                  { label: "crypto allocation", value: { portfolioId: "PORT-0002" } },
                ],
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["portfolioAllocation"],
                example: {
                  portfolioAllocation: {
                    SPY: {
                      allocationPercentage: "25%",
                      allocationNumber: 25,
                      allocationDecimal: 0.25,
                      description: "SPDR S&P 500 ETF Trust",
                      assetType: "Equity",
                    },
                    TLT: {
                      allocationPercentage: "15%",
                      allocationNumber: 15,
                      allocationDecimal: 0.15,
                      description: "iShares 20+ Year Treasury Bond ETF",
                      assetType: "Bond",
                    },
                  },
                },
              },
              notesFooter:
                "404 if portfolioId is neither PORT-0001 nor PORT-0002. `binanceSymbol` is present only for crypto assets (PORT-0002).",
            },
          ],
        },
        {
          key: "InvestmentPortfolioAnalysis",
          label: "InvestmentPortfolioAnalysis — Performance",
          description:
            "Control record: ManagedInvestmentPortfolioAnalysis (BQ PerformanceAnalysis). A daily time series of percentage daily/cumulative return for a portfolio instance. Retrieve is read; Execute computes and persists new performance rows.",
          operations: [
            {
              id: "performance_retrieve",
              method: "GET",
              path: "/InvestmentPortfolioAnalysis/{portfolioId}/PerformanceAnalysis/Retrieve",
              summary:
                "Retrieve the last N days of daily/cumulative return for a portfolio instance, newest first.",
              bianAction: "retrieve",
              bianBehaviorQualifier: "PerformanceAnalysis",
              headers: [
                { name: "Accept", required: false, notes: "application/json" },
              ],
              enums: {
                portfolioId: ["PORT-0001"],
              },
              request: {
                notes:
                  "portfolioId in the path; `days` query parameter (default 30). No request body.",
                examples: [
                  { label: "default (30 days)", value: { portfolioId: "PORT-0001" } },
                  { label: "last 7 days", value: { portfolioId: "PORT-0001", days: 7 } },
                ],
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["portfolioPerformance"],
                example: {
                  portfolioPerformance: [
                    {
                      date: "2026-06-10T00:00:00Z",
                      percentageOfDailyReturn: 0.42,
                      percentageOfCumulativeReturn: 5.13,
                    },
                    {
                      date: "2026-06-09T00:00:00Z",
                      percentageOfDailyReturn: -0.18,
                      percentageOfCumulativeReturn: 4.69,
                    },
                  ],
                },
              },
              notesFooter:
                "`days` defaults to 30. Records are returned newest-first. A single performance series exists in the demo today (PORT-0001).",
            },
            {
              id: "performance_execute",
              method: "POST",
              path: "/InvestmentPortfolioAnalysis/{portfolioId}/PerformanceAnalysis/Execute",
              summary:
                "Compute and persist portfolio performance. Dispatched by `mode`: yesterday | date | backfill.",
              bianAction: "execute",
              bianBehaviorQualifier: "PerformanceAnalysis",
              headers: [
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              enums: {
                mode: ["yesterday", "date", "backfill"],
              },
              request: {
                notes:
                  "mode selects the write. `date` (YYYYMMDD, past only) is required when mode='date'; `startDate` + `endDate` (YYYYMMDD) are required when mode='backfill'.",
                examples: [
                  { label: "yesterday", value: { mode: "yesterday" } },
                  { label: "specific date", value: { mode: "date", date: "20260610" } },
                  { label: "backfill range", value: { mode: "backfill", startDate: "20260601", endDate: "20260610" } },
                ],
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["message", "insertedId"],
                example: {
                  message: "Portfolio performance data for yesterday successfully loaded",
                  insertedId: "665f1a2b3c4d5e6f7a8b9c0d",
                },
              },
              notesFooter:
                "400 on validation (missing/invalid date, a future date for yesterday/date, or a missing backfill range); 422 if mode is not one of the three. The backfill mode returns `inserted_count` / `skipped_count` instead of `insertedId`. The scheduler calls the service method directly, not this route.",
            },
          ],
        },
      ],
    },
  ],
};
