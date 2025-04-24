"use client";

import React, { useState, useEffect } from "react";
import styles from "./Assets.module.css";
import AssetCard from "../AssetCard/AssetCard";
import { H2, Subtitle, Body } from "@leafygreen-ui/typography";
import InfoWizard from "../InfoWizard/InfoWizard";
import { 
    marketFetchAssetsClosePrice, 
    marketFetchRecentAssetsData, 
    fetchPortfolioAllocation, 
    fetchMostRecentMarketAnalysisReport,
    fetchMostRecentMarketNewsReport,
    fetchAssetSuggestionsMarketVolatilityBased,
    fetchAssetSuggestionsMacroIndicatorsBased,
    fetchChartMappings
} from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";


export default function Assets() {
    const [assets, setAssets] = useState([]);
    const [marketNewsReport, setMarketNewsReport] = useState(null);
    const [chartMappings, setChartMappings] = useState({});

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch asset prices, portfolio allocation, market reports, recent asset data, VIX sensitivity, and macro indicators
                const [assetsClosePrice, allocationResponse, newsReportResponse, recentAssetsData, vixSensitivityData, macroIndicatorsData, marketAnalysisReport, chartMappingsResponse] = await Promise.all([
                    marketFetchAssetsClosePrice(),
                    fetchPortfolioAllocation(),
                    fetchMostRecentMarketNewsReport(),
                    marketFetchRecentAssetsData(),
                    fetchAssetSuggestionsMarketVolatilityBased(),
                    fetchAssetSuggestionsMacroIndicatorsBased(),
                    fetchMostRecentMarketAnalysisReport(),
                    fetchChartMappings()
                ]);
                
                // Store the chart mappings
                setChartMappings(chartMappingsResponse.chart_mappings);
                
                // Store the market news report
                setMarketNewsReport(newsReportResponse.market_news_report);
                
                // Get market analysis report macro indicators
                const marketMacroIndicators = marketAnalysisReport.market_analysis_report.report.macro_indicators;
                const gdpMarketIndicator = marketMacroIndicators.find(item => item.macro_indicator === "GDP");
                const interestRateMarketIndicator = marketMacroIndicators.find(item => item.macro_indicator === "Interest Rate");
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
                
                // Transform the asset price data
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
                        const interestRateInfo = macroData?.macro_indicators?.find(indicator => indicator.indicator === "Interest Rate");
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
                
                // Sort assets alphabetically by symbol
                transformedAssets.sort((a, b) => a.symbol.localeCompare(b.symbol));
                
                setAssets(transformedAssets);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
        
        fetchData();
    }, []);

    const [openHelpModal, setOpenHelpModal] = useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.assetsHeader}>
                <H2>Investment Portfolio</H2>

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
                                    heading: "WIP",
                                    body: "WIP",
                                },
                                {
                                    heading: "How to Demo",
                                    body: [
                                        "WIP",

                                    ],
                                },
                            ],
                        },
                        {
                            heading: "Behind the Scenes",
                            content: [
                                {
                                    heading: "Data Flow",
                                    body: "",
                                },
                                {
                                    image: {
                                        src: "./images/OF_info.png",
                                        alt: "Architecture",
                                    },
                                },
                            ],
                        },
                        {
                            heading: "Why MongoDB?",
                            content: [
                                {
                                    heading: "Flexibility",
                                    body: "MongoDB shines in its flexibility—serving as a central data storage solution for retrieving data from external financial institutions while seamlessly supporting diverse formats and structures.",
                                },
                            ],
                        },
                    ]}
                />
            </div>

            <div className={styles.headerRow}>
                <span>ASSET</span>
                <span>CLOSE PRICE ($)</span>
                <span>PORTFOLIO ALLOCATION</span>
                <span>NEW SENTIMENT SCORE</span>
                <span>VIX SENSITIVITY</span>
                <span>GROSS DOMESTIC PRODUCT</span>
                <span>INTEREST RATE</span>
                <span>UNEMPLOYMENT</span>
                <span>ACTIONS</span>
            </div>

            {assets.length > 0 ? (
                assets.map((asset, index) => (
                    <AssetCard 
                        key={index} 
                        asset={asset} 
                        chartData={chartMappings[asset.symbol]} 
                    />
                ))
            ) : (
                <p>Loading assets...</p>
            )}

        </div>
    );
}