/**  
 * This file contains functions to interact with the Capital Markets Chatbot endpoints.  
 * The backend services are implemented in Python (FastAPI).
 * @module capitalmarkets_react_crypto_api  
 */

const CAPITALMARKETS_REACT_CRYPTO_API_URL = process.env.NEXT_PUBLIC_CAPITALMARKETS_REACT_CRYPTO_API_URL;

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

    const response = await fetch(`${CAPITALMARKETS_REACT_CRYPTO_API_URL}/crypto-assistant/send-message`, {
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