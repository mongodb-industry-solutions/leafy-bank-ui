// pdf_rag_api.js
/**
 * This file contains functions to interact with the Cross Backend PDF RAG API.
 * The backend services are decoupled and coded in Python.
 * For more details, please refer to the PDF RAG API repository.
 * @module pdf_rag_api
 * @requires None
 * @exports queryPdf
 */

// Use /api prefix for proxy pattern (Next.js API routes)
// This points to Next.js API routes, NOT the backend directly
const API_BASE_URL = '/api/cross-backend-pdf-rag';

/**
 * Query PDF documents using RAG to get answers based on the content.
 * @param {string} industry - The industry name (e.g., 'fsi', 'insurance').
 * @param {string} demoName - The demo name (e.g., 'leafy_bank_assistant', 'pdf_search').
 * @param {string} query - The question to ask about the PDF documents.
 * @param {string} guidelines - PDF filename to filter results (e.g., 'personal-banking-terms-conditions.pdf').
 * @returns {Promise<Object>} The response data containing answer and supporting_docs.
 * @throws Will throw an error if the request fails.
 */
export async function queryPdf({ industry, demoName, query, guidelines }) {
    const response = await fetch(`${API_BASE_URL}/querythepdf`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            industry,
            demo_name: demoName,
            query,
            guidelines,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(`Error querying PDF: ${response.status} - ${errorData.detail || errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data;
}

