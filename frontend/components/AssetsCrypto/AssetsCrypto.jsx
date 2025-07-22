"use client";

import React, { useState, useEffect } from "react";
import styles from "./Assets.module.css";
//import AssetCard from "../AssetCard/AssetCard";
import AssetCardCrypto from "../AssetCardCrypto/AssetCard";
import { H2, Subtitle, Body, H3 } from "@leafygreen-ui/typography";
import InfoWizard from "../InfoWizard/InfoWizard";
import {
    // Crypto Data
    cryptoFetchAssetsClosePrice,
    cryptoFetchRecentAssetsData,
    // Portfolio Allocation
    fetchPortfolioAllocation,
    // Reports
    fetchMostRecentCryptoAnalysisReport,
    fetchMostRecentCryptoNewsReport,
    fetchMostRecentCryptoSocialMediaReport,
    // Suggestions
    fetchCryptoSuggestionsTrendBased,
    fetchCryptoSuggestionsMomentumBased,
    fetchCryptoSuggestionsComprehensive,
    fetchChartMappings
} from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";

import cryptoSuggestionsData from "/public/data/fetch-crypto-suggestions-comprehensive.json";
import reportsCrypto from "/public/data/reports_crypto_news.json";
import reportsCryptoSM from "/public/data/reports_crypto_sm.json";

export default function AssetsCrypto() {
    const [assets, setAssets] = useState([]);
    //const [marketNewsReport, setMarketNewsReport] = useState(null);
    const [chartMappings, setChartMappings] = useState({});
    const [rawMacroIndicators, setRawMacroIndicators] = useState(null);

    useEffect(() => {

        const portfolioAllocations = reportsCrypto.portfolio_allocation;

        const formattedAssets = cryptoSuggestionsData.crypto_suggestions.map((item) => {

            // Portfolio Allocation
            const allocationEntry = portfolioAllocations.find(
                entry => entry.asset === item.asset
            );

            // News sentiment score
            const sentimentEntry = (reportsCrypto?.report?.asset_news_sentiments || []).find(
                entry => entry.asset.toUpperCase() === item.asset.toUpperCase()
            );

            const finalSentimentScore = sentimentEntry?.final_sentiment_score ?? 0;

            const sentimentCategory =
                finalSentimentScore >= 0.6 ? "Positive" :
                    finalSentimentScore >= 0.4 ? "Neutral" :
                        "Negative";

            // News posts
            const assetNews = (reportsCrypto?.report?.asset_news || []).filter(
                entry => entry.asset.toUpperCase() === item.asset.toUpperCase()
            ).map(({ headline, description, source, posted, link, sentiment_score }) => ({
                headline,
                description,
                source,
                posted,
                link,
                sentiment_score
            }));

            // Social sentiment score
            const socialSentimentEntry = (reportsCryptoSM?.report?.asset_sm_sentiments || []).find(
                entry => entry.asset.toUpperCase() === item.asset.toUpperCase()
            );
            const socialSentimentScore = socialSentimentEntry?.final_sentiment_score ?? 0;

            // Reddit posts + comments
            const redditPosts = (reportsCryptoSM?.report?.asset_subreddits || []).filter(
                post => post.asset.toUpperCase() === item.asset.toUpperCase()
            );

            return {
                symbol: item.asset,
                allocation: {
                    description: item.description,
                    asset_type: item.asset_type,
                    percentage: allocationEntry?.allocation_percentage || "N/A",
                    decimal: null
                },
                sentiment: {
                    score: finalSentimentScore,
                    category: sentimentCategory,
                    originalScore: finalSentimentScore
                },
                news: assetNews,
                close: null,
                timestamp: { $date: new Date().toISOString() },
                recentData: [],
                vixSensitivity: {},
                macroIndicators: {},
                assetTrend: {},
                crypto_indicators: item.crypto_indicators || [],
                _id: { $oid: `id-${item.asset}` },
                socialSentiment: {
                    score: socialSentimentScore,
                    category: socialSentimentEntry?.sentiment_category || "Neutral"
                },
                reddit: redditPosts || [],
            };
        });

        setAssets(formattedAssets);
    }, []);

    useEffect(() => {
        async function fetchAndSetChartMappings() {
            try {
                const chartMappingsResponse = await fetchChartMappings();
                setChartMappings(chartMappingsResponse.chart_mappings);
            } catch (error) {
                console.error("Error fetching chart mappings:", error);
            }
        }

        fetchAndSetChartMappings();
    }, []);

    {/***
    useEffect(() => {
        async function fetchData() {
            try {
                // First, check for cached data and use it immediately if available
                const cachedData = localStorage.getItem('portfolioData');
                const cachedTimestamp = localStorage.getItem('portfolioDataTimestamp');
                const dataIsStale = !cachedTimestamp || (Date.now() - parseInt(cachedTimestamp)) > (6 * 60 * 60 * 1000); // 6 hours

                if (cachedData && !dataIsStale) {
                    const parsedData = JSON.parse(cachedData);
                    setAssets(parsedData.assets || []);
                    setMarketNewsReport(parsedData.marketNewsReport || null);
                    setChartMappings(parsedData.chartMappings || {});
                    setRawMacroIndicators(parsedData.rawMacroIndicators || null);

                    // Fetch updated data in the background
                    fetchFreshData(false);
                    return;
                }

                // No valid cache, fetch fresh data with loading state
                await fetchFreshData(true);
            } catch (error) {
                console.error("Error in fetch sequence:", error);
            }
        }

        async function fetchFreshData(shouldShowLoading) {
            try {
                // First batch - critical data needed for basic UI rendering
                const [assetsClosePrice, allocationResponse, rawMacroIndicatorsResponse, chartMappingsResponse] = await Promise.all([
                    marketFetchAssetsClosePrice(),
                    fetchPortfolioAllocation(),
                    fetchMostRecentMacroIndicators(),
                    fetchChartMappings()
                ]);

                // Store critical data
                setRawMacroIndicators(rawMacroIndicatorsResponse);
                setChartMappings(chartMappingsResponse.chart_mappings);

                // Create basic asset data for initial render
                if (shouldShowLoading) {
                    const basicAssets = Object.entries(assetsClosePrice.assets_close_price)
                        .map(([symbol, data]) => {
                            const allocation = allocationResponse.portfolio_allocation[symbol];
                            return {
                                symbol,
                                close: parseFloat(data.close_price.toFixed(2)),
                                timestamp: {
                                    $date: new Date(data.timestamp).toISOString()
                                },
                                allocation: allocation ? {
                                    percentage: allocation.allocation_percentage,
                                    decimal: allocation.allocation_decimal,
                                    description: allocation.description,
                                    asset_type: allocation.asset_type
                                } : null,
                                sentiment: {
                                    score: 0.5,
                                    category: "Neutral",
                                    originalScore: 0.5
                                },
                                news: [],
                                recentData: [],
                                vixSensitivity: {
                                    sensitivity: "NEUTRAL",
                                    action: "KEEP",
                                    explanation: "Loading data...",
                                    marketData: { fluctuation: "Loading...", diagnosis: "Loading..." }
                                },
                                macroIndicators: {
                                    gdp: { action: "KEEP", explanation: "Loading data...", marketData: { fluctuation: "Loading...", diagnosis: "Loading..." } },
                                    interestRate: { action: "KEEP", explanation: "Loading data...", marketData: { fluctuation: "Loading...", diagnosis: "Loading..." } },
                                    unemployment: { action: "KEEP", explanation: "Loading data...", marketData: { fluctuation: "Loading...", diagnosis: "Loading..." } }
                                },
                                assetTrend: { fluctuation: "Loading...", diagnosis: "Loading...", trend: "neutral" },
                                _id: { $oid: `id-${symbol}` }
                            };
                        })
                        .filter(asset => asset.symbol !== "VIX");

                    // Sort assets by asset_type first, then alphabetically by symbol
                    basicAssets.sort((a, b) => {
                        // First compare by asset_type
                        const typeA = a.allocation?.asset_type || 'Unknown';
                        const typeB = b.allocation?.asset_type || 'Unknown';

                        const typeComparison = typeA.localeCompare(typeB);

                        // If asset types are different, return the type comparison result
                        if (typeComparison !== 0) {
                            return typeComparison;
                        }

                        // If asset types are the same, sort alphabetically by symbol
                        return a.symbol.localeCompare(b.symbol);
                    });
                    setAssets(basicAssets);
                }

                // Second batch - fetch remaining data in the background
                const [newsReportResponse, recentAssetsData, vixSensitivityData,
                    macroIndicatorsData, marketAnalysisReport] = await Promise.all([
                        fetchMostRecentMarketNewsReport(),
                        marketFetchRecentAssetsData(),
                        fetchAssetSuggestionsMarketVolatilityBased(),
                        fetchAssetSuggestionsMacroIndicatorsBased(),
                        fetchMostRecentMarketAnalysisReport(),
                    ]);

                // Store news report data
                setMarketNewsReport(newsReportResponse.market_news_report);

                // Get market analysis report macro indicators
                const marketMacroIndicators = marketAnalysisReport.market_analysis_report.report.macro_indicators;
                const gdpMarketIndicator = marketMacroIndicators.find(item => item.macro_indicator === "GDP");
                const interestRateMarketIndicator = marketMacroIndicators.find(item => item.macro_indicator === "Effective Interest Rate");
                const unemploymentMarketIndicator = marketMacroIndicators.find(item => item.macro_indicator === "Unemployment Rate");

                // Get market volatility index data
                const marketVolatilityIndex = marketAnalysisReport.market_analysis_report.report.market_volatility_index;

                // Function to normalize sentiment score based on category
                const normalizeSentimentScore = (category, originalScore) => {
                    // Define the ranges for each category
                    const ranges = {
                        "Positive": { min: 0.6, max: 1.0 },
                        "Neutral": { min: 0.4, max: 0.6 },
                        "Negative": { min: 0.0, max: 0.4 }
                    };

                    // Get the appropriate range based on category
                    const range = ranges[category] || ranges["Neutral"];

                    // Generate a normalized score within the appropriate range
                    // This ensures the score aligns with the category regardless of original value
                    const rangeSize = range.max - range.min;
                    const normalizedScore = range.min + (Math.random() * rangeSize);

                    return parseFloat(normalizedScore.toFixed(2));
                };

                // Transform the asset price data with all details
                const transformedAssets = Object.entries(assetsClosePrice.assets_close_price)
                    .map(([symbol, data]) => {
                        // Get allocation data for this asset
                        const allocation = allocationResponse.portfolio_allocation[symbol];

                        // Get sentiment data for this asset from the news report
                        const sentimentData = newsReportResponse.market_news_report.report.asset_news_summary
                            .find(item => item.asset === symbol);

                        // Get news headlines for this asset
                        const assetNews = newsReportResponse.market_news_report.report.asset_news
                            .filter(news => news.asset === symbol);

                        // Get sentiment category and normalize the score to match the category
                        const sentimentCategory = sentimentData ? sentimentData.overall_sentiment_category : "Neutral";
                        const originalScore = sentimentData ? sentimentData.overall_sentiment_score : 0.5;
                        const normalizedScore = normalizeSentimentScore(sentimentCategory, originalScore);

                        // Get recent price data for this asset
                        const recentData = recentAssetsData.assets_data[symbol] || [];

                        // Get VIX sensitivity data for this asset
                        const vixData = vixSensitivityData.asset_suggestions
                            .find(item => item.asset === symbol);

                        // Extract VIX sensitivity info if available
                        const vixInfo = vixData?.macro_indicators?.find(indicator => indicator.indicator === "VIX");

                        // Get macro indicators data for this asset
                        const macroData = macroIndicatorsData.asset_suggestions
                            .find(item => item.asset === symbol);

                        // Extract specific macro indicators
                        const gdpInfo = macroData?.macro_indicators?.find(indicator => indicator.indicator === "GDP");
                        const interestRateInfo = macroData?.macro_indicators?.find(indicator => indicator.indicator === "Effective Interest Rate");
                        const unemploymentInfo = macroData?.macro_indicators?.find(indicator => indicator.indicator === "Unemployment Rate");

                        // Get asset trend (MA50) data from the market analysis report
                        const assetTrend = marketAnalysisReport.market_analysis_report.report.asset_trends
                            .find(item => item.asset === symbol);

                        return {
                            symbol,
                            close: parseFloat(data.close_price.toFixed(2)), // Round to 2 decimals
                            timestamp: {
                                $date: new Date(data.timestamp).toISOString()
                            },
                            // Include allocation data if available
                            allocation: allocation ? {
                                percentage: allocation.allocation_percentage,
                                decimal: allocation.allocation_decimal,
                                description: allocation.description,
                                asset_type: allocation.asset_type
                            } : null,
                            // Include normalized sentiment data
                            sentiment: {
                                score: normalizedScore,
                                category: sentimentCategory,
                                originalScore: originalScore // Keep original for reference
                            },
                            // Include news data
                            news: assetNews || [],
                            // Include recent price data
                            recentData: recentData,
                            // Include VIX sensitivity data
                            vixSensitivity: vixInfo ? {
                                sensitivity: vixInfo.sensitivity || "NEUTRAL",
                                action: vixInfo.action || "KEEP",
                                explanation: vixInfo.explanation || "",
                                note: vixInfo.note || "",
                                // Add market volatility index data
                                marketData: {
                                    fluctuation: marketVolatilityIndex.fluctuation_answer,
                                    diagnosis: marketVolatilityIndex.diagnosis
                                }
                            } : {
                                sensitivity: "NEUTRAL",
                                action: "KEEP",
                                explanation: "No VIX sensitivity data available.",
                                note: "",
                                marketData: {
                                    fluctuation: marketVolatilityIndex.fluctuation_answer,
                                    diagnosis: marketVolatilityIndex.diagnosis
                                }
                            },
                            // Include macro indicators data
                            macroIndicators: {
                                gdp: gdpInfo ? {
                                    action: gdpInfo.action || "KEEP",
                                    explanation: gdpInfo.explanation || "",
                                    note: gdpInfo.note || "",
                                    // Add market GDP data
                                    marketData: {
                                        fluctuation: gdpMarketIndicator.fluctuation_answer,
                                        diagnosis: gdpMarketIndicator.diagnosis
                                    }
                                } : {
                                    action: "KEEP",
                                    explanation: "No GDP data available.",
                                    note: "",
                                    marketData: {
                                        fluctuation: gdpMarketIndicator.fluctuation_answer,
                                        diagnosis: gdpMarketIndicator.diagnosis
                                    }
                                },
                                interestRate: interestRateInfo ? {
                                    action: interestRateInfo.action || "KEEP",
                                    explanation: interestRateInfo.explanation || "",
                                    note: interestRateInfo.note || "",
                                    // Add market interest rate data
                                    marketData: {
                                        fluctuation: interestRateMarketIndicator.fluctuation_answer,
                                        diagnosis: interestRateMarketIndicator.diagnosis
                                    }
                                } : {
                                    action: "KEEP",
                                    explanation: "No Interest Rate data available.",
                                    note: "",
                                    marketData: {
                                        fluctuation: interestRateMarketIndicator.fluctuation_answer,
                                        diagnosis: interestRateMarketIndicator.diagnosis
                                    }
                                },
                                unemployment: unemploymentInfo ? {
                                    action: unemploymentInfo.action || "KEEP",
                                    explanation: unemploymentInfo.explanation || "",
                                    note: unemploymentInfo.note || "",
                                    // Add market unemployment data
                                    marketData: {
                                        fluctuation: unemploymentMarketIndicator.fluctuation_answer,
                                        diagnosis: unemploymentMarketIndicator.diagnosis
                                    }
                                } : {
                                    action: "KEEP",
                                    explanation: "No Unemployment Rate data available.",
                                    note: "",
                                    marketData: {
                                        fluctuation: unemploymentMarketIndicator.fluctuation_answer,
                                        diagnosis: unemploymentMarketIndicator.diagnosis
                                    }
                                }
                            },
                            // Include asset trend data
                            assetTrend: assetTrend ? {
                                fluctuation: assetTrend.fluctuation_answer,
                                diagnosis: assetTrend.diagnosis,
                                trend: assetTrend.diagnosis.includes("uptrend") ? "uptrend" : "downtrend"
                            } : {
                                fluctuation: `No trend data available for ${symbol}.`,
                                diagnosis: "No diagnosis available.",
                                trend: "neutral"
                            },
                            _id: {
                                $oid: `id-${symbol}`
                            }
                        };
                    })
                    // Filter out VIX from the assets list as it's not an actual investable asset
                    .filter(asset => asset.symbol !== "VIX");

                // Sort transformed assets by asset_type first, then alphabetically by symbol
                transformedAssets.sort((a, b) => {
                    // First compare by asset_type
                    const typeA = a.allocation?.asset_type || 'Unknown';
                    const typeB = b.allocation?.asset_type || 'Unknown';

                    const typeComparison = typeA.localeCompare(typeB);

                    // If asset types are different, return the type comparison result
                    if (typeComparison !== 0) {
                        return typeComparison;
                    }

                    // If asset types are the same, sort alphabetically by symbol
                    return a.symbol.localeCompare(b.symbol);
                });

                // Update state with complete data
                setAssets(transformedAssets);

                // Save to cache for future visits
                try {
                    localStorage.setItem('portfolioData', JSON.stringify({
                        assets: transformedAssets,
                        marketNewsReport: newsReportResponse.market_news_report,
                        chartMappings: chartMappingsResponse.chart_mappings,
                        rawMacroIndicators: rawMacroIndicatorsResponse
                    }));
                    localStorage.setItem('portfolioDataTimestamp', Date.now().toString());
                } catch (storageError) {
                    console.warn("Could not save to localStorage:", storageError);
                    // Continue without caching if localStorage fails
                }
            } catch (error) {
                console.error("Error fetching fresh data:", error);
            }
        }

        fetchData();
    }, []);

     */}



    const [openHelpModal, setOpenHelpModal] = useState(false);

    const LoadingSkeleton = () => {
        return Array(4).fill(0).map((_, index) => (
            <div key={index} className={styles.skeletonCard}>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
            </div>
        ));
    };

    const LazyAssetCards = React.memo(({ assets, chartMappings, rawMacroIndicators }) => {
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
            // Delay loading remaining cards to prioritize initial render
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 200);

            return () => clearTimeout(timer);
        }, []);

        if (!isVisible) {
            return <div className={styles.loadingMore}>Loading more assets...</div>;
        }

        return assets.map((asset, index) => (
            <AssetCardCrypto
                key={`lazy-${asset.symbol}-${index}`}
                asset={asset}
                chartData={chartMappings[asset.symbol]}
                rawMacroIndicators={rawMacroIndicators}
            />
        ));
    });

    return (
        <div className={styles.container}>
            <div className={styles.assetsHeader}>
                <H3>Crypto Assets</H3>

                <InfoWizard
                    open={openHelpModal}
                    setOpen={setOpenHelpModal}
                    tooltipText="Tell me more!"
                    iconGlyph="Wizard"
                    sections={[
                        {
                            heading: "Instructions and Talk Track",
                            content: [
                                {
                                    heading: "Agentic-AI Powered Investment Portfolio",
                                    body:
                                        "Handling the variety of data types that come from diverse and complex sources can be quite challenging in investment portfolio management. In this demo, you'll see how agentic AI, combined with MongoDB, provides portfolio managers with advanced tools that provide insights tailored to specific financial objectives and risk tolerances.",
                                },
                                {
                                    heading: "How to Demo",
                                    body: "Explore the actions from the investment portfolio by clicking on the different icons:"
                                },
                                {
                                    image: {
                                        src: "./images/actions.png",
                                        alt: "Actions",
                                        width: 150,
                                    },
                                },
                                {
                                    body:

                                        `<div>
                                        <ul>
                                            <li><strong>Candle Stick Chart:</strong> Visualize the price movements of an asset over various timeframes, such as the past day, week, or six months.</li>
                                            <li><strong>Insights:</strong> Explore a comprehensive report and explore information like Price vs. 50-Day Moving Average, and more.</li>
                                            <li><strong>News Headlines:</strong> Read news about the asset and uncover the factors influencing the sentiment score.</li>
                                            <li><strong>Document Model:</strong> Observe how the document model progresses from data ingestion to insight generation.</li>
                    
                                        </ul>
                                    </div>`,
                                    isHTML: true
                                },
                            ],
                        },
                        {
                            heading: "Behind the Scenes",
                            content: [
                                {
                                    heading: "High-level Architecture",
                                },
                                {
                                    image: {
                                        src: "./images/chatbotPortfolio_info.png",
                                        alt: "Architecture",
                                    },
                                },
                                {
                                    body:
                                        `<div>
                                        <p>
                                            <br>
                                            This solution is divided into three core services: 
                                                <ol>
                                                    <li>Capital Markets Loaders Service</li>
                                                    <li>Capital Markets Agents Service</li>
                                                    <li>Market Assistant ReAct Agent Chatbot</li>
                                                </ol>
                                        </p>
                                        <p>
                                            This section of the demo focuses on the first two:
                                            <br>
                                                <br><strong>1. Capital Markets Loaders Service</strong> 
                                            <br>
                                            This service is in charge of extracting, transforming, and loading data from these three sources into MongoDB Atlas for further analysis:
                                            <ul>
                                                <li><strong>Yahoo Finance Market Data</strong> - updated weekly from Tue to Sat at 4 am UTC.</li> 
                                                <li><strong>FRED API Macroeconomic Data</strong> - updated daily at 4:05 am UTC.</li>
                                                <li><strong>Financial news from a web scraping process</strong> - one time only, it is a fixed dataset.</li>
                                                <li><strong>Portfolio performance (emulation)</strong> - updated daily at 4:10 am UTC.</li>
                                            </ul>
                                            <p>
                                                <strong>2. Capital Markets Agents Service </strong>
                                                <br> 
                                                After the data is stored into MongoDB, two scheduled agents perform a series of operations to analyze the data and generate insights and store the reports into MongoDB Atlas: 
                                                <ul>
                                                    <li><strong>Market Analysis Agent</strong>: Analyzes asset trends, macroeconomic indicators, and market volatility to generate portfolio insights and recommendations. Executed on daily basis at 5 am UTC.</li>
                                                    <li><strong>Market News Agent</strong>: Processes financial news, performs sentiment analysis, and produces summarized market news intelligence. Executed on daily basis at 5:10 am UTC.</li> 
                                                </ul>
                                                <br>
                                            </p>
                                        </p>
                                    </div>`,
                                    isHTML: true,
                                },
                                {
                                    body:
                                        `<div>
                                        
                                    </div>`,
                                    isHTML: true,
                                },
                                {
                                    heading: "MongoDB Stack",
                                    body: [
                                        "Time Series collections",
                                        "Atlas Charts",
                                        "Atlas Vector Search",
                                    ],
                                },
                            ],
                        },
                        {
                            heading: "Why MongoDB?",
                            content: [
                                {
                                    heading: "Flexibility",
                                    body: "MongoDB’s flexible document model unifies structured (macroeconomic indicators and market data) and unstructured data (financial news) into a single data platform that integrates with agentic AI not only to understand and respond to complex queries, but also generate valuable insights for enhanced portfolio management.",
                                },
                                {
                                    heading: "Time Series collections",
                                    body: "MongoDB allows the storage of time series collections, efficiently ingesting large volumes of data. This enables AI agents to process and analyze sequential interactions, learn patterns, and state changes over time."
                                },
                                {
                                    heading: "Vector Search",
                                    body: "Atlas Vector Search empowers the chatbot to efficiently store and query high-dimensional embeddings, enabling it to deliver contextually accurate and relevant responses. Making AI-driven interactions within the Leafy Bank ecosystem both fast and reliable."
                                },
                                {
                                    heading: "Atlas Charts",
                                    body: "MongoDB Atlas Charts provides an intuitive and dynamic way to visualize real-time application data, directly accessing collections to streamline analytic workflows. This feature enables users to effectively visualize metrics such as portfolio performance over the last month, asset distribution, and candlestick charts for each asset, allowing for a comprehensive interpretation of price movements."
                                },
                                {
                                    heading: "Integration with Agentic AI",
                                    body: "The integration of agentic AI with MongoDB enhances portfolio management by leveraging AI-driven insights to analyze and predict market trends, optimize asset allocations, and facilitate real-time data-driven investment decisions, all powered by efficient data storage and retrieval capabilities."
                                },
                            ],
                        },
                    ]}
                />
            </div>

            <div className={styles.headerRow}>
                <span>SYMBOL</span>
                <span>ASSET NAME</span>
                <span>CLOSE PRICE ($)</span>
                <span>ALLOCATION</span>
                <span>NEWS SENTIMENT SCORE</span>
                <span>SOCIAL SENTIMENT SCORE</span>
                <span>VIX SENSITIVITY</span>
                <span>ACTIONS</span>
            </div>

            {assets.length > 0 ? (
                <>
                    {/* Load first 4 assets immediately */}
                    {assets.slice(0, 4).map((asset, index) => (
                        <AssetCardCrypto
                            key={`primary-${asset.symbol}-${index}`}
                            asset={asset}
                            chartData={chartMappings[asset.symbol]}
                            rawMacroIndicators={rawMacroIndicators}
                        />
                    ))}

                    {/* Load remaining assets with a slight delay */}
                    {assets.length > 4 && (
                        <LazyAssetCards
                            assets={assets.slice(4)}
                            chartMappings={chartMappings}
                            rawMacroIndicators={rawMacroIndicators}
                        />
                    )}
                </>
            ) : (
                <LoadingSkeleton />
            )}
        </div>
    );
}