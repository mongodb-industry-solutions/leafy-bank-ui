// userDataApi.js
import { fetchActiveAccountsForUser } from './accounts/accounts_api'
import { fetchRecentTransactionsForUser } from './transactions/transactions_api'
/**
 * Fetch user data including active accounts and recent transactions.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object>} An object containing accounts and transactions.
 */
export async function fetchUserData(userId) {
    try {
        const [accounts, transactions] = await Promise.all([
            fetchActiveAccountsForUser(userId),
            fetchRecentTransactionsForUser(userId),
        ]);
        return { accounts, transactions };
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}