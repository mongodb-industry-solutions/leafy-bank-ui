"use client";

import React, { useState, useEffect } from "react";
import styles from "./Assets.module.css";
import AssetCard from "../AssetCard/AssetCard";
import { H2, Subtitle, Body } from "@leafygreen-ui/typography";
import InfoWizard from "../InfoWizard/InfoWizard";
import { marketFetchAssetsClosePrice, marketFetchRecentAssetsData, fetchPortfolioAllocation } from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";


export default function Assets() {
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch both asset prices and portfolio allocation data
                const [priceResponse, allocationResponse] = await Promise.all([
                    marketFetchAssetsClosePrice(),
                    fetchPortfolioAllocation()
                ]);
                
                // Transform the asset price data
                const transformedAssets = Object.entries(priceResponse.assets_close_price)
                    .map(([symbol, data]) => {
                        // Get allocation data for this asset
                        const allocation = allocationResponse.portfolio_allocation[symbol];
                        
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
                <H2>Assets</H2>

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
                <span>GDP</span>
                <span>INT</span>
                <span>UNEM</span>
                <span>ACTIONS</span>
            </div>

            {assets.length > 0 ? (
                assets.map((asset, index) => (
                    <AssetCard key={index} asset={asset} />
                ))
            ) : (
                <p>Loading assets...</p>
            )}

        </div>
    );
}
