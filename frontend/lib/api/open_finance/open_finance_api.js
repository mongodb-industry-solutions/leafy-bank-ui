/**  
 * This file contains functions to interact with the Open Finance endpoints.  
 * The backend services are implemented in Python (FastAPI).  
 * For more details, please refer to the Open Finance documentation.  
 * @module open_finance_api  
 */

const OPEN_FINANCE_API_URL = process.env.NEXT_PUBLIC_OPEN_FINANCE_API_URL;

/**  
 * Fetch external accounts for a specific user and institution.
 * @param {string} userIdentifier - The identifier of the user.
 * @param {string} institutionName - The name of the institution.
 * @param {string} bearerToken - The Bearer token for authentication.
 * @returns {Promise<Array>} A list of dictionaries containing the external accounts for the user.
 */
export async function fetchExternalAccountsForUserAndInstitution(userIdentifier, institutionName, bearerToken) {
    const queryParams = new URLSearchParams({
        user_identifier: userIdentifier,
        institution_name: institutionName // Changed from bank_name to institution_name
    }).toString();

    console.log("Fetch URL:", `${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/fetch-external-accounts-for-user-and-institution/?${queryParams}`);

    const response = await fetch(`${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/fetch-external-accounts-for-user-and-institution/?${queryParams}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${bearerToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching external accounts for user: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

/**  
 * Fetch external products for a specific user and institution.
 * @param {string} userIdentifier - The identifier of the user.
 * @param {string} institutionName - The name of the institution.
 * @param {string} bearerToken - The Bearer token for authentication.
 * @returns {Promise<Array>} A list of dictionaries containing the external products for the user.
 */
export async function fetchExternalProductsForUserAndInstitution(userIdentifier, institutionName, bearerToken) {
    const queryParams = new URLSearchParams({
        user_identifier: userIdentifier,
        institution_name: institutionName // Changed from bank_name to institution_name
    }).toString();

    console.log("Fetch URL:", `${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/fetch-external-products-for-user-and-institution/?${queryParams}`);

    const response = await fetch(`${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/fetch-external-products-for-user-and-institution/?${queryParams}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${bearerToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching external products for user: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

/**  
 * Fetch all external accounts for a specific user.
 * @param {string} userIdentifier - The identifier of the user.
 * @param {string} bearerToken - The Bearer token for authentication.
 * @returns {Promise<Array>} A list of dictionaries containing all external accounts for the user.
 */
export async function fetchAllExternalAccountsForUser(userIdentifier, bearerToken) {
    const queryParams = new URLSearchParams({
        user_identifier: userIdentifier
    }).toString();

    console.log("Fetch URL:", `${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/fetch-external-accounts-for-user/?${queryParams}`);

    const response = await fetch(`${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/fetch-external-accounts-for-user/?${queryParams}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${bearerToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching all external accounts for user: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

/**  
 * Fetch all external products for a specific user.
 * @param {string} userIdentifier - The identifier of the user.
 * @param {string} bearerToken - The Bearer token for authentication.
 * @returns {Promise<Array>} A list of dictionaries containing all external products for the user.
 */
export async function fetchAllExternalProductsForUser(userIdentifier, bearerToken) {
    const queryParams = new URLSearchParams({
        user_identifier: userIdentifier
    }).toString();

    console.log("Fetch URL:", `${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/fetch-external-products-for-user/?${queryParams}`);

    const response = await fetch(`${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/fetch-external-products-for-user/?${queryParams}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${bearerToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching all external products for user: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

/**  
 * Calculate total balances for a specific user.
 * @param {string} userId - The ID of the user.
 * @param {string} bearerToken - The Bearer token for authentication.
 * @param {Array<string>} connectedExternalAccounts - An optional list of connected external account IDs.
 * @returns {Promise<Object>} The total balances for the user.
 */
export async function calculateTotalBalancesForUser(userId, bearerToken, connectedExternalAccounts = []) {
    const payload = {
        user_id: userId,
        connected_external_accounts: connectedExternalAccounts
    };

    console.log("Request Payload:", payload);

    const response = await fetch(`${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/calculate-total-balance-for-user/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Error calculating total balances for user: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Calculate total debt for a specific user.
 * @param {string} userId - The ID of the user.
 * @param {string} bearerToken - The Bearer token for authentication.
 * @param {Array<string>} connectedExternalProducts - An optional list of connected external product IDs.
 * @returns {Promise<Object>} The total debt for the user.
 */
export async function calculateTotalDebtForUser(userId, bearerToken, connectedExternalProducts = []) {
    const payload = {
        user_id: userId,
        connected_external_products: connectedExternalProducts
    };

    console.log("Request Payload for Total Debt:", payload);

    const response = await fetch(`${OPEN_FINANCE_API_URL}/api/v1/openfinance/secure/calculate-total-debt-for-user/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Error calculating total debt for user: ${response.status}`);
    }

    const data = await response.json();
    return data;
}
