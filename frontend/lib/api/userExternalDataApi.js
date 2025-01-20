// userExternalDataApi.js
import { fetchAllExternalAccountsForUser, fetchAllExternalProductsForUser } from './open_finance/open_finance_api';

/**
 * Fetch user external data including external accounts and products.
 * @param {string} userId - The ID of the user.
 * @param {string} bearerToken - The Bearer token for authentication.
 * @returns {Promise<Object>} An object containing external accounts and products.
 */
export async function fetchUserExternalData(userId, bearerToken) {
    try {
        const [externalAccounts, externalProducts] = await Promise.all([
            fetchAllExternalAccountsForUser(userId, bearerToken),
            fetchAllExternalProductsForUser(userId, bearerToken)
        ]);

        // Parse the accounts and transactions if they are JSON strings
        const parsedExternalAccounts = typeof externalAccounts === 'string' ? JSON.parse(externalAccounts) : externalAccounts;
        const parsedExternalProducts = typeof externalProducts === 'string' ? JSON.parse(externalProducts) : externalProducts;

        return { external_accounts: parsedExternalAccounts, external_products: parsedExternalProducts };
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}
