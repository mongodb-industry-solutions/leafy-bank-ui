import { useState } from "react";
import styles from "./AssetCard.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Tooltip from "@leafygreen-ui/tooltip";
import { Body, H3, H2, Link, Subtitle } from "@leafygreen-ui/typography";
import Code from "@leafygreen-ui/code";
import Badge from "@leafygreen-ui/badge";
import {
    SegmentedControl,
    SegmentedControlOption
} from "@leafygreen-ui/segmented-control";
import Banner from "@leafygreen-ui/banner";
import NewsCard from "../NewsCard/NewsCard";
import RedditCard from "../RedditCard/RedditCard";

export default function AssetCardCrypto({ asset, chartData, rawMacroIndicators }) {
    const [expandedSection, setExpandedSection] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState("day");

    const handleExpand = (section) => {
        setExpandedSection((prevSection) => (prevSection === section ? null : section));
    };

    const getChartSrc = () => {
        if (!chartData || !chartData[selectedTimeframe]) return null;
        return `https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=${chartData[selectedTimeframe]}&maxDataAge=3600&theme=light&autoRefresh=true`;
    };

    const timeAgoToMinutes = (str) => {
        const num = parseInt(str);
        if (str.includes("minute")) return num;
        if (str.includes("hour")) return num * 60;
        if (str.includes("day")) return num * 60 * 24;
        if (str.includes("week")) return num * 60 * 24 * 7;
        if (str.includes("month")) return num * 60 * 24 * 30;
        if (str.includes("year")) return num * 60 * 24 * 365;
        return Infinity; // fallback for "Just now" or unknown
    };

    // Get the sentiment score from the asset data (default to 0 if not available)
    const sentimentScore = asset.sentiment ? asset.sentiment.score : 0;
    const formattedSentimentScore = sentimentScore.toFixed(2);

    // Get the sentiment category for color coding
    const sentimentCategory = asset.sentiment ? asset.sentiment.category : "Neutral";
    const sentimentColor =
        sentimentCategory === "Positive" ? styles.positiveScore :
            sentimentCategory === "Negative" ? styles.negativeScore :
                styles.neutralScore;

    // Get the VIX sensitivity
    const vixSensitivity = asset.vixSensitivity?.sensitivity || "NEUTRAL";

    // Set badge variant based on VIX sensitivity
    const vixBadgeVariant =
        vixSensitivity === "HIGH" ? "red" :
            vixSensitivity === "LOW" ? "green" :
                "yellow"; // NEUTRAL

    // Set badge variant based on trend direction
    const getTrendBadgeVariant = (trendDirection) => {
        switch ((trendDirection || "").toLowerCase()) {
            case "above":
                return "green";
            case "below":
                return "red";
            case "at":
                return "yellow";
            default:
                return "gray";
        }
    };
    // Get actions from macro indicators
    const gdpAction = asset.macroIndicators?.gdp?.action || "KEEP";
    const interestRateAction = asset.macroIndicators?.interestRate?.action || "KEEP";
    const unemploymentAction = asset.macroIndicators?.unemployment?.action || "KEEP";

    // Set badge variants based on macro indicator actions
    const gdpBadgeVariant = gdpAction === "KEEP" ? "green" : "red";
    const interestRateBadgeVariant = interestRateAction === "KEEP" ? "green" : "red";
    const unemploymentBadgeVariant = unemploymentAction === "KEEP" ? "green" : "red";

    // Get asset trend data
    const assetTrend = asset.assetTrend?.trend || "neutral";
    const trendBadgeVariant = assetTrend === "uptrend" ? "green" : assetTrend === "downtrend" ? "red" : "yellow";

    
    return (
        <div className={`${styles.card} ${expandedSection ? styles.expanded : ""}`}>
            <div className={styles.mainContent}>
                <div className={styles.cell}> <strong>{asset.symbol}</strong> </div>
                <div className={styles.cell}>{asset.allocation.description || "Unknown"}</div>
                <div className={styles.cell}>{asset.close ? asset.close.toFixed(2) : "No Price"}</div>
                <div className={styles.cell}>  {asset.allocation?.percentage || "N/A"}</div>
                <div className={styles.cell}>
                    <span className={`${styles.sentiment} ${sentimentColor}`}>{formattedSentimentScore}</span>
                </div>
                <div className={styles.cell}>
                    <span className={`${styles.sentiment} ${sentimentColor}`}>{formattedSentimentScore}</span>
                </div>

                <div className={`${styles.cell} ${styles.circle} ${styles[vixBadgeVariant]}`}></div>

                <div className={styles.actions}>


                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Insights" className={styles.actionButton} onClick={() => handleExpand("insights")}>
                            <Icon glyph="Sparkle" />
                        </IconButton>
                    }>
                        Insights
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Candle Stick" className={styles.actionButton} onClick={() => handleExpand("candleStick")}>
                            <Icon glyph="Charts" />
                        </IconButton>
                    }>
                        Candle Stick Chart
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="News" className={styles.actionButton} onClick={() => handleExpand("news")}>
                            <Icon glyph="University" />
                        </IconButton>
                    }>
                        News Headlines
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Social" className={styles.actionButton} onClick={() => handleExpand("social")}>
                            <Icon glyph="SMS" />
                        </IconButton>
                    }>
                        Social Media
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Doc Model" className={styles.actionButton} onClick={() => handleExpand("docModel")}>
                            <Icon glyph="CurlyBraces" />
                        </IconButton>
                    }>
                        Doc Model
                    </Tooltip>

                </div>
            </div>

            {expandedSection && (
                <div className={styles.expandedSection}>
                    <H3>
                        {expandedSection === "candleStick" ? ""
                            : expandedSection === "docModel" ? "Document Model"
                                : expandedSection === "insights" ? ""
                                    : expandedSection === "social" ? "Social Media"
                                        : "News Headlines"}
                    </H3>

                    {expandedSection === "candleStick" && (
                        <div className={styles.iframeContainer}>
                            <div className={styles.segmentedControlWrapper}>
                                <SegmentedControl
                                    followFocus={true}
                                    defaultValue="day"
                                    onChange={(value) => setSelectedTimeframe(value)}
                                    className={styles.segmentedControl}
                                >
                                    <SegmentedControlOption value="day">Last Day</SegmentedControlOption>
                                    <SegmentedControlOption value="week">Last 7 Days</SegmentedControlOption>
                                    <SegmentedControlOption value="month">Last 6 Months</SegmentedControlOption>
                                </SegmentedControl>
                            </div>

                            {getChartSrc() ? (

                                <div className={styles.chartsSection}>
                                    <iframe
                                        src={getChartSrc()}
                                        className={styles.responsiveIframe}
                                    ></iframe>

                                    <Body>Any gaps in the last 7 days chart are due to weekends, during which financial markets are closed.</Body>
                                </div>
                            ) : (
                                <Body>No chart available for {asset.symbol} - {selectedTimeframe}</Body>
                            )}
                        </div>
                    )}

                    {expandedSection === "docModel" && (
                        <div className={styles.docModelSection}>
                            <Banner>
                                This section illustrates the document model progression from raw ingested data to processed reports.
                                On the left, you can see the initial data as it's ingested into MongoDB. On the right, you'll find the
                                reports generated after this data has been processed by scheduled agents that apply business rules,
                                perform calculations, and create investment insights. Time series collections are used for efficient storage of financial data points,
                                while standard collections store news articles and analysis reports. This unified approach enables
                                seamless transitions from data ingestion to insight generation.
                            </Banner>

                            <div className={styles.docModelColumns}>
                                {/* LEFT COLUMN - RAW DATA */}
                                <div className={styles.rawDataColumn}>
                                    <H2>Raw Ingested Data</H2>

                                    <Subtitle className={styles.dataSubtitle}>Market Data</Subtitle>
                                    <Body className={styles.dataNote}>* Sample data is shown here. The actual system processes a much larger dataset.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify({
                                            [asset.symbol]: (asset.recentData || []).map(item => ({
                                                timestamp: item.timestamp,
                                                open: item.open,
                                                high: item.high,
                                                low: item.low,
                                                close: item.close,
                                                volume: item.volume
                                            }))
                                        }, null, 2)}
                                    </Code>

                                    <Subtitle className={styles.dataSubtitle}>Financial News Data</Subtitle>
                                    <Body className={styles.dataNote}>* Displaying only 3 of many news articles processed by the system.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify((asset.news || []).slice(0, 3).map(item => ({
                                            headline: item.headline,
                                            description: item.description,
                                            source: item.source,
                                            posted: item.posted,
                                            asset: item.asset,
                                            link: item.link || `https://news.google.com/search?q=${asset.symbol}`
                                        })), null, 2)}
                                    </Code>

                                    <Subtitle className={styles.dataSubtitle}>Macroeconomic Indicators Data</Subtitle>
                                    <Body className={styles.dataNote}>* Sample data from FRED (Federal Reserve Economic Data).</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify(
                                            rawMacroIndicators || {
                                                // Fallback if data isn't loaded yet
                                                "macro_indicators": {
                                                    "GDP": {
                                                        "title": "GDP",
                                                        "frequency": "Quarterly",
                                                        "frequency_short": "Q",
                                                        "units": "Trillion of Dollars",
                                                        "units_short": "Tril. of $",
                                                        "date": "2025-03-27T00:00:00",
                                                        "value": 29.72
                                                    },
                                                    "UNRATE": {
                                                        "title": "Unemployment Rate",
                                                        "frequency": "Monthly",
                                                        "frequency_short": "M",
                                                        "units": "Percent",
                                                        "units_short": "%",
                                                        "date": "2025-03-01T00:00:00",
                                                        "value": 4.2
                                                    },
                                                    "DFF": {
                                                        "title": "Interest Rate",
                                                        "frequency": "Daily",
                                                        "frequency_short": "D",
                                                        "units": "Percent",
                                                        "units_short": "%",
                                                        "date": "2025-04-28T00:00:00.000+00:00",
                                                        "value": 4.33
                                                    }
                                                }
                                            },
                                            null,
                                            2
                                        )}
                                    </Code>
                                </div>

                                {/* RIGHT COLUMN - PROCESSED REPORTS */}
                                <div className={styles.processedDataColumn}>
                                    <H2>Processed Reports</H2>

                                    <Subtitle className={styles.dataSubtitle}>AI Agent - Market Analysis Report</Subtitle>
                                    <Body className={styles.dataNote}>* Simplified view of the full market analysis report with truncated embeddings.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify({
                                            market_analysis_report: {
                                                report: {
                                                    market_volatility_index: {
                                                        fluctuation_answer: asset.vixSensitivity?.marketData?.fluctuation || "No data",
                                                        diagnosis: asset.vixSensitivity?.marketData?.diagnosis || "No data"
                                                    },
                                                    macro_indicators: [
                                                        {
                                                            macro_indicator: "GDP",
                                                            fluctuation_answer: asset.macroIndicators?.gdp?.marketData?.fluctuation || "No data",
                                                            diagnosis: asset.macroIndicators?.gdp?.marketData?.diagnosis || "No data"
                                                        },
                                                        {
                                                            macro_indicator: "Effective Interest Rate",
                                                            fluctuation_answer: asset.macroIndicators?.interestRate?.marketData?.fluctuation || "No data",
                                                            diagnosis: asset.macroIndicators?.interestRate?.marketData?.diagnosis || "No data"
                                                        },
                                                        {
                                                            macro_indicator: "Unemployment Rate",
                                                            fluctuation_answer: asset.macroIndicators?.unemployment?.marketData?.fluctuation || "No data",
                                                            diagnosis: asset.macroIndicators?.unemployment?.marketData?.diagnosis || "No data"
                                                        }
                                                    ],
                                                    asset_trends: [
                                                        {
                                                            asset: asset.symbol,
                                                            fluctuation_answer: asset.assetTrend?.fluctuation || "No data",
                                                            diagnosis: asset.assetTrend?.diagnosis || "No data"
                                                        }
                                                    ]
                                                },
                                                report_embedding: [0.023, 0.187, 0.452, "..."]
                                            }
                                        }, null, 2)}
                                    </Code>

                                    <Subtitle className={styles.dataSubtitle}>AI Agent - Market News Report</Subtitle>
                                    <Body className={styles.dataNote}>* Simplified view of the full market news report with truncated embeddings.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify({
                                            market_news_report: {
                                                report: {
                                                    asset_news: asset.news || [],
                                                    asset_news_summary: [
                                                        {
                                                            asset: asset.symbol,
                                                            overall_sentiment_score: asset.sentiment.originalScore,
                                                            overall_sentiment_category: asset.sentiment.category,
                                                            news_count: asset.news ? asset.news.length : 0
                                                        }
                                                    ]
                                                },
                                                report_embedding: [0.124, 0.394, 0.721, "..."]
                                            }
                                        }, null, 2)}
                                    </Code>
                                </div>
                            </div>

                        </div>
                    )}

                    {expandedSection === "news" && (
                        <div className={styles.newsSection}>
                            
                            <div className={styles.newsContainer}>
                                {asset.news && asset.news.length > 0 ? (
                                    [...asset.news]
                                        .sort((a, b) => timeAgoToMinutes(a.posted) - timeAgoToMinutes(b.posted))
                                        .map((item, index) => (

                                            <NewsCard key={index} item={item} />

                                        ))
                                ) : (
                                    <Body>No news available for {asset.symbol}.</Body>
                                )}
                            </div>


                            <div className={styles.explanationContainer}>
                                <div className={styles.explanation}>
                                    <Body>The <strong>Sentiment Score</strong> reflects the overall market sentiment for a given asset, calculated using <a href="https://huggingface.co/ProsusAI/finbert" target="_blank" rel="noopener noreferrer"><strong>FinBERT</strong></a>, is a pre-trained NLP model to analyze sentiment of financial text. This score is derived from analyzing <strong>only the news articles semantically related to {asset.symbol}</strong>, retrieved through vector search.</Body>

                                    <Banner className={styles.formulaContainer}>
                                        <Body weight="medium">Sentiment Score Formula</Body>
                                        {asset.symbol} Sentiment Score = Sum of semantically relevant article sentiment scores ÷ Number of relevant articles
                                    </Banner>

                                    <Body>Sentiment scores are categorized as <Badge className={styles.inlineBadge} variant="green">Positive </Badge>(0.6 to 1.0), <Badge className={styles.inlineBadge} variant="yellow">Neutral</Badge> (0.4 to 0.6), and<Badge className={styles.inlineBadge} variant="red">Negative</Badge> (0.0 to 0.4).</Body>
                                    <br></br>

                                    <Body>The <strong>news articles are retrieved using a semantic search query</strong> that finds the most relevant articles based on the asset's symbol and description.</Body>
                                    <Body><em>* To simulate dynamic behavior in this demo, a randomizer alters the news articles that are displayed.</em></Body>
                                    <br />
                                    <Body weight="medium" className={styles.sectionTitle}>How it works:</Body>
                                    <Body>
                                        1. We generate a semantic query embedding for <em>"Financial news articles related to {asset.symbol} ({asset.allocation?.description})"</em> using <a href="https://blog.voyageai.com/2024/06/03/domain-specific-embeddings-finance-edition-voyage-finance-2/" target="_blank" rel="noopener noreferrer">voyage-finance-2</a>, a domain-specific financial embedding model.
                                        <br />
                                        2. MongoDB's vector search finds the most semantically relevant news articles.
                                        <br />
                                    </Body>

                                    <div className={styles.queryContainer}>
                                        <Code
                                            language="json"
                                        >
                                        </Code>
                                    </div>
                                    <br />
                                    <Body><em>Note: The above vector search aggregation pipeline runs on news article data using <a href="https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/" target="_blank" rel="noopener noreferrer">MongoDB Atlas Vector Search</a></em></Body>
                                </div>
                            </div>
                        </div>
                    )}

                    {expandedSection === "social" && (
                        <div className={styles.socialSection}>
                            <div className={styles.socialContainer}>

                                {asset.news && asset.news.length > 0 ? (
                                    [...asset.news]
                                        .sort((a, b) => timeAgoToMinutes(a.posted) - timeAgoToMinutes(b.posted))
                                        // .sort((a, b) => timeAgoToMinutes(a.create_at_utc) - timeAgoToMinutes(b.create_at_utc))

                                        .map((item, index) => (

                                            <RedditCard key={index} item={item} />

                                        ))
                                ) : (
                                    <Body>No social posts available for {asset.symbol}</Body>
                                )}

                            </div>


                            <div className={styles.explanationContainer}>
                                <div className={styles.explanation}>
                                    <Body>The <strong>Sentiment Score</strong> reflects the overall market sentiment for a given asset, calculated using <a href="https://huggingface.co/ProsusAI/finbert" target="_blank" rel="noopener noreferrer"><strong>FinBERT</strong></a>, is a pre-trained NLP model to analyze sentiment of financial text. This score is derived from analyzing <strong>only the news articles semantically related to {asset.symbol}</strong>, retrieved through vector search.</Body>

                                    <Banner className={styles.formulaContainer}>
                                        <Body weight="medium">Sentiment Score Formula</Body>
                                        {asset.symbol} Sentiment Score = Sum of semantically relevant article sentiment scores ÷ Number of relevant articles
                                    </Banner>

                                    <Body>Sentiment scores are categorized as <Badge className={styles.inlineBadge} variant="green">Positive </Badge>(0.6 to 1.0), <Badge className={styles.inlineBadge} variant="yellow">Neutral</Badge> (0.4 to 0.6), and<Badge className={styles.inlineBadge} variant="red">Negative</Badge> (0.0 to 0.4).</Body>
                                    <br></br>

                                </div>
                            </div>
                        </div>
                    )}

                    {expandedSection === "insights" && (
                        <div className={styles.insightsContainer}>
                            <H3 className={styles.insightsTitle}>{asset.symbol} Insights</H3>

                            <div className={styles.assetInsightCards}>
                                {[
                                    "MA9 Moving Average Analysis",
                                    "MA21 Moving Average Analysis",
                                    "MA50 Moving Average Analysis",
                                    "RSI Analysis",
                                    "Volume Analysis",
                                    "VWAP Analysis"
                                ].map((indicatorTitle) => {
                                    const data = asset.crypto_indicators?.find(
                                        (ind) => ind.indicator === indicatorTitle
                                    );

                                    if (!data) return null;

                                    return (
                                        <div key={indicatorTitle} className={styles.insightSection}>
                                            <div className={styles.insightHeader}>
                                                <H2 className={styles.insightH2}>{indicatorTitle}</H2>
                                                <div
                                                    className={`${styles.cell} ${styles.circleInsight} ${indicatorTitle.includes("Moving Average")
                                                            ? styles[getTrendBadgeVariant(data.trend_direction)]
                                                            : ""
                                                        }`}
                                                />
                                            </div>

                                            {data.explanation && (
                                                <Body>{data.explanation}</Body>
                                            )}

                                            {/**
                                            {(data.trend_direction || data.percentage_difference) && (
                                                <div>
                                                    <div className={styles.row}>
                                                        {data.trend_direction && (
                                                            <div className={styles.col}>
                                                                <Body className={styles.insightSubtitles}>Trend Direction:</Body>
                                                                <Body>{data.trend_direction}</Body>
                                                            </div>
                                                        )}
                                                        {data.percentage_difference && (
                                                            <div className={styles.col}>
                                                                <Body className={styles.insightSubtitles}>Percentage Difference:</Body>
                                                                <Body>{data.percentage_difference}</Body>
                                                            </div>
                                                        )}


                                                    </div>
                                                    <hr className={styles.hr}></hr>
                                                </div>
                                            )
                                            }
                                             */}


                                            {
                                                data.rsi_value && (
                                                    <>
                                                        <Body className={styles.insightSubtitles}>RSI Value:</Body>
                                                        <Body>{data.rsi_value}</Body>
                                                    </>
                                                )
                                            }

                                            {/** 
                                            {data.current_volume && data.avg_volume && data.volume_ratio && (
                                                <div>
                                                    <div className={styles.row}>
                                                        <div className={styles.col}>
                                                            <Body className={styles.insightSubtitles}>Current Volume:</Body>
                                                            <Body>{data.current_volume}</Body>
                                                        </div>
                                                        <div className={styles.col}>
                                                            <Body className={styles.insightSubtitles}>21-Day Avg Volume:</Body>
                                                            <Body>{data.avg_volume}</Body>
                                                        </div>
                                                        <div className={styles.col}>
                                                            <Body className={styles.insightSubtitles}>Volume Ratio:</Body>
                                                            <Body>{data.volume_ratio}</Body>
                                                        </div>
                                                    </div>
                                                    <hr className={styles.hr}></hr>
                                                </div>
                                            )}

                                            {data.vwap_value && data.current_price && data.price_vs_vwap && (
                                                <div>
                                                    <div className={styles.row}>
                                                        <div className={styles.col}>
                                                            <Body className={styles.insightSubtitles}>VWAP:</Body>
                                                            <Body>{data.vwap_value}</Body>
                                                        </div>
                                                        <div className={styles.col}>
                                                            <Body className={styles.insightSubtitles}>Current Price:</Body>
                                                            <Body>{data.current_price}</Body>
                                                        </div>
                                                        <div className={styles.col}>
                                                            <Body className={styles.insightSubtitles}>Price vs VWAP:</Body>
                                                            <Body>{data.price_vs_vwap}</Body>
                                                        </div>
                                                    </div>
                                                    <hr className={styles.hr}></hr>
                                                </div>
                                            )}

                                            */}
                                            {
                                                data.suggestion && (
                                                    <>
                                                        <Body className={styles.insightSubtitles}>Asset Specific Diagnosis:</Body>
                                                        <Body>{data.suggestion}</Body>
                                                    </>
                                                )
                                            }

                                            {/**
                                            {
                                                data.diagnosis && (
                                                    <>
                                                        <Body className={styles.insightSubtitles}>Diagnosis:</Body>
                                                        <Body>{data.diagnosis}</Body>
                                                    </>
                                                )
                                            }

                                             */}

                                            {
                                                data.note && (
                                                    <>
                                                        <Body className={styles.insightSubtitles}>Note:</Body>
                                                        <Body className={styles.insightNote}>{data.note}</Body>
                                                    </>
                                                )
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}