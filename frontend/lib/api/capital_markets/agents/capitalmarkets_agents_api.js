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
        method: "GET",
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
        method: "GET",
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
 * Crypto Data
 */

/**  
 * Fetch the latest close price for all assets.
 * @returns MessageResponse: An object containing the assets close prices.
 */
export async function cryptoFetchAssetsClosePrice() {

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/crypto/fetch-assets-close-price`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching crypto assets close price: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Fetch the most N recent data points for all assets.
 * Args: limit: Default is 3
 * @returns RecentDataResponse: An object containing the recent data points for each asset.
 */
export async function cryptoFetchRecentAssetsData() {

    // Set the limit number per asset to 3
    const limit_number = 3
    const limit = "?limit="+limit_number

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/crypto/fetch-recent-assets-data${limit}`, {
        method: "GET",
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
        method: "GET",
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
 * Fetch crypto portfolio allocation data.
 * @returns CryptoMessageResponse: An object containing the crypto portfolio allocation data.
 */
export async function fetchCryptoPortfolioAllocation() {

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/portfolio/fetch-crypto-portfolio-allocation`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching crypto portfolio allocation: ${response.status}`);
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
        method: "GET",
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
 * Get the trend direction for each macroeconomic indicator by comparing the two most recent values.
 * @returns TrendMessageResponse: Object containing trend information for each macro indicator.
 */
export async function fetchMacroIndicatorsTrend() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/macro-indicators/fetch-macro-indicators-trend`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching macro indicators trend: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Report Data
 */

/*  Market (Stocks) */

/**  
 * Fetch the most recent market analysis report.
 * @returns MarketAnalysisResponse: An object containing the most recent market analysis report.
 */
export async function fetchMostRecentMarketAnalysisReport() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/reports/fetch-most-recent-market-analysis-report`, {
        method: "GET",
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
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/reports/fetch-most-recent-market-news-report`, {
        method: "GET",
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
 * Fetch the most recent market social media report.
 * @returns MarketSocialMediaResponse: An object containing the most recent market social media report.
 */
export async function fetchMostRecentMarketSocialMediaReport() {

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/reports/fetch-most-recent-market-social-media-report`, {
        method: "GET",
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

/*  Crypto (Digital Assets) */

/**  
 * Fetch the most recent crypto analysis report.
 * @returns CryptoAnalysisResponse: An object containing the most recent crypto analysis report.
 */
export async function fetchMostRecentCryptoAnalysisReport() {

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/reports/fetch-most-recent-crypto-analysis-report`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching most recent crypto analysis report: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Fetch the most recent crypto news report.
 * @returns CryptoNewsResponse: An object containing the most recent crypto news report.
 */
export async function fetchMostRecentCryptoNewsReport() {

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/reports/fetch-most-recent-crypto-news-report`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching most recent crypto news report: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Fetch the most recent crypto social media report.
 * @returns CryptoSocialMediaResponse: An object containing the most recent crypto social media report.
 */
export async function fetchMostRecentCryptoSocialMediaReport() {

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/reports/fetch-most-recent-crypto-social-media-report`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching most recent crypto social media report: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Suggestions Data
 */

/*  Market (Stocks) */

/**  
 * Fetch asset suggestions based on the current portfolio and market conditions.
 * @returns MessageResponse: An object containing the asset suggestions with actions (KEEP or REDUCE) and optional notes about conflicting signals.
 */
export async function fetchAssetSuggestionsMacroIndicatorsBased() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/suggestions/fetch-asset-suggestions-macro-indicators-based`, {
        method: "GET",
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
        method: "GET",
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

/*  Crypto (Digital Assets) */

/**  
 * Fetch crypto asset suggestions based on detailed moving average trend analysis.
 * Returns detailed MA analysis including:
 * MA9, MA21, MA50 analysis with exact values
 * Percentage differences and trend directions
 * Overall trend assessment
 * @returns crypto_suggestions: A dictionary containing crypto asset suggestions with detailed moving average trend analysis.
 */
export async function fetchCryptoSuggestionsTrendBased() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/suggestions/fetch-crypto-suggestions-trend-based`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching crypto suggestions trend based: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Fetch crypto asset suggestions based on detailed momentum indicators analysis.
 * Returns detailed momentum analysis including:
 *    RSI values with interpretations
 *    Volume ratios vs averages
 *    VWAP positioning with percentages
 * @returns crypto_suggestions: A dictionary containing crypto asset suggestions with detailed momentum indicators analysis.
 */
export async function fetchCryptoSuggestionsMomentumBased() {

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/suggestions/fetch-crypto-suggestions-momentum-based`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching crypto suggestions momentum based: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Fetch comprehensive crypto asset suggestions with all indicator details combined.
 * Returns complete analysis with all indicators:
 *    Moving averages (MA9, MA21, MA50)
 *    Momentum indicators (RSI, Volume, VWAP)
 *    Detailed values and interpretations
 * @returns crypto_suggestions: A dictionary containing comprehensive crypto asset suggestions with all indicators.
 */
export async function fetchCryptoSuggestionsComprehensive() {

    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/suggestions/fetch-crypto-suggestions-comprehensive`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching crypto suggestions comprehensive: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Charts Data
 */

/**  
 * Fetch chart mappings from the database.
 * @returns MessageResponse: Object containing chart mappings data.
 */
export async function fetchChartMappings() {
    
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/charts/fetch-chart-mappings`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching chart mappings: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**  
 * Risk Profiles Data
 */

/**  
 * Fetch all risk profiles.
 * @returns Array: An array containing risk profile objects.
 */
export async function listRiskProfiles() {
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/risk-profiles/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    
    if (!response.ok) {
        throw new Error(`Error fetching risk profiles: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}

/**  
 * Get the currently active risk profile.
 * @returns Object: The active risk profile.
 */
export async function getActiveRiskProfile() {
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/risk-profiles/active`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    
    if (!response.ok) {
        throw new Error(`Error fetching active risk profile: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}

/**  
 * Set a specific risk profile as active.
 * @param {string} riskId - The risk profile ID to activate.
 * @returns Object: The updated active risk profile.
 */
export async function setActiveRiskProfile(riskId) {
    const response = await fetch(`${CAPITALMARKETS_AGENTS_API_URL}/risk-profiles/active`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ risk_id: riskId })
    });
    
    if (!response.ok) {
        throw new Error(`Error setting active risk profile: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}