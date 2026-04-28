// userDataApi.js
/**
 * Compositor: parallel-fetch a user's active accounts + recent ledger activity.
 *
 * Phase 5 (BIAN flip):
 *   - Recent activity now comes from the accounts service (relocated from transactions
 *     per umbrella plan-v2 § 5).
 *   - The activity adapter needs the user's owned account refs to filter to ONE leg per
 *     payment (DEBIT for outgoing, CREDIT for incoming, DEBIT-only for internal-between-
 *     own-accounts). Hence the two-step await: accounts first, then activity.
 *   - We still parallelise the network round-trips by issuing both fetches concurrently
 *     and awaiting both — the activity helper consumes the resolved accounts.
 *
 * @module userDataApi
 */

import {
    fetchActiveAccountsForUser,
    fetchRecentActivityForCustomer,
} from "./accounts/accounts_api";
import { USER_MAP } from "@/lib/constants";

/**
 * Fetch user data: active accounts + recent ledger activity.
 *
 * @param {string} userId - 24-hex ObjectId from USER_MAP.
 * @returns {Promise<{accounts: {accounts: object[]}, transactions: {transactions: object[]}}>}
 *   The double-nesting (e.g. `accounts.accounts`) preserves the legacy envelope shape that
 *   `Home.jsx` and `Transactions.jsx` already consume.
 */
export async function fetchUserData(userId) {
    try {
        const userInfo = USER_MAP[userId] || {};
        const selfUser = { userId, userName: userInfo.UserName };

        // Step 1: own accounts (needed to drive the activity-leg filter).
        const accounts = await fetchActiveAccountsForUser(userId);

        // Step 2: activity — pass owned accounts so the adapter can pick one leg per
        // payment and detect internal-between-own-accounts.
        const transactions = await fetchRecentActivityForCustomer(
            userId,
            accounts.accounts,
            selfUser,
            50
        );

        return { accounts, transactions };
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
}
