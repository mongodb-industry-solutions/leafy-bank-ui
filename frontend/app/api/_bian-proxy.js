// _bian-proxy.js
/**
 * Shared proxy factory for BIAN-literal route handlers.
 *
 * Every Next.js handler under `frontend/app/api/<ServiceDomain>/.../route.js` is a thin
 * pass-through to a backend BIAN URL. Centralizing the boilerplate (env resolution, error
 * shaping, structured logging) here keeps each `route.js` to a 3-line config.
 *
 * The leading `_` in the filename keeps Next.js from treating it as a route segment.
 *
 * @module _bian-proxy
 * @exports makeBianProxy
 */

const ACCOUNTS_DEFAULT = "http://localhost:8000";
const TRANSACTIONS_DEFAULT = "http://localhost:8001";

function resolveBackendUrl(target) {
    if (target === "accounts") {
        return (
            process.env.INTERNAL_ACCOUNTS_API_URL ||
            process.env.NEXT_PUBLIC_ACCOUNTS_API_URL ||
            ACCOUNTS_DEFAULT
        );
    }
    if (target === "transactions") {
        return (
            process.env.INTERNAL_TRANSACTIONS_API_URL ||
            process.env.NEXT_PUBLIC_TRANSACTIONS_API_URL ||
            TRANSACTIONS_DEFAULT
        );
    }
    throw new Error(`Unknown proxy target: ${target}`);
}

/**
 * Build a Next.js POST handler that forwards a JSON body to the given BIAN backend path.
 *
 * @param {object} cfg
 * @param {"accounts" | "transactions"} cfg.target - which backend service to forward to.
 * @param {string} cfg.path - BIAN URL path on the backend, leading slash required.
 *                            e.g. "/CurrentAccountFulfillmentArrangement/Request".
 * @param {string[]} [cfg.forwardHeaders] - request headers to pass through (e.g. "Idempotency-Key").
 * @returns {(request: Request) => Promise<Response>}
 */
export function makeBianProxy({ target, path, forwardHeaders = [] }) {
    return async function POST(request) {
        try {
            const body = await request.json();
            const backendUrl = resolveBackendUrl(target);
            const url = `${backendUrl}${path}`;

            const headers = { "Content-Type": "application/json" };
            for (const h of forwardHeaders) {
                const v = request.headers.get(h);
                if (v) headers[h] = v;
            }

            console.log(`Proxying POST -> ${url}`);

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response
                    .json()
                    .catch(() => ({ detail: "Request failed" }));
                return Response.json(error, { status: response.status });
            }

            const data = await response.json();
            return Response.json(data);
        } catch (error) {
            console.error("BIAN proxy error:", error);
            return Response.json(
                { error: "Failed to connect to backend", details: error.message },
                { status: 500 }
            );
        }
    };
}
