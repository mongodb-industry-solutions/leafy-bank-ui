// Hardcoded BIAN Semantic API catalog.
//
// Mirrors the surface exposed by the proxy routes in `frontend/app/api/<SD>/...`.
// All operations use the BIAN verb-in-URL convention (POST /Domain/Action) and
// expect/return JSON envelopes per the conventions block below.
//
// Keep this in sync with the underlying transactions/accounts microservice when
// new operations land. Source of truth = the route files under `app/api/`.

export const BIAN_API_CATALOG = {
  version: "v1.0",
  description:
    "Leafy Bank — BIAN v14 Semantic API. Verb-in-URL convention; all operations are POST. JSON request bodies are strict (extra fields rejected) and use ISO 4217 currency codes with money encoded as JSON numbers.",
  conventions: {
    method: "POST",
    verbInUrl: true,
    extraFieldsRejected: true,
    currencyStandard: "ISO 4217",
    moneyEncoding: "json-number",
  },
  statusCodes: [
    { code: 200, meaning: "OK — operation succeeded; envelope returned." },
    { code: 201, meaning: "Created — new resource (e.g. account, payment) materialised." },
    { code: 202, meaning: "Accepted — async operation queued; final state follows via change-stream/notification." },
    { code: 400, meaning: "Bad Request — malformed body, missing required field, or extra field rejected." },
    { code: 401, meaning: "Unauthorized — missing or invalid bearer token." },
    { code: 403, meaning: "Forbidden — caller is authenticated but lacks the role for this BQ." },
    { code: 404, meaning: "Not Found — referenced entity (customer, account, payment) does not exist." },
    { code: 409, meaning: "Conflict — idempotency-key reuse with different payload, or state guard failed." },
    { code: 422, meaning: "Unprocessable Entity — payload structurally valid but failed BIAN business validation." },
    { code: 500, meaning: "Internal Server Error — unexpected failure; safe to retry idempotent operations with the same Idempotency-Key." },
  ],
  services: [
    {
      key: "customer",
      name: "Party Reference Data Directory",
      serviceDomains: [
        {
          key: "PartyReferenceDataDirectoryEntry",
          name: "PartyReferenceDataDirectoryEntry — Customer Master",
          operations: [
            {
              id: "party_request",
              method: "POST",
              path: "/PartyReferenceDataDirectoryEntry/Request",
              summary: "Register a new customer (party). Returns the materialised customer reference and KYC scaffolding.",
              bianAction: "register",
              bianBehaviorQualifier: "PartyIdentification",
              headers: [
                { name: "Idempotency-Key", required: true, notes: "UUID per business intent. Same key + same body returns the original 201; same key + different body → 409." },
                { name: "Authorization", required: true, notes: "Bearer token. Caller must hold the Onboarding role." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              request: {
                notes: "Identification, contact, KYC seed, consents. PII fields (nationalId, taxId, passport) are encrypted client-side via Queryable Encryption before reaching the server.",
                example: {
                  identification: {
                    firstName: "Frida",
                    lastName: "Karlsson",
                    dateOfBirth: "1986-04-12",
                    nationality: "SE",
                    nationalId: "<QE-ciphertext>",
                    nationalIdType: "PERSONNUMMER",
                  },
                  contact: {
                    email: "frida.karlsson@example.com",
                    phone: "+46-70-555-0123",
                    addresses: [
                      { type: "RESIDENTIAL", line1: "Vasagatan 1", city: "Stockholm", country: "SE", isPrimary: true },
                    ],
                  },
                  kyc: { level: "STANDARD" },
                  consents: [{ consentType: "MARKETING", granted: false }],
                },
              },
              response: {
                successCodes: [201],
                envelopeKeys: ["customerId", "kycStatus", "createdAt"],
                example: {
                  customerId: "CUS-20260507-000142",
                  kycStatus: "PENDING_VERIFICATION",
                  createdAt: "2026-05-07T10:23:45.120Z",
                },
              },
              errors: [
                { code: 400, meaning: "Bad Request", when: "Missing identification.firstName / .lastName / .dateOfBirth, or extra fields present." },
                { code: 409, meaning: "Conflict", when: "Same Idempotency-Key replayed with a different payload." },
                { code: 422, meaning: "Unprocessable Entity", when: "Date of birth in the future or nationality not ISO 3166-1 alpha-2." },
              ],
              notesFooter: "On success, a Change Stream event fires from the customers collection; downstream consumers (Onboarding, RBAC, KYC) pick it up via their resume tokens.",
            },
            {
              id: "party_retrieve",
              method: "POST",
              path: "/PartyReferenceDataDirectoryEntry/Retrieve",
              summary: "Retrieve the full party reference record by customerId.",
              bianAction: "retrieve",
              bianBehaviorQualifier: "PartyIdentification",
              headers: [
                { name: "Authorization", required: true, notes: "Bearer token with Read scope on the Party domain." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              request: {
                example: { customerId: "CUS-20260507-000142" },
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["customerId", "identification", "contact", "kyc", "consents", "version"],
                example: {
                  customerId: "CUS-20260507-000142",
                  identification: { firstName: "Frida", lastName: "Karlsson" },
                  contact: { email: "frida.karlsson@example.com" },
                  kyc: { status: "VERIFIED", level: "STANDARD", riskRating: "LOW" },
                  version: 4,
                },
              },
              errors: [
                { code: 404, meaning: "Not Found", when: "customerId does not exist in the directory." },
              ],
            },
            {
              id: "party_kyc_retrieve",
              method: "POST",
              path: "/PartyReferenceDataDirectoryEntry/CustomerKYCRecord/Retrieve",
              summary: "Retrieve only the KYC sub-record for a party — verification status, risk rating, supporting documents.",
              bianAction: "retrieve",
              bianBehaviorQualifier: "CustomerKYCRecord",
              headers: [
                { name: "Authorization", required: true, notes: "Bearer token with KYC-Read scope (more sensitive than Party read)." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              request: {
                example: { customerId: "CUS-20260507-000142" },
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["customerId", "status", "level", "riskRating", "verifiedAt", "documents"],
                example: {
                  customerId: "CUS-20260507-000142",
                  status: "VERIFIED",
                  level: "STANDARD",
                  riskRating: "LOW",
                  verifiedAt: "2026-05-07T11:02:11.000Z",
                  documents: [{ docType: "PASSPORT", verifiedAt: "2026-05-07T11:01:08.000Z" }],
                },
              },
              errors: [
                { code: 403, meaning: "Forbidden", when: "Caller has Party-Read but not KYC-Read." },
                { code: 404, meaning: "Not Found", when: "customerId not in directory." },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "account",
      name: "Current Account",
      serviceDomains: [
        {
          key: "CurrentAccountFulfillmentArrangement",
          name: "CurrentAccountFulfillmentArrangement — Account Lifecycle",
          operations: [
            {
              id: "account_initiate",
              method: "POST",
              path: "/CurrentAccountFulfillmentArrangement/Initiate",
              summary: "Open a new current account for a registered customer.",
              bianAction: "initiate",
              bianBehaviorQualifier: "AccountAdministration",
              headers: [
                { name: "Idempotency-Key", required: true, notes: "UUID per onboarding event." },
                { name: "Authorization", required: true, notes: "Bearer token with Account-Open scope." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              enums: [
                { label: "Account type", values: ["CHECKING", "SAVINGS", "BUSINESS"] },
                { label: "Currency", values: ["USD", "EUR", "GBP", "SEK", "JPY"] },
              ],
              request: {
                example: {
                  customerId: "CUS-20260507-000142",
                  type: "CHECKING",
                  currency: "USD",
                  productId: "PROD-CHK-STD",
                  branchId: "BR-NYC-01",
                },
              },
              response: {
                successCodes: [201],
                envelopeKeys: ["accountId", "accountNumber", "status", "balance", "openedAt"],
                example: {
                  accountId: "ACC-20260507-000891",
                  accountNumber: "5500-0142-0891",
                  status: "ACTIVE",
                  balance: { current: 0, available: 0, ledger: 0, hold: 0 },
                  openedAt: "2026-05-07T11:18:02.000Z",
                },
              },
              errors: [
                { code: 404, meaning: "Not Found", when: "customerId references no party in the directory." },
                { code: 422, meaning: "Unprocessable Entity", when: "KYC status != VERIFIED for the customer." },
              ],
            },
            {
              id: "account_retrieve",
              method: "POST",
              path: "/CurrentAccountFulfillmentArrangement/Retrieve",
              summary: "Retrieve the full current-account record.",
              bianAction: "retrieve",
              bianBehaviorQualifier: "AccountAdministration",
              headers: [
                { name: "Authorization", required: true, notes: "Bearer token with Account-Read scope." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              request: { example: { accountId: "ACC-20260507-000891" } },
              response: {
                successCodes: [200],
                envelopeKeys: ["accountId", "accountNumber", "type", "status", "balance", "interest", "signatories"],
                example: {
                  accountId: "ACC-20260507-000891",
                  accountNumber: "5500-0142-0891",
                  type: "CHECKING",
                  status: "ACTIVE",
                  balance: { current: 12450.18, available: 12450.18, ledger: 12450.18, hold: 0 },
                },
              },
              errors: [
                { code: 404, meaning: "Not Found", when: "accountId does not exist." },
              ],
            },
            {
              id: "account_request",
              method: "POST",
              path: "/CurrentAccountFulfillmentArrangement/Request",
              summary: "Request a non-control mutation on an account (update interest schedule, statement frequency, signatory).",
              bianAction: "update",
              bianBehaviorQualifier: "AccountAdministration",
              headers: [
                { name: "Idempotency-Key", required: true, notes: "UUID per change-of-record." },
                { name: "Authorization", required: true, notes: "Bearer token with Account-Update scope." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              request: {
                example: {
                  accountId: "ACC-20260507-000891",
                  patch: { statement: { frequency: "MONTHLY", deliveryChannel: "EMAIL" } },
                },
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["accountId", "version", "updatedAt"],
                example: { accountId: "ACC-20260507-000891", version: 7, updatedAt: "2026-05-07T11:31:00.000Z" },
              },
              errors: [
                { code: 409, meaning: "Conflict", when: "Optimistic-lock version mismatch." },
              ],
            },
            {
              id: "account_control",
              method: "POST",
              path: "/CurrentAccountFulfillmentArrangement/Control",
              summary: "Apply or release a control on an account — block, freeze, or restrict.",
              bianAction: "execute",
              bianBehaviorQualifier: "AccountRestriction",
              headers: [
                { name: "Idempotency-Key", required: true, notes: "UUID per restriction event." },
                { name: "Authorization", required: true, notes: "Bearer token with Account-Control scope (typically Compliance / Fraud Ops)." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              enums: [
                { label: "Control action", values: ["APPLY", "RELEASE"] },
                { label: "Restriction type", values: ["FROZEN", "DEBIT_BLOCK", "CREDIT_BLOCK", "FULL_BLOCK"] },
              ],
              request: {
                example: {
                  accountId: "ACC-20260507-000891",
                  action: "APPLY",
                  restriction: { type: "DEBIT_BLOCK", reason: "AML investigation case CASE-2026-0042" },
                },
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["accountId", "restriction", "appliedAt", "appliedBy"],
                example: {
                  accountId: "ACC-20260507-000891",
                  restriction: { type: "DEBIT_BLOCK", reason: "AML investigation case CASE-2026-0042" },
                  appliedAt: "2026-05-07T11:42:18.000Z",
                  appliedBy: "ops.compliance@leafybank.com",
                },
              },
              errors: [
                { code: 403, meaning: "Forbidden", when: "Caller lacks Account-Control scope." },
                { code: 404, meaning: "Not Found", when: "accountId not found." },
              ],
              notesFooter: "Each control action emits an OCSF 4002 Authorization Activity event to the WORM audit sink.",
            },
            {
              id: "account_balance_retrieve",
              method: "POST",
              path: "/CurrentAccountFulfillmentArrangement/CurrentAccountBalanceRecord/Retrieve",
              summary: "Retrieve the projected balance record only — fast O(1) lookup against the ASP-maintained accountBalances projection.",
              bianAction: "retrieve",
              bianBehaviorQualifier: "CurrentAccountBalanceRecord",
              headers: [
                { name: "Authorization", required: true, notes: "Bearer token with Account-Read scope." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              request: { example: { accountId: "ACC-20260507-000891" } },
              response: {
                successCodes: [200],
                envelopeKeys: ["accountId", "balance", "asOf"],
                example: {
                  accountId: "ACC-20260507-000891",
                  balance: { current: 12450.18, available: 12450.18, ledger: 12450.18, hold: 0, overdraftLimit: 500 },
                  asOf: "2026-05-07T11:43:01.014Z",
                },
              },
              errors: [{ code: 404, meaning: "Not Found", when: "accountId not found." }],
            },
            {
              id: "account_txn_request",
              method: "POST",
              path: "/CurrentAccountFulfillmentArrangement/CurrentAccountTransaction/Request",
              summary: "List or request transaction history for an account (paginated).",
              bianAction: "retrieve",
              bianBehaviorQualifier: "CurrentAccountTransaction",
              headers: [
                { name: "Authorization", required: true, notes: "Bearer token with Account-Read scope." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              request: {
                example: {
                  accountId: "ACC-20260507-000891",
                  page: { limit: 50, cursor: null },
                  filter: { from: "2026-04-01", to: "2026-05-07" },
                },
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["accountId", "transactions", "page"],
                example: {
                  accountId: "ACC-20260507-000891",
                  transactions: [
                    { txnId: "TXN-2026-04-15-0001", type: "CREDIT", amount: 1000, currency: "USD", bookingDate: "2026-04-15", balanceAfter: 12450.18 },
                  ],
                  page: { nextCursor: null, hasMore: false },
                },
              },
              errors: [{ code: 404, meaning: "Not Found", when: "accountId not found." }],
            },
          ],
        },
      ],
    },
    {
      key: "payment",
      name: "Payment Order",
      serviceDomains: [
        {
          key: "PaymentOrderProcedure",
          name: "PaymentOrderProcedure — Payment Initiation & Settlement",
          operations: [
            {
              id: "payment_initiate",
              method: "POST",
              path: "/PaymentOrderProcedure/Initiate",
              summary: "Initiate a payment order. Routed to the relevant rail (SWIFT, RTGS, RTP, ACH, CARD). Idempotent.",
              bianAction: "initiate",
              bianBehaviorQualifier: "PaymentOrderInitiation",
              headers: [
                { name: "Idempotency-Key", required: true, notes: "UUID per business intent (REQUIRED). Forward-propagated through the proxy → service → ledger to deduplicate journal postings." },
                { name: "Authorization", required: true, notes: "Bearer token with Payment-Initiate scope." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              enums: [
                { label: "Rail", values: ["SWIFT", "RTGS", "RTP", "ACH", "CARD", "INTERNAL"] },
                { label: "Charge bearer", values: ["DEBT", "CRED", "SHAR", "SLEV"] },
                { label: "Priority", values: ["NORM", "HIGH", "URGT"] },
              ],
              request: {
                notes: "ISO 20022 pacs.008-style fields. The proxy stamps the canonical envelope and forwards Idempotency-Key downstream.",
                example: {
                  customerId: "CUS-20260507-000142",
                  rail: "SWIFT",
                  type: "EXTERNAL_OUTBOUND",
                  amount: 1000,
                  currency: "USD",
                  debtor: { accountId: "ACC-20260507-000891" },
                  creditor: {
                    name: "Acme GmbH",
                    iban: "DE89370400440532013000",
                    bic: "COBADEFFXXX",
                    bankName: "Commerzbank AG",
                    bankCountry: "DE",
                  },
                  remittance: { unstructured: "Invoice 2026-04-PRO-2010" },
                  chargeBearer: "SHAR",
                  priority: "NORM",
                },
              },
              response: {
                successCodes: [201, 202],
                envelopeKeys: ["paymentId", "endToEndId", "uetr", "status", "initiatedAt"],
                example: {
                  paymentId: "PAY-20260507-0042",
                  endToEndId: "E2E-pay-550e8400-e29b",
                  uetr: "550e8400-e29b-41d4-a716-446655440000",
                  status: "ACCEPTED",
                  initiatedAt: "2026-05-07T11:48:32.401Z",
                },
              },
              errors: [
                { code: 400, meaning: "Bad Request", when: "Missing creditor.iban for SWIFT/RTGS rails, or amount <= 0." },
                { code: 403, meaning: "Forbidden", when: "Debtor account has a DEBIT_BLOCK restriction in force." },
                { code: 409, meaning: "Conflict", when: "Same Idempotency-Key replayed with a different payload." },
                { code: 422, meaning: "Unprocessable Entity", when: "Insufficient available balance + overdraft, or sanctions check FAIL." },
              ],
              notesFooter: "On 201/202 the journal-entry posting is fired with the same Idempotency-Key — the unique index on journalEntries.idempotencyKey enforces single-posting under retry.",
            },
            {
              id: "payment_retrieve",
              method: "POST",
              path: "/PaymentOrderProcedure/Retrieve",
              summary: "Retrieve a payment order by paymentId — full ISO 20022 envelope, clearing/settlement timeline, and fraud evaluation.",
              bianAction: "retrieve",
              bianBehaviorQualifier: "PaymentOrderInitiation",
              headers: [
                { name: "Authorization", required: true, notes: "Bearer token with Payment-Read scope." },
                { name: "Content-Type", required: true, notes: "application/json" },
              ],
              request: { example: { paymentId: "PAY-20260507-0042" } },
              response: {
                successCodes: [200],
                envelopeKeys: ["paymentId", "status", "amount", "currency", "debtor", "creditor", "clearing", "fraud"],
                example: {
                  paymentId: "PAY-20260507-0042",
                  status: "SETTLED",
                  amount: 1000,
                  currency: "USD",
                  debtor: { accountId: "ACC-20260507-000891" },
                  creditor: { name: "Acme GmbH", bic: "COBADEFFXXX" },
                  clearing: {
                    receivedAt: "2026-05-07T11:48:32.401Z",
                    settledAt: "2026-05-07T11:48:34.918Z",
                    settlementDate: "2026-05-07",
                    networkRef: "SWIFT-MT103-RX-2026-05-07-0098",
                  },
                  fraud: { score: 0.12, decision: "ALLOW", checkedAt: "2026-05-07T11:48:32.602Z" },
                },
              },
              errors: [{ code: 404, meaning: "Not Found", when: "paymentId not found." }],
            },
          ],
        },
      ],
    },
  ],
};
