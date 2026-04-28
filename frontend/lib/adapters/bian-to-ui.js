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
    const customerRef = record.CustomerReference;
    return {
        ...record,
        // helpers
        _customerUserName: CUSTOMER_REF_TO_USERNAME[customerRef] || "Unknown User",
        _customerUserId: CUSTOMER_REF_TO_USERID[customerRef] || customerRef,
        _bankName: "LeafyBank",
        // back-compat alias for code that still keys/compares on `_id` (e.g. the
        // disconnect modal that mixes internal + external Open Finance items).
        _id: record.CurrentAccountReference,
    };
}

/**
 * `Request` envelope -> `{ accounts: [...] }`.
 */
export function bianAccountsResponseToUi(envelope) {
    const records = envelope?.CurrentAccountFulfillmentArrangementRecord || [];
    return { accounts: records.map(bianAccountToUi) };
}

/**
 * `Retrieve` envelope -> `{ account: ... }`.
 */
export function bianAccountRetrieveToUi(envelope) {
    const record = envelope?.CurrentAccountFulfillmentArrangementRecord;
    return { account: bianAccountToUi(record) };
}

/**
 * `Initiate` (create) response. Components read `account_id` after submit; expose
 * it alongside the full BIAN record.
 */
export function bianAccountInitiateToUi(envelope) {
    const ui = bianAccountToUi(envelope?.CurrentAccountFulfillmentArrangementRecord);
    return {
        ...ui,
        account_id: envelope?.CurrentAccountReference,
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
        CustomerReference: deriveCustomerRef(userId),
        CurrentAccountNumber: String(accountNumber),
        CurrentAccountType: bianType,
        CurrentAccountCurrencyCode: currency,
        InitialDepositAmount: Number(accountBalance),
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
        CustomerReference: customerRef,
        PaymentType: "INTRABANK_TRANSFER",
        PaymentRailType: "INTERNAL",
        PaymentInstructedAmount: Number(amount),
        PaymentInstructedCurrencyCode: currency,
        PaymentDebtorRecord: { DebtorAccountReference: originatorAccountRef },
        PaymentCreditorRecord: { CreditorAccountReference: beneficiaryAccountRef },
    };
    if (paymentMethod) {
        body.PaymentRemittanceRecord = {
            RemittanceUnstructuredInformationText: `via ${paymentMethod}`,
        };
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
        transaction_id: envelope?.PaymentOrderReference,
        PaymentOrderReference: envelope?.PaymentOrderReference,
        status: envelope?.PaymentApexStatus,
        raw: envelope,
    };
}

// ---------- Transaction (ledger leg) adapter ----------

/**
 * Parse "via Paypal" / "via Zelle" remittance text (if present) back to a method label.
 * Phase 1 doesn't carry remittance on legs — the field is reserved for Phase 2+
 * external rails. Returns undefined when not present.
 */
function extractPaymentMethod(leg) {
    const text = leg?.TransactionRemittanceRecord?.RemittanceUnstructuredInformationText;
    if (!text) return undefined;
    const m = /^via\s+(.+)$/i.exec(text.trim());
    return m ? m[1] : undefined;
}

/**
 * Compute the display label for the transactions list based on rail + internal flag.
 */
function deriveDisplayLabel(leg, isInternal) {
    if (isInternal) return "InternalTransfer";
    const code = leg.TransactionCategoryCode || "";
    if (code.startsWith("PMNT-ICDT")) return "AccountTransfer";
    return "DigitalPayment";
}

/**
 * Wrap a single ledger leg with adapter-derived display helpers. The BIAN fields
 * pass through unchanged.
 *
 * @param {object} leg - one item of `CurrentAccountPaymentTransactionRecord[]`
 * @param {object} ctx - { isInternal, isOwnedLeg, selfUserId, selfUserName }
 * @returns {object} BIAN leg + `_*` helpers
 */
function decorateLeg(leg, ctx) {
    const txnType = leg.TransactionType; // "DEBIT" | "CREDIT"
    const isOutgoing = txnType === "DEBIT";
    const isIncoming = !ctx.isInternal && txnType === "CREDIT";

    const counterparty = leg.TransactionCounterpartyRecord || {};
    const otherSideName = ctx.isInternal
        ? ctx.selfUserName
        : counterparty.CounterpartyName || "Unknown";

    return {
        ...leg,
        _isInternal: !!ctx.isInternal,
        _isIncoming: !!isIncoming,
        _isOutgoing: !!isOutgoing,
        _selfUserId: ctx.selfUserId,
        _selfUserName: ctx.selfUserName,
        _otherSideName: otherSideName,
        _displayLabel: deriveDisplayLabel(leg, ctx.isInternal),
        _paymentMethod: extractPaymentMethod(leg),
    };
}

/**
 * Translate the activity-route response to a list of decorated BIAN legs, applying
 * the per-user one-leg-per-payment filter (Phase 5 decision #3).
 *
 * Filter rules:
 *   - Internal between two of the user's own accounts -> emit DEBIT leg only.
 *   - Outgoing only (user is debtor)               -> emit DEBIT leg.
 *   - Incoming only (user is creditor)             -> emit CREDIT leg.
 *
 * @param {object} envelope - backend Activity response with CurrentAccountPaymentTransactionRecord[]
 * @param {object[]} ownedAccountUiRecords - the user's own account objects (post-adapter)
 * @param {object} [selfUser] - { userId, userName } for self-side display
 * @returns {{transactions: object[]}}
 */
export function bianActivityResponseToUi(envelope, ownedAccountUiRecords = [], selfUser = {}) {
    const legs = envelope?.CurrentAccountPaymentTransactionRecord || [];
    const ownedRefs = new Set(
        (ownedAccountUiRecords || [])
            .map((a) => a?.CurrentAccountReference || a?._id)
            .filter(Boolean)
    );

    // Group legs by paymentId so we can detect "internal-between-own-accounts" cases.
    const byPaymentId = new Map();
    for (const leg of legs) {
        const paymentId = leg.PaymentOrderReference || leg.TransactionReference;
        if (!byPaymentId.has(paymentId)) byPaymentId.set(paymentId, []);
        byPaymentId.get(paymentId).push(leg);
    }

    const out = [];
    for (const [, group] of byPaymentId) {
        const ownedLegs = group.filter((l) => ownedRefs.has(l.CurrentAccountReference));
        const isInternal = ownedLegs.length > 1;

        let chosen;
        if (isInternal) {
            chosen = ownedLegs.find((l) => l.TransactionType === "DEBIT") || ownedLegs[0];
        } else if (ownedLegs.length === 1) {
            chosen = ownedLegs[0];
        } else {
            // No owned leg in this payment group — should not happen once the activity
            // route fans out by CustomerReference, but skip defensively.
            continue;
        }

        out.push(
            decorateLeg(chosen, {
                isInternal,
                selfUserId: selfUser.userId,
                selfUserName: selfUser.userName,
            })
        );
    }

    // BookingDate-desc sort.
    out.sort((a, b) => {
        const da = new Date(a.TransactionBookingDate || 0).getTime();
        const db = new Date(b.TransactionBookingDate || 0).getTime();
        return db - da;
    });

    return { transactions: out };
}
