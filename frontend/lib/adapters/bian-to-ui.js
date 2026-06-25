// bian-to-ui.js
/**
 * Adapter — backend BIAN responses (post Phase 4) -> objects the UI components consume.
 *
 * Phase 5.1 reshape (2026-04-28): the adapter now passes BIAN fields through
 * **verbatim** (BIAN PascalCase). It adds a small set of underscore-prefixed
 * display helpers (`_isInternal`, `_isIncoming`, `_isOutgoing`, `_otherSideName`,
 * `_displayLabel`, `_customerUserName`, `_customerUserId`, `_bankName`) so components
 * can render direction, type labels, and self/counterparty names without doing
 * Mongo-level joins themselves.
 *
 * The adapter still owns the orchestration that the backend can't do alone:
 *   - one-leg-per-payment filter (Phase 5 decision #3)
 *   - DEBIT-preference for own-to-own internal transfers
 *   - BookingDate-desc sort
 *   - CustomerReference -> demo USER_MAP resolution (UserName / UserId)
 *
 * @module bian-to-ui
 */

import { USER_MAP } from "@/lib/constants";
import { deriveCustomerRef } from "@/lib/api/refs";

// ---------- Account-type label mapping (UI Combobox -> BIAN) ----------
//
// Used only by `uiCreateAccountToBian`. Component-side display mapping
// (BIAN -> "Checking"/"Savings") lives in `AccountsCards.jsx` per the
// "components own presentation" rule.
const ACCOUNT_TYPE_UI_TO_BIAN = {
    Checking: "CURRENT",
    Savings: "SAVINGS",
};

// ---------- USER_MAP -> customerRef -> userName / userId lookup ----------
//
// Built once at module load. Backend response carries `CustomerReference` (`CUST-…`)
// only — UI sometimes wants the demo username/userId. The four demo customers are
// listed in `USER_MAP`; their CUST-refs are derived via the same last-8-hex formula
// as the seed data.
const CUSTOMER_REF_TO_USERNAME = (() => {
    const map = {};
    for (const [userId, info] of Object.entries(USER_MAP)) {
        if (info.Role !== "Customer") continue;
        map[deriveCustomerRef(userId)] = info.UserName;
    }
    return map;
})();

const CUSTOMER_REF_TO_USERID = (() => {
    const map = {};
    for (const userId of Object.keys(USER_MAP)) {
        map[deriveCustomerRef(userId)] = userId;
    }
    return map;
})();

// ---------- Account adapter ----------

/**
 * Pass a BIAN account record through to the UI verbatim; attach a few
 * adapter-derived helpers so components don't need a customer lookup.
 *
 * Backend response (per `registry.to_bian("accounts", mongo_doc)`):
 *   {
 *     CurrentAccountReference: "ACC-…",
 *     CurrentAccountNumber: "111…",
 *     CurrentAccountType: "CURRENT" | "SAVINGS" | …,
 *     CurrentAccountApexStatus: "ACTIVE" | …,
 *     CustomerReference: "CUST-…",
 *     CurrentAccountCurrencyCode: "USD",
 *     CurrentAccountOpenDate: "2024-12-07",
 *     CurrentAccountBalanceRecord: { CurrentAccountBalanceAmount, CurrentAccountAvailableBalanceAmount, … },
 *     …other BIAN fields
 *   }
 *
 * Adapter helpers added:
 *   _customerUserName, _customerUserId, _bankName, _id (alias of CurrentAccountReference)
 *
 * @param {object} record
 * @returns {object} BIAN record + adapter helpers
 */
export function bianAccountToUi(record) {
    if (!record) return null;
    const customerRef = record.customerSnapshot?.customerId ?? record.customerId;
    return {
        ...record,
        _customerUserName: CUSTOMER_REF_TO_USERNAME[customerRef] || "Unknown User",
        _customerUserId: CUSTOMER_REF_TO_USERID[customerRef] || customerRef,
        _bankName: "LeafyBank",
        _id: record.accountId,
    };
}

/**
 * `Request` envelope -> `{ accounts: [...] }`.
 */
export function bianAccountsResponseToUi(envelope) {
    const records = envelope?.accounts || [];
    return { accounts: records.map(bianAccountToUi) };
}

/**
 * `Retrieve` envelope -> `{ account: ... }`.
 */
export function bianAccountRetrieveToUi(envelope) {
    const record = envelope?.account;
    return { account: bianAccountToUi(record) };
}

/**
 * `Initiate` (create) response. Components read `account_id` after submit; expose
 * it alongside the full record.
 */
export function bianAccountInitiateToUi(envelope) {
    const ui = bianAccountToUi(envelope?.account);
    return {
        ...ui,
        account_id: envelope?.accountId,
    };
}

// ---------- Create-account body builder ----------

/**
 * Map AccountsCards form payload -> `/CurrentAccountFulfillmentArrangement/Initiate` body.
 *
 * @param {object} input
 * @param {string} input.userId - 24-hex ObjectId from USER_MAP
 * @param {string} input.accountNumber
 * @param {number} input.accountBalance
 * @param {string} input.accountType - "Checking" | "Savings" (UI Combobox value)
 * @param {string} [input.currency="USD"]
 * @returns {object}
 */
export function uiCreateAccountToBian({
    userId,
    accountNumber,
    accountBalance,
    accountType,
    currency = "USD",
}) {
    const bianType = ACCOUNT_TYPE_UI_TO_BIAN[accountType] || accountType;
    return {
        customerId: deriveCustomerRef(userId),
        accountNumber: String(accountNumber),
        type: bianType,
        currency,
        initialDeposit: Number(accountBalance),
    };
}

// ---------- Transfer body builder ----------

/**
 * Map a UI transfer/payment payload -> `/PaymentOrderProcedure/Initiate` body.
 *
 * Phase 1 only supports `INTRABANK_TRANSFER` over the `INTERNAL` rail; the UI
 * payment-method selector (Paypal/Zelle/Venmo) is preserved in remittance text.
 */
export function uiTransferToBian({
    customerRef,
    originatorAccountRef,
    beneficiaryAccountRef,
    amount,
    paymentMethod,
    currency = "USD",
}) {
    const body = {
        customerId: customerRef,
        type: "INTRABANK_TRANSFER",
        rail: "INTERNAL",
        instructedAmount: Number(amount),
        instructedCurrency: currency,
        debtor: { accountId: originatorAccountRef },
        creditor: { accountId: beneficiaryAccountRef },
    };
    if (paymentMethod) {
        body.remittance = { unstructured: `via ${paymentMethod}` };
    }
    return body;
}

/**
 * `/PaymentOrderProcedure/Initiate` response -> small UI envelope.
 * Form keys off `transaction_id`; expose under both `transaction_id` and
 * `PaymentOrderReference` plus the raw response.
 */
export function bianPaymentInitiateToUi(envelope) {
    return {
        transaction_id: envelope?.paymentId,
        paymentId: envelope?.paymentId,
        status: envelope?.status,
        raw: envelope,
    };
}

// ---------- Transaction (ledger leg) adapter ----------

/**
 * Parse "via Paypal" / "via Zelle" narrative text (if present) back to a method label.
 * Phase 1 doesn't carry remittance on legs — the field is reserved for Phase 2+
 * external rails. Returns undefined when not present.
 */
function extractPaymentMethod(leg) {
    const text = leg?.narrative || leg?.description;
    if (!text) return undefined;
    const m = /via\s+(\w+)/i.exec(text);
    return m ? m[1] : undefined;
}

/**
 * Compute the display label for the transactions list based on txnCode + internal flag.
 */
function deriveDisplayLabel(leg, isInternal) {
    if (isInternal) return "InternalTransfer";
    const code = leg.txnCode || "";
    if (code.startsWith("PMNT-ICDT")) return "AccountTransfer";
    return "DigitalPayment";
}

/**
 * Wrap a single v4_21 transaction doc (raw Mongo, camelCase) with adapter-derived
 * display helpers. The original fields pass through unchanged so the expand-JSON
 * panel renders the actual storage shape.
 *
 * v4_21 shape (per `leafy_bank_bian.transactions`):
 *   { _id, txnId, paymentId, direction: "OUTGOING", txnCode, amount, currency,
 *     valueDate, bookingDate, description, balanceAfter, channel,
 *     payer: { accountId, accountNo, name, ... },
 *     payee: { accountId, accountNo, name, isInternal, ... }, ... }
 *
 * @param {object} doc - raw Mongo doc
 * @param {object} ctx - { isOutgoing, isInternal, selfUserId, selfUserName }
 * @returns {object} Mongo doc + `_*` helpers
 */
function decorateLeg(doc, ctx) {
    const otherSide = ctx.isOutgoing ? (doc.payee || {}) : (doc.payer || {});
    const otherSideName = ctx.isInternal
        ? ctx.selfUserName
        : otherSide.name || "Unknown";

    return {
        ...doc,
        _isInternal: !!ctx.isInternal,
        _isIncoming: !ctx.isOutgoing,
        _isOutgoing: !!ctx.isOutgoing,
        _selfUserId: ctx.selfUserId,
        _selfUserName: ctx.selfUserName,
        _otherSideName: otherSideName,
        _displayLabel: deriveDisplayLabel(doc, ctx.isInternal),
        _paymentMethod: extractPaymentMethod(doc),
    };
}

/**
 * Translate the activity-route response (v4_21 one-doc-per-payment shape) into a
 * list of decorated docs for the UI.
 *
 * v4_21 shape: one doc per payment with `payer.accountId` / `payee.accountId`
 * instead of per-leg `accountId` and `type: DEBIT|CREDIT`. Ownership is determined
 * by matching ownedRefs against both sides; direction is determined by which side
 * the user owns.
 *
 * @param {object} envelope - backend response: { transactions: [...] }
 * @param {object[]} ownedAccountUiRecords - the user's own account objects (post-adapter)
 * @param {object} [selfUser] - { userId, userName } for self-side display
 * @returns {{transactions: object[]}}
 */
export function bianActivityResponseToUi(envelope, ownedAccountUiRecords = [], selfUser = {}) {
    const docs = envelope?.transactions || [];
    const ownedRefs = new Set(
        (ownedAccountUiRecords || [])
            .map((a) => a?.accountId || a?._id)
            .filter(Boolean)
    );

    const out = [];
    for (const doc of docs) {
        const payerOwned = ownedRefs.has(doc.payer?.accountId);
        const payeeOwned = ownedRefs.has(doc.payee?.accountId);

        if (!payerOwned && !payeeOwned) {
            // Neither side belongs to this user — skip defensively.
            continue;
        }

        const isInternal = payerOwned && payeeOwned;
        const isOutgoing = payerOwned;

        out.push(
            decorateLeg(doc, {
                isOutgoing,
                isInternal,
                selfUserId: selfUser.userId,
                selfUserName: selfUser.userName,
            })
        );
    }

    // bookingDate-desc sort.
    out.sort((a, b) => {
        const da = new Date(a.bookingDate || 0).getTime();
        const db = new Date(b.bookingDate || 0).getTime();
        return db - da;
    });

    return { transactions: out };
}
