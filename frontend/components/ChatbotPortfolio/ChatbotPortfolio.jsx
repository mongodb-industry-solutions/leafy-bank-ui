//// filepath: /Users/julian.boronat/Github/mongodb/mongodb-industry-solutions/leafy-bank-ui/frontend/components/ChatbotPortfolio/ChatbotPortfolio.jsx
"use client";

import { useState, useEffect } from "react";
import styles from "./ChatbotPortfolio.module.css";
import { Subtitle, Body, Overline } from '@leafygreen-ui/typography';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
import Badge from "@leafygreen-ui/badge";
import Button from "@leafygreen-ui/button";
import { Tabs, Tab } from '@leafygreen-ui/tabs';
//import InfoWizard from "../InfoWizard/InfoWizard";
import Typewriter from "./Typewriter.jsx";
import { sendMessagetoReactAgentMarketAssistantChatbot } from "@/lib/api/capital_markets/chatbots/capitalmarkets_react_stock_api";
import { sendMessagetoReactAgentCryptoAssistantChatbot } from "@/lib/api/capital_markets/chatbots/capitalmarkets_react_crypto_api";
import { usePathname } from "next/navigation";

function generateThreadId() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `thread_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

const ChatbotPortfolio = ({ isOpen, toggleChatbot }) => {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [answer, setAnswer] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [completedMessages, setCompletedMessages] = useState({});
    const [openHelpModal, setOpenHelpModal] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [threadId, setThreadId] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    // Change question suggestions based on page path
    const pathname = usePathname();
    const isCrypto = pathname.includes("/crypto-portfolio");

    useEffect(() => {
        // Generate a fresh threadId and clear history each time the chatbot is opened
        if (isOpen) {
            setThreadId(generateThreadId());
        } else {
            // When closing the chatbot, reset everything
            setThreadId(null);
            setMessages([]);
            setAnswer("");
            setCompletedMessages({});
            setSuggestionIndex(0); // Reset suggestions index too
        }
    }, [isOpen]);

    const handleChange = (event) => {
        setQuery(event.target.value);
    };

    // Decide suggestions dynamically depending on pathname
    const suggestions = isCrypto
        ? [
            "Considering the current crypto market conditions, momentum, and sentiment from social media and news, what would be the optimal crypto asset allocation for my portfolio?",
            "Can you search the internet for the latest trends in altcoins like Solana (SOL) and Cardano (ADA)?",
            "What would be the potential impact of shifting 50% of my Bitcoin holdings into Ethereum?",
            "Show me a summary of the top news driving price movements for BTC and ETH today."
        ]
        : [
            "Based on market condition today, what overall portfolio asset reallocation would you suggest?",
            "What is the news sentiment about my asset GLD (Gold ETF)?",
            "What would be the impact of replacing 50% of Equity assets with Gold?",
            "I would like to start investing in the database market. Can you search the internet for what’s going on with MDB (MongoDB)? I want to know what the press is saying.",
            "What questions have I asked you so far, and which tools have you used to respond to me?"
        ];


    const [suggestionIndex, setSuggestionIndex] = useState(0);

    const handleSuggestionClick = () => {
        const selected = suggestions[suggestionIndex];
        setQuery(selected);
        setSuggestionIndex((prevIndex) => Math.min(prevIndex + 1, suggestions.length - 1));
    };

    const formatAnswer = (text) => {
        // Preserve newlines but still format numbered lists
        return text.replace(/(\d+\.\s)/g, '\n$1');
    };

    const handleAsk = async () => {
        setIsAsking(true);
        try {
            const apiFunction = isCrypto
                ? sendMessagetoReactAgentCryptoAssistantChatbot
                : sendMessagetoReactAgentMarketAssistantChatbot;

            const data = await apiFunction(threadId, query);
            const { final_answer, tool_calls = [] } = data;
            const responseMessage = formatAnswer(final_answer || "No response");

            setAnswer(responseMessage);

            setMessages((prevMessages) => [
                ...prevMessages,
                { text: query, isUser: true, toolCalls: [] },
                { text: responseMessage, isUser: false, toolCalls: tool_calls }
            ]);

            setQuery("");
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsAsking(false);
        }
    };

    const markCompleted = (messageId) => {
        setCompletedMessages((prev) => ({ ...prev, [messageId]: true }));
    };

    return (
        <>
            {isOpen && (
                <div className={styles.chatbotModal}>
                    <div className={styles.chatbotOverlay} onClick={toggleChatbot}></div>
                    <div className={styles.chatbotContent}>

                        <div className={styles.chatbotHeader}>
                            <div className={styles.centeredHeader}>
                                <Badge variant="blue" className={styles.badge}>Leafy Portfolio Assistant Agent</Badge>
                            </div>

                            <IconButton
                                aria-label="X"
                                onClick={toggleChatbot}
                                className={styles.logoutIcon}
                            >
                                <Icon glyph="X" />
                            </IconButton>
                        </div>

                        <div className={styles.tabsWrapper}>
                            <Tabs selected={activeTab} setSelected={setActiveTab}>
                                <Tab name="Chatbot">

                                    <div className={styles.chatbotBody}>
                                        <Body className={styles.introBubble}>
                                            Hi there! 👋🏻 I’m Leafy Bank’s portfolio assistant, here to help you as the portfolio manager.
                                            <br /><br />
                                            I now have ✨<strong> long-term memory</strong> ✨ within each chat session...
                                        </Body>

                                        {messages.map((message, index) => {
                                            const isUserMessage = message.isUser;
                                            return (
                                                <div key={index} className={styles.chatMessage}>
                                                    <div className={`${styles.speechBubble} ${isUserMessage ? styles.userBubble : styles.answerBubble}`}>
                                                        {isUserMessage ? (
                                                            <Body>{message.text}</Body>
                                                        ) : (
                                                            <>
                                                                <div className={styles.agentHeader}>
                                                                    <img src="/images/coachGTM_Headshot.png" alt="Agent" className={styles.agentImage} />
                                                                    <Subtitle className={styles.agentPrefix}>Agent's response:</Subtitle>
                                                                </div>
                                                                <Body>
                                                                    <Typewriter
                                                                        text={message.text}
                                                                        messageId={index}
                                                                        completedMessages={completedMessages}
                                                                        markCompleted={markCompleted}
                                                                    />
                                                                </Body>
                                                            </>
                                                        )}
                                                    </div>

                                                    {!isUserMessage && message.toolCalls?.length > 0 && completedMessages[index] && (
                                                        <div className={styles.toolCallsContainer}>
                                                            <div className={styles.behindTheScenesLink}>
                                                                <Icon className={styles.linkIcon} glyph="Wrench" color="#889396" />
                                                                <Body className={styles.link}>Tool(s) called:</Body>
                                                            </div>
                                                            <div className={styles.toolCallsList}>
                                                                {message.toolCalls.map((tool, idx) => (
                                                                    <div key={idx} className={styles.toolCallItem}>
                                                                        <Body className={styles.toolName}>{tool.tool_name}</Body>
                                                                        {tool.query && <Body className={styles.toolQuery}>Query: "{tool.query}"</Body>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {isAsking && (
                                            <div className={styles.thinkingSection}>
                                                <img src="/images/animated_bot.gif" alt="Thinking bot" className={styles.thinkingGif} />
                                                <div className={styles.thinkingMessage}>The agent is thinking<span className={styles.dots}></span></div>
                                            </div>
                                        )}


                                    </div>

                                    <div className={styles.chatbotInputActions}>
                                        <div className={styles.suggestedQuestions}>
                                            <Body>Suggested Question:</Body>
                                            <button className={styles.suggestion} onClick={handleSuggestionClick}>
                                                {suggestions[suggestionIndex]}
                                            </button>
                                        </div>
                                        <div className={styles.chatbotInputArea}>
                                            <input
                                                type="text"
                                                value={query}
                                                onChange={handleChange}
                                                placeholder="Type your question..."
                                            />
                                            <Button onClick={handleAsk} variant="baseGreen" disabled={!query || isAsking}>
                                                {isAsking ? "Asking..." : "Ask"}
                                            </Button>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab name="How to demo">

                                    <div className={styles.tab}>
                                        <Subtitle>Leafy Portfolio Assistant Agent</Subtitle>
                                        <Body>
                                            Leafy Portfolio Assistant Agent provides portfolio managers with a tool that allows them to quickly access and analyze market data, portfolio performance, news and Reddit insights. It enhances efficiency by providing tailored responses and reducing the time spent solving the complexities behind data retrieval and analysis, enabling improved decision-making with real-time updates and contextually aware interactions.
                                        </Body>

                                        <div style={{ marginTop: '1rem' }}>
                                            <Body>
                                                <strong>How to Demo:</strong>
                                                <ol>
                                                    <li>Select one of the Suggested Questions or type a new one in the prompt</li>
                                                    <li>Click 'Ask'</li>
                                                    <li>View response</li>
                                                </ol>
                                            </Body>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab name="Behind the scenes">

                                    <div className={styles.tab}>
                                        <Subtitle>High-level Architecture</Subtitle>
                                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                            <img
                                                src="/images/chatbotPortfolio_info.png"
                                                alt="Agent"
                                                style={{ maxWidth: '100%', width: '700px', height: 'auto' }}
                                            />
                                        </div>

                                        <Body>
                                            This solution is divided into three core services:
                                            <ul>
                                                <li>Capital Markets/Crypto Loaders Service</li>
                                                <li>Capital Markets/Crypto Agents Service</li>
                                                <li>Market/Crypto Assistant ReAct Agent Chatbot</li>
                                            </ul>

                                            This section of the demo focuses on the last one:
                                        </Body>

                                        <div style={{ marginTop: '1rem' }}>
                                            <Body>
                                                <strong>Market & Crypto Assistant ReAct Agent Chatbot</strong><br />
                                                The Market & Crypto Assistant Agent is designed to interact with users, process their questions, and provide relevant answers using various technologies and data sources. Here's how it operates:
                                                <ul>
                                                    <li>User interaction: Starts with a user's question and finishes with the agent's answer.</li>
                                                    <li>ReAct Agent: The core of the system is a ReAct (reason-and-act) agent. This agent is responsible for interpreting the question, reasoning through possible actions, and generating a response. It combines reasoning with predefined actions using available tools.</li>
                                                    <li>Tools:
                                                        <ul>
                                                            <li>Aggregations: To compile and analyze data.</li>
                                                            <li>Vector Search: To find similar data points using embeddings.</li>
                                                            <li>Data Retrieval: To fetch relevant documents from the collections.</li>
                                                        </ul>
                                                    </li>
                                                    <li>Models:
                                                        <ul>
                                                            <li>LLM: Anthropics Claude Chat Completions model - AWS Bedrock, is used for understanding and processing natural language queries.</li>
                                                            <li>Embedding: "voyage-finance-2" is used to numerically process and understand financial data queries (vectors).</li>
                                                        </ul>
                                                    </li>
                                                    <li>MongoDB Atlas: Serves as the data layer that enables the storage of all the collections retrieved, search operations and memory retention of past interactions.</li>
                                                </ul>
                                            </Body>
                                        </div>

                                        <Subtitle>ReAct Pattern</Subtitle>

                                        <Body>The Leafy Portfolio Assistant Agent uses the ReAct (Reason and Act) pattern, which allows the agent to think step-by-step and take actions as needed. This pattern enables the agent to analyze user queries, reason through the appropriate tools to use, and synthesize coherent responses based on retrieved information.

                                        </Body>

                                        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                                            <img
                                                src="/images/react_pattern.png"
                                                alt="ReAct Pattern"
                                                style={{ maxWidth: '100%', width: '200px', height: 'auto' }} />
                                        </div>

                                        <Subtitle>Agent Flow and Interaction Model</Subtitle>
                                        <Body>
                                            When you interact with the Leafy Portfolio Assistant, your experience is powered by a sophisticated ReAct (Reason and Act) workflow:
                                            <ol>
                                                <li>User Query Processing: When you ask a question (e.g., "Based on market condition today, what overall portfolio asset reallocation would you suggest?"), the ReAct agent examines your query to determine what information you need.</li>
                                                <li>Reasoning Step:  The agent engages in a thought process, weighing which tools would be most appropriate for your query, guided by its profile which defines its role, capabilities, and decision-making rules.</li>
                                                <li>Tool Selection: Based on its reasoning, the agent selects the most appropriate specialized too:
                                                    <ul>
                                                        <li>For stocks:</li>
                                                        <ul>
                                                            <li>Portfolio analysis → <code>market_analysis_reports_vector_search_tool</code></li>
                                                            <li>Portfolio news → <code>market_news_reports_vector_search_tool</code></li>
                                                            <li>Asset allocation → <code>get_portfolio_allocation_tool</code></li>
                                                            <li>YTD returns → <code>get_portfolio_ytd_return_tool</code></li>
                                                            <li>Volatility → <code>get_vix_closing_value_tool</code></li>
                                                            <li>General info → <code>tavily_search_tool</code></li>
                                                        </ul>
                                                    </ul>

                                                    <ul>
                                                        <li>For crypto:</li>
                                                        <ul>
                                                            <li>Crypto portfolio allocation → <code>get_portfolio_allocation_tool</code></li>
                                                            <li>Crypto technical analysis & trends → <code>crypto_analysis_reports_vector_search_tool</code></li>
                                                            <li>Crypto news sentiment → <code>crypto_news_reports_vector_search_tool</code></li>
                                                            <li>Crypto social media sentiment → <code>crypto_social_media_reports_vector_search_tool</code></li>
                                                            <li>Crypto YTD returns → <code>get_portfolio_ytd_return_tool</code></li>
                                                            <li>General cryptocurrency info → <code>tavily_search_tool</code></li>
                                                        </ul>
                                                    </ul>
                                                </li>
                                                <li>Tool Execution and Observation: The selected tool retrieves data from MongoDB collections or external APIs. The agent observes the tool's output, integrating it into its understanding.</li>
                                                <li>Follow-up Reasoning: If the information is incomplete, the agent may reason through additional tool calls to gather complementary data points.</li>
                                                <li>Response Synthesis: The agent combines all gathered information into a coherent, actionable response that directly addresses your query.</li>
                                            </ol>

                                            Throughout this process, the agent maintains a conversation state in MongoDB, enabling it to reference previous interactions and provide contextually relevant responses over time.
                                        </Body>
                                        <div style={{ marginTop: '1rem' }}>

                                            <Subtitle>Agent Memory Management</Subtitle>
                                            <Body>
                                                The Leafy Portfolio Assistant Agent uses MongoDB as a long-term memory store to maintain context across conversation sessions:

                                                <ul>
                                                    <li><strong>Storage:</strong> Two key collections <code>checkpoints_aio</code> and <code>checkpoint_writes_aio</code> store the complete state of agent interactions, including reasoning steps, tool calls, and observations</li>
                                                    <ul>
                                                        <li>
                                                            For cryptocurrency-specific conversations, the system uses dedicated collections:
                                                            <code>crypto_checkpoints_aio</code> and <code>crypto_checkpoint_writes_aio</code>.
                                                        </li>
                                                    </ul>
                                                    <li><strong>Structure:</strong> Each conversation is organized by a unique  <code>thread_id</code> that includes a timestamp (format: thread_YYYYMMDD_HHMMSS). This allows for organized memory retrieval and management.</li>
                                                    <li><strong>Automated Memory Cleanup:</strong> To prevent memory buildup, a scheduled job runs daily through the <code>CheckpointerMemoryJobs </code>system to remove older conversation threads, ensuring the system maintains only recent conversation history while preventing database bloat.</li>
                                                </ul>

                                                This memory management approach balances the benefits of persistent conversation context with database efficiency, allowing users to continue discussions throughout their workday while automatically clearing older interactions.
                                            </Body>
                                        </div>

                                        <div style={{ marginTop: '1rem' }}>

                                            <Subtitle>Specialized Financial Tools</Subtitle>

                                            <Body>

                                                The Leafy Portfolio Assistant Agent leverages specialized tools to access and analyze financial data from various sources:

                                                <br></br>
                                                <strong>Portfolio-Specific:</strong>
                                                <ul>
                                                    <li><code>market_analysis_reports_vector_search_tool</code>: Retrieves relevant market insights specifically for assets in the current portfolio from the</li>
                                                    <li><code>market_news_reports_vector_search_tool</code>: Provides recent news summaries and sentiment analysis specifically for portfolio assets from the reports_market_news collection.</li>
                                                    <li><code>get_portfolio_allocation_tool</code>: Shows the precise distribution of investments across different assets, including ticker symbols, asset descriptions, and allocation percentages.</li>
                                                    <li><code>get_portfolio_ytd_return_tool</code>: Measures portfolio performance since the beginning of the current year from the portfolio_performance collection.</li>
                                                    <li><code>get_vix_closing_value_tool</code>: Provides insight into current market volatility levels, serving as a quick indicator of market sentiment and risk.</li>
                                                </ul>

                                                <strong>Cryptocurrency Portfolio-Specific Tools:</strong>
                                                <ul>
                                                    <li><code>crypto_analysis_reports_vector_search_tool</code>: Retrieves technical analysis and crypto market trends using embeddings from the <code>reports_crypto_analysis</code> collection.</li>
                                                    <li><code>crypto_news_reports_vector_search_tool</code>: Summarizes crypto-related news and sentiment from the <code>reports_crypto_news</code> collection.</li>
                                                    <li><code>crypto_social_media_reports_vector_search_tool</code>: Analyzes social media sentiment from platforms like Twitter and Reddit using the <code>reports_crypto_sm</code> collection.</li>
                                                    <li><code>get_portfolio_allocation_tool</code>: Shows allocation across cryptocurrencies and stablecoins from the <code>crypto_portfolio_allocation</code> collection.</li>
                                                    <li><code>get_portfolio_ytd_return_tool</code>: Calculates crypto portfolio performance since the beginning of the year.</li>
                                                </ul>

                                                <strong>General Financial Information::</strong>
                                                <ul>
                                                    <li><code>tavily_search_tool</code>: Supplements portfolio-specific tools with broader financial data and news via the Tavily API, particularly useful for questions about assets not in the portfolio or general market concepts.</li>
                                                </ul>
                                            </Body>
                                        </div>

                                        <Subtitle>MongoDB Stack</Subtitle>
                                        <Body>
                                            <ul>
                                                <li>Atlas Vector Search</li>
                                                <li>Aggregation Pipelines</li>
                                                <li>Atlas Charts</li>
                                                <li>Time Series collections</li>
                                                <li>AsyncMongoClient</li>
                                                <li>AsyncMongoDBSaver</li>
                                            </ul>
                                        </Body>
                                    </div>

                                </Tab>

                                <Tab name="Why MongoDB">

                                    <div className={styles.tab} >

                                        <Subtitle> Integration with Agentic AI</Subtitle>
                                        <Body>
                                            The integration of agentic AI with MongoDB enhances portfolio management by leveraging AI-driven insights to analyze and predict market trends, optimize asset allocations, and facilitate real-time data-driven investment decisions, all powered by efficient data storage and retrieval capabilities.
                                        </Body>
                                        <div style={{ marginTop: '1rem' }}>
                                            <Subtitle>Perfect for Agent Memory Management</Subtitle>
                                            <Body>
                                                MongoDB's document model is ideal for storing complex agent state through the MongoDB Checkpointer, providing seamless memory persistence across conversations. This enables the assistant to maintain context over time using collections like <code>checkpoints_aio</code> and <code>checkpoint_writes_aio</code>, delivering more personalized, contextually relevant responses to financial queries.
                                            </Body>
                                        </div>

                                        <div style={{ marginTop: '1rem' }}>
                                            <Subtitle>Vector Search</Subtitle>
                                            <Body>
                                                Atlas Vector Search empowers the chatbot to efficiently store and query high-dimensional embeddings, enabling it to deliver contextually accurate and relevant responses. Making AI-driven interactions within the Leafy Bank ecosystem both fast and reliable.
                                            </Body>
                                        </div>

                                        <div style={{ marginTop: '1rem' }}>
                                            <Subtitle>Flexibility</Subtitle>
                                            <Body>
                                                MongoDB's flexible document model unifies structured (macroeconomic indicators and market data) and unstructured data (financial news) into a single data platform that integrates with agentic AI not only to understand and respond to complex queries, but also generate valuable insights for enhanced portfolio management.
                                            </Body>
                                        </div>

                                        <div style={{ marginTop: '1rem' }}>
                                            <Subtitle>Time Series Collections</Subtitle>
                                            <Body>
                                                MongoDB allows the storage of time series collections, efficiently ingesting large volumes of data. This enables AI agents to process and analyze sequential interactions, learn patterns, and state changes over time.
                                            </Body>
                                        </div>

                                        <div style={{ marginTop: '1rem' }}>
                                            <Subtitle>Atlas Charts</Subtitle>
                                            <Body>
                                                MongoDB Atlas Charts provides an intuitive and dynamic way to visualize real-time application data, directly accessing collections to streamline analytic workflows. This feature enables users to effectively visualize metrics such as portfolio performance over the last month, asset distribution, and candlestick charts for each asset, allowing for a comprehensive interpretation of price movements.
                                            </Body>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </div>
                    </div>
                </div >
            )}
        </>
    );
};

export default ChatbotPortfolio;