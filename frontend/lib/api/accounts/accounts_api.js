// accounts_api.js
/**
 * Client helpers for the accounts service. Phase 5 (BIAN flip):
 *   - All calls now go through Next.js proxies that mirror BIAN URLs literally
 *     (`/api/CurrentAccountFulfillmentArrangement/<Verb>`).
 *   - Helper signatures are unchanged where possible — internal body construction
 *     and response shaping flow through `lib/adapters/bian-to-ui.js`.
 *   - `deleteAccount` was removed — the BIAN model has no hard delete; use
 *     `closeAccount` (Control / Close) for soft-close.
 *
 * @module accounts_api
 * @exports createAccount
 * @exports closeAccount
 * @exports fetchAccountsForUser
 * @exports fetchActiveAccountsForUser
 * @exports fetchAccounts
 * @exports fetchActiveAccounts
 * @exports findAccountByNumber
 * @exports findActiveAccountByNumber
 * @exports fetchRecentActivityForCustomer
 */

import {
    bianAccountsResponseToUi,
    bianAccountRetrieveToUi,
    bianAccountInitiateToUi,
    bianActivityResponseToUi,
    uiCreateAccountToBian,
} from "@/lib/adapters/bian-to-ui";
import { deriveCustomerRef } from "@/lib/api/refs";

const ACCT_BASE = "/api/CurrentAccountFulfillmentArrangement";

async function postJson(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error(`Request to ${url} failed: ${response.status}`);
    }
    return response.json();
}

/**
 * Create a new account.
 * @param {object} input
 * @param {string} input.userName - kept for back-compat; ignored (server resolves via customers)
 * @param {string} input.userId - 24-hex ObjectId from USER_MAP
 * @param {string|number} input.accountNumber
 * @param {number} input.accountBalance
 * @param {string} input.accountType - "Checking" | "Savings" (UI-shape; mapped to BIAN enum)
 * @returns {Promise<object>} legacy shape with `_id` and `account_id`.
 */
export async function createAccount({ userId, accountNumber, accountBalance, accountType }) {
    const body = uiCreateAccountToBian({
        userId,
        accountNumber,
        accountBalance,
        accountType,
    });
    const envelope = await postJson(`${ACCT_BASE}/Initiate`, body);
    return bianAccountInitiateToUi(envelope);
}

/**
 * Close an account (BIAN Control / Close — soft-close, not hard-delete).
 * @param {string} accountRef - the BIAN ref (`ACC-…`).
 * @returns {Promise<object>}
 */
export async function closeAccount(accountRef) {
    const body = {
        accountId: accountRef,
        controlAction: "Close",
    };
    const envelope = await postJson(`${ACCT_BASE}/Control`, body);
    return {
        account_id: envelope?.accountId,
        controlAction: envelope?.controlAction,
        raw: envelope,
    };
}

/**
 * All accounts for a user (any status).
 * @param {string} userId - 24-hex ObjectId from USER_MAP
 */
export async function fetchAccountsForUser(userId) {
    const body = { customerId: deriveCustomerRef(userId) };
    const envelope = await postJson(`${ACCT_BASE}/Request`, body);
    return bianAccountsResponseToUi(envelope);
}

/**
 * Active accounts for a user.
 * @param {string} userId - 24-hex ObjectId from USER_MAP
 */
export async function fetchActiveAccountsForUser(userId) {
    const body = {
        customerId: deriveCustomerRef(userId),
        status: "ACTIVE",
    };
    const envelope = await postJson(`${ACCT_BASE}/Request`, body);
    return bianAccountsResponseToUi(envelope);
}

/**
 * All active accounts (no user scope). Used by Form for the beneficiary picker.
 */
export async function fetchActiveAccounts() {
    const body = { status: "ACTIVE" };
    const envelope = await postJson(`${ACCT_BASE}/Request`, body);
    return bianAccountsResponseToUi(envelope);
}

/**
 * All accounts, optionally excluding one. Filtering is done client-side post-adapter.
 * @param {string} [excludeAccountId]
 */
export async function fetchAccounts(excludeAccountId = null) {
    const envelope = await postJson(`${ACCT_BASE}/Request`, {});
    const ui = bianAccountsResponseToUi(envelope);
    if (excludeAccountId && excludeAccountId.trim() !== "") {
        ui.accounts = ui.accounts.filter((a) => a._id !== excludeAccountId);
    }
    return ui;
}

/**
 * Look up an account by number (any status).
 * @param {string|number} accountNumber
 */
export async function findAccountByNumber(accountNumber) {
    const body = { accountNumber: String(accountNumber) };
    const envelope = await postJson(`${ACCT_BASE}/Retrieve`, body);
    return bianAccountRetrieveToUi(envelope);
}

/**
 * Look up an active account by number — adapter filters by status post-fetch.
 * @param {string|number} accountNumber
 */
export async function findActiveAccountByNumber(accountNumber) {
    const result = await findAccountByNumber(accountNumber);
    if (result.account && result.account.status !== "ACTIVE") {
        return { account: null };
    }
    return result;
}

/**
 * Recent ledger activity across all of a customer's accounts (Phase 5: relocated
 * from the transactions service to the accounts service per umbrella plan-v2 § 5,
 * fan-out shipped in PR-accounts-4).
 *
 * @param {string} userId - 24-hex ObjectId from USER_MAP
 * @param {object[]} ownedAccountUiRecords - user's own accounts (post-adapter); used by
 *   the activity adapter to filter to ONE leg per payment per Phase 5 decision #3.
 * @param {object} [selfUser] - { userId, userName } for self-side display
 * @param {number} [limit=50]
 * @returns {Promise<{transactions: object[]}>}
 */
export async function fetchRecentActivityForCustomer(
    userId,
    ownedAccountUiRecords = [],
    selfUser = {},
    limit = 50
) {
    const body = {
        customerId: deriveCustomerRef(userId),
        limit,
    };
    const envelope = await postJson(
        `${ACCT_BASE}/CurrentAccountTransaction/Request`,
        body
    );
    return bianActivityResponseToUi(envelope, ownedAccountUiRecords, selfUser);
}
