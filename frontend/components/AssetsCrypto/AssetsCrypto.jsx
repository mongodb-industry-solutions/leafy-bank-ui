"use client";

import React, { useState, useEffect } from "react";
import styles from "./AssetsCrypto.module.css";
import AssetCardCrypto from "../AssetCardCrypto/AssetCard";
import { H3 } from "@leafygreen-ui/typography";
import InfoWizard from "../InfoWizard/InfoWizard";
import {
    // Crypto Data
    cryptoFetchAssetsClosePrice,
    cryptoFetchRecentAssetsData,
    // Portfolio Allocation
    fetchCryptoPortfolioAllocation,
    // Reports
    fetchMostRecentCryptoAnalysisReport,
    fetchMostRecentCryptoNewsReport,
    fetchMostRecentCryptoSocialMediaReport,
    // Suggestions
    fetchCryptoSuggestionsComprehensive,
    fetchChartMappings
} from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";

export default function AssetsCrypto() {
    const [assets, setAssets] = useState([]);
    const [chartMappings, setChartMappings] = useState({});

    useEffect(() => {
        async function loadCryptoData() {
            try {
                // First batch - get basic data
                const [
                    cryptoSuggestionsResponse,
                    cryptoAllocationResponse, 
                    cryptoPricesResponse,
                    cryptoRecentDataResponse,
                    chartMappingsResponse
                ] = await Promise.all([
                    fetchCryptoSuggestionsComprehensive(),
                    fetchCryptoPortfolioAllocation(),
                    cryptoFetchAssetsClosePrice(),
                    cryptoFetchRecentAssetsData(),
                    fetchChartMappings()
                ]);

                const cryptoSuggestionsData = cryptoSuggestionsResponse;
                const portfolioAllocations = cryptoAllocationResponse?.crypto_portfolio_allocation || {};
                const cryptoPrices = cryptoPricesResponse?.assets_close_price || {};
                const cryptoRecentData = cryptoRecentDataResponse?.assets_data || {};
                
                setChartMappings(chartMappingsResponse?.chart_mappings || {});

                // Create basic asset data and set immediately
                const basicAssets = cryptoSuggestionsData.crypto_suggestions.map((item) => {
                    const allocationEntry = portfolioAllocations[item.asset];

                    const priceData = cryptoPrices[item.asset];
                    const recentData = cryptoRecentData[item.asset] || [];

                    // Get RSI data for this asset to replace VIX sensitivity
                    const rsiIndicator = item.crypto_indicators?.find(
                        indicator => indicator.indicator === "RSI Analysis"
                    );

                    // Get Volume Analysis indicator
                    const volumeIndicator = item.crypto_indicators?.find(
                        indicator => indicator.indicator === "Volume Analysis"
                    );

                    // Get VWAP Analysis indicator
                    const vwapIndicator = item.crypto_indicators?.find(
                        indicator => indicator.indicator === "VWAP Analysis"
                    );

                    return {
                        symbol: item.asset,
                        allocation: {
                            description: allocationEntry?.description || item.description,
                            asset_type: allocationEntry?.asset_type || item.asset_type,
                            percentage: allocationEntry?.allocation_percentage || "N/A",
                            decimal: allocationEntry?.allocation_decimal || null
                        },
                        close: priceData ? parseFloat(priceData.close_price.toFixed(2)) : null,
                        timestamp: priceData ? { $date: new Date(priceData.timestamp).toISOString() } : { $date: new Date().toISOString() },
                        sentiment: {
                            score: 0.5,
                            category: "Neutral",
                            originalScore: 0.5
                        },
                        news: [],
                        socialSentiment: {
                            score: 0.5,
                            category: "Neutral"
                        },
                        reddit: [],
                        recentData: recentData,
                        // Replace VIX sensitivity with RSI analysis
                        rsiAnalysis: rsiIndicator ? {
                            rsi_value: rsiIndicator.rsi_value,
                            interpretation: rsiIndicator.interpretation,
                            diagnosis: rsiIndicator.diagnosis,
                            suggestion: rsiIndicator.suggestion,
                            action: rsiIndicator.action
                        } : null,
                        // Add Volume Analysis
                        volumeAnalysis: volumeIndicator ? {
                            volume_ratio: volumeIndicator.volume_ratio,
                            interpretation: volumeIndicator.interpretation,
                            diagnosis: volumeIndicator.diagnosis,
                            suggestion: volumeIndicator.suggestion,
                            action: volumeIndicator.action
                        } : null,
                        // Add VWAP Analysis
                        vwapAnalysis: vwapIndicator ? {
                            vwap_position: vwapIndicator.vwap_position,
                            interpretation: vwapIndicator.interpretation,
                            diagnosis: vwapIndicator.diagnosis,
                            suggestion: vwapIndicator.suggestion,
                            action: vwapIndicator.action
                        } : null,
                        macroIndicators: {},
                        assetTrend: {},
                        crypto_indicators: item.crypto_indicators || [],
                        _id: { $oid: `id-${item.asset}` }
                    };
                });

                // Set basic assets immediately to stop skeleton loading
                setAssets(basicAssets);

                // Second batch - get detailed data
                const [
                    cryptoAnalysisResponse,
                    cryptoNewsResponse,
                    cryptoSocialMediaResponse
                ] = await Promise.all([
                    fetchMostRecentCryptoAnalysisReport(),
                    fetchMostRecentCryptoNewsReport(),
                    fetchMostRecentCryptoSocialMediaReport()
                ]);

                const CryptoAnalysisReport = cryptoAnalysisResponse?.crypto_analysis_report;
                const CryptoNewsReport = cryptoNewsResponse?.crypto_news_report;
                const CryptoSocialMediaReport = cryptoSocialMediaResponse?.crypto_sm_report;

                // Update assets with detailed data
                const detailedAssets = basicAssets.map((basicAsset) => {
                    // Find the original item for this asset
                    const originalItem = cryptoSuggestionsData.crypto_suggestions.find(
                        item => item.asset === basicAsset.symbol
                    );

                    // News sentiment score
                    const sentimentEntry = (CryptoNewsReport?.report?.asset_news_sentiments || []).find(
                        entry => entry.asset.toUpperCase() === basicAsset.symbol.toUpperCase()
                    );

                    const finalSentimentScore = sentimentEntry?.final_sentiment_score ?? 0.5;
                    const sentimentCategory =
                        finalSentimentScore >= 0.6 ? "Positive" :
                            finalSentimentScore >= 0.4 ? "Neutral" :
                                "Negative";

                    // News posts
                    const assetNews = (CryptoNewsReport?.report?.asset_news || []).filter(
                        entry => entry.asset.toUpperCase() === basicAsset.symbol.toUpperCase()
                    ).map(({ headline, description, source, posted, link, sentiment_score }) => ({
                        headline,
                        description,
                        source,
                        posted,
                        link,
                        sentiment_score
                    }));

                    // Social sentiment score
                    const socialSentimentEntry = (CryptoSocialMediaReport?.report?.asset_sm_sentiments || []).find(
                        entry => entry.asset.toUpperCase() === basicAsset.symbol.toUpperCase()
                    );
                    const socialSentimentScore = socialSentimentEntry?.final_sentiment_score ?? 0.5;

                    // Reddit posts + comments
                    const redditPosts = (CryptoSocialMediaReport?.report?.asset_subreddits || []).filter(
                        post => post.asset.toUpperCase() === basicAsset.symbol.toUpperCase()
                    );

                    // Get crypto analysis data from analysis report
                    const analysisData = (CryptoAnalysisReport?.report?.crypto_trends || []).find(
                        entry => entry.asset.toUpperCase() === basicAsset.symbol.toUpperCase()
                    );

                    // Get momentum indicators from analysis report
                    const momentumData = (CryptoAnalysisReport?.report?.crypto_momentum_indicators || []).find(
                        entry => entry.asset.toUpperCase() === basicAsset.symbol.toUpperCase()
                    );

                    // Extract individual momentum indicators
                    const rsiIndicatorFromReport = momentumData?.momentum_indicators?.find(ind => ind.indicator_name === "RSI");
                    const volumeIndicatorFromReport = momentumData?.momentum_indicators?.find(ind => ind.indicator_name === "Volume");
                    const vwapIndicatorFromReport = momentumData?.momentum_indicators?.find(ind => ind.indicator_name === "VWAP");

                    return {
                        ...basicAsset,
                        sentiment: {
                            score: finalSentimentScore,
                            category: sentimentCategory,
                            originalScore: finalSentimentScore
                        },
                        news: assetNews,
                        socialSentiment: {
                            score: socialSentimentScore,
                            category: socialSentimentEntry?.sentiment_category || "Neutral"
                        },
                        reddit: redditPosts || [],
                        // Add analysis data from crypto analysis report
                        analysisData: analysisData ? {
                            fluctuation_answer: analysisData.fluctuation_answer,
                            diagnosis: analysisData.diagnosis,
                            trend: analysisData.diagnosis
                        } : null,
                        // Override with more accurate momentum indicators from analysis report
                        momentumIndicators: {
                            rsi: rsiIndicatorFromReport ? {
                                value: parseFloat(rsiIndicatorFromReport.fluctuation_answer.match(/(\d+\.?\d*)/)?.[1] || "0"),
                                diagnosis: rsiIndicatorFromReport.diagnosis,
                                fluctuation_answer: rsiIndicatorFromReport.fluctuation_answer
                            } : null,
                            volume: volumeIndicatorFromReport ? {
                                ratio: parseFloat(volumeIndicatorFromReport.diagnosis.match(/\((\d+\.?\d*)x\s+average\)/)?.[1] || "0"),
                                diagnosis: volumeIndicatorFromReport.diagnosis,
                                fluctuation_answer: volumeIndicatorFromReport.fluctuation_answer
                            } : null,
                            vwap: vwapIndicatorFromReport ? {
                                percentage: parseFloat(vwapIndicatorFromReport.diagnosis.match(/\(([+-]?\d+\.?\d*)%\)/)?.[1] || "0"),
                                diagnosis: vwapIndicatorFromReport.diagnosis,
                                fluctuation_answer: vwapIndicatorFromReport.fluctuation_answer
                            } : null
                        }
                    };
                });

                setAssets(detailedAssets);

            } catch (error) {
                console.error("Error fetching crypto data:", error);
            }
        }

        loadCryptoData();
    }, []);

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
                                    body: "MongoDB's flexible document model unifies structured (macroeconomic indicators and market data) and unstructured data (financial news) into a single data platform that integrates with agentic AI not only to understand and respond to complex queries, but also generate valuable insights for enhanced portfolio management.",
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
                <span>RSI ANALYSIS</span>
                <span>VOLUME ANALYSIS</span>
                <span>VWAP ANALYSIS</span>
                <span>ACTIONS</span>
            </div>

            {assets.length > 0 ? (
                assets.map((asset, index) => (
                    <AssetCardCrypto
                        key={`${asset.symbol}-${index}`}
                        asset={asset}
                        chartData={chartMappings[asset.symbol]}
                    />
                ))
            ) : (
                <LoadingSkeleton />
            )}
        </div>
    );
}
