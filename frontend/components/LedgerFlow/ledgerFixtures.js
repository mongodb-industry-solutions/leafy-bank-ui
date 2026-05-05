// ledgerFixtures.js — personas, GL chart subset, and a default payment.
// Demo-only data. When the backend is wired, the personas and GL subset
// will come from glAccounts + customer/account collections.

export const FRIDA = {
  customerId: "CUST-FRIDA-001",
  accountId: "ACC-FRIDA-001",
  displayName: "Frida Kahlo",
  controlAccountCode: "2100",
  subLedgerType: "CUSTOMER_DEPOSITS",
  balance: 4250.0,
};

export const BO = {
  customerId: "CUST-BO-001",
  accountId: "ACC-BO-001",
  displayName: "Bo Jackson",
  controlAccountCode: "2100",
  subLedgerType: "CUSTOMER_DEPOSITS",
  balance: 1180.0,
};

export const GL_CHART_SUBSET = [
  {
    accountCode: "1001",
    accountName: "Cash and Cash Equivalents",
    accountType: "ASSET",
    normalBalance: "DEBIT",
    subLedgerType: null,
  },
  {
    accountCode: "2100",
    accountName: "Customer Deposits — Current",
    accountType: "LIABILITY",
    normalBalance: "CREDIT",
    subLedgerType: "CUSTOMER_DEPOSITS",
  },
];

export const DEFAULT_PAYMENT = {
  amount: 250.0,
  currency: "USD",
  description: "Customer-to-customer transfer — Frida → Bo",
};

// Ordered stage list used by the timeline panel and the diagram. The reducer
// validates incoming stages against this list.
export const STAGES = [
  { key: "PAYMENT_INITIATED", label: "Payment initiated" },
  { key: "SUBLEDGER_DEBIT", label: "Sub-ledger · debit leg" },
  { key: "SUBLEDGER_CREDIT", label: "Sub-ledger · credit leg" },
  { key: "RECONCILE_SKIPPED", label: "Reconcile (skipped — MVP)" },
  { key: "JOURNAL_POSTED", label: "GL journal posted" },
  { key: "CHANGE_STREAM", label: "Change stream emitted" },
  { key: "BALANCE_PROJECTED_DEBIT", label: "Balance projected · sender" },
  { key: "BALANCE_PROJECTED_CREDIT", label: "Balance projected · recipient" },
  { key: "SETTLED", label: "Settled" },
];
