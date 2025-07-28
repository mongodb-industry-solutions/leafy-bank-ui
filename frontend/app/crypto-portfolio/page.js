"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header/Header";
import AssetsCrypto from "@/components/AssetsCrypto/AssetsCrypto";
import styles from "./CryptoPortfolio.module.css";
import Card from "@leafygreen-ui/card";
import { Subtitle, Body, H2, H3 } from "@leafygreen-ui/typography";
import { useRouter } from 'next/navigation';
import ChatbotPortfolio from "@/components/ChatbotPortfolio/ChatbotPortfolio";
import ConfirmationModal from "@leafygreen-ui/confirmation-modal";
import Banner from "@leafygreen-ui/banner";
import Icon from "@leafygreen-ui/icon";
import Tooltip from "@leafygreen-ui/tooltip";
import {
    SegmentedControl,
    SegmentedControlOption
} from "@leafygreen-ui/segmented-control";
import { fetchMostRecentStablecoinsMarketCap } from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";

export default function AssetPortfolio() {
    const [isOpen, setIsOpen] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const router = useRouter();
    const [selectedTimeframe, setSelectedTimeframe] = useState("6month");
    const [stablecoinData, setStablecoinData] = useState([]);
    const [isLoadingStablecoins, setIsLoadingStablecoins] = useState(false);

    // "Can I help you?" Chatbot bubble //
    const [showBubble, setShowBubble] = useState(true);
    const [bubbleFade, setBubbleFade] = useState(false);

    // Fetch stablecoin market cap data
    const fetchStablecoinData = async () => {
        setIsLoadingStablecoins(true);
        try {
            const response = await fetchMostRecentStablecoinsMarketCap();
            if (response && response.data) {
                // Filter and sort the stablecoins we care about: USDT, USDC, ALL_STABLECOINS
                const filteredData = response.data.filter(coin => 
                    coin.Symbol === "USDT" || coin.Symbol === "USDC" || coin.Symbol === "ALL_STABLECOINS"
                );
                
                // Sort in the desired order: USDT, USDC, All StableCoins
                const sortedData = filteredData.sort((a, b) => {
                    const order = ["USDT", "USDC", "ALL_STABLECOINS"];
                    return order.indexOf(a.Symbol) - order.indexOf(b.Symbol);
                });
                
                setStablecoinData(sortedData);
            }
        } catch (error) {
            console.error("Error fetching stablecoin data:", error);
            setStablecoinData([]);
        } finally {
            setIsLoadingStablecoins(false);
        }
    };

    useEffect(() => {
        fetchStablecoinData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setBubbleFade(true); // trigger fade out
            setTimeout(() => setShowBubble(false), 500); // remove element after animation
        }, 8000);
        return () => clearTimeout(timer);
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

    // Loading skeleton for stablecoin data
    const StablecoinSkeleton = () => (
        <>
            {[1, 2, 3].map((item) => (
                <div key={item} className={styles.eventCard}>
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
            <Header className={styles.navBar} onLogout={handleLogout} />

            <H2> Crypto Investment</H2>


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

                            <Subtitle className={styles.cardSubtitle}>Crypto Asset Distribution by Symbol</Subtitle>
                            <div className={styles.iframeContainer}>
                                <iframe
                                    src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=cfd11f4a-b8b8-446d-91fe-ba8c03bc3ce9&maxDataAge=3600&theme=light&autoRefresh=true"
                                    className={styles.responsiveIframe}
                                ></iframe>

                            </div>

                        </Card>

                    </div>

                    <Card className={styles.marketCard}>
                        <Subtitle className={styles.cardSubtitle}>Stablecoin Market Cap</Subtitle>
                        <div className={styles.headerRow}>
                            <span>STABLECOIN</span>
                            <span>MARKET CAP</span>
                            <span>TREND (DAILY)</span>
                        </div>

                        <div className={styles.eventContainer}>
                            {isLoadingStablecoins ? (
                                <StablecoinSkeleton />
                            ) : stablecoinData.length > 0 ? (
                                stablecoinData.map((coin) => {
                                    const displayName = coin.Symbol === "ALL_STABLECOINS" 
                                        ? "All StableCoins" 
                                        : coin.Symbol;

                                    // Format market cap to billions/trillions
                                    const formatMarketCap = (value) => {
                                        if (value >= 1e12) {
                                            return `$${(value / 1e12).toFixed(2)}T`;
                                        } else if (value >= 1e9) {
                                            return `$${(value / 1e9).toFixed(0)}B`;
                                        } else if (value >= 1e6) {
                                            return `$${(value / 1e6).toFixed(0)}M`;
                                        } else {
                                            return `$${value.toLocaleString()}`;
                                        }
                                    };

                                    return (
                                        <div key={coin.Symbol} className={styles.stablecoinCard}>
                                            <Body className={styles.stablecoinColumn}>{displayName}</Body>
                                            <Body>{formatMarketCap(coin["Market Cap"])}</Body>
                                            <div>
                                                <Tooltip align="top" justify="middle" trigger={
                                                    <Icon
                                                        className={
                                                            coin["Trend direction"] === "up"
                                                                ? styles.arrowUp
                                                                : coin["Trend direction"] === "down"
                                                                    ? styles.arrowDown
                                                                    : styles.arrowEqual
                                                        }
                                                        glyph={
                                                            coin["Trend direction"] === "up"
                                                                ? "ArrowUp"
                                                                : coin["Trend direction"] === "down"
                                                                    ? "ArrowDown"
                                                                    : "Minus"
                                                        }
                                                    />
                                                }>
                                                    {coin["Trend (%)"] !== 0 ? `${coin["Trend (%)"] > 0 ? '+' : ''}${coin["Trend (%)"]}%` : 'No change'}
                                                </Tooltip>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={styles.noData}>
                                    <Body>No stablecoin data available</Body>
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
                <AssetsCrypto />
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