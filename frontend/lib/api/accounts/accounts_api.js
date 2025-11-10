// accounts_api.js
/**
 * This file contains functions to interact with the Accounts API.
 * The backend services are decoupled and coded in Python.
 * For more details, please refer to the Accounts API repository:
 * https://github.com/mongodb-industry-solutions/leafy-bank-backend-accounts/
 * @module accounts_api
 * @requires None
 * @exports createAccount
 * @exports deleteAccount
 * @exports closeAccount
 * @exports fetchAccountsForUser
 * @exports fetchActiveAccountsForUser
 */

// Use /api prefix for proxy pattern (Next.js API routes)
// This points to Next.js API routes, NOT the backend directly
const API_BASE_URL = '/api/accounts';

/**
 * Create a new account.
 * @param {string} userName - The name of the user.
 * @param {string} userId - The ID of the user.
 * @param {string} accountNumber - The account number.
 * @param {number} accountBalance - The initial balance of the account.
 * @param {string} accountType - The type of the account (e.g., Checking, Savings).
 * @returns {Promise<Object>} The response data from the server.
 * @throws Will throw an error if the request fails.
 */
export async function createAccount({ userName, userId, accountNumber, accountBalance, accountType }) {
    const response = await fetch(`${API_BASE_URL}/create-account`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            UserName: userName,
            UserId: userId,
            AccountNumber: accountNumber,
            AccountBalance: accountBalance,
            AccountType: accountType,
        }),
    });

    if (!response.ok) {
        throw new Error(`Error creating account: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Delete an account by its ID.
 * @param {string} accountId - The ID of the account to delete.
 * @returns {Promise<Object>} The response data from the server.
 * @throws Will throw an error if the request fails.
 */
export async function deleteAccount(accountId) {
    const response = await fetch(`${API_BASE_URL}/delete-account`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_id: accountId }),
    });

    if (!response.ok) {
        throw new Error(`Error deleting account: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Close an account by its ID.
 * @param {string} accountId - The ID of the account to close.
 * @returns {Promise<Object>} The response data from the server.
 * @throws Will throw an error if the request fails.
 */
export async function closeAccount(accountId) {
    const response = await fetch(`${API_BASE_URL}/close-account`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_id: accountId }),
    });

    if (!response.ok) {
        throw new Error(`Error closing account: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Fetch all accounts for a specific user.
 * @param {string} userIdentifier - The identifier of the user (username or ID).
 * @returns {Promise<Array>} A list of accounts associated with the user.
 * @throws Will throw an error if the request fails.
 */
export async function fetchAccountsForUser(userIdentifier) {
    const response = await fetch(`${API_BASE_URL}/fetch-accounts-for-user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_identifier: userIdentifier }),
    });

    if (!response.ok) {
        throw new Error(`Error fetching accounts: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Fetch active accounts for a specific user.
 * @param {string} userIdentifier - The identifier of the user (username or ID).
 * @returns {Promise<Array>} A list of active accounts associated with the user.
 * @throws Will throw an error if the request fails.
 */
export async function fetchActiveAccountsForUser(userIdentifier) {
    const response = await fetch(`${API_BASE_URL}/fetch-active-accounts-for-user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_identifier: userIdentifier }),
    });

    if (!response.ok) {
        throw new Error(`Error fetching active accounts: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Fetch all active accounts, ignoring the excludeAccountId parameter.
 * @returns {Promise<Array>} A list of all active accounts.
 * @throws Will throw an error if the request fails.
 */
export async function fetchActiveAccounts() {
    // Always send an empty object in the request body
    const bodyData = {};

    // Execute the fetch request
    const response = await fetch(`${API_BASE_URL}/fetch-active-accounts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData), // Send only an empty object
    });

    if (!response.ok) {
        throw new Error(`Error fetching active accounts: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Fetch all accounts, optionally excluding a specific account.
 * @param {string} [excludeAccountId] - The ID of the account to exclude from the results.
 * @returns {Promise<Array>} A list of all accounts, excluding the specified account if provided.
 * @throws Will throw an error if the request fails.
 */
export async function fetchAccounts(excludeAccountId = null) {
    // Prepare the request body conditionally
    const bodyData = {};

    if (excludeAccountId && excludeAccountId.trim() !== "") {
        bodyData.exclude_account_id = excludeAccountId;
    }

    // Execute the fetch request
    const response = await fetch(`${API_BASE_URL}/fetch-accounts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),  // Send JSON only with meaningful keys
    });

    if (!response.ok) {
        throw new Error(`Error fetching accounts: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Find an account by its number.
 * @param {string|number} accountNumber - The account number to search for.
 * @returns {Promise<Object>} The account data if found.
 * @throws Will throw an error if the request fails.
 */
export async function findAccountByNumber(accountNumber) {
    const response = await fetch(`${API_BASE_URL}/find-account-by-number`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_number: String(accountNumber) }), // Ensure the number is treated as a string
    });

    if (!response.ok) {
        throw new Error(`Error finding account: ${response.status}`);
    }

    const data = await response.json();
    return data; // API responds with {"account": {...}}
}

/**  
 * Find an active account by its number.
 * @param {string|number} accountNumber - The account number to search for.
 * @returns {Promise<Object>} The active account data if found.
 * @throws Will throw an error if the request fails.
 */
export async function findActiveAccountByNumber(accountNumber) {
    const response = await fetch(`${API_BASE_URL}/find-active-account-by-number`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_number: String(accountNumber) }), // Ensure the number is treated as a string
    });

    if (!response.ok) {
        throw new Error(`Error finding active account: ${response.status}`);
    }

    const data = await response.json();
    return data; // API responds with {"account": {...}}
}
