// bian_api.js
/**
 * Functions to interact with the BIAN endpoints exposed by the Accounts API.
 * The backend services are decoupled and coded in Python.
 * For more details, please refer to the Accounts API repository:
 * https://github.com/mongodb-industry-solutions/leafy-bank-backend-accounts/
 * @module bian_api
 * @exports fetchBianMapping
 * @exports fetchBianApiCatalog
 */

// Use the same proxy pattern as accounts_api.js. These point to the
// Next.js API routes under app/api/bian/*, NOT the backend directly.
const API_BASE_URL = '/api/bian';

/**
 * Fetch the Mongo→BIAN field mapping for the supported domains.
 * @returns {Promise<Object>} { mapping: { $meta, customers, accounts, payments, transactions } }
 * @throws Will throw an error if the request fails.
 */
export async function fetchBianMapping() {
    const response = await fetch(`${API_BASE_URL}/fetch-mapping`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        throw new Error(`Error fetching BIAN mapping: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Fetch the BIAN API catalog (domains and operations).
 * @returns {Promise<Object>} { catalog: { version, description, domains: [...] } }
 * @throws Will throw an error if the request fails.
 */
export async function fetchBianApiCatalog() {
    const response = await fetch(`${API_BASE_URL}/fetch-api-catalog`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        throw new Error(`Error fetching BIAN API catalog: ${response.status}`);
    }

    const data = await response.json();
    return data;
}
