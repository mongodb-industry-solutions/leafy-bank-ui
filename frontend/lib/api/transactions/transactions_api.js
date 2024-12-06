// transactions_api.js
/**
 * This file contains functions to interact with the Transactions API.
 * The backend services are decoupled and coded in Python.
 * For more details, please refer to the Transactions API repository:
 * https://github.com/mongodb-industry-solutions/leafy-bank-backend-transactions/
 * @module transactions_api
 * @requires None
 * @exports performAccountTransfer
 * @exports performDigitalPayment
 * @exports fetchRecentTransactionsForUser
 */

const TRANSACTIONS_API_URL = process.env.NEXT_PUBLIC_TRANSACTIONS_API_URL;

/**
 * Perform an account transfer transaction.
 * @param {Object} transactionData - The data for the transaction.
 * @returns {Promise<Object>} The response data from the server.
 * @throws Will throw an error if the request fails.
 */
export async function performAccountTransfer(transactionData) {
    const response = await fetch(`${TRANSACTIONS_API_URL}/perform-account-transfer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
        throw new Error(`Error performing account transfer: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Perform a digital payment transaction.
 * @param {Object} transactionData - The data for the transaction.
 * @returns {Promise<Object>} The response data from the server.
 * @throws Will throw an error if the request fails.
 */
export async function performDigitalPayment(transactionData) {
    const response = await fetch(`${TRANSACTIONS_API_URL}/perform-digital-payment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
        throw new Error(`Error performing digital payment: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Fetch recent transactions for a specific user.
 * @param {string} userIdentifier - The identifier of the user (username or ID).
 * @returns {Promise<Array>} A list of recent transactions associated with the user.
 * @throws Will throw an error if the request fails.
 */
export async function fetchRecentTransactionsForUser(userIdentifier) {
    const response = await fetch(`${TRANSACTIONS_API_URL}/fetch-recent-transactions-for-user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_identifier: userIdentifier }),
    });

    if (!response.ok) {
        throw new Error(`Error fetching recent transactions for user: ${response.status}`);
    }

    const data = await response.json();
    return data.transactions;
}
