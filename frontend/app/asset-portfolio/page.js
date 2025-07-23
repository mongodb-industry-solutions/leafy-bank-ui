"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header/Header";
import Assets from "@/components/Assets/Assets";
import styles from "./AssetPortfolio.module.css";
import Card from "@leafygreen-ui/card";
import { Subtitle, Body, H3, H2 } from "@leafygreen-ui/typography";
import { useRouter } from 'next/navigation';
import ChatbotPortfolio from "@/components/ChatbotPortfolio/ChatbotPortfolio";
import ConfirmationModal from "@leafygreen-ui/confirmation-modal";
import Banner from "@leafygreen-ui/banner";
import { fetchMostRecentMacroIndicators, fetchMacroIndicatorsTrend } from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";
import {
    SegmentedControl,
    SegmentedControlOption
} from "@leafygreen-ui/segmented-control";
import Icon from "@leafygreen-ui/icon";
import Tooltip from "@leafygreen-ui/tooltip";

export default function AssetPortfolio() {
    const [marketEvents, setMarketEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const router = useRouter();
    const [selectedTimeframe, setSelectedTimeframe] = useState("6month");

    // "Can I help you?" Chatbot bubble //
    const [showBubble, setShowBubble] = useState(true);
    const [bubbleFade, setBubbleFade] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setBubbleFade(true); // trigger fade out
            setTimeout(() => setShowBubble(false), 500); // remove element after animation
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        async function fetchMarketData() {
            try {
                // Check for cached indicators data
                const cachedData = localStorage.getItem('macroIndicatorsData');
                const cachedTimestamp = localStorage.getItem('macroIndicatorsTimestamp');
                const dataIsStale = !cachedTimestamp || (Date.now() - parseInt(cachedTimestamp)) > (6 * 60 * 60 * 1000); // 6 hours

                if (cachedData && !dataIsStale) {
                    // Use cached data immediately
                    const parsedData = JSON.parse(cachedData);
                    setMarketEvents(parsedData);
                    setIsLoading(false);

                    // Still fetch fresh data in the background
                    fetchFreshData(false);
                    return;
                }

                // No valid cache, fetch fresh data
                await fetchFreshData(true);
            } catch (error) {
                console.error("Error in market data sequence:", error);
                setIsLoading(false);
            }
        }

        async function fetchFreshData(updateLoadingState) {
            try {
                // Fetch both the latest indicator values and trend information
                const indicatorsData = await fetchMostRecentMacroIndicators();
                const trendData = await fetchMacroIndicatorsTrend();

                // Transform the data from object format to array format
                const transformedData = Object.entries(indicatorsData.macro_indicators).map(([series_id, indicator]) => {
                    // Get trend information for this indicator if available
                    const trend = trendData.trend_indicators[series_id] || {};

                    return {
                        series_id,
                        title: indicator.title,
                        frequency: indicator.frequency,
                        frequency_short: indicator.frequency_short,
                        units: indicator.units,
                        units_short: indicator.units_short,
                        date: { $date: new Date(indicator.date).toISOString() },
                        value: indicator.value,
                        // Add the arrow direction from trend data
                        arrow_direction: trend.arrow_direction || "EQUAL"
                    };
                });

                setMarketEvents(transformedData);
                if (updateLoadingState) {
                    setIsLoading(false);
                }

                // Save to cache
                try {
                    localStorage.setItem('macroIndicatorsData', JSON.stringify(transformedData));
                    localStorage.setItem('macroIndicatorsTimestamp', Date.now().toString());
                } catch (storageError) {
                    console.warn("Could not save macro indicators to localStorage:", storageError);
                }
            } catch (error) {
                console.error("Error fetching market events:", error);
                if (updateLoadingState) {
                    setIsLoading(false);
                }
            }
        }

        fetchMarketData();
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const agreed = localStorage.getItem("agreedToDisclaimer");
            if (!agreed) {
                setShowDisclaimer(true);
            }
        }
    }, []);

    const handleCloseDisclaimer = () => {
        localStorage.setItem("agreedToDisclaimer", "true");
        setShowDisclaimer(false);
    };

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/");
    };

    // Loading skeleton for macroeconomic indicators
    const IndicatorsSkeleton = () => (
        <>
            {[1, 2, 3].map((item) => (
                <div key={item} className={styles.eventCard}>
                    <div className={styles.skeletonText}></div>
                    <div className={styles.skeletonText}></div>
                    <div className={styles.skeletonText}></div>
                    <div className={styles.skeletonValue}>
                        <div className={styles.skeletonText}></div>
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div className={styles.container}>

            <H2> Stock Investment </H2>
            
            <Header className={styles.navBar} onLogout={handleLogout} />

            {/* Keep the modal for first-time visitors */}
            <ConfirmationModal
                open={showDisclaimer}
                onConfirm={handleCloseDisclaimer}
                title="Demo Disclaimer"
                buttonText="I Agree"
            >
                The content of this page is for information, training and demonstration purposes and not intended as an investment advice.
            </ConfirmationModal>

            <div className={styles.gridContainer}>
                <Card className={styles.roiCard} title="ROI">
                    <Subtitle className={styles.cardSubtitle}>Portfolio Performance</Subtitle>
                    <div className={styles.roiHeader}>
                        <SegmentedControl
                            followFocus={true}
                            defaultValue="6month"
                            value={selectedTimeframe}
                            onChange={(value) => setSelectedTimeframe(value)}
                            className={styles.segmentedControl}
                        >
                            <SegmentedControlOption value="month">This Month</SegmentedControlOption>
                            <SegmentedControlOption value="6month">Last 6 Months</SegmentedControlOption>
                        </SegmentedControl>
                    </div>

                    <div className={styles.iframeContainer}>
                        {selectedTimeframe === "month" && (
                            <iframe
                                className={styles.responsiveIframe}
                                src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=9de04b25-cc2f-48bb-94bd-3c3d5c6ffb20&maxDataAge=3600&theme=light&autoRefresh=true"
                            ></iframe>
                        )}
                        {selectedTimeframe === "6month" && (
                            <iframe
                                className={styles.responsiveIframe}
                                src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=3658d399-d4d8-4253-abe6-833a366ad30c&maxDataAge=3600&theme=light&autoRefresh=true"
                            ></iframe>
                        )}
                    </div>
                </Card>

                <div className={styles.rightColumn}>

                     {/* NOT INCLUDING FOR NOW 

                    <div className={styles.totalFigures}>

                        <Card className={styles.figureCard}>
                            <H3> USD 100.000</H3>
                            <Body>Total</Body>
                        </Card>


                        <Card className={styles.figureCard}>
                            <H3> USD 10.000</H3>
                            <Body>Total Cash</Body>
                        </Card>


                        <Card className={styles.figureCard}>
                            <H3> USD 90.000</H3>
                            <Body>Total Amount Invested</Body>
                        </Card>

                    </div>

                    */}

                    <div className={styles.pieCharts}>
                        <Card className={styles.assetCard} title="Asset Distribution">

                            <Subtitle className={styles.cardSubtitle}>Asset Distribution by Symbol</Subtitle>
                            <div className={styles.iframeContainer}>
                                <iframe
                                    src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=cd8d523c-b90a-4a39-a447-2e53cd392924&maxDataAge=3600&theme=light&autoRefresh=true"
                                    className={styles.responsiveIframe}
                                ></iframe>

                            </div>

                        </Card>
                        <Card className={styles.assetCard} title="Asset Distribution">

                            <Subtitle className={styles.cardSubtitle}>Asset Distribution by Type</Subtitle>

                            <div className={styles.iframeContainer}>
                                <iframe
                                    src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=5af0765f-51bc-47af-ae5f-92cff4fadadb&maxDataAge=3600&theme=light&autoRefresh=true"
                                    className={styles.responsiveIframe}
                                ></iframe>
                            </div>

                        </Card>
                    </div>

                    <Card className={styles.marketCard}>
                        <Subtitle className={styles.cardSubtitle}>Macroeconomic Indicators</Subtitle>
                        <div className={styles.headerRow}>
                            <span>INDICATOR</span>
                            <span>FREQUENCY</span>
                            <span>LAST RELEASE DATE</span>
                            <span>LAST VALUE</span>
                            <span>UNITS</span>
                            <span>TREND</span>
                        </div>

                        <div className={styles.eventContainer}>
                            {isLoading ? (
                                <IndicatorsSkeleton />
                            ) : marketEvents.length > 0 ? (
                                marketEvents.map((event) => {
                                    // Determine source URL based on indicator title
                                    let sourceUrl = "";
                                    const displayTitle = event.title === "Gross Domestic Product"
                                        ? "GDP (US)"
                                        : event.title === "Federal Funds Effective Rate"
                                            ? "Interest Rate (US)"
                                            : `${event.title} (US)`;

                                    // Map the title to the correct source URL
                                    if (displayTitle === "GDP (US)") {
                                        sourceUrl = "https://fred.stlouisfed.org/series/GDP";
                                    } else if (displayTitle === "Unemployment Rate (US)") {
                                        sourceUrl = "https://fred.stlouisfed.org/series/UNRATE";
                                    } else if (displayTitle === "Interest Rate (US)") {
                                        sourceUrl = "https://fred.stlouisfed.org/series/DFF";
                                    }

                                    return (
                                        <div key={event.series_id} className={styles.eventCard}>
                                            {sourceUrl ? (
                                                <a
                                                    href={sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`${styles.indicatorLink} ${styles.eventColumn}`}
                                                    title={`View source for ${displayTitle} on FRED`}
                                                >
                                                    <Body>{displayTitle}</Body>
                                                </a>
                                            ) : (
                                                <Body className={styles.eventColumn}>{displayTitle}</Body>
                                            )}
                                            <Body>{event.frequency}</Body>
                                            <Body>{new Date(event.date.$date).toLocaleDateString()}</Body>
                                            <Body>{(() => {
                                                // Try to parse the value as a number
                                                const numValue = parseFloat(event.value);

                                                // Check if it's a valid number
                                                if (!isNaN(numValue)) {
                                                    // If it's GDP, divide by 1000 to convert from billions to trillions
                                                    if (event.title === "Gross Domestic Product") {
                                                        return (numValue / 1000).toFixed(2);
                                                    } else {
                                                        return numValue.toFixed(2);
                                                    }
                                                } else {
                                                    return event.value;
                                                }
                                            })()}</Body>
                                            <Body>
                                                {event.title === "Gross Domestic Product" || event.units_short === "Bil. of $"
                                                    ? "Tril. of $"
                                                    : event.units_short}
                                            </Body>
                                            <div>
                                                <Tooltip align="top" justify="middle" trigger={
                                                    <Icon
                                                        className={
                                                            event.arrow_direction === "ARROW_UP"
                                                                ? styles.arrowUp
                                                                : event.arrow_direction === "ARROW_DOWN"
                                                                    ? styles.arrowDown
                                                                    : styles.arrowEqual
                                                        }
                                                        glyph={
                                                            event.arrow_direction === "ARROW_UP"
                                                                ? "ArrowUp"
                                                                : event.arrow_direction === "ARROW_DOWN"
                                                                    ? "ArrowDown"
                                                                    : "Minus"
                                                        }
                                                    />
                                                }>
                                                    Trend relative to last value
                                                </Tooltip>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={styles.noData}>
                                    <Body>No macroeconomic indicators available</Body>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>
            </div>

             {/* Add persistent disclaimer banner */}
            <Banner
                variant="warning"
                className={styles.disclaimerBanner}
            >
                <strong>Important Notice:</strong> The content of this page is for information, training and demonstration purposes and not intended as an investment advice.
            </Banner>

            <div className={styles.assetsSection}>
                <Assets />
            </div>

            <ChatbotPortfolio isOpen={isOpen} toggleChatbot={toggleChatbot}></ChatbotPortfolio>

            <div className={styles.chatbotButton} onClick={toggleChatbot}>
                {showBubble && (
                    <div
                        className={`${styles.speechBubble} ${bubbleFade ? styles.fadeOut : styles.fadeIn}`}
                    >
                        Can I help you?
                    </div>
                )}
                <img src="/images/coachGTM_Headshot.png" alt="Chat Icon" className={styles.chatIcon} />
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