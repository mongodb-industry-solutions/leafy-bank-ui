// userDataApi.js
import { fetchActiveAccountsForUser } from './accounts/accounts_api';
import { fetchRecentTransactionsForUser } from './transactions/transactions_api';

/**
 * Fetch user data including active accounts and recent transactions.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object>} An object containing active accounts and recent transactions.
 */
export async function fetchUserData(userId) {
    try {
        const [activeAccounts, recentTransactions] = await Promise.all([
            fetchActiveAccountsForUser(userId),
            fetchRecentTransactionsForUser(userId),
        ]);

        // Parse the accounts and transactions if they are JSON strings
        const parsedActiveAccounts = typeof activeAccounts === 'string' ? JSON.parse(activeAccounts) : activeAccounts;
        const parsedRecentTransactions = typeof recentTransactions === 'string' ? JSON.parse(recentTransactions) : recentTransactions;

        return { accounts: parsedActiveAccounts, transactions: parsedRecentTransactions };
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}
