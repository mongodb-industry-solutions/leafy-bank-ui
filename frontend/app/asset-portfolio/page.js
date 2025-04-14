"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header/Header";
import Assets from "@/components/Assets/Assets";
import styles from "./AssetPortfolio.module.css";
import Card from "@leafygreen-ui/card";
import { Subtitle, Body } from "@leafygreen-ui/typography";
import { useRouter } from 'next/navigation';
import ChatbotPortfolio from "@/components/ChatbotPortfolio/ChatbotPortfolio";
import { fetchMostRecentMacroIndicators } from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";

export default function AssetPortfolio() {
    const [marketEvents, setMarketEvents] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchMarketData() {
            try {
                const data = await fetchMostRecentMacroIndicators();
                
                // Transform the data from object format to array format
                const transformedData = Object.entries(data.macro_indicators).map(([series_id, indicator]) => ({
                    series_id,
                    title: indicator.title,
                    frequency: indicator.frequency,
                    frequency_short: indicator.frequency_short,
                    units: indicator.units,
                    units_short: indicator.units_short,
                    date: { $date: new Date(indicator.date).toISOString() },
                    value: indicator.value
                }));
                
                setMarketEvents(transformedData);
            } catch (error) {
                console.error("Error fetching market events:", error);
            }
        }
        fetchMarketData();
    }, []);


    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/");
    };


    return (
        <div className={styles.container}>
            <Header onLogout={handleLogout} />

            <div className={styles.gridContainer}>
                <Card className={styles.roiCard} title="ROI">
                    <div className={styles.iframeContainer}>
                        <iframe
                            className={styles.responsiveIframe}
                            src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=9de04b25-cc2f-48bb-94bd-3c3d5c6ffb20&maxDataAge=3600&theme=light&autoRefresh=true">
                        </iframe>
                    </div>

                </Card>

                <div className={styles.rightColumn}>
                    <Card className={styles.assetCard} title="Asset Distribution">
                        <div className={styles.iframeContainer}>
                            <iframe
                                src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=cd8d523c-b90a-4a39-a447-2e53cd392924&maxDataAge=3600&theme=light&autoRefresh=true"
                                className={styles.responsiveIframe}
                            ></iframe>
                        </div>
                    </Card>

                    <Card className={styles.marketCard}>
                        <Subtitle className={styles.cardSubtitle}>Market Events</Subtitle>
                        <div className={styles.headerRow}>
                            <span>INDICATOR</span>
                            <span>FREQUENCY</span>
                            <span>LAST RELEASE DATE</span>
                            <span>LAST VALUE</span>
                        </div>

                        <div className={styles.eventContainer}>
                            {marketEvents.map((event) => (
                                <div key={event.series_id} className={styles.eventCard}>
                                    <Body>{event.title} (US)</Body>
                                    <Body>{event.frequency}</Body>
                                    <Body>{new Date(event.date.$date).toLocaleDateString()}</Body>
                                    <Body>{event.value}</Body>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>
            </div>

            <div className={styles.assetsSection}>
                <Assets />
            </div>

            <ChatbotPortfolio isOpen={isOpen} toggleChatbot={toggleChatbot}></ChatbotPortfolio>

            <div className={styles.chatbotButton} onClick={toggleChatbot}>
                <img src="/images/bot.svg" alt="Chat Icon" className={styles.chatIcon} />
                <div className={styles.textWrapper}>
                    <span><Body className={styles.chatbotText}>Leafy Portfolio Assistant</Body></span>
                    <div className={styles.statusWrapper}>
                        <div className={styles.indicator}></div>
                        <Body>Available</Body>
                    </div>
                </div>
            </div>
        </div>
    );
}
