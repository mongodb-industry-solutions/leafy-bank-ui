/**  
 * This file contains functions to interact with the Capital Markets Chatbot endpoints.  
 * The backend services are implemented in Python (FastAPI).
 * @module capitalmarkets_react_crypto_api  
 */

// Use /api prefix for proxy pattern (Next.js API routes)
// This points to Next.js API routes, NOT the backend directly
const API_BASE_URL = '/api/capitalmarkets-react-crypto';

/**  
 * Chatbot Interaction
 */

/**  
 * Sends a message to the Capital Markets Chatbot and retrieves the response.
 * @param {string} thread_id - The ID of the conversation thread.
 * @param {string} message - The message to send to the chatbot.
 * @throws Will throw an error if the request fails.
 */
export async function sendMessagetoReactAgentCryptoAssistantChatbot(thread_id, message) {

    const payload = {
        thread_id: thread_id,
        message: message
    };

    const response = await fetch(`${API_BASE_URL}/crypto-assistant/send-message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Error sending message to chatbot: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}