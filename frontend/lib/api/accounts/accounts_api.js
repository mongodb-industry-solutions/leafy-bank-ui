// accounts_api.js
/**
 * This file contains functions to interact with the Accounts API.
 * The backend services are decoupled and coded in Python.
 * For more details, please refer to the Accounts API repository:
 * https://github.com/mongodb-industry-solutions/leafy-bank-backend-accounts/
 */

const ACCOUNTS_API_URL = process.env.NEXT_PUBLIC_ACCOUNTS_API_URL;

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
export async function createAccount(userName, userId, accountNumber, accountBalance, accountType) {
    const response = await fetch(`${ACCOUNTS_API_URL}/create-account`, {
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
    const response = await fetch(`${ACCOUNTS_API_URL}/delete-account`, {
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
    const response = await fetch(`${ACCOUNTS_API_URL}/close-account`, {
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
    const response = await fetch(`${ACCOUNTS_API_URL}/fetch-accounts-for-user`, {
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
    return data.accounts;
}

/**
 * Fetch active accounts for a specific user.
 * @param {string} userIdentifier - The identifier of the user (username or ID).
 * @returns {Promise<Array>} A list of active accounts associated with the user.
 * @throws Will throw an error if the request fails.
 */
export async function fetchActiveAccountsForUser(userIdentifier) {
    const response = await fetch(`${ACCOUNTS_API_URL}/fetch-active-accounts-for-user`, {
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
    return data.accounts;
}
