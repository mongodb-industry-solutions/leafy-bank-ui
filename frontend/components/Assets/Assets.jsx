"use client";

import styles from "./Assets.module.css";
import AssetCard from "../AssetCard/AssetCard";
import { H2, Subtitle, Body } from "@leafygreen-ui/typography";
import InfoWizard from "../InfoWizard/InfoWizard";
import React, { useState } from "react";


export default function Assets() {
    const spyAsset = {
        name: "SPY (S&P 500 ETF)",
        closePrice: 495.32,
        portfolioAllocation: "25%",
        sentimentScore: 0.65,
        vixSensitivity: "Neutral",
        gdp: "Keep",
        interestRate: "Reduce",
        unemployment: "Keep",
    };

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

            <Subtitle>Equities</Subtitle>

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

            <AssetCard asset={spyAsset} />
            <AssetCard asset={spyAsset} />
            <AssetCard asset={spyAsset} />
            <AssetCard asset={spyAsset} />
        </div>
    );
}
