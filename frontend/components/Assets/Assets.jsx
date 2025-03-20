"use client";

import styles from "./Assets.module.css";
import AssetCard from "../AssetCard/AssetCard";
import { H2, Subtitle, Body } from "@leafygreen-ui/typography";
import InfoWizard from "../InfoWizard/InfoWizard";
import React, { useState, useEffect } from "react";


export default function Assets() {
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        fetch("/data/assets.json") // Update the path as needed
            .then((response) => response.json())
            .then((data) => setAssets(data)) // Directly store JSON data
            .catch((error) => console.error("Error loading assets:", error));
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
