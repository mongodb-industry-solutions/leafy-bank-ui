/**  
 * This file contains functions to interact with the Capital Markets Agents endpoints.  
 * The backend services are implemented in Python (FastAPI).  
 * For more details, please refer to the Capital Markets Agents documentation.  
 * @module capitalmarkets_agents_api  
 */

const CAPITALMARKETS_AGENTS_API_URL = process.env.NEXT_PUBLIC_CAPITALMARKETS_AGENTS_API_URL;

/**  
 * Market Data
 */

/**  
 * Fetch the latest close price for all assets.
 * @returns MessageResponse: An object containing the assets close prices.
 */
export async function marketFetchAssetsClosePrice() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/market/fetch-assets-close-price`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching assets close price: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Fetch the most N recent data points for all assets.
 * Args: limit: Default is 3
 * @returns RecentDataResponse: An object containing the recent data points for each asset.
 */
export async function marketFetchRecentAssetsData() {

    // Set the limit number per asset to 3
    const limit_number = 3
    const limit = "?limit="+limit_number

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/market/fetch-recent-assets-data${limit}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching recent assets data: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Portfolio Data
 */

/**  
 * Fetch portfolio allocation data.
 * @returns MessageResponse: An object containing the portfolio allocation data.
 */
export async function fetchPortfolioAllocation() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/portfolio/fetch-portfolio-allocation`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching portfolio allocation: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Macro Indicators Data
 */

/**  
 * Fetch the most recent macroeconomic indicators.
 * @returns MessageResponse: Object containing macro indicator data.
 */
export async function fetchMostRecentMacroIndicators() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/macro-indicators/fetch-most-recent-macro-indicators`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching most recent macro indicators: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Report Data
 */

/**  
 * Fetch the most recent market analysis report.
 * @returns MarketAnalysisResponse: An object containing the most recent market analysis report.
 */
export async function fetchMostRecentMarketAnalysisReport() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/report/fetch-most-recent-market-analysis-report`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching most recent market analysis report: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Fetch the most recent market news report.
 * @returns MarketNewsResponse: An object containing the most recent market news report.
 */
export async function fetchMostRecentMarketNewsReport() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/report/fetch-most-recent-market-news-report`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching most recent market news report: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Suggestions Data
 */

/**  
 * Fetch asset suggestions based on the current portfolio and market conditions.
 * @returns MessageResponse: An object containing the asset suggestions with actions (KEEP or REDUCE) and optional notes about conflicting signals.
 */
export async function fetchAssetSuggestionsMacroIndicatorsBased() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/suggestions/fetch-asset-suggestions-macro-indicators-based`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching asset suggestions macro indicators based: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Fetch asset suggestions based on the current portfolio and market volatility (VIX).
 * Each asset receives a recommendation based on its VIX sensitivity.
 * @returns MessageResponse: An object containing asset suggestions with VIX-based actions, explanations, and notes about asset sensitivity levels.
 */
export async function fetchAssetSuggestionsMarketVolatilityBased() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/suggestions/fetch-asset-suggestions-market-volatility-based`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching asset suggestions market volatility based: ${response.status}`);
    }

    const data = await response.json();
    return data;
}
