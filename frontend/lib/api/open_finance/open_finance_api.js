// open_finance_api.js
/**
 * This file contains functions to interact with the Open Finance endpoints.
 * The backend services are implemented in Python (FastAPI).
 * For more details, please refer to the Open Finance documentation.
 * @module open_finance_api
 * @requires None
 * @exports retrieveExternalAccount
 * @exports fetchExternalAccountsForUser
 */

const OPEN_FINANCE_API_URL = process.env.NEXT_PUBLIC_OPEN_FINANCE_API_URL;

/**
 * Fetch external accounts for a specific user.
 * @param {string} userIdentifier - The identifier of the user.
 * @param {string} apiKey - The API key for authentication.
 * @returns {Promise<Array>} A list of external accounts associated with the user.
 */
export async function fetchExternalAccountsForUser(userIdentifier, bankName, apiKey) {
    const queryParams = new URLSearchParams({
        user_identifier: userIdentifier,
        bank_name: bankName
    }).toString();

    console.log("Fetch URL:", `${OPEN_FINANCE_API_URL}/api/v1/secure/fetch-external-accounts/?${queryParams}`);

    const response = await fetch(`${OPEN_FINANCE_API_URL}/api/v1/secure/fetch-external-accounts/?${queryParams}`, {
        method: "GET",
        headers: {
            "X-API-Key": apiKey,  // Custom header for API key
        }
    });
    if (!response.ok) {
        throw new Error(`Error fetching external accounts for user: ${response.status}`);
    }
    const data = await response.json();
    return data;
}
